import unittest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from deye.parser import ParameterParser


class TestParameterParser(unittest.TestCase):
    
    def test_initialization(self):
        lookup = {'parameters': [{'items': []}]}
        parser = ParameterParser(lookup)
        self.assertEqual(parser.result, {})
        self.assertEqual(parser._lookups, lookup)

    def test_parse_unsigned_basic(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_unsigned',
                    'registers': [0],
                    'rule': 1,
                    'scale': 1
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [42]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertEqual(result['test_unsigned'], 42)

    def test_parse_signed_positive(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_signed',
                    'registers': [0],
                    'rule': 2,
                    'scale': 1
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [100]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertEqual(result['test_signed'], 100)

    def test_parse_signed_negative(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_signed_neg',
                    'registers': [0],
                    'rule': 2,
                    'scale': 1
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [0xFFF6]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertIn('test_signed_neg', result)

    def test_parse_ascii(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_ascii',
                    'registers': [0, 1],
                    'rule': 5
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [0x4865, 0x6C6C]
        parser.parse(raw_data, 0, 2)
        result = parser.get_result()
        self.assertEqual(result['test_ascii'], 'Hell')

    def test_parse_bits(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_bits',
                    'registers': [0],
                    'rule': 6
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [0xABCD]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertEqual(result['test_bits'], ['0xabcd'])

    def test_parse_raw(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_raw',
                    'registers': [0],
                    'rule': 10
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [0x1234]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertEqual(result['test_raw'], [0x1234])

    def test_parse_version(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_version',
                    'registers': [0],
                    'rule': 7
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [0x1234]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertEqual(result['test_version'], '1.2.3.4')

    def test_parse_time(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_time',
                    'registers': [0],
                    'rule': 9
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [0x092A]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertIn('test_time', result)

    def test_parse_with_offset(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_with_offset',
                    'registers': [0],
                    'rule': 1,
                    'offset': 100
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [150]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertEqual(result['test_with_offset'], 50)

    def test_parse_with_scale_division(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_with_scale_division',
                    'registers': [0],
                    'rule': 1,
                    'scale_division': 10
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [500]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertEqual(result['test_with_scale_division'], 50)

    def test_parse_with_lookup(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_with_lookup',
                    'registers': [0],
                    'rule': 1,
                    'lookup': [
                        {'key': 0, 'value': 'off'},
                        {'key': 1, 'value': 'on'}
                    ]
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [1]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertEqual(result['test_with_lookup'], 'on')

    def test_parse_with_lookup_not_found(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_with_lookup',
                    'registers': [0],
                    'rule': 1,
                    'lookup': [
                        {'key': 0, 'value': 'off'},
                        {'key': 1, 'value': 'on'}
                    ]
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [5]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertEqual(result['test_with_lookup'], 5)

    def test_parse_with_mask(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_with_mask',
                    'registers': [0],
                    'rule': 1,
                    'mask': 0xFF
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [0xABCD]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertEqual(result['test_with_mask'], 0xCD)

    def test_validation_min_valid(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_validation_min',
                    'registers': [0],
                    'rule': 1,
                    'validation': {'min': 0}
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [50]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertEqual(result['test_validation_min'], 50)

    def test_validation_max_valid(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_validation_max',
                    'registers': [0],
                    'rule': 1,
                    'validation': {'max': 100}
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [75]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertEqual(result['test_validation_max'], 75)

    def test_validation_min_invalid(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_validation_min',
                    'registers': [0],
                    'rule': 1,
                    'validation': {'min': 10}
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [5]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertNotIn('test_validation_min', result)

    def test_validation_max_invalid(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_validation_max',
                    'registers': [0],
                    'rule': 1,
                    'validation': {'max': 50}
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [100]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertNotIn('test_validation_max', result)

    def test_validation_invalidate_all(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_invalidate',
                    'registers': [0],
                    'rule': 1,
                    'validation': {'min': 10, 'invalidate_all': True}
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [5]
        with self.assertRaises(ValueError):
            parser.parse(raw_data, 0, 1)

    def test_do_validate_no_rules(self):
        parser = ParameterParser({'parameters': []})
        result = parser.do_validate('test', 50, {})
        self.assertTrue(result)

    def test_do_validate_with_min(self):
        parser = ParameterParser({'parameters': []})
        result = parser.do_validate('test', 50, {'min': 10})
        self.assertTrue(result)
        result = parser.do_validate('test', 5, {'min': 10})
        self.assertFalse(result)

    def test_do_validate_with_max(self):
        parser = ParameterParser({'parameters': []})
        result = parser.do_validate('test', 50, {'max': 100})
        self.assertTrue(result)
        result = parser.do_validate('test', 150, {'max': 100})
        self.assertFalse(result)

    def test_lookup_value_found(self):
        parser = ParameterParser({'parameters': []})
        options = [{'key': 1, 'value': 'on'}, {'key': 0, 'value': 'off'}]
        result = parser.lookup_value(1, options)
        self.assertEqual(result, 'on')

    def test_lookup_value_not_found(self):
        parser = ParameterParser({'parameters': []})
        options = [{'key': 1, 'value': 'on'}, {'key': 0, 'value': 'off'}]
        result = parser.lookup_value(5, options)
        self.assertEqual(result, 5)

    def test_is_integer_num_with_int(self):
        parser = ParameterParser({'parameters': []})
        self.assertTrue(parser.is_integer_num(42))
        self.assertTrue(parser.is_integer_num(42.0))

    def test_is_integer_num_with_float(self):
        parser = ParameterParser({'parameters': []})
        self.assertFalse(parser.is_integer_num(42.5))

    def test_is_integer_num_with_non_number(self):
        parser = ParameterParser({'parameters': []})
        self.assertFalse(parser.is_integer_num('42'))

    def test_get_sensors(self):
        lookup = {
            'parameters': [
                {'items': [{'name': 'a'}, {'name': 'b'}]},
                {'items': [{'name': 'c'}]}
            ]
        }
        parser = ParameterParser(lookup)
        sensors = parser.get_sensors()
        self.assertEqual(len(sensors), 3)

    def test_parse_out_of_range_register(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'out_of_range',
                    'registers': [100],
                    'rule': 1,
                    'scale': 1
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [42]
        parser.parse(raw_data, 0, 10)
        result = parser.get_result()
        self.assertNotIn('out_of_range', result)

    def test_parse_multiple_registers(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'multi_reg',
                    'registers': [0, 1],
                    'rule': 1,
                    'scale': 1
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [0x12, 0x34]
        parser.parse(raw_data, 0, 2)
        result = parser.get_result()
        self.assertIn('multi_reg', result)

    def test_rule_1_unsigned(self):
        lookup = {
            'parameters': [{'items': [{'name': 'r1', 'registers': [0], 'rule': 1}]}]
        }
        parser = ParameterParser(lookup)
        parser.parse([100], 0, 1)
        self.assertEqual(parser.result['r1'], 100)

    def test_rule_2_signed(self):
        lookup = {
            'parameters': [{'items': [{'name': 'r2', 'registers': [0], 'rule': 2}]}]
        }
        parser = ParameterParser(lookup)
        parser.parse([100], 0, 1)
        self.assertEqual(parser.result['r2'], 100)

    def test_rule_3_unsigned(self):
        lookup = {
            'parameters': [{'items': [{'name': 'r3', 'registers': [0], 'rule': 3}]}]
        }
        parser = ParameterParser(lookup)
        parser.parse([100], 0, 1)
        self.assertEqual(parser.result['r3'], 100)

    def test_rule_4_signed(self):
        lookup = {
            'parameters': [{'items': [{'name': 'r4', 'registers': [0], 'rule': 4}]}]
        }
        parser = ParameterParser(lookup)
        parser.parse([100], 0, 1)
        self.assertEqual(parser.result['r4'], 100)

    def test_parse_datetime(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_datetime',
                    'registers': [0, 1, 2, 3],
                    'rule': 8
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [0x0724, 0x1012, 0x2B05, 0x352A]
        parser.parse(raw_data, 0, 4)
        result = parser.get_result()
        self.assertIn('test_datetime', result)

    def test_parse_datetime_out_of_range(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_datetime',
                    'registers': [0, 1, 2, 3],
                    'rule': 8
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [0x0724]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertNotIn('test_datetime', result)

    def test_parse_time_formatted(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_time',
                    'registers': [0],
                    'rule': 9
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [0x092A]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertIn('test_time', result)

    def test_parse_time_midnight(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_time',
                    'registers': [0],
                    'rule': 9
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [0x0000]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertEqual(result['test_time'], '00:00')

    def test_parse_time_out_of_range(self):
        lookup = {
            'parameters': [{
                'items': [{
                    'name': 'test_time',
                    'registers': [100],
                    'rule': 9
                }]
            }]
        }
        parser = ParameterParser(lookup)
        raw_data = [0x092A]
        parser.parse(raw_data, 0, 1)
        result = parser.get_result()
        self.assertNotIn('test_time', result)


if __name__ == '__main__':
    unittest.main()
