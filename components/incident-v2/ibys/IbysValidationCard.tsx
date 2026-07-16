"use client";

import {
  IbysIncidentRecord,
  IbysValidationResult,
} from "./types";

interface Props {
  item: IbysIncidentRecord;

  validation: IbysValidationResult;
}

export default function IbysValidationCard({
  item,
  validation,
}: Props) {
  return (
    <section
      style={{
        padding: 22,
        borderRadius: 20,
        background: "#fff",
        border: `1px solid ${
          validation.valid
            ? "#bbf7d0"
            : "#fed7aa"
        }`,
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
              color: "#64748b",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            İBYS VALIDATION
          </div>

          <h3
            style={{
              margin: "6px 0 0",
              fontSize: 22,
              fontWeight: 950,
            }}
          >
            {item.incidentNo} Uygunluk Kontrolü
          </h3>
        </div>

        <div
          style={{
            width: 82,
            height: 82,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            background:
              validation.valid
                ? "#16a34a"
                : validation.completionRate >= 70
                ? "#ca8a04"
                : "#dc2626",
            fontSize: 22,
            fontWeight: 950,
          }}
        >
          %{validation.completionRate}
        </div>
      </div>

      {!validation.required ? (
        <Message
          color="#475569"
          background="#f1f5f9"
        >
          Bu olay türü için İBYS hazırlığı zorunlu
          görünmüyor.
        </Message>
      ) : validation.valid ? (
        <Message
          color="#166534"
          background="#f0fdf4"
        >
          Zorunlu alanlar tamamlandı. Kayıt İBYS
          veri paketi hazırlığına uygun.
        </Message>
      ) : (
        <Message
          color="#9a3412"
          background="#fff7ed"
        >
          Eksik zorunlu alanlar tamamlanmadan veri
          paketi hazırlanamaz.
        </Message>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
          marginTop: 18,
        }}
      >
        <ListCard
          title="Eksik Alanlar"
          items={validation.missingFields}
          emptyText="Eksik zorunlu alan yok."
          color="#dc2626"
        />

        <ListCard
          title="Uyarılar"
          items={validation.warnings}
          emptyText="Süreç uyarısı yok."
          color="#ca8a04"
        />
      </div>
    </section>
  );
}

function Message({
  children,
  color,
  background,
}: {
  children: React.ReactNode;

  color: string;

  background: string;
}) {
  return (
    <div
      style={{
        marginTop: 18,
        padding: 15,
        borderRadius: 14,
        color,
        background,
        fontWeight: 800,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}

function ListCard({
  title,
  items,
  emptyText,
  color,
}: {
  title: string;

  items: string[];

  emptyText: string;

  color: string;
}) {
  return (
    <article
      style={{
        padding: 17,
        borderRadius: 15,
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
      }}
    >
      <strong>{title}</strong>

      {items.length === 0 ? (
        <div
          style={{
            marginTop: 10,
            color: "#16a34a",
            fontWeight: 700,
          }}
        >
          {emptyText}
        </div>
      ) : (
        <ul
          style={{
            margin: "10px 0 0",
            paddingLeft: 19,
            color,
            lineHeight: 1.8,
          }}
        >
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </article>
  );
}