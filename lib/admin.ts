import { createClient } from "@supabase/supabase-js";
// Server-only: bypasses RLS, used by cron jobs.
export const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
export const isCron = (req: Request) =>
  req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
export const TZ = "America/Vancouver";
export const today = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
export const addDays = (d: string, n: number) =>
  new Date(Date.parse(d) + n * 864e5).toISOString().slice(0, 10);
