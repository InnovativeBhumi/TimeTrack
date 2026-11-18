import "./globals.css";
import { Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
const head = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--head" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--mono" });
export const metadata = { title: "Warehouse Time Tracker" };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={`${head.variable} ${mono.variable}`}>{children}</body></html>;
}
