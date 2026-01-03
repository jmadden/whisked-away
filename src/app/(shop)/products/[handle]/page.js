import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { shopifyFetch } from '@/lib/shopify/client';
import { PRODUCT_BY_HANDLE_QUERY } from '@/lib/shopify/queries';
import { addToCart } from '@/lib/cart/actions';

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

function pickDefaultVariant(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  return variants.find(v => v.availableForSale) || variants[0];
}

export default async function ProductDetailPage({ params }) {
  // Next.js: params can be a Promise, so unwrap it before accessing properties.  [oai_citation:1‡Next.js](https://nextjs.org/docs/messages/sync-dynamic-apis?utm_source=chatgpt.com)
  const { handle } = await params;

  if (typeof handle !== 'string' || handle.trim().length === 0) {
    return notFound();
  }

  const data = await shopifyFetch({
    query: PRODUCT_BY_HANDLE_QUERY,
    variables: { handle },
    cache: 'no-store',
  });

  const product = data?.productByHandle;
  if (!product) return notFound();

  const variants = product?.variants?.nodes ?? [];
  const selectedVariant = pickDefaultVariant(variants);

  const images = product?.images?.nodes ?? [];
  const hero = product?.featuredImage || images[0] || null;

  const price = selectedVariant?.price;
  const priceLabel = price
    ? formatMoney(price.amount, price.currencyCode)
    : null;

  return (
    <main className='mx-auto max-w-5xl px-6 py-10'>
      <div className='mb-6'>
        <Link
          href='/products'
          className='text-sm text-gray-600 hover:underline'
        >
          ← Back to products
        </Link>
      </div>

      <div className='grid gap-10 lg:grid-cols-2'>
        <div className='relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50'>
          {hero?.url ? (
            <Image
              src={hero.url}
              alt={hero.altText || product.title}
              fill
              className='object-cover'
              sizes='(max-width: 1024px) 100vw, 50vw'
            />
          ) : (
            <div className='aspect-square w-full' />
          )}
        </div>

        <div>
          <h1 className='text-3xl font-semibold tracking-tight'>
            {product.title}
          </h1>

          {priceLabel ? (
            <div className='mt-3 text-lg font-medium text-gray-900'>
              {priceLabel}
            </div>
          ) : (
            <div className='mt-3 text-sm text-gray-500'>Price unavailable</div>
          )}

          {product.description ? (
            <p className='mt-6 whitespace-pre-line text-sm leading-6 text-gray-700'>
              {product.description}
            </p>
          ) : (
            <p className='mt-6 text-sm text-gray-500'>
              No description available.
            </p>
          )}

          <div className='mt-8 rounded-xl border border-gray-200 p-4'>
            <div className='text-sm font-medium text-gray-900'>Variant</div>
            <div className='mt-2 text-sm text-gray-700'>
              {selectedVariant ? selectedVariant.title : 'Unavailable'}
            </div>

            <form action={addToCart} className='mt-4'>
              <input
                type='hidden'
                name='merchandiseId'
                value={selectedVariant?.id || ''}
              />
              <input type='hidden' name='quantity' value='1' />

              <button
                type='submit'
                disabled={!selectedVariant?.availableForSale}
                className='w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60'
              >
                Add to cart
              </button>
            </form>

            <div className='mt-3 text-xs text-gray-500'>
              Cart wiring comes next (Shopify cartCreate + cartLinesAdd).
            </div>
          </div>

          {images.length > 1 ? (
            <div className='mt-8'>
              <div className='text-sm font-medium text-gray-900'>
                More images
              </div>
              <div className='mt-3 grid grid-cols-3 gap-3'>
                {images.slice(0, 6).map(img => (
                  <div
                    key={img.url}
                    className='relative h-28 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50'
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || product.title}
                      fill
                      className='object-cover'
                      sizes='(max-width: 1024px) 33vw, 20vw'
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
