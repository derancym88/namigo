import { NextResponse } from 'next/server';
import { supabaseAdminEnabled } from '@/lib/config';
import { createPasscode, listPasscodes, verifyOwnerPin } from '@/lib/passcodes';
import { isAdminUser, userFromToken } from '@/lib/supabase';

export const runtime = 'nodejs';

/**
 * Admin authorisation has two modes, per the manual:
 *  - Supabase mode: a logged-in user listed in public.admin_settings.
 *  - Temporary mode: the server-side owner PIN.
 */
async function authorise(request: Request, pin: string): Promise<string | null> {
  if (supabaseAdminEnabled) {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return 'Sign in as an admin user first.';
    const user = await userFromToken(token);
    if (!user) return 'Session is not valid.';
    if (!(await isAdminUser(user.id))) return 'This account is not an admin.';
    return null;
  }

  if (!verifyOwnerPin(pin)) return 'Owner PIN is incorrect.';
  return null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const denied = await authorise(request, String(body?.pin ?? ''));
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const label = String(body?.label ?? '').trim();
  const maxUses = Number(body?.maxUses ?? 1);
  const expiryDays = Number(body?.expiryDays ?? 7);

  if (!label) return NextResponse.json({ error: 'Label is required.' }, { status: 400 });
  if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 500) {
    return NextResponse.json({ error: 'Max uses must be between 1 and 500.' }, { status: 400 });
  }
  if (!Number.isInteger(expiryDays) || expiryDays < 1 || expiryDays > 365) {
    return NextResponse.json({ error: 'Expiry must be between 1 and 365 days.' }, { status: 400 });
  }

  const { code, record } = await createPasscode({ label, maxUses, expiryDays });

  // The plaintext code is returned exactly once and never stored.
  return NextResponse.json({
    code,
    passcode: { id: record.id, label: record.label, expires_at: record.expires_at },
  });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  const denied = await authorise(request, String(body?.pin ?? ''));
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const passcodes = await listPasscodes();
  return NextResponse.json({
    passcodes: passcodes.map((p) => ({
      id: p.id,
      label: p.label,
      max_uses: p.max_uses,
      uses_count: p.uses_count,
      expires_at: p.expires_at,
      revoked: p.revoked,
      created_at: p.created_at,
    })),
  });
}
