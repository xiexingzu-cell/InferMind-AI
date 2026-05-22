# InferMind

OpenAI-compatible AI aggregation gateway. Route requests to GPT, DeepSeek, and Gemini through a single API endpoint.

## Architecture

```
Frontend (Next.js / Vercel)
  → API Gateway (FastAPI / Railway)
    → Model Router
      → Provider (OpenAI | DeepSeek | Gemini)
```

## Local Development

### Prerequisites
- Docker Desktop
- Python 3.11+
- Node.js 20+

### 1. Start infrastructure

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

cp .env.example .env            # fill in your provider keys
uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

Create first admin key:

```bash
python scripts/seed_key.py --name "admin"
# Save the printed key — shown only once
```

### 3. Frontend

```bash
cd frontend
npm install
# .env.local is already created (points to localhost:8000)
npm run dev
# → http://localhost:3000
```

Open http://localhost:3000, enter your admin key in the Chat page.

---

## Deploy to Production

### Backend → Railway

1. Create a new Railway project
2. Add **PostgreSQL** plugin — Railway sets `DATABASE_URL` automatically
3. Add **Redis** plugin — Railway sets `REDIS_URL` automatically
4. Create a new service, connect your GitHub repo, set root directory to `backend/`
5. Railway auto-detects `Dockerfile`
6. Set environment variables (see `backend/.env.production.example`):

| Variable | Value |
|----------|-------|
| `ENVIRONMENT` | `production` |
| `SECRET_KEY` | run `python -c "import secrets; print(secrets.token_hex(32))"` |
| `CORS_ORIGINS` | your Vercel URL, e.g. `https://your-project.vercel.app` |
| `OPENAI_API_KEY` | `sk-...` |
| `DEEPSEEK_API_KEY` | `sk-...` |
| `DATABASE_URL` | auto-set by Railway PostgreSQL plugin |
| `REDIS_URL` | auto-set by Railway Redis plugin |

7. Deploy — Railway runs the healthcheck at `/health`
8. Copy the Railway public URL (e.g. `https://your-backend.railway.app`)

### Seed admin key on Railway

```bash
# Run once in Railway's shell or via CLI
python scripts/seed_key.py --name "admin"
```

Or locally against the Railway DB:

```bash
DATABASE_URL="postgresql+asyncpg://..." python scripts/seed_key.py --name "admin"
```

### Frontend → Vercel

1. Import the GitHub repo in Vercel
2. Set root directory to `frontend/`
3. Add environment variable:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.railway.app` |

4. Deploy

---

## API Reference

The gateway is fully OpenAI SDK compatible. Point `base_url` at your backend:

```python
from openai import OpenAI

client = OpenAI(
    api_key="gw-your-key",
    base_url="https://your-backend.railway.app/v1",
)

response = client.chat.completions.create(
    model="deepseek-chat",  # or gpt-4o, gpt-4o-mini, ...
    messages=[{"role": "user", "content": "Hello"}],
    stream=True,
)
for chunk in response:
    print(chunk.choices[0].delta.content, end="")
```

### Supported models

| Model | Provider |
|-------|----------|
| `gpt-4o` | OpenAI |
| `gpt-4o-mini` | OpenAI |
| `gpt-4-turbo` | OpenAI |
| `o1-mini` | OpenAI |
| `deepseek-chat` | DeepSeek |
| `deepseek-reasoner` | DeepSeek |

### Endpoints

```
POST /v1/chat/completions   OpenAI-compatible chat
GET  /v1/models             List available models
GET  /api/keys              List API keys
POST /api/keys              Create API key
DEL  /api/keys/{id}         Revoke API key
GET  /api/usage?days=30     Usage statistics
GET  /health                Health check
```

---

## Adding a New Provider

1. Create `backend/app/providers/<name>_provider.py` implementing `AbstractProvider`
2. Register model prefixes in `backend/app/providers/registry.py`
3. Add provider keys to `config.py` and `.env.example`

That's it — no other files need touching.
