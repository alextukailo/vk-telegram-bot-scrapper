import { timingSafeEqual } from 'node:crypto';
import { env } from '../src/lib/env.js';
import { syncPosts } from '../src/sync/sync-posts.js';

function authorized(header: string | null) {
  const supplied = Buffer.from(header ?? '');
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function GET(request: Request) {
  if (!authorized(request.headers.get('authorization'))) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await syncPosts();
    return Response.json(result);
  } catch (error) {
    console.error('Synchronization failed', error);
    return Response.json({ error: 'Sync failed' }, { status: 500 });
  }
}
