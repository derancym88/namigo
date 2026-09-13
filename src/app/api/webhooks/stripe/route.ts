import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe as stripeConfig } from '@/lib/config';

export const runtime = 'nodejs';

/**
 * Stripe payment events. Verified by Stripe's own signature, so this route
 * stays reachable while the app is in owner-locked mode.
 */
export async function POST(request: Request) {
  if (!stripeConfig.secretKey || !stripeConfig.webhookSecret) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });

  const client = new Stripe(stripeConfig.secretKey);
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = client.webhooks.constructEvent(raw, signature, stripeConfig.webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ error: `Signature check failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // Credit allocation is applied once billing tables are live; until then
      // the operator tops up allocation manually against the invoice record.
      console.info('[stripe] checkout completed', event.id);
      break;
    case 'invoice.payment_failed':
      console.warn('[stripe] payment failed', event.id);
      break;
    default:
      console.info('[stripe] unhandled event', event.type);
  }

  return NextResponse.json({ received: true });
}
