import Link from 'next/link';
import { WORKFLOW_STEPS } from '@/lib/workflow';

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="space-y-5">
        <p className="text-sm uppercase tracking-widest text-accent">AI Production Division</p>
        <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
          Kami Urus... Kamu Rehat.
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          One raw product photo becomes a complete commercial launch kit: market insight,
          conversion copy, 4K visuals and a cinematic promo video - ready to publish.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/jobs/new" className="btn">Create a launch kit</Link>
          <Link href="/pricing" className="btn-ghost">See packages</Link>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">The six-stage production chain</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {WORKFLOW_STEPS.map((step) => (
            <li key={step.id} className="panel">
              <p className="text-sm text-accent">Stage {step.step}</p>
              <p className="mt-1 font-medium">{step.title}</p>
              <p className="mt-2 text-sm text-slate-400">{step.customerLabel}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Fast', 'Launch-ready assets without running a studio.'],
          ['Factual', 'The engine reads your real photo and flags missing specs instead of inventing them.'],
          ['Multilingual', 'English, Malay and Chinese copy and video scripts.'],
        ].map(([title, body]) => (
          <div key={title} className="panel">
            <p className="font-medium">{title}</p>
            <p className="mt-2 text-sm text-slate-400">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
