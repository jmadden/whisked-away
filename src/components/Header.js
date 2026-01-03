import Link from 'next/link';
import { getCart } from '@/lib/cart/actions';

export default async function Header() {
  const cart = await getCart();
  const qty = cart?.totalQuantity || 0;

  return (
    <header className='border-b border-gray-200'>
      <div className='mx-auto flex max-w-6xl items-center justify-between px-6 py-4'>
        <Link href='/' className='text-sm font-semibold tracking-tight'>
          Whisked Away
        </Link>

        <nav className='flex items-center gap-6 text-sm'>
          <Link href='/products' className='text-gray-700 hover:text-gray-900'>
            Products
          </Link>
          <Link href='/cart' className='text-gray-700 hover:text-gray-900'>
            Cart <span className='text-gray-500'>({qty})</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
