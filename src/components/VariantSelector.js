'use client';

import { useEffect, useMemo, useState } from 'react';

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

function findMatchingVariant(variants, selected) {
  return (
    variants.find(v =>
      (v.selectedOptions || []).every(opt => selected[opt.name] === opt.value)
    ) || null
  );
}

export default function VariantSelector({
  options,
  variants,
  onVariantChange,
}) {
  const trivial = isTrivialShopifyOptions(options);

  const initialSelected = useMemo(() => {
    const obj = {};
    (options || []).forEach(o => {
      obj[o.name] = o.values?.[0] ?? '';
    });
    return obj;
  }, [options]);

  const [selected, setSelected] = useState(initialSelected);

  // If options change, reset selection to the new defaults
  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected]);

  const matchingVariant = useMemo(() => {
    return findMatchingVariant(variants || [], selected);
  }, [variants, selected]);

  useEffect(() => {
    onVariantChange?.({ selected, variant: matchingVariant });
  }, [selected, matchingVariant, onVariantChange]);

  if (trivial) return null;

  return (
    <div className='space-y-4'>
      {options.map(opt => (
        <label key={opt.name} className='block'>
          <div className='text-sm font-medium text-gray-900'>{opt.name}</div>
          <select
            className='input mt-2'
            value={selected[opt.name] || ''}
            onChange={e =>
              setSelected(prev => ({ ...prev, [opt.name]: e.target.value }))
            }
          >
            {(opt.values || []).map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      ))}

      {matchingVariant ? (
        <div className='muted'>
          Selected:{' '}
          <span className='text-gray-900'>{matchingVariant.title}</span>
          {!matchingVariant.availableForSale ? (
            <span className='ml-2 text-red-600'>(Sold out)</span>
          ) : null}
        </div>
      ) : (
        <div className='text-sm text-red-600'>
          This option combo is unavailable.
        </div>
      )}
    </div>
  );
}
