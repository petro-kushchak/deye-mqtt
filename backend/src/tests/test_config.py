import unittest
import sys
import os
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from config import ServiceConfig


class TestServiceConfig(unittest.TestCase):
    
    def setUp(self):
        self.env_patcher = patch.dict(os.environ, {}, clear=True)
        self.env_patcher.start()
    
    def tearDown(self):
        self.env_patcher.stop()
    
    def test_default_status_interval(self):
        config = ServiceConfig()
        self.assertEqual(config.status_interval, 30)
    
    def test_default_mqtt_broker(self):
        config = ServiceConfig()
        self.assertEqual(config.mqtt_broker, "192.168.201.2")
    
    def test_default_mqtt_port(self):
        config = ServiceConfig()
        self.assertEqual(config.mqtt_port, 1883)
    
    def test_default_topic_prefix(self):
        config = ServiceConfig()
        self.assertEqual(config.topic_prefix, "deye")
    
    def test_custom_status_interval(self):
        with patch.dict(os.environ, {'STATUS_READ_INTERVAL_SEC': '60'}):
            config = ServiceConfig()
            self.assertEqual(config.status_interval, 60)
    
    def test_custom_mqtt_broker(self):
        with patch.dict(os.environ, {'MQTT_BROKER': 'custom.broker.local'}):
            config = ServiceConfig()
            self.assertEqual(config.mqtt_broker, "custom.broker.local")
    
    def test_custom_mqtt_port(self):
        with patch.dict(os.environ, {'MQTT_BROKER_PORT': '8883'}):
            config = ServiceConfig()
            self.assertEqual(config.mqtt_port, 8883)
    
    def test_custom_topic_prefix(self):
        with patch.dict(os.environ, {'MQTT_TOPIC_PREFIX': 'inverter'}):
            config = ServiceConfig()
            self.assertEqual(config.topic_prefix, "inverter")
    
    def test_metrics_to_publish_keys(self):
        config = ServiceConfig()
        expected_keys = [
            "PV1 Power",
            "PV2 Power",
            "Battery Status",
            "Battery Power",
            "Battery SOC",
            "Battery Current",
            "Grid Power",
            "Total Load Power",
            "Running Status",
            "Work Mode",
            "Grid-connected Status",
            "Battery Voltage",
            "Battery Temperature",
            "DC Temperature",
            "AC Temperature",
            "Grid Frequency",
            "Daily Production",
            "Total Production",
            "Daily Load Consumption",
            "Daily Battery Charge"
        ]
        for key in expected_keys:
            self.assertIn(key, config.metrics_to_publish)
    
    def test_metrics_to_publish_values(self):
        config = ServiceConfig()
        expected_values = [
            'pv1_power',
            'pv2_power',
            'battery_status',
            'battery_power',
            'battery_soc',
            'battery_current',
            'grid_power',
            'total_load_power',
            'running_status',
            'work_mode',
            'grid_connected_status',
            'battery_voltage',
            'battery_temperature',
            'dc_temperature',
            'ac_temperature',
            'grid_frequency',
            'daily_production',
            'total_production',
            'daily_load_consumption',
            'daily_battery_charge'
        ]
        for value in expected_values:
            self.assertIn(value, config.metrics_to_publish.values())
    
    def test_metrics_to_calculate_pv_power(self):
        config = ServiceConfig()
        self.assertIn("pv_power", config.metrics_to_calculate)
    
    def test_metrics_to_calculate_pv_excess_power(self):
        config = ServiceConfig()
        self.assertIn("pv_excess_power", config.metrics_to_calculate)
    
    def test_pv_power_calculation(self):
        config = ServiceConfig()
        stats = {
            "PV1 Power": 1000,
            "PV2 Power": 500,
            "Total Load Power": 800,
            "Battery Power": -200
        }
        result = config.metrics_to_calculate["pv_power"](stats)
        self.assertEqual(result, 1500)
    
    def test_pv_excess_power_calculation_positive(self):
        config = ServiceConfig()
        stats = {
            "PV1 Power": 1000,
            "PV2 Power": 500,
            "Total Load Power": 800,
            "Battery Power": -200
        }
        result = config.metrics_to_calculate["pv_excess_power"](stats)
        self.assertEqual(result, 500)
    
    def test_pv_excess_power_calculation_zero_when_discharging(self):
        config = ServiceConfig()
        stats = {
            "PV1 Power": 500,
            "PV2 Power": 300,
            "Total Load Power": 1000,
            "Battery Power": -200
        }
        result = config.metrics_to_calculate["pv_excess_power"](stats)
        self.assertEqual(result, 0)
    
    def test_pv_power_with_missing_pv2(self):
        config = ServiceConfig()
        stats = {
            "PV1 Power": 1000,
            "Total Load Power": 500,
            "Battery Power": 100
        }
        result = config.metrics_to_calculate["pv_power"](stats)
        self.assertEqual(result, 1000)
    
    def test_invalid_status_interval_returns_default(self):
        with patch.dict(os.environ, {'STATUS_READ_INTERVAL_SEC': 'invalid'}):
            with self.assertRaises(ValueError):
                ServiceConfig()
    
    def test_invalid_port_returns_default(self):
        with patch.dict(os.environ, {'MQTT_BROKER_PORT': 'invalid'}):
            with self.assertRaises(ValueError):
                ServiceConfig()


if __name__ == '__main__':
    unittest.main()
