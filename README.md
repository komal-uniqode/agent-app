# Voice Agent App

A voice-based AI customer-support assistant built on [LiveKit](https://livekit.io). Customers talk to an AI agent by voice; when the agent can't answer a question, it collects the customer's details and files a **service/escalation request**. A human reviews and resolves those requests from an admin dashboard, and every resolved request is automatically fed back into a **knowledge base** so the agent can answer similar questions on future calls.

The bundled example is configured for a fictional salon (*Aurora Salon*), but the business details live in a single config file and can be swapped for any business.

## How it works

```
                 voice                      LiveKit room
  Customer  ───────────────▶  agent-starter-react  ◀──────────────▶  agent-starter-python
  (browser)                   (Next.js web app)                      (LiveKit voice agent)
                                                                              │
                                                                              │ REST
                                                                              ▼
  Admin  ──────────────────▶  admin_frontend  ──── REST ────▶  backend  ───▶  MongoDB
  (browser)                   (React + Vite)                 (Express)
```

1. A customer opens the **React web app** and starts a call. It requests a LiveKit token and connects to a LiveKit room.
2. The **Python agent** joins the same room and handles the conversation — speech-to-text, an LLM brain, and text-to-speech — answering from the business config and the knowledge base.
3. When the agent hits a question it can't answer, it collects the customer's name and visit date and calls the **backend** to create an escalation request in **MongoDB**.
4. Staff review pending requests in the **admin dashboard**, respond, and mark them resolved. On resolution the request's Q&A is copied into the `knowledge_base` collection.
5. The next time the Python agent starts, it loads the knowledge base from the backend, so previously resolved questions can now be answered automatically.

## Tech stack

| Component | Directory | Stack |
|-----------|-----------|-------|
| Voice agent | [agent-starter-python/](agent-starter-python/) | Python 3.9+, [LiveKit Agents](https://docs.livekit.io/agents/) 1.2, Silero VAD, multilingual turn detection, LiveKit Inference (AssemblyAI STT, OpenAI `gpt-4.1-mini` LLM, Cartesia `sonic-3` TTS), managed with [uv](https://docs.astral.sh/uv/) |
| Customer web app | [agent-starter-react/](agent-starter-react/) | Next.js 15 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, `@livekit/components-react`, pnpm |
| Admin dashboard | [admin_frontend/](admin_frontend/) | React 19, Vite 7, plain CSS |
| Backend API | [backend/](backend/) | Node.js, Express 5, MongoDB driver, `livekit-server-sdk` |
| Database | — | MongoDB (`escalation_requests` and `knowledge_base` collections, with JSON-schema validation) |

## Prerequisites

- **Node.js** 18+ and **pnpm** (for the React app) / npm (for backend & admin)
- **Python** 3.9+ and **[uv](https://docs.astral.sh/uv/getting-started/installation/)**
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas connection string
- A **[LiveKit Cloud](https://cloud.livekit.io)** project (or a self-hosted LiveKit server) — you'll need the project URL, API key, and API secret. LiveKit Inference provides the STT/LLM/TTS models, so no separate OpenAI/Cartesia/AssemblyAI keys are required.

## Environment variables

Each component reads its own env file. Copy the matching `.env.example` and fill in the values.

### `backend/.env`

| Variable | Description |
|----------|-------------|
| `LIVEKIT_API_KEY` | LiveKit project API key (used to mint room tokens) |
| `LIVEKIT_API_SECRET` | LiveKit project API secret |
| `MONGODB_URI` | MongoDB connection string (default `mongodb://localhost:27017/agent_app`) |
| `MONGODB_DATABASE` | Database name (default `agent_app`) |

The backend listens on **port 4200**.

### `agent-starter-python/.env.local`

| Variable | Description |
|----------|-------------|
| `LIVEKIT_URL` | LiveKit server URL, e.g. `wss://<project>.livekit.cloud` |
| `LIVEKIT_API_KEY` | LiveKit project API key |
| `LIVEKIT_API_SECRET` | LiveKit project API secret |
| `BACKEND_URL` | Base URL of the backend API (default `http://localhost:4200`) |

### `agent-starter-react/.env.local`

| Variable | Description |
|----------|-------------|
| `LIVEKIT_URL` | LiveKit server URL, e.g. `wss://<project>.livekit.cloud` |
| `LIVEKIT_API_KEY` | LiveKit project API key |
| `LIVEKIT_API_SECRET` | LiveKit project API secret |
| `NEXT_PUBLIC_APP_CONFIG_ENDPOINT` | Optional. Remote app-config endpoint; leave blank to use local defaults |
| `SANDBOX_ID` | Optional. LiveKit Cloud Sandbox ID |

### `admin_frontend/.env`

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Base URL of the backend API (default `http://localhost:4200`) |

## Running locally

Start MongoDB first, then run each component in its own terminal.

### 1. Backend API

```bash
cd backend
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:4200
```

On startup it connects to MongoDB and creates the `escalation_requests` and `knowledge_base` collections (with schema validation) if they don't exist. Check `GET /health` to verify the DB connection.

### 2. Python voice agent

```bash
cd agent-starter-python
uv sync
cp .env.example .env.local   # then fill in the values (note: .env.local, not .env)
uv run python src/agent.py download-files   # one-time: download VAD / turn-detector models
uv run python src/agent.py dev
```

Edit [agent-starter-python/business_config.py](agent-starter-python/business_config.py) to change the business the agent represents.

### 3. Customer web app

```bash
cd agent-starter-react
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev                     # http://localhost:3000
```

Open http://localhost:3000 and start a call.

### 4. Admin dashboard

```bash
cd admin_frontend
npm install
cp .env.example .env   # optional; only needed to override the backend URL
npm run dev            # http://localhost:5173
```

The dashboard has two tabs: **Escalation Requests** (review and resolve pending requests) and **Knowledge Base** (browse resolved Q&A the agent can now use).

## Backend API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/getToken` | Mint a LiveKit access token for a demo room |
| `GET` | `/health` | Health check + MongoDB connectivity |
| `POST` | `/api/escalation-requests` | Create a request (`question`, `customer_name`, `date_of_visit`) |
| `GET` | `/api/escalation-requests` | List all requests |
| `PUT` | `/api/escalation-requests/:id` | Update `status` / `response` (resolving adds to the knowledge base) |
| `GET` | `/api/knowledge-base` | List all knowledge base items |
