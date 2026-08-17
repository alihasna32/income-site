# Cloudflare Pages Deployment (bd-income-site.pages.dev)

CoinQuest runs on Cloudflare **Pages** (advanced mode) via OpenNext. The full Next.js
server (SSR pages, API routes, middleware) runs inside the Pages `_worker.js`;
static assets (JS/CSS/fonts) are served by the worker through the ASSETS binding.

## Prerequisites

- Logged in: `npx wrangler login`
- Secrets already set on the project (Supabase keys, service role, Resend,
  MAIL_FROM, NEXT_PUBLIC_SITE_URL). If a new secret is added to the app, set it
  with: `Get-Content .env.local` value piped into
  `npx wrangler pages secret put NAME --project-name bd-income-site`

## Redeploy flow (after any code change)

```powershell
# 1. Build the OpenNext worker.
#    -c wrangler.build.jsonc is REQUIRED: it sets assets.run_worker_first=true,
#    which makes the worker serve static assets itself (Pages advanced mode).
#    Without it, static assets 404 (the flag is baked into the build output).
npx opennextjs-cloudflare build -c wrangler.build.jsonc

# 2. Assemble the Pages deploy directory (copy in the worker + sidecar dirs).
node scripts/assemble-pages.mjs

# 3. Deploy to Cloudflare Pages.
#    wrangler.jsonc (pages-safe config: no "assets" key — Pages rejects it) is read from cwd.
npx wrangler pages deploy .open-next/pages-dist --project-name bd-income-site --branch main --commit-dirty true
```

## Automatic deploys (CI/CD)

Pushes to `main` are deployed automatically by GitHub Actions
(`.github/workflows/deploy.yml`): `npm ci` → OpenNext build (`-c wrangler.build.jsonc`)
→ `node scripts/assemble-pages.mjs` → `wrangler pages deploy`.

Required GitHub repo secret (Actions → Settings → Secrets and variables):

- `CLOUDFLARE_API_TOKEN` — API token with **Cloudflare Pages:Edit** permission
  (dashboard → My Profile → API Tokens → Create Token → "Cloudflare Pages" → Edit).
  Only this one secret is needed: the workflow hardcodes the account id and the
  public `NEXT_PUBLIC_*` values come from the committed `.env.production`.
  Runtime secrets (service role key, Resend) stay on the Pages project itself
  and never enter the repo.

Once the secret is added, the next push to `main` triggers a deploy automatically.

## Notes / gotchas

- `wrangler.jsonc` is the Pages deploy config (KV binding `NEXT_INC_CACHE_KV` for
  the Next.js incremental cache). Pages rejects the `assets` key, hence the
  separate `wrangler.build.jsonc` for builds.
- `wrangler pages deploy` does not accept `--config` paths — it always reads
  `wrangler.jsonc` from the working directory.
- node_modules inside the deploy dir is skipped automatically by wrangler.
- `_buildManifest.js` 404s are expected (app router does not emit it);
  `vercel.png` in `public/` is a leftover and can be deleted.
- The DB migrations `202608170004_auto_username.sql` and
  `202608170005_fix_profiles_policy.sql` still need to be applied in the
  Supabase dashboard SQL editor (sidebar username + profile updates).