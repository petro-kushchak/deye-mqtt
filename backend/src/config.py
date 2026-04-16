from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Dict, Callable


class ServiceConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="",
        case_sensitive=False,
    )

    status_interval: int = Field(default=30, validation_alias="STATUS_READ_INTERVAL_SEC")
    mqtt_broker: str = Field(default="192.168.201.2", validation_alias="MQTT_BROKER")
    mqtt_port: int = Field(default=1883, validation_alias="MQTT_BROKER_PORT")
    topic_prefix: str = Field(default="deye", validation_alias="MQTT_TOPIC_PREFIX")
    inverter_ip: str = Field(default="", validation_alias="INVERTER_IP")
    inverter_serial: int = Field(default=12345678, validation_alias="INVERTER_SERIAL")
    inverter_definition: str = Field(default="deye_hybrid.yaml", validation_alias="INVERTER_DEFINITION")

    @property
    def metrics_to_publish(self) -> Dict[str, str]:
        return {
            "PV1 Power": "pv1_power",
            "PV2 Power": "pv2_power",
            "PV1 Voltage": "pv1_voltage",
            "PV2 Voltage": "pv2_voltage",
            "PV1 Current": "pv1_current",
            "PV2 Current": "pv2_current",
            "Battery Status": "battery_status",
            "Battery Power": "battery_power",
            "Battery SOC": "battery_soc",
            "Battery Current": "battery_current",
            "Total Grid Power": "grid_power",
            "Total Load Power": "total_load_power",
            "Running Status": "running_status",
            "Work Mode": "work_mode",
            "Grid-connected Status": "grid_connected_status",
            "Battery Voltage": "battery_voltage",
            "Battery Temperature": "battery_temperature",
            "DC Temperature": "dc_temperature",
            "AC Temperature": "ac_temperature",
            "Grid Frequency": "grid_frequency",
            "Daily Production": "daily_production",
            "Total Production": "total_production",
            "Daily Load Consumption": "daily_load_consumption",
            "Daily Battery Charge": "daily_battery_charge",
        }

    @property
    def metrics_to_calculate(self) -> Dict[str, Callable[[Dict], float]]:
        return {
            "battery_power_abs": lambda entry: abs(entry.get("Battery Power", 0)),
            "pv_power": lambda entry: entry.get("PV1 Power", 0) + entry.get("PV2 Power", 0),
            "pv_excess_power": lambda entry: max(
                0,
                (entry.get("PV1 Power", 0) + entry.get("PV2 Power", 0))
                - (
                    entry.get("Total Load Power", 0)
                    + (-entry.get("Battery Power", 0) if entry.get("Battery Power", 0) < 0 else 0)
                ),
            ),
        }
