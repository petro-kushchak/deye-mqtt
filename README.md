# Deye Inverter Monitoring Service

## Overview
A lightweight service that reads data from a **Deye inverter** using the Modbus protocol, exposes the current status through a **FastAPI** endpoint and publishes each reading to an MQTT broker. A **React / Material‑UI** frontend visualises real-time metrics via WebSocket.

---

## Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Inverter   │────▶│   Backend   │────▶│    MQTT     │
│  (Modbus)   │     │  (FastAPI)  │     │   Broker    │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                    │
                           │   ┌─────────────┐  │
                           └──▶│  Frontend   │◀─┘
                               │  (React)    │
                               └─────────────┘
```

- **Backend** – Polls inverter every `STATUS_READ_INTERVAL_SEC` seconds via Modbus, serves REST API (`/api/status`, `/api/version`) and WebSocket (`/ws`). Publishes data to MQTT.
- **Frontend** – Vite-powered React app, connects to backend via WebSocket for real-time updates.
- **MQTT** – Eclipse Mosquitto broker for real-time data feeds.

---

## Project Structure
```
deye/
├── backend/               # Python FastAPI backend
│   ├── src/              # Source code
│   └── deye_hybrid.yaml  # Inverter register configuration
├── frontend/             # React frontend
│   ├── src/             # React components
│   └── dist/            # Production build
├── docker/              # Docker deployment files
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── docker-compose.yml
│   ├── build.sh          # Build script
│   ├── entrypoint.sh     # Frontend runtime config
│   └── *.template        # Config templates
├── requirements.txt      # Python dependencies
├── start.sh             # Quick start script
└── scripts/             # Utility scripts
```

---

## Environment Variables

### Backend
| Variable | Description | Default |
|----------|-------------|---------|
| `MQTT_BROKER` | MQTT broker host | `192.168.201.2` |
| `MQTT_BROKER_PORT` | MQTT broker port | `1883` |
| `MQTT_TOPIC_PREFIX` | MQTT topic prefix | `deye` |
| `STATUS_READ_INTERVAL_SEC` | Polling interval (seconds) | `30` |
| `ACCESS_KEY` | Access key for API/WebSocket authentication (optional) | none |

### Frontend
| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | Backend URL for API/WebSocket proxy | `http://deye-backend:8000` |
| `BACKEND_WS_URL` | WebSocket URL (optional) | auto-generated from BACKEND_URL |
| `BACKEND_ACCESS_KEY` | Access key passed to backend (optional) | value of ACCESS_KEY |

### Security
When `ACCESS_KEY` is set, all API requests and WebSocket connections must include `?access_key=YOUR_KEY` or `X-Access-Key` header.

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js (for local frontend development)
- MQTT broker accessible by backend
- Deye inverter on network

### 1. Build and Run
```bash
cd docker
./build.sh          # Build frontend + Docker images
docker compose up -d # Start containers
```

### 2. Access
- Frontend: http://localhost:8070
- Backend API: http://localhost:8000
- WebSocket: ws://localhost:8000/ws

---

## Running Standalone Components

### Backend Only
```bash
docker build -f docker/Dockerfile.backend -t deye-backend .
docker run -d -p 8000:8000 \
  -e MQTT_BROKER=192.168.201.2 \
  deye-backend
```

### Frontend with External Backend
```bash
docker build -f docker/Dockerfile.frontend -t deye-frontend .
docker run -d -p 8080:80 \
  -e BACKEND_URL=http://your-backend-host:8000 \
  deye-frontend
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev          # Development server at http://localhost:5173
```

---

## Publishing Images

### Build and Push
```bash
# Build images
docker build -f docker/Dockerfile.backend -t deye-backend:latest .
docker build -f docker/Dockerfile.frontend -t deye-frontend:latest .

# Tag for registry
docker tag deye-backend:latest your-registry/deye-backend:latest
docker tag deye-frontend:latest your-registry/deye-frontend:latest

# Push
docker push your-registry/deye-backend:latest
docker push your-registry/deye-frontend:latest
```

### Run Published Images
```bash
# Backend
docker run -d -p 8000:8000 \
  -e MQTT_BROKER=your-mqtt-host \
  your-registry/deye-backend:latest

# Frontend
docker run -d -p 8080:80 \
  -e BACKEND_URL=http://your-backend-host:8000 \
  your-registry/deye-frontend:latest
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/version` | GET | Backend version |
| `/api/status` | GET | Current inverter status |
| `/api/history` | GET | Historical readings |
| `/ws` | WS | Real-time metrics stream |

---

## Development Notes

- Backend uses **async/await** with `ThreadPoolExecutor` for non-blocking Modbus calls
- Frontend connects via WebSocket for real-time updates with auto-reconnect
- Nginx proxies `/api/` and `/ws` to backend in containerized deployment
- Config templates (`*.template`) are processed at container startup via `envsubst`

---

## References

- [Home Assistant Solarman](https://github.com/StephanJoubert/home_assistant_solarman/tree/main/custom_components/solarman)
