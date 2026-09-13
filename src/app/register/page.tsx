'use client';

import { useState } from 'react';
import Link from 'next/link';
import { browserClient } from '@/lib/supabase-browser';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const client = browserClient();
    if (!client) {
      setError('Supabase is not configured on this deployment.');
      return;
    }
    if (password.length < 10) {
      setError('Use at least 10 characters.');
      return;
    }

    setBusy(true);
    setError(null);
    const { error: authError } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md panel space-y-3">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-slate-400">
          We sent a confirmation link to {email}. Open it to activate your account.
        </p>
        <Link href="/login" className="btn-ghost">Back to log in</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <form onSubmit={submit} className="panel space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="field" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" className="field" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} required minLength={10} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? 'Creating...' : 'Register'}</button>
      </form>
      <p className="text-sm text-slate-400">
        Already registered? <Link href="/login" className="text-accent">Log in</Link>
      </p>
    </div>
  );
}
