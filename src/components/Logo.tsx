import Link from 'next/link';

/** eroFi brand mark (public/logo-128.png, rendered at 28px). */
export function LogoMark({ className = 'logo__mark' }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src="/logo-128.png" alt="" width={28} height={28} />;
}

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="eroFi home">
      <LogoMark />
      <span>eroFi</span>
    </Link>
  );
}
