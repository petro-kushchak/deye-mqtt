import unittest
import sys
import os
import json
import tempfile
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class TestBackendState(unittest.TestCase):
    
    def test_initialization(self):
        from web_server import BackendState
        state = BackendState()
        
        self.assertEqual(state.current_status, {})
        self.assertEqual(state.history, [])
        
    def test_current_status_dict_int_key(self):
        from web_server import BackendState
        state = BackendState()
        
        state.current_status[12345] = [{'name': 'pv1_power', 'value': 100}]
        
        self.assertIn(12345, state.current_status)
        self.assertEqual(len(state.current_status[12345]), 1)


class TestHistoryRetention(unittest.TestCase):
    
    def test_history_retention_value(self):
        from web_server import HISTORY_RETENTION
        self.assertEqual(HISTORY_RETENTION, timedelta(hours=24))


class TestHistoryStore(unittest.TestCase):

    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.json')
        self.tmp.close()

    def tearDown(self):
        if os.path.exists(self.tmp.name):
            os.unlink(self.tmp.name)

    def _make_store(self):
        from web_server import HistoryStore
        return HistoryStore(file_path=self.tmp.name)

    def test_empty_on_init(self):
        store = self._make_store()
        self.assertEqual(len(store._entries), 0)

    def test_add_creates_entry(self):
        store = self._make_store()
        store.add("SERIAL1", {"pv_power": 5000, "battery_power": -1000, "total_load_power": 3500, "grid_power": -200, "battery_soc": 75})

        self.assertEqual(len(store._entries), 1)
        e = store._entries[0]
        self.assertEqual(e["serial"], "SERIAL1")
        self.assertEqual(e["pv_power"], 5000)
        self.assertEqual(e["battery_power"], -1000)
        self.assertEqual(e["total_load_power"], 3500)
        self.assertEqual(e["grid_power"], -200)
        self.assertEqual(e["battery_soc"], 75)

    def test_add_updates_same_minute(self):
        store = self._make_store()
        store.add("SERIAL1", {"pv_power": 5000, "battery_power": -1000, "total_load_power": 3500, "grid_power": -200, "battery_soc": 75})
        store.add("SERIAL1", {"pv_power": 5100, "battery_power": -1100, "total_load_power": 3600, "grid_power": -300, "battery_soc": 76})

        self.assertEqual(len(store._entries), 1)
        e = store._entries[0]
        self.assertEqual(e["pv_power"], 5100)
        self.assertEqual(e["battery_soc"], 76)

    def test_add_different_minute_creates_new(self):
        store = self._make_store()
        store.add("SERIAL1", {"pv_power": 5000, "battery_power": 0, "total_load_power": 3000, "grid_power": 0, "battery_soc": 50})

        old_ts = datetime.now() - timedelta(minutes=5)
        store._entries[0]["timestamp"] = old_ts

        store.add("SERIAL1", {"pv_power": 6000, "battery_power": 0, "total_load_power": 4000, "grid_power": 0, "battery_soc": 55})

        self.assertEqual(len(store._entries), 2)

    def test_add_multiple_serials(self):
        store = self._make_store()
        store.add("SERIAL1", {"pv_power": 5000, "battery_power": 0, "total_load_power": 3000, "grid_power": 0, "battery_soc": 50})
        store.add("SERIAL2", {"pv_power": 0, "battery_power": 500, "total_load_power": 1500, "grid_power": 1000, "battery_soc": 80})

        self.assertEqual(len(store._entries), 2)

    def test_add_without_battery_soc_defaults_zero(self):
        store = self._make_store()
        store.add("SERIAL1", {"pv_power": 5000, "battery_power": 0, "total_load_power": 3000, "grid_power": 0})

        self.assertEqual(store._entries[0]["battery_soc"], 0)

    def test_battery_soc_preserved_on_in_minute_update(self):
        store = self._make_store()
        store.add("SERIAL1", {"pv_power": 5000, "battery_power": -1000, "total_load_power": 3500, "grid_power": -200, "battery_soc": 75})

        store.add("SERIAL1", {"pv_power": 5100, "battery_power": -1100, "total_load_power": 3600, "grid_power": -300})

        self.assertEqual(store._entries[0]["battery_soc"], 75)

    def test_get_filtered_returns_all_within_window(self):
        store = self._make_store()
        store.add("SERIAL1", {"pv_power": 5000, "battery_power": 0, "total_load_power": 3000, "grid_power": 0, "battery_soc": 50})

        result = store.get_filtered(hours=24)
        self.assertEqual(len(result), 1)

    def test_get_filtered_returns_last_entry_when_hours_zero(self):
        store = self._make_store()
        store.add("SERIAL1", {"pv_power": 5000, "battery_power": 0, "total_load_power": 3000, "grid_power": 0, "battery_soc": 50})

        result = store.get_filtered(hours=0)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["s"], "SERIAL1")
        self.assertEqual(result[0]["p"], 5000)

    def test_get_filtered_by_serial(self):
        store = self._make_store()
        store.add("SERIAL1", {"pv_power": 5000, "battery_power": 0, "total_load_power": 3000, "grid_power": 0, "battery_soc": 50})
        store.add("SERIAL2", {"pv_power": 0, "battery_power": 500, "total_load_power": 1500, "grid_power": 1000, "battery_soc": 80})

        result = store.get_filtered(hours=24, serial="SERIAL1")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["s"], "SERIAL1")

    def test_get_filtered_output_keys(self):
        store = self._make_store()
        store.add("SERIAL1", {"pv_power": 5000, "battery_power": -1000, "total_load_power": 3500, "grid_power": -200, "battery_soc": 75})

        result = store.get_filtered(hours=24)
        self.assertEqual(len(result), 1)
        entry = result[0]
        self.assertIn("t", entry)
        self.assertIn("s", entry)
        self.assertIn("p", entry)
        self.assertIn("b", entry)
        self.assertIn("l", entry)
        self.assertIn("g", entry)
        self.assertIn("c", entry)
        self.assertEqual(entry["s"], "SERIAL1")
        self.assertEqual(entry["p"], 5000)
        self.assertEqual(entry["b"], -1000)
        self.assertEqual(entry["l"], 3500)
        self.assertEqual(entry["g"], -200)
        self.assertEqual(entry["c"], 75)

    def test_retention_cleans_old_entries(self):
        store = self._make_store()
        old = (datetime.now() - timedelta(hours=48)).isoformat()
        store._entries = [
            {"serial": "SERIAL1", "timestamp": datetime.fromisoformat(old), "pv_power": 0, "battery_power": 0, "total_load_power": 0, "grid_power": 0, "battery_soc": 0},
        ]

        store.add("SERIAL1", {"pv_power": 5000, "battery_power": 0, "total_load_power": 3000, "grid_power": 0, "battery_soc": 50})

        self.assertEqual(len(store._entries), 1)

    def test_serialize_deserialize_roundtrip(self):
        from web_server import _serialize, _deserialize
        now = datetime.now()
        entries = [
            {"serial": "SERIAL1", "timestamp": now, "pv_power": 5000, "battery_power": -1000, "total_load_power": 3500, "grid_power": -200, "battery_soc": 75},
        ]

        serialized = _serialize(entries)
        self.assertIsInstance(serialized[0]["timestamp"], str)

        deserialized = _deserialize(serialized)
        self.assertIsInstance(deserialized[0]["timestamp"], datetime)
        self.assertEqual(deserialized[0]["pv_power"], 5000)

    def test_file_persistence(self):
        store = self._make_store()
        store.add("SERIAL1", {"pv_power": 5000, "battery_power": -1000, "total_load_power": 3500, "grid_power": -200, "battery_soc": 75})

        store2 = self._make_store()

        self.assertEqual(len(store2._entries), 1)
        self.assertEqual(store2._entries[0]["serial"], "SERIAL1")
        self.assertEqual(store2._entries[0]["pv_power"], 5000)
        self.assertEqual(store2._entries[0]["battery_soc"], 75)


class TestStatusResponse(unittest.TestCase):
    
    def test_status_response_model(self):
        from web_server import StatusResponse
        response = StatusResponse(
            timestamp='2024-01-01T12:00:00',
            metrics={'12345': [{'name': 'test'}]}
        )
        
        self.assertEqual(response.timestamp, '2024-01-01T12:00:00')
        self.assertEqual(response.metrics, {'12345': [{'name': 'test'}]})


class TestHealthEndpoint(unittest.TestCase):
    
    def test_health_endpoint_exists(self):
        from web_server import app
        routes = [r.path for r in app.routes]
        self.assertIn('/health', routes)


class TestHistoryEndpoint(unittest.TestCase):
    
    def test_history_endpoint_exists(self):
        from web_server import app
        routes = [r.path for r in app.routes]
        self.assertIn('/api/history', routes)


class TestAppTitle(unittest.TestCase):
    
    def test_app_title(self):
        from web_server import app
        self.assertEqual(app.title, 'Deye Inverter Status API')


if __name__ == '__main__':
    unittest.main()
