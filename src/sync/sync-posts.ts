import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { getLatestPosts } from '../vk/client.js';
import { deliverPending } from '../telegram/delivery.js';

export async function syncPosts() {
  const key = 'grodno_airsoft';
  const owner = randomUUID();
  const now = new Date();
  await prisma.syncState.upsert({ where: { key }, create: { key }, update: {} });
  const lease = await prisma.syncState.updateMany({
    where: { key, OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }] },
    data: { leaseOwner: owner, leaseExpiresAt: new Date(now.getTime() + 55_000) },
  });
  if (!lease.count) return { skipped: true, reason: 'Sync already running' };
  try {
    const posts = await getLatestPosts();
    const state = await prisma.syncState.findUniqueOrThrow({ where: { key } });
    let added = 0;
    // First successful scan saves baseline; it doesn't flood users with old news.
    for (const post of posts) {
      const created = await prisma.vkPost.createMany({
        data: [{ id: post.id, text: post.text, link: post.link, photoUrl: post.photoUrl, createdAt: post.createdAt }],
        skipDuplicates: true,
      });
      if (!created.count) continue;
      added++;
      if (!state.initialized) continue;
      const subscribers = await prisma.subscriber.findMany({ where: { active: true }, select: { chatId: true } });
      if (subscribers.length) await prisma.delivery.createMany({
        data: subscribers.map(({ chatId }) => ({ chatId, postId: post.id })),
        skipDuplicates: true,
      });
    }
    await prisma.syncState.update({ where: { key }, data: { initialized: true, lastRunAt: new Date() } });
    const deliveries = await deliverPending();
    return { skipped: false, postsChecked: posts.length, newPosts: added, baseline: !state.initialized, ...deliveries };
  } finally {
    await prisma.syncState.updateMany({ where: { key, leaseOwner: owner }, data: { leaseOwner: null, leaseExpiresAt: null } });
  }
}
