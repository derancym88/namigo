'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OwnerLockForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [lockcode, setLockcode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const response = await fetch('/api/owner-lock', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lockcode }),
    });

    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? 'Unlock failed.');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Owner unlock</h1>
        <p className="text-sm text-slate-400">
          This deployment is protected. Enter the owner lockcode to continue.
        </p>
        {params.get('reason') === 'licence' && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
            Licence check failed: this build is not running on its licensed domain and server IP.
            Update NAMIGO_LICENSE_DOMAIN, NAMIGO_LICENSE_SERVER_IP and NAMIGO_DEPLOYMENT_IP on the
            server, then restart the web container.
          </p>
        )}
      </header>

      <form onSubmit={submit} className="panel space-y-4">
        <div>
          <label className="label" htmlFor="lockcode">Owner lockcode</label>
          <input
            id="lockcode"
            className="field"
            type="password"
            autoComplete="off"
            value={lockcode}
            onChange={(event) => setLockcode(event.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="btn w-full" disabled={busy}>
          {busy ? 'Checking...' : 'Unlock'}
        </button>
      </form>
      <p className="text-xs text-slate-500">
        Unlock grants a signed 12-hour session cookie on this browser only.
      </p>
    </div>
  );
}

export default function OwnerLockPage() {
  return (
    <Suspense fallback={null}>
      <OwnerLockForm />
    </Suspense>
  );
}
