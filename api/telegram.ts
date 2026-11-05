import { timingSafeEqual } from 'node:crypto';
import { env } from '../src/lib/env.js';
import { bot } from '../src/telegram/bot.js';

export async function POST(request: Request) {
  const actual = Buffer.from(request.headers.get('x-telegram-bot-api-secret-token') ?? '');
  const expected = Buffer.from(env.TELEGRAM_WEBHOOK_SECRET);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await bot.handleUpdate(await request.json());
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Webhook failed', error);
    return Response.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
