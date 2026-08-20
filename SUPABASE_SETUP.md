# Curbside Care public website → Supabase → PayPal

The website is static GitHub Pages HTML. It must never contain a Supabase service-role key or PayPal secret.

## 1. Deploy the backend

From the Curbside Care app repository:

```bash
supabase login
supabase link --project-ref zhhkcnqwujuizytlbxeu
supabase db push
supabase secrets set SUPABASE_URL=https://zhhkcnqwujuizytlbxeu.supabase.co SUPABASE_SERVICE_ROLE_KEY=... PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com PAYPAL_CLIENT_ID=... PAYPAL_CLIENT_SECRET=... PAYPAL_PLAN_ID=P-... PAYPAL_WEBHOOK_ID=... PAYPAL_RETURN_URL=https://curbsidecare940.github.io/?paypal=success PAYPAL_CANCEL_URL=https://curbsidecare940.github.io/?paypal=cancel GOOGLE_GEOCODING_API_KEY=... GOOGLE_ROUTES_API_KEY=... EXPO_ACCESS_TOKEN=...
supabase functions deploy enroll-guest
supabase functions deploy paypal-webhook
supabase functions deploy paypal-status
supabase functions deploy paypal-cancel
supabase functions deploy send-push
```

The public page calls:

```text
POST https://zhhkcnqwujuizytlbxeu.supabase.co/functions/v1/enroll-guest
```

The Pages site is configured for project `zhhkcnqwujuizytlbxeu`. If you use a different project, replace the `SUPABASE_FUNCTION_URL` constant in `index.html` before committing.

## 2. Guest flow

1. Guest enters full name, phone, email, address, bin count, and return location.
2. GitHub Pages sends the data to `enroll-guest` over HTTPS.
3. `enroll-guest` creates a guest intake record and customer/profile records.
4. Server-side geocoding resolves the address.
5. PostGIS assigns the Gainesville zone and pickup day.
6. The server creates a PayPal subscription approval URL.
7. The page redirects the guest to PayPal.
8. PayPal sends webhook events to `paypal-webhook`.
9. The webhook updates the local subscription/payment state and marks the guest intake active.
10. Mobile/admin screens read the synchronized customer/subscription data using Supabase RLS.

## 3. PayPal webhook

Set the webhook URL to:

```text
https://zhhkcnqwujuizytlbxeu.supabase.co/functions/v1/paypal-webhook
```

Subscribe to subscription activation/update/suspension/cancellation/expiration plus payment completed/denied/refunded events.

## 4. Security

- The public page contains no secrets.
- The website endpoint must have production rate limiting/WAF protection before public launch.
- Do not put `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, or Google server keys in `index.html`.
- Configure GitHub Pages only for static hosting.
- Run the PayPal sandbox flow before switching `PAYPAL_BASE_URL` to live.

## 5. Current contact fallback

If the deployed function is unavailable, the form shows a call/text fallback:

```text
940-612-9836
940-612-9045
CurbsideCare940@gmail.com
```

## 6. GitHub Pages publish

Commit `index.html`, the logo assets, this setup file, and README to the `master` branch of:

```text
CurbsideCare940/CurbsideCare940.github.io
```

The site URL is:

```text
https://curbsidecare940.github.io
```

Wait for GitHub Pages deployment and test the form over HTTPS.

## 7. Important data-model note

The website signup creates an Auth-independent `guest_intakes` record and a customer/profile record so the business is notified immediately. A production login account can be linked later through an invite or account-claim flow. Do not pretend the guest has an authenticated mobile session until that claim flow is implemented.

The current mobile app remains the operational source for authenticated employees/admins, while Supabase is the shared source of truth for customer, zone, subscription, and payment state.

## 8. Migration repair if 0003 already failed

The corrected migration drops the existing overloaded Gainesville lookup function before recreating it with the new return columns. Pull the latest app repository, then rerun:

```bash
supabase db push
```

If Supabase reports the failed migration as already recorded, inspect the migration history in the Supabase dashboard/CLI first; do not manually delete production history without a backup. The intended clean path is a fresh test project with all migrations applied from zero.

The guest function is located at:

```text
supabase/functions/enroll-guest/index.ts
```

Deploy it explicitly after pulling the latest repository:

```bash
supabase functions deploy enroll-guest
```

The Docker warning is not the reason the remote deployment failed; the original Windows checkout was missing the new function directory. The latest GitHub repository contains it.

## 9. App repository

```text
https://github.com/TechsNtheCity940/curbside-care
```

Website repository:

```text
https://github.com/CurbsideCare940/CurbsideCare940.github.io
```

Both repositories must be pulled to the latest commits before deployment.
