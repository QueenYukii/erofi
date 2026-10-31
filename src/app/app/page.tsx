import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { RelayCard } from '@/features/relay/RelayCard';
import { ActivityList } from '@/features/relay/ActivityList';

export const metadata: Metadata = { title: 'App' };

export default function AppPage() {
  return (
    <div className="app-shell">
      <div className="container app-grid">
        <RelayCard />
        <div className="side-stack">
          <ActivityList />
          <section className="panel" aria-labelledby="safety-title">
            <div className="panel__head">
              <h2 className="panel__title" id="safety-title">
                Before you bridge
              </h2>
              <ShieldCheck aria-hidden="true" width={18} height={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="panel__body" style={{ color: 'var(--text-2)', fontSize: 14 }}>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8 }}>
                <li>Check the recipient address. Cross-chain transfers cannot be reversed.</li>
                <li>Keep a little SOL for network fees — Max leaves 0.01 SOL behind.</li>
                <li>Quotes refresh every 25 seconds; you always sign against a fresh one.</li>
                <li>eroFi will never ask for your seed phrase or private key.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
