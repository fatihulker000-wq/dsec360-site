"use client";

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileDown,
  LayoutDashboard,
  ListChecks,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

type Tab = "OVERVIEW" | "SURVEYS" | "CREATE" | "RESPONSES" | "ANALYSIS" | "FINDINGS" | "ACTIONS" | "REPORTS";
type SurveyStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED";

type Company = { id: string; name: string };
type Survey = {
  id: string;
  title: string;
  category: string;
  status: SurveyStatus;
  anonymous: boolean;
  questionCount: number;
  targetCount: number;
  responseCount: number;
  negativeRate: number;
  riskScore: number;
  endsAt?: string | null;
};
type Finding = { id: string; surveyTitle: string; question: string; negativeRate: number; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; segment?: string };
type Action = { id: string; title: string; owner: string; dueDate: string; priority: string; status: string };

const tabs: Array<{ value: Tab; label: string; icon: ReactNode }> = [
  { value: "OVERVIEW", label: "Genel Bakış", icon: <LayoutDashboard size={17} /> },
  { value: "SURVEYS", label: "Anketler", icon: <ClipboardList size={17} /> },
  { value: "CREATE", label: "Yeni Anket", icon: <Plus size={17} /> },
  { value: "RESPONSES", label: "Yanıtlar", icon: <MessageSquareText size={17} /> },
  { value: "ANALYSIS", label: "Analiz", icon: <BarChart3 size={17} /> },
  { value: "FINDINGS", label: "Kritik Bulgular", icon: <ShieldAlert size={17} /> },
  { value: "ACTIONS", label: "Aksiyonlar", icon: <Target size={17} /> },
  { value: "REPORTS", label: "Raporlar", icon: <FileDown size={17} /> },
];

const templates = [
  ["İSG Güvenlik Kültürü", 20], ["Psikososyal Risk", 25], ["Ergonomi", 15],
  ["KKD Kullanımı", 10], ["Acil Durum Farkındalığı", 15], ["İSG Eğitim Etkinliği", 10],
] as const;

const emptyDraft = { title: "", category: "İSG Algı Anketi", anonymous: true, description: "", endDate: "" };

function percent(value: number) { return `%${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(value)}`; }
function riskColor(score: number) { return score >= 81 ? "#991b1b" : score >= 61 ? "#dc2626" : score >= 41 ? "#ea580c" : score >= 21 ? "#ca8a04" : "#059669"; }
function statusLabel(status: SurveyStatus) { return ({ DRAFT: "Taslak", ACTIVE: "Aktif", CLOSED: "Kapandı", ARCHIVED: "Arşiv" } as const)[status]; }

export default function EmployeeSurveysPage() {
  const [tab, setTab] = useState<Tab>("OVERVIEW");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, { cache: "no-store", credentials: "include", ...init });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success === false) throw new Error(body.error || body.message || "İşlem tamamlanamadı.");
    return body;
  }, []);

  const loadCompanies = useCallback(async () => {
    const body = await request("/api/admin/companies");
    const rows = (Array.isArray(body.data) ? body.data : []).map((x: Record<string, unknown>) => ({
      id: String(x.id || ""), name: String(x.name || x.title || x.company_name || ""),
    })).filter((x: Company) => x.id && x.name);
    setCompanies(rows);
    setCompanyId((current) => current || rows[0]?.id || "");
  }, [request]);

  const loadCenter = useCallback(async () => {
    if (!companyId) return;
    const body = await request(`/api/admin/documentation/employee-surveys/dashboard?firmId=${encodeURIComponent(companyId)}`);
    setSurveys(Array.isArray(body.surveys) ? body.surveys : []);
    setFindings(Array.isArray(body.findings) ? body.findings : []);
    setActions(Array.isArray(body.actions) ? body.actions : []);
  }, [companyId, request]);

  useEffect(() => { void loadCompanies().catch((e: Error) => setError(e.message)).finally(() => setLoading(false)); }, [loadCompanies]);
  useEffect(() => { if (companyId) void loadCenter().catch((e: Error) => setError(e.message)); }, [companyId, loadCenter]);

  const kpi = useMemo(() => {
    const active = surveys.filter((x) => x.status === "ACTIVE").length;
    const sent = surveys.reduce((n, x) => n + x.targetCount, 0);
    const responses = surveys.reduce((n, x) => n + x.responseCount, 0);
    return { active, sent, responses, participation: sent ? responses * 100 / sent : 0, critical: findings.filter((x) => x.severity === "CRITICAL" || x.severity === "HIGH").length, openActions: actions.filter((x) => x.status !== "VERIFIED" && x.status !== "COMPLETED").length };
  }, [actions, findings, surveys]);

  const filtered = surveys.filter((x) => `${x.title} ${x.category}`.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")));

  async function createSurvey(event: FormEvent) {
    event.preventDefault();
    if (!companyId || !draft.title.trim()) return;
    try {
      setSaving(true); setError("");
      const body = await request("/api/admin/documentation/employee-surveys", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmId: companyId, ...draft, title: draft.title.trim() }),
      });
      if (body.survey) {
        setSurveys((current) => [body.survey, ...current]);
        window.location.href = `/admin/documentation/employee-surveys/${body.survey.id}`;
        return;
      }
      setDraft(emptyDraft); setTab("SURVEYS");
    } catch (e) { setError(e instanceof Error ? e.message : "Anket kaydedilemedi."); }
    finally { setSaving(false); }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", color: "#172033", padding: "24px" }}>
      <div style={{ maxWidth: 1500, margin: "0 auto", display: "grid", gap: 18 }}>
        <header style={{ borderRadius: 24, padding: 24, color: "white", background: "linear-gradient(135deg,#064e3b 0%,#0f766e 55%,#0e7490 100%)", boxShadow: "0 18px 45px rgba(15,118,110,.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <button onClick={() => { window.location.href = "/admin/documentation"; }} style={ghostButton}><ArrowLeft size={16}/> Dokümantasyona Dön</button>
              <h1 style={{ margin: "16px 0 6px", fontSize: 29 }}>Çalışan Anket & Geri Bildirim Merkezi</h1>
              <p style={{ margin: 0, opacity: .84, maxWidth: 760 }}>Çalışan görüşlerini ölçün, riskli yanıtları erken tespit edin ve sonuçları izlenebilir aksiyonlara dönüştürün.</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={selectStyle} aria-label="Firma seçin">
                <option value="">Firma seçin</option>{companies.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <button onClick={() => void loadCenter()} style={ghostButton}><RefreshCw size={16}/> Yenile</button>
              <button onClick={() => setTab("CREATE")} style={{ ...buttonStyle, background: "white", color: "#0f766e" }}><Plus size={17}/> Yeni Anket</button>
            </div>
          </div>
        </header>

        {error && <div style={{ ...panelStyle, borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c", display: "flex", gap: 9 }}><AlertTriangle size={19}/>{error}</div>}

        <nav style={{ ...panelStyle, padding: 9, display: "flex", gap: 7, overflowX: "auto" }}>
          {tabs.map((x) => <button key={x.value} onClick={() => setTab(x.value)} style={{ ...tabButton, ...(tab === x.value ? activeTab : {}) }}>{x.icon}{x.label}{x.value === "FINDINGS" && kpi.critical > 0 ? <b style={badge}>{kpi.critical}</b> : null}</button>)}
        </nav>

        {loading ? <div style={{ ...panelStyle, display: "flex", justifyContent: "center", padding: 70 }}><Loader2 className="animate-spin"/></div> : null}

        {!loading && tab === "OVERVIEW" && <>
          <section style={kpiGrid}>{[
            ["Aktif Anket", kpi.active, <Activity size={20}/>], ["Gönderilen", kpi.sent, <Send size={20}/>], ["Yanıtlanan", kpi.responses, <MessageSquareText size={20}/>],
            ["Katılım", percent(kpi.participation), <Users size={20}/>], ["Kritik Bulgu", kpi.critical, <ShieldAlert size={20}/>], ["Açık Aksiyon", kpi.openActions, <Target size={20}/>],
          ].map(([label, value, icon]) => <div key={String(label)} style={kpiCard}><div style={{ color: "#0f766e" }}>{icon}</div><span style={muted}>{label}</span><strong style={{ fontSize: 27 }}>{value}</strong></div>)}</section>
          <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(300px,.6fr)", gap: 18 }}>
            <div style={panelStyle}><SectionTitle icon={<ShieldAlert/>} title="Öncelikli Bulgular" action={() => setTab("FINDINGS")}/>{findings.length ? findings.slice(0,5).map((x) => <FindingRow key={x.id} item={x}/>) : <Empty text="Henüz kritik bulgu bulunmuyor."/>}</div>
            <div style={panelStyle}><SectionTitle icon={<Sparkles/>} title="DORA Yönetici Özeti"/><p style={{ lineHeight: 1.65, color: "#475569" }}>Analiz, yalnızca toplulaştırılmış anket sonuçları üzerinden çalışır. Kimlikli yanıtlar yetki dışında gösterilmez; anonim yanıtlar çalışanla eşleştirilemez.</p><button style={{ ...buttonStyle, width: "100%" }} onClick={() => setTab("ANALYSIS")}><Sparkles size={17}/> Sonuçları Analiz Et</button></div>
          </section>
        </>}

        {!loading && tab === "SURVEYS" && <section style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><SectionTitle icon={<ClipboardList/>} title="Anketler"/><label style={searchBox}><Search size={17}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Anket ara" style={plainInput}/></label></div>
          <div style={{ overflowX: "auto" }}><table style={tableStyle}><thead><tr><th>Anket</th><th>Durum</th><th>Gizlilik</th><th>Katılım</th><th>Olumsuz</th><th>Risk</th><th>Bitiş</th></tr></thead><tbody>{filtered.map((x) => <tr key={x.id}><td><button type="button" onClick={() => { window.location.href = `/admin/documentation/employee-surveys/${x.id}`; }} style={{ ...linkButton, padding: 0, textAlign: "left", fontSize: 14 }}>{x.title}</button><small style={smallBlock}>{x.category} · {x.questionCount} soru</small></td><td><span style={pill}>{statusLabel(x.status)}</span></td><td>{x.anonymous ? "Anonim" : "Kimlikli"}</td><td>{x.responseCount}/{x.targetCount} ({percent(x.targetCount ? x.responseCount * 100 / x.targetCount : 0)})</td><td>{percent(x.negativeRate)}</td><td><b style={{ color: riskColor(x.riskScore) }}>{x.riskScore}/100</b></td><td>{x.endsAt ? new Date(x.endsAt).toLocaleDateString("tr-TR") : "—"}</td></tr>)}</tbody></table></div>
          {!filtered.length && <Empty text="Bu firmaya ait anket bulunmuyor."/>}
        </section>}

        {!loading && tab === "CREATE" && <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 18 }}>
          <form onSubmit={createSurvey} style={panelStyle}><SectionTitle icon={<Plus/>} title="Yeni Anket Oluştur"/>
            <div style={formGrid}><Field label="Anket adı *"><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} style={inputStyle} required placeholder="Örn. 2026 İSG Güvenlik Kültürü Anketi"/></Field><Field label="Anket türü"><select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} style={inputStyle}>{["İSG Algı Anketi","Güvenlik Kültürü","Psikososyal Risk","Ergonomi","KKD Kullanımı","Acil Durum Farkındalığı","Eğitim Değerlendirme","Ramak Kala / Tehlike Algısı","Özel / Serbest Anket"].map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Bitiş tarihi"><input type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} style={inputStyle}/></Field><Field label="Yanıt gizliliği"><select value={draft.anonymous ? "anonymous" : "identified"} onChange={(e) => setDraft({ ...draft, anonymous: e.target.value === "anonymous" })} style={inputStyle}><option value="anonymous">Anonim</option><option value="identified">Kimlikli</option></select></Field></div>
            <Field label="Açıklama"><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} style={{ ...inputStyle, minHeight: 110, resize: "vertical" }} placeholder="Çalışanlara gösterilecek açıklama"/></Field>
            <div style={{ padding: 15, borderRadius: 14, background: "#f0fdfa", color: "#115e59", margin: "15px 0" }}><b>Sonraki adım:</b> Taslak kaydedildiğinde soru oluşturucu açılır. Her soru için cevap tipi, önem ağırlığı (1–5), negatif cevaplar, zorunluluk ve koşullu soru ayarlanır.</div>
            <button disabled={saving} style={buttonStyle}>{saving ? <Loader2 size={17}/> : <CheckCircle2 size={17}/>} Taslağı Kaydet ve Sorulara Geç</button>
          </form>
          <aside style={panelStyle}><SectionTitle icon={<ListChecks/>} title="Hazır Şablonlar"/>{templates.map(([name,count]) => <button key={name} type="button" style={templateButton} onClick={() => setDraft({ ...draft, title: name, category: name })}><b>{name}</b><span style={muted}>{count} hazır soru</span></button>)}</aside>
        </section>}

        {!loading && tab === "FINDINGS" && <section style={panelStyle}><SectionTitle icon={<ShieldAlert/>} title="Kritik ve Negatif Bulgular"/>{findings.length ? [...findings].sort((a,b) => b.negativeRate-a.negativeRate).map((x) => <FindingRow key={x.id} item={x} actions/>) : <Empty text="Risk eşiğini aşan yanıt bulunmuyor."/>}</section>}

        {!loading && tab === "ACTIONS" && <section style={panelStyle}><SectionTitle icon={<Target/>} title="Anket Aksiyonları"/><div style={{ overflowX: "auto" }}><table style={tableStyle}><thead><tr><th>Aksiyon</th><th>Sorumlu</th><th>Termin</th><th>Öncelik</th><th>Durum</th></tr></thead><tbody>{actions.map((x) => <tr key={x.id}><td><b>{x.title}</b></td><td>{x.owner || "Atanmadı"}</td><td>{x.dueDate ? new Date(x.dueDate).toLocaleDateString("tr-TR") : "—"}</td><td>{x.priority}</td><td><span style={pill}>{x.status}</span></td></tr>)}</tbody></table></div>{!actions.length && <Empty text="Henüz anket bulgusundan oluşturulmuş aksiyon yok."/>}</section>}

        {!loading && (tab === "RESPONSES" || tab === "ANALYSIS" || tab === "REPORTS") && <section style={panelStyle}><SectionTitle icon={tab === "RESPONSES" ? <MessageSquareText/> : tab === "ANALYSIS" ? <BarChart3/> : <FileDown/>} title={tab === "RESPONSES" ? "Yanıt Havuzu" : tab === "ANALYSIS" ? "Analiz Merkezi" : "Rapor Merkezi"}/><Empty text={tab === "RESPONSES" ? "Bir anket seçildiğinde soru ve çalışan grubu bazlı yanıtlar burada görüntülenecek." : tab === "ANALYSIS" ? "Katılım, olumlu/olumsuz dağılım, bölüm-lokasyon karşılaştırması, trend ve açık uçlu konu kümeleri burada gösterilecek." : "Yönetici özeti, detaylı sonuç, kritik bulgu, katılım, karşılaştırma ve aksiyon raporları PDF/Excel olarak üretilecek."}/></section>}
      </div>
    </main>
  );
}

function SectionTitle({ icon, title, action }: { icon: ReactNode; title: string; action?: () => void }) { return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 15 }}><div style={{ display: "flex", alignItems: "center", gap: 9, color: "#0f766e" }}>{icon}<h2 style={{ margin: 0, fontSize: 18, color: "#172033" }}>{title}</h2></div>{action ? <button onClick={action} style={linkButton}>Tümünü gör</button> : null}</div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label style={{ display: "grid", gap: 7, fontSize: 13, fontWeight: 800, color: "#475569" }}>{label}{children}</label>; }
function Empty({ text }: { text: string }) { return <div style={{ padding: "36px 18px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: 14, border: "1px dashed #cbd5e1" }}>{text}</div>; }
function FindingRow({ item, actions: showAction }: { item: Finding; actions?: boolean }) { return <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 15, padding: "14px 0", borderBottom: "1px solid #edf1f5" }}><div><b>{item.question}</b><small style={smallBlock}>{item.surveyTitle}{item.segment ? ` · ${item.segment}` : ""}</small></div><div style={{ textAlign: "right" }}><b style={{ color: item.severity === "CRITICAL" ? "#b91c1c" : "#ea580c", fontSize: 18 }}>{percent(item.negativeRate)} olumsuz</b>{showAction ? <button style={{ ...linkButton, display: "block", marginLeft: "auto" }}>+ Aksiyon oluştur</button> : null}</div></div>; }

const panelStyle = { background: "white", border: "1px solid #e2e8f0", borderRadius: 18, padding: 18, boxShadow: "0 8px 25px rgba(15,23,42,.04)" } as const;
const buttonStyle = { border: 0, borderRadius: 11, padding: "11px 15px", background: "#0f766e", color: "white", fontWeight: 850, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 } as const;
const ghostButton = { ...buttonStyle, background: "rgba(255,255,255,.13)", border: "1px solid rgba(255,255,255,.22)" } as const;
const tabButton = { border: 0, borderRadius: 11, padding: "10px 13px", background: "#f8fafc", color: "#475569", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" } as const;
const activeTab = { background: "#0f766e", color: "white" } as const;
const badge = { minWidth: 20, height: 20, padding: "0 5px", borderRadius: 10, display: "inline-grid", placeItems: "center", background: "#fee2e2", color: "#b91c1c", fontSize: 11 } as const;
const selectStyle = { minWidth: 245, border: "1px solid rgba(255,255,255,.3)", borderRadius: 11, padding: "11px 12px", background: "white", color: "#172033", fontWeight: 750 } as const;
const kpiGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 12 } as const;
const kpiCard = { ...panelStyle, display: "grid", gap: 5 } as const;
const muted = { color: "#64748b", fontSize: 13 } as const;
const searchBox = { display: "flex", alignItems: "center", gap: 8, border: "1px solid #dbe3ec", borderRadius: 11, padding: "0 10px", minWidth: 260 } as const;
const plainInput = { border: 0, outline: 0, minHeight: 40, width: "100%" } as const;
const inputStyle = { minHeight: 43, border: "1px solid #cbd5e1", borderRadius: 10, padding: "9px 11px", background: "white", color: "#172033", font: "inherit" } as const;
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14, marginBottom: 14 } as const;
const templateButton = { width: "100%", display: "grid", gap: 4, textAlign: "left", border: "1px solid #dbe6e3", borderRadius: 12, background: "#f8fffd", padding: 13, marginBottom: 9, cursor: "pointer", color: "#172033" } as const;
const tableStyle = { width: "100%", borderCollapse: "collapse", minWidth: 820, fontSize: 14 } as const;
const pill = { display: "inline-block", borderRadius: 999, padding: "5px 9px", background: "#ecfdf5", color: "#047857", fontSize: 12, fontWeight: 800 } as const;
const smallBlock = { display: "block", marginTop: 5, color: "#64748b", fontSize: 12 } as const;
const linkButton = { border: 0, background: "transparent", color: "#0f766e", fontWeight: 850, cursor: "pointer", padding: 5 } as const;
