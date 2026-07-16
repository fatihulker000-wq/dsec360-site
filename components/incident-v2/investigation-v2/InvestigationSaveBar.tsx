"use client";
export default function InvestigationSaveBar({ saving, completed, onSave, onComplete, onPrint }: {
  saving:boolean; completed:boolean; onSave():void; onComplete():void; onPrint():void;
}) {
  const button = (bg:string) => ({ border:"none", borderRadius:12, padding:"11px 16px", background:bg, color:"#fff", fontWeight:900, cursor:"pointer" } as React.CSSProperties);
  return (
    <div className="no-print" style={{ position:"sticky", bottom:12, zIndex:20, display:"flex", justifyContent:"flex-end", gap:10, flexWrap:"wrap", padding:14, borderRadius:16, background:"rgba(255,255,255,.95)", border:"1px solid #e5e7eb", boxShadow:"0 16px 40px rgba(15,23,42,.14)" }}>
      <button type="button" onClick={onSave} disabled={saving} style={button("#111827")}>{saving ? "Kaydediliyor..." : "Taslak Kaydet"}</button>
      <button type="button" onClick={onComplete} disabled={completed} style={button("#166534")}>{completed ? "Tamamlandı" : "Soruşturmayı Tamamla"}</button>
      <button type="button" onClick={onPrint} style={button("#1d4ed8")}>Rapor / PDF</button>
    </div>
  );
}
