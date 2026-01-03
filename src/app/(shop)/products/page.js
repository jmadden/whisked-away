import Link from 'next/link';
import ProductGrid from '@/components/ProductGrid';
import { shopifyFetch } from '@/lib/shopify/client';
import { PRODUCTS_QUERY } from '@/lib/shopify/queries';

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

export default async function ProductsPage({ searchParams }) {
  // Next.js: searchParams can be a Promise; unwrap before accessing properties.
  const sp = await searchParams;

  const first = 12;
  const after = typeof sp?.after === 'string' ? sp.after : null;

  const data = await shopifyFetch({
    query: PRODUCTS_QUERY,
    variables: { first, after },
    cache: 'no-store',
  });

  const products = (data?.products?.nodes ?? []).map(p => ({
    ...p,
    displayPrice: formatMoney(
      p?.priceRange?.minVariantPrice?.amount,
      p?.priceRange?.minVariantPrice?.currencyCode
    ),
    firstVariantId: p?.variants?.nodes?.[0]?.id || null,
  }));

  const { hasNextPage, endCursor } = data?.products?.pageInfo ?? {};

  return (
    <main className='mx-auto max-w-6xl px-6 py-10'>
      <div className='flex items-end justify-between gap-6'>
        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>Products</h1>
          <p className='mt-2 text-sm text-gray-600'>
            Baking tools, ingredients, and supplies for Whisked Away.
          </p>
        </div>
      </div>

      <div className='mt-8'>
        <ProductGrid products={products} />
      </div>

      <div className='mt-10 flex items-center justify-center gap-3 text-sm'>
        {hasNextPage && endCursor ? (
          <Link
            className='rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50'
            href={`/products?after=${encodeURIComponent(endCursor)}`}
          >
            Next
          </Link>
        ) : (
          <span className='text-gray-500'>End</span>
        )}
      </div>
    </main>
  );
}
