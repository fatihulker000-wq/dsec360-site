"use client";

import { useEffect, useMemo, useState } from "react";
import InvestigationLayout from "./InvestigationLayout";
import InvestigationProgress from "./InvestigationProgress";
import InvestigationSaveBar from "./InvestigationSaveBar";
import InvestigationSidebar from "./InvestigationSidebar";
import InvestigationStatusChip from "./InvestigationStatusChip";
import InvestigationSummaryPanel from "./SummaryPanel";
import InvestigationTimeline from "./Timeline";
import type {
  ActionItem, Attachment, IncidentOption, InvestigationFile, Interview, StageKey, Witness,
} from "./InvestigationTypes";
import {
  STAGES, loadInvestigation, progress, saveInvestigation, stageStatus, toAttachment,
} from "./InvestigationUtils";

export default function InvestigationCenter({ incidents, initialIncidentId, onSave }: {
  incidents: IncidentOption[];
  initialIncidentId?: string;
  onSave?(file:InvestigationFile):void;
}) {
  const [incidentId, setIncidentId] = useState(initialIncidentId || incidents[0]?.id || "");
  const incident = incidents.find((x) => x.id === incidentId) || incidents[0] || null;
  const [file, setFile] = useState<InvestigationFile | null>(null);
  const [active, setActive] = useState<StageKey>("INITIAL");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!incident) return setFile(null);
    setFile(loadInvestigation(incident));
    setActive("INITIAL");
  }, [incident?.id]);

  useEffect(() => {
    if (!file) return;
    const timer = window.setTimeout(() => saveInvestigation(file), 1200);
    return () => window.clearTimeout(timer);
  }, [file]);

  const state = useMemo(() => file ? progress(file) : { completed:0, total:7, percent:0 }, [file]);

  function patch(updater:(value:InvestigationFile)=>InvestigationFile) {
    setFile((current) => current ? { ...updater(current), updatedAt:new Date().toISOString() } : current);
  }

  async function addFiles(files:FileList | null, target:string, parentId?:string) {
    if (!files?.length) return;
    const list = await Promise.all(Array.from(files).map(toAttachment));
    patch((current) => {
      if (target === "initial") return { ...current, initial:{ ...current.initial, attachments:[...current.initial.attachments, ...list] } };
      if (target === "evidence") return { ...current, evidence:{ ...current.evidence, attachments:[...current.evidence.attachments, ...list] } };
      if (target === "root") return { ...current, rootCause:{ ...current.rootCause, attachments:[...current.rootCause.attachments, ...list] } };
      if (target === "witness") return { ...current, witnesses:current.witnesses.map((x) => x.id === parentId ? { ...x, attachments:[...x.attachments, ...list] } : x) };
      if (target === "interview") return { ...current, interviews:current.interviews.map((x) => x.id === parentId ? { ...x, attachments:[...x.attachments, ...list] } : x) };
      return { ...current, actions:current.actions.map((x) => x.id === parentId ? { ...x, attachments:[...x.attachments, ...list] } : x) };
    });
  }

  function removeFile(id:string, target:string, parentId?:string) {
    const remove = (items:Attachment[]) => items.filter((x) => x.id !== id);
    patch((current) => {
      if (target === "initial") return { ...current, initial:{ ...current.initial, attachments:remove(current.initial.attachments) } };
      if (target === "evidence") return { ...current, evidence:{ ...current.evidence, attachments:remove(current.evidence.attachments) } };
      if (target === "root") return { ...current, rootCause:{ ...current.rootCause, attachments:remove(current.rootCause.attachments) } };
      if (target === "witness") return { ...current, witnesses:current.witnesses.map((x) => x.id === parentId ? { ...x, attachments:remove(x.attachments) } : x) };
      if (target === "interview") return { ...current, interviews:current.interviews.map((x) => x.id === parentId ? { ...x, attachments:remove(x.attachments) } : x) };
      return { ...current, actions:current.actions.map((x) => x.id === parentId ? { ...x, attachments:remove(x.attachments) } : x) };
    });
  }

  function save() {
    if (!file) return;
    setSaving(true); saveInvestigation(file); onSave?.(file);
    window.setTimeout(() => setSaving(false), 350);
  }

  function complete() {
    if (!file) return;
    const missing = STAGES.filter(([key]) => stageStatus(file, key) !== "COMPLETED");
    if (missing.length) {
      alert("Tamamlanmamış aşamalar:\n\n" + missing.map(([,n,t]) => `${n}. ${t}`).join("\n"));
      return;
    }
    const next = { ...file, completed:true, conclusion:{ ...file.conclusion, completedAt:new Date().toISOString() } };
    setFile(next); saveInvestigation(next); onSave?.(next);
  }

  if (!incident || !file) return <Empty text="Soruşturma başlatmak için bir olay seçin." />;

  return (
    <section style={{ display:"grid", gap:20 }}>
      <header className="no-print" style={{ padding:22, borderRadius:22, background:"linear-gradient(135deg,#111827,#4a0d1a,#b91c1c)", color:"#fff" }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:18, flexWrap:"wrap", alignItems:"end" }}>
          <div>
            <div style={{ fontSize:12, fontWeight:900, opacity:.82 }}>D-SEC INVESTIGATION CENTER</div>
            <h2 style={{ margin:"8px 0 0", fontSize:30, fontWeight:950 }}>İş Kazası Soruşturma Merkezi</h2>
            <p style={{ maxWidth:780, lineHeight:1.7, opacity:.9 }}>Her kaza için ayrı soruşturma dosyası oluşturun ve yedi aşamayı tamamlayın.</p>
          </div>
          <select value={incident.id} onChange={(e) => setIncidentId(e.target.value)}
            style={{ minWidth:320, minHeight:46, borderRadius:12, padding:"10px 12px", fontWeight:800 }}>
            {incidents.map((x) => <option key={x.id} value={x.id}>{x.incidentNo} · {x.title}</option>)}
          </select>
        </div>
      </header>

      <InvestigationProgress {...state} />
      <InvestigationSummaryPanel file={file} />

      <InvestigationLayout
        sidebar={<InvestigationSidebar file={file} active={active} onSelect={setActive} />}
      >
        <div className="investigation-print-area">
          <ReportHeader file={file} />
          <StagePanel file={file} active={active} patch={patch} addFiles={addFiles} removeFile={removeFile} />
        </div>
      </InvestigationLayout>

      <InvestigationTimeline file={file} />

      <InvestigationSaveBar saving={saving} completed={file.completed} onSave={save} onComplete={complete} onPrint={() => window.print()} />

      <style jsx global>{`
        @media print {
          body * { visibility:hidden!important; }
          .investigation-print-area,.investigation-print-area * { visibility:visible!important; }
          .investigation-print-area { position:absolute!important; inset:0!important; width:100%!important; }
          .no-print { display:none!important; }
          @page { size:A4 portrait; margin:14mm; }
        }
      `}</style>
    </section>
  );
}

function StagePanel({ file, active, patch, addFiles, removeFile }:any) {
  const stage = STAGES.find(([key]) => key === active)!;
  return (
    <section style={{ padding:22, borderRadius:20, background:"#fff", border:"1px solid #e5e7eb" }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:20 }}>
        <div><div style={{ color:"#64748b", fontSize:11, fontWeight:900 }}>AŞAMA {stage[1]}</div><h3 style={{ margin:"5px 0", fontSize:24 }}>{stage[2]}</h3><p style={{ color:"#64748b" }}>{stage[3]}</p></div>
        <InvestigationStatusChip status={stageStatus(file, active)} />
      </div>
      {active === "INITIAL" && <Initial file={file} patch={patch} addFiles={addFiles} removeFile={removeFile} />}
      {active === "EVIDENCE" && <Evidence file={file} patch={patch} addFiles={addFiles} removeFile={removeFile} />}
      {active === "WITNESSES" && <Witnesses file={file} patch={patch} addFiles={addFiles} removeFile={removeFile} />}
      {active === "INTERVIEWS" && <Interviews file={file} patch={patch} addFiles={addFiles} removeFile={removeFile} />}
      {active === "ROOT_CAUSE" && <RootCause file={file} patch={patch} addFiles={addFiles} removeFile={removeFile} />}
      {active === "ACTIONS" && <Actions file={file} patch={patch} addFiles={addFiles} removeFile={removeFile} />}
      {active === "CONCLUSION" && <Conclusion file={file} patch={patch} />}
    </section>
  );
}

const grid = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14 } as React.CSSProperties;
const card = { display:"grid", gap:14, padding:18, borderRadius:17, background:"#fff", border:"1px solid #e5e7eb" } as React.CSSProperties;

function Initial({ file, patch, addFiles, removeFile }:any) {
  const x = file.initial;
  const update = (values:any) => patch((c:InvestigationFile) => ({ ...c, initial:{ ...c.initial, ...values } }));
  return <div style={{ display:"grid", gap:15 }}>
    <Area label="Olay Özeti *" value={x.eventSummary} onChange={(v:string) => update({ eventSummary:v })} />
    <Area label="İlk Müdahale *" value={x.firstResponse} onChange={(v:string) => update({ firstResponse:v })} />
    <Area label="İlk Gözlem ve Tespitler *" value={x.firstObservations} onChange={(v:string) => update({ firstObservations:v })} />
    <div style={grid}><Input label="Değerlendirmeyi Yapan *" value={x.investigator} onChange={(v:string) => update({ investigator:v })} /><Input label="Değerlendirme Tarihi *" type="date" value={x.assessmentDate} onChange={(v:string) => update({ assessmentDate:v })} /></div>
    <Files title="İlk Değerlendirme Ekleri" items={x.attachments} onAdd={(f:FileList|null) => addFiles(f,"initial")} onRemove={(id:string) => removeFile(id,"initial")} />
  </div>;
}

function Evidence({ file, patch, addFiles, removeFile }:any) {
  return <div style={{ display:"grid", gap:15 }}>
    <Area label="Delil ve Doküman Açıklaması *" value={file.evidence.description} onChange={(v:string) => patch((c:InvestigationFile) => ({ ...c, evidence:{ ...c.evidence, description:v } }))} />
    <Files title="Fotoğraf, Video, Ses, PDF, Word ve Excel *" items={file.evidence.attachments} onAdd={(f:FileList|null) => addFiles(f,"evidence")} onRemove={(id:string) => removeFile(id,"evidence")} />
  </div>;
}

function Witnesses({ file, patch, addFiles, removeFile }:any) {
  const add = () => patch((c:InvestigationFile) => ({ ...c, witnesses:[...c.witnesses,{ id:crypto.randomUUID(), fullName:"", jobTitle:"", phone:"", statement:"", statementDate:"", signed:false, attachments:[] } as Witness] }));
  const update = (id:string, values:any) => patch((c:InvestigationFile) => ({ ...c, witnesses:c.witnesses.map((x) => x.id === id ? { ...x, ...values } : x) }));
  return <div style={{ display:"grid", gap:14 }}><Add title="Yeni Tanık Ekle" onClick={add} />
    {!file.witnesses.length ? <Empty text="Henüz tanık eklenmedi." /> : file.witnesses.map((x:Witness,i:number) => <article key={x.id} style={card}>
      <Header title={`Tanık ${i+1}`} onDelete={() => patch((c:InvestigationFile) => ({ ...c, witnesses:c.witnesses.filter((a) => a.id !== x.id) }))} />
      <div style={grid}><Input label="Ad Soyad *" value={x.fullName} onChange={(v:string) => update(x.id,{fullName:v})} /><Input label="Görev / Ünvan" value={x.jobTitle} onChange={(v:string) => update(x.id,{jobTitle:v})} /><Input label="Telefon" value={x.phone} onChange={(v:string) => update(x.id,{phone:v})} /><Input label="İfade Tarihi *" type="date" value={x.statementDate} onChange={(v:string) => update(x.id,{statementDate:v})} /></div>
      <Area label="Tanık İfadesi *" value={x.statement} onChange={(v:string) => update(x.id,{statement:v})} />
      <label><input type="checkbox" checked={x.signed} onChange={(e) => update(x.id,{signed:e.target.checked})} /> İfade imzalandı</label>
      <Files title="İfade Tutanakları" items={x.attachments} onAdd={(f:FileList|null) => addFiles(f,"witness",x.id)} onRemove={(id:string) => removeFile(id,"witness",x.id)} />
    </article>)}
  </div>;
}

function Interviews({ file, patch, addFiles, removeFile }:any) {
  const add = () => patch((c:InvestigationFile) => ({ ...c, interviews:[...c.interviews,{ id:crypto.randomUUID(), personName:"", role:"", interviewDate:"", interviewer:"", notes:"", attachments:[] } as Interview] }));
  const update = (id:string, values:any) => patch((c:InvestigationFile) => ({ ...c, interviews:c.interviews.map((x) => x.id === id ? { ...x, ...values } : x) }));
  return <div style={{ display:"grid", gap:14 }}><Add title="Yeni Görüşme Ekle" onClick={add} />
    {!file.interviews.length ? <Empty text="Henüz görüşme eklenmedi." /> : file.interviews.map((x:Interview,i:number) => <article key={x.id} style={card}>
      <Header title={`Görüşme ${i+1}`} onDelete={() => patch((c:InvestigationFile) => ({ ...c, interviews:c.interviews.filter((a) => a.id !== x.id) }))} />
      <div style={grid}><Input label="Görüşülen Kişi *" value={x.personName} onChange={(v:string) => update(x.id,{personName:v})} /><Input label="Görev / İlişki" value={x.role} onChange={(v:string) => update(x.id,{role:v})} /><Input label="Görüşme Tarihi *" type="date" value={x.interviewDate} onChange={(v:string) => update(x.id,{interviewDate:v})} /><Input label="Görüşmeyi Yapan" value={x.interviewer} onChange={(v:string) => update(x.id,{interviewer:v})} /></div>
      <Area label="Görüşme Notları *" value={x.notes} onChange={(v:string) => update(x.id,{notes:v})} />
      <Files title="Görüşme Ekleri" items={x.attachments} onAdd={(f:FileList|null) => addFiles(f,"interview",x.id)} onRemove={(id:string) => removeFile(id,"interview",x.id)} />
    </article>)}
  </div>;
}

function RootCause({ file, patch, addFiles, removeFile }:any) {
  const x = file.rootCause;
  const update = (values:any) => patch((c:InvestigationFile) => ({ ...c, rootCause:{ ...c.rootCause, ...values } }));
  return <div style={{ display:"grid", gap:15 }}>
    <label><span>Analiz Yöntemi *</span><select value={x.method} onChange={(e) => update({method:e.target.value})} style={inputStyle}><option value="FIVE_WHY">5 Neden</option><option value="FISHBONE">Balık Kılçığı</option><option value="RCA">Temel Neden Analizi</option><option value="OTHER">Diğer</option></select></label>
    <Area label="Analiz Metni *" value={x.analysisText} onChange={(v:string) => update({analysisText:v})} /><Area label="Doğrudan Neden *" value={x.directCause} onChange={(v:string) => update({directCause:v})} /><Area label="Katkıda Bulunan Nedenler" value={x.contributingCauses} onChange={(v:string) => update({contributingCauses:v})} /><Area label="Sistemsel / Yönetimsel Neden" value={x.systemicCause} onChange={(v:string) => update({systemicCause:v})} /><Area label="Nihai Kök Neden *" value={x.finalRootCause} onChange={(v:string) => update({finalRootCause:v})} />
    <Files title="Analiz Dokümanları" items={x.attachments} onAdd={(f:FileList|null) => addFiles(f,"root")} onRemove={(id:string) => removeFile(id,"root")} />
  </div>;
}

function Actions({ file, patch, addFiles, removeFile }:any) {
  const add = () => patch((c:InvestigationFile) => ({ ...c, actions:[...c.actions,{ id:crypto.randomUUID(), title:"", description:"", responsible:"", priority:"MEDIUM", dueDate:"", status:"OPEN", closingNote:"", attachments:[] } as ActionItem] }));
  const update = (id:string, values:any) => patch((c:InvestigationFile) => ({ ...c, actions:c.actions.map((x) => x.id === id ? { ...x, ...values } : x) }));
  return <div style={{ display:"grid", gap:14 }}><Add title="Yeni DÖF / Aksiyon Ekle" onClick={add} />
    {!file.actions.length ? <Empty text="Henüz aksiyon eklenmedi." /> : file.actions.map((x:ActionItem,i:number) => <article key={x.id} style={card}>
      <Header title={`Aksiyon ${i+1}`} onDelete={() => patch((c:InvestigationFile) => ({ ...c, actions:c.actions.filter((a) => a.id !== x.id) }))} />
      <div style={grid}><Input label="Başlık *" value={x.title} onChange={(v:string) => update(x.id,{title:v})} /><Input label="Sorumlu *" value={x.responsible} onChange={(v:string) => update(x.id,{responsible:v})} /><Input label="Termin *" type="date" value={x.dueDate} onChange={(v:string) => update(x.id,{dueDate:v})} />
      <label><span>Öncelik</span><select value={x.priority} onChange={(e) => update(x.id,{priority:e.target.value})} style={inputStyle}><option value="LOW">Düşük</option><option value="MEDIUM">Orta</option><option value="HIGH">Yüksek</option><option value="CRITICAL">Kritik</option></select></label>
      <label><span>Durum *</span><select value={x.status} onChange={(e) => update(x.id,{status:e.target.value})} style={inputStyle}><option value="OPEN">Açık</option><option value="IN_PROGRESS">Devam Ediyor</option><option value="COMPLETED">Tamamlandı</option></select></label></div>
      <Area label="Aksiyon Açıklaması" value={x.description} onChange={(v:string) => update(x.id,{description:v})} /><Area label="Kapanış Açıklaması" value={x.closingNote} onChange={(v:string) => update(x.id,{closingNote:v})} />
      <Files title="Kapanış Kanıtları" items={x.attachments} onAdd={(f:FileList|null) => addFiles(f,"action",x.id)} onRemove={(id:string) => removeFile(id,"action",x.id)} />
    </article>)}
  </div>;
}

function Conclusion({ file, patch }:any) {
  const x = file.conclusion;
  const update = (values:any) => patch((c:InvestigationFile) => ({
    ...c,
    conclusion:{ ...c.conclusion, ...values }
  }));

  const checks = [
    ["sgkNotified", "SGK bildirimi tamamlandı"],
    ["ibysReady", "İBYS hazırlığı tamamlandı"],
    ["actionCreated", "Gerekli DÖF / aksiyonlar oluşturuldu"],
    ["documentsComplete", "Soruşturma evrakları tamamlandı"],
    ["managerApproved", "Yönetici onayı alındı"],
  ];

  return <div style={{ display:"grid", gap:15 }}>
    <Area label="Genel Değerlendirme *" value={x.overallAssessment} onChange={(v:string) => update({overallAssessment:v})} />
    <Area label="Yasal Değerlendirme" value={x.legalAssessment} onChange={(v:string) => update({legalAssessment:v})} />
    <Area label="Öneriler *" value={x.recommendations} onChange={(v:string) => update({recommendations:v})} />
    <Area label="Tekrarını Önleme Planı *" value={x.recurrencePrevention} onChange={(v:string) => update({recurrencePrevention:v})} />

    <section style={{ padding:16, borderRadius:16, background:"#f8fafc", border:"1px solid #e5e7eb" }}>
      <strong>Kapanış Kontrol Listesi</strong>
      <div style={{ display:"grid", gap:10, marginTop:12 }}>
        {checks.map(([key, label]) => (
          <label key={key} style={{ display:"flex", gap:9, alignItems:"center", fontWeight:800 }}>
            <input
              type="checkbox"
              checked={Boolean(x[key])}
              onChange={(event) => update({ [key]: event.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>
    </section>

    <div style={grid}>
      <Input label="Hazırlayan *" value={x.preparedBy} onChange={(v:string) => update({preparedBy:v})} />
      <Input label="Onaylayan *" value={x.approvedBy} onChange={(v:string) => update({approvedBy:v})} />
    </div>
  </div>;
}

function Files({ title, items, onAdd, onRemove }:any) {
  return <section style={{ padding:16, borderRadius:16, border:"1px dashed #cbd5e1", background:"#f8fafc" }}><strong>{title}</strong><input type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={(e) => { void onAdd(e.target.files); e.target.value=""; }} style={{ marginTop:12 }} />
  {!!items.length && <div style={{ display:"grid", gap:8, marginTop:12 }}>{items.map((x:Attachment) => <div key={x.id} style={{ display:"flex", justifyContent:"space-between", gap:10, padding:10, borderRadius:10, background:"#fff", border:"1px solid #e5e7eb" }}><span>{x.name}</span><div style={{ display:"flex", gap:6 }}>{x.dataUrl && <a href={x.dataUrl} download={x.name}>İndir</a>}<button type="button" onClick={() => onRemove(x.id)}>Sil</button></div></div>)}</div>}</section>;
}

function ReportHeader({ file }: { file:InvestigationFile }) {
  return <section style={{ marginBottom:18, padding:20, borderRadius:18, background:"#fff", border:"1px solid #e5e7eb" }}><div style={{ color:"#7a0017", fontSize:12, fontWeight:950 }}>D-SEC İŞ KAZASI SORUŞTURMA DOSYASI</div><h3>{file.incidentNo} · {file.incidentTitle}</h3><div style={grid}><Info label="Çalışan" value={file.employeeName || "-"} /><Info label="Tarih" value={file.eventDate || "-"} /><Info label="Departman" value={file.department || "-"} /><Info label="Lokasyon" value={file.location || "-"} /><Info label="Şiddet" value={String(file.severity ?? "-")} /></div></section>;
}
function Input({ label, value, type="text", onChange }:any){return <label style={{display:"grid",gap:7}}><span>{label}</span><input type={type} value={value} onChange={(e)=>onChange(e.target.value)} style={inputStyle}/></label>}
function Area({ label, value, onChange }:any){return <label style={{display:"grid",gap:7}}><span>{label}</span><textarea value={value} onChange={(e)=>onChange(e.target.value)} rows={5} style={{...inputStyle,minHeight:115,fontFamily:"inherit"}}/></label>}
function Add({title,onClick}:{title:string;onClick():void}){return <button type="button" onClick={onClick} style={{justifySelf:"start",border:"none",borderRadius:12,padding:"11px 15px",background:"#7a0017",color:"#fff",fontWeight:900}}>+ {title}</button>}
function Header({title,onDelete}:{title:string;onDelete():void}){return <div style={{display:"flex",justifyContent:"space-between"}}><strong>{title}</strong><button type="button" onClick={onDelete}>Sil</button></div>}
function Empty({text}:{text:string}){return <div style={{padding:26,textAlign:"center",borderRadius:14,background:"#f8fafc",color:"#64748b",fontWeight:800}}>{text}</div>}
function Info({label,value}:{label:string;value:string}){return <div style={{padding:12,borderRadius:12,background:"#f8fafc",border:"1px solid #e5e7eb"}}><small>{label}</small><div style={{marginTop:5,fontWeight:900}}>{value}</div></div>}
const inputStyle:React.CSSProperties={width:"100%",minHeight:44,borderRadius:12,border:"1px solid #d1d5db",padding:"10px 12px",boxSizing:"border-box",background:"#fff"};
