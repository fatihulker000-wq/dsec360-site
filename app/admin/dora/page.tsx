"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CompanyRow = { id: string; name: string };
type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
type ModuleStatus = "CRITICAL" | "WARNING" | "GOOD" | "UNAVAILABLE";

type Finding = {
  id: string;
  module: string;
  moduleLabel: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  sourceUrl: string;
  evidence: string[];
  count?: number;
};

type ModuleRow = {
  key: string;
  label: string;
  available: boolean;
  status: ModuleStatus;
  summary: string;
  total: number;
  findings: number;
  warning?: string;
};

type AnalysisResponse = {
  success?: boolean;
  error?: string;
  mode?: string;
  generatedAt?: string;
  company?: {
    id: string;
    name: string;
    employeeCount: number;
    dangerClass?: string | null;
    naceCode?: string | null;
    sector?: string | null;
  };
  summary?: {
    scannedModules: number;
    unavailableModules: number;
    totalFindings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  modules?: ModuleRow[];
  findings?: Finding[];
  executiveCommentary?: string[];
  managementTopics?: Array<{ id:string; score:number; severity:Severity; title:string; interpretation:string; recommendation:string; evidence:string[]; modules:string[] }>;
  crossAnalyses?: Array<{ id:string; title:string; status:"SIGNAL"|"LIMITED"|"POSITIVE"; confidence:"HIGH"|"MEDIUM"|"LOW"; interpretation:string; evidence:string[]; recommendation:string; modules:string[] }>;
  dataQuality?: { overallScore:number; items:Array<{ key:string; label:string; score:number; status:"GOOD"|"WARNING"|"POOR"; interpretation:string; evidence:string[] }> };
  guardrails?: {
    readOnly: boolean;
    writesToModules: boolean;
    createsActions: boolean;
    closesRecords: boolean;
    assignsTasks: boolean;
  };
};

type ScopeResponse = {
  success?: boolean;
  can_view_all_companies?: boolean;
  allowed_company_id?: string | null;
  allowed_companies?: CompanyRow[];
  error?: string;
};

const C = {
  bg: "#f6f7f9",
  ink: "#182230",
  muted: "#667085",
  line: "#e4e7ec",
  burgundy: "#7f1d2d",
  burgundyDark: "#54101f",
  red: "#b42318",
  orange: "#b54708",
  green: "#067647",
  blue: "#175cd3",
  white: "#fff",
};

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Sunucudan geçersiz yanıt geldi (${res.status}).`);
  }
  if (!res.ok) throw new Error(json?.error || `Sunucu hatası (${res.status}).`);
  return json as T;
}

function severityLabel(v: Severity) {
  if (v === "CRITICAL") return "Kritik";
  if (v === "HIGH") return "Yüksek";
  if (v === "MEDIUM") return "Orta";
  if (v === "LOW") return "Düşük";
  return "Bilgi";
}

function severityStyle(v: Severity): React.CSSProperties {
  if (v === "CRITICAL") return { background: "#fef3f2", color: "#b42318", borderColor: "#fecdca" };
  if (v === "HIGH") return { background: "#fff6ed", color: "#b54708", borderColor: "#fedf89" };
  if (v === "MEDIUM") return { background: "#fffaeb", color: "#b54708", borderColor: "#fedf89" };
  if (v === "LOW") return { background: "#eff8ff", color: "#175cd3", borderColor: "#b2ddff" };
  return { background: "#f2f4f7", color: "#475467", borderColor: "#e4e7ec" };
}

function moduleTone(status: ModuleStatus) {
  if (status === "CRITICAL") return { label: "Kritik", color: C.red, bg: "#fef3f2" };
  if (status === "WARNING") return { label: "Uyarı", color: C.orange, bg: "#fffaeb" };
  if (status === "GOOD") return { label: "Uygun", color: C.green, bg: "#ecfdf3" };
  return { label: "Veri Yok", color: C.muted, bg: "#f2f4f7" };
}

export default function DoraPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | Severity>("ALL");
  const [moduleFilter, setModuleFilter] = useState("ALL");

  const loadScope = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const scope = await readJson<ScopeResponse>(
        await fetch("/api/admin/reports/scope", { cache: "no-store", credentials: "include" })
      );

      let rows = Array.isArray(scope.allowed_companies) ? scope.allowed_companies : [];

      if (scope.can_view_all_companies) {
        const companyJson: any = await readJson(
          await fetch("/api/admin/companies", { cache: "no-store", credentials: "include" })
        );
        rows = (companyJson?.data ?? companyJson ?? [])
          .filter((x: any) => x?.id && x?.name)
          .map((x: any) => ({ id: String(x.id), name: String(x.name) }));
      }

      setCompanies(rows);
      const first = scope.allowed_company_id || rows[0]?.id || "";
      setCompanyId(first);
    } catch (e) {
      setError(e instanceof Error ? e.message : "DORA firma kapsamı alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  const runAnalysis = useCallback(async (selectedCompanyId: string) => {
    if (!selectedCompanyId) return;
    try {
      setScanning(true);
      setError("");
      const data = await readJson<AnalysisResponse>(
        await fetch(`/api/admin/dora-v2/analysis?companyId=${encodeURIComponent(selectedCompanyId)}`, {
          cache: "no-store",
          credentials: "include",
        })
      );
      setAnalysis(data);
    } catch (e) {
      setAnalysis(null);
      setError(e instanceof Error ? e.message : "DORA analizi oluşturulamadı.");
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    void loadScope();
  }, [loadScope]);

  useEffect(() => {
    if (companyId) void runAnalysis(companyId);
  }, [companyId, runAnalysis]);

  const findings = analysis?.findings ?? [];
  const modules = analysis?.modules ?? [];
  const summary = analysis?.summary;

  const visibleFindings = useMemo(() => {
    return findings.filter((x) => {
      if (filter !== "ALL" && x.severity !== filter) return false;
      if (moduleFilter !== "ALL" && x.module !== moduleFilter) return false;
      return true;
    });
  }, [findings, filter, moduleFilter]);

  const generatedAt = analysis?.generatedAt
    ? new Date(analysis.generatedAt).toLocaleString("tr-TR")
    : "-";

  return (
    <main style={{ minHeight: "100vh", background: C.bg, padding: "18px 16px 60px", color: C.ink, fontFamily: "Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 1540, margin: "0 auto" }}>
        <section style={{ borderRadius: 24, padding: "28px 30px", background: `linear-gradient(120deg,${C.burgundyDark},${C.burgundy} 55%,#a61f32)`, color: C.white, boxShadow: "0 18px 45px rgba(83,16,31,.17)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 22, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 950, letterSpacing: 1.2, opacity: .82 }}>D-SEC • DORA AI</div>
              <h1 style={{ margin: "8px 0 7px", fontSize: "clamp(28px,4vw,42px)", lineHeight: 1.08 }}>DORA Derin Analiz Merkezi</h1>
              <p style={{ margin: 0, maxWidth: 900, lineHeight: 1.65, opacity: .9 }}>
                Raporlardaki sayıları tekrar etmek yerine modüller arasındaki ilişkileri, veri boşluklarını ve yönetim önceliklerini yorumlar. Faz 1 tamamen salt okunurdur.
              </p>
            </div>
            <button
              onClick={() => void runAnalysis(companyId)}
              disabled={!companyId || scanning}
              style={{ ...primaryButton, opacity: scanning ? .7 : 1 }}
            >
              {scanning ? "Analiz yapılıyor..." : "↻ Sistemi Yeniden Analiz Et"}
            </button>
          </div>
        </section>

        <section style={{ ...card, marginTop: 14, display: "grid", gridTemplateColumns: "minmax(220px,420px) minmax(0,1fr)", gap: 16, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 7, fontSize: 12, fontWeight: 850 }}>
            Firma
            <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} style={input} disabled={loading || scanning}>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.65 }}>
            <b style={{ color: C.ink }}>Salt okunur mod:</b> DORA yalnızca analiz üretir. Son analiz: {generatedAt}
          </div>
        </section>

        {error ? <div style={{ ...card, marginTop: 14, borderColor: "#fecdca", background: "#fef3f2", color: C.red, fontWeight: 750 }}>{error}</div> : null}
        {loading ? <div style={{ ...card, marginTop: 14, color: C.muted }}>DORA hazırlanıyor...</div> : null}

        {!loading && analysis ? (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginTop: 14 }}>
              <Metric title="Yönetim Önceliği" value={analysis.managementTopics?.length ?? 0} sub="En kritik konular" />
              <Metric title="Çapraz Analiz" value={analysis.crossAnalyses?.length ?? 0} sub={`${(analysis.crossAnalyses ?? []).filter(x=>x.status==="SIGNAL").length} inceleme sinyali`} />
              <Metric title="Veri Güvenilirliği" value={`${analysis.dataQuality?.overallScore ?? 0}/100`} sub="Analiz kapsama puanı" />
              <Metric title="Okunan Modül" value={summary?.scannedModules ?? 0} sub={`${summary?.unavailableModules ?? 0} erişilemeyen`} />
            </section>

            <section style={{ ...card, marginTop: 14, borderLeft: `5px solid ${C.burgundy}` }}>
              <Header title="DORA Yönetici Değerlendirmesi" sub="Ham KPI tekrarı değil; birlikte okunan verilerden çıkan yönetim yorumu." />
              <div style={{ display:"grid", gap:10, marginTop:14 }}>
                {(analysis.executiveCommentary ?? []).map((x,i)=><div key={i} style={{padding:"12px 14px",borderRadius:12,background:"#faf7f8",lineHeight:1.65,fontSize:13}}><b style={{color:C.burgundy}}>{i+1}.</b> {x}</div>)}
              </div>
            </section>

            <section style={{ marginTop: 14 }}>
              <Header title="Yönetimin Dikkat Etmesi Gereken 5 Konu" sub="DORA etki büyüklüğü, kritik seviye ve modüller arası bağlamla inceleme sırası oluşturur." />
              <div style={{display:"grid",gap:10,marginTop:12}}>
                {(analysis.managementTopics ?? []).map((t,i)=><article key={t.id} style={card}>
                  <div style={{display:"grid",gridTemplateColumns:"56px minmax(0,1fr) auto",gap:14,alignItems:"start"}}>
                    <div style={{width:48,height:48,borderRadius:14,display:"grid",placeItems:"center",background:"#fff4f5",color:C.burgundy,fontWeight:950,fontSize:20}}>{i+1}</div>
                    <div><div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}><b style={{fontSize:17}}>{t.title}</b><span style={{...badgeStyle,border:"1px solid",...severityStyle(t.severity)}}>{severityLabel(t.severity)}</span></div>
                    <p style={{margin:"8px 0",fontSize:12,color:C.muted,lineHeight:1.65}}>{t.interpretation}</p>
                    <div style={{fontSize:12,lineHeight:1.6}}><b>DORA önerisi:</b> {t.recommendation}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>{t.modules.map(m=><span key={m} style={{...badgeStyle,background:"#f2f4f7",color:C.muted}}>{m}</span>)}</div></div>
                    <div style={{textAlign:"center",minWidth:72}}><div style={{fontSize:26,fontWeight:950,color:t.score>=90?C.red:t.score>=70?C.orange:C.blue}}>{t.score}</div><div style={{fontSize:10,color:C.muted}}>ÖNCELİK</div></div>
                  </div>
                </article>)}
              </div>
            </section>

            <section style={{...card,marginTop:14}}>
              <Header title="Çapraz Modül Analizleri" sub="Aynı olayı farklı modüllerdeki verilerle ilişkilendirir. Eşleşme nedensellik değil, araştırılması gereken sinyaldir." />
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))",gap:10,marginTop:14}}>
                {(analysis.crossAnalyses ?? []).map(x=><article key={x.id} style={{border:`1px solid ${C.line}`,borderRadius:14,padding:15}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:10}}><b>{x.title}</b><span style={{fontSize:11,fontWeight:900,color:x.status==="SIGNAL"?C.orange:x.status==="POSITIVE"?C.green:C.muted}}>{x.status==="SIGNAL"?"İnceleme sinyali":x.status==="POSITIVE"?"Olumlu görünüm":"Veri sınırlı"}</span></div>
                  <p style={{margin:"8px 0",fontSize:12,color:C.muted,lineHeight:1.65}}>{x.interpretation}</p>
                  <div style={{fontSize:12,lineHeight:1.6}}><b>Önerilen inceleme:</b> {x.recommendation}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>{x.evidence.map(e=><span key={e} style={{...badgeStyle,background:"#f2f4f7",color:C.muted}}>{e}</span>)}</div>
                  <div style={{marginTop:10,fontSize:10,color:C.muted}}>Analiz güveni: {x.confidence==="HIGH"?"Yüksek":x.confidence==="MEDIUM"?"Orta":"Düşük"}</div>
                </article>)}
              </div>
            </section>

            <section style={{...card,marginTop:14}}>
              <Header title="DORA Veri Güvenilirliği" sub="DORA önce verinin analiz için yeterli olup olmadığını ölçer; kayıt boşluğunu gerçek operasyonel eksiklik gibi sunmaz." />
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10,marginTop:14}}>
                {(analysis.dataQuality?.items ?? []).map(q=>{const color=q.status==="GOOD"?C.green:q.status==="WARNING"?C.orange:C.red;return <div key={q.key} style={{border:`1px solid ${C.line}`,borderRadius:14,padding:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:10}}><b>{q.label}</b><b style={{color}}>{q.score}/100</b></div>
                  <div style={{height:7,borderRadius:99,background:"#f2f4f7",overflow:"hidden",margin:"11px 0"}}><div style={{height:"100%",width:`${q.score}%`,background:color}}/></div>
                  <div style={{fontSize:12,lineHeight:1.55,color:C.muted}}>{q.interpretation}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:9}}>{q.evidence.map(e=><span key={e} style={{...badgeStyle,background:"#f2f4f7",color:C.muted}}>{e}</span>)}</div>
                </div>})}
              </div>
            </section>

            <section style={{...card,marginTop:14}}>
              <Header title="Detaylı Bulgular" sub="Ana ekranda tekrar yaratmaması için ikincil seviyeye taşındı. Gerektiğinde filtreleyerek inceleyebilirsiniz." />
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
                <select value={filter} onChange={e=>setFilter(e.target.value as any)} style={input}><option value="ALL">Tüm öncelikler</option><option value="CRITICAL">Kritik</option><option value="HIGH">Yüksek</option><option value="MEDIUM">Orta</option><option value="LOW">Düşük</option></select>
                <select value={moduleFilter} onChange={e=>setModuleFilter(e.target.value)} style={input}><option value="ALL">Tüm modüller</option>{[...new Map(findings.map(x=>[x.module,x.moduleLabel])).entries()].map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
              </div>
              <div style={{display:"grid",gap:9,marginTop:12}}>{visibleFindings.map(f=><div key={f.id} style={{border:`1px solid ${C.line}`,borderRadius:12,padding:13}}><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><span style={{...badgeStyle,border:"1px solid",...severityStyle(f.severity)}}>{severityLabel(f.severity)}</span><b>{f.title}</b><span style={{fontSize:11,color:C.muted}}>{f.moduleLabel}</span></div><p style={{margin:"8px 0",fontSize:12,color:C.muted,lineHeight:1.65}}>{f.description}</p><div style={{fontSize:12}}><b>DORA önerisi:</b> {f.recommendation}</div></div>)}</div>
            </section>

            <section style={{ ...card, marginTop: 14, background: "#fffbfa" }}>
              <Header title="DORA Faz 1 Güvenlik Sınırı" sub="Bu sürüm analiz motorudur. Otomatik aksiyon ve modül yazma yetkileri bilinçli olarak kapalıdır." />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8, marginTop: 12 }}>
                {["Modül verisi değiştirmez", "Görev/aksiyon oluşturmaz", "Risk veya DÖF kapatmaz", "Eğitim atamaz", "Sağlık kaydı değiştirmez", "Sadece okur ve önerir"].map((x) => (
                  <div key={x} style={{ padding: 11, border: `1px solid ${C.line}`, borderRadius: 11, background: C.white, fontSize: 11, fontWeight: 750 }}>✓ {x}</div>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function Header({ title, sub }: { title: string; sub: string }) {
  return <div><div style={{ fontSize: 19, fontWeight: 950 }}>{title}</div><div style={{ marginTop: 5, color: C.muted, fontSize: 12, lineHeight: 1.55 }}>{sub}</div></div>;
}

function Metric({ title, value, sub, danger = false, warning = false }: { title: string; value: string | number; sub: string; danger?: boolean; warning?: boolean }) {
  return <div style={card}><div style={{ fontSize: 11, color: C.muted, fontWeight: 800 }}>{title}</div><div style={{ marginTop: 7, fontSize: 29, fontWeight: 950, color: danger ? C.red : warning ? C.orange : C.ink }}>{value}</div><div style={{ marginTop: 5, fontSize: 11, color: C.muted }}>{sub}</div></div>;
}

const card: React.CSSProperties = { background: C.white, border: `1px solid ${C.line}`, borderRadius: 16, padding: 16, boxShadow: "0 3px 12px rgba(16,24,40,.035)", minWidth: 0 };
const moduleCard: React.CSSProperties = { background: C.white, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, cursor: "pointer", minWidth: 0 };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 12px", border: `1px solid ${C.line}`, borderRadius: 10, background: C.white, fontSize: 12, outline: "none" };
const primaryButton: React.CSSProperties = { border: "1px solid rgba(255,255,255,.3)", borderRadius: 11, padding: "11px 14px", background: "rgba(255,255,255,.14)", color: C.white, fontWeight: 850, cursor: "pointer" };
const secondaryButton: React.CSSProperties = { border: `1px solid ${C.line}`, borderRadius: 10, padding: "9px 11px", background: C.white, color: C.ink, fontWeight: 800, fontSize: 11, cursor: "pointer" };
const badgeStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "5px 8px", fontSize: 10, fontWeight: 850, whiteSpace: "nowrap" };
const severityBadge: React.CSSProperties = { display: "inline-flex", alignItems: "center", border: "1px solid", borderRadius: 999, padding: "5px 8px", fontSize: 10, fontWeight: 900 };
const statusBadge: React.CSSProperties = { display: "inline-flex", padding: "5px 8px", borderRadius: 999, fontSize: 10, fontWeight: 900 };
const evidenceBadge: React.CSSProperties = { display: "inline-flex", padding: "6px 8px", borderRadius: 999, background: "#f2f4f7", color: C.muted, fontSize: 10, fontWeight: 750 };
