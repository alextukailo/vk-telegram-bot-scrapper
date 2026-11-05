import axios from 'axios';
import { QueryClient } from '@tanstack/query-core';
import { env } from '../lib/env.js';
import { normalizePost, type NormalizedPost, type VkPostRaw } from './types.js';

const http = axios.create({ baseURL: 'https://api.vk.com/method', timeout: 12000 });
const queries = new QueryClient({ defaultOptions: { queries: { retry: 2, staleTime: 0 } } });

async function requestPosts(): Promise<NormalizedPost[]> {
  const { data } = await http.get<{ response?: { items: VkPostRaw[] }; error?: { error_code: number; error_msg: string } }>('/wall.get', {
    params: { domain: env.VK_DOMAIN, count: 100, access_token: env.VK_TOKEN, v: env.VK_API_VERSION },
  });
  // VK sometimes reports API failures in HTTP 200 responses.
  if (data.error) throw new Error(`VK API ${data.error.error_code}: ${data.error.error_msg}`);
  if (!Array.isArray(data.response?.items)) throw new Error('Unexpected VK API response');
  return data.response.items.map(normalizePost).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function getLatestPosts(): Promise<NormalizedPost[]> {
  // A new cache key per invocation is not needed: staleTime:0 requests fresh data.
  return queries.fetchQuery({ queryKey: ['vk', 'wall', env.VK_DOMAIN], queryFn: requestPosts, staleTime: 0, retry: 2 });
}
