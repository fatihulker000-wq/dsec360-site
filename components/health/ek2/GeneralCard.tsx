"use client";

import type { HealthEmployee } from "../types";

import type { Ek2FormData } from "@/components/health/hooks/useEk2Form";

type Props = {
  employee: HealthEmployee;
  form: Ek2FormData;
  updateField: <K extends keyof Ek2FormData>(
    field: K,
    value: Ek2FormData[K]
  ) => void;
};
export default function GeneralCard({
  employee,
  form,
  updateField,
}: Props) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 24,
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: 22,
        }}
      >
        Genel Bilgiler
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 18,
        }}
      >
        <Field label="Ad Soyad" value={employee?.full_name} />

        <Field label="Firma" value={employee?.company_name} />

        <Field label="Görev" value={employee?.job_title} />

        <Field label="E-Posta" value={employee?.email} />

        <Field
          label="İşe Giriş Tarihi"
          value={employee?.start_date}
        />

        <Field label="Muayene Türü">
          <select
  style={inputStyle}
  value={form.examType}
  onChange={(e) =>
    updateField("examType", e.target.value)
  }
>
            <option>İşe Giriş</option>
            <option>Periyodik</option>
            <option>İş Değişikliği</option>
            <option>İşe Dönüş</option>
            <option>Kontrol Muayenesi</option>
          </select>
        </Field>

        <Field label="Muayene Tarihi">
          <input
  type="date"
  style={inputStyle}
  value={form.examDate}
  onChange={(e) =>
    updateField("examDate", e.target.value)
  }
/>
        </Field>

        <Field label="İşyeri Hekimi">
          <input
  placeholder="Hekim seçiniz..."
  style={inputStyle}
  value={form.doctorName}
  onChange={(e) =>
    updateField("doctorName", e.target.value)
  }
/>
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          color: "#64748b",
          marginBottom: 6,
          fontWeight: 700,
        }}
      >
        {label}
      </div>

      {children ? (
        children
      ) : (
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "12px 14px",
            minHeight: 46,
            display: "flex",
            alignItems: "center",
            fontWeight: 700,
          }}
        >
          {value || "-"}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  borderRadius: 12,
  border: "1px solid #d1d5db",
  padding: "0 12px",
  fontSize: 14,
  outline: "none",
};