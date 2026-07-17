"use client";

import type {
  ReportPdfVerification,
} from "./types";

export default function ReportVerificationCard({
  verification,
}: {
  verification: ReportPdfVerification;
}) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(180px,1fr))",
        gap: 12,
        padding: 16,
        borderRadius: 18,
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
      }}
    >
      <Info
        label="Rapor No"
        value={
          verification.reportNo || "-"
        }
      />

      <Info
        label="Revizyon"
        value={
          verification.revisionNo || "-"
        }
      />

      <Info
        label="Doğrulama Kodu"
        value={
          verification.verificationCode ||
          "-"
        }
      />

      <Info
        label="Doğrulama Adresi"
        value={
          verification.verificationUrl ||
          "-"
        }
      />
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 13,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          color: "#64748b",
          fontSize: 10,
          fontWeight: 900,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 5,
          color: "#111827",
          fontSize: 12,
          fontWeight: 850,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}
