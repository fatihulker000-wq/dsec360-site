"use client";

import { useEffect, useMemo, useState } from "react";
import type { HealthEmployee } from "@/components/health/types";
import ExaminationHistory from "./ExaminationHistory";

type Props = {
  employee: HealthEmployee;
};

type Suitability = "Uygun" | "Kısıtlı Uygun" | "Uygun Değil";
function normalizeExamType(value: string) {
  if (value === "İşe Giriş Muayenesi") return "ISE_GIRIS_MUAYENESI";
  if (value === "Periyodik Muayene") return "PERIYODIK_MUAYENE";
  if (value === "İş Değişikliği Muayenesi") return "IS_DEGISIKLIGI";
  if (value === "İş Kazası Sonrası Muayene") return "IS_KAZASI_SONRASI";
  if (value === "İşe Dönüş Muayenesi") return "ISE_DONUS";
  if (value === "Kontrol Muayenesi") return "KONTROL_MUAYENESI";

  return value;
}

function displayExamType(value: string) {
  if (value === "ISE_GIRIS_MUAYENESI") return "İşe Giriş Muayenesi";
  if (value === "PERIYODIK_MUAYENE") return "Periyodik Muayene";
  if (value === "IS_DEGISIKLIGI") return "İş Değişikliği Muayenesi";
  if (value === "IS_KAZASI_SONRASI") return "İş Kazası Sonrası Muayene";
  if (value === "ISE_DONUS") return "İşe Dönüş Muayenesi";
  if (value === "KONTROL_MUAYENESI") return "Kontrol Muayenesi";

  return value || "Periyodik Muayene";
}

export default function ExaminationWorkspace({ employee }: Props) {
  const [examType, setExamType] = useState("Periyodik Muayene");
  const [examDate, setExamDate] = useState("");
  const [nextExamDate, setNextExamDate] = useState("");

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [temperature, setTemperature] = useState("");
  const [spo2, setSpo2] = useState("");

  const [findings, setFindings] = useState("");
  const [decision, setDecision] = useState<Suitability>("Uygun");
  const [restrictionNote, setRestrictionNote] = useState("");
  const [doctorNote, setDoctorNote] = useState("");
  const [saving, setSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0);
const [selectedExaminationId, setSelectedExaminationId] = useState<string | null>(null);
const isEditMode = selectedExaminationId !== null;

  const bmi = useMemo(() => {
    const h = Number(height) / 100;
    const w = Number(weight);

    if (!h || !w) return "";

    return (w / (h * h)).toFixed(1);
  }, [height, weight]);

  const alerts = useMemo(() => {
    const list: string[] = [];

    const bmiValue = Number(bmi);
    const sys = Number(systolic);
    const dia = Number(diastolic);
    const p = Number(pulse);
    const s = Number(spo2);
    const temp = Number(temperature);

    if (bmiValue >= 30) list.push(`BMI ${bmiValue}: obezite aralığında.`);
    if (sys >= 140 || dia >= 90) list.push("Tansiyon yüksek görünüyor.");
    if (p && p < 50) list.push("Nabız düşük olabilir.");
    if (p > 110) list.push("Nabız yüksek olabilir.");
    if (s && s < 92) list.push("SpO₂ düşük, değerlendirme önerilir.");
    if (temp >= 38) list.push("Ateş yüksek görünüyor.");

    return list;
  }, [bmi, systolic, diastolic, pulse, spo2, temperature]);

function resetExaminationForm() {
  setSelectedExaminationId(null);

  setExamType("Periyodik Muayene");
  setExamDate("");
  setNextExamDate("");

  setHeight("");
  setWeight("");

  setSystolic("");
  setDiastolic("");

  setPulse("");
  setTemperature("");
  setSpo2("");

  setFindings("");
  setDecision("Uygun");
  setRestrictionNote("");
  setDoctorNote("");
}
  
async function saveExamination() {
  try {
    setSaving(true);

    const endpoint = isEditMode
  ? `/api/admin/health-examinations/${selectedExaminationId}`
  : "/api/admin/health-examinations";

  const res = await fetch(endpoint, {
  method: isEditMode ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        companyId: employee.company_id || employee.firm_id,
        employeeId: employee.id,

        examType: normalizeExamType(examType),
        examDate,
        nextExamDate,

        height,
        weight,
        bmi,

        systolic,
        diastolic,
        pulse,
        temperature,
        spo2,

        findings,
        decision,
        restrictionNote,
        doctorNote,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(isEditMode ? "Muayene başarıyla güncellendi." : "Muayene başarıyla kaydedildi.");
      return;
    }

    alert("Muayene başarıyla kaydedildi.");
    setReloadKey((v) => v + 1);
    setExamDate("");
setNextExamDate("");

setHeight("");
setWeight("");

setSystolic("");
setDiastolic("");

setPulse("");
setTemperature("");
setSpo2("");

setFindings("");
setDecision("Uygun");
setRestrictionNote("");
setDoctorNote("");
setSelectedExaminationId(null);
  } catch {
    alert("Sunucu bağlantı hatası.");
  } finally {
    setSaving(false);
  }
}

useEffect(() => {
  async function loadSelectedExamination() {
    if (!selectedExaminationId) return;

    try {
      const res = await fetch(
        `/api/admin/health-examinations/${selectedExaminationId}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const json = await res.json();

      if (!res.ok) return;

      const exam = json.examination;

      setExamType(displayExamType(exam.exam_type || "Periyodik Muayene"));
      setExamDate(exam.exam_date || "");
      setNextExamDate(exam.next_exam_date || "");

      setHeight(exam.height?.toString() || "");
      setWeight(exam.weight?.toString() || "");

      setSystolic(exam.blood_pressure_sys?.toString() || "");
      setDiastolic(exam.blood_pressure_dia?.toString() || "");

      setPulse(exam.pulse?.toString() || "");
      setTemperature(exam.temperature?.toString() || "");
      setSpo2(exam.spo2?.toString() || "");

      setFindings(exam.findings || "");
      setDecision((exam.decision || "Uygun") as Suitability);
      setRestrictionNote(exam.restriction_note || "");
      setDoctorNote(exam.doctor_note || "");
    } catch (err) {
      console.error(err);
    }
  }

  void loadSelectedExamination();
}, [selectedExaminationId]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={cardStyle}>
        <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  }}
>
  <h2 style={{ margin: 0 }}>Muayene Workspace</h2>

  <button
    type="button"
    onClick={resetExaminationForm}
    style={{
      border: "1px solid #fecaca",
      background: "#fff1f2",
      color: "#991b1b",
      borderRadius: 12,
      padding: "9px 13px",
      fontWeight: 900,
      cursor: "pointer",
    }}
  >
    + Yeni Muayene
  </button>
</div>
        <p style={mutedStyle}>
          Çalışanın muayene bilgileri, vital bulguları, sistem muayenesi ve işe
          uygunluk kararı bu ekrandan yönetilir.
        </p>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Çalışan Bilgileri</h3>

        <div style={gridStyle}>
          <Info label="Ad Soyad" value={employee.full_name} />
          <Info label="Firma" value={employee.company_name} />
          <Info label="Görev" value={employee.job_title || "-"} />
          <Info label="E-posta" value={employee.email || "-"} />
        </div>
      </section>

{isEditMode && (
  <section
    style={{
      background: "#fef3c7",
      border: "1px solid #fcd34d",
      borderRadius: 14,
      padding: 16,
      marginBottom: 18,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontWeight: 900 }}>
          Düzenleme Modu
        </div>

        <div
          style={{
            color: "#78350f",
            marginTop: 4,
          }}
        >
          Geçmişteki bir muayene kaydını düzenliyorsunuz.
        </div>
      </div>

      <button
        type="button"
        onClick={resetExaminationForm}
        style={{
          background: "#fff",
          border: "1px solid #d1d5db",
          borderRadius: 10,
          padding: "8px 14px",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Düzenlemeyi İptal Et
      </button>
    </div>
  </section>
)}
      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Muayene Bilgileri</h3>

        <div style={gridStyle}>
          <Field label="Muayene Türü">
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              style={inputStyle}
            >
              <option>İşe Giriş Muayenesi</option>
              <option>Periyodik Muayene</option>
              <option>İş Değişikliği Muayenesi</option>
              <option>İş Kazası Sonrası Muayene</option>
              <option>İşe Dönüş Muayenesi</option>
              <option>Kontrol Muayenesi</option>
            </select>
          </Field>

          <Field label="Muayene Tarihi">
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="Sonraki Muayene Tarihi">
            <input
              type="date"
              value={nextExamDate}
              onChange={(e) => setNextExamDate(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Vital Bulgular</h3>

        <div style={gridStyle}>
          <Field label="Boy (cm)">
            <input value={height} onChange={(e) => setHeight(e.target.value)} style={inputStyle} />
          </Field>

          <Field label="Kilo (kg)">
            <input value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} />
          </Field>

          <Info label="BMI" value={bmi || "-"} />

          <Field label="Tansiyon Sistolik">
            <input value={systolic} onChange={(e) => setSystolic(e.target.value)} style={inputStyle} />
          </Field>

          <Field label="Tansiyon Diyastolik">
            <input value={diastolic} onChange={(e) => setDiastolic(e.target.value)} style={inputStyle} />
          </Field>

          <Field label="Nabız">
            <input value={pulse} onChange={(e) => setPulse(e.target.value)} style={inputStyle} />
          </Field>

          <Field label="Ateş">
            <input value={temperature} onChange={(e) => setTemperature(e.target.value)} style={inputStyle} />
          </Field>

          <Field label="SpO₂">
            <input value={spo2} onChange={(e) => setSpo2(e.target.value)} style={inputStyle} />
          </Field>
        </div>
      </section>

      {alerts.length > 0 && (
        <section style={warningCardStyle}>
          <h3 style={{ marginTop: 0 }}>DORA Ön Uyarıları</h3>

          <div style={{ display: "grid", gap: 8 }}>
            {alerts.map((alert) => (
              <div key={alert} style={{ fontWeight: 800 }}>
                ⚠️ {alert}
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Sistem Muayenesi</h3>

        <div style={checkboxGridStyle}>
          {[
            "Göz",
            "Kulak",
            "Solunum",
            "Kardiyoloji",
            "Nöroloji",
            "Kas İskelet",
            "Deri",
            "Psikolojik",
          ].map((item) => (
            <label key={item} style={checkStyle}>
              <input type="checkbox" />
              {item}
            </label>
          ))}
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Bulgular</h3>

        <textarea
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
          placeholder="Muayene bulgularını giriniz..."
          style={textareaStyle}
        />
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>İşe Uygunluk Kararı</h3>

        <div style={checkboxGridStyle}>
          {(["Uygun", "Kısıtlı Uygun", "Uygun Değil"] as Suitability[]).map(
            (item) => (
              <label key={item} style={checkStyle}>
                <input
                  type="radio"
                  name="decision"
                  checked={decision === item}
                  onChange={() => setDecision(item)}
                />
                {item}
              </label>
            )
          )}
        </div>

        <textarea
          value={restrictionNote}
          onChange={(e) => setRestrictionNote(e.target.value)}
          placeholder="Kısıt / karar açıklaması..."
          style={{ ...textareaStyle, marginTop: 14 }}
        />
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Hekim Notu</h3>

        <textarea
          value={doctorNote}
          onChange={(e) => setDoctorNote(e.target.value)}
          placeholder="Hekim değerlendirme notu..."
          style={textareaStyle}
        />
      </section>

      <section style={actionCardStyle}>
        <ExaminationHistory
  employeeId={employee.id}
  reloadKey={reloadKey}
  onSelect={(id) => {
    setSelectedExaminationId(id);
  }}
/>
        <div>
          <strong>Muayene kaydı</strong>
          <p style={{ ...mutedStyle, marginTop: 6 }}>
            İlk sürümde form hazırlanıyor. Sonraki adımda Supabase kaydı eklenecek.
          </p>
        </div>

        <button
  type="button"
  onClick={saveExamination}
  disabled={saving}
  style={{
    ...primaryButtonStyle,
    opacity: saving ? 0.7 : 1,
    cursor: saving ? "wait" : "pointer",
  }}
>
  {saving
  ? "Kaydediliyor..."
  : isEditMode
  ? "Muayeneyi Güncelle"
  : "Muayeneyi Kaydet"}
</button>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={smallLabelStyle}>{label}</div>
      <div style={infoBoxStyle}>{value || "-"}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label>
      <div style={smallLabelStyle}>{label}</div>
      {children}
    </label>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 22,
};

const warningCardStyle: React.CSSProperties = {
  ...cardStyle,
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  color: "#9a3412",
};

const actionCardStyle: React.CSSProperties = {
  ...cardStyle,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 16,
};

const mutedStyle: React.CSSProperties = {
  color: "#64748b",
  lineHeight: 1.6,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: 12,
  border: "1px solid #d1d5db",
  padding: "0 12px",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 100,
  borderRadius: 12,
  border: "1px solid #d1d5db",
  padding: 12,
  outline: "none",
  resize: "vertical",
};

const smallLabelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#64748b",
  fontWeight: 800,
  marginBottom: 6,
};

const infoBoxStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "12px 14px",
  minHeight: 44,
  fontWeight: 800,
};

const checkboxGridStyle: React.CSSProperties = {
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
};

const checkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontWeight: 800,
  color: "#334155",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 14,
  padding: "12px 18px",
  background: "#7f1d1d",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};