"use client";

import { IbysIncidentRecord } from "./types";

interface Props {
  items: IbysIncidentRecord[];

  onOpen?(item: IbysIncidentRecord): void;

  onPrepare?(item: IbysIncidentRecord): void;

  onMarkSent?(item: IbysIncidentRecord): void;
}

export default function IbysIncidentTable({
  items,
  onOpen,
  onPrepare,
  onMarkSent,
}: Props) {
  return (
    <section
      style={{
        padding: 22,
        borderRadius: 20,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3
        style={{
          margin: "0 0 18px",
          fontSize: 22,
          fontWeight: 950,
        }}
      >
        İBYS Hazırlık Kayıtları
      </h3>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            minWidth: 1050,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <Head>Olay No</Head>
              <Head>Çalışan</Head>
              <Head>Firma</Head>
              <Head>Tür</Head>
              <Head>Tarih</Head>
              <Head>Şiddet</Head>
              <Head>Eksik</Head>
              <Head>Durum</Head>
              <Head>İşlem</Head>
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
                  İBYS hazırlık kaydı bulunamadı.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.incidentId}>
                  <Cell>{item.incidentNo}</Cell>

                  <Cell>
                    <strong>
                      {item.employeeName || "-"}
                    </strong>

                    <div
                      style={{
                        marginTop: 4,
                        color: "#64748b",
                        fontSize: 11,
                      }}
                    >
                      {item.employeeTcNo || "T.C. yok"}
                    </div>
                  </Cell>

                  <Cell>{item.companyName}</Cell>

                  <Cell>{item.incidentType}</Cell>

                  <Cell>
                    {formatDate(item.incidentDate)}
                  </Cell>

                  <Cell>{item.severity}</Cell>

                  <Cell>
                    {item.missingFields.length}
                  </Cell>

                  <Cell>
                    <StatusBadge
                      status={item.status}
                    />
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

                      {item.status !== "SENT" &&
                        item.status !==
                          "NOT_REQUIRED" && (
                          <button
                            type="button"
                            disabled={
                              item.status ===
                              "MISSING_INFORMATION"
                            }
                            onClick={() =>
                              onPrepare?.(item)
                            }
                            style={{
                              ...primaryButton,
                              opacity:
                                item.status ===
                                "MISSING_INFORMATION"
                                  ? 0.45
                                  : 1,
                            }}
                          >
                            Hazırla
                          </button>
                        )}

                      {item.status === "READY" && (
                        <button
                          type="button"
                          onClick={() =>
                            onMarkSent?.(item)
                          }
                          style={sentButton}
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

function Head({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      style={{
        padding: 12,
        textAlign: "left",
        color: "#64748b",
        background: "#f8fafc",
        borderBottom: "1px solid #e5e7eb",
        fontSize: 12,
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
      {status}
    </span>
  );
}

function statusBackground(status: string) {
  switch (status) {
    case "READY":
      return "#dcfce7";

    case "SENT":
      return "#dbeafe";

    case "FAILED":
      return "#fee2e2";

    case "MISSING_INFORMATION":
      return "#fef3c7";

    default:
      return "#f1f5f9";
  }
}

function statusColor(status: string) {
  switch (status) {
    case "READY":
      return "#166534";

    case "SENT":
      return "#1d4ed8";

    case "FAILED":
      return "#b91c1c";

    case "MISSING_INFORMATION":
      return "#92400e";

    default:
      return "#475569";
  }
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("tr-TR");
}

const primaryButton: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  padding: "9px 12px",
  background: "#16a34a",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const sentButton: React.CSSProperties = {
  ...primaryButton,
  background: "#2563eb",
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