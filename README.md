# Warehouse Time Tracker

Single-user time tracker: Leave/Back buttons with GPS, stops, biweekly Excel report by email, Sunday tools reminder.
Stack: Next.js 14 (App Router), Supabase (Postgres + Auth + RLS), ExcelJS, Resend, Vercel Cron.

## Setup
1. `npm install`
2. Create a Supabase project. Run `supabase/schema.sql` in the SQL editor.
3. Supabase > Authentication > Users > Add user (the client's email + password). Copy that user's UUID.
4. Disable public sign-ups: Authentication > Providers > Email > turn off "Allow new users to sign up".
5. Create a Resend account (free). Use `onboarding@resend.dev` as sender while testing; verify a domain later.
6. Copy `.env.example` to `.env.local` and fill it in. `npm run dev`.
7. Deploy: push to GitHub, import in Vercel, add the same env vars. Crons in `vercel.json` activate automatically.

## Schedules (UTC, set for Pacific Standard Time; subtract 1h from the UTC hour in summer)
- Sun 17:00 UTC: reminder + last 7 days summary
- Mon 01:00 UTC (Sun evening): nudge only if tools list not submitted
- Mon 15:00 UTC: biweekly report, sends only when today is 14 days from `PAY_PERIOD_START`

Test a job: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/sunday`

## Notes
- GPS is captured only on button taps (reliable on phones, no background tracking).
- Vercel Hobby crons run once per day and may fire within the hour, which is fine here.
- Portfolio ideas: add offline queueing, editable trips with an audit log, a Playwright test, screenshots in this README.
