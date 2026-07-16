"use client";
import type { ReactNode } from "react";
export default function InvestigationLayout({ sidebar, children }: { sidebar:ReactNode; children:ReactNode }) {
  return (
    <div className="investigation-layout" style={{ display:"grid", gridTemplateColumns:"minmax(260px,320px) minmax(0,1fr)", gap:20, alignItems:"start" }}>
      <div style={{ position:"sticky", top:16 }}>{sidebar}</div>
      <main style={{ minWidth:0 }}>{children}</main>
      <style jsx>{`@media(max-width:980px){.investigation-layout{grid-template-columns:1fr!important}.investigation-layout>div:first-child{position:static!important}}`}</style>
    </div>
  );
}
