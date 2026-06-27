"use client";

import { CSSProperties } from "react";

export type SftModel = {
  testDate: string;

  fvc: string;
  fev1: string;
  fev1fvc: string;
  pef: string;
  fef2575: string;

  result: "Normal" | "Obstrüktif" | "Restriktif" | "Takip Gerekli" | "";

  doctorNote: string;
};

type Props = {
  value: SftModel;
  onChange: (value: SftModel) => void;
};

function setField(
  model: SftModel,
  onChange: (v: SftModel) => void,
  key: keyof SftModel,
  value: string
) {
  onChange({
    ...model,
    [key]: value,
  });
}

export default function SftSection({
  value,
  onChange,
}: Props) {
  return (
    <section style={card}>

      <h2 style={title}>
        SOLUNUM FONKSİYON TESTİ (SFT)
      </h2>

      <div style={grid}>

        <Field label="Test Tarihi">

          <input
            type="date"
            value={value.testDate}
            onChange={(e) =>
              setField(
                value,
                onChange,
                "testDate",
                e.target.value
              )
            }
            style={input}
          />

        </Field>

        <Field label="Sonuç">

          <select
            value={value.result}
            onChange={(e) =>
              setField(
                value,
                onChange,
                "result",
                e.target.value as SftModel["result"]
              )
            }
            style={input}
          >
            <option value="">Seçiniz</option>
            <option>Normal</option>
            <option>Obstrüktif</option>
            <option>Restriktif</option>
            <option>Takip Gerekli</option>
          </select>

        </Field>

      </div>

      <table style={table}>

        <thead>

          <tr>

            <th style={th}>Parametre</th>
            <th style={th}>Değer</th>

          </tr>

        </thead>

        <tbody>

          <Parameter
            title="FVC"
            value={value.fvc}
            onChange={(v) =>
              setField(value, onChange, "fvc", v)
            }
          />

          <Parameter
            title="FEV1"
            value={value.fev1}
            onChange={(v) =>
              setField(value, onChange, "fev1", v)
            }
          />

          <Parameter
            title="FEV1 / FVC"
            value={value.fev1fvc}
            onChange={(v) =>
              setField(value, onChange, "fev1fvc", v)
            }
          />

          <Parameter
            title="PEF"
            value={value.pef}
            onChange={(v) =>
              setField(value, onChange, "pef", v)
            }
          />

          <Parameter
            title="FEF25-75"
            value={value.fef2575}
            onChange={(v) =>
              setField(value, onChange, "fef2575", v)
            }
          />

        </tbody>

      </table>

      <Field label="Hekim Değerlendirmesi">

        <textarea
          value={value.doctorNote}
          onChange={(e) =>
            setField(
              value,
              onChange,
              "doctorNote",
              e.target.value
            )
          }
          style={textarea}
          placeholder="SFT değerlendirmesi..."
        />

      </Field>

    </section>
  );
}

function Parameter({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <tr>

      <td style={tdTitle}>
        {title}
      </td>

      <td style={td}>

        <input
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          style={cellInput}
          placeholder="%"
        />

      </td>

    </tr>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={field}>

      <span style={labelStyle}>
        {label}
      </span>

      {children}

    </label>
  );
}

const card: CSSProperties = {
  background: "#fff",
  border: "1px solid #d1d5db",
  borderRadius: 18,
  padding: 24,
  display: "grid",
  gap: 18,
};

const title: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 900,
};

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(220px,1fr))",
  gap: 14,
};

const field: CSSProperties = {
  display: "grid",
  gap: 6,
};

const labelStyle: CSSProperties = {
  color: "#64748b",
  fontWeight: 900,
  fontSize: 13,
};

const input: CSSProperties = {
  height: 44,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: "0 12px",
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const th: CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  padding: 10,
  fontWeight: 900,
};

const tdTitle: CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  padding: 10,
  fontWeight: 900,
};

const td: CSSProperties = {
  border: "1px solid #cbd5e1",
  padding: 8,
};

const cellInput: CSSProperties = {
  width: "100%",
  height: 38,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 10px",
};

const textarea: CSSProperties = {
  minHeight: 120,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: 10,
  resize: "vertical",
};