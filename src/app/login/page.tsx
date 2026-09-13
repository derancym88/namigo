'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { browserClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const client = browserClient();
    if (!client) {
      setError('Supabase is not configured on this deployment.');
      return;
    }

    setBusy(true);
    setError(null);
    const { error: authError } = await client.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    router.push('/dashboard');
  }

  async function google() {
    const client = browserClient();
    if (!client) return;
    await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <form onSubmit={submit} className="panel space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="field" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" className="field" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? 'Signing in...' : 'Log in'}</button>
        <button type="button" className="btn-ghost w-full" onClick={google}>
          Continue with Google
        </button>
      </form>
      <p className="text-sm text-slate-400">
        No account yet? <Link href="/register" className="text-accent">Register</Link>
      </p>
    </div>
  );
}
