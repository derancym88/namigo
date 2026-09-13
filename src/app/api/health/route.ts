import { NextResponse } from 'next/server';
import { ownerProtection, supabaseEnabled } from '@/lib/config';

export const dynamic = 'force-dynamic';

/** Liveness probe used by the Docker healthcheck and nginx upstream checks. */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    product: ownerProtection.productName,
    build: ownerProtection.buildFingerprint,
    supabase_mode: supabaseEnabled,
    time: new Date().toISOString(),
  });
}
