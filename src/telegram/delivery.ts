import { bot } from './bot.js';
import { prisma } from '../lib/prisma.js';

export async function deliverPending(max = 50): Promise<{ sent: number; failed: number }> {
  const pending = await prisma.delivery.findMany({
    where: { status: { in: ['PENDING', 'FAILED'] }, attempts: { lt: 5 }, subscriber: { active: true } },
    include: { post: true },
    orderBy: { createdAt: 'asc' },
    take: max,
  });
  let sent = 0;
  let failed = 0;
  for (const delivery of pending) {
    const body = `📰 Новая публикация Grodno Airsoft\n\n${delivery.post.text}`;
    const msg = `${body.slice(0, 3700)}\n\n🔗 ${delivery.post.link}`;
    try {
      if (delivery.post.photoUrl) {
        // Text sent separately to avoid Telegram's shorter media-caption limit.
        await bot.telegram.sendPhoto(delivery.chatId.toString(), delivery.post.photoUrl);
      }
      await bot.telegram.sendMessage(delivery.chatId.toString(), msg, { link_preview_options: { is_disabled: true } });
      await prisma.delivery.update({ where: { id: delivery.id }, data: { status: 'SENT', attempts: { increment: 1 }, sentAt: new Date(), lastError: null } });
      sent++;
    } catch (error) {
      failed++;
      await prisma.delivery.update({ where: { id: delivery.id }, data: { status: 'FAILED', attempts: { increment: 1 }, lastError: String(error).slice(0, 2000) } });
      console.error('Delivery failed', { deliveryId: delivery.id, error: String(error) });
    }
  }
  return { sent, failed };
}
