import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Any, Annotated
import json
import os
import re

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models import HealthResponse, InverterHealth

log = logging.getLogger("deye_web")

START_TIME = datetime.now()


def get_uptime_seconds() -> float:
    return (datetime.now() - START_TIME).total_seconds()


def set_start_time() -> None:
    global START_TIME
    START_TIME = datetime.now()


def get_version() -> str:
    version_file = os.path.join(os.path.dirname(__file__), 'VERSION')
    try:
        with open(version_file, 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        return 'unknown'


def sanitize_topic_component(component: str) -> str:
    return re.sub(r'[^a-zA-Z0-9_-]', '_', str(component))


ACCESS_KEY = os.environ.get("ACCESS_KEY", "")

def verify_access_key(key: str | None) -> bool:
    if not ACCESS_KEY:
        return True
    return key == ACCESS_KEY

def get_access_key_from_query(access_key: Annotated[str | None, Query(alias="access_key")] = None) -> str | None:
    return access_key

def get_access_key_from_header(x_access_key: Annotated[str | None, Header()] = None) -> str | None:
    return x_access_key

class AccessKeyException(Exception):
    pass

async def verify_ws_access_key(websocket: WebSocket) -> bool:
    if not ACCESS_KEY:
        return True
    
    access_key = websocket.query_params.get("access_key")
    if not access_key:
        return False
    return access_key == ACCESS_KEY


async def lifespan(app: FastAPI) -> None:
    from main import start_background_tasks
    await start_background_tasks(app)
    yield
    from main import stop_background_tasks
    await stop_background_tasks()


class BackendState:
    def __init__(self):
        self.current_status: dict[str, list[dict]] = {}
        self.history: list[tuple[datetime, dict]] = []
        self.health_tracker: dict = {}


HISTORY_RETENTION = timedelta(hours=24)


class StatusResponse(BaseModel):
    timestamp: str
    metrics: dict[str, list[dict]]


def get_application() -> FastAPI:
    application = FastAPI(
        title="Deye Inverter Status API",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return application


app = get_application()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("web_server:app", host="0.0.0.0", port=8000, reload=True)


from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    from main import start_background_tasks
    await start_background_tasks(app)
    yield
    from main import stop_background_tasks
    await stop_background_tasks()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.cached_data: dict = {}

    async def connect(self, websocket: WebSocket, cached_payload: str | None = None):
        log.info("New Connection: %s", websocket.client)
        await websocket.accept()
        self.active_connections.add(websocket)
        if cached_payload:
            await websocket.send_text(cached_payload)

    def disconnect(self, websocket: WebSocket):
        log.info("Connection closed: %s", websocket.client)
        self.active_connections.discard(websocket)

    def cache_data(self, serial: str, data: list):
        self.cached_data[serial] = data

    def get_cached_payload(self) -> str | None:
        if self.cached_data:
            all_metrics = []
            for metrics in self.cached_data.values():
                all_metrics.extend(metrics)
            if all_metrics:
                return json.dumps(all_metrics)
        return None

    async def broadcast(self, message: str):
        disconnected = set()
        for connection in self.active_connections:
            try:
                log.info("Connection: %s, broadcasting message: %s", connection.client, message)
                await connection.send_text(message)
            except Exception as e:
                log.error("Error broadcasting to connection: %s, disconnecting. Error: %s", connection.client, e)
                disconnected.add(connection)
        for conn in disconnected:
            self.active_connections.discard(conn)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    access_key = websocket.query_params.get("access_key")
    if not verify_access_key(access_key):
        log.warning("WebSocket connection rejected: invalid access key from %s", websocket.client)
        await websocket.close(code=4001, reason="Invalid access key")
        return

    log.info("New WebSocket connection: %s", websocket.client)
    cached_payload = manager.get_cached_payload()
    await manager.connect(websocket, cached_payload)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/version")
async def get_version_info(
    access_key: Annotated[str | None, Query(alias="access_key")] = None,
    x_access_key: Annotated[str | None, Header()] = None,
):
    key = access_key or x_access_key
    if not verify_access_key(key):
        raise HTTPException(status_code=401, detail="Invalid access key")
    return {"version": get_version()}


@app.get("/health")
async def health_check() -> HealthResponse:
    mqtt_connected = getattr(app.state, "mqtt_connected", False)
    inverter_health = []
    if hasattr(app.state, "backend_state"):
        health_tracker = getattr(app.state.backend_state, "health_tracker", {})
        for health in health_tracker.values():
            inverter_health.append(
                InverterHealth(
                    serial=health.serial,
                    host=health.host,
                    is_connected=health.is_connected,
                    consecutive_failures=health.consecutive_failures,
                    last_success=health.last_success,
                    last_failure=health.last_failure,
                )
            )

    return HealthResponse(
        status="ok" if mqtt_connected or inverter_health else "degraded",
        mqtt_connected=mqtt_connected,
        inverters=inverter_health,
        uptime_seconds=get_uptime_seconds(),
    )


async def broadcast_status():
    if app.state.backend_state.current_status:
        for serial, metrics in app.state.backend_state.current_status.items():
            if metrics:
                manager.cache_data(serial, metrics)
                await manager.broadcast(json.dumps(metrics))

def set_app_state(state: BackendState):
    app.state.backend_state = state
