import { createClient } from "@supabase/supabase-js";
import { buildReport } from "@/lib/report";
import { addDays } from "@/lib/admin";

// Manual download: runs as the signed-in user, so row-level security applies.
export async function GET(req: Request) {
  const start = new URL(req.url).searchParams.get("start");
  if (!start) return new Response("start required", { status: 400 });
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: req.headers.get("authorization") ?? "" } } });
  const { data, error } = await sb.from("trips").select("*")
    .gte("work_date", start).lt("work_date", addDays(start, 14)).order("left_at");
  if (error) return new Response(error.message, { status: 401 });
  const { buffer } = await buildReport(data ?? [], `Period starting ${start}`);
  return new Response(buffer, { headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="hours_${start}.xlsx"` } });
}
