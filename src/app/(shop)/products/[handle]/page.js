import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProductByHandleCached } from '@/lib/shopify/read';
import { PRODUCT_BY_HANDLE_QUERY } from '@/lib/shopify/queries';
import { addToCart } from '@/lib/cart/actions';
import VariantSelector from '@/components/VariantSelector';
import VariantAddToCart from '@/components/VariantAddToCart';

function formatMoney(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
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
  const { handle } = await params;

  if (typeof handle !== 'string' || handle.trim().length === 0)
    return notFound();

  const data = await getProductByHandleCached(handle);

  const product = data?.productByHandle;
  if (!product) return notFound();

  const variants = product?.variants?.nodes ?? [];
  const defaultVariant = pickDefaultVariant(variants);

  const images = product?.images?.nodes ?? [];
  const hero = product?.featuredImage || images[0] || null;

  return (
    <main className='container-page max-w-5xl'>
      <div className='mb-6'>
        <Link href='/products' className='btn-link text-sm'>
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
          <h1>{product.title}</h1>

          {defaultVariant?.price ? (
            <div className='mt-3 text-lg font-medium text-gray-900'>
              {formatMoney(
                defaultVariant.price.amount,
                defaultVariant.price.currencyCode
              )}
            </div>
          ) : (
            <div className='mt-3 text-sm text-gray-500'>Price unavailable</div>
          )}

          {product.description ? (
            <p className='mt-6 whitespace-pre-line'>{product.description}</p>
          ) : (
            <p className='mt-6 text-gray-500'>No description available.</p>
          )}

          <div className='card mt-8 p-5'>
            <VariantAddToCart
              productTitle={product.title}
              productOptions={product.options}
              variants={variants}
              defaultVariant={defaultVariant}
              addToCartAction={addToCart}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
