export async function sendEmail(o: { subject: string; html: string; file?: { name: string; data: Buffer } }) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM, to: [process.env.CLIENT_EMAIL], subject: o.subject, html: o.html,
      attachments: o.file ? [{ filename: o.file.name, content: o.file.data.toString("base64") }] : undefined,
    }),
  });
  if (!r.ok) throw new Error(await r.text());
}
