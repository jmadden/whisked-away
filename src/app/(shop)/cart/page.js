import Link from 'next/link';
import { getCart, removeCartLine, updateCartLine } from '@/lib/cart/actions';

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

export default async function CartPage() {
  const cart = await getCart();

  if (!cart || cart.totalQuantity === 0) {
    return (
      <main className='mx-auto max-w-3xl px-6 py-10'>
        <h1 className='text-3xl font-semibold'>Cart</h1>
        <p className='mt-4 text-gray-600'>Your cart is empty.</p>
        <Link className='mt-6 inline-block underline' href='/products'>
          Continue shopping
        </Link>
      </main>
    );
  }

  return (
    <main className='mx-auto max-w-3xl px-6 py-10'>
      <h1 className='text-3xl font-semibold'>Cart</h1>

      <ul className='mt-8 space-y-4'>
        {cart.lines.nodes.map(line => {
          const variant = line.merchandise;
          const product = variant.product;

          return (
            <li key={line.id} className='rounded-xl border border-gray-200 p-4'>
              <div className='flex items-start gap-4'>
                {product.featuredImage?.url ? (
                  <img
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText || product.title}
                    className='h-20 w-20 rounded-lg object-cover'
                    loading='lazy'
                  />
                ) : (
                  <div className='h-20 w-20 rounded-lg bg-gray-100' />
                )}

                <div className='flex-1'>
                  <Link
                    href={`/products/${product.handle}`}
                    className='font-medium text-gray-900 hover:underline'
                  >
                    {product.title}
                  </Link>

                  <div className='mt-1 text-sm text-gray-600'>
                    Variant: {variant.title}
                  </div>

                  <div className='mt-3 flex flex-wrap items-center gap-3'>
                    <form
                      action={updateCartLine}
                      className='flex items-center gap-2'
                    >
                      <input type='hidden' name='lineId' value={line.id} />
                      <label className='text-sm text-gray-600'>Qty</label>
                      <input
                        name='quantity'
                        type='number'
                        min='1'
                        defaultValue={line.quantity}
                        className='w-20 rounded-md border border-gray-200 px-2 py-1 text-sm'
                      />
                      <button className='rounded-md border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50'>
                        Update
                      </button>
                    </form>

                    <form action={removeCartLine}>
                      <input type='hidden' name='lineId' value={line.id} />
                      <button className='text-sm text-red-600 hover:underline'>
                        Remove
                      </button>
                    </form>
                  </div>
                </div>

                <div className='text-sm text-gray-900'>
                  {formatMoney(
                    variant.price.amount,
                    variant.price.currencyCode
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className='mt-8 flex items-center justify-between rounded-xl border border-gray-200 p-4'>
        <div className='text-sm text-gray-700'>
          Subtotal:{' '}
          <span className='font-medium text-gray-900'>
            {formatMoney(
              cart.cost.subtotalAmount.amount,
              cart.cost.subtotalAmount.currencyCode
            )}
          </span>
        </div>

        <a
          href={cart.checkoutUrl}
          className='rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800'
          target='_blank'
          rel='noreferrer'
        >
          Checkout
        </a>
      </div>
    </main>
  );
}
