import json
import logging
import asyncio
import signal
from datetime import datetime
from logging.config import dictConfig

from typing import Any

import uvicorn

from config import ServiceConfig
from deye.deye import DeyeInverter
from deye.scanner import InverterScanner
from web_server import app, manager, sanitize_topic_component, set_start_time
from mqtt_client import MqttClient
from models import InverterHealth, ApplicationContext, InverterMetrics

dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(levelname)s [%(name)s:%(lineno)d] %(message)s",
        },
    },
    "handlers": {
        "default": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        },
    },
    "root": {
        "level": "INFO",
        "handlers": ["default"],
    },
    "loggers": {
        "deye_main": {"level": "INFO"},
        "deye_web": {"level": "INFO"},
        "mqtt_client": {"level": "INFO"},
        "deye": {"level": "INFO"},
    },
})

log = logging.getLogger("deye_main")

STOP_EVENT: asyncio.Event | None = None
app_context: ApplicationContext = ApplicationContext()


async def find_valid_inverters(config: ServiceConfig) -> list[DeyeInverter]:
    scanner = InverterScanner()
    found_inverters = scanner.get_inverters()
    valid_inverters: list[DeyeInverter] = []
    log.info("Found inverters via scan: %s", [inv.serial for inv in found_inverters])

    for inv in found_inverters:
        inverter = DeyeInverter(
            serial=inv.serial, host=inv.ipaddress, lookup_file=config.inverter_definition
        )
        if not inverter.test():
            log.warning(
                "Inverter %s at %s failed test connection, skipping",
                inv.serial,
                inv.ipaddress,
            )
            continue
        valid_inverters.append(inverter)
    return valid_inverters


async def get_inverter_stats(
    inverter: DeyeInverter, config: ServiceConfig
) -> list[dict[str, Any]] | None:
    try:
        stats = await inverter.get_statistics_async()
        mapped_stats: list[dict[str, Any]] = []
        for entry in stats:
            mapped_stats_entry = {
                config.metrics_to_publish[k]: v
                for k, v in entry.items()
                if k in config.metrics_to_publish
            }
            extra_calculated_metrics = {
                k: calc_func(entry)
                for k, calc_func in config.metrics_to_calculate.items()
            }
            mapped_stats_entry.update(extra_calculated_metrics)
            mapped_stats_entry["serial"] = str(inverter.serial)
            mapped_stats.append(mapped_stats_entry)

        unique_stats = {json.dumps(s, sort_keys=True): s for s in mapped_stats}
        mapped_stats = list(unique_stats.values())

        health = app_context.health_tracker.get(str(inverter.serial))
        if health:
            health.record_success()

        log.info(
            "Polled inverter: %s, received %d metrics",
            inverter.serial,
            len(mapped_stats),
        )
        return mapped_stats
    except Exception as e:
        log.exception("Error polling inverter: %s, error: %s", inverter.serial, e)
        health = app_context.health_tracker.get(str(inverter.serial))
        if health:
            health.record_failure()
        return None


async def poll_inverters(
    inverters: list[DeyeInverter],
    config: ServiceConfig,
    mqtt_client: MqttClient,
) -> None:
    while STOP_EVENT and not STOP_EVENT.is_set():
        for inverter in inverters:
            try:
                mapped_stats = await get_inverter_stats(inverter, config)
                if mapped_stats:
                    topic = f"{config.topic_prefix}/{sanitize_topic_component(str(inverter.serial))}"
                    payload = json.dumps(mapped_stats)
                    manager.cache_data(str(inverter.serial), mapped_stats)
                    await mqtt_client.publish(topic, payload)
                    await manager.broadcast(payload)
            except Exception as e:
                log.exception("Error polling inverter: %s", inverter.serial)
        await asyncio.sleep(config.status_interval)


async def mqtt_listener(mqtt_client: MqttClient) -> None:
    while STOP_EVENT and not STOP_EVENT.is_set():
        msg = await mqtt_client.get_message(timeout=1.0)
        if msg:
            topic, payload = msg
            try:
                data = json.loads(payload)
                serial = topic.split("/")[-1] if "/" in topic else "unknown"

                if not hasattr(app.state, "backend_state"):
                    from web_server import BackendState
                    app.state.backend_state = BackendState()
                    app.state.backend_state.current_status = {}

                if isinstance(data, list) and len(data) > 0:
                    data[0]["serial"] = serial  # type: ignore[index]
                    app.state.backend_state.current_status[serial] = data  # type: ignore[assignment]
                else:
                    data = {"serial": serial, "value": data}
                    app.state.backend_state.current_status[serial] = data  # type: ignore[assignment]

                log.info("MQTT received: %s", topic)

                if data:
                    manager.cache_data(serial, data)  # type: ignore[arg-type]
                    await manager.broadcast(json.dumps(data))
                else:
                    log.warning("Received empty data for topic: %s", topic)

            except json.JSONDecodeError as e:
                log.error("Failed to parse MQTT payload: %s", e)
            except Exception as e:
                log.exception("Error processing MQTT message: %s", e)


async def start_background_tasks(app: Any = None) -> None:
    global STOP_EVENT, app_context
    STOP_EVENT = asyncio.Event()

    set_start_time()

    config = ServiceConfig()
    app_context.config = config

    from web_server import BackendState
    backend_state = BackendState()
    backend_state.current_status = {}
    backend_state.history = []
    if app:
        app.state.backend_state = backend_state
        app.state.mqtt_connected = False

    mqtt_client = MqttClient(
        broker=config.mqtt_broker,
        port=config.mqtt_port,
        topic_prefix=config.topic_prefix,
    )

    app.state.mqtt_connected = mqtt_client.is_connected

    log.info(
        "Subscribing to MQTT broker %s:%s, topic: %s/#",
        config.mqtt_broker,
        config.mqtt_port,
        config.topic_prefix,
    )

    valid_inverters: list[DeyeInverter] = []

    if config.inverter_ip and config.inverter_serial:
        log.info(
            "Using configured inverter: IP=%s, Serial=%s",
            config.inverter_ip,
            config.inverter_serial,
        )
        inverter = DeyeInverter(
            serial=config.inverter_serial,
            host=config.inverter_ip,
            lookup_file=config.inverter_definition
        )
        if inverter.test():
            valid_inverters.append(inverter)
            app_context.health_tracker[str(config.inverter_serial)] = InverterHealth(
                serial=str(config.inverter_serial),
                host=config.inverter_ip,
                is_connected=True,
            )
            log.info(
                "Connected to inverter %s at %s",
                config.inverter_serial,
                config.inverter_ip,
            )
        else:
            log.warning("Failed to connect to configured inverter at %s", config.inverter_ip)
    else:
        valid_inverters = await find_valid_inverters(config)
        for inv in valid_inverters:
            app_context.health_tracker[str(inv.serial)] = InverterHealth(
                serial=str(inv.serial),
                host=inv._host,
                is_connected=True,
            )

    retry_attempts = 5
    while not valid_inverters and retry_attempts > 0:
        log.warning(
            "No valid inverters found, retrying in 5 seconds... (%d attempts left)",
            retry_attempts,
        )
        await asyncio.sleep(5)
        valid_inverters = await find_valid_inverters(config)
        retry_attempts -= 1

    if not valid_inverters:
        log.warning("No valid inverters found after retries, continuing without inverter polling")

    log.info("Polling valid inverters: %s", [inv.serial for inv in valid_inverters])
    app_context.inverters = valid_inverters
    if app:
        if not hasattr(app.state, "backend_state"):
            from web_server import BackendState
            app.state.backend_state = BackendState()
        app.state.backend_state.health_tracker = app_context.health_tracker

    async def periodic_mqtt_update():
        while STOP_EVENT and not STOP_EVENT.is_set():
            if app and hasattr(app.state, "mqtt_connected"):
                app.state.mqtt_connected = mqtt_client.is_connected
            await asyncio.sleep(5)

    asyncio.create_task(poll_inverters(valid_inverters, config, mqtt_client))
    asyncio.create_task(mqtt_listener(mqtt_client))
    asyncio.create_task(periodic_mqtt_update())
    log.info("Background tasks started")


async def stop_background_tasks() -> None:
    global STOP_EVENT
    if STOP_EVENT:
        STOP_EVENT.clear()
    log.info("Background tasks stopped")


async def main() -> None:
    from web_server import app as web_app
    import uvicorn

    await start_background_tasks(web_app)

    config = uvicorn.Config(
        web_app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
    )
    server = uvicorn.Server(config)
    
    def shutdown_handler() -> None:
        log.info("Shutting down...")
        asyncio.create_task(stop_background_tasks())
    
    try:
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, shutdown_handler)
    except RuntimeError:
        pass
    
    await server.serve()


if __name__ == "__main__":
    asyncio.run(main())
