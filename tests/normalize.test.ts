import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePost } from '../src/vk/types.js';

test('normalizes VK post and chooses largest photo', () => {
  const post = normalizePost({
    id: 7, owner_id: -15, date: 1700000000, text: 'Привет!',
    attachments: [{ type: 'photo', photo: { sizes: [
      { width: 300, height: 300, url: 'small' },
      { width: 1000, height: 800, url: 'large' },
    ] } }],
  });
  assert.equal(post.id, '-15_7');
  assert.equal(post.photoUrl, 'large');
  assert.equal(post.link, 'https://vk.com/wall-15_7');
});
