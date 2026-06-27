"use client";

import { CSSProperties } from "react";

export type VaccineItem = {
  id: string;
  name: string;
  date: string;
  nextDate: string;
  status: "Tam" | "Eksik" | "Süresi Dolmuş";
};

type Props = {
  vaccines: VaccineItem[];
  note: string;
  onVaccinesChange: (list: VaccineItem[]) => void;
  onNoteChange: (value: string) => void;
};

const vaccineList = [
  "Tetanoz",
  "Hepatit A",
  "Hepatit B",
  "Grip",
  "Covid-19",
  "Kuduz",
  "BCG",
  "Pnömokok",
];

export default function VaccinationSection({
  vaccines,
  note,
  onVaccinesChange,
  onNoteChange,
}: Props) {
  function update(
    index: number,
    key: keyof VaccineItem,
    value: string
  ) {
    const list = [...vaccines];
    list[index] = {
      ...list[index],
      [key]: value,
    };
    onVaccinesChange(list);
  }

  function addRow() {
    onVaccinesChange([
      ...vaccines,
      {
        id: crypto.randomUUID(),
        name: "",
        date: "",
        nextDate: "",
        status: "Eksik",
      },
    ]);
  }

  function removeRow(index: number) {
    const list = vaccines.filter((_, i) => i !== index);
    onVaccinesChange(list);
  }

  return (
    <section style={card}>

      <div style={header}>

        <h2 style={title}>
          AŞI TAKİBİ
        </h2>

        <button
          type="button"
          onClick={addRow}
          style={addButton}
        >
          + Aşı Ekle
        </button>

      </div>

      <table style={table}>

        <thead>

          <tr>

            <th style={th}>Aşı</th>
            <th style={th}>Uygulama Tarihi</th>
            <th style={th}>Sonraki Tarih</th>
            <th style={th}>Durum</th>
            <th style={th}></th>

          </tr>

        </thead>

        <tbody>

          {vaccines.map((item, index) => (

            <tr key={item.id}>

              <td style={td}>

                <select
                  value={item.name}
                  onChange={(e) =>
                    update(index, "name", e.target.value)
                  }
                  style={input}
                >

                  <option value="">
                    Seçiniz
                  </option>

                  {vaccineList.map((v) => (

                    <option
                      key={v}
                    >
                      {v}
                    </option>

                  ))}

                </select>

              </td>

              <td style={td}>

                <input
                  type="date"
                  value={item.date}
                  onChange={(e) =>
                    update(index, "date", e.target.value)
                  }
                  style={input}
                />

              </td>

              <td style={td}>

                <input
                  type="date"
                  value={item.nextDate}
                  onChange={(e) =>
                    update(index, "nextDate", e.target.value)
                  }
                  style={input}
                />

              </td>

              <td style={td}>

                <select
                  value={item.status}
                  onChange={(e) =>
                    update(index, "status", e.target.value)
                  }
                  style={input}
                >

                  <option>Tam</option>
                  <option>Eksik</option>
                  <option>Süresi Dolmuş</option>

                </select>

              </td>

              <td style={td}>

                <button
                  type="button"
                  onClick={() =>
                    removeRow(index)
                  }
                  style={deleteButton}
                >
                  Sil
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

      <label style={field}>

        <span style={label}>
          Hekim Notu
        </span>

        <textarea
          value={note}
          onChange={(e) =>
            onNoteChange(e.target.value)
          }
          style={textarea}
          placeholder="Aşı değerlendirmesi..."
        />

      </label>

    </section>
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

const header: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const title: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 900,
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const th: CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#f8fafc",
  padding: 10,
};

const td: CSSProperties = {
  border: "1px solid #cbd5e1",
  padding: 8,
};

const input: CSSProperties = {
  width: "100%",
  height: 40,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 10px",
};

const field: CSSProperties = {
  display: "grid",
  gap: 6,
};

const label: CSSProperties = {
  fontWeight: 900,
  color: "#475569",
};

const textarea: CSSProperties = {
  minHeight: 120,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: 10,
};

const addButton: CSSProperties = {
  border: "none",
  background: "#15803d",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 900,
};

const deleteButton: CSSProperties = {
  border: "none",
  background: "#dc2626",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 8,
  cursor: "pointer",
};