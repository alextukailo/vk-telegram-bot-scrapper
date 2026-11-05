import { Telegraf } from 'telegraf';
import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';

export const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

bot.start(async (ctx) => {
  if (ctx.chat.type !== 'private') return ctx.reply('Откройте личный чат с ботом для подписки.');
  await prisma.subscriber.upsert({
    where: { chatId: BigInt(ctx.chat.id) },
    create: { chatId: BigInt(ctx.chat.id), active: true },
    update: { active: true },
  });
  return ctx.reply('👋 Привет! Вы подписаны на новости Grodno Airsoft.\n\nЯ отправлю новые публикации из ВКонтакте автоматически.\n\nКоманды:\n/status — статус подписки\n/stop — отключить уведомления\n/latest — последняя публикация');
});

bot.command('stop', async (ctx) => {
  await prisma.subscriber.updateMany({ where: { chatId: BigInt(ctx.chat.id) }, data: { active: false } });
  return ctx.reply('🔕 Уведомления отключены. Чтобы снова подписаться, отправьте /start.');
});

bot.command('status', async (ctx) => {
  const subscriber = await prisma.subscriber.findUnique({ where: { chatId: BigInt(ctx.chat.id) } });
  return ctx.reply(subscriber?.active ? '✅ Подписка активна. Новые публикации будут приходить автоматически.' : '🔕 Подписка не активна. Отправьте /start, чтобы включить уведомления.');
});

bot.command('latest', async (ctx) => {
  const latest = await prisma.vkPost.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!latest) return ctx.reply('Пока нет сохранённых публикаций. Попробуйте позже.');
  return ctx.reply(`📰 Последняя публикация:\n\n${latest.text.slice(0, 3400)}\n\n${latest.link}`);
});

bot.help((ctx) => ctx.reply('Команды бота:\n/start — подписаться\n/stop — отписаться\n/status — проверить подписку\n/latest — последняя публикация\n/help — помощь'));

bot.catch((err) => console.error('Telegram bot handler failed:', err));
