import unittest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from deye.scanner import InverterInfo, InverterScanner


class TestInverterInfo(unittest.TestCase):
    
    def test_initialization(self):
        inverter = InverterInfo('192.168.1.100', 'AA:BB:CC:DD:EE:FF', 12345)
        self.assertEqual(inverter.ipaddress, '192.168.1.100')
        self.assertEqual(inverter.mac, 'AA:BB:CC:DD:EE:FF')
        self.assertEqual(inverter.serial, 12345)

    def test_attributes_are_accessible(self):
        inverter = InverterInfo('10.0.0.1', '00:11:22:33:44:55', 99999)
        self.assertEqual(inverter.ipaddress, '10.0.0.1')
        self.assertEqual(inverter.mac, '00:11:22:33:44:55')
        self.assertEqual(inverter.serial, 99999)


class TestInverterScanner(unittest.TestCase):
    
    def setUp(self):
        InverterScanner._inverters = []
        self.addCleanup(self.cleanup)
    
    def cleanup(self):
        InverterScanner._inverters = []

    def test_initialization(self):
        scanner = InverterScanner()
        self.assertEqual(scanner._inverters, [])

    def test_get_inverters_returns_cached(self):
        scanner = InverterScanner()
        test_inverter = InverterInfo('192.168.1.1', 'AA:BB:CC:DD:EE:FF', 12345)
        scanner._inverters = [test_inverter]
        
        result = scanner.get_inverters()
        
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].ipaddress, '192.168.1.1')

    @unittest.skip("Triggers real network discovery")
    def test_get_inverters_triggers_discovery_when_empty(self):
        InverterScanner._inverters = []
        scanner = InverterScanner()
        
        result = scanner.get_inverters()
        
        self.assertEqual(result, [])

    def test_class_variable_shared(self):
        scanner1 = InverterScanner()
        scanner2 = InverterScanner()
        
        inverter = InverterInfo('192.168.1.1', 'AA:BB:CC:DD:EE:FF', 12345)
        scanner1._inverters.append(inverter)
        
        self.assertEqual(len(scanner2._inverters), 0)
        self.assertEqual(len(scanner1._inverters), 1)


if __name__ == '__main__':
    unittest.main()
