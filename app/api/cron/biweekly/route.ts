import { admin, isCron, today, addDays } from "@/lib/admin";
import { buildReport } from "@/lib/report";
import { sendEmail } from "@/lib/email";

// Runs every Monday; only acts when today is a 14-day boundary from PAY_PERIOD_START.
export async function GET(req: Request) {
  if (!isCron(req)) return new Response("Unauthorized", { status: 401 });
  const end = today();
  const days = (Date.parse(end) - Date.parse(process.env.PAY_PERIOD_START!)) / 864e5;
  if (days <= 0 || days % 14 !== 0) return Response.json({ skipped: true });
  const start = addDays(end, -14);
  const { data } = await admin().from("trips").select("*").eq("user_id", process.env.CLIENT_USER_ID!)
    .gte("work_date", start).lt("work_date", end).order("left_at");
  const { buffer, total } = await buildReport(data ?? [], `${start} to ${addDays(end, -1)}`);
  await sendEmail({
    subject: `Hours report: ${start} to ${addDays(end, -1)}`,
    html: `<p>Your 2-week hours report is attached.</p><p><b>Total: ${total.toFixed(2)} hours</b> across ${data?.length ?? 0} trips.</p>`,
    file: { name: `hours_${start}.xlsx`, data: buffer },
  });
  return Response.json({ sent: true });
}
