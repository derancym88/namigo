import { NextResponse } from 'next/server';
import { n8n, webhookSecret } from '@/lib/config';
import { getJob, updateJob } from '@/lib/jobs';
import { STEP_CREDIT_COST } from '@/lib/packages';
import { stepByNumber } from '@/lib/workflow';

export const runtime = 'nodejs';

/**
 * Hand one engine stage to n8n.
 *
 * n8n is the orchestration layer, not a generic webhook receiver: each call
 * carries the full structured payload the workflow needs, and each workflow
 * writes its result back through /api/n8n/webhook.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const stepNumber = Number(body?.step);
  const step = stepByNumber(stepNumber);
  if (!step) return NextResponse.json({ error: 'Unknown workflow step.' }, { status: 400 });

  const job = await getJob(params.id);
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

  if (!n8n.baseUrl) {
    return NextResponse.json({ error: 'N8N_BASE_URL is not configured.' }, { status: 503 });
  }

  const cost = STEP_CREDIT_COST[stepNumber] ?? 0;
  if (job.credits_used + cost > job.credit_budget) {
    return NextResponse.json(
      { error: 'Credit budget exhausted for this job.' },
      { status: 402 },
    );
  }

  const payload = {
    job_id: job.id,
    user_id: job.user_id,
    tier: job.tier,
    credit_budget: job.credit_budget,
    step: step.step,
    workflow: step.workflow,
    product_image_url: job.product_image_url,
    intake_brief: job.intake_brief,
    product_analysis: job.product_analysis,
    market_research: job.market_research,
    copy_data: job.copy_data,
    image_urls: job.image_urls,
    language: job.intake_brief.language,
    platforms: job.intake_brief.platforms,
    brand_rules: { tone: job.intake_brief.brand_tone, brand: job.intake_brief.brand_name },
  };

  const target = `${n8n.baseUrl.replace(/\/$/, '')}/webhook/${step.webhookPath}`;
  let response: Response;
  try {
    response = await fetch(target, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-namigo-secret': webhookSecret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    await updateJob(job.id, { error_message: `Step ${step.step} dispatch failed: ${message}` });
    return NextResponse.json({ error: `Could not reach n8n: ${message}` }, { status: 502 });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    await updateJob(job.id, {
      error_message: `Step ${step.step} rejected by n8n (${response.status}).`,
    });
    return NextResponse.json(
      { error: `n8n returned ${response.status}.`, detail: detail.slice(0, 500) },
      { status: 502 },
    );
  }

  await updateJob(job.id, { error_message: null });
  return NextResponse.json({ ok: true, step: step.step, workflow: step.workflow });
}
