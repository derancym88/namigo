import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseServiceRoleKey, supabaseUrl } from './config';

/**
 * Service-role client. Bypasses row-level security, so it must never be
 * imported into a client component or exposed through a public route.
 */
export function serviceClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Anon client used for browser auth flows. */
export function anonClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

/** Resolve the Supabase user behind a bearer token. */
export async function userFromToken(token: string) {
  const client = serviceClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/** True when the user id is listed in public.admin_settings. */
export async function isAdminUser(userId: string): Promise<boolean> {
  const client = serviceClient();
  if (!client) return false;
  const { data, error } = await client
    .from('admin_settings')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  return !error && Boolean(data);
}
