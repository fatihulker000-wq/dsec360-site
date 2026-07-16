"use client";

import type {
  EmployeeProfileModuleItem,
} from "./types";

export default function EmployeeProfileModulePanel({
  title,
  description,
  items,
  emptyText,
}: {
  title: string;
  description: string;
  items?: EmployeeProfileModuleItem[];
  emptyText?: string;
}) {
  const list = items || [];

  return (
    <section
      style={{
        padding: 20,
        borderRadius: 20,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 950,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: "8px 0 16px",
          color: "#64748b",
          lineHeight: 1.6,
          fontSize: 13,
        }}
      >
        {description}
      </p>

      {list.length === 0 ? (
        <div
          style={{
            padding: 24,
            borderRadius: 14,
            background: "#f8fafc",
            color: "#64748b",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          {emptyText ||
            "Bu bölüm için henüz bağlı kayıt bulunmuyor."}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          {list.map((item) => (
            <article
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(0,1fr) auto",
                gap: 12,
                padding: 14,
                borderRadius: 14,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 950,
                    color: "#111827",
                  }}
                >
                  {item.title}
                </div>

                {item.description ? (
                  <div
                    style={{
                      marginTop: 4,
                      color: "#64748b",
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.description}
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  textAlign: "right",
                  fontSize: 11,
                  color: "#64748b",
                  fontWeight: 800,
                }}
              >
                <div>{item.status || "-"}</div>
                <div style={{ marginTop: 4 }}>
                  {item.date || item.meta || ""}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
