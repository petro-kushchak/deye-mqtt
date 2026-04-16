from datetime import datetime
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, Field

if TYPE_CHECKING:
    from config import ServiceConfig


class PvMetrics(BaseModel):
    pv1_power: float = 0
    pv2_power: float = 0
    pv_power: float = 0
    pv1_voltage: float = 0
    pv2_voltage: float = 0
    pv1_current: float = 0
    pv2_current: float = 0
    pv_excess_power: float = 0


class BatteryMetrics(BaseModel):
    battery_power: float = 0
    battery_power_abs: float = 0
    battery_soc: float = 0
    battery_current: float = 0
    battery_voltage: float = 0
    battery_temperature: float = 0
    battery_status: str = ""
    daily_battery_charge: float = 0


class GridMetrics(BaseModel):
    grid_power: float = 0
    grid_frequency: float = 0
    grid_connected_status: str = ""


class LoadMetrics(BaseModel):
    total_load_power: float = 0
    daily_load_consumption: float = 0


class SystemMetrics(BaseModel):
    running_status: str = ""
    work_mode: str = ""
    dc_temperature: float = 0
    ac_temperature: float = 0
    daily_production: float = 0
    total_production: float = 0


class InverterMetrics(
    PvMetrics,
    BatteryMetrics,
    GridMetrics,
    LoadMetrics,
    SystemMetrics,
):
    serial: str = ""
    timestamp: datetime = Field(default_factory=datetime.now)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "InverterMetrics":
        return cls(**data)

    def to_dict(self) -> dict[str, Any]:
        return self.model_dump()


class InverterHealth(BaseModel):
    serial: str
    host: str
    is_connected: bool = False
    consecutive_failures: int = 0
    last_success: datetime | None = None
    last_failure: datetime | None = None

    def record_success(self) -> None:
        self.consecutive_failures = 0
        self.last_success = datetime.now()
        self.is_connected = True

    def record_failure(self) -> None:
        self.consecutive_failures += 1
        self.last_failure = datetime.now()
        if self.consecutive_failures >= 3:
            self.is_connected = False


class ApplicationContext:
    def __init__(self):
        self.config: "ServiceConfig | None" = None
        self.inverters: list = []
        self.health_tracker: dict[str, InverterHealth] = {}

    def get_health(self, serial: str) -> InverterHealth | None:
        return self.health_tracker.get(serial)

    def set_health(self, serial: str, health: InverterHealth) -> None:
        self.health_tracker[serial] = health


class StatusResponse(BaseModel):
    status: str
    timestamp: str
    metrics: dict


class HealthResponse(BaseModel):
    status: str
    mqtt_connected: bool
    inverters: list[InverterHealth]
    uptime_seconds: float = 0
