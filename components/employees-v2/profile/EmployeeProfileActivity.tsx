"use client";

import type {
  EmployeeProfileActivity as EmployeeProfileActivityItem,
} from "./types";

export default function EmployeeProfileActivity({
  items,
}: {
  items?: EmployeeProfileActivityItem[];
}) {
  const list = [...(items || [])].sort(
    (first, second) =>
      new Date(second.date).getTime() -
      new Date(first.date).getTime()
  );

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
        Faaliyet Geçmişi
      </h3>

      {list.length === 0 ? (
        <div
          style={{
            marginTop: 15,
            padding: 24,
            borderRadius: 14,
            background: "#f8fafc",
            color: "#64748b",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          Henüz faaliyet kaydı bulunmuyor.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 10,
            marginTop: 15,
          }}
        >
          {list.map((item) => (
            <article
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "135px minmax(0,1fr)",
                gap: 12,
                padding: 13,
                borderRadius: 14,
                background: "#f8fafc",
              }}
            >
              <div
                style={{
                  color: "#64748b",
                  fontSize: 11,
                  fontWeight: 850,
                }}
              >
                {formatDate(item.date)}
              </div>

              <div>
                <div
                  style={{
                    color: "#111827",
                    fontWeight: 950,
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
                    }}
                  >
                    {item.description}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("tr-TR");
}
