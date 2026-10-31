import Link from 'next/link';
import { Logo } from './Logo';
import { ContractAddress } from './ContractAddress';

const X_URL = 'https://x.com/eroFinance';

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <Logo />
          <nav className="site-footer__links" aria-label="Footer">
            <Link href="/app">App</Link>
            <Link href="/#how">How it works</Link>
            <Link href="/#faq">FAQ</Link>
            <a
              className="social-link"
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="eroFi on X"
              title="Follow eroFi on X"
            >
              <XLogo />
            </a>
          </nav>
        </div>
        <ContractAddress compact />
        <p className="site-footer__legal">
          Non-custodial. Transactions are final once confirmed. Not financial advice. © {new Date().getFullYear()}{' '}
          eroFi.
        </p>
      </div>
    </footer>
  );
}
