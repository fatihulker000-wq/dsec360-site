"use client";

import { SgkIncidentCheck } from "./types";

interface Props {
  items: SgkIncidentCheck[];
  onOpen?(item: SgkIncidentCheck): void;
  onMarkSent?(item: SgkIncidentCheck): void;
}

export default function SgkIncidentTable({
  items,
  onOpen,
  onMarkSent,
}: Props) {
  return (
    <section
      style={{
        padding: 22,
        borderRadius: 20,
        background: "#fff",
        border: "1px solid #e5e7eb",
        boxShadow:
          "0 10px 28px rgba(15,23,42,.05)",
      }}
    >
      <div
        style={{
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 1,
            color: "#64748b",
          }}
        >
          SGK INCIDENT LIST
        </div>

        <h3
          style={{
            margin: "6px 0 0",
            fontSize: 22,
            fontWeight: 950,
          }}
        >
          Bildirim Bekleyen Kayıtlar
        </h3>
      </div>

      <div
        style={{
          overflowX: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: 980,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <Header>Kaza No</Header>
              <Header>Çalışan</Header>
              <Header>Firma</Header>
              <Header>Kaza Tarihi</Header>
              <Header>Son Bildirim</Header>
              <Header>Kayıp Gün</Header>
              <Header>Durum</Header>
              <Header>Eksik Alan</Header>
              <Header>İşlem</Header>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: 30,
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  SGK bildirimi için kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.incidentId}>
                  <Cell>{item.incidentId}</Cell>

                  <Cell>
                    <strong>{item.employeeName || "-"}</strong>

                    <div
                      style={{
                        marginTop: 4,
                        color: "#64748b",
                        fontSize: 12,
                      }}
                    >
                      {item.tcNo || "T.C. bilgisi yok"}
                    </div>
                  </Cell>

                  <Cell>{item.companyName || "-"}</Cell>

                  <Cell>{formatDate(item.incidentDate)}</Cell>

                  <Cell>
                    {formatDate(item.notificationDeadline)}
                  </Cell>

                  <Cell>{item.lostDay}</Cell>

                  <Cell>
                    <StatusBadge status={item.status} />
                  </Cell>

                  <Cell>
                    {item.missingFields.length === 0 ? (
                      <span
                        style={{
                          color: "#16a34a",
                          fontWeight: 800,
                        }}
                      >
                        Eksik yok
                      </span>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        {item.missingFields.map((field) => (
                          <span
                            key={field}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 999,
                              background: "#fef3c7",
                              color: "#92400e",
                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    )}
                  </Cell>

                  <Cell>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onOpen?.(item)}
                        style={secondaryButton}
                      >
                        Aç
                      </button>

                      {item.status !== "SENT" && (
                        <button
                          type="button"
                          onClick={() => onMarkSent?.(item)}
                          disabled={
                            item.status ===
                              "MISSING_INFORMATION" ||
                            item.status === "NOT_REQUIRED"
                          }
                          style={{
                            ...primaryButton,
                            opacity:
                              item.status ===
                                "MISSING_INFORMATION" ||
                              item.status === "NOT_REQUIRED"
                                ? 0.5
                                : 1,
                            cursor:
                              item.status ===
                                "MISSING_INFORMATION" ||
                              item.status === "NOT_REQUIRED"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          Gönderildi İşaretle
                        </button>
                      )}
                    </div>
                  </Cell>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Header({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: 12,
        borderBottom: "1px solid #e5e7eb",
        color: "#64748b",
        fontSize: 12,
        fontWeight: 900,
        background: "#f8fafc",
      }}
    >
      {children}
    </th>
  );
}

function Cell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td
      style={{
        padding: 12,
        borderBottom: "1px solid #f1f5f9",
        verticalAlign: "top",
        fontSize: 13,
      }}
    >
      {children}
    </td>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        padding: "6px 10px",
        borderRadius: 999,
        background: statusBackground(status),
        color: statusColor(status),
        fontSize: 11,
        fontWeight: 900,
      }}
    >
      {statusLabel(status)}
    </span>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "READY":
      return "HAZIR";

    case "MISSING_INFORMATION":
      return "EKSİK BİLGİ";

    case "OVERDUE":
      return "SÜRESİ GEÇTİ";

    case "SENT":
      return "GÖNDERİLDİ";

    default:
      return "GEREKMİYOR";
  }
}

function statusBackground(status: string) {
  switch (status) {
    case "READY":
      return "#dcfce7";

    case "MISSING_INFORMATION":
      return "#fef3c7";

    case "OVERDUE":
      return "#fee2e2";

    case "SENT":
      return "#dbeafe";

    default:
      return "#f1f5f9";
  }
}

function statusColor(status: string) {
  switch (status) {
    case "READY":
      return "#166534";

    case "MISSING_INFORMATION":
      return "#92400e";

    case "OVERDUE":
      return "#b91c1c";

    case "SENT":
      return "#1d4ed8";

    default:
      return "#475569";
  }
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("tr-TR");
}

const primaryButton: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  padding: "9px 12px",
  background: "#166534",
  color: "#fff",
  fontWeight: 800,
};

const secondaryButton: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: "9px 12px",
  background: "#fff",
  color: "#111827",
  fontWeight: 800,
  cursor: "pointer",
};