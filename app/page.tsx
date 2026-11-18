"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TZ = "America/Vancouver";
const day = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
const tm = (s?: string | null) => s ? new Date(s).toLocaleTimeString("en-CA", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }) : "—";
const pos = () => new Promise<{ lat: number; lng: number } | null>((r) => {
  const t = setTimeout(() => r(null), 8000);
  if (!navigator.geolocation) { clearTimeout(t); return r(null); }
  navigator.geolocation.getCurrentPosition(
    (p) => { clearTimeout(t); r({ lat: p.coords.latitude, lng: p.coords.longitude }); },
    () => { clearTimeout(t); r(null); }, { enableHighAccuracy: true, timeout: 8000 });
});
const nextMonday = () => { const d = new Date(day()); while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };

export default function Home() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [items, setItems] = useState(""), [label, setLabel] = useState(""), [start, setStart] = useState("");
  const [em, setEm] = useState(""), [pw, setPw] = useState(""), [msg, setMsg] = useState("");
  const monday = nextMonday();
  const open = trips.find((t) => !t.returned_at);

  const load = useCallback(async () => {
    const { data } = await supabase.from("trips").select("*").order("left_at", { ascending: false }).limit(60);
    setTrips(data ?? []);
    const { data: r } = await supabase.from("tool_requests").select("items").eq("week_of", monday).maybeSingle();
    setItems(r?.items ?? "");
  }, [monday]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setAuthed(!!data.session); if (data.session) load(); });
    const { data: s } = supabase.auth.onAuthStateChange((_, se) => { setAuthed(!!se); if (se) load(); });
    return () => s.subscription.unsubscribe();
  }, [load]);

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
    if (error) setMsg(error.message);
  }
   async function leave() {
    setMsg("Getting location…"); const p = await pos();
    const { error } = await supabase.from("trips").insert({ work_date: day(), left_lat: p?.lat, left_lng: p?.lng });
    if (error) return setMsg("Could not save: " + error.message);
    setMsg(p ? "" : "No GPS – time saved without location."); load();
  }
  async function back() {
    if (!open) return; const p = await pos();
    const { error } = await supabase.from("trips").update({ returned_at: new Date().toISOString(), return_lat: p?.lat, return_lng: p?.lng }).eq("id", open.id);
    if (error) return setMsg("Could not save: " + error.message);
    load();
  }
  async function addStop() {
    if (!open) return; const p = await pos();
    await supabase.from("trips").update({ stops: [...open.stops, { t: new Date().toISOString(), label, ...p }] }).eq("id", open.id);
    setLabel(""); load();
  }
  async function saveTools() {
    const { error } = await supabase.from("tool_requests").upsert({ week_of: monday, items }, { onConflict: "user_id,week_of" });
    setMsg(error ? "Could not save: " + error.message : "Tools list saved.");
  }
  async function download() {
    setMsg("Preparing report…");
    const { data } = await supabase.auth.getSession();
    const r = await fetch(`/api/report?start=${start}`, { headers: { Authorization: `Bearer ${data.session?.access_token}` } });
    if (!r.ok) return setMsg("Report failed: " + (await r.text()));
    const url = URL.createObjectURL(await r.blob());
    const a = document.createElement("a");
    a.href = url; a.download = `hours_${start}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove();
    setMsg(`Report ready: hours_${start}.xlsx (see your Downloads)`);
  }

  if (authed === null) return <main>Loading…</main>;
  if (!authed) return (
    <main><h1>Time Tracker</h1><div className="card">
      <input placeholder="Email" value={em} onChange={(e) => setEm(e.target.value)} />
      <input placeholder="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
      <button onClick={login}>Sign in</button><p className="mut">{msg}</p></div></main>);

  return (
    <main>
      <h1>Time Tracker</h1>
      <div className="card">
        {open ? <>
          <p><span className="stamp">OUT since {tm(open.left_at)}</span></p>
          <button className="big out" onClick={back}>Back at warehouse</button>
          <h2 style={{ marginTop: 16 }}>Add stop</h2>
          <input placeholder="Where are you? (optional label)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <button onClick={addStop}>Add stop with GPS</button>
        </> : <button className="big" onClick={leave}>Leave warehouse</button>}
        <p className="mut">{msg}</p>
      </div>
      <div className="card"><h2>Tools for Monday {monday}</h2>
        <textarea rows={3} value={items} onChange={(e) => setItems(e.target.value)} placeholder="Tools and materials needed" />
        <button onClick={saveTools}>Save</button></div>
      <div className="card"><h2>Hours report</h2>
        <label className="mut">Period start date (14 days)</label>
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <button disabled={!start} onClick={download}>Download Excel</button></div>
      <div className="card"><h2>Trips</h2><div className="scroll"><table>
        <thead><tr><th>Date</th><th>Out</th><th>Back</th><th>Hrs</th></tr></thead><tbody>
        {trips.map((t) => <tr key={t.id}><td>{t.work_date}</td><td>{tm(t.left_at)}</td><td>{tm(t.returned_at)}</td>
          <td>{t.returned_at ? ((+new Date(t.returned_at) - +new Date(t.left_at)) / 36e5).toFixed(2) : ""}</td></tr>)}
        </tbody></table></div></div>
      <button onClick={() => supabase.auth.signOut()}>Sign out</button>
    </main>);
}
