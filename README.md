# VK → Telegram Bot

A TypeScript, serverless Telegram notification bot with Russian-language commands.

## Stack

- Vercel Functions (two endpoints)
- Telegraf webhook
- Axios + `@tanstack/query-core` (v5)
- VK `wall.get`
- PostgreSQL + Prisma 6
- External scheduler (cron-job.org)

## 1. Requirements

Node.js 22+, PostgreSQL database, Telegram bot token from BotFather, VK API access token that is permitted to call `wall.get` for `grodno_airsoft`, and a Vercel project.

**VK API access is not guaranteed for every token/account. Verify that `wall.get` works before deployment.** Playwright fallback is *not yet implemented* in this MVP.

## 2. Local setup

```bash
npm install
cp .env.example .env
# Edit .env with your credentials (do NOT commit it).
npm run db:push
npm run typecheck
npm test
npx vercel dev
```

`db:push` is for development/bootstrap. For production, create a reviewed Prisma migration and run `prisma migrate deploy` during deployment. Never use destructive migrations on an existing production DB without backups.

## 3. Production deployment

1. Create a Vercel project from this repository (Node.js 22+).
2. Configure all variables from `.env.example` in the Vercel dashboard. `PUBLIC_URL` must be the public production domain.
3. Provision a managed PostgreSQL database (use connection settings recommended by your provider for serverless connections).
4. Before production use, create and commit a Prisma migration (`npx prisma migrate dev --name init` against a *development* database). Apply it to production using `npx prisma migrate deploy` in a controlled release step, or use `prisma db push` for an initial nonproduction trial.
5. Deploy (`npx vercel --prod`).
6. On your machine, put the same vars into `.env`, then run `npm run webhook:set` (this calls Telegram `setWebhook`).
7. Configure cron-job.org to request `GET https://YOUR_DOMAIN/api/sync-posts` every 5 minutes with header `Authorization: Bearer YOUR_CRON_SECRET`.
8. Run the sync endpoint **once** after deployment to save baseline posts. The first successful sync does not notify users of historical posts.
9. Open Telegram and send `/start` to your bot. Future VK posts should arrive automatically when the scheduler runs.

## 4. Telegram commands (Russian)

- `/start` — подписаться на новости
- `/stop` — отключить уведомления
- `/status` — статус подписки
- `/latest` — последняя сохранённая публикация
- `/help` — помощь

## 5. API endpoints

- `POST /api/telegram` accepts Telegram webhook updates, protected by `X-Telegram-Bot-Api-Secret-Token`.
- `GET /api/sync-posts` performs VK check and sends pending deliveries, protected by bearer secret.

Example manual sync:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://YOUR_DOMAIN/api/sync-posts
```

## 6. Important MVP limitations

- Only the latest 100 posts are scanned per run: outages with more than 100 new posts can miss older ones. Add pagination/checkpoint logic for higher-volume communities.
- First successful check establishes the baseline; it intentionally doesn't send existing posts.
- Telegram is at-least-once delivery: if Telegram accepts a message but the function stops before recording it, retry may duplicate it.
- Current message includes first photo plus text/link. Additional photos, video, attachments and edits are not yet forwarded.
- Retrying a delivery after the photo succeeds but text fails can resend the photo. Upgrade to media-group delivery with step-level persistence if needed.
- Delivery is limited to 50 items per sync; larger audiences need batching/queue workers.
- A 55-second database lease prevents normal overlapping cron runs; a delayed function beyond that could overlap. Increase robustness with per-delivery claims and shorter jobs before scaling.
- Subscribers starting the bot after a post is discovered will not receive that historical post automatically.
- No Playwright fallback yet: first verify VK API credentials and access permissions.
- `@tanstack/query-core` is used for retries and fetching; PostgreSQL is the durable source of truth. Don't rely on its in-memory cache for deduplication.
- Never expose bot tokens, VK tokens, cron secret, or database URL in committed files or API responses.
