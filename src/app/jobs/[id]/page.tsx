import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getJob } from '@/lib/jobs';
import { WORKFLOW_STEPS } from '@/lib/workflow';
import JobRunner from './runner';

export const dynamic = 'force-dynamic';

export default async function JobPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);
  if (!job) notFound();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-slate-400">Launch kit</p>
        <h1 className="text-3xl font-semibold">
          {job.intake_brief.product_name || 'Untitled product'}
        </h1>
        <p className="text-sm text-slate-400">
          Status: {job.status.replace(/_/g, ' ')} - credits used {job.credits_used} of{' '}
          {job.credit_budget}
        </p>
        {job.error_message && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {job.error_message}
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="panel space-y-3">
          <h2 className="font-medium">Your product</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={job.product_image_url} alt="Uploaded product"
            className="w-full rounded-lg border border-white/10" />
          <dl className="space-y-1 text-sm text-slate-400">
            <div><dt className="inline text-slate-500">Brand: </dt><dd className="inline">{job.intake_brief.brand_name || '-'}</dd></div>
            <div><dt className="inline text-slate-500">Category: </dt><dd className="inline">{job.intake_brief.category || '-'}</dd></div>
            <div><dt className="inline text-slate-500">Language: </dt><dd className="inline">{job.intake_brief.language}</dd></div>
            <div><dt className="inline text-slate-500">Platforms: </dt><dd className="inline">{job.intake_brief.platforms.join(', ')}</dd></div>
          </dl>
        </aside>

        <section className="space-y-4">
          <JobRunner jobId={job.id} />
          {WORKFLOW_STEPS.map((step) => {
            const result = (job as unknown as Record<string, unknown>)[step.resultKey];
            return (
              <article key={step.id} className="panel space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-accent">Stage {step.step} - {step.workflow}</p>
                    <p className="font-medium">{step.title}</p>
                  </div>
                  <span className={`text-sm ${result ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {result ? 'Complete' : 'Waiting'}
                  </span>
                </div>
                {result ? (
                  <pre className="max-h-72 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-slate-300">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-slate-500">{step.customerLabel}</p>
                )}
              </article>
            );
          })}
        </section>
      </div>

      <Link href="/dashboard" className="btn-ghost">Back to dashboard</Link>
    </div>
  );
}
