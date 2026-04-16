import logging
import socket
from typing import Optional

log = logging.getLogger(__name__)


class InverterInfo:
    def __init__(self, ipaddress: str, mac: str, serial: int) -> None:
        self.ipaddress = ipaddress
        self.mac = mac
        self.serial = serial


class InverterScanner:
    def __init__(self) -> None:
        self._inverters: list[InverterInfo] = []

    def _discover_inverters(self) -> None:
        request = "WIFIKIT-214028-READ"
        address = ("255.255.255.255", 48899)
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP) as sock:
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
                sock.settimeout(2.0)

                sock.sendto(request.encode(), address)

                while True:
                    try:
                        data = sock.recv(1024)
                        a = data.decode().split(",")
                        if len(a) == 3:
                            inverter_info = InverterInfo(
                                ipaddress=a[0], mac=a[1], serial=int(a[2])
                            )
                            if not any(
                                inv.serial == inverter_info.serial
                                for inv in self._inverters
                            ):
                                self._inverters.append(inverter_info)
                    except socket.timeout:
                        break
        except OSError as e:
            log.error("Failed to discover inverters: %s", e)

    def get_inverters(self) -> list[InverterInfo]:
        if not self._inverters:
            self._discover_inverters()
        return self._inverters
