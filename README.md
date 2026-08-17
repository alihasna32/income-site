# 🪙 CoinQuest

A production-ready, gamified earning platform. Play games, scratch cards, solve
math challenges, keep daily streaks, complete missions and climb leaderboards —
all rewarded with **virtual coins** (no real-money claims).

Built with **Next.js 15** (App Router, JavaScript), **Tailwind CSS v4**,
**DaisyUI 5**, **Supabase**, **Zod** and **lucide-react**.

## Features

- 10 playable games (memory, reaction, quiz, luck-based, and more) with server-validated rewards
- Scratch cards with server-picked weighted prizes (one per day)
- Timed math challenge with 4 difficulties (server-generated questions)
- Daily rotating challenge + 7-day daily reward calendar with streaks and grace days
- Missions & achievements that auto-credit rewards
- 10 levels, daily/weekly/monthly/all-time leaderboards
- Referral program (50 coins per successful join, self-referrals blocked)
- Wallet with full audit trail + virtual-only rewards marketplace preview
- Admin panel: user roles, game reward tuning, manual coin adjustments, platform settings
- Full RLS security, idempotent rewards, rate limiting, server-decided outcomes

## Getting started

### 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`, then
   `supabase/seed.sql`.
3. Copy your project URL, anon key and service role key (Project Settings → API).

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role key (**server only, never expose**) |
| `NEXT_PUBLIC_SITE_URL` | Your deployed URL, e.g. `https://coinquest.example.com` |

### 3. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To make yourself an admin:

```sql
update public.profiles set role = 'admin' where id = '<your-user-uuid>';
```

## Scripts

```bash
npm run dev       # development server
npm run build     # production build
npm run start     # serve production build
npm run lint      # eslint
```

## Architecture notes

- **Reward security**: all coin/XP mutations flow through the `credit_reward`
  PL/pgSQL function with idempotency keys. The client never decides reward amounts.
- **Luck games** (Lucky Wheel, Mystery Box, Scratch Cards) resolve outcomes on the
  server via weighted picks.
- **RLS**: users read only their own data; wallets, transactions, attempts and
  results are not user-writable; profile role/XP columns are column-gated.
- **Rate limiting** via a DB-backed `check_rate_limit` function with an
  in-memory fallback.
- **Games are data-driven**: `games` table drives the catalog; components are
  mapped in `src/components/games/registry.js` and must stay in sync with the seed.
- **Missions/achievements** refresh best-effort after reward events through
  `src/services/progressService.js` (idempotent, never blocks the reward).
- `supabase/schema.sql` and `supabase/seed.sql` are the source of truth for the
  backend — keep constants in `src/lib/constants/` in sync.

## Disclaimer

Coins are virtual, have no cash value and cannot be redeemed for money. The
rewards marketplace (digital perks) is a planned, compliance-first feature.