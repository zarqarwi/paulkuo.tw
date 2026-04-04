# Infrastructure Map

## Cloudflare Workers

| Worker 名稱 | Repo 路徑 | 部署指令 | Routes |
|-------------|----------|---------|--------|
| paulkuo-ticker | `worker/` | `wrangler deploy --config worker/wrangler.toml` | api.paulkuo.tw, mazu.today/* |
| paulkuo-eval | `eval-worker/` | `wrangler deploy --config eval-worker/wrangler.toml` | — |

## Cloudflare Pages

| 專案名稱 | Repo 路徑 | 部署方式 | Domain |
|----------|----------|---------|--------|
| paulkuo-tw | `/` (root) | `git push` → CI/CD | paulkuo.tw |

## Bindings (paulkuo-ticker)

| Type | Binding | Name / ID |
|------|---------|-----------|
| KV | `TICKER_KV` | `c066a2fd7942494c8ead37cc518b191b` |
| D1 | `AUTH_DB` | `paulkuo-auth` |
| R2 | `TQEF_AUDIO` | `tqef-audio` |

## Cron Triggers (paulkuo-ticker)

| Schedule | Purpose |
|----------|---------|
| `0 0-15,23 * * *` | Hourly — Fitbit, analytics, social, stock |
| `*/5 * * * *` | Every 5 min — Formosa GPS KV→D1 flush |

## Cloudflare Account

- Account ID: `4bf7e4b38d30ab7d4a191eefbf393133`
- Dashboard: https://dash.cloudflare.com/4bf7e4b38d30ab7d4a191eefbf393133/
- All Workers: paulkuo-ticker, paulkuo-eval, paulkuo-tw (Worker + Pages)
