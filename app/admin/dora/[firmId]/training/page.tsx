"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type DoraFirm = {
  id: string;
  firm_name: string;
  employee_count?: number | null;
};

type TrainingItem = {
  id: string;
  title: string;
  trainingType: string;
  trainingDate: string;
  trainingHours: string;
  startTime: string;
  endTime: string;
  place: string;
  trainerName: string;
  participantCount: number;
  status: string;
};

const EMPTY = (): TrainingItem => ({
  id: crypto.randomUUID(),
  title: "Temel İş Sağlığı ve Güvenliği Eğitimi",
  trainingType: "TEMEL_ISG",
  trainingDate: new Date().toLocaleDateString("tr-TR"),
  trainingHours: "8",
  startTime: "09:00",
  endTime: "17:00",
  place: "",
  trainerName: "",
  participantCount: 0,
  status: "PLANLANDI",
});

function value(v: unknown) {
  return String(v ?? "").trim();
}

export default function DoraTrainingPage() {
  const router = useRouter();
  const params = useParams();
  const firmId = value(params.firmId);

  const [firm, setFirm] = useState<DoraFirm | null>(null);
  const [items, setItems] = useState<TrainingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<TrainingItem>(EMPTY());

  const load = useCallback(async () => {
    if (!firmId) return;
    try {
      setLoading(true);
      setError("");
      const [firmRes, stateRes] = await Promise.all([
        fetch(`/api/dora/firms?id=${encodeURIComponent(firmId)}`, { cache: "no-store" }),
        fetch(`/api/dora/module-state?firmId=${encodeURIComponent(firmId)}&moduleKey=TRAINING`, { cache: "no-store" }),
      ]);
      const firmJson = await firmRes.json();
      const stateJson = await stateRes.json();
      if (!firmRes.ok || firmJson.success === false) throw new Error(firmJson.error || "Firma alınamadı.");
      if (!stateRes.ok || stateJson.success === false) throw new Error(stateJson.error || "Eğitim verileri alınamadı.");
      setFirm(firmJson.firm ?? null);
      const incoming = Array.isArray(stateJson.payload?.items) ? stateJson.payload.items : [];
      setItems(incoming.map((x: any, index: number) => ({
        id: value(x.id) || `training-${index}`,
        title: value(x.title) || value(x.trainingName) || "İSG Eğitimi",
        trainingType: value(x.trainingType) || "TEMEL_ISG",
        trainingDate: value(x.trainingDate),
        trainingHours: value(x.trainingHours) || "8",
        startTime: value(x.startTime) || value(x.trainingStartTime) || "09:00",
        endTime: value(x.endTime) || value(x.trainingEndTime) || "17:00",
        place: value(x.place) || value(x.trainingPlace),
        trainerName: value(x.trainerName),
        participantCount: Number(x.participantCount ?? 0) || 0,
        status: value(x.status) || "PLANLANDI",
      })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eğitim merkezi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => { void load(); }, [load]);

  async function persist(next: TrainingItem[]) {
    setSaving(true);
    try {
      const response = await fetch("/api/dora/module-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmId,
          moduleKey: "TRAINING",
          payload: { items: next, count: next.length, updatedAtMillis: Date.now() },
        }),
      });
      const json = await response.json();
      if (!response.ok || json.success === false) throw new Error(json.error || "Eğitim kaydedilemedi.");
      setItems(next);
    } finally {
      setSaving(false);
    }
  }

  async function saveForm() {
    if (!form.title.trim()) return alert("Eğitim adı zorunludur.");
    const exists = items.some((x) => x.id === form.id);
    const next = exists ? items.map((x) => x.id === form.id ? form : x) : [...items, form];
    try {
      await persist(next);
      setFormOpen(false);
      setForm(EMPTY());
    } catch (e) {
      alert(e instanceof Error ? e.message : "Eğitim kaydedilemedi.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Bu DORA eğitim kaydı silinsin mi?")) return;
    try { await persist(items.filter((x) => x.id !== id)); }
    catch (e) { alert(e instanceof Error ? e.message : "Eğitim silinemedi."); }
  }

  const planned = useMemo(() => items.filter(x => x.status !== "TAMAMLANDI").length, [items]);
  const completed = items.length - planned;

  if (loading) return <main className="page">DORA Eğitim Merkezi yükleniyor...</main>;

  return (
    <main className="page">
      <div className="topbar">
        <button className="outline" onClick={() => router.push(`/admin/dora/${firmId}`)}>← Firma Merkezine Dön</button>
        <button className="primary" onClick={() => { setForm(EMPTY()); setFormOpen(true); }}>Yeni Eğitim</button>
      </div>

      <section className="hero">
        <div><div className="eyebrow">DORA • EĞİTİM VE SERTİFİKA</div><h1>Eğitim ve Sertifika Merkezi</h1>
          <p>{firm?.firm_name || "DORA firması"} için eğitim oturumlarını, katılımı, sınav/sertifika hazırlığını ve App ile ortak eğitim durumunu yönetin.</p></div>
        <div className="heroCount"><strong>{items.length}</strong><span>eğitim</span></div>
      </section>

      {error && <div className="error">{error}</div>}

      <section className="kpis">
        <Kpi title="Toplam Eğitim" value={items.length} detail="DORA eğitim oturumları" />
        <Kpi title="Planlanan" value={planned} detail="Bekleyen eğitim" />
        <Kpi title="Tamamlanan" value={completed} detail="Tamamlandı durumu" />
        <Kpi title="Çalışan" value={firm?.employee_count ?? 0} detail="DORA çalışan havuzu" />
      </section>

      <section className="panel">
        <div className="panelHead"><div><span>DORA EĞİTİMLERİ</span><h2>Eğitim Oturumları</h2></div><button className="outline" onClick={() => void load()}>Yenile</button></div>
        {items.length === 0 ? <div className="empty">Henüz DORA eğitim kaydı yok. App veya Web üzerinden oluşturulan eğitimler senkronizasyonla burada ortaklaşacaktır.</div> :
          <div className="list">{items.map(item => <article className="card" key={item.id}>
            <div><span className="badge">{item.status}</span><h3>{item.title}</h3><p>{item.trainingDate || "Tarih yok"} • {item.trainingHours} saat • {item.trainerName || "Eğitmen atanmadı"}</p><small>{item.place || "Yer belirtilmedi"} • {item.participantCount} katılımcı</small></div>
            <div className="actions"><button className="outline" onClick={() => { setForm(item); setFormOpen(true); }}>Düzenle</button><button className="danger" onClick={() => void remove(item.id)}>Sil</button></div>
          </article>)}</div>}
      </section>

      {formOpen && <div className="backdrop" onMouseDown={() => !saving && setFormOpen(false)}><div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className="panelHead"><div><span>DORA EĞİTİM FORMU</span><h2>Eğitim Kaydı</h2></div><button className="outline" onClick={() => setFormOpen(false)}>×</button></div>
        <div className="formGrid">
          <Field label="Eğitim Adı" value={form.title} onChange={v => setForm({...form,title:v})}/>
          <Field label="Eğitim Türü" value={form.trainingType} onChange={v => setForm({...form,trainingType:v})}/>
          <Field label="Tarih" value={form.trainingDate} onChange={v => setForm({...form,trainingDate:v})}/>
          <Field label="Süre (saat)" value={form.trainingHours} onChange={v => setForm({...form,trainingHours:v})}/>
          <Field label="Başlangıç" value={form.startTime} onChange={v => setForm({...form,startTime:v})}/>
          <Field label="Bitiş" value={form.endTime} onChange={v => setForm({...form,endTime:v})}/>
          <Field label="Yer" value={form.place} onChange={v => setForm({...form,place:v})}/>
          <Field label="Eğitmen" value={form.trainerName} onChange={v => setForm({...form,trainerName:v})}/>
          <Field label="Katılımcı Sayısı" value={String(form.participantCount)} onChange={v => setForm({...form,participantCount:Number(v)||0})}/>
          <label className="field"><span>Durum</span><select value={form.status} onChange={e => setForm({...form,status:e.target.value})}><option value="PLANLANDI">Planlandı</option><option value="DEVAM_EDIYOR">Devam Ediyor</option><option value="TAMAMLANDI">Tamamlandı</option></select></label>
        </div>
        <button className="primary full" disabled={saving} onClick={() => void saveForm()}>{saving ? "Kaydediliyor..." : "Eğitimi Kaydet"}</button>
      </div></div>}

      <style jsx>{styles}</style>
    </main>
  );
}

function Kpi({title,value,detail}:{title:string;value:string|number;detail:string}) { return <article className="kpi"><span>{title}</span><strong>{value}</strong><small>{detail}</small></article>; }
function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) { return <label className="field"><span>{label}</span><input value={value} onChange={e=>onChange(e.target.value)}/></label>; }

const styles = `
:global(*){box-sizing:border-box}.page{min-height:100vh;padding:24px;color:#172033;background:linear-gradient(180deg,#f7f8fb,#fff 430px)}button{font:inherit;cursor:pointer}.topbar,.hero,.kpis,.panel{max-width:1450px;margin-left:auto;margin-right:auto}.topbar{display:flex;justify-content:space-between;gap:12px;margin-bottom:14px}.hero{padding:32px;border-radius:28px;display:flex;justify-content:space-between;gap:24px;align-items:center;color:#fff;background:linear-gradient(120deg,#50141f,#7a2633 48%,#d0602c);box-shadow:0 22px 50px rgba(73,20,31,.17)}.eyebrow,.panelHead span{font-size:11px;font-weight:900;letter-spacing:.13em}.hero h1{margin:8px 0 10px;font-size:clamp(32px,5vw,52px)}.hero p{margin:0;max-width:760px;line-height:1.6;color:rgba(255,255,255,.86)}.heroCount{min-width:150px;padding:20px;border:1px solid rgba(255,255,255,.2);border-radius:20px;text-align:center;background:rgba(255,255,255,.13)}.heroCount strong{display:block;font-size:42px}.heroCount span{font-weight:800}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px}.kpi,.panel,.card{border:1px solid #e4e7ec;background:#fff}.kpi{padding:18px;border-radius:18px}.kpi span,.kpi small{display:block;color:#667085}.kpi strong{display:block;font-size:30px;margin:8px 0}.panel{margin-top:18px;padding:22px;border-radius:22px}.panelHead{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.panelHead span{color:#8c3543}.panelHead h2{margin:5px 0 0}.list{display:grid;gap:12px;margin-top:18px}.card{padding:18px;border-radius:17px;display:flex;justify-content:space-between;gap:20px;align-items:center}.card h3{margin:8px 0}.card p,.card small{color:#667085}.badge{padding:5px 9px;border-radius:999px;background:#fff0f2;color:#8c3543;font-size:11px;font-weight:850}.actions{display:flex;gap:8px}.primary,.outline,.danger{padding:10px 14px;border-radius:12px;font-weight:850}.primary{border:0;background:#7a2633;color:#fff}.outline{border:1px solid #d0d5dd;background:#fff;color:#344054}.danger{border:1px solid #f1b4b4;background:#fff2f2;color:#b42318}.empty,.error{margin-top:16px;padding:18px;border-radius:14px}.empty{background:#f8fafc;color:#667085}.error{max-width:1450px;margin:16px auto;background:#fff2f2;color:#b42318;border:1px solid #f1b4b4}.backdrop{position:fixed;inset:0;background:rgba(16,24,40,.45);display:grid;place-items:center;padding:18px;z-index:50}.modal{width:min(850px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:24px;padding:24px}.formGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:18px 0}.field{display:grid;gap:6px}.field span{font-size:12px;font-weight:800;color:#475467}.field input,.field select{width:100%;padding:11px 12px;border:1px solid #d0d5dd;border-radius:11px;background:#fff}.full{width:100%}@media(max-width:900px){.hero{flex-direction:column;align-items:flex-start}.kpis,.formGrid{grid-template-columns:1fr}.card{flex-direction:column;align-items:flex-start}}
`;
