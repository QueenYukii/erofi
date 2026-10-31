# eroFi

Relay assets from **Solana** to Ethereum, BNB Chain, Base, Arbitrum, Optimism and Polygon — and back — in one signature.

- **Wallets:** Reown AppKit multichain. One modal for Solana (Phantom, Solflare, Backpack…) and EVM (MetaMask, Rabby, Trust, OKX…) wallets, plus 300+ WalletConnect wallets. A Solana and an EVM wallet can be connected at the same time.
- **Relay:** [Relay protocol](https://docs.relay.link) intents. You deposit on the origin chain, a solver fills you on the destination chain, usually within seconds.
- **Stack:** Next.js (App Router) · TypeScript · wagmi + viem · @solana/web3.js · TanStack Query · plain CSS design system (`src/app/globals.css`).

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run check:setup          # verifies Reown ID, Relay key/quote, Solana RPC
npm run dev                  # http://localhost:3000
```

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | browser | Free at <https://dashboard.reown.com> → New project → Next.js. Add your domain(s) to the project's allowlist. |
| `NEXT_PUBLIC_SITE_URL` | browser | Exact deployed origin (e.g. `https://erofi.xyz`). Wallets warn when it doesn't match. |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | browser | Optional. A dedicated RPC (Helius, Triton, QuickNode) is strongly recommended in production. |
| `RELAY_API_KEY` | **server only** | Required by Relay since 2 Oct 2026. Request one from Relay (relay.link → Developers). Never prefix with `NEXT_PUBLIC_`. |
| `RELAY_API_URL` | server | Defaults to `https://api.relay.link`. |
| `RELAY_REFERRER` | server | Identifies eroFi in Relay's systems (default `erofi`). |

## How it works

```
Browser                                   Next.js server             Relay
───────                                   ──────────────             ─────
RelayCard ── POST /api/bridge/quote ─────▶ adds x-api-key ─────────▶ /quote/v2
          ◀─ steps[] (approve/deposit…) ◀─────────────────────────────┘
executor.ts
  • Solana step → build v0 tx from instructions + lookup tables → wallet signs & sends
  • EVM step    → switch chain → sendTransaction → wait for receipt
  • Signature   → sign (EIP-191/712) → POST /api/bridge/submit
  └─ poll GET /api/bridge/status ────────▶ adds x-api-key ─────────▶ /intents/status/v3
```

- The Relay API key only lives in `src/lib/relay-server.ts` (marked `server-only`).
- `/api/bridge/quote` forwards a whitelisted set of fields only; `/api/bridge/submit` only accepts relative Relay paths, so the routes can't be abused as open proxies.
- Every relay is recorded in `localStorage` (`erofi.activity.v1`). Relays that were in flight when the tab closed resume tracking on the next visit.

## Project layout

```
src/
  app/
    page.tsx                 Landing page
    app/page.tsx             Relay app (/app)
    api/bridge/{quote,status,submit}/route.ts
    globals.css              Design tokens + components
  config/
    chains.ts                Chains, tokens, explorers (single source of truth)
    appkit.ts                AppKit networks + Solana/Wagmi adapters
  providers/Web3Provider.tsx
  features/relay/
    RelayCard.tsx            Main form + CTA state machine
    executor.ts              Executes Relay steps on Solana and EVM
    useQuote.ts / useAssetBalance.ts / useWallets.ts / activity.ts
    AssetSelect.tsx / QuoteDetails.tsx / ProgressPanel.tsx / ActivityList.tsx
  components/                Header, footer, logo, chain icons, wallet button
```

## Adding a chain or token

1. Add the chain to `CHAINS` in `src/config/chains.ts` (Relay chain id, explorer, CAIP id).
2. Add its tokens to `TOKENS` (address + **correct decimals for that chain** — e.g. USDC is 18 decimals on BNB Chain).
3. Add the matching network from `@reown/appkit/networks` to `networks` (and to the Wagmi adapter if EVM) in `src/config/appkit.ts`.

Relay's live chain list is at `GET https://api.relay.link/chains`. Route availability is always confirmed by the quote.

## Before going to mainnet

- [ ] Set `RELAY_API_KEY`, `NEXT_PUBLIC_REOWN_PROJECT_ID`, `NEXT_PUBLIC_SITE_URL`, and a paid Solana RPC.
- [ ] Add your production domain to the Reown project allowlist.
- [ ] Do a small end-to-end relay on each route you advertise (e.g. 0.05 SOL → ETH on Base), including a reverse EVM → Solana relay.
- [ ] Add rate limiting to `/api/bridge/*` (Vercel WAF, Upstash, or your edge provider).
- [ ] Review the legal copy in `SiteFooter.tsx` and add Terms/Privacy pages for your jurisdiction.

## Notes

- eroFi is non-custodial: it never sees private keys and never asks for a seed phrase.
