import unittest
import sys
import os
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


class TestAppTitle(unittest.TestCase):
    
    def test_app_title(self):
        from web_server import app
        self.assertEqual(app.title, 'Deye Inverter Status API')


if __name__ == '__main__':
    unittest.main()
