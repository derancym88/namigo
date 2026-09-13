import { NextResponse, type NextRequest } from 'next/server';
import { UNLOCK_COOKIE, licenceHolds, verifyUnlockToken } from '@/lib/ownerlock';

/**
 * Blocks protected routes unless a valid owner unlock cookie is present.
 *
 * Webhook endpoints are deliberately exempt: Stripe and n8n carry their own
 * signature/secret checks and must stay callable while the app is locked.
 */

const PUBLIC_PATHS = [
  '/owner-lock',
  '/api/owner-lock',
  '/api/webhooks/stripe',
  '/api/n8n/webhook',
  '/api/health',
];

export async function middleware(request: NextRequest) {
  const protectionEnabled = process.env.NAMIGO_OWNER_PROTECTION === 'enabled';
  if (!protectionEnabled) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const lockcode = process.env.NAMIGO_OWNER_LOCKCODE ?? '';
  const unlocked = await verifyUnlockToken(request.cookies.get(UNLOCK_COOKIE)?.value, lockcode);
  if (unlocked) return NextResponse.next();

  const licensed = licenceHolds({
    host: request.headers.get('host') ?? '',
    licenseDomain: process.env.NAMIGO_LICENSE_DOMAIN ?? '',
    licenseServerIp: process.env.NAMIGO_LICENSE_SERVER_IP ?? '',
    deploymentIp: process.env.NAMIGO_DEPLOYMENT_IP ?? '',
  });

  const url = request.nextUrl.clone();
  url.pathname = '/owner-lock';
  url.search = licensed ? '' : '?reason=licence';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets).*)'],
};
