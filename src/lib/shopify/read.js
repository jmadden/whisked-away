// src/lib/shopify/read.js
import { shopifyFetch } from '@/lib/shopify/client';
import { PRODUCTS_QUERY, PRODUCT_BY_HANDLE_QUERY } from '@/lib/shopify/queries';
import { kvGetJSON, kvSetJSON } from '@/lib/cache/kv';

const TTL_PRODUCTS_SECONDS = 60;
const TTL_PRODUCT_SECONDS = 300;

export async function getProductsCached({
  first = 12,
  after = null,
  last = null,
  before = null,
  query = null,
  sortKey = null,
  reverse = null,
}) {
  const cacheKey =
    `shopify:products:` +
    `first=${first ?? ''}:after=${after ?? ''}:` +
    `last=${last ?? ''}:before=${before ?? ''}:` +
    `q=${query || ''}:sort=${sortKey || ''}:rev=${reverse ?? ''}`;

  const cached = await kvGetJSON(cacheKey);
  if (cached) console.log('UPSTASH cache hit:', cacheKey);
  else console.log('UPSTASH cache miss:', cacheKey);
  if (cached) return cached;

  const data = await shopifyFetch({
    query: PRODUCTS_QUERY,
    variables: { first, after, last, before, query, sortKey, reverse },
    cache: 'no-store',
  });

  await kvSetJSON(cacheKey, data, { ttlSeconds: TTL_PRODUCTS_SECONDS });
  return data;
}

export async function getProductByHandleCached(handle) {
  const cacheKey = `shopify:product:handle=${handle}`;

  const cached = await kvGetJSON(cacheKey);
  if (cached) console.log('UPSTASH cache hit:', cacheKey);
  else console.log('UPSTASH cache miss:', cacheKey);

  if (cached) return cached;

  const data = await shopifyFetch({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
    cache: 'no-store',
  });

  await kvSetJSON(cacheKey, data, { ttlSeconds: TTL_PRODUCT_SECONDS });
  return data;
}
