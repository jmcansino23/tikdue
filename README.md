# Tikdue

Never miss a bill or expiry, here or back home. A reminder web app for expats
who manage bills, card dues and documents across two countries.

- **App:** Next.js (App Router), installable as a phone app (PWA)
- **Hosting:** Cloudflare Workers via the OpenNext adapter, at https://tikdue.app
- **Database and sign-in:** Supabase (Mumbai region), Google sign-in

## Project layout

| Path | What it is |
| --- | --- |
| `src/app/page.tsx` | Welcome screen with Google sign-in |
| `src/app/home/page.tsx` | Signed-in home screen |
| `src/app/auth/callback/route.ts` | Finishes Google sign-in |
| `src/middleware.ts` | Keeps sessions fresh, protects `/home` |
| `src/lib/supabase/` | Supabase clients for browser and server |
| `src/app/manifest.ts`, `public/icons/` | Phone-app name and icons |
| `supabase/migrations/0001_init.sql` | Database tables with Row Level Security |
| `wrangler.jsonc`, `open-next.config.ts` | Cloudflare settings |

## Settings (environment variables)

Both are public values from Supabase > Project Settings > API Keys:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jwtdjgruigezzkbxwwjt.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the publishable key (`sb_publishable_…`) |

Values starting with `NEXT_PUBLIC_` are built into the app, so in Cloudflare
add them as **build variables** (Worker > Settings > Build > Variables and
secrets), not only as runtime variables.

Never put the Supabase **secret** / `service_role` key in this app.

## Deploying

1. Cloudflare dashboard > Workers & Pages > Create > Import a repository > `tikdue`.
2. Build command: `npx opennextjs-cloudflare build`. Deploy command: `npx opennextjs-cloudflare deploy`.
3. Add the two build variables above, then deploy.
4. Worker > Settings > Domains & Routes > add custom domain `tikdue.app`.

Every push to `main` redeploys automatically.

## Local development

```bash
cp .env.example .env.local   # then fill in the publishable key
npm install
npm run dev
```
