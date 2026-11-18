import ExcelJS from "exceljs";
const TZ = "America/Vancouver";
const t = (s: string) => new Date(s).toLocaleTimeString("en-CA", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const pt = (lat?: number | null, lng?: number | null) => (lat != null ? `${lat.toFixed(4)}, ${lng!.toFixed(4)}` : "");
export const hoursOf = (x: any) => (+new Date(x.returned_at) - +new Date(x.left_at)) / 36e5;

export async function buildReport(trips: any[], title: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Hours");
  ws.columns = [
    { header: "Date", key: "d", width: 13 }, { header: "Left warehouse", key: "l", width: 16 },
    { header: "Back at warehouse", key: "b", width: 18 }, { header: "Hours", key: "h", width: 10 },
    { header: "Locations", key: "loc", width: 70 },
  ];
  ws.getRow(1).font = { bold: true };
  let total = 0;
  for (const x of trips.filter((x) => x.returned_at)) {
    const h = hoursOf(x); total += h;
    const where = [pt(x.left_lat, x.left_lng), ...(x.stops ?? []).map((s: any) => s.label || pt(s.lat, s.lng)), pt(x.return_lat, x.return_lng)]
      .filter(Boolean).join(" → ");
    ws.addRow({ d: x.work_date, l: t(x.left_at), b: t(x.returned_at), h: +h.toFixed(2), loc: where });
  }
  ws.addRow({});
  const r = ws.addRow({ b: "TOTAL", h: +total.toFixed(2) });
  r.font = { bold: true };
  ws.addRow({ d: title });
  return { buffer: Buffer.from(await wb.xlsx.writeBuffer()), total };
}
