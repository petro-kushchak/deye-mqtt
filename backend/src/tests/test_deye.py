import unittest
import sys
import os
import yaml
from unittest.mock import patch, MagicMock, mock_open

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class TestDeyeInverter(unittest.TestCase):
    
    def setUp(self):
        self.lookup_content = {
            'requests': [
                {'start': 0, 'end': 10, 'mb_functioncode': 3}
            ],
            'parameters': [
                {
                    'items': [
                        {'name': 'pv1_power', 'registers': [0], 'rule': 1, 'scale': 1}
                    ]
                }
            ]
        }

    @patch('deye.deye._load_parameter_definition')
    def test_initialization(self, mock_load):
        mock_load.return_value = {'requests': [], 'parameters': []}
        
        from deye.deye import DeyeInverter
        inverter = DeyeInverter(serial=12345, host='192.168.1.1')
        
        self.assertEqual(inverter.serial, 12345)
        self.assertEqual(inverter._host, '192.168.1.1')
        self.assertEqual(inverter._port, 8899)
        self.assertFalse(inverter.is_connected)
        self.assertIsNotNone(inverter.lock)

    @patch('deye.deye._load_parameter_definition')
    def test_initialization_custom_port(self, mock_load):
        mock_load.return_value = {'requests': [], 'parameters': []}
        
        from deye.deye import DeyeInverter
        inverter = DeyeInverter(serial=12345, host='192.168.1.1', port=8898)
        
        self.assertEqual(inverter._port, 8898)

    @patch('deye.deye._load_parameter_definition')
    def test_initialization_custom_lookup_file(self, mock_load):
        mock_load.return_value = {'requests': [], 'parameters': []}
        
        from deye.deye import DeyeInverter
        inverter = DeyeInverter(serial=12345, host='192.168.1.1', lookup_file='custom.yaml')
        
        self.assertEqual(inverter.lookup_file, 'custom.yaml')

    @patch('deye.deye._load_parameter_definition')
    @patch('deye.deye.PySolarmanV5')
    def test_connect(self, mock_pysolarman, mock_load):
        mock_load.return_value = {'requests': [], 'parameters': []}
        mock_modbus = MagicMock()
        mock_pysolarman.return_value = mock_modbus
        
        from deye.deye import DeyeInverter
        inverter = DeyeInverter(serial=12345, host='192.168.1.1')
        result = inverter.connect()
        
        mock_pysolarman.assert_called_once()
        self.assertTrue(inverter.is_connected)
        self.assertEqual(result, mock_modbus)

    @patch('deye.deye._load_parameter_definition')
    @patch('deye.deye.PySolarmanV5')
    def test_connect_already_connected(self, mock_pysolarman, mock_load):
        mock_load.return_value = {'requests': [], 'parameters': []}
        mock_modbus = MagicMock()
        mock_pysolarman.return_value = mock_modbus
        
        from deye.deye import DeyeInverter
        inverter = DeyeInverter(serial=12345, host='192.168.1.1')
        inverter.connect()
        inverter.connect()
        
        mock_pysolarman.assert_called_once()

    @patch('deye.deye._load_parameter_definition')
    @patch('deye.deye.PySolarmanV5')
    def test_disconnect(self, mock_pysolarman, mock_load):
        mock_load.return_value = {'requests': [], 'parameters': []}
        mock_modbus = MagicMock()
        mock_pysolarman.return_value = mock_modbus
        
        from deye.deye import DeyeInverter
        inverter = DeyeInverter(serial=12345, host='192.168.1.1')
        inverter.connect()
        inverter.disconnect()
        
        mock_modbus.disconnect.assert_called_once()
        self.assertFalse(inverter.is_connected)

    @patch('deye.deye._load_parameter_definition')
    @patch('deye.deye.PySolarmanV5')
    def test_disconnect_when_not_connected(self, mock_pysolarman, mock_load):
        mock_load.return_value = {'requests': [], 'parameters': []}
        
        from deye.deye import DeyeInverter
        inverter = DeyeInverter(serial=12345, host='192.168.1.1')
        inverter.disconnect()
        
        self.assertFalse(inverter.is_connected)

    @patch('deye.deye._load_parameter_definition')
    @patch('deye.deye.PySolarmanV5')
    def test_test_connection_success(self, mock_pysolarman, mock_load):
        mock_load.return_value = {'requests': [{'start': 0, 'end': 10, 'mb_functioncode': 3}], 'parameters': [{'items': []}]}
        mock_modbus = MagicMock()
        mock_pysolarman.return_value = mock_modbus
        mock_modbus.read_holding_registers.return_value = [0]
        
        from deye.deye import DeyeInverter
        inverter = DeyeInverter(serial=12345, host='192.168.1.1')
        result = inverter.test()
        
        self.assertTrue(result)

    @patch('deye.deye._load_parameter_definition')
    @patch('deye.deye.PySolarmanV5')
    def test_test_connection_failure(self, mock_pysolarman, mock_load):
        mock_load.return_value = {'requests': [{'start': 0, 'end': 10, 'mb_functioncode': 3}], 'parameters': [{'items': []}]}
        mock_modbus = MagicMock()
        mock_pysolarman.return_value = mock_modbus
        mock_modbus.read_holding_registers.side_effect = Exception("Connection failed")
        
        from deye.deye import DeyeInverter
        inverter = DeyeInverter(serial=12345, host='192.168.1.1')
        inverter.connect()
        result = inverter.test()
        
        self.assertFalse(result)

    @patch('deye.deye.ParameterParser')
    @patch('deye.deye._load_parameter_definition')
    @patch('deye.deye.PySolarmanV5')
    def test_get_statistics_success(self, mock_pysolarman, mock_load, mock_parser):
        mock_load.return_value = {'requests': [{'start': 0, 'end': 10, 'mb_functioncode': 3}], 'parameters': [{'items': []}]}
        mock_modbus = MagicMock()
        mock_pysolarman.return_value = mock_modbus
        mock_modbus.read_holding_registers.return_value = [1, 2, 3]
        
        mock_parser_instance = MagicMock()
        mock_parser_instance.get_result.return_value = {'pv1_power': 100}
        mock_parser.return_value = mock_parser_instance
        
        from deye.deye import DeyeInverter
        inverter = DeyeInverter(serial=12345, host='192.168.1.1')
        result = inverter.get_statistics()
        
        self.assertEqual(len(result), 1)

    @patch('deye.deye._load_parameter_definition')
    @patch('deye.deye.PySolarmanV5')
    def test_get_statistics_connection_error(self, mock_pysolarman, mock_load):
        mock_load.return_value = {'requests': [{'start': 0, 'end': 10, 'mb_functioncode': 3}], 'parameters': [{'items': []}]}
        mock_modbus = MagicMock()
        mock_pysolarman.return_value = mock_modbus
        mock_modbus.read_holding_registers.side_effect = Exception("Connection error")
        
        from deye.deye import DeyeInverter
        inverter = DeyeInverter(serial=12345, host='192.168.1.1')
        result = inverter.get_statistics()
        
        self.assertEqual(result, [])


class TestDeyeInverterConstants(unittest.TestCase):
    
    def test_default_port_constant(self):
        from deye import deye
        self.assertEqual(deye.DEFAULT_PORT_INVERTER, 8899)

    def test_default_lookup_file_constant(self):
        from deye import deye
        self.assertEqual(deye.DEFAULT_LOOKUP_FILE, 'deye_hybrid.yaml')


if __name__ == '__main__':
    unittest.main()
