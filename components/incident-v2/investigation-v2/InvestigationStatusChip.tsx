"use client";
import type { StageStatus } from "./InvestigationTypes";

export default function InvestigationStatusChip({ status }: { status: StageStatus }) {
  const map = {
    WAITING: ["BEKLİYOR", "#f1f5f9", "#475569"],
    IN_PROGRESS: ["HAZIRLANIYOR", "#fef3c7", "#92400e"],
    COMPLETED: ["TAMAMLANDI", "#dcfce7", "#166534"],
  } as const;
  const [label, background, color] = map[status];
  return (
    <span style={{ display:"inline-flex", padding:"7px 11px", borderRadius:999, background, color, fontSize:11, fontWeight:900 }}>
      {label}
    </span>
  );
}
