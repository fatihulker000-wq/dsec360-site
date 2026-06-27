"use client";

import { CSSProperties } from "react";

export type AudiometryModel = {
  testDate: string;
  rightEar500: string;
  rightEar1000: string;
  rightEar2000: string;
  rightEar4000: string;
  leftEar500: string;
  leftEar1000: string;
  leftEar2000: string;
  leftEar4000: string;
  result: "Normal" | "Takip Gerekli" | "Patolojik" | "";
  note: string;
};

type Props = {
  value: AudiometryModel;
  onChange: (value: AudiometryModel) => void;
};

function update(
  value: AudiometryModel,
  onChange: (v: AudiometryModel) => void,
  key: keyof AudiometryModel,
  data: string
) {
  onChange({ ...value, [key]: data });
}

export default function AudiometrySection({ value, onChange }: Props) {
  return (
    <section style={card}>
      <h2 style={title}>ODYOMETRİ</h2>

      <div style={grid}>
        <Field label="Test Tarihi">
          <input
            type="date"
            value={value.testDate}
            onChange={(e) => update(value, onChange, "testDate", e.target.value)}
            style={input}
          />
        </Field>

        <Field label="Sonuç">
          <select
            value={value.result}
            onChange={(e) => update(value, onChange, "result", e.target.value as AudiometryModel["result"])}
            style={input}
          >
            <option value="">Seçiniz</option>
            <option>Normal</option>
            <option>Takip Gerekli</option>
            <option>Patolojik</option>
          </select>
        </Field>
      </div>

      <table style={table}>
        <thead>
          <tr>
            <th style={th}>Kulak</th>
            <th style={th}>500 Hz</th>
            <th style={th}>1000 Hz</th>
            <th style={th}>2000 Hz</th>
            <th style={th}>4000 Hz</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td style={tdTitle}>Sağ Kulak</td>
            <Cell value={value.rightEar500} onChange={(v) => update(value, onChange, "rightEar500", v)} />
            <Cell value={value.rightEar1000} onChange={(v) => update(value, onChange, "rightEar1000", v)} />
            <Cell value={value.rightEar2000} onChange={(v) => update(value, onChange, "rightEar2000", v)} />
            <Cell value={value.rightEar4000} onChange={(v) => update(value, onChange, "rightEar4000", v)} />
          </tr>

          <tr>
            <td style={tdTitle}>Sol Kulak</td>
            <Cell value={value.leftEar500} onChange={(v) => update(value, onChange, "leftEar500", v)} />
            <Cell value={value.leftEar1000} onChange={(v) => update(value, onChange, "leftEar1000", v)} />
            <Cell value={value.leftEar2000} onChange={(v) => update(value, onChange, "leftEar2000", v)} />
            <Cell value={value.leftEar4000} onChange={(v) => update(value, onChange, "leftEar4000", v)} />
          </tr>
        </tbody>
      </table>

      <Field label="Odyometri Değerlendirmesi">
        <textarea
          value={value.note}
          onChange={(e) => update(value, onChange, "note", e.target.value)}
          style={textarea}
          placeholder="İşitme kaybı, gürültü maruziyeti, takip veya ileri tetkik önerisi..."
        />
      </Field>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={field}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function Cell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <td style={td}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={cellInput}
        placeholder="dB"
      />
    </td>
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
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 14,
};

const field: CSSProperties = {
  display: "grid",
  gap: 6,
};

const labelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 13,
  fontWeight: 900,
};

const input: CSSProperties = {
  height: 44,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: "0 12px",
  fontWeight: 700,
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const th: CSSProperties = {
  border: "1px solid #94a3b8",
  background: "#f1f5f9",
  padding: 10,
  fontWeight: 900,
};

const tdTitle: CSSProperties = {
  border: "1px solid #cbd5e1",
  padding: 10,
  fontWeight: 900,
  background: "#f8fafc",
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
  minHeight: 110,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: 10,
  resize: "vertical",
};
