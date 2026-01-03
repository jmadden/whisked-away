const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const version = process.env.SHOPIFY_API_VERSION || '2025-01';

if (!domain) throw new Error('Missing SHOPIFY_STORE_DOMAIN');
if (!token) throw new Error('Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN');

const endpoint = `https://${domain}/api/${version}/graphql.json`;

export async function shopifyFetch({
  query,
  variables = {},
  cache = 'no-store',
}) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    cache,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Shopify HTTP ${res.status}: ${text}`);
  }

  const json = JSON.parse(text);

  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}
