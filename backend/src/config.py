import os

class ServiceConfig:
    def __init__(self):
        self.status_interval: int = int(os.getenv("STATUS_READ_INTERVAL_SEC", 30))
        self.mqtt_broker: str = os.getenv("MQTT_BROKER", "192.168.201.2")
        self.mqtt_port: int = int(os.getenv("MQTT_BROKER_PORT", "1883"))
        self.topic_prefix: str = os.getenv("MQTT_TOPIC_PREFIX", "deye")
        self.inverter_ip: str = os.getenv("INVERTER_IP", "")
        self.inverter_serial: int = int(os.getenv("INVERTER_SERIAL", 12345678))
        self.metrics_to_publish = {
                "PV1 Power": 'pv1_power',
                "PV2 Power": 'pv2_power',
                "PV1 Voltage": 'pv1_voltage',
                "PV2 Voltage": 'pv2_voltage',
                "PV1 Current": 'pv1_current',
                "PV2 Current": 'pv2_current',
                "Battery Status": 'battery_status',
                "Battery Power": 'battery_power',
                "Battery SOC": 'battery_soc',
                "Battery Current": 'battery_current',
                "Total Grid Power": 'grid_power',
                "Total Load Power": 'total_load_power',
                "Running Status": 'running_status',
                "Work Mode": 'work_mode',
                "Grid-connected Status": 'grid_connected_status',
                "Battery Voltage": 'battery_voltage',
                "Battery Temperature": 'battery_temperature',
                "DC Temperature": 'dc_temperature',
                "AC Temperature": 'ac_temperature',
                "Grid Frequency": 'grid_frequency',
                "Daily Production": 'daily_production',
                "Total Production": 'total_production',
                "Daily Load Consumption": 'daily_load_consumption',
                "Daily Battery Charge": 'daily_battery_charge'
        }
        self.metrics_to_calculate = {
                "battery_power_abs": lambda entry: abs(entry.get("Battery Power", 0)),
                "pv_power": lambda entry: entry.get("PV1 Power", 0) + entry.get("PV2 Power", 0),
                "pv_excess_power": lambda entry: max(0, (entry.get("PV1 Power", 0) + entry.get("PV2 Power", 0)) - (entry.get("Total Load Power", 0) + (-entry.get("Battery Power", 0) if entry.get("Battery Power", 0) < 0 else 0)))
        }
