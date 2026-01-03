// src/lib/cart/actions.js
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { shopifyFetch } from '@/lib/shopify/client';
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
} from '@/lib/shopify/queries';

const CART_COOKIE = 'wa_cart_id';

function throwIfUserErrors(payload, opName) {
  const errs = payload?.userErrors || [];
  if (errs.length) {
    throw new Error(`${opName} userErrors: ${JSON.stringify(errs)}`);
  }
}

async function getCartId() {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value || null;
}

async function setCartId(cartId) {
  const store = await cookies();
  store.set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14, // 14 days
  });
}

async function clearCartId() {
  const store = await cookies();
  store.set(CART_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function getCart() {
  const cartId = await getCartId();
  if (!cartId) return null;

  const data = await shopifyFetch({
    query: CART_QUERY,
    variables: { id: cartId },
    cache: 'no-store',
  });

  // If Shopify returns null (expired/invalid cart), clear cookie so UI recovers.
  if (!data?.cart) {
    await clearCartId();
    return null;
  }

  return data.cart;
}

async function getOrCreateCart() {
  const existing = await getCart();
  if (existing?.id) return existing;

  const data = await shopifyFetch({
    query: CART_CREATE_MUTATION,
    variables: { input: {} },
    cache: 'no-store',
  });

  throwIfUserErrors(data?.cartCreate, 'cartCreate');

  const cart = data?.cartCreate?.cart;
  if (!cart?.id) throw new Error('cartCreate returned no cart id');

  await setCartId(cart.id);
  return cart;
}

export async function addToCart(formData) {
  const merchandiseId = String(formData.get('merchandiseId') || '');
  const quantity = Number(formData.get('quantity') || 1);

  if (!merchandiseId) throw new Error('Missing merchandiseId');
  if (!Number.isFinite(quantity) || quantity < 1)
    throw new Error('Invalid quantity');

  const cart = await getOrCreateCart();

  const data = await shopifyFetch({
    query: CART_LINES_ADD_MUTATION,
    variables: {
      cartId: cart.id,
      lines: [{ merchandiseId, quantity }],
    },
    cache: 'no-store',
  });

  throwIfUserErrors(data?.cartLinesAdd, 'cartLinesAdd');

  revalidatePath('/cart');
  redirect('/cart');
}

export async function updateCartLine(formData) {
  const lineId = String(formData.get('lineId') || '');
  const quantity = Number(formData.get('quantity') || 1);

  if (!lineId) throw new Error('Missing lineId');
  if (!Number.isFinite(quantity) || quantity < 1)
    throw new Error('Invalid quantity');

  const cartId = await getCartId();
  if (!cartId) return;

  const data = await shopifyFetch({
    query: CART_LINES_UPDATE_MUTATION,
    variables: { cartId, lines: [{ id: lineId, quantity }] },
    cache: 'no-store',
  });

  throwIfUserErrors(data?.cartLinesUpdate, 'cartLinesUpdate');

  revalidatePath('/cart');
}

export async function removeCartLine(formData) {
  const lineId = String(formData.get('lineId') || '');
  if (!lineId) throw new Error('Missing lineId');

  const cartId = await getCartId();
  if (!cartId) return;

  const data = await shopifyFetch({
    query: CART_LINES_REMOVE_MUTATION,
    variables: { cartId, lineIds: [lineId] },
    cache: 'no-store',
  });

  throwIfUserErrors(data?.cartLinesRemove, 'cartLinesRemove');

  revalidatePath('/cart');
}
