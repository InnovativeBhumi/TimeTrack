import { admin, isCron, today, addDays } from "@/lib/admin";
import { hoursOf } from "@/lib/report";
import { sendEmail } from "@/lib/email";

// Sunday morning: reminder + last 7 days summary. Sunday evening (?nudge=1): only if still no tools list.
export async function GET(req: Request) {
  if (!isCron(req)) return new Response("Unauthorized", { status: 401 });
  const nudge = new URL(req.url).searchParams.get("nudge");
  const uid = process.env.CLIENT_USER_ID!, db = admin();
  const sunday = nudge ? addDays(today(), -1) : today(), monday = addDays(sunday, 1);
  const { data: req_ } = await db.from("tool_requests").select("items").eq("user_id", uid).eq("week_of", monday).maybeSingle();
  if (nudge && req_) return Response.json({ skipped: "already submitted" });
  const { data: trips } = await db.from("trips").select("*").eq("user_id", uid)
    .gte("work_date", addDays(sunday, -6)).lte("work_date", sunday).not("returned_at", "is", null);
  const hrs = (trips ?? []).reduce((s, x) => s + hoursOf(x), 0);
  await sendEmail({
    subject: nudge ? "Reminder: tools for Monday?" : "Sunday check-in: what tools do you need Monday?",
    html: `<p>${nudge ? "Still no tools list for tomorrow." : "What tools do you need for Monday?"}</p>
      <p><a href="${process.env.APP_URL}">Open the app and submit your list</a></p>
      <p>This week: <b>${hrs.toFixed(1)} hours</b> over ${trips?.length ?? 0} trips.</p>`,
  });
  return Response.json({ sent: true });
}
