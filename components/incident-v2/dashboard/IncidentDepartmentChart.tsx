"use client";

import { IncidentDepartmentItem } from "./types";

type Props = {
  departments: IncidentDepartmentItem[];
};

export default function IncidentDepartmentChart({
  departments,
}: Props) {

  const max =
    Math.max(
      ...departments.map((d) => d.total),
      1
    );

  return (

    <section
      style={{
        background: "#fff",
        borderRadius: 22,
        padding: 22,
        border: "1px solid #e5e7eb",
        boxShadow:
          "0 10px 28px rgba(15,23,42,.05)",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
        }}
      >

        <div>

          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            DEPARTMENT ANALYSIS
          </div>

          <h3
            style={{
              marginTop: 6,
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            Departman Risk Analizi
          </h3>

        </div>

      </div>

      <div
        style={{
          display: "grid",
          gap: 18,
        }}
      >

        {departments.map((department) => {

          const percent =
            Math.round(
              (department.total / max) *
              100
            );

          return (

            <div
              key={department.department}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: 8,
                }}
              >

                <strong>

                  {department.department}

                </strong>

                <span>

                  {department.total}

                </span>

              </div>

              <div
                style={{
                  height: 12,
                  background: "#edf2f7",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >

                <div
                  style={{
                    width: `${percent}%`,
                    height: "100%",
                    background:
                      percent >= 80
                        ? "#dc2626"
                        : percent >= 60
                        ? "#ea580c"
                        : percent >= 40
                        ? "#ca8a04"
                        : "#16a34a",
                    transition: ".25s",
                  }}
                />

              </div>

            </div>

          );

        })}

      </div>

      <div
        style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop:
            "1px solid #e5e7eb",
        }}
      >

        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          AI Değerlendirmesi
        </div>

        <div
          style={{
            lineHeight: 1.8,
            fontSize: 14,
          }}
        >
          En fazla olay bildirimi bulunan
          departmanların süreçleri,
          risk değerlendirmeleri,
          eğitim kayıtları ve DÖF
          etkinlikleri öncelikli olarak
          gözden geçirilmelidir.
        </div>

      </div>

    </section>

  );

}