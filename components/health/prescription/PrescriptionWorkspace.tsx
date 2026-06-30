"use client";

import { useState } from "react";
import PrescriptionHistory from "./PrescriptionHistory";

type PrescriptionItem = {
  medicineName: string;
  activeIngredient: string;
  dosage: string;
  usageType: string;
  duration: string;
  morning: boolean;
  noon: boolean;
  evening: boolean;
  night: boolean;
  beforeMeal: boolean;
  afterMeal: boolean;
  notes: string;
};

type Props = {
  employee: {
    id: string;
    full_name: string;
    company_id?: string;
    company_name?: string;
    job_title?: string;
  };
};

const emptyItem: PrescriptionItem = {
  medicineName: "",
  activeIngredient: "",
  dosage: "",
  usageType: "",
  duration: "",
  morning: false,
  noon: false,
  evening: false,
  night: false,
  beforeMeal: false,
  afterMeal: false,
  notes: "",
};

export default function PrescriptionWorkspace({ employee }: Props) {
  const [diagnosisCode, setDiagnosisCode] = useState("");
  const [diagnosisName, setDiagnosisName] = useState("");
  const [notes, setNotes] = useState("");
  const [ePrescriptionStatus, setEPrescriptionStatus] = useState("NOT_SENT");
const [ePrescriptionNo, setEPrescriptionNo] = useState("");
const [medulaTrackingNo, setMedulaTrackingNo] = useState("");
const [doctorIdentityNumber, setDoctorIdentityNumber] = useState("");
const [doctorDiplomaNo, setDoctorDiplomaNo] = useState("");
const [medulaResponse, setMedulaResponse] = useState("");
  const [items, setItems] = useState<PrescriptionItem[]>([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const updateItem = <K extends keyof PrescriptionItem>(
    index: number,
    field: K,
    value: PrescriptionItem[K]
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

async function loadPrescription(id: string) {
  try {
    const res = await fetch(`/api/admin/health-prescriptions/${id}`, {
      cache: "no-store",
      credentials: "include",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json.error || "Reçete yüklenemedi.");
      return;
    }

    const p = json.prescription;

    setDiagnosisCode(p.diagnosis_code || "");
    setDiagnosisName(p.diagnosis_name || "");
    setNotes(p.notes || "");

    if (Array.isArray(p.health_prescription_items)) {
      setItems(
        p.health_prescription_items.map((x: any) => ({
          medicineName: x.medicine_name || "",
          activeIngredient: x.active_ingredient || "",
          dosage: x.dosage || "",
          usageType: x.usage_type || "",
          duration: x.duration || "",
          morning: x.morning || false,
          noon: x.noon || false,
          evening: x.evening || false,
          night: x.night || false,
          beforeMeal: x.before_meal || false,
          afterMeal: x.after_meal || false,
          notes: x.notes || "",
        }))
      );
    }
  } catch {
    alert("Reçete yüklenemedi.");
  }
}

  const savePrescription = async () => {
    try {
      setSaving(true);
      setMessage("");

      const res = await fetch("/api/admin/health-prescriptions", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employee.id,
          companyId: employee.company_id,
          diagnosisCode,
          diagnosisName,
          notes,
          status: "draft",
ePrescriptionStatus,
ePrescriptionNo,
medulaTrackingNo,
doctorIdentityNumber,
doctorDiplomaNo,
medulaResponse,
items,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(json?.error || "Reçete kaydedilemedi.");
        return;
      }

      setMessage("Reçete başarıyla kaydedildi.");
    } catch {
      setMessage("Reçete kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={cardStyle}>
        <h2 style={titleStyle}>E-Reçete Workspace</h2>

        <p style={mutedStyle}>
          Çalışan için tanı, ilaç ve kullanım bilgilerini girerek reçete kaydı
          oluşturabilirsiniz.
        </p>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Çalışan Bilgileri</h3>

        <div style={infoGridStyle}>
          <Info label="Ad Soyad" value={employee.full_name} />
          <Info label="Firma" value={employee.company_name || "-"} />
          <Info label="Görev" value={employee.job_title || "-"} />
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Tanı Bilgisi</h3>

        <div style={formGridStyle}>
          <Field label="ICD-10 Kodu">
            <input
              value={diagnosisCode}
              onChange={(e) => setDiagnosisCode(e.target.value)}
              placeholder="Örn: M54.5"
              style={inputStyle}
            />
          </Field>

          <Field label="Tanı Adı">
            <input
              value={diagnosisName}
              onChange={(e) => setDiagnosisName(e.target.value)}
              placeholder="Örn: Bel ağrısı"
              style={inputStyle}
            />
          </Field>
        </div>
      </section>

<section style={cardStyle}>
  <h3 style={sectionTitleStyle}>e-Reçete / MEDULA Bilgileri</h3>

  <div style={formGridStyle}>
    <Field label="e-Reçete Durumu">
      <select
        value={ePrescriptionStatus}
        onChange={(e) => setEPrescriptionStatus(e.target.value)}
        style={inputStyle}
      >
        <option value="NOT_SENT">Gönderilmedi</option>
        <option value="READY">e-Reçeteye Hazır</option>
        <option value="SENT">e-Reçete Gönderildi</option>
        <option value="ERROR">e-Reçete Hatalı</option>
        <option value="CANCELLED">İptal</option>
      </select>
    </Field>

    <Field label="e-Reçete No">
      <input value={ePrescriptionNo} onChange={(e) => setEPrescriptionNo(e.target.value)} style={inputStyle} />
    </Field>

    <Field label="MEDULA Takip No">
      <input value={medulaTrackingNo} onChange={(e) => setMedulaTrackingNo(e.target.value)} style={inputStyle} />
    </Field>

    <Field label="Hekim T.C.">
      <input value={doctorIdentityNumber} onChange={(e) => setDoctorIdentityNumber(e.target.value)} style={inputStyle} />
    </Field>

    <Field label="Hekim Diploma No">
      <input value={doctorDiplomaNo} onChange={(e) => setDoctorDiplomaNo(e.target.value)} style={inputStyle} />
    </Field>
  </div>

  <Field label="MEDULA Yanıt / Gönderim Notu">
    <textarea
      value={medulaResponse}
      onChange={(e) => setMedulaResponse(e.target.value)}
      style={textareaStyle}
    />
  </Field>
</section>

      <section style={cardStyle}>
        <div style={headerRowStyle}>
          <h3 style={sectionTitleStyle}>Reçete İlaçları</h3>

          <button type="button" onClick={addItem} style={secondaryButtonStyle}>
            + İlaç Ekle
          </button>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {items.map((item, index) => (
            <div key={index} style={medicineCardStyle}>
              <div style={headerRowStyle}>
                <strong>İlaç #{index + 1}</strong>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    style={dangerButtonStyle}
                  >
                    Kaldır
                  </button>
                )}
              </div>

              <div style={formGridStyle}>
                <Field label="İlaç Adı">
                  <input
                    value={item.medicineName}
                    onChange={(e) =>
                      updateItem(index, "medicineName", e.target.value)
                    }
                    placeholder="İlaç adı"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Etkin Madde">
                  <input
                    value={item.activeIngredient}
                    onChange={(e) =>
                      updateItem(index, "activeIngredient", e.target.value)
                    }
                    placeholder="Etkin madde"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Doz">
                  <input
                    value={item.dosage}
                    onChange={(e) =>
                      updateItem(index, "dosage", e.target.value)
                    }
                    placeholder="Örn: 500 mg"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Kullanım Şekli">
                  <input
                    value={item.usageType}
                    onChange={(e) =>
                      updateItem(index, "usageType", e.target.value)
                    }
                    placeholder="Örn: Ağızdan"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Süre">
                  <input
                    value={item.duration}
                    onChange={(e) =>
                      updateItem(index, "duration", e.target.value)
                    }
                    placeholder="Örn: 5 gün"
                    style={inputStyle}
                  />
                </Field>
              </div>

              <div style={checkboxGridStyle}>
                <Check label="Sabah" checked={item.morning} onChange={(v) => updateItem(index, "morning", v)} />
                <Check label="Öğle" checked={item.noon} onChange={(v) => updateItem(index, "noon", v)} />
                <Check label="Akşam" checked={item.evening} onChange={(v) => updateItem(index, "evening", v)} />
                <Check label="Gece" checked={item.night} onChange={(v) => updateItem(index, "night", v)} />
                <Check label="Aç" checked={item.beforeMeal} onChange={(v) => updateItem(index, "beforeMeal", v)} />
                <Check label="Tok" checked={item.afterMeal} onChange={(v) => updateItem(index, "afterMeal", v)} />
              </div>

              <Field label="İlaç Notu">
                <textarea
                  value={item.notes}
                  onChange={(e) => updateItem(index, "notes", e.target.value)}
                  placeholder="İlaçla ilgili açıklama"
                  style={textareaStyle}
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Hekim Notu</h3>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reçete genel notu..."
          style={textareaStyle}
        />
      </section>

      <section style={previewCardStyle}>
        <div>
          <strong>Reçete Önizleme</strong>
          <p style={{ ...mutedStyle, marginTop: 6 }}>
            {items.filter((x) => x.medicineName.trim()).length} ilaç eklendi.
          </p>
        </div>

        <button
          type="button"
          onClick={savePrescription}
          disabled={saving}
          style={primaryButtonStyle}
        >
          {saving ? "Kaydediliyor..." : "Reçeteyi Kaydet"}
        </button>
      </section>

      {message && (
        <div
          style={{
            padding: 14,
            borderRadius: 14,
            background: message.includes("başarı") ? "#f0fdf4" : "#fef2f2",
            color: message.includes("başarı") ? "#15803d" : "#b91c1c",
            fontWeight: 800,
          }}
        >
          {message}
        </div>
      )}
    <PrescriptionHistory
  employeeId={employee.id}
  onSelect={loadPrescription}
/>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={smallLabelStyle}>{label}</div>
      <div style={{ fontWeight: 900 }}>{value}</div>
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

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label style={checkStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 22,
};

const titleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 10,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 16,
};

const mutedStyle: React.CSSProperties = {
  color: "#64748b",
  lineHeight: 1.6,
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 16,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
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
  minHeight: 90,
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

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const medicineCardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 18,
  background: "#f8fafc",
  display: "grid",
  gap: 16,
};

const checkboxGridStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const checkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
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

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: 14,
  padding: "10px 14px",
  background: "#fff1f2",
  color: "#991b1b",
  fontWeight: 900,
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: 12,
  padding: "8px 12px",
  background: "#fef2f2",
  color: "#b91c1c",
  fontWeight: 900,
  cursor: "pointer",
};

const previewCardStyle: React.CSSProperties = {
  ...cardStyle,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
};