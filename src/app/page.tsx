import Link from 'next/link';
import {
  ArrowRight,
  Eye,
  KeyRound,
  Layers,
  MousePointerClick,
  Radar,
  Route,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { RelayDiagram } from '@/components/RelayDiagram';
import { ChainIcon } from '@/components/ChainIcon';
import { CHAINS, SOLANA_RELAY_CHAIN_ID, tokensFor } from '@/config/chains';

const STEPS = [
  {
    icon: Wallet,
    title: 'Connect your Solana wallet',
    body: 'Phantom, Solflare, Backpack or any WalletConnect wallet. Add an EVM wallet if you want the destination filled in for you.',
  },
  {
    icon: Route,
    title: 'Pick a destination',
    body: 'Choose the chain and token you want to receive. eroFi fetches a live route with every fee and the minimum you will get.',
  },
  {
    icon: MousePointerClick,
    title: 'Sign once',
    body: 'Approve a single Solana transaction. A professional solver fills you on the destination chain, usually within seconds.',
  },
];

const FEATURES = [
  {
    icon: KeyRound,
    title: 'Non-custodial by design',
    body: 'eroFi never holds your funds or keys. You sign every transaction in your own wallet; the app only builds what you approve.',
  },
  {
    icon: Eye,
    title: 'Every fee, before you sign',
    body: 'Network gas, bridge fee, price impact and minimum received are shown on the quote. No hidden spread.',
  },
  {
    icon: Radar,
    title: 'Both legs tracked',
    body: 'See the Solana deposit and the destination fill with explorer links. In-flight transfers survive a refresh.',
  },
  {
    icon: Layers,
    title: 'One wallet modal, two ecosystems',
    body: 'Hold a Solana and an EVM wallet side by side — eroFi uses the right one for each step automatically.',
  },
];

const FAQ = [
  {
    q: 'How does eroFi move funds between chains?',
    a: 'eroFi uses an intent-based routing engine. You deposit on Solana, and a solver who already holds liquidity on the destination chain pays you out there. Because the solver fronts the funds, you do not wait for slow bridge finality.',
  },
  {
    q: 'What does it cost?',
    a: 'You pay the Solana network fee plus a bridge fee that covers the solver’s gas and capital. Both are shown on the quote before you sign. The amount you receive can never be lower than the minimum shown.',
  },
  {
    q: 'How long does a transfer take?',
    a: 'Most routes settle in seconds. The quote shows the time estimate for your specific route, and the progress panel tracks the transfer until the destination transaction is confirmed.',
  },
  {
    q: 'What happens if a transfer fails?',
    a: 'If a solver cannot complete the fill, the deposit is refunded to the origin wallet. eroFi shows the refund status and transaction in your activity.',
  },
  {
    q: 'Can I bridge into Solana too?',
    a: 'Yes. Flip the direction in the app to bring ETH, BNB, USDC or USDT from any supported EVM chain into Solana using an EVM wallet.',
  },
];

export default function HomePage() {
  const destinations = CHAINS.filter((c) => c.id !== SOLANA_RELAY_CHAIN_ID);

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <span className="eyebrow">
              <span className="tag">Solana-native</span>
              Bridge to {destinations.length} networks
            </span>
            <h1 className="display">
              Move value off Solana <span className="soft">in seconds,</span> not minutes.
            </h1>
            <p className="lede">
              eroFi bridges SOL, USDC and USDT from Solana to Ethereum, BNB Chain, Base, Arbitrum and more. One
              signature, every fee shown up front, settled in seconds by a network of professional solvers.
            </p>
            <div className="hero__cta">
              <Link href="/app" className="btn btn-primary btn-lg">
                Launch app
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="#how" className="btn btn-secondary btn-lg">
                How it works
              </Link>
            </div>
            <div className="hero__facts">
              <div>
                <div className="fact__value num">{CHAINS.length}</div>
                <div className="fact__label">Networks</div>
              </div>
              <div>
                <div className="fact__value num">1</div>
                <div className="fact__label">Signature per transfer</div>
              </div>
              <div>
                <div className="fact__value">0</div>
                <div className="fact__label">Custody of your funds</div>
              </div>
            </div>
          </div>
          <RelayDiagram />
        </div>
      </section>

      <section className="section" id="how" aria-labelledby="how-title">
        <div className="container">
          <div className="section__head">
            <div>
              <p className="section__kicker">How it works</p>
              <h2 className="h2" id="how-title">
                Three steps from Solana to anywhere.
              </h2>
            </div>
            <p className="section__intro">
              eroFi is built for the moment you need funds on another chain right now: a mint on Base, a position on
              Arbitrum, gas on BNB Chain.
            </p>
          </div>
          <ol className="steps" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {STEPS.map((s, i) => (
              <li className="step" key={s.title}>
                <span className="step__num">0{i + 1}</span>
                <div className="step__icon">
                  <s.icon aria-hidden="true" />
                </div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" id="networks" aria-labelledby="networks-title">
        <div className="container">
          <div className="section__head">
            <div>
              <p className="section__kicker">Networks</p>
              <h2 className="h2" id="networks-title">
                Solana in, the EVM out and back.
              </h2>
            </div>
            <p className="section__intro">
              Routes are confirmed live before every transfer. If a pair isn&apos;t available at that
              moment, eroFi tells you instead of guessing.
            </p>
          </div>
          <div className="chain-grid">
            {CHAINS.map((c) => (
              <div className={`chain-tile ${c.id === SOLANA_RELAY_CHAIN_ID ? 'chain-tile--home' : ''}`} key={c.id}>
                <ChainIcon chainId={c.id} size={32} />
                <div>
                  <div className="chain-tile__name">{c.name}</div>
                  <div className="chain-tile__meta">
                    {tokensFor(c.id)
                      .map((t) => t.symbol)
                      .join(' · ')}
                  </div>
                </div>
                {c.id === SOLANA_RELAY_CHAIN_ID && (
                  <span className="badge badge--accent" style={{ marginLeft: 'auto' }}>
                    Home
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="trust-title">
        <div className="container">
          <div className="section__head">
            <div>
              <p className="section__kicker">Trust</p>
              <h2 className="h2" id="trust-title">
                Built so you can see exactly what you sign.
              </h2>
            </div>
            <p className="section__intro">
              eroFi is an interface. Settlement runs on public blockchains — the app never
              touches your keys.
            </p>
          </div>
          <div className="features">
            {FEATURES.map((f) => (
              <div className="feature" key={f.title}>
                <span className="feature__icon">
                  <f.icon aria-hidden="true" />
                </span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="faq" aria-labelledby="faq-title">
        <div className="container">
          <div className="section__head">
            <div>
              <p className="section__kicker">FAQ</p>
              <h2 className="h2" id="faq-title">
                Questions, answered.
              </h2>
            </div>
          </div>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container">
          <div className="cta-band__inner">
            <div>
              <h2 className="h2" style={{ fontSize: 'clamp(26px, 3vw, 34px)' }}>
                Ready to bridge?
              </h2>
              <p className="section__intro" style={{ marginTop: 8 }}>
                <ShieldCheck aria-hidden="true" style={{ display: 'inline', width: 16, height: 16, verticalAlign: '-3px', marginRight: 6 }} />
                Get a live quote without connecting — sign only when it looks right.
              </p>
            </div>
            <Link href="/app" className="btn btn-primary btn-lg">
              Open eroFi
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
