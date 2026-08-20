# Curbside Care — Website

Free one-page marketing site for **Curbside Care**, a residential trash-bin concierge service in Gainesville, Texas.

- Brand: Curbside Care
- Slogan: Talk Trash To Us...Seriously....We love it!
- Pricing: $20/month full care (with $12 placement-only and $28 multi-bin options)
- Contact: 940-612-9836 / 940-612-9045 · CurbsideCare940@gmail.com
- Service area: Gainesville, Texas

The signup form sends guest contact/address details to the Curbside Care Supabase `enroll-guest` Edge Function for project `zhhkcnqwujuizytlbxeu`. That server function assigns the pickup zone, creates the customer record, and returns a PayPal approval URL. Until the Edge Function is deployed and PayPal secrets are configured, the form safely falls back to the call/text number.

## Files
- `index.html` — the single page (all CSS inline, no build step)
- `logo.svg` — vector brand logo (teal/green with citrus accent)
- `favicon.png` — PNG favicon rendered from the same brand mark
- `SUPABASE_SETUP.md` — secure Supabase/PayPal deployment and webhook setup

## Publish (GitHub Pages)
1. Create a repo (e.g. `curbside-care`) on GitHub.
2. Push this folder to the `main` branch.
3. In repo **Settings → Pages**, set source to `main` / root.
4. Site goes live at `https://<user>.github.io/curbside-care/`.

No build step, no dependencies — it's plain static HTML.
