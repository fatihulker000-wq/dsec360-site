"use client";

export default function EmployeeIntegrationStatus({
  loading,
  error,
  warnings,
  onRetry,
}: {
  loading: boolean;
  error?: string;
  warnings?: string[];
  onRetry?(): void;
}) {
  if (loading) {
    return (
      <div style={panel("#eff6ff", "#1d4ed8")}>
        Çalışan modül verileri yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div style={panel("#fee2e2", "#b91c1c")}>
        <div style={{ fontWeight: 900 }}>
          Entegrasyon verileri alınamadı
        </div>

        <div style={{ marginTop: 5 }}>
          {error}
        </div>

        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            style={{
              marginTop: 10,
              border: "none",
              borderRadius: 10,
              padding: "8px 12px",
              background: "#b91c1c",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Yeniden Dene
          </button>
        ) : null}
      </div>
    );
  }

  if (warnings?.length) {
    return (
      <div style={panel("#fef3c7", "#92400e")}>
        <div style={{ fontWeight: 900 }}>
          Bazı modül verileri henüz bağlı değil
        </div>

        <div style={{ marginTop: 6 }}>
          {warnings.join(" • ")}
        </div>
      </div>
    );
  }

  return null;
}

function panel(
  background: string,
  color: string
): React.CSSProperties {
  return {
    padding: 14,
    borderRadius: 14,
    background,
    color,
    fontSize: 13,
    fontWeight: 750,
  };
}
