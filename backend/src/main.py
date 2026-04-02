import json
import os
import logging
import asyncio
import uvicorn
from datetime import datetime

from config import ServiceConfig
from deye.deye import DeyeInverter
from deye.scanner import InverterScanner
from web_server import BackendState, app, manager
from mqtt_client import MqttClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(module)s:%(lineno)d] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("deye_main")

async def find_valid_inverters(config: ServiceConfig) -> list[DeyeInverter]:
        scanner = InverterScanner()
        found_inverters = scanner.get_inverters()
        valid_inverters = []
        log.info("Found inverters via scan: %s", [inv.serial for inv in found_inverters])

        for inv in found_inverters:
            inverter = DeyeInverter(
                serial=inv.serial, host=inv.ipaddress
            )
            if not inverter.test():
                log.warning("Inverter %s at %s failed test connection, skipping", inv.serial, inv.ipaddress)
                continue
            valid_inverters.append(inverter)
        return valid_inverters

async def get_inverter_stats(inverter: DeyeInverter, config: ServiceConfig):
    try:
        stats = await inverter.get_statistics_async()
        mapped_stats = []
        for entry in stats:
            mapped_stats_entry = {config.metrics_to_publish[k]: v for k, v in entry.items() if k in config.metrics_to_publish} 
            extra_calculated_metrics = {k: calc_func(entry) for k, calc_func in config.metrics_to_calculate.items()}
            mapped_stats_entry.update(extra_calculated_metrics)
            mapped_stats_entry['serial'] = str(inverter.serial)
            mapped_stats.append(mapped_stats_entry)

        #check for duplicate entries and remove them
        unique_stats = []
        for stat in mapped_stats:
            if stat not in unique_stats:
                unique_stats.append(stat)
        mapped_stats = unique_stats


        log.info("Polled inverter: %s, received %d metrics", inverter.serial, len(mapped_stats))
        return mapped_stats
    except Exception as e:
        log.exception("Error polling inverter: %s, error: %s", inverter.serial, e)
        return None
    
async def poll_inverters(inverters: list[DeyeInverter], config: ServiceConfig, mqtt_client: MqttClient):
    while True:
        for inverter in inverters:
            try:
                mapped_stats = await get_inverter_stats(inverter, config)
                log.info("Polled inverter: %s, received %d metrics", inverter.serial, len(mapped_stats))
                
                if mapped_stats:
                    payload = json.dumps(mapped_stats)
                    manager.cache_data(inverter.serial, mapped_stats)
                    await mqtt_client.publish(f"{config.topic_prefix}/{inverter.serial}", payload)
                    await manager.broadcast(payload)
                    
            except Exception as e:
                log.exception("Error polling inverter: %s, error: %s", inverter.serial, e)
        await asyncio.sleep(config.status_interval)

async def mqtt_listener(mqtt_client: MqttClient):
    while True:
        msg = await mqtt_client.get_message(timeout=1.0)
        if msg:
            topic, payload = msg
            try:
                data = json.loads(payload)
                serial = topic.split('/')[-1] if '/' in topic else 'unknown'
                
                if not hasattr(app.state, "backend_state"):
                    app.state.backend_state = BackendState()
                    app.state.backend_state.current_status = {}
                
                if isinstance(data, list) and len(data) > 0:
                    data[0]['serial'] = serial
                else:
                    data = {'serial': serial, 'value': data}
                
                app.state.backend_state.current_status[serial] = data
                
                log.info("MQTT received: %s", topic)
                
                if data:
                    manager.cache_data(serial, data)
                    await manager.broadcast(json.dumps(data))
                else:
                    log.warning("Received empty data for topic: %s", topic)
                    
            except json.JSONDecodeError as e:
                log.error("Failed to parse MQTT payload: %s", e)
            except Exception as e:
                log.exception("Error processing MQTT message: %s", e)

async def main():
    config = ServiceConfig()
    
    backend_state = BackendState()
    backend_state.current_status = {}
    backend_state.history = []
    app.state.backend_state = backend_state
    
    web_config = uvicorn.Config(app, host="0.0.0.0", port=8000)
    web_server = uvicorn.Server(web_config)
    
    mqtt_client = MqttClient(
        broker=config.mqtt_broker, 
        port=config.mqtt_port, 
        topic_prefix=config.topic_prefix
    )
    
    log.info("Subscribing to MQTT broker %s:%s, topic: %s/#", config.mqtt_broker, config.mqtt_port, config.topic_prefix)
    
    valid_inverters = []
    
    if config.inverter_ip and config.inverter_serial:
        log.info("Using configured inverter: IP=%s, Serial=%s", config.inverter_ip, config.inverter_serial)
        inverter = DeyeInverter(
            path=os.getcwd(), 
            serial=config.inverter_serial, 
            host=config.inverter_ip
        )
        if inverter.test():
            valid_inverters.append(inverter)
            log.info("Connected to inverter %s at %s", config.inverter_serial, config.inverter_ip)
        else:
            log.warning("Failed to connect to configured inverter at %s", config.inverter_ip)
    else:
        valid_inverters = await find_valid_inverters(config)

    # retry to find inverters for a few iterations if none are found, 
    #  to handle cases where inverters might not be immediately available on startup
    retry_attempts = 5
    while not valid_inverters and retry_attempts > 0:
        log.warning("No valid inverters found, retrying in 5 seconds... (%d attempts left)", retry_attempts)
        await asyncio.sleep(5)
        valid_inverters = await find_valid_inverters(config)
        retry_attempts -= 1


    if not valid_inverters:
        log.error("No valid inverters found after multiple attempts, exiting.")
        return
    
    log.info("Polling valid inverters: %s", [inv.serial for inv in valid_inverters])
    await asyncio.gather(
        web_server.serve(),
        poll_inverters(valid_inverters, config, mqtt_client),
        mqtt_listener(mqtt_client)
    )

if __name__ == "__main__":
    asyncio.run(main())
