import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().regex(/^[A-Za-z0-9_-]{1,256}$/),
  CRON_SECRET: z.string().min(16),
  VK_TOKEN: z.string().min(1),
  VK_API_VERSION: z.string().default('5.199'),
  VK_DOMAIN: z.string().default('grodno_airsoft'),
  PUBLIC_URL: z.url().optional(),
});
export const env = schema.parse(process.env);
