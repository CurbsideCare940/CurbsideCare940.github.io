# Curbside Care — Customer & Admin Web Portal

A static web portal (Vite + React + TypeScript + Supabase) for
**customers and admins only**. Employees are blocked — they use the mobile
app.

- Customer self-service for iPhone users who can't get the App Store build:
  view subscription/payment history, refresh from PayPal, update profile,
  bin placement, return location, and open/reply to support tickets.
- Admin overview: customer list, support ticket queue, zone/day mapping.
- Shares the **same Supabase project** (URL + anon key) and the **same Edge
  Functions** (`paypal-status`, `admin-create-user`, `admin-reset-password`,
  `enroll-guest`, `admin-list-tickets`) as the Expo app.

## URLs / login
- Landing page: https://curbsidecare.net
- Portal login: `https://curbsidecare.net/app/` (served from `/app/`).
  - Customers: sign up on the marketing site (→ `enroll-guest` creates your
    account + PayPal subscription), then sign in here with the same email.
  - Admins: sign in with your admin email/password.
  - Employees: sign-in is refused — use the Curbside Care mobile app.

## Environment (build-time, baked into the static bundle)
These are the same keys the Expo app uses and are safe to ship to the
browser (RLS enforces per-user access at runtime):

| Variable | Source |
|---|---|
| `VITE_SUPABASE_URL` | `EXPO_PUBLIC_SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

## Build (from `web/`)
```bash
cd /home/judge/curbsidecare-pages/web
npm install          # or: npm ci   (after a real lockfile is committed)
npm run build        # -> dist/
```
Type-check: `tsc --noEmit` (clean).

## Deploy to GitHub Pages (`curbsidecare.net`)
`web/dist/` is a static site. Serve it from `curbsidecare.net/app/`:

1. Build locally (above) — produces `web/dist/`.
2. Copy `web/dist/*` into the Pages publish directory, e.g. `docs/app/`
   (or into the Next.js/Plain Pages site's `static/app/` folder), preserving
   `index.html` and `assets/` at `.../app/assets/...`.
3. Commit + push `CurbsideCare940.github.io` on `master` — Pages redeploys.
4. `curbsidecare.net/app/` must serve `index.html` (single-page shell). If
   using Jekyll/Plain Pages, ensure `/app/**` is not captured by a 404 rule
   and that `try_files`-style fallback to `/app/index.html` exists.

Note: GitHub Pages is static, so the Supabase keys are baked at build time
(the same way the Expo app ships `EXPO_PUBLIC_*` keys). Set the two
`VITE_SUPABASE_*` env vars in your build environment before `npm run build`.

## Backend changes that must be deployed (from the app repo on Windows)
The portal depends on Edge Functions + DB policies that live in the
`curbcare` repo. After pulling both repos, on **DadsPC** run:

```powershell
# From /home/judge/curbcare (over Tailscale), using your existing .env.functions:
supabase db push                              # applies 0012 + 0013 (customer update + referrals)
supabase secrets set --env-file .env.functions
supabase functions deploy paypal-status admin-create-user admin-reset-password enroll-guest admin-list-tickets paypal-approve paypal-cancel admin-respond-ticket
```
`0012_customer_self_update.sql` adds customer UPDATE policies (Profile/bin page).
`0013_customer_referrals.sql` adds the `referrals` table (Refer-a-Neighbor).
`enroll-guest` was updated to record `referralCode` → redeploy it so referred
signups are tracked.

## What's in here
```
web/
├── index.html            # shell, mounts into #root
├── vite.config.ts        # base=/app/, automatic JSX via esbuild (no React plugin)
├── tsconfig.json
├── src/
│   ├── main.tsx          # React 19 mount
│   ├── App.tsx           # auth → customer | admin routing (employees blocked)
│   ├── index.css         # brand tokens (teal/mint/coral, slogan)
│   ├── AppLayout.tsx     # side nav shell
│   ├── react-dom-client.d.ts   # ambient types (no @types/react-dom needed)
│   ├── env.d.ts          # ambient ImportMetaEnv (VITE_*)
│   ├── components/
│   │   └── StatusBadge.tsx
│   ├── lib/
│   │   ├── supabase.ts         # createClient (env or fallback)
│   │   ├── auth.tsx            # AuthProvider + employee block
│   │   ├── app-context.tsx     # view router (AppView: login/customer*/admin*)
│   │   └── data.ts             # typed Supabase reads + admin helpers
│   └── pages/
│       ├── LoginPage.tsx
│       ├── CustomerDashboard.tsx        # view-switch shell
│       ├── OverviewPage.tsx             # zone, subscription, recent payments
│       ├── SubscriptionPage.tsx         # status + "Refresh from PayPal" + history
│       ├── ProfilePage.tsx              # name/phone/bins/return-location/access-notes
│       ├── SupportPage.tsx              # list + create tickets
│       ├── ReferralPage.tsx             # "Refer a Neighbor" + conversion list
│       ├── AdminDashboard.tsx           # view-switch shell
│       ├── AdminOverview.tsx
│       ├── CustomersPage.tsx
│       ├── TicketsPage.tsx
│       └── ZonesPage.tsx
└── dist/               # build output (gitignored)
```

## RLS / security notes
- All reads run under the **user's anon JWT** → existing RLS policies enforce
  per-user scoping (customers see only their own data; admins see all).
- Admin **writes** go through the secured Edge Functions (`admin-create-user`,
  `admin-reset-password`), which require `role='admin'` (service-role checked
  server-side).
- Customers can self-update `profiles` (phone/full_name) and their own
  `customers` row (number_of_bins, return_location, access_notes) — gated by
  migration `0012_customer_self_update.sql` which adds those UPDATE policies.
## Customer referrals ("Refer a Neighbor")
- A customer's shareable referral code is their own `customers.id` (stable,
  unique, non-guessable).
- Link: `https://curbsidecare.net/?ref=<customers.id>`
- A friend who opens that link and signs up on the marketing site has
  `referralCode` auto-injected into the signup form (see `index.html`), so
  `enroll-guest` records a row in `referrals` (migration `0013`).
- The referrer sees real conversion counts + referred emails on the **Refer a
  Neighbor** page in the web portal.
- Requires: migration `0013_customer_referrals.sql` + redeploy
  `enroll-guest` (records the referral) + `supabase db push`.
