'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WORKFLOW_STEPS } from '@/lib/workflow';

/** Operator control strip: dispatch one engine stage at a time to n8n. */
export default function JobRunner({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [busyStep, setBusyStep] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(step: number) {
    setBusyStep(step);
    setMessage(null);

    const response = await fetch(`/api/jobs/${jobId}/trigger`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ step }),
    });
    const body = await response.json().catch(() => ({}));

    setBusyStep(null);
    setMessage(response.ok ? `Stage ${step} sent to the engine.` : (body.error ?? 'Failed.'));
    if (response.ok) router.refresh();
  }

  return (
    <div className="panel space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium">Run production</h2>
        <button className="btn-ghost text-sm" onClick={() => router.refresh()}>Refresh</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {WORKFLOW_STEPS.map((step) => (
          <button key={step.id} className="btn-ghost text-sm" disabled={busyStep !== null}
            onClick={() => run(step.step)}>
            {busyStep === step.step ? 'Sending...' : `Stage ${step.step}`}
          </button>
        ))}
      </div>
      {message && <p className="text-sm text-slate-400">{message}</p>}
    </div>
  );
}
