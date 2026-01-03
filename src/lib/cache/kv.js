// src/lib/cache/kv.js
import { Redis } from '@upstash/redis';

// Loads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env.  [oai_citation:2‡Upstash: Serverless Data Platform](https://upstash.com/docs/redis/howto/connectwithupstashredis?utm_source=chatgpt.com)
const redis = Redis.fromEnv();

const PREFIX = 'wa:';

function keyOf(key) {
  return `${PREFIX}${key}`;
}

export async function kvGetJSON(key) {
  return await redis.get(keyOf(key));
}

export async function kvSetJSON(key, value, { ttlSeconds } = {}) {
  const k = keyOf(key);

  // Upstash REST supports EX seconds via set options.
  if (ttlSeconds) {
    await redis.set(k, value, { ex: ttlSeconds });
  } else {
    await redis.set(k, value);
  }
}
