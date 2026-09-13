import { NextResponse } from 'next/server';
import { ownerProtection } from '@/lib/config';
import { UNLOCK_COOKIE, UNLOCK_TTL_MS, issueUnlockToken, lockcodeMatches } from '@/lib/ownerlock';

export const runtime = 'nodejs';

/** Exchange the owner lockcode for a 12-hour signed unlock cookie. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const submitted = String(body?.lockcode ?? '');

  if (!ownerProtection.lockcode) {
    return NextResponse.json(
      { error: 'Owner lockcode is not configured on this deployment.' },
      { status: 503 },
    );
  }

  if (!lockcodeMatches(submitted, ownerProtection.lockcode)) {
    return NextResponse.json({ error: 'Invalid lockcode.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(UNLOCK_COOKIE, await issueUnlockToken(ownerProtection.lockcode), {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: UNLOCK_TTL_MS / 1000,
  });
  return response;
}

/** Explicit re-lock, used by the owner to drop the cookie early. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(UNLOCK_COOKIE);
  return response;
}
