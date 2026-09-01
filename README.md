# GitHub PR Analyzer Agent

Scaffolded backend MVP for an AI-powered pull request analyzer geared toward senior backend interviews.

## Features in this scaffold

- GitHub webhook ingestion (`POST /webhooks/github` for `pull_request` events)
- Async PR review queue with configurable concurrency
- Claude-based structured review generation (with mock fallback when no API key is set)
- SQLite persistence for review status/results
- REST endpoints:
  - `GET /reviews/:prId?repo=owner/name`
  - `GET /stats`
  - `GET /health`
- Rate limiting, request validation, and centralized error handling

## Tech stack

- Node.js + Express
- SQLite (`sqlite3` + `sqlite`)
- Claude API (`@anthropic-ai/sdk`)

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env
   ```
3. Configure `.env` values (at minimum set `ANTHROPIC_API_KEY` for live analysis).
4. Start locally:
   ```bash
   npm run dev
   ```

## API

### `POST /webhooks/github`
Expected to receive GitHub pull request webhook payloads (`opened`, `reopened`, `synchronize`).

### `GET /reviews/:prId`
Returns latest review for a PR ID. For repos with overlapping PR numbers, pass `?repo=owner/name`.

### `GET /stats`
Returns totals for queued/processing/completed/failed reviews and average completed review duration.

## Testing

```bash
npm test
```

## Next steps to productionize

- Verify webhook signatures (`X-Hub-Signature-256`)
- Add retries/dead-letter queue policy
- Add auth for read endpoints
- Add frontend dashboard for review browsing and diff highlighting
- Add metrics/monitoring (queue depth, error rates, latency)
