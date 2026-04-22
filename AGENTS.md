# Deye MQTT - Agent Guide

## Project Structure

```
deye-mqtt/
├── backend/           # Python FastAPI + uvicorn
│   ├── src/           # Source code
│   │   ├── main.py    # Entry point (async runner)
│   │   ├── config.py  # Pydantic-settings config
│   │   └── tests/     # Unit tests (pytest)
│   └── requirements.txt
├── frontend/           # React + Vite
│   ├── src/           # React components
│   ├── vite.config.js # Dev server proxy config
│   └── package.json   # npm scripts
├── docker/            # Docker deployment
└── cicd/              # CI/CD scripts
```

## Developer Commands

### Backend
```bash
# Run
cd backend && python3 -m src.main

# Test
cd backend && python3 -m pytest src/tests -v

# Install dependencies
pip install -r backend/requirements.txt
```

### Frontend
```bash
# Install
cd frontend && npm install

# Run dev server (proxies /api and /ws to backend)
cd frontend && npm run dev

# Build
cd frontend && npm run build

# Test
cd frontend && npm run test        # single run
cd frontend && npm run test:watch # watch mode
```

### Docker
```bash
cd docker && docker compose up -d
```

## Key Configuration

- **Backend env vars**: `MQTT_BROKER`, `MQTT_PORT`, `STATUS_READ_INTERVAL_SEC`, `INVERTER_IP`, `INVERTER_SERIAL` (from `config.py`)
- **Frontend**: `BACKEND_URL` and proxy in `vite.config.js` lines 17-23
- **Config template processing**: Docker templates use `envsubst` at container startup

## Testing Notes

- Python tests use **unittest** with **pytest** runner
- JavaScript tests use **vitest** (config in `vitest.config.js`)
- Run both: `./cicd/test.sh`

## Architecture Details

- Backend uses **async/await** with `ThreadPoolExecutor` for non-blocking Modbus
- Frontend connects via WebSocket (`/ws`) for real-time updates with auto-reconnect
- Inverter definitions in `deye_hybrid.yaml` (Modbus register mappings)