import axios from 'axios';
import { env } from '../src/lib/env.js';

if (!env.PUBLIC_URL) throw new Error('Set PUBLIC_URL to the deployed HTTPS domain');
const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`;
const { data } = await axios.post(url, {
  url: `${env.PUBLIC_URL.replace(/\/$/, '')}/api/telegram`,
  secret_token: env.TELEGRAM_WEBHOOK_SECRET,
  allowed_updates: ['message'],
});
if (!data.ok) throw new Error(`Telegram rejected webhook: ${JSON.stringify(data)}`);
console.log('Telegram webhook registered successfully');
