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

## Settings

The public Supabase project URL and publishable key live in
`src/lib/supabase/config.ts`. Both are safe in the browser: the publishable key
only works together with Row Level Security. They can be overridden with the
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
environment variables.

Never put the Supabase **secret** key in this app.

## Deploying

1. Cloudflare dashboard > Workers & Pages > Create > Import a repository > `tikdue`.
2. Build command: `npx opennextjs-cloudflare build`. Deploy command: `npx opennextjs-cloudflare deploy`.
3. Deploy (no variables needed).
4. Worker > Settings > Domains & Routes > add custom domain `tikdue.app`.

Every push to `main` redeploys automatically.

## Local development

```bash
cp .env.example .env.local   # then fill in the publishable key
npm install
npm run dev
```
