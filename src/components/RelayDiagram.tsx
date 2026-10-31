import { CHAINS, SOLANA_RELAY_CHAIN_ID, chainIconUrl } from '@/config/chains';

/** Hero illustration: Solana as origin, relay routes fanning out to destinations. */
export function RelayDiagram() {
  const origin = { x: 104, y: 258 };
  const destinations = CHAINS.filter((c) => c.id !== SOLANA_RELAY_CHAIN_ID);
  const top = 72;
  const gap = (444 - top) / (destinations.length - 1);

  return (
    <div className="diagram" role="img" aria-label="Diagram: assets bridged from Solana to Ethereum, BNB Chain, Base, Arbitrum, Optimism and Polygon">
      <svg viewBox="0 0 560 515" aria-hidden="true">
        <defs>
          <clipPath id="node-clip">
            <circle r="15" cx="0" cy="0" />
          </clipPath>
          <clipPath id="origin-clip">
            <circle r="22" cx="0" cy="0" />
          </clipPath>
        </defs>

        {destinations.map((d, i) => {
          const y = top + i * gap;
          return (
            <path
              key={`r-${d.id}`}
              className="route"
              d={`M ${origin.x + 26} ${origin.y} C 250 ${origin.y}, 270 ${y}, 404 ${y}`}
            />
          );
        })}
        {destinations.map((d, i) => {
          const y = top + i * gap;
          return (
            <path
              key={`p-${d.id}`}
              className="pulse"
              d={`M ${origin.x + 26} ${origin.y} C 250 ${origin.y}, 270 ${y}, 404 ${y}`}
            />
          );
        })}

        {/* origin */}
        <g transform={`translate(${origin.x} ${origin.y})`}>
          <circle r="38" fill="none" stroke="var(--accent)" strokeOpacity="0.25" />
          <circle r="28" fill="var(--surface-2)" stroke="var(--line-strong)" />
          <text textAnchor="middle" dy="4" className="node-sub">SOL</text>
          <image href={chainIconUrl(SOLANA_RELAY_CHAIN_ID)} x="-22" y="-22" width="44" height="44" clipPath="url(#origin-clip)" />
        </g>
        <text x={origin.x} y={origin.y + 62} textAnchor="middle" className="node-label">Solana</text>
        <text x={origin.x} y={origin.y + 78} textAnchor="middle" className="node-sub">origin</text>

        {destinations.map((d, i) => {
          const y = top + i * gap;
          return (
            <g key={`n-${d.id}`}>
              <g transform={`translate(420 ${y})`}>
                <circle r="19" fill="var(--surface-2)" stroke="var(--line-strong)" />
                <text textAnchor="middle" dy="3.5" className="node-sub">{d.short.slice(0, 3)}</text>
                <image href={chainIconUrl(d.id)} x="-15" y="-15" width="30" height="30" clipPath="url(#node-clip)" />
              </g>
              <text x="450" y={y - 2} className="node-label">{d.name}</text>
              <text x="450" y={y + 13} className="node-sub">{d.nativeSymbol} · USDC</text>
            </g>
          );
        })}
      </svg>
      <div className="diagram__caption">
        <span className="live-dot" aria-hidden="true" />
        Settled in seconds · one signature
      </div>
    </div>
  );
}
