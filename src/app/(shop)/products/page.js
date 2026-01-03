// src/app/(shop)/products/page.js

import Link from 'next/link';
import ProductGrid from '@/components/ProductGrid';
import { getProductsCached } from '@/lib/shopify/read';

function formatMoney(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(n);
  } catch {
    return `${amount} ${currency || ''}`.trim();
  }
}

function quoteIfNeeded(value) {
  if (!value) return '';
  return /[\s:]/.test(value) ? `"${value.replaceAll('"', '\\"')}"` : value;
}

function parseSort(sort) {
  switch (sort) {
    case 'title-asc':
      return { sortKey: 'TITLE', reverse: false };
    case 'title-desc':
      return { sortKey: 'TITLE', reverse: true };
    case 'price-asc':
      return { sortKey: 'PRICE', reverse: false };
    case 'price-desc':
      return { sortKey: 'PRICE', reverse: true };
    case 'newest':
      return { sortKey: 'CREATED_AT', reverse: true };
    default:
      return { sortKey: null, reverse: null };
  }
}

function buildShopifyQuery({ q, type, inStock }) {
  const parts = [];
  if (q) parts.push(q);
  if (type) parts.push(`product_type:${quoteIfNeeded(type)}`);
  if (inStock) parts.push('available_for_sale:true');
  return parts.length ? parts.join(' AND ') : null;
}

export default async function ProductsPage({ searchParams }) {
  const sp = await searchParams;

  const pageSize = 12;

  const after = typeof sp?.after === 'string' ? sp.after : null;
  const before = typeof sp?.before === 'string' ? sp.before : null;

  // Filters
  const q = typeof sp?.q === 'string' ? sp.q.trim() : '';
  const type = typeof sp?.type === 'string' ? sp.type.trim() : '';
  const inStock = sp?.inStock === '1';

  // Sorting
  const sort = typeof sp?.sort === 'string' ? sp.sort : '';
  const { sortKey, reverse } = parseSort(sort);

  const query = buildShopifyQuery({ q, type, inStock });

  // If going back, use last+before. Otherwise use first+after.
  const pagingVars = before
    ? { first: null, after: null, last: pageSize, before }
    : { first: pageSize, after, last: null, before: null };

  const data = await getProductsCached({
    ...pagingVars,
    query,
    sortKey,
    reverse,
  });

  const products = (data?.products?.nodes ?? []).map(p => ({
    ...p,
    displayPrice: formatMoney(
      p?.priceRange?.minVariantPrice?.amount,
      p?.priceRange?.minVariantPrice?.currencyCode
    ),
    firstVariantId: p?.variants?.nodes?.[0]?.id || null,
  }));

  const pageInfo = data?.products?.pageInfo ?? {};
  const { hasNextPage, endCursor, hasPreviousPage, startCursor } = pageInfo;

  // Preserve filters in pagination URLs
  const baseParams = new URLSearchParams();
  if (q) baseParams.set('q', q);
  if (type) baseParams.set('type', type);
  if (inStock) baseParams.set('inStock', '1');
  if (sort) baseParams.set('sort', sort);

  const nextHref =
    hasNextPage && endCursor
      ? `/products?${new URLSearchParams({
          ...Object.fromEntries(baseParams),
          after: endCursor,
        }).toString()}`
      : null;

  const prevHref =
    hasPreviousPage && startCursor
      ? `/products?${new URLSearchParams({
          ...Object.fromEntries(baseParams),
          before: startCursor,
        }).toString()}`
      : null;

  return (
    <main className='container-page'>
      <div className='flex flex-col gap-6 md:flex-row md:items-end md:justify-between'>
        <div>
          <h1>Products</h1>
          <p className='muted mt-2'>Filter Whisked Away’s baking supplies.</p>
        </div>

        <form
          method='GET'
          action='/products'
          className='card flex flex-col gap-3 p-4 md:flex-row md:items-end'
        >
          <div className='min-w-[220px]'>
            <label className='text-sm font-medium text-gray-900'>Search</label>
            <input
              name='q'
              defaultValue={q}
              className='input mt-2'
              placeholder='whisk, flour, pan…'
            />
          </div>

          <div className='min-w-[200px]'>
            <label className='text-sm font-medium text-gray-900'>Type</label>
            <input
              name='type'
              defaultValue={type}
              className='input mt-2'
              placeholder='e.g. "Tools"'
            />
          </div>

          <div className='min-w-[180px]'>
            <label className='text-sm font-medium text-gray-900'>Sort</label>
            <select name='sort' defaultValue={sort} className='input mt-2'>
              <option value=''>Default</option>
              <option value='title-asc'>Title (A–Z)</option>
              <option value='title-desc'>Title (Z–A)</option>
              <option value='price-asc'>Price (Low–High)</option>
              <option value='price-desc'>Price (High–Low)</option>
              <option value='newest'>Newest</option>
            </select>
          </div>

          <label className='mt-2 flex items-center gap-2 text-sm text-gray-700 md:mt-0'>
            <input
              type='checkbox'
              name='inStock'
              value='1'
              defaultChecked={inStock}
            />
            In stock only
          </label>

          <button className='btn btn-primary md:ml-2' type='submit'>
            Apply
          </button>

          <Link className='btn btn-secondary' href='/products'>
            Reset
          </Link>
        </form>
      </div>

      <div className='mt-8'>
        <ProductGrid products={products} />
      </div>

      <div className='mt-10 flex items-center justify-center gap-3 text-sm'>
        {prevHref ? (
          <Link className='btn btn-secondary' href={prevHref}>
            Previous
          </Link>
        ) : (
          <span className='text-gray-400'>Previous</span>
        )}

        {nextHref ? (
          <Link className='btn btn-secondary' href={nextHref}>
            Next
          </Link>
        ) : (
          <span className='text-gray-400'>Next</span>
        )}
      </div>
    </main>
  );
}
