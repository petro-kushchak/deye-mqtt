import socket
from xmlrpc import server

class InverterInfo:
    def __init__(self, ipaddress, mac, serial):
        self.ipaddress = ipaddress
        self.mac = mac
        self.serial = serial

class InverterScanner:
    _inverters = []
    def __init__(self):
        pass

    def _discover_inverters(self):    
        request = "WIFIKIT-214028-READ"
        address = ("255.255.255.255", 48899)
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP) as sock:
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
                sock.settimeout(1.0)
                # sock.bind(("", 48900))

                sock.sendto(request.encode(), address)
                
                while True:
                    try:
                        data = sock.recv(1024)
                        a = data.decode().split(',')
                        if 3 == len(a):
                            inverter_info = InverterInfo(ipaddress=a[0], mac=a[1], serial=int(a[2]))
                            #check if already exists
                            if not any(inv.serial == inverter_info.serial for inv in self._inverters):
                                self._inverters.append(inverter_info)
                    except socket.timout:
                        break
        except:                        
            return None    
            
    def get_inverters(self):
        if not self._inverters:
            self._discover_inverters()
        return self._inverters