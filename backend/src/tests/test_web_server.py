import unittest
import sys
import os
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

HAS_FASTAPI = False
try:
    from fastapi.testclient import TestClient
    HAS_FASTAPI = True
except (ImportError, RuntimeError):
    pass


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


class TestStatusEndpoint(unittest.TestCase):
    
    @unittest.skipUnless(HAS_FASTAPI, "FastAPI not installed")
    @patch('web_server.datetime')
    def test_get_status_success(self, mock_datetime):
        mock_datetime.utcnow.return_value = datetime(2024, 1, 1, 12, 0, 0)
        
        from web_server import app, BackendState
        
        state = BackendState()
        state.current_status = {12345: [{'name': 'pv_power', 'value': 1000}]}
        app.state.backend_state = state
        
        client = TestClient(app)
        response = client.get('/status')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('timestamp', data)
        self.assertIn('metrics', data)
        self.assertEqual(data['metrics'], {12345: [{'name': 'pv_power', 'value': 1000}]})
    
    @unittest.skipUnless(HAS_FASTAPI, "FastAPI not installed")
    def test_get_status_not_available(self):
        from web_server import app, BackendState
        
        state = BackendState()
        app.state.backend_state = state
        
        client = TestClient(app)
        response = client.get('/status')
        
        self.assertEqual(response.status_code, 503)


class TestHistoryEndpoint(unittest.TestCase):
    
    @unittest.skipUnless(HAS_FASTAPI, "FastAPI not installed")
    @patch('web_server.datetime')
    def test_get_history_success(self, mock_datetime):
        mock_datetime.utcnow.return_value = datetime(2024, 1, 1, 12, 0, 0)
        
        from web_server import app, BackendState
        
        state = BackendState()
        state.history = [
            (datetime(2024, 1, 1, 11, 30, 0), {'metric': 'data1'}),
            (datetime(2024, 1, 1, 11, 45, 0), {'metric': 'data2'})
        ]
        app.state.backend_state = state
        
        client = TestClient(app)
        response = client.get('/history?hours=1')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['count'], 2)
        self.assertEqual(len(data['data']), 2)
    
    @unittest.skipUnless(HAS_FASTAPI, "FastAPI not installed")
    @patch('web_server.datetime')
    def test_get_history_filtered_by_hours(self, mock_datetime):
        mock_datetime.utcnow.return_value = datetime(2024, 1, 1, 12, 0, 0)
        
        from web_server import app, BackendState
        
        state = BackendState()
        state.history = [
            (datetime(2024, 1, 1, 11, 30, 0), {'metric': 'recent'}),
            (datetime(2024, 1, 1, 10, 0, 0), {'metric': 'old'})
        ]
        app.state.backend_state = state
        
        client = TestClient(app)
        response = client.get('/history?hours=1')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['count'], 1)
        self.assertEqual(data['data'][0], {'metric': 'recent'})
    
    @unittest.skipUnless(HAS_FASTAPI, "FastAPI not installed")
    def test_get_history_not_available(self):
        from web_server import app, BackendState
        
        state = BackendState()
        app.state.backend_state = state
        
        client = TestClient(app)
        response = client.get('/history')
        
        self.assertEqual(response.status_code, 503)
    
    @unittest.skipUnless(HAS_FASTAPI, "FastAPI not installed")
    @patch('web_server.datetime')
    def test_get_history_default_hours(self, mock_datetime):
        mock_datetime.utcnow.return_value = datetime(2024, 1, 1, 12, 0, 0)
        
        from web_server import app, BackendState
        
        state = BackendState()
        state.history = [
            (datetime(2024, 1, 1, 11, 30, 0), {'metric': 'data'})
        ]
        app.state.backend_state = state
        
        client = TestClient(app)
        response = client.get('/history')
        
        self.assertEqual(response.status_code, 200)


class TestAppTitle(unittest.TestCase):
    
    def test_app_title(self):
        from web_server import app
        self.assertEqual(app.title, 'Deye Inverter Status API')


if __name__ == '__main__':
    unittest.main()
