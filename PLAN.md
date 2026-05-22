# Plan: InferMind

## Objective
Build a production-grade AI aggregation platform with an OpenAI-compatible API endpoint and a geek-style dark-mode chat UI. Supports OpenAI GPT, Google Gemini, and DeepSeek out of the box, with a pluggable provider architecture for future expansion.

## Scope
- Backend: FastAPI, OpenAI-compatible `/v1/chat/completions`, API key CRUD, usage logging, rate limiting
- Frontend: Next.js 15, Landing, Chat Playground, Dashboard, API Key management
- Infra: PostgreSQL (data), Redis (rate limit), Vercel (frontend), Railway (backend)

## Non-goals
- User registration / OAuth (v1: admin issues keys manually)
- BYOK (v1: platform-level provider keys only)
- Billing / payment integration
- Image/audio/embedding endpoints (v1: text chat only)

## Current State
- [x] P1 — Backend skeleton: FastAPI + DB models + Provider abstraction + OpenAI provider
- [x] P2 — Auth: API key validation middleware + key management endpoints
- [x] P3 — Frontend: Next.js 16, Landing Page, global dark theme, sidebar
- [x] P4 — Frontend: Chat Playground (streaming SSE + Markdown + code highlight)
- [x] P5 — Frontend: API Key management page
- [x] P6 — Dashboard: stats cards, requests/tokens line charts, model breakdown
- [x] P7 — Deploy: Dockerfile, railway.toml, vercel.json, .gitignore, README
- [REMOVED]
- [ ] P4 — Frontend: Landing + Chat Playground (streaming + Markdown)
- [ ] P5 — Frontend: Dashboard + usage charts + API Key management page
- [ ] P6 — Deploy: Vercel + Railway + env docs

## Implementation Steps

### P1 — Backend Foundation ← CURRENT
1. `docker-compose.yml` — PostgreSQL 16 + Redis 7
2. `backend/requirements.txt` + `.env.example`
3. `app/config.py` — Pydantic Settings
4. `app/database.py` — SQLAlchemy async
5. `app/redis_client.py` — Redis pool
6. `app/main.py` — FastAPI entry + lifespan
7. `app/core/logger.py` — structlog
8. `app/models/` — ORM: ApiKey, UsageLog
9. `app/schemas/chat.py` — OpenAI-compatible Pydantic models
10. `app/providers/base.py` — AbstractProvider
11. `app/providers/openai_provider.py` — OpenAI adapter
12. `app/providers/registry.py` — model → provider mapping
13. `app/router/model_router.py` — dispatch by model name
14. `app/api/v1/chat.py` — POST /v1/chat/completions
15. `app/api/v1/models.py` — GET /v1/models

### P2 — Auth + Key Management
1. `app/core/auth.py` — Bearer key validation dependency
2. `app/core/rate_limiter.py` — Redis token bucket
3. `app/api/v1/keys.py` — CRUD for API keys
4. `scripts/seed_key.py` — generate first admin key

### P3 — More Providers
1. `app/providers/deepseek_provider.py`
2. `app/providers/gemini_provider.py`
3. Update `registry.py`

### P4 — Frontend Chat
1. Next.js 15 scaffold + shadcn/ui
2. Landing page
3. Chat Playground with SSE streaming
4. Markdown + code highlighting

### P5 — Frontend Dashboard
1. Usage charts (Recharts)
2. API Key management UI
3. Stats cards

### P6 — Deploy
1. `vercel.json`
2. Railway `railway.toml` + env docs

## Validation
- [ ] `docker compose up -d` starts PG + Redis with no errors
- [ ] `uvicorn app.main:app` starts with no import errors
- [ ] `POST /v1/chat/completions` returns streamed SSE with a real OpenAI key
- [ ] `GET /v1/models` returns model list
- [ ] Invalid API key returns 401
- [ ] Rate limit exceeded returns 429

## Risks / Rollback
- Gemini API format differs significantly from OpenAI — test separately
- Railway free tier has cold starts — upgrade to paid for production
- OpenAI streaming format must match exactly for SDK compatibility

## Acceptance Criteria
- Any OpenAI SDK (Python/JS) can point `base_url` at this gateway and get responses
- Streaming works end-to-end (no buffering)
- All endpoints return proper error shapes (`{"error": {"message": ..., "type": ..., "code": ...}}`)
