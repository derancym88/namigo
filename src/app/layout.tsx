import type { Metadata } from 'next';
import Link from 'next/link';
import { ownerProtection } from '@/lib/config';
import './globals.css';

export const metadata: Metadata = {
  title: 'NamiGo X - AI Launch Kit Engine',
  description: 'Kami Urus... Kamu Rehat. One product photo becomes a complete commercial launch kit.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Ownership watermark - see the owner protection section of the manual. */}
        <meta name="ngx-owner" content={ownerProtection.ownerCompany} />
        <meta name="ngx-product" content={ownerProtection.productName} />
        <meta name="ngx-license" content={ownerProtection.licenseId} />
        <meta name="ngx-build" content={ownerProtection.buildFingerprint} />
      </head>
      <body>
        <header className="border-b border-white/10">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4">
            <Link href="/" className="text-lg font-semibold">
              NamiGo <span className="text-accent">X</span>
            </Link>
            <div className="ml-auto flex flex-wrap items-center gap-3 text-sm">
              <Link href="/pricing" className="hover:text-accent">Pricing</Link>
              <Link href="/dashboard" className="hover:text-accent">Dashboard</Link>
              <Link href="/jobs/new" className="hover:text-accent">New kit</Link>
              <Link href="/login" className="btn-ghost">Log in</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-slate-500">
          {ownerProtection.productName} - {ownerProtection.ownerCompany}. Build{' '}
          {ownerProtection.buildFingerprint}.
        </footer>
      </body>
    </html>
  );
}
