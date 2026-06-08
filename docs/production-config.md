# Production configuration runbook

How to turn on the feature-gated integrations for the GĐ2 pilot. All of these are
**config-only** — the code already supports them; you just supply secrets.

## Where production config lives

Production runs via Docker Compose on the server (`docker-compose.prod.yml`). The
backend reads its environment from **`backend/.env.production`** on the server
(`env_file:`). That file is **not** in git — copy it from
[`backend/.env.production.example`](../backend/.env.production.example) and fill in
real values on the server.

**Apply changes** after editing `backend/.env.production`:

```bash
# on the server, in the repo root
docker compose -f docker-compose.prod.yml up -d --build backend
docker compose -f docker-compose.prod.yml logs -f backend   # watch boot logs
```

(Or re-run the **Deploy Production** GitHub Action — it rebuilds the stack and
runs the health check.)

Feature gating is fail-soft: a blank key disables that feature and the app still
boots. Only the **selected AI provider's** key is mandatory (see below).

---

## 1. Error reporting — Sentry

| Var | Value |
|---|---|
| `SENTRY_DSN` | Your project DSN from sentry.io (blank = disabled) |

- Logs are already structured JSON on stdout in production (parseable by the
  monitoring stack) regardless of Sentry.
- **Verify:** on boot the backend logs `Sentry error reporting: enabled`. Trigger
  any 5xx and confirm the event appears in the Sentry dashboard. With no DSN it
  logs `... disabled` and nothing is sent.

## 2. RAG knowledge base — Voyage embeddings

| Var | Value |
|---|---|
| `VOYAGE_API_KEY` | Standalone key from <https://dashboard.voyageai.com> (NOT a MongoDB Atlas key) |

- Blank = RAG ingestion/query is disabled (the rest of the app is unaffected).
- The pgvector column is fixed at 1024 dims (`voyage-3`); don't change the model
  without a migration.
- **Verify:** `POST /api/v1/rag/documents` then `POST /api/v1/rag/query` return a
  real grounded answer instead of a "VOYAGE_API_KEY is not configured" error.

## 3. CMS images (+ avatars, portfolio) — Cloudflare R2

| Var | Value |
|---|---|
| `STORAGE_PROVIDER` | `r2` (default `local` serves from the backend `/uploads` volume) |
| `R2_ACCOUNT_ID` | Cloudflare account id |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 API token pair |
| `R2_BUCKET_NAME` | Bucket name |
| `R2_PUBLIC_URL` | Public bucket URL, e.g. `https://pub-….r2.dev` |

- All five `R2_*` values are required when `STORAGE_PROVIDER=r2`; if any is
  missing the service falls back to local with a warning (so a partial setup
  won't break health checks).
- **Verify:** upload an image in Dashboard → Content; the returned URL should
  point at `R2_PUBLIC_URL` (not `/uploads/...`) and load in the browser.
- `local` is fine for the pilot, but uploads then live on the server volume
  (back them up / they don't survive a volume reset). R2 is recommended once
  images matter.

## 4. (Optional) Switch AI provider

| Var | Value |
|---|---|
| `AI_PROVIDER` | `claude` (default) · `openai` · `gemini` |
| key | `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` for the chosen one |
| model | optional `OPENAI_MODEL` (default `gpt-4o-mini`) / `GEMINI_MODEL` (default `gemini-1.5-flash`) |

Env validation requires **only the selected provider's key** — you don't need to
hold an Anthropic key to run on OpenAI/Gemini. Switching is just a config change.

---

## Pre-pilot checklist

- [ ] `POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET` set to strong unique values
- [ ] `FRONTEND_URL` = the real frontend domain (CORS)
- [ ] `AI_PROVIDER` + its API key set; `/api/v1/ai` chat works
- [ ] `VOYAGE_API_KEY` set → RAG ingest/query works (if RAG is in the pilot)
- [ ] `SENTRY_DSN` set → a forced 5xx shows up in Sentry
- [ ] `STORAGE_PROVIDER=r2` + `R2_*` (or accept local) → CMS image upload works
- [ ] `RESEND_API_KEY` set if the pilot sends email; `TURNSTILE_SECRET_KEY` if bot protection is wanted
- [ ] `GET /api/health` returns ok; `GET /api/v1/health/ready` shows database + redis `up`
