"use client";

import { SgkIncidentCheck } from "./types";

interface Props {
  item: SgkIncidentCheck;
}

export default function SgkValidationCard({
  item,
}: Props) {
  const isReady =
    item.status === "READY" ||
    item.status === "SENT";

  return (
    <section
      style={{
        padding: 22,
        borderRadius: 20,
        background: "#fff",
        border: `1px solid ${
          isReady ? "#bbf7d0" : "#fed7aa"
        }`,
        boxShadow:
          "0 10px 28px rgba(15,23,42,.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1,
              color: "#64748b",
            }}
          >
            SGK VALIDATION
          </div>

          <h3
            style={{
              margin: "6px 0 0",
              fontSize: 22,
              fontWeight: 950,
            }}
          >
            Bildirim Uygunluk Kontrolü
          </h3>
        </div>

        <div
          style={{
            padding: "9px 14px",
            borderRadius: 999,
            background: isReady
              ? "#dcfce7"
              : "#fff7ed",
            color: isReady
              ? "#166534"
              : "#9a3412",
            fontWeight: 900,
          }}
        >
          {isReady
            ? "SGK BİLDİRİMİNE HAZIR"
            : "EKSİK BİLGİ VAR"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 12,
          marginTop: 20,
        }}
      >
        <Check
          title="Çalışan Ad Soyad"
          valid={Boolean(item.employeeName)}
        />

        <Check
          title="T.C. Kimlik No"
          valid={Boolean(item.tcNo)}
        />

        <Check
          title="Firma"
          valid={Boolean(item.companyName)}
        />

        <Check
          title="Kaza Tarihi"
          valid={Boolean(item.incidentDate)}
        />

        <Check
          title="Bildirim Son Tarihi"
          valid={Boolean(item.notificationDeadline)}
        />

        <Check
          title="Hastane Raporu"
          valid={item.hospitalReport}
          optional
        />
      </div>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 14,
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
        }}
      >
        <strong>Eksik Alanlar</strong>

        {item.missingFields.length === 0 ? (
          <div
            style={{
              marginTop: 10,
              color: "#166534",
              fontWeight: 800,
            }}
          >
            Eksik alan bulunmuyor.
          </div>
        ) : (
          <ul
            style={{
              margin: "10px 0 0",
              paddingLeft: 20,
              lineHeight: 1.8,
              color: "#9a3412",
            }}
          >
            {item.missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Check({
  title,
  valid,
  optional = false,
}: {
  title: string;
  valid: boolean;
  optional?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 14,
        borderRadius: 14,
        background: valid
          ? "#f0fdf4"
          : optional
          ? "#f8fafc"
          : "#fef2f2",
        border: `1px solid ${
          valid
            ? "#bbf7d0"
            : optional
            ? "#e2e8f0"
            : "#fecaca"
        }`,
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: valid
            ? "#16a34a"
            : optional
            ? "#94a3b8"
            : "#dc2626",
          color: "#fff",
          fontWeight: 900,
        }}
      >
        {valid ? "✓" : optional ? "i" : "×"}
      </div>

      <div>
        <div
          style={{
            fontWeight: 800,
          }}
        >
          {title}
        </div>

        {optional && (
          <div
            style={{
              marginTop: 3,
              color: "#64748b",
              fontSize: 11,
            }}
          >
            Duruma göre gerekli
          </div>
        )}
      </div>
    </div>
  );
}