import unittest
import sys
import os
import asyncio
from unittest.mock import patch, MagicMock, call

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class TestMqttClient(unittest.TestCase):
    
    @patch('mqtt_client.mqtt.Client')
    def test_initialization_defaults(self, mock_client_class):
        mock_client_instance = MagicMock()
        mock_client_class.return_value = mock_client_instance
        
        from mqtt_client import MqttClient
        client = MqttClient()
        
        mock_client_class.assert_called_once()
        mock_client_instance.connect.assert_called_once_with(None, 1883, keepalive=60)
        mock_client_instance.loop_start.assert_called_once()
    
    @patch('mqtt_client.mqtt.Client')
    def test_initialization_custom_broker(self, mock_client_class):
        mock_client_instance = MagicMock()
        mock_client_class.return_value = mock_client_instance
        
        from mqtt_client import MqttClient
        client = MqttClient(broker='test.broker.local')
        
        mock_client_instance.connect.assert_called_once_with('test.broker.local', 1883, keepalive=60)
    
    @patch('mqtt_client.mqtt.Client')
    def test_initialization_custom_port(self, mock_client_class):
        mock_client_instance = MagicMock()
        mock_client_class.return_value = mock_client_instance
        
        from mqtt_client import MqttClient
        client = MqttClient(broker='test.broker.local', port=8883)
        
        mock_client_instance.connect.assert_called_once_with('test.broker.local', 8883, keepalive=60)
    
    @patch('mqtt_client.mqtt.Client')
    def test_initialization_custom_topic_prefix(self, mock_client_class):
        mock_client_instance = MagicMock()
        mock_client_class.return_value = mock_client_instance
        
        from mqtt_client import MqttClient
        client = MqttClient(broker='test.broker.local', topic_prefix='solar')
        
        self.assertEqual(client.topic_prefix, 'solar')
    
    @patch('mqtt_client.mqtt.Client')
    def test_publish_sync(self, mock_client_class):
        mock_client_instance = MagicMock()
        mock_client_class.return_value = mock_client_instance
        
        from mqtt_client import MqttClient
        client = MqttClient(broker='test.broker.local')
        
        client._publish_sync('test/topic', 'payload')
        
        mock_client_instance.publish.assert_called_once_with('test/topic', 'payload', qos=1)
    
    @patch('mqtt_client.asyncio.get_running_loop')
    @patch('mqtt_client.mqtt.Client')
    def test_publish_uses_executor(self, mock_client_class, mock_get_loop):
        mock_client_instance = MagicMock()
        mock_client_class.return_value = mock_client_instance
        
        async def mock_run_in_executor(*args, **kwargs):
            return None
        
        mock_loop = MagicMock()
        mock_loop.run_in_executor = mock_run_in_executor
        mock_get_loop.return_value = mock_loop
        
        from mqtt_client import MqttClient
        client = MqttClient(broker='test.broker.local')
        
        async def run_test():
            await client.publish('topic', 'payload')
        
        asyncio.run(run_test())
    
    @patch('mqtt_client.mqtt.Client')
    def test_stop(self, mock_client_class):
        mock_client_instance = MagicMock()
        mock_client_class.return_value = mock_client_instance
        
        from mqtt_client import MqttClient
        client = MqttClient(broker='test.broker.local')
        
        client.stop()
        
        mock_client_instance.loop_stop.assert_called_once()
        mock_client_instance.disconnect.assert_called_once()
    
    @patch('mqtt_client.mqtt.Client')
    def test_attributes_set_correctly(self, mock_client_class):
        mock_client_instance = MagicMock()
        mock_client_class.return_value = mock_client_instance
        
        from mqtt_client import MqttClient
        client = MqttClient(broker='my.broker', port=1884, topic_prefix='prefix')
        
        self.assertEqual(client.broker, 'my.broker')
        self.assertEqual(client.port, 1884)
        self.assertEqual(client.topic_prefix, 'prefix')
        self.assertEqual(client.client, mock_client_instance)


if __name__ == '__main__':
    unittest.main()
