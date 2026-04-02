import os
import logging
from typing import Any
import queue
import threading

import paho.mqtt.client as mqtt
import asyncio

log = logging.getLogger("mqtt_client")

class MqttClient:
    def __init__(self, broker: str | None = None, port: int | None = None, topic_prefix: str | None = None):
        self.broker = broker
        self.port = port or 1883
        self.topic_prefix = topic_prefix
        self.message_queue: queue.Queue = queue.Queue()
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect
        
        self.client.connect(self.broker, self.port, keepalive=60)
        self.client.loop_start()
        log.info("Connected to MQTT broker %s:%s", self.broker, self.port)

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            topic = f"{self.topic_prefix}/#"
            client.subscribe(topic, qos=1)
            log.info("Subscribed to topic: %s", topic)
        else:
            log.error("Failed to connect to MQTT broker, return code: %s", rc)

    def _on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode('utf-8')
            self.message_queue.put((msg.topic, payload))
        except Exception as e:
            log.error("Error processing MQTT message: %s", e)

    def _on_disconnect(self, client, userdata, rc, properties=None):
        log.warning("Disconnected from MQTT broker, return code: %s", rc)

    async def get_message(self, timeout: float = 1.0):
        try:
            return await asyncio.wait_for(
                asyncio.to_thread(self.message_queue.get, True, timeout),
                timeout
            )
        except (asyncio.TimeoutError, queue.Empty):
            return None

    def _publish_sync(self, topic: str, payload: Any) -> None:
        self.client.publish(topic, payload, qos=1)

    async def publish(self, topic: str, payload: Any) -> None:
        await asyncio.to_thread(self._publish_sync, topic, payload)

    def stop(self) -> None:
        self.client.loop_stop()
        self.client.disconnect()
