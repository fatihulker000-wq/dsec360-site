"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "CLASSIC" | "PHOTO" | "SCORING" | "ELMERI";
type Firm = { id: string; name: string };
type Item = { id: string; order_no: number; title: string; question: string; photo_required?: boolean };
type Form = { id: string; title: string; code: string; category: string; audit_modes?: string[]; items?: Item[] };


async function readJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (!contentType.includes("application/json")) {
    throw new Error(`Sunucu JSON yerine ${response.status} yanıtı döndürdü. API route/deploy kontrol edilmeli.`);
  }
  try { return JSON.parse(text); } catch { throw new Error("Sunucudan geçersiz JSON yanıtı geldi."); }
}

const modeLabel: Record<Mode, string> = {
  CLASSIC: "Klasik",
  PHOTO: "Fotoğraflı",
  SCORING: "Puanlamalı",
  ELMERI: "ELMERI",
};

export default function NewWebInspectionPage() {
  const router = useRouter();
  const [firms, setFirms] = useState<Firm[]>([]);
  const [firmId, setFirmId] = useState("");
  const [mode, setMode] = useState<Mode>("CLASSIC");
  const [forms, setForms] = useState<Form[]>([]);
  const [formId, setFormId] = useState("");
  const [inspectorName, setInspectorName] = useState("");
  const [location, setLocation] = useState("");
  const [responsible, setResponsible] = useState("");
  const [auditDate, setAuditDate] = useState(new Date().toISOString().slice(0, 10));
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [started, setStarted] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<Record<string, File | null>>({});
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFirmId = (params.get("firmId") || params.get("firm") || "").trim();
    if (urlFirmId) setFirmId(urlFirmId);
  }, []);

  useEffect(() => {
    fetch("/api/admin/denetimler/web-entry/firms", { cache: "no-store" })
      .then(readJsonResponse)
      .then(j => {
        if (!j.success) throw new Error(j.error || "Firmalar alınamadı.");
        setFirms(j.firms || []);
      })
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    if (firmId) {
      const url = new URL(window.location.href);
      url.searchParams.set("firmId", firmId);
      url.searchParams.delete("firm");
      window.history.replaceState({}, "", url.toString());
    }
    if (!firmId) { setForms([]); setFormId(""); return; }
    setLoading(true); setError("");
    fetch(`/api/admin/denetimler/web-entry?firmId=${encodeURIComponent(firmId)}&mode=${mode}`, { cache: "no-store" })
      .then(readJsonResponse)
      .then(j => {
        if (!j.success) throw new Error(j.error || "Formlar alınamadı.");
        setForms(j.forms || []);
        setReadOnly(Boolean(j.readOnly));
        setFormId("");
        setAnswers({});
        setStarted(false);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [firmId, mode]);

  const selectedForm = useMemo(() => forms.find(f => f.id === formId) || null, [forms, formId]);
  const items = selectedForm?.items || [];

  function patch(id: string, data: any) {
    setAnswers(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...data } }));
  }

  function choosePhoto(itemId: string, file: File | null) {
    const oldPreview = photoPreviews[itemId];
    if (oldPreview) URL.revokeObjectURL(oldPreview);
    setPhotoFiles(prev => ({ ...prev, [itemId]: file }));
    setPhotoPreviews(prev => {
      const next = { ...prev };
      if (file) next[itemId] = URL.createObjectURL(file);
      else delete next[itemId];
      return next;
    });
  }

  async function uploadPhoto(itemId: string, file: File) {
    const fd = new FormData();
    fd.append("firmId", firmId);
    fd.append("formId", formId);
    fd.append("itemId", itemId);
    fd.append("file", file);
    const r = await fetch("/api/admin/denetimler/web-entry/photo", { method: "POST", body: fd });
    const j = await readJsonResponse(r);
    if (!r.ok || !j.success) throw new Error(j.detail || j.error || "Fotoğraf yüklenemedi.");
    return { photoPath: j.photoPath as string, photoUrl: j.photoUrl as string };
  }

  async function save() {
    if (!firmId || !formId) return setError("Firma ve denetim formu seçilmelidir.");
    setLoading(true); setError("");

    try {
      const uploaded: Record<string, { photoPath: string; photoUrl: string }> = {};
      if (mode === "PHOTO") {
        for (const item of items) {
          const file = photoFiles[item.id];
          if (file) uploaded[item.id] = await uploadPhoto(item.id, file);
        }
      }

      const payloadAnswers = items.map(item => ({
        itemId: item.id,
        ...(answers[item.id] || {}),
        ...(uploaded[item.id] || {}),
      }));

      const r = await fetch("/api/admin/denetimler/web-entry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          firmId, formId, mode, inspectorName, location, responsible, auditDate,
          answers: payloadAnswers,
        }),
      });
      const j = await readJsonResponse(r);
      if (!j.success) throw new Error(j.detail || j.error || "Denetim kaydedilemedi.");
      router.push(`/admin/denetimler?firmId=${encodeURIComponent(firmId)}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 28, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <button onClick={() => router.back()} style={{ border: 0, background: "transparent", fontWeight: 800, cursor: "pointer", marginBottom: 14 }}>
          ← Denetimlere Dön
        </button>

        <section style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)", color: "#fff", borderRadius: 24, padding: 24, marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".08em", opacity: .85 }}>D•SEC DENETİM YÖNETİMİ</div>
          <h1 style={{ margin: "7px 0", fontSize: 34 }}>Web'den Yeni Denetim</h1>
          <p style={{ margin: 0, opacity: .9 }}>Klasik, fotoğraflı, puanlamalı ve ELMERI denetimlerini aynı veri standardıyla kaydedin.</p>
        </section>

        {error && <div style={{ padding: 14, borderRadius: 12, background: "#fee2e2", color: "#991b1b", fontWeight: 800, marginBottom: 14 }}>{error}</div>}

        <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
            <label><b>Firma</b><select value={firmId} onChange={e => setFirmId(e.target.value)} style={field}><option value="">Firma seçin</option>{firms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
            <label><b>Denetim Tipi</b><select value={mode} onChange={e => setMode(e.target.value as Mode)} style={field}>{Object.entries(modeLabel).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label><b>Denetim Formu</b><select value={formId} onChange={e => { setFormId(e.target.value); setAnswers({}); setStarted(false); }} style={field}><option value="">{loading ? "Yükleniyor..." : "Yayınlanmış form seçin"}</option>{forms.map(f => <option key={f.id} value={f.id}>{f.title} {f.code ? `• ${f.code}` : ""}</option>)}</select></label>
            <label><b>Denetim Tarihi</b><input type="date" value={auditDate} onChange={e => setAuditDate(e.target.value)} style={field} /></label>
            <label><b>Denetçi</b><input value={inspectorName} onChange={e => setInspectorName(e.target.value)} style={field} placeholder="Ad Soyad" /></label>
            <label><b>Lokasyon / Bölüm</b><input value={location} onChange={e => setLocation(e.target.value)} style={field} placeholder="Örn. Depo A" /></label>
            <label><b>Sorumlu</b><input value={responsible} onChange={e => setResponsible(e.target.value)} style={field} placeholder="Aksiyon sorumlusu" /></label>
          </div>
        </section>

        {selectedForm && !started && (
          <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 20, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#991b1b", letterSpacing: ".06em" }}>DENETİM HAZIR</div>
              <div style={{ fontSize: 20, fontWeight: 900, marginTop: 4 }}>{selectedForm.title}</div>
              <div style={{ color: "#64748b", marginTop: 4 }}>{items.length} madde · {modeLabel[mode]} değerlendirme</div>
            </div>
            <button disabled={loading || readOnly || items.length === 0} onClick={() => setStarted(true)} style={{ ...saveBtn, opacity: loading || readOnly || items.length === 0 ? .55 : 1 }}>
              {items.length === 0 ? "Formda Madde Yok" : "Denetimi Başlat →"}
            </button>
          </section>
        )}

        {selectedForm && started && (
          <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ padding: 18, borderBottom: "1px solid #e2e8f0" }}>
              <strong style={{ fontSize: 20 }}>{selectedForm.title}</strong>
              <div style={{ marginTop: 4, color: "#64748b" }}>{items.length} madde · {modeLabel[mode]} değerlendirme</div>
            </div>

            {items.map((item, idx) => {
              const a = answers[item.id] || {};
              return (
                <div key={item.id} style={{ padding: 18, borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontWeight: 900, marginBottom: 5 }}>{idx + 1}. {item.title || "Denetim Maddesi"}</div>
                  <div style={{ color: "#475569", marginBottom: 12 }}>{item.question}</div>

                  {(mode === "CLASSIC" || mode === "PHOTO") && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {["UYGUN","KISMEN","UYGUNSUZ"].map(r => (
                        <button key={r} onClick={() => patch(item.id,{result:r})} style={{ ...pill, background: a.result === r ? "#991b1b" : "#fff", color: a.result === r ? "#fff" : "#334155" }}>
                          {r === "KISMEN" ? "Kısmen" : r === "UYGUN" ? "Uygun" : "Uygunsuz"}
                        </button>
                      ))}
                    </div>
                  )}

                  {mode === "SCORING" && (
                    <div>
                      <b style={{ display: "block", marginBottom: 8 }}>Puan</b>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {[0, 25, 50, 75, 100].map(score => (
                          <button
                            type="button"
                            key={score}
                            onClick={() => patch(item.id, { score })}
                            style={{
                              ...pill,
                              minWidth: 62,
                              background: Number(a.score) === score ? "#991b1b" : "#fff",
                              color: Number(a.score) === score ? "#fff" : "#334155",
                              borderColor: Number(a.score) === score ? "#991b1b" : "#cbd5e1",
                            }}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                      <div style={{ marginTop: 7, color: "#64748b", fontSize: 12 }}>
                        0 Tamamen Uygunsuz · 25 Büyük Ölçüde Uygunsuz · 50 Kısmen Uygun · 75 Büyük Ölçüde Uygun · 100 Tam Uygun
                      </div>
                    </div>
                  )}

                  {mode === "ELMERI" && (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(120px,1fr))", gap:10, maxWidth:650 }}>
                      <label><b>Doğru</b><input type="number" min={0} value={a.correct ?? ""} onChange={e => patch(item.id,{correct:e.target.value})} style={field} /></label>
                      <label><b>Hatalı</b><input type="number" min={0} value={a.wrong ?? ""} onChange={e => patch(item.id,{wrong:e.target.value})} style={field} /></label>
                      <label><b>Kapsam Dışı</b><input type="number" min={0} value={a.outOfScope ?? ""} onChange={e => patch(item.id,{outOfScope:e.target.value})} style={field} /></label>
                    </div>
                  )}

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:12 }}>
                    <input value={a.note ?? ""} onChange={e => patch(item.id,{note:e.target.value})} style={field} placeholder="Açıklama / bulgu notu" />
                    <input value={a.recommendedAction ?? ""} onChange={e => patch(item.id,{recommendedAction:e.target.value})} style={field} placeholder="Önerilen aksiyon" />
                  </div>

                  {mode === "PHOTO" && (
                    <div style={{ marginTop: 12, padding: 14, border: "1px dashed #cbd5e1", borderRadius: 14, background: "#f8fafc" }}>
                      <div style={{ fontWeight: 900, marginBottom: 8 }}>Fotoğraf Kanıtı</div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={e => choosePhoto(item.id, e.target.files?.[0] || null)}
                      />
                      {photoPreviews[item.id] && (
                        <div style={{ marginTop: 10, display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                          <img src={photoPreviews[item.id]} alt="Denetim kanıtı önizleme" style={{ width: 180, height: 120, objectFit: "cover", borderRadius: 12, border: "1px solid #e2e8f0" }} />
                          <button type="button" onClick={() => choosePhoto(item.id, null)} style={{ ...pill, background: "#fff" }}>Fotoğrafı Kaldır</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ padding: 18, display:"flex", justifyContent:"flex-end" }}>
              <button disabled={loading || readOnly} onClick={save} style={{ ...saveBtn, opacity: loading || readOnly ? .55 : 1 }}>
                {readOnly ? "Demo Modu • Salt Okunur" : loading ? "Kaydediliyor..." : "Denetimi Tamamla ve Kaydet"}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const field: React.CSSProperties = {
  width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10,
  border: "1px solid #cbd5e1", background: "#fff", boxSizing: "border-box",
};
const pill: React.CSSProperties = {
  padding: "9px 13px", borderRadius: 999, border: "1px solid #cbd5e1",
  fontWeight: 800, cursor: "pointer",
};
const saveBtn: React.CSSProperties = {
  padding: "12px 18px", borderRadius: 12, border: 0, background: "#991b1b",
  color: "#fff", fontWeight: 900, cursor: "pointer",
};
