import { CREDIT_VALUE_MYR, PACKAGES } from '@/lib/packages';

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Packages and credits</h1>
        <p className="text-slate-400">
          1 credit = RM{CREDIT_VALUE_MYR.toFixed(2)}. Credits are valid for 3 months from
          activation and expire automatically if unused.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PACKAGES.map((pkg) => (
          <section key={pkg.id} className="panel flex flex-col">
            <h2 className="text-xl font-semibold">{pkg.name}</h2>
            <p className="mt-2 text-3xl font-semibold">
              RM{pkg.priceMyr.toLocaleString('en-MY')}
              {pkg.billing === 'monthly' && <span className="text-base text-slate-400">/month</span>}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {pkg.credits} credits - {pkg.kits}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {pkg.features.map((feature) => (
                <li key={feature}>- {feature}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="text-sm text-slate-500">
        Terms: 100% advance payment before credit activation. Generated outputs carry commercial
        usage rights upon full payment. Delivery timelines vary with workload complexity.
      </p>
    </div>
  );
}
