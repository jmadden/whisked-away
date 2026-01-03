// src/proxy.js
import { NextResponse } from 'next/server';
import { get } from '@vercel/edge-config';

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/maintenance'
  ) {
    return NextResponse.next();
  }

  const maintenanceMode = await get('maintenanceMode');

  if (maintenanceMode === true) {
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    return NextResponse.rewrite(url);
  }

  const res = NextResponse.next();
  res.headers.set('x-maintenance-mode', String(maintenanceMode === true));
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
