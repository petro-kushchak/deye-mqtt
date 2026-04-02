import json
import logging
import os
import threading
from deye.parser import ParameterParser
import concurrent.futures
import asyncio

# Logger configuration with timestamp and stack traces
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(module)s:%(lineno)d] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

from pysolarmanv5 import PySolarmanV5
import yaml

DOMAIN = 'solarman'
DEFAULT_PORT_INVERTER = 8899
DEFAULT_INVERTER_MB_SLAVEID = 1
DEFAULT_LOOKUP_FILE = 'deye_hybrid.yaml'

class DeyeInverter:
    def __init__(self, serial: int | str, host: str, port: int | None = None, lookup_file: str | None = None):
        self._modbus = None
        self._serial = serial
        self._host = host
        self._port = port if port is not None else DEFAULT_PORT_INVERTER
        self._current_val = None
        self.lookup_file = lookup_file or DEFAULT_LOOKUP_FILE
        self.lock = threading.Lock()

        module_path = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(module_path, self.lookup_file)) as f:
            self.parameter_definition = yaml.full_load(f)

    @property
    def serial(self):
        """The 'serial' property getter."""
        return self._serial
    
    @property
    def is_connected(self):
        return self._modbus is not None

    def connect(self):
        if self._modbus:
            return self._modbus
        log.info(f"Connecting to solarman data logger {self._host}:{self._port}")
        self._modbus = PySolarmanV5(self._host, self._serial, port=self._port, logger=None, auto_reconnect=True, socket_timeout=15)
        return self._modbus

    def disconnect(self):
        if self._modbus:
            try:
                log.info(f"Disconnecting from solarman data logger {self._host}:{self._port}")
                self._modbus.disconnect()
            finally:
                self._modbus = None

    def test(self):
        try:
            self.connect()
            self.get_statistics()
            return self._modbus is not None
        except Exception as e:
            log.warning(
                f"Testing connection to inverter {self._serial} at {self._host}:{self._port} failed with exception [{type(e).__name__}: {e}]"
            )
            return False

    def send_request(self, params: ParameterParser, start: int, end: int, mb_fc):
        length = end - start + 1
        response = self._modbus.read_holding_registers(register_addr=start, quantity=length)
        params.parse(response, start, length)

    def get_statistics(self):
        with self.lock:
            try:
                if not self.is_connected:
                    self.connect()

                requests = self.parameter_definition['requests']
                params = ParameterParser(self.parameter_definition)
                status = []
                for request in requests:
                    start = request['start']
                    end = request['end']
                    mb_fc = request['mb_functioncode']
                    self.send_request(params, start, end, mb_fc)
                    status.append(params.get_result())
            except Exception as e:
                log.warning(
                    f"Querying inverter {self._serial} at {self._host}:{self._port} failed on connection start with exception [{type(e).__name__}: {e}]"
                )
                self._status_connection = 0
                # Clear cached previous results to not report stale and incorrect data
                self._current_val = {}
                self.disconnect()

            return status

    # Async wrapper using ThreadPoolExecutor because pysolarmanv5 is blocking
    async def get_statistics_async(self, *, loop: asyncio.AbstractEventLoop | None = None):
        loop = loop or asyncio.get_running_loop()
        return await loop.run_in_executor(None, self.get_statistics)
