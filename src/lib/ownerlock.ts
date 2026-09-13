/**
 * Owner protection layer.
 *
 * Uses Web Crypto only, so the same helpers run in the Edge middleware and in
 * Node route handlers. The lockcode never leaves the server: the browser only
 * ever holds a signed, expiring unlock cookie.
 */

export const UNLOCK_COOKIE = 'ngx_owner_unlock';
export const UNLOCK_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
}

/** Build the cookie value for a successful unlock. */
export async function issueUnlockToken(secret: string): Promise<string> {
  const expires = Date.now() + UNLOCK_TTL_MS;
  const payload = String(expires);
  return `${payload}.${await sign(payload, secret)}`;
}

/** Verify a cookie value: correct signature and not past its expiry. */
export async function verifyUnlockToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token || !secret) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = await sign(payload, secret);
  if (!constantTimeEqual(expected, signature)) return false;

  const expires = Number(payload);
  return Number.isFinite(expires) && expires > Date.now();
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Constant-time comparison of a submitted lockcode against the configured one. */
export function lockcodeMatches(candidate: string, configured: string): boolean {
  if (!configured) return false;
  return constantTimeEqual(String(candidate ?? ''), configured);
}

/**
 * Licence check: the deployment must run on the licensed domain and the
 * configured deployment IP must match the licensed server IP. A copy lifted
 * onto another host fails this and stays in locked mode.
 */
export function licenceHolds(input: {
  host: string;
  licenseDomain: string;
  licenseServerIp: string;
  deploymentIp: string;
}): boolean {
  const { host, licenseDomain, licenseServerIp, deploymentIp } = input;
  if (!licenseDomain || !licenseServerIp || !deploymentIp) return false;
  if (licenseServerIp !== deploymentIp) return false;

  const hostname = host.split(':')[0]?.toLowerCase() ?? '';
  const domain = licenseDomain.toLowerCase();
  return hostname === domain || hostname.endsWith(`.${domain}`);
}
