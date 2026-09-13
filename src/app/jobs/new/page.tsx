'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { accessToken } from '@/lib/supabase-browser';

/**
 * Customer intake console. The engine needs a real brief, not just an upload -
 * every field below feeds the research, copy and video stages.
 */
export default function NewJobPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const token = await accessToken();

    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      body: form,
    });

    const body = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setError(body.error ?? 'Could not create the kit.');
      return;
    }
    router.push(`/jobs/${body.job_id}`);
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Create a launch kit</h1>
        <p className="text-slate-400">
          Tell us about your product. The more you share, the less the engine has to flag as
          missing.
        </p>
      </header>

      <section className="panel space-y-4">
        <h2 className="font-medium">Access</h2>
        <div>
          <label className="label" htmlFor="passcode">Demo-kit passcode</label>
          <input id="passcode" name="passcode" className="field" placeholder="NGX-XXXX-XXXX-XXXX"
            required autoComplete="off" />
          <p className="mt-1 text-xs text-slate-500">Issued by your NamiGo operator.</p>
        </div>
      </section>

      <section className="panel space-y-4">
        <h2 className="font-medium">Product</h2>
        <div>
          <label className="label" htmlFor="image">Product photo (PNG, JPEG or WebP, max 10MB)</label>
          <input id="image" name="image" type="file" className="field"
            accept="image/png,image/jpeg,image/webp" required />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="productName" label="Product name" required />
          <Field name="brandName" label="Brand name" />
          <Field name="category" label="Category" placeholder="skincare, snacks, gadgets..." />
          <Field name="targetCustomer" label="Target customer" />
        </div>
        <Area name="productBenefits" label="Product benefits" />
        <Area name="uniqueSellingPoint" label="Unique selling point" />
        <Area name="missingSpecs" label="Specs you already know we cannot see in the photo" />
      </section>

      <section className="panel space-y-4">
        <h2 className="font-medium">Campaign</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="offer" label="Offer or promo" />
          <Field name="platforms" label="Target platforms (comma separated)"
            placeholder="tiktok, shopee, lazada" />
          <div>
            <label className="label" htmlFor="language">Output language</label>
            <select id="language" name="language" className="field" defaultValue="en">
              <option value="en">English</option>
              <option value="ms">Bahasa Malaysia</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
          <Field name="brandTone" label="Brand tone" placeholder="premium, playful, clinical..." />
        </div>
        <Area name="competitors" label="Competitors or reference accounts" />
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Creating...' : 'Start production'}</button>
    </form>
  );
}

function Field(props: { name: string; label: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={props.name}>{props.label}</label>
      <input id={props.name} name={props.name} className="field"
        placeholder={props.placeholder} required={props.required} />
    </div>
  );
}

function Area(props: { name: string; label: string }) {
  return (
    <div>
      <label className="label" htmlFor={props.name}>{props.label}</label>
      <textarea id={props.name} name={props.name} className="field" rows={3} />
    </div>
  );
}
