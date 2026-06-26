"use client";

import { useEffect, useState } from "react";

export type MedicineItem = {
  id: string;
  medicine_name: string;
  active_ingredient?: string | null;
  strength?: string | null;
  form?: string | null;
  manufacturer?: string | null;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (medicine: MedicineItem) => void;
  placeholder?: string;
};

export default function MedicineAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "İlaç ara...",
}: Props) {
  const [results, setResults] = useState<MedicineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const keyword = value.trim();

    if (keyword.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/admin/medicine-search?q=${encodeURIComponent(keyword)}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setResults([]);
          setOpen(false);
          return;
        }

        setResults(json.medicines || []);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: 44,
          borderRadius: 12,
          border: "1px solid #d1d5db",
          padding: "0 12px",
          outline: "none",
        }}
      />

      {loading && (
        <div
          style={{
            position: "absolute",
            right: 12,
            top: 12,
            fontSize: 12,
            color: "#64748b",
          }}
        >
          Aranıyor...
        </div>
      )}

      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            marginTop: 6,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            boxShadow: "0 12px 24px rgba(0,0,0,.08)",
            maxHeight: 280,
            overflowY: "auto",
            zIndex: 50,
          }}
        >
          {results.length === 0 ? (
            <div
              style={{
                padding: 16,
                color: "#64748b",
                textAlign: "center",
              }}
            >
              Sonuç bulunamadı.
            </div>
          ) : (
            results.map((medicine) => (
              <button
                key={medicine.id}
                type="button"
                onClick={() => {
                  onSelect(medicine);
                  onChange(medicine.medicine_name);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  border: "none",
                  background: "#fff",
                  textAlign: "left",
                  padding: 14,
                  cursor: "pointer",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div style={{ fontWeight: 800 }}>
                  {medicine.medicine_name}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    marginTop: 4,
                  }}
                >
                  {medicine.active_ingredient || "-"}
                  {medicine.strength ? ` • ${medicine.strength}` : ""}
                  {medicine.form ? ` • ${medicine.form}` : ""}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}