# Frontend README

## Overview

The frontend is a React 19 + TypeScript SPA built with Vite. It provides:

- login
- password setup
- chat UI
- knowledge base management UI
- admin user management UI
- assistant citation rendering based on backend-supplied inline citations

The frontend depends on the backend for all data and auth flows.

## Local Development

### Native

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Default dev URL:

- `http://localhost:8080`

### Docker

From the repo root:

```bash
docker compose up --build frontend
```

Preferred full-stack local setup:

```bash
docker compose up --build
```

## Environment

Create `frontend/.env` from the example:

```bash
cd frontend
cp .env.example .env
```

Required variable:

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

Source of truth:

- [frontend/.env.example](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/.env.example)
- [frontend/src/lib/api.ts](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/src/lib/api.ts)

The frontend expects the backend to be reachable at that base URL from the browser.

## Common Commands

```bash
cd frontend
npm run dev
npm run build
npm run preview
npm run lint
```

## Recreate Frontend Air-Gap Artifact

To rebuild the offline `node_modules` bundle for the Linux server:

```bash
TARGET_OS=linux TARGET_ARCH=x86_64 NODE_MAJOR=22 ./scripts/airgap/package_frontend_node_modules.sh
```

To rebuild the full offline artifact set:

```bash
TARGET_OS=linux TARGET_ARCH=x86_64 PYTHON_VERSION=3.12 NODE_MAJOR=22 ./scripts/airgap/package_all.sh
```

To rebuild and publish all artifacts:

```bash
TARGET_OS=linux TARGET_ARCH=x86_64 PYTHON_VERSION=3.12 NODE_MAJOR=22 ./scripts/airgap/rebuild_and_publish.sh
```

## Knowledge Base UI Constraints

Current upload constraints in the frontend UI are defined in [frontend/src/pages/knowledge-base.tsx](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/src/pages/knowledge-base.tsx).

The current UI allows:

- file types: `TXT`, `PDF`, `CSV`
- maximum file size: `10MB`

Important distinction:

- the backend ingestion layer also accepts `md`
- the current frontend UI does not advertise or select `md`

## Air-Gapped Server Setup

Frontend deployment assumptions:

- extracted repo at `/app/mcbot-app`
- `node_modules` at `/app/mcbot-app/frontend/node_modules`
- local Node `22` and npm installed on the server

First-time extraction:

```bash
cd /app/mcbot-app
tar -xzf app-source.tar.gz
tar -xzf frontend-node_modules-linux-x86_64-node22.tar.gz
./scripts/airgap/prepare_target.sh
```

Update an existing deployment:

```bash
cd /app/mcbot-app
tar -xzf app-source.tar.gz -C /app/mcbot-app
tar -xzf frontend-node_modules-linux-x86_64-node22.tar.gz -C /app/mcbot-app
./scripts/airgap/prepare_target.sh
```

## Run On The Server

Build the production frontend:

```bash
cd /app/mcbot-app
npm run build --prefix frontend
```

That writes:

- `frontend/dist/`

Serve `frontend/dist` with nginx or another static file server.

## Frontend/Backend Integration

Relevant files:

- [frontend/package.json](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/package.json)
- [frontend/vite.config.ts](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/vite.config.ts)
- [frontend/src/App.tsx](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/src/App.tsx)
- [frontend/src/components/chat-box.tsx](/Users/harithzulfaizal/Code/Work/mcbot-rework/frontend/src/components/chat-box.tsx)

Current behavior:

- frontend dev server runs on `http://localhost:8080`
- backend API base is taken from `VITE_API_BASE_URL`
- Vite also proxies `/api` to `http://127.0.0.1:8000` during development
- chat uses SSE against the backend
- assistant messages can carry citation metadata
- the client parses assistant payload JSON and filters citations to inline-used citations before display
- malformed or non-JSON assistant payloads are surfaced as an error display state in the UI

If auth works but chat or KB requests fail, check `frontend/.env` first.

## Developer Notes

- `frontend-node_modules-linux-x86_64-node22.tar.gz` is platform-specific and must be rebuilt when frontend dependencies change.
- If you only change frontend source code, the server update still needs a refreshed `app-source.tar.gz`.
- If you change frontend dependencies, the server update needs both:
  - `app-source.tar.gz`
  - `frontend-node_modules-linux-x86_64-node22.tar.gz`
