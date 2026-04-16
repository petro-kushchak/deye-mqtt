import asyncio
import logging
import os
import threading
from typing import Any

import yaml
from pysolarmanv5 import PySolarmanV5

from deye.parser import ParameterParser

log = logging.getLogger(__name__)

DEFAULT_PORT_INVERTER = 8899
DEFAULT_LOOKUP_FILE = "deye_hybrid.yaml"

_parameter_cache: dict[str, dict] = {}


def _load_parameter_definition(lookup_file: str) -> dict:
    if lookup_file not in _parameter_cache:
        module_path = os.path.dirname(os.path.abspath(__file__))
        with open(os.path.join(module_path, lookup_file)) as f:
            _parameter_cache[lookup_file] = yaml.full_load(f)
    return _parameter_cache[lookup_file]


class DeyeInverter:
    def __init__(
        self,
        serial: int | str,
        host: str,
        port: int | None = None,
        lookup_file: str | None = None,
    ) -> None:
        self._modbus: PySolarmanV5 | None = None
        self._serial = serial
        self._host = host
        self._port = port if port is not None else DEFAULT_PORT_INVERTER
        self._status_connection: int = 0
        self._current_val: dict[str, Any] = {}
        self.lookup_file = lookup_file or DEFAULT_LOOKUP_FILE
        self.lock = threading.Lock()
        self.parameter_definition = _load_parameter_definition(self.lookup_file)

    @property
    def serial(self) -> int | str:
        return self._serial

    @property
    def is_connected(self) -> bool:
        return self._modbus is not None

    def connect(self) -> PySolarmanV5:
        if self._modbus:
            return self._modbus
        log.info("Connecting to solarman data logger %s:%s", self._host, self._port)
        self._modbus = PySolarmanV5(
            self._host,
            self._serial,
            port=self._port,
            logger=None,
            auto_reconnect=True,
            socket_timeout=15,
        )
        return self._modbus

    def disconnect(self) -> None:
        if self._modbus:
            try:
                log.info("Disconnecting from solarman data logger %s:%s", self._host, self._port)
                self._modbus.disconnect()
            finally:
                self._modbus = None

    def test(self) -> bool:
        try:
            self.connect()
            self.get_statistics()
            return self._modbus is not None
        except Exception as e:
            log.warning(
                "Testing connection to inverter %s at %s:%s failed with exception [%s: %s]",
                self._serial,
                self._host,
                self._port,
                type(e).__name__,
                e,
            )
            return False

    def send_request(
        self,
        params: ParameterParser,
        start: int,
        end: int,
        mb_fc: int,
    ) -> None:
        length = end - start + 1
        response = self._modbus.read_holding_registers(register_addr=start, quantity=length) # type: ignore
        params.parse(response, start, length)

    def get_statistics(self) -> list[dict]:
        with self.lock:
            try:
                if not self.is_connected:
                    self.connect()

                requests = self.parameter_definition["requests"]
                params = ParameterParser(self.parameter_definition)
                status = []
                for request in requests:
                    start = request["start"]
                    end = request["end"]
                    mb_fc = request["mb_functioncode"]
                    self.send_request(params, start, end, mb_fc)
                    status.append(params.get_result())
                self._status_connection = 1
            except Exception as e:
                log.warning(
                    "Querying inverter %s at %s:%s failed on connection start with exception [%s: %s]",
                    self._serial,
                    self._host,
                    self._port,
                    type(e).__name__,
                    e,
                )
                self._status_connection = 0
                self._current_val = {}
                self.disconnect()

            return status

    async def get_statistics_async(self) -> list[dict]:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self.get_statistics)
