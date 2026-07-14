"use client";

import {
  Building2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

type FilterBarProps = {
  companies: string[];
  selectedCompany: string;
  onCompanyChange: (value: string) => void;

  searchValue: string;
  onSearchChange: (value: string) => void;

  companyLocked?: boolean;
};

export default function FilterBar({
  companies,
  selectedCompany,
  onCompanyChange,
  searchValue,
  onSearchChange,
  companyLocked = false,
}: FilterBarProps) {
  const clearFilters = () => {
    if (!companyLocked) {
      onCompanyChange("all");
    }

    onSearchChange("");
  };

  const hasActiveFilter =
    searchValue.trim().length > 0 ||
    (!companyLocked && selectedCompany !== "all");

  return (
    <section
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: 16,
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        background:
          "linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)",
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
      }}
      aria-label="Dashboard filtreleri"
    >
      <div
        style={{
          width: 42,
          height: 42,
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
          borderRadius: 14,
          color: "#b91c1c",
          background: "#fee2e2",
        }}
      >
        <SlidersHorizontal size={20} />
      </div>

      <div
        style={{
          position: "relative",
          flex: "1 1 300px",
          minWidth: 220,
        }}
      >
        <Search
          size={18}
          style={{
            position: "absolute",
            top: "50%",
            left: 14,
            color: "#94a3b8",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />

        <input
          type="search"
          value={searchValue}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Firma, çalışan, eğitim veya risk ara..."
          style={{
            width: "100%",
            minHeight: 44,
            padding: "0 42px 0 42px",
            border: "1px solid #dbe3ed",
            borderRadius: 13,
            outline: "none",
            background: "#ffffff",
            color: "#111827",
            fontSize: 14,
            fontWeight: 600,
          }}
        />

        {searchValue && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Arama metnini temizle"
            style={{
              position: "absolute",
              top: "50%",
              right: 10,
              width: 28,
              height: 28,
              display: "grid",
              placeItems: "center",
              border: 0,
              borderRadius: 9,
              background: "#f1f5f9",
              color: "#64748b",
              cursor: "pointer",
              transform: "translateY(-50%)",
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div
        style={{
          position: "relative",
          flex: "0 1 280px",
          minWidth: 220,
        }}
      >
        <Building2
          size={17}
          style={{
            position: "absolute",
            top: "50%",
            left: 14,
            zIndex: 1,
            color: "#64748b",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />

        <select
          value={selectedCompany}
          onChange={(event) =>
            onCompanyChange(event.target.value)
          }
          disabled={companyLocked}
          aria-label="Firma filtresi"
          style={{
            width: "100%",
            minHeight: 44,
            padding: "0 36px 0 40px",
            border: "1px solid #dbe3ed",
            borderRadius: 13,
            outline: "none",
            background: companyLocked ? "#f8fafc" : "#ffffff",
            color: "#111827",
            fontSize: 14,
            fontWeight: 700,
            cursor: companyLocked ? "not-allowed" : "pointer",
          }}
        >
          {!companyLocked && (
            <option value="all">Tüm firmalar</option>
          )}

          {companies.map((company) => (
            <option value={company} key={company}>
              {company}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={clearFilters}
          style={{
            minHeight: 42,
            padding: "0 14px",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            border: "1px solid #fecaca",
            borderRadius: 12,
            background: "#fff7f7",
            color: "#b91c1c",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          <X size={16} />
          Filtreleri temizle
        </button>
      )}
    </section>
  );
}