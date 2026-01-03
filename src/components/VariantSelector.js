'use client';

export default function VariantSelector({ variants, value, onChange }) {
  return (
    <label className='block'>
      <span className='text-sm font-medium text-gray-900'>Variant</span>
      <select
        className='mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm'
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {variants.map(v => (
          <option key={v.id} value={v.id} disabled={!v.availableForSale}>
            {v.title} {!v.availableForSale ? '(Sold out)' : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
