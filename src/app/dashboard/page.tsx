import Link from 'next/link';
import { listJobs } from '@/lib/jobs';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Server-side listing. In Supabase mode, row-level security scopes each
  // customer to their own jobs once a session token is attached.
  const jobs = await listJobs(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Your launch kits</h1>
          <p className="text-slate-400">Every kit and where it is in production.</p>
        </div>
        <Link href="/jobs/new" className="btn">New kit</Link>
      </header>

      {jobs.length === 0 ? (
        <div className="panel text-slate-400">
          No kits yet. Start one from <Link href="/jobs/new" className="text-accent">New kit</Link>.
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/jobs/${job.id}`}
                className="panel flex flex-wrap items-center justify-between gap-3 hover:border-accent/50">
                <div>
                  <p className="font-medium">{job.intake_brief.product_name || 'Untitled product'}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(job.created_at).toLocaleString('en-MY')}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-slate-300">{job.status.replace(/_/g, ' ')}</p>
                  <p className="text-slate-500">{job.credits_used}/{job.credit_budget} credits</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
