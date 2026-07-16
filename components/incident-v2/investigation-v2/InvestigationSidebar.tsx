"use client";
import type { InvestigationFile, StageKey } from "./InvestigationTypes";
import { STAGES, stageStatus } from "./InvestigationUtils";
import InvestigationStatusChip from "./InvestigationStatusChip";

export default function InvestigationSidebar({ file, active, onSelect }: {
  file: InvestigationFile; active: StageKey; onSelect(key:StageKey):void;
}) {
  return (
    <aside style={{ display:"grid", gap:10 }}>
      {STAGES.map(([key, number, title]) => (
        <button key={key} type="button" onClick={() => onSelect(key)}
          style={{ border: active === key ? "1px solid #b91c1c" : "1px solid #e5e7eb", borderRadius:16, padding:14, background: active === key ? "#fff7f7" : "#fff", textAlign:"left", cursor:"pointer" }}>
          <div style={{ display:"grid", gridTemplateColumns:"38px 1fr", gap:11 }}>
            <div style={{ width:36, height:36, borderRadius:12, display:"grid", placeItems:"center", background: active === key ? "#b91c1c" : "#111827", color:"#fff", fontWeight:950 }}>{number}</div>
            <div>
              <div style={{ fontWeight:950 }}>{title}</div>
              <div style={{ marginTop:7 }}><InvestigationStatusChip status={stageStatus(file, key)} /></div>
            </div>
          </div>
        </button>
      ))}
    </aside>
  );
}
