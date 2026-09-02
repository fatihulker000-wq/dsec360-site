"use client";

import { ArrowLeft, Loader2, LockKeyhole, Plus, Save, Send, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type OptionDraft = { label: string; value: string; riskLevel: string; riskPoints: number };
type QuestionDraft = { text: string; type: string; required: boolean; weight: number; helpText: string; options: OptionDraft[] };
const defaultOptions = (): OptionDraft[] => [
  { label: "Evet", value: "YES", riskLevel: "NONE", riskPoints: 0 },
  { label: "Hayır", value: "NO", riskLevel: "HIGH", riskPoints: 75 },
];
const newQuestion = (): QuestionDraft => ({ text: "", type: "YES_NO", required: true, weight: 3, helpText: "", options: defaultOptions() });

export default function SurveyBuilderPage() {
  const id = String(useParams()?.id || "");
  const [survey, setSurvey] = useState({ title: "", description: "", category: "", status: "DRAFT", endsAt: "", responseCount: 0 });
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [targetType, setTargetType] = useState("ALL");
  const [jobTitle, setJobTitle] = useState("");
  const [employeeIds, setEmployeeIds] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [surveyResponse, questionResponse] = await Promise.all([
          fetch(`/api/admin/documentation/employee-surveys/${id}`, { cache: "no-store", credentials: "include" }),
          fetch(`/api/admin/documentation/employee-surveys/${id}/questions`, { cache: "no-store", credentials: "include" }),
        ]);
        const surveyJson = await surveyResponse.json().catch(() => ({}));
        const questionJson = await questionResponse.json().catch(() => ({}));
        if (!surveyResponse.ok) throw new Error(surveyJson.error || "Anket yüklenemedi.");
        if (!questionResponse.ok) throw new Error(questionJson.error || "Sorular yüklenemedi.");
        const row = surveyJson.survey || {};
        setSurvey({ title: row.title || "", description: row.description || "", category: row.category || "", status: row.status || "DRAFT", endsAt: row.ends_at ? new Date(row.ends_at).toISOString().slice(0, 16) : "", responseCount: Number(surveyJson.responseCount || 0) });
        if (Array.isArray(questionJson.questions) && questionJson.questions.length) setQuestions(questionJson.questions);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Anket yüklenemedi.");
      }
    })();
  }, [id]);

  const questionsLocked = survey.status !== "DRAFT" || survey.responseCount > 0;

  async function saveSurvey() {
    try {
      setSaving(true); setError(""); setMessage("");
      const response = await fetch(`/api/admin/documentation/employee-surveys/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ action: "UPDATE", title: survey.title, description: survey.description, category: survey.category, endsAt: survey.endsAt ? new Date(survey.endsAt).toISOString() : null }) });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || "Anket bilgileri kaydedilemedi.");
      setMessage("Anket bilgileri güncellendi.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Anket bilgileri kaydedilemedi."); }
    finally { setSaving(false); }
  }

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) { setQuestions((rows) => rows.map((x, i) => i === index ? { ...x, ...patch } : x)); }
  function changeType(index: number, type: string) {
    const needsOptions = ["YES_NO", "SINGLE", "MULTIPLE", "LIKERT_5", "SCALE_10"].includes(type);
    let options: OptionDraft[] = [];
    if (type === "YES_NO") options = defaultOptions();
    else if (type === "LIKERT_5") options = [
      ["Kesinlikle Katılmıyorum", "1", "CRITICAL", 100], ["Katılmıyorum", "2", "HIGH", 75], ["Kararsızım", "3", "MEDIUM", 40], ["Katılıyorum", "4", "NONE", 0], ["Kesinlikle Katılıyorum", "5", "NONE", 0],
    ].map((x) => ({ label: String(x[0]), value: String(x[1]), riskLevel: String(x[2]), riskPoints: Number(x[3]) }));
    else if (needsOptions) options = [{ label: "Seçenek 1", value: "1", riskLevel: "NONE", riskPoints: 0 }];
    updateQuestion(index, { type, options });
  }
  function updateOption(qi: number, oi: number, patch: Partial<OptionDraft>) { updateQuestion(qi, { options: questions[qi].options.map((x, i) => i === oi ? { ...x, ...patch } : x) }); }

  async function saveQuestions() {
    if (questionsLocked) { setError("Yanıt bütünlüğünü korumak için yayınlanmış veya yanıt alınmış anketlerin soruları değiştirilemez. Anketi kopyalayarak yeni dönem oluşturun."); return; }
    try {
      setSaving(true); setError(""); setMessage("");
      const response = await fetch(`/api/admin/documentation/employee-surveys/${id}/questions`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ questions }) });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || "Sorular kaydedilemedi.");
      setMessage(`${json.questionCount} soru kaydedildi.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sorular kaydedilemedi."); }
    finally { setSaving(false); }
  }
  async function publish() {
    try {
      setPublishing(true); setError(""); setMessage("");
      const response = await fetch(`/api/admin/documentation/employee-surveys/${id}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ targetType, jobTitle, employeeIds: employeeIds.split(",").map((x) => x.trim()).filter(Boolean) }) });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || "Anket yayınlanamadı.");
      setMessage(`Anket yayınlandı. Hedef: ${json.targeted}, e-posta gönderilen: ${json.sent}, başarısız: ${json.failed}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Anket yayınlanamadı."); }
    finally { setPublishing(false); }
  }

  return <main style={{ minHeight: "100vh", background: "#f4f7f6", padding: 24, color: "#172033" }}><div style={{ maxWidth: 1100, margin: "auto", display: "grid", gap: 16 }}>
    <header style={{ ...panel, background: "linear-gradient(135deg,#064e3b,#0f766e)", color: "white" }}><button style={ghost} onClick={() => { window.location.href = "/admin/documentation/employee-surveys"; }}><ArrowLeft size={16}/> Ankete Dön</button><h1>Anket Soru ve Gönderim Merkezi</h1><p>Soruları oluşturun, riskli cevapları işaretleyin ve çalışanlara güvenli bağlantı gönderin.</p></header>
    {error ? <div style={{ ...notice, color: "#b91c1c", background: "#fef2f2" }}>{error}</div> : null}{message ? <div style={{ ...notice, color: "#047857", background: "#ecfdf5" }}>{message}</div> : null}
    <section style={panel}><h2 style={{ marginTop: 0 }}>Anket Bilgileri</h2><div style={grid}><Field label="Anket adı"><input style={input} value={survey.title} onChange={(e) => setSurvey((x) => ({ ...x, title: e.target.value }))}/></Field><Field label="Kategori"><input style={input} value={survey.category} onChange={(e) => setSurvey((x) => ({ ...x, category: e.target.value }))}/></Field><Field label="Bitiş tarihi"><input style={input} type="datetime-local" value={survey.endsAt} onChange={(e) => setSurvey((x) => ({ ...x, endsAt: e.target.value }))}/></Field></div><Field label="Açıklama"><textarea style={{ ...input, minHeight: 80 }} value={survey.description} onChange={(e) => setSurvey((x) => ({ ...x, description: e.target.value }))}/></Field><button style={{ ...primary, marginTop: 14 }} disabled={saving} onClick={() => void saveSurvey()}>{saving ? <Loader2 size={17}/> : <Save size={17}/>} Bilgileri Kaydet</button></section>
    {questionsLocked ? <div style={{ ...notice, color: "#92400e", background: "#fffbeb", display: "flex", gap: 10, alignItems: "center" }}><LockKeyhole size={22}/><span><b>Sorular kilitli.</b> Bu anket {survey.status === "ACTIVE" ? "yayında" : "taslak dışında"} ve {survey.responseCount} yanıt içeriyor. Metin, süre ve açıklama güncellenebilir; soru değişikliği için ana ekrandan “Kopyala” kullanın.</span></div> : null}
    {questions.map((q, qi) => <section key={qi} style={{ ...panel, opacity: questionsLocked ? .72 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><h2 style={{ margin: 0 }}>Soru {qi + 1}</h2><button style={danger} disabled={questionsLocked} onClick={() => setQuestions((x) => x.filter((_, i) => i !== qi))}><Trash2 size={16}/> Sil</button></div>
      <div style={grid}><Field label="Soru metni"><textarea style={{ ...input, minHeight: 85 }} value={q.text} onChange={(e) => updateQuestion(qi, { text: e.target.value })}/></Field><Field label="Cevap tipi"><select style={input} value={q.type} onChange={(e) => changeType(qi, e.target.value)}>{[["YES_NO","Evet / Hayır"],["SINGLE","Tek seçim"],["MULTIPLE","Çoklu seçim"],["LIKERT_5","Likert 5"],["SCALE_10","1–10 ölçeği"],["TEXT","Açık uçlu"],["NUMBER","Sayısal"],["DATE","Tarih"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></Field><Field label="Önem ağırlığı (1–5)"><input style={input} type="number" min={1} max={5} value={q.weight} onChange={(e) => updateQuestion(qi, { weight: Number(e.target.value) })}/></Field></div>
      {q.options.length ? <div style={{ display: "grid", gap: 8, marginTop: 15 }}>{q.options.map((o, oi) => <div key={oi} style={{ display: "grid", gridTemplateColumns: "1fr 150px 120px 42px", gap: 8 }}><input style={input} value={o.label} onChange={(e) => updateOption(qi, oi, { label: e.target.value, value: e.target.value })}/><select style={input} value={o.riskLevel} onChange={(e) => updateOption(qi, oi, { riskLevel: e.target.value })}>{["NONE","LOW","MEDIUM","HIGH","CRITICAL"].map((x) => <option key={x}>{x}</option>)}</select><input style={input} type="number" min={0} max={100} value={o.riskPoints} onChange={(e) => updateOption(qi, oi, { riskPoints: Number(e.target.value) })}/><button style={danger} onClick={() => updateQuestion(qi, { options: q.options.filter((_, i) => i !== oi) })}><Trash2 size={15}/></button></div>)}<button style={secondary} onClick={() => updateQuestion(qi, { options: [...q.options, { label: `Seçenek ${q.options.length + 1}`, value: String(q.options.length + 1), riskLevel: "NONE", riskPoints: 0 }] })}><Plus size={16}/> Seçenek ekle</button></div> : null}
    </section>)}
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button style={secondary} disabled={questionsLocked} onClick={() => setQuestions((x) => [...x, newQuestion()])}><Plus size={17}/> Soru Ekle</button><button style={primary} disabled={saving || questionsLocked} onClick={() => void saveQuestions()}>{saving ? <Loader2 size={17}/> : <Save size={17}/>} Soruları Kaydet</button></div>
    <section style={panel}><h2>Çalışanlara Gönder</h2><div style={grid}><Field label="Hedef kitle"><select style={input} value={targetType} onChange={(e) => setTargetType(e.target.value)}><option value="ALL">Tüm aktif çalışanlar</option><option value="JOB_TITLE">Görev/kadro</option><option value="PERSON">Çalışan kimlikleri</option><option value="MULTI_PERSON">Çoklu çalışan</option></select></Field>{targetType === "JOB_TITLE" ? <Field label="Görev/kadro"><input style={input} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}/></Field> : null}{["PERSON","MULTI_PERSON"].includes(targetType) ? <Field label="Çalışan ID'leri (virgülle)"><input style={input} value={employeeIds} onChange={(e) => setEmployeeIds(e.target.value)}/></Field> : null}</div><button style={{ ...primary, marginTop: 15 }} disabled={publishing} onClick={() => void publish()}>{publishing ? <Loader2 size={17}/> : <Send size={17}/>} Yayınla ve E-posta Gönder</button></section>
  </div></main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 800, color: "#475569" }}>{label}{children}</label>; }
const panel = { background: "white", border: "1px solid #dfe7e4", borderRadius: 18, padding: 20, boxShadow: "0 8px 24px rgba(15,23,42,.04)" } as const;
const input = { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 9, padding: "10px 11px", font: "inherit" } as const;
const grid = { display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, marginTop: 15 } as const;
const primary = { border: 0, borderRadius: 10, padding: "11px 15px", background: "#0f766e", color: "white", fontWeight: 800, display: "inline-flex", gap: 7, alignItems: "center", cursor: "pointer" } as const;
const secondary = { ...primary, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" } as const;
const danger = { ...primary, background: "#fef2f2", color: "#b91c1c", padding: "8px 10px" } as const;
const ghost = { ...primary, background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.25)" } as const;
const notice = { padding: 14, borderRadius: 12, border: "1px solid currentColor", fontWeight: 750 } as const;
