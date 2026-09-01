"use client";

import { AlertTriangle, CheckCircle2, Loader2, LockKeyhole, Send, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Option = { id: string; label: string; value: string };
type Question = { id: string; position: number; text: string; type: string; required: boolean; helpText?: string | null; options: Option[] };
type Survey = { id: string; title: string; description: string; category: string; anonymous: boolean; endsAt?: string | null };
type Value = { optionIds?: string[]; textValue?: string; numberValue?: number | string; dateValue?: string };

export default function SurveyResponsePage() {
  const params = useParams();
  const token = String(params?.token || "");
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Value>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`/api/surveys/${encodeURIComponent(token)}`, { cache: "no-store" });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(json.error || "Anket açılamadı.");
        setSurvey(json.survey); setQuestions(Array.isArray(json.questions) ? json.questions : []);
      } catch (cause) { setError(cause instanceof Error ? cause.message : "Anket açılamadı."); }
      finally { setLoading(false); }
    })();
  }, [token]);

  function setSingle(questionId: string, optionId: string) { setAnswers((x) => ({ ...x, [questionId]: { ...x[questionId], optionIds: [optionId] } })); }
  function setMultiple(questionId: string, optionId: string, checked: boolean) {
    setAnswers((current) => {
      const old = current[questionId]?.optionIds || [];
      return { ...current, [questionId]: { ...current[questionId], optionIds: checked ? [...new Set([...old, optionId])] : old.filter((x) => x !== optionId) } };
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      setSaving(true); setError("");
      const response = await fetch(`/api/surveys/${encodeURIComponent(token)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: questions.map((q) => ({ questionId: q.id, ...(answers[q.id] || {}) })) }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || "Yanıtlar kaydedilemedi.");
      setDone(true); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Yanıtlar kaydedilemedi."); }
    finally { setSaving(false); }
  }

  if (loading) return <Shell><div style={center}><Loader2 size={34}/><b>Anket yükleniyor…</b></div></Shell>;
  if (done) return <Shell><div style={center}><CheckCircle2 size={55} color="#059669"/><h1>Teşekkür ederiz</h1><p>Yanıtlarınız güvenli şekilde kaydedildi.</p></div></Shell>;
  if (error && !survey) return <Shell><div style={center}><AlertTriangle size={52} color="#b91c1c"/><h1>Anket açılamadı</h1><p>{error}</p></div></Shell>;

  return <Shell>
    <header style={{ padding: 25, borderRadius: 20, color: "white", background: "linear-gradient(135deg,#064e3b,#0f766e,#0e7490)" }}>
      <div style={{ fontSize: 13, fontWeight: 800, opacity: .82 }}>D-SEC • {survey?.category}</div>
      <h1 style={{ margin: "10px 0 8px", fontSize: 27 }}>{survey?.title}</h1>
      <p style={{ margin: 0, lineHeight: 1.65, opacity: .9 }}>{survey?.description}</p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16, fontSize: 13 }}><LockKeyhole size={16}/>{survey?.anonymous ? "Bu anket anonimdir; kimliğiniz yanıtlarla kaydedilmez." : "Bu anket kimlikli olarak yürütülmektedir."}</div>
    </header>
    {error ? <div style={{ padding: 14, borderRadius: 12, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca" }}>{error}</div> : null}
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      {questions.map((q) => <section key={q.id} style={card}>
        <div style={{ display: "flex", gap: 12 }}><b style={number}>{q.position}</b><div><h2 style={{ margin: 0, fontSize: 17, lineHeight: 1.45 }}>{q.text}{q.required ? <span style={{ color: "#dc2626" }}> *</span> : null}</h2>{q.helpText ? <p style={{ color: "#64748b", margin: "6px 0 0", fontSize: 13 }}>{q.helpText}</p> : null}</div></div>
        <div style={{ display: "grid", gap: 9, marginTop: 17 }}>{renderQuestion(q, answers[q.id] || {}, setSingle, setMultiple, (value) => setAnswers((x) => ({ ...x, [q.id]: { ...x[q.id], ...value } })))}</div>
      </section>)}
      <button disabled={saving} style={submitButton}>{saving ? <Loader2 size={18}/> : <Send size={18}/>} {saving ? "Kaydediliyor…" : "Anketi Tamamla"}</button>
    </form>
    <footer style={{ textAlign: "center", color: "#64748b", fontSize: 12 }}><ShieldCheck size={16} style={{ verticalAlign: "middle", marginRight: 5 }}/>Yanıtlar D-SEC güvenlik politikalarına göre işlenir.</footer>
  </Shell>;
}

function renderQuestion(q: Question, value: Value, setSingle: (q: string, o: string) => void, setMultiple: (q: string, o: string, c: boolean) => void, setValue: (v: Value) => void) {
  if (["YES_NO", "SINGLE", "LIKERT_5", "SCALE_10"].includes(q.type)) return q.options.map((o) => <label key={o.id} style={choice}><input type="radio" name={q.id} required={q.required} checked={value.optionIds?.[0] === o.id} onChange={() => setSingle(q.id, o.id)}/><span>{o.label}</span></label>);
  if (q.type === "MULTIPLE") return q.options.map((o) => <label key={o.id} style={choice}><input type="checkbox" checked={value.optionIds?.includes(o.id) || false} onChange={(e) => setMultiple(q.id, o.id, e.target.checked)}/><span>{o.label}</span></label>);
  if (q.type === "TEXT") return <textarea required={q.required} value={value.textValue || ""} onChange={(e) => setValue({ textValue: e.target.value })} style={{ ...input, minHeight: 110 }} placeholder="Yanıtınızı yazın"/>;
  if (q.type === "NUMBER") return <input type="number" required={q.required} value={value.numberValue ?? ""} onChange={(e) => setValue({ numberValue: e.target.value })} style={input}/>;
  if (q.type === "DATE") return <input type="date" required={q.required} value={value.dateValue || ""} onChange={(e) => setValue({ dateValue: e.target.value })} style={input}/>;
  return <textarea required={q.required} value={value.textValue || ""} onChange={(e) => setValue({ textValue: e.target.value })} style={{ ...input, minHeight: 90 }}/>;
}
function Shell({ children }: { children: React.ReactNode }) { return <main style={{ minHeight: "100vh", background: "#f3f7f6", padding: "24px 14px", color: "#172033" }}><div style={{ maxWidth: 820, margin: "0 auto", display: "grid", gap: 16 }}>{children}</div></main>; }
const card = { background: "white", border: "1px solid #dfe8e5", borderRadius: 17, padding: 20, boxShadow: "0 8px 25px rgba(15,23,42,.04)" } as const;
const number = { width: 30, height: 30, borderRadius: 10, flex: "0 0 auto", display: "grid", placeItems: "center", background: "#ccfbf1", color: "#0f766e" } as const;
const choice = { display: "flex", gap: 10, alignItems: "center", padding: "12px 13px", border: "1px solid #dbe5e2", borderRadius: 11, cursor: "pointer" } as const;
const input = { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5e1", borderRadius: 10, padding: "11px 12px", font: "inherit" } as const;
const submitButton = { border: 0, borderRadius: 12, padding: "14px 18px", color: "white", background: "#0f766e", fontWeight: 850, fontSize: 15, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, cursor: "pointer" } as const;
const center = { ...card, minHeight: 280, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 10 } as const;
