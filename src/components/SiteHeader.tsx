'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { CopyCaButton } from './ContractAddress';
import { WalletButton } from './wallet/WalletButton';

const NAV = [
  { href: '/app', label: 'App' },
  { href: '/#how', label: 'How it works' },
  { href: '/#networks', label: 'Networks' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const inApp = pathname?.startsWith('/app');

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Logo />
        <nav className="site-nav" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={n.href === pathname ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__actions">
          <CopyCaButton />
          {inApp ? (
            <WalletButton />
          ) : (
            <Link href="/app" className="btn btn-primary btn-sm">
              Launch app
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
