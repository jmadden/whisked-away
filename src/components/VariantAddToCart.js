'use client';

import { useMemo, useState } from 'react';
import VariantSelector from './VariantSelector';

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

function isTrivialShopifyOptions(options) {
  if (!Array.isArray(options) || options.length === 0) return true;

  if (
    options.length === 1 &&
    String(options[0]?.name || '').toLowerCase() === 'title' &&
    Array.isArray(options[0]?.values) &&
    options[0].values.length === 1 &&
    String(options[0].values[0] || '').toLowerCase() === 'default title'
  ) {
    return true;
  }

  return false;
}

export default function VariantAddToCart({
  productTitle,
  productOptions,
  variants,
  defaultVariant,
  addToCartAction,
}) {
  const initial = useMemo(
    () => defaultVariant || variants?.[0] || null,
    [defaultVariant, variants]
  );
  const [chosen, setChosen] = useState(initial);

  const hasRealOptions = !isTrivialShopifyOptions(productOptions);

  const priceLabel =
    chosen?.price?.amount && chosen?.price?.currencyCode
      ? formatMoney(chosen.price.amount, chosen.price.currencyCode)
      : '';

  return (
    <div>
      {/* Summary row */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          {hasRealOptions ? (
            <>
              <div className='text-sm font-medium text-gray-900'>
                Choose options
              </div>
              <div className='muted mt-1'>
                {chosen ? chosen.title : 'Unavailable'}
              </div>
            </>
          ) : (
            <>
              <div className='text-sm font-medium text-gray-900'>Item</div>
              <div className='mt-1 text-sm text-gray-900'>1 {productTitle}</div>
            </>
          )}
        </div>

        {priceLabel ? (
          <div className='text-sm font-medium text-gray-900'>{priceLabel}</div>
        ) : null}
      </div>

      {/* Option selector only when meaningful */}
      {hasRealOptions ? (
        <div className='mt-4'>
          <VariantSelector
            options={productOptions}
            variants={variants}
            onVariantChange={({ variant }) => setChosen(variant)}
          />
        </div>
      ) : null}

      <form action={addToCartAction} className='mt-5'>
        <input type='hidden' name='merchandiseId' value={chosen?.id || ''} />
        <input type='hidden' name='quantity' value='1' />

        <button
          type='submit'
          className='btn btn-primary w-full'
          disabled={!chosen?.id || !chosen?.availableForSale}
        >
          Add to cart
        </button>

        {!chosen?.id ? (
          <div className='mt-2 text-sm text-red-600'>
            Select options to continue.
          </div>
        ) : null}
      </form>
    </div>
  );
}
