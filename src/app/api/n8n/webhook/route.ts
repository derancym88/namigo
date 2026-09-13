import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { webhookSecret } from '@/lib/config';
import { getJob, updateJob, type Job } from '@/lib/jobs';
import { STEP_CREDIT_COST } from '@/lib/packages';
import { STATUS_AFTER_STEP, stepByNumber } from '@/lib/workflow';

export const runtime = 'nodejs';

/**
 * Result sink for WF-03 .. WF-08.
 *
 * Exempt from the owner lock (see middleware) because it authenticates with
 * its own shared secret rather than the unlock cookie.
 */
export async function POST(request: Request) {
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret is not configured.' }, { status: 503 });
  }
  if (!secretMatches(request.headers.get('x-namigo-secret'))) {
    return NextResponse.json({ error: 'Invalid webhook secret.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });

  const jobId = String(body.job_id ?? '');
  const step = stepByNumber(Number(body.step));
  if (!jobId || !step) {
    return NextResponse.json({ error: 'job_id and a valid step are required.' }, { status: 400 });
  }

  const job = await getJob(jobId);
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

  if (body.error) {
    await updateJob(jobId, {
      status: 'failed',
      error_message: String(body.error).slice(0, 1000),
    });
    return NextResponse.json({ ok: true, recorded: 'failure' });
  }

  const patch: Partial<Job> = {
    [step.resultKey]: body.result ?? body[step.resultKey] ?? null,
    status: STATUS_AFTER_STEP[step.step],
    credits_used: job.credits_used + (STEP_CREDIT_COST[step.step] ?? 0),
    error_message: null,
  } as Partial<Job>;

  // Stage 5 composition also lands the export manifest when WF-08 reports.
  if (step.step === 6 && body.export_manifest) {
    patch.export_manifest = body.export_manifest;
  }

  await updateJob(jobId, patch);
  return NextResponse.json({ ok: true, step: step.step });
}

function secretMatches(candidate: string | null): boolean {
  if (!candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(webhookSecret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
