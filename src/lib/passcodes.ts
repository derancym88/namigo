import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { ownerPin, passcodeStorePath, supabaseAdminEnabled } from './config';
import { readJson, writeJson } from './filestore';
import { serviceClient } from './supabase';

/**
 * Demo-kit passcodes.
 *
 * Only the SHA-256 hash of a passcode is ever stored. The plaintext is
 * returned exactly once, at generation time, and shown to the operator.
 */

export type Passcode = {
  id: string;
  label: string;
  code_hash: string;
  max_uses: number;
  uses_count: number;
  expires_at: string;
  revoked: boolean;
  created_at: string;
};

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1

export function hashCode(code: string): string {
  return createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
}

function block(): string {
  let out = '';
  for (let i = 0; i < 4; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export function generateCode(): string {
  return `NGX-${block()}-${block()}-${block()}`;
}

/** Constant-time owner PIN check for the no-Supabase admin path. */
export function verifyOwnerPin(candidate: string): boolean {
  if (!ownerPin) return false;
  const a = Buffer.from(String(candidate ?? ''));
  const b = Buffer.from(ownerPin);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function createPasscode(input: {
  label: string;
  maxUses: number;
  expiryDays: number;
}): Promise<{ code: string; record: Passcode }> {
  const code = generateCode();
  const now = new Date();
  const record: Passcode = {
    id: `pc_${now.getTime()}_${block().toLowerCase()}`,
    label: input.label,
    code_hash: hashCode(code),
    max_uses: input.maxUses,
    uses_count: 0,
    expires_at: new Date(now.getTime() + input.expiryDays * 86_400_000).toISOString(),
    revoked: false,
    created_at: now.toISOString(),
  };

  const db = supabaseAdminEnabled ? serviceClient() : null;
  if (db) {
    const { error } = await db.from('demo_passcodes').insert(record);
    if (error) throw new Error(`passcode insert failed: ${error.message}`);
  } else {
    const all = await readJson<Passcode[]>(passcodeStorePath, []);
    all.push(record);
    await writeJson(passcodeStorePath, all);
  }

  return { code, record };
}

export async function listPasscodes(): Promise<Passcode[]> {
  const db = supabaseAdminEnabled ? serviceClient() : null;
  if (db) {
    const { data } = await db
      .from('demo_passcodes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    return (data ?? []) as Passcode[];
  }
  const all = await readJson<Passcode[]>(passcodeStorePath, []);
  return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export type RedeemResult = { ok: true; passcodeId: string } | { ok: false; reason: string };

/** Validate a passcode and consume one use. */
export async function redeemPasscode(code: string): Promise<RedeemResult> {
  const hash = hashCode(code ?? '');
  if (!code) return { ok: false, reason: 'Passcode is required.' };

  const db = supabaseAdminEnabled ? serviceClient() : null;
  if (db) {
    const { data, error } = await db
      .from('demo_passcodes')
      .select('*')
      .eq('code_hash', hash)
      .maybeSingle();
    if (error || !data) return { ok: false, reason: 'Passcode not recognised.' };

    const record = data as Passcode;
    const invalid = validate(record);
    if (invalid) return { ok: false, reason: invalid };

    const { error: bump } = await db
      .from('demo_passcodes')
      .update({ uses_count: record.uses_count + 1 })
      .eq('id', record.id)
      .eq('uses_count', record.uses_count); // optimistic guard against races
    if (bump) return { ok: false, reason: 'Passcode is being used elsewhere. Try again.' };

    return { ok: true, passcodeId: record.id };
  }

  const all = await readJson<Passcode[]>(passcodeStorePath, []);
  const record = all.find((p) => p.code_hash === hash);
  if (!record) return { ok: false, reason: 'Passcode not recognised.' };
  const invalid = validate(record);
  if (invalid) return { ok: false, reason: invalid };
  record.uses_count += 1;
  await writeJson(passcodeStorePath, all);
  return { ok: true, passcodeId: record.id };
}

function validate(record: Passcode): string | null {
  if (record.revoked) return 'Passcode has been revoked.';
  if (new Date(record.expires_at).getTime() < Date.now()) return 'Passcode has expired.';
  if (record.uses_count >= record.max_uses) return 'Passcode has no uses left.';
  return null;
}
