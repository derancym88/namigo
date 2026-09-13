'use client';

import { useState } from 'react';
import { accessToken } from '@/lib/supabase-browser';

type PasscodeRow = {
  id: string;
  label: string;
  max_uses: number;
  uses_count: number;
  expires_at: string;
  revoked: boolean;
};

/**
 * Operator console. Authorisation is handled server-side: an admin Supabase
 * session in production, or the owner PIN while the app runs without Supabase.
 */
export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [label, setLabel] = useState('');
  const [maxUses, setMaxUses] = useState(5);
  const [expiryDays, setExpiryDays] = useState(7);
  const [generated, setGenerated] = useState<string | null>(null);
  const [rows, setRows] = useState<PasscodeRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(method: 'POST' | 'PUT', payload: Record<string, unknown>) {
    const token = await accessToken();
    return fetch('/api/admin/demo-passcodes', {
      method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ pin, ...payload }),
    });
  }

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setGenerated(null);

    const response = await call('POST', { label, maxUses, expiryDays });
    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setError(body.error ?? 'Generation failed.');
      return;
    }
    setGenerated(body.code);
    setLabel('');
  }

  async function load() {
    setError(null);
    const response = await call('PUT', {});
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.error ?? 'Could not load passcodes.');
      return;
    }
    setRows(body.passcodes);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Operator console</h1>
        <p className="text-slate-400">Demo-kit passcode control.</p>
      </header>

      <form onSubmit={generate} className="panel space-y-4">
        <h2 className="font-medium">Generate a passcode</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="pin">Owner PIN</label>
            <input id="pin" className="field" type="password" autoComplete="off"
              value={pin} onChange={(e) => setPin(e.target.value)} />
            <p className="mt-1 text-xs text-slate-500">
              Not needed when signed in as a Supabase admin.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="label">Label</label>
            <input id="label" className="field" placeholder="Jajan Viral demo batch"
              value={label} onChange={(e) => setLabel(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="maxUses">Max uses</label>
            <input id="maxUses" className="field" type="number" min={1} max={500}
              value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} />
          </div>
          <div>
            <label className="label" htmlFor="expiryDays">Expiry (days)</label>
            <input id="expiryDays" className="field" type="number" min={1} max={365}
              value={expiryDays} onChange={(e) => setExpiryDays(Number(e.target.value))} />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {generated && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
            <p className="text-sm text-emerald-200">
              Copy this now - it is shown once and only its hash is stored.
            </p>
            <p className="mt-2 font-mono text-lg">{generated}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button className="btn" disabled={busy}>{busy ? 'Generating...' : 'Generate'}</button>
          <button type="button" className="btn-ghost" onClick={load}>Load existing</button>
        </div>
      </form>

      {rows && (
        <section className="panel space-y-3">
          <h2 className="font-medium">Issued passcodes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="py-2 pr-4">Label</th>
                  <th className="py-2 pr-4">Uses</th>
                  <th className="py-2 pr-4">Expires</th>
                  <th className="py-2">State</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const expired = new Date(row.expires_at).getTime() < Date.now();
                  const spent = row.uses_count >= row.max_uses;
                  return (
                    <tr key={row.id} className="border-t border-white/10">
                      <td className="py-2 pr-4">{row.label}</td>
                      <td className="py-2 pr-4">{row.uses_count}/{row.max_uses}</td>
                      <td className="py-2 pr-4">{new Date(row.expires_at).toLocaleDateString('en-MY')}</td>
                      <td className="py-2">
                        {row.revoked ? 'Revoked' : expired ? 'Expired' : spent ? 'Used up' : 'Active'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
