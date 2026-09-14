"use client";

import { useMemo, useState } from "react";

type Employee = {
  id: string;
  full_name: string;
  department?: string | null;
  job_title?: string | null;
  start_date?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  disability_status?: string | null;
  education_level?: string | null;
  blood_type?: string | null;
  training_status?: string | null;
  health_status?: string | null;
  ppe_status?: string | null;
  document_status?: string | null;
  risk_status?: string | null;
  accident_count?: number | null;
  training_completion_rate?: number | null;
  legal_training_completed_minutes?: number | null;
  legal_training_required_minutes?: number | null;
  legal_training_missing_minutes?: number | null;
  health_ek2_count?: number | null;
  health_next_due_at?: string | null;
  active: boolean;
};

type Props = {
  employees: Employee[];
  selectedCompanyName: string;
  onEmployeeClick?: (employeeId: string) => void;
};

type Tone = "good" | "warn" | "danger" | "info";
type DistKey = "department" | "job" | "seniority" | "age" | "blood" | "education" | "gender";

const C = {
  brand: "#a30d22",
  brand2: "#6f0817",
  wine: "#390916",
  wine2: "#160a13",
  red: "#dc263c",
  green: "#19b56b",
  amber: "#f1a11a",
  blue: "#2e7de9",
  ink: "#111827",
  muted: "#64748b",
  border: "#e7eaf0",
  soft: "#f7f8fb",
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,.96)",
  border: `1px solid ${C.border}`,
  borderRadius: 22,
  boxShadow: "0 14px 40px rgba(15,23,42,.06)",
};

function norm(v: unknown) { return String(v ?? "").trim().toUpperCase(); }
function missing(v: unknown) { return !String(v ?? "").trim(); }
function pct(a: number, b: number) { return b ? Math.round((a / b) * 100) : 0; }
function clamp(n: number, min = 0, max = 100) { return Math.min(max, Math.max(min, n)); }
function years(date?: string | null) { if (!date) return null; const d = new Date(date); if (Number.isNaN(d.getTime())) return null; return Math.max(0, (Date.now() - d.getTime()) / 31557600000); }
function age(date?: string | null) { if (!date) return null; const d = new Date(date); if (Number.isNaN(d.getTime())) return null; const n = new Date(); let a = n.getFullYear() - d.getFullYear(); const m = n.getMonth() - d.getMonth(); if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--; return a >= 0 && a < 100 ? a : null; }

function countBy(items: Employee[], getter: (e: Employee) => string, unknown = "Bilinmiyor") {
  const m = new Map<string, number>();
  items.forEach((e) => { const raw = getter(e).trim(); const k = raw || unknown; m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function statusIssues(e: Employee) {
  const issues: string[] = [];
  if (["MISSING", "EXPIRING"].includes(norm(e.training_status))) issues.push("Eğitim");
  if (["MISSING", "EXPIRING"].includes(norm(e.health_status))) issues.push("Sağlık");
  if (["MISSING", "EXPIRING"].includes(norm(e.ppe_status))) issues.push("KKD");
  if (["MISSING", "EXPIRING"].includes(norm(e.document_status))) issues.push("Belge");
  if (["HIGH", "CRITICAL"].includes(norm(e.risk_status))) issues.push("Risk");
  if (Number(e.accident_count || 0) > 0) issues.push("Kaza/Olay");
  return issues;
}

function actionPriority(e: Employee) {
  let score = 0;
  if (norm(e.risk_status) === "CRITICAL") score += 100;
  else if (norm(e.risk_status) === "HIGH") score += 80;
  if (norm(e.health_status) === "MISSING") score += 65;
  else if (norm(e.health_status) === "EXPIRING") score += 40;
  if (norm(e.training_status) === "MISSING") score += 60;
  else if (norm(e.training_status) === "EXPIRING") score += 35;
  if (norm(e.ppe_status) === "MISSING") score += 45;
  if (norm(e.document_status) === "MISSING") score += 35;
  score += Math.min(30, Number(e.accident_count || 0) * 10);
  return clamp(score);
}

function riskText(score: number) {
  if (score >= 75) return { label: "Kritik", tone: "danger" as Tone };
  if (score >= 55) return { label: "Yüksek Risk", tone: "danger" as Tone };
  if (score >= 35) return { label: "Orta Risk", tone: "warn" as Tone };
  return { label: "Düşük Risk", tone: "good" as Tone };
}

function toneColor(tone: Tone) {
  return tone === "good" ? C.green : tone === "warn" ? C.amber : tone === "danger" ? C.red : C.blue;
}

function Icon({ children, tone = "info" }: { children: React.ReactNode; tone?: Tone }) {
  const color = toneColor(tone);
  return <div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", color, background: `${color}14`, fontSize: 20, flex: "0 0 auto" }}>{children}</div>;
}

function TopMetric({ label, value, detail, tone, icon }: { label: string; value: string | number; detail: string; tone: Tone; icon: React.ReactNode }) {
  return <div style={{ ...card, padding: 15, minWidth: 154, flex: "1 1 155px" }}>
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}><Icon tone={tone}>{icon}</Icon><div><div style={{ fontSize: 10, fontWeight: 950, letterSpacing: .35, color: C.muted }}>{label}</div><div style={{ fontSize: 28, lineHeight: 1, marginTop: 5, fontWeight: 1000, color: tone === "danger" ? C.brand : C.ink }}>{value}</div></div></div>
    <div style={{ fontSize: 11, color: C.muted, marginTop: 10, lineHeight: 1.45 }}>{detail}</div>
  </div>;
}

function ScoreRing({ score, center, label }: { score: number; center: React.ReactNode; label?: string }) {
  const scoreColor = score >= 75 ? C.green : score >= 50 ? C.amber : C.red;
  return <div style={{ width: 186, height: 186, borderRadius: "50%", padding: 10, background: `conic-gradient(${scoreColor} ${score * 3.6}deg, rgba(255,255,255,.12) 0)`, boxShadow: `0 0 42px ${scoreColor}35, inset 0 0 0 1px rgba(255,255,255,.15)` }}>
    <div style={{ width: "100%", height: "100%", borderRadius: "50%", display: "grid", placeItems: "center", textAlign: "center", background: "radial-gradient(circle at 50% 35%,#5b1023 0,#210a14 62%,#11090f 100%)", color: "white", border: "1px solid rgba(255,255,255,.2)" }}>
      <div>{center}{label ? <div style={{ fontSize: 10, color: "#f3cbd4", fontWeight: 800, marginTop: 4 }}>{label}</div> : null}</div>
    </div>
  </div>;
}

function NeuralNode({ label, value, tone, detail, selected, onClick, icon }: { label: string; value: string | number; tone: Tone; detail: string; selected?: boolean; onClick?: () => void; icon: React.ReactNode }) {
  const color = toneColor(tone);
  return <button onClick={onClick} style={{ width: 158, minHeight: 78, textAlign: "left", cursor: onClick ? "pointer" : "default", borderRadius: 18, padding: 12, border: `1px solid ${selected ? color : "rgba(255,255,255,.18)"}`, color: "white", background: selected ? `${color}25` : "rgba(255,255,255,.055)", boxShadow: selected ? `0 0 24px ${color}25` : "none", display: "flex", gap: 10, alignItems: "center", transition: ".2s ease" }}>
    <div style={{ width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", background: `${color}20`, border: `1px solid ${color}90`, color, fontSize: 18 }}>{icon}</div>
    <div><div style={{ fontSize: 10, color: "#f1d6dc", fontWeight: 900 }}>{label}</div><div style={{ fontSize: 21, fontWeight: 1000, lineHeight: 1.05 }}>{value}</div><div style={{ color, fontSize: 10, fontWeight: 950 }}>{detail}</div></div>
  </button>;
}

function Donut({ total, items, colors }: { total: number; items: [string, number][]; colors: string[] }) {
  let cursor = 0;
  const parts = items.slice(0, 7).map(([, v], i) => { const start = cursor; const end = cursor + (total ? (v / total) * 360 : 0); cursor = end; return `${colors[i % colors.length]} ${start}deg ${end}deg`; });
  return <div style={{ width: 112, height: 112, borderRadius: "50%", background: `conic-gradient(${parts.join(",") || "#e5e7eb 0deg 360deg"})`, padding: 14, flex: "0 0 auto" }}><div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "white", display: "grid", placeItems: "center", textAlign: "center" }}><div><b style={{ fontSize: 24, color: C.ink }}>{total}</b><div style={{ fontSize: 9, color: C.muted }}>Çalışan</div></div></div></div>;
}

function DonutCard({ title, rows, total, colors }: { title: string; rows: [string, number][]; total: number; colors: string[] }) {
  return <section style={{ ...card, padding: 16, minHeight: 186 }}><div style={{ fontWeight: 950, color: C.ink, fontSize: 14 }}>{title}</div><div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 14 }}><Donut total={total} items={rows} colors={colors} /><div style={{ display: "grid", gap: 7, flex: 1 }}>{rows.slice(0, 6).map(([k, v], i) => <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 10 }}><span style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted }}><i style={{ width: 7, height: 7, borderRadius: "50%", background: colors[i % colors.length] }} />{k}</span><b style={{ color: C.ink }}>{v}</b></div>)}</div></div></section>;
}

function ColumnsCard({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = Math.max(1, ...rows.map(([, v]) => v));
  return <section style={{ ...card, padding: 16, minHeight: 186 }}><div style={{ fontWeight: 950, color: C.ink, fontSize: 14 }}>{title}</div><div style={{ height: 128, display: "flex", alignItems: "flex-end", gap: 12, paddingTop: 20 }}>{rows.slice(0, 6).map(([k, v]) => <div key={k} style={{ minWidth: 42, flex: 1, textAlign: "center" }}><div style={{ fontSize: 10, fontWeight: 900, color: C.ink, marginBottom: 5 }}>{v}</div><div style={{ height: Math.max(10, Math.round((v / max) * 82)), borderRadius: "9px 9px 3px 3px", background: "linear-gradient(180deg,#ed4054,#9d0a20)", boxShadow: "0 7px 16px rgba(163,13,34,.16)" }} /><div title={k} style={{ fontSize: 9, color: C.muted, marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k}</div></div>)}</div></section>;
}

function QualityCard({ score, bloodMissing, birthMissing, startMissing, orgMissing }: { score: number; bloodMissing: number; birthMissing: number; startMissing: number; orgMissing: number }) {
  const good = score >= 85;
  return <section style={{ ...card, padding: 16, minHeight: 186 }}><div style={{ fontWeight: 950, color: C.ink, fontSize: 14 }}>Veri Kalitesi</div><div style={{ display: "flex", gap: 15, alignItems: "center", marginTop: 12 }}><div style={{ width: 105, height: 105, borderRadius: "50%", padding: 10, background: `conic-gradient(${good ? C.green : C.amber} ${score * 3.6}deg,#eef1f5 0)` }}><div style={{ width: "100%", height: "100%", background: "white", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 24, fontWeight: 1000 }}>%{score}</div></div><div style={{ display: "grid", gap: 7, fontSize: 10, color: C.muted }}><span>Kan grubu <b style={{ color: C.ink }}>{bloodMissing} eksik</b></span><span>Doğum tarihi <b style={{ color: C.ink }}>{birthMissing} eksik</b></span><span>İşe giriş <b style={{ color: C.ink }}>{startMissing} eksik</b></span><span>Departman / Ünvan <b style={{ color: C.ink }}>{orgMissing} eksik</b></span></div></div></section>;
}

export default function EmployeeExecutiveDashboard({ employees, selectedCompanyName, onEmployeeClick }: Props) {
  const [activeDimension, setActiveDimension] = useState<DistKey>("department");
  const [actionFilter, setActionFilter] = useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("ALL");
  const [showAllActions, setShowAllActions] = useState(false);

  const active = useMemo(() => employees.filter((e) => e.active !== false), [employees]);
  const a = useMemo(() => {
    const total = active.length;
    const trainingAction = active.filter((e) => ["MISSING", "EXPIRING"].includes(norm(e.training_status))).length;
    const healthAction = active.filter((e) => ["MISSING", "EXPIRING"].includes(norm(e.health_status))).length;
    const ppeAction = active.filter((e) => ["MISSING", "EXPIRING"].includes(norm(e.ppe_status))).length;
    const documentAction = active.filter((e) => ["MISSING", "EXPIRING"].includes(norm(e.document_status))).length;
    const highRisk = active.filter((e) => ["HIGH", "CRITICAL"].includes(norm(e.risk_status))).length;
    const accidentPeople = active.filter((e) => Number(e.accident_count || 0) > 0).length;
    const accidentRecords = active.reduce((s, e) => s + Math.max(0, Number(e.accident_count || 0)), 0);
    const newStarts = active.filter((e) => { const y = years(e.start_date); return y !== null && y <= .25; }).length;
    const bloodMissing = active.filter((e) => missing(e.blood_type)).length;
    const birthMissing = active.filter((e) => missing(e.birth_date)).length;
    const startMissing = active.filter((e) => missing(e.start_date)).length;
    const orgMissing = active.filter((e) => missing(e.department) || missing(e.job_title)).length;
    const dataMissing = active.filter((e) => missing(e.blood_type) || missing(e.birth_date) || missing(e.start_date) || missing(e.department) || missing(e.job_title)).length;
    const completeFields = active.reduce((s, e) => s + [e.blood_type, e.birth_date, e.start_date, e.department, e.job_title].filter((v) => !missing(v)).length, 0);
    const dataQuality = pct(completeFields, total * 5);
    const compliancePenalty = trainingAction * 1.05 + healthAction * 1.15 + ppeAction * .8 + documentAction * .65 + highRisk * 2.1 + accidentPeople * 1.4 + dataMissing * .45;
    const workforceScore = clamp(Math.round(100 - (total ? compliancePenalty / total * 12 : 0)));
    const actions = active.map((e) => ({ employee: e, issues: statusIssues(e), score: actionPriority(e) })).filter((x) => x.issues.length).sort((x, y) => y.score - x.score || y.issues.length - x.issues.length);
    return { total, trainingAction, healthAction, ppeAction, documentAction, highRisk, accidentPeople, accidentRecords, newStarts, bloodMissing, birthMissing, startMissing, orgMissing, dataMissing, dataQuality, workforceScore, actions };
  }, [active]);

  const distributions = useMemo(() => {
    const ageRows = (() => { const b: Record<string, number> = { "18–24": 0, "25–34": 0, "35–44": 0, "45–54": 0, "55+": 0 }; active.forEach((e) => { const x = age(e.birth_date); if (x === null) return; if (x < 25) b["18–24"]++; else if (x < 35) b["25–34"]++; else if (x < 45) b["35–44"]++; else if (x < 55) b["45–54"]++; else b["55+"]++; }); return Object.entries(b).filter(([, v]) => v > 0) as [string, number][]; })();
    const seniorityRows = (() => { const b: Record<string, number> = { "0–1 yıl": 0, "1–3 yıl": 0, "3–5 yıl": 0, "5–10 yıl": 0, "10+ yıl": 0 }; active.forEach((e) => { const x = years(e.start_date); if (x === null) return; if (x < 1) b["0–1 yıl"]++; else if (x < 3) b["1–3 yıl"]++; else if (x < 5) b["3–5 yıl"]++; else if (x < 10) b["5–10 yıl"]++; else b["10+ yıl"]++; }); return Object.entries(b).filter(([, v]) => v > 0) as [string, number][]; })();
    return {
      department: countBy(active, (e) => e.department || ""),
      job: countBy(active, (e) => e.job_title || ""),
      seniority: seniorityRows,
      age: ageRows,
      blood: countBy(active, (e) => e.blood_type || ""),
      education: countBy(active, (e) => e.education_level || ""),
      gender: countBy(active, (e) => e.gender || ""),
    };
  }, [active]);

  const filteredActions = a.actions.filter((x) => {
    if (actionFilter === "ALL") return true;
    const bucket = x.score >= 75 ? "CRITICAL" : x.score >= 55 ? "HIGH" : x.score >= 35 ? "MEDIUM" : "LOW";
    return bucket === actionFilter;
  });

  const counts = {
    critical: a.actions.filter((x) => x.score >= 75).length,
    high: a.actions.filter((x) => x.score >= 55 && x.score < 75).length,
    medium: a.actions.filter((x) => x.score >= 35 && x.score < 55).length,
    low: a.actions.filter((x) => x.score < 35).length,
  };

  const chosenRows = distributions[activeDimension];
  const colors = ["#a30d22", "#d33a50", "#2e7de9", "#19b56b", "#f1a11a", "#8b5cf6", "#64748b"];
  const scoreTone = a.workforceScore >= 75 ? "good" : a.workforceScore >= 55 ? "warn" : "danger";

  return <div style={{ display: "grid", gap: 16 }}>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <TopMetric label="AKTİF ÇALIŞAN" value={a.total} detail={`${a.newStarts} kişi son 3 ayda başladı`} tone="info" icon="👥" />
      <TopMetric label="EĞİTİM AKSİYONU" value={a.trainingAction} detail="Eksik / yaklaşan yasal eğitim" tone={a.trainingAction ? "danger" : "good"} icon="🎓" />
      <TopMetric label="SAĞLIK TAKİBİ" value={a.healthAction} detail="Takip veya yenileme gereken" tone={a.healthAction ? "warn" : "good"} icon="🛡" />
      <TopMetric label="YÜKSEK RİSK" value={a.highRisk} detail="Öncelikli çalışan yoksa normal" tone={a.highRisk ? "danger" : "good"} icon="⚠" />
      <TopMetric label="KAZA / OLAY" value={a.accidentPeople} detail={`${a.accidentRecords} kayıt · ${a.accidentPeople} çalışan`} tone={a.accidentPeople ? "danger" : "good"} icon="🔥" />
      <TopMetric label="VERİ KALİTESİ" value={`%${a.dataQuality}`} detail={`${a.dataMissing} çalışanda temel veri eksiği`} tone={a.dataQuality >= 85 ? "good" : "warn"} icon="◫" />
    </div>

    <section style={{ borderRadius: 26, padding: 18, color: "white", overflow: "hidden", position: "relative", background: "radial-gradient(circle at 50% 50%,rgba(211,58,80,.24),transparent 37%), linear-gradient(120deg,#1c0a12 0%,#500a1a 45%,#801127 70%,#260b14 100%)", boxShadow: "0 22px 56px rgba(70,8,22,.25)" }}>
      <div style={{ position: "absolute", inset: 0, opacity: .28, backgroundImage: "radial-gradient(circle,rgba(255,255,255,.6) 1px,transparent 1px)", backgroundSize: "26px 26px", maskImage: "radial-gradient(circle at 50% 50%,#000,transparent 76%)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div><div style={{ fontSize: 11, letterSpacing: .8, fontWeight: 1000, color: "#ffdce3" }}>D-SEC WORKFORCE INTELLIGENCE</div><div style={{ fontSize: 23, fontWeight: 1000, marginTop: 5 }}>{selectedCompanyName}</div><div style={{ fontSize: 11, color: "#e9b8c2", marginTop: 4 }}>İşgücü sağlığı, güvenliği, uyumu ve veri kalitesi tek canlı görünümde.</div></div>
          <div style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.06)", fontSize: 10, color: "#f6d5dc" }}>Canlı analiz · Web/App ortak veri</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(210px,1fr) minmax(420px,1.8fr) minmax(210px,1fr)", gap: 18, alignItems: "center", marginTop: 20 }}>
          <div style={{ display: "grid", gap: 12, justifyContent: "end" }}>
            <NeuralNode label="Eğitim" value={a.trainingAction} tone={a.trainingAction ? "danger" : "good"} detail={a.trainingAction ? "Kritik" : "Normal"} icon="🎓" selected={activeDimension === "education"} onClick={() => setActiveDimension("education")} />
            <NeuralNode label="KKD" value={a.ppeAction} tone={a.ppeAction ? "warn" : "good"} detail={a.ppeAction ? "Dikkat" : "Normal"} icon="⛑" />
            <NeuralNode label="Belgeler" value={a.documentAction} tone={a.documentAction ? "warn" : "good"} detail={a.documentAction ? "Dikkat" : "Normal"} icon="▤" />
          </div>

          <div style={{ display: "grid", placeItems: "center", position: "relative", minHeight: 262 }}>
            <div style={{ position: "absolute", width: 330, height: 330, borderRadius: "50%", border: "1px dashed rgba(255,255,255,.16)" }} />
            <div style={{ position: "absolute", width: 258, height: 258, borderRadius: "50%", border: "1px solid rgba(255,255,255,.13)", boxShadow: "0 0 50px rgba(255,60,98,.18)" }} />
            <ScoreRing score={a.workforceScore} center={<><div style={{ fontSize: 12, fontWeight: 900, color: "#ffd7df" }}>{a.total}</div><div style={{ fontSize: 29, lineHeight: 1, fontWeight: 1000 }}>AKTİF ÇALIŞAN</div><div style={{ fontSize: 28, lineHeight: 1.1, color: toneColor(scoreTone), fontWeight: 1000 }}>{a.workforceScore}/100</div></>} label="WORKFORCE SCORE" />
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <NeuralNode label="Sağlık" value={a.healthAction} tone={a.healthAction ? "warn" : "good"} detail={a.healthAction ? "Dikkat" : "Normal"} icon="✚" />
            <NeuralNode label="Risk" value={a.highRisk} tone={a.highRisk ? "danger" : "good"} detail={a.highRisk ? "Kritik" : "Normal"} icon="△" />
            <NeuralNode label="Kaza / Olay" value={a.accidentPeople} tone={a.accidentPeople ? "danger" : "good"} detail={a.accidentPeople ? "Dikkat" : "Normal"} icon="🔥" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
          <NeuralNode label="Veri Kalitesi" value={`%${a.dataQuality}`} tone={a.dataQuality >= 85 ? "good" : "warn"} detail={a.dataQuality >= 85 ? "İyi" : "Dikkat"} icon="◉" />
          <div style={{ borderRadius: 18, padding: "12px 16px", background: "rgba(255,255,255,.065)", border: "1px solid rgba(255,255,255,.14)", maxWidth: 360 }}><div style={{ fontSize: 10, fontWeight: 950, color: "#ffd7df" }}>GENEL DEĞERLENDİRME</div><div style={{ fontSize: 17, fontWeight: 1000, marginTop: 4, color: toneColor(scoreTone) }}>{a.workforceScore >= 75 ? "İyi" : a.workforceScore >= 55 ? "Dikkat" : "Kritik"} · {a.workforceScore}/100</div><div style={{ fontSize: 10, lineHeight: 1.45, color: "#ecc6ce", marginTop: 5 }}>{a.trainingAction > 0 ? "Eğitim aksiyonları öncelikli." : a.accidentPeople > 0 ? "Kaza/olay trendi takip edilmeli." : "Kritik uyum açığı görünmüyor."}</div></div>
        </div>
      </div>
    </section>

    <div style={{ ...card, padding: 10, display: "flex", gap: 7, overflowX: "auto" }}>
      {([
        ["department", "Departman"], ["job", "Ünvan"], ["seniority", "Kıdem"], ["age", "Yaş"], ["blood", "Kan Grubu"], ["education", "Eğitim"], ["gender", "Cinsiyet"],
      ] as [DistKey, string][]).map(([key, label]) => <button key={key} onClick={() => setActiveDimension(key)} style={{ border: 0, borderRadius: 12, padding: "9px 13px", cursor: "pointer", fontWeight: 900, whiteSpace: "nowrap", background: activeDimension === key ? C.brand : "transparent", color: activeDimension === key ? "white" : C.muted }}>{label}</button>)}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14 }}>
      <DonutCard title={activeDimension === "department" ? "Departman Dağılımı" : activeDimension === "job" ? "Ünvan Dağılımı" : activeDimension === "blood" ? "Kan Grubu Dağılımı" : activeDimension === "education" ? "Eğitim Düzeyi" : activeDimension === "gender" ? "Cinsiyet Dağılımı" : activeDimension === "seniority" ? "Kıdem Dağılımı" : "Yaş Dağılımı"} rows={chosenRows} total={a.total} colors={colors} />
      <ColumnsCard title="Kıdem Dağılımı" rows={distributions.seniority} />
      <ColumnsCard title="Yaş Dağılımı" rows={distributions.age} />
      <QualityCard score={a.dataQuality} bloodMissing={a.bloodMissing} birthMissing={a.birthMissing} startMissing={a.startMissing} orgMissing={a.orgMissing} />
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14 }}>
      <DonutCard title="Cinsiyet Dağılımı" rows={distributions.gender} total={a.total} colors={["#2e7de9", "#e94d9b", "#9ca3af"]} />
      <DonutCard title="Kan Grubu Dağılımı" rows={distributions.blood} total={a.total} colors={["#a30d22", "#d33a50", "#ef8354", "#f1a11a", "#2e7de9", "#8b5cf6"]} />
      <DonutCard title="Eğitim Düzeyi" rows={distributions.education} total={a.total} colors={["#19b56b", "#2e7de9", "#f1a11a", "#ef6f3c", "#a30d22", "#8b5cf6"]} />
    </div>

    <section style={{ ...card, overflow: "hidden" }}>
      <div style={{ padding: 18, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}><div><div style={{ fontSize: 18, fontWeight: 1000, color: C.ink }}>Aksiyon Gerektiren Çalışanlar</div><div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Eğitim, sağlık, KKD, belge, risk ve kaza/olay sinyallerine göre önceliklendirilir.</div></div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{[
        ["ALL", "Tümü", a.actions.length], ["CRITICAL", "Kritik", counts.critical], ["HIGH", "Yüksek", counts.high], ["MEDIUM", "Orta", counts.medium], ["LOW", "Düşük", counts.low],
      ].map(([key, label, n]) => <button key={String(key)} onClick={() => setActionFilter(key as typeof actionFilter)} style={{ border: `1px solid ${actionFilter === key ? C.brand : C.border}`, background: actionFilter === key ? C.brand : "white", color: actionFilter === key ? "white" : C.muted, borderRadius: 999, padding: "7px 10px", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>{label} <b>{n}</b></button>)}</div></div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 970, fontSize: 11 }}><thead><tr style={{ background: "#f7f8fb", color: C.muted, textAlign: "left" }}>{["Çalışan", "Departman", "Ünvan", "Risk Skoru", "Eğitim", "Sağlık", "KKD", "Kaza/Olay", "Durum", "Aksiyon"].map((h) => <th key={h} style={{ padding: "11px 12px", fontWeight: 950 }}>{h}</th>)}</tr></thead><tbody>{(showAllActions ? filteredActions : filteredActions.slice(0, 12)).map(({ employee: e, score }) => { const r = riskText(score); return <tr key={e.id} style={{ borderTop: "1px solid #eef0f4" }}><td style={{ padding: 12, fontWeight: 950, color: C.ink }}>{e.full_name}</td><td style={{ padding: 12, color: C.muted }}>{e.department || "—"}</td><td style={{ padding: 12, color: C.muted }}>{e.job_title || "—"}</td><td style={{ padding: 12 }}><span style={{ width: 34, height: 34, display: "inline-grid", placeItems: "center", borderRadius: "50%", border: `2px solid ${toneColor(r.tone)}`, fontWeight: 1000 }}>{score}</span></td><td style={{ padding: 12, color: ["MISSING", "EXPIRING"].includes(norm(e.training_status)) ? C.red : C.green, fontWeight: 900 }}>{norm(e.training_status) === "COMPLETE" ? "✓ Tam" : "⚠ Aksiyon"}</td><td style={{ padding: 12, color: ["MISSING", "EXPIRING"].includes(norm(e.health_status)) ? C.amber : C.green, fontWeight: 900 }}>{norm(e.health_status) === "COMPLETE" ? "✓" : "!"}</td><td style={{ padding: 12, color: ["MISSING", "EXPIRING"].includes(norm(e.ppe_status)) ? C.amber : C.green, fontWeight: 900 }}>{norm(e.ppe_status) === "COMPLETE" ? "✓" : "!"}</td><td style={{ padding: 12, fontWeight: 900 }}>{Number(e.accident_count || 0)}</td><td style={{ padding: 12 }}><span style={{ borderRadius: 999, padding: "6px 9px", background: `${toneColor(r.tone)}14`, color: toneColor(r.tone), fontWeight: 900 }}>{r.label}</span></td><td style={{ padding: 12 }}><button onClick={() => onEmployeeClick?.(e.id)} style={{ border: `1px solid ${C.border}`, background: "white", color: C.ink, borderRadius: 10, padding: "7px 11px", fontWeight: 900, cursor: "pointer" }}>Profili Aç</button></td></tr>; })}</tbody></table></div>
      {filteredActions.length > 12 ? <div style={{ padding: 12, textAlign: "center" }}><button onClick={() => setShowAllActions((v) => !v)} style={{ border: 0, background: "transparent", color: C.brand, fontWeight: 950, cursor: "pointer" }}>{showAllActions ? "İlk 12'yi göster" : `Tümünü göster (${filteredActions.length})`}</button></div> : null}
      {!filteredActions.length ? <div style={{ padding: 26, textAlign: "center", color: C.muted }}>Bu filtrede aksiyon gerektiren çalışan bulunmuyor.</div> : null}
    </section>
  </div>;
}
