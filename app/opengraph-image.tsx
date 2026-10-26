import { ImageResponse } from "next/og";

export const alt = "AfroCodeurs — Communauté tech africaine et panafricaine";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#111111", color: "#ffffff", padding: "70px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "22px" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "72px", height: "72px", background: "#F5B800", color: "#111111", borderRadius: "8px", fontSize: "48px", fontWeight: 700 }}>A</div><div style={{ fontSize: "54px", fontWeight: 700 }}>AfroCodeurs</div></div>
    <div style={{ fontSize: "58px", lineHeight: 1.15, fontWeight: 700 }}>La communauté tech africaine et panafricaine</div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "26px", color: "#F5B800" }}><div>Apprendre · Construire · Collaborer</div><div>afrocodeurs.org</div></div>
  </div>, size);
}
