"use client";

export default function EmployeeBulkActions({
  selectedCount,
  loading,
  onActivate,
  onPassive,
  onDelete,
  onExportCsv,
  onClear,
}: {
  selectedCount: number;
  loading: boolean;
  onActivate(): void;
  onPassive(): void;
  onDelete(): void;
  onExportCsv(): void;
  onClear(): void;
}) {
  if (selectedCount === 0) {
    return (
      <div
        style={{
          padding: 14,
          borderRadius: 16,
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          color: "#64748b",
          fontWeight: 800,
        }}
      >
        Toplu işlem yapmak için çalışan seçin.
      </div>
    );
  }

  return (
    <section
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        padding: 14,
        borderRadius: 16,
        background: "#111827",
        color: "#fff",
      }}
    >
      <div style={{ fontWeight: 900 }}>
        {selectedCount} çalışan seçildi
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <ActionButton
          title="Aktif Yap"
          background="#166534"
          disabled={loading}
          onClick={onActivate}
        />

        <ActionButton
          title="Pasife Al"
          background="#b45309"
          disabled={loading}
          onClick={onPassive}
        />

        <ActionButton
          title="CSV İndir"
          background="#1d4ed8"
          disabled={loading}
          onClick={onExportCsv}
        />

        <ActionButton
          title="Kalıcı Sil"
          background="#b91c1c"
          disabled={loading}
          onClick={onDelete}
        />

        <ActionButton
          title="Seçimi Temizle"
          background="#475569"
          disabled={loading}
          onClick={onClear}
        />
      </div>
    </section>
  );
}

function ActionButton({
  title,
  background,
  disabled,
  onClick,
}: {
  title: string;
  background: string;
  disabled: boolean;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 10,
        padding: "9px 12px",
        background,
        color: "#fff",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {title}
    </button>
  );
}
