"use client";

import { IncidentRootCauseItem } from "./types";

type Props = {
  rootCauses: IncidentRootCauseItem[];
};

export default function IncidentRootCauseChart({
  rootCauses,
}: Props) {

  const max = Math.max(
    ...rootCauses.map((x) => x.total),
    1
  );

  const totalEvents =
    rootCauses.reduce(
      (sum, item) => sum + item.total,
      0
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
          marginBottom: 24,
        }}
      >

        <div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1,
              color: "#6b7280",
            }}
          >
            ROOT CAUSE ANALYSIS
          </div>

          <h3
            style={{
              marginTop: 6,
              fontSize: 24,
              fontWeight: 900,
              color: "#111827",
            }}
          >
            Kök Neden Analizi
          </h3>

        </div>

        <div
          style={{
            fontSize: 13,
            color: "#6b7280",
            fontWeight: 700,
          }}
        >
          Pareto Analizi
        </div>

      </div>

      <div
        style={{
          display: "grid",
          gap: 18,
        }}
      >

        {rootCauses.map((item) => {

          const percent =
            Math.round(
              (item.total / max) * 100
            );

          const ratio =
            Math.round(
              (item.total /
                Math.max(totalEvents, 1)) *
                100
            );

          return (

            <div
              key={item.rootCause}
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

                  {item.rootCause}

                </strong>

                <span>

                  {item.total} (%{ratio})

                </span>

              </div>

              <div
                style={{
                  height: 14,
                  borderRadius: 999,
                  overflow: "hidden",
                  background: "#eef2f7",
                }}
              >

                <div
                  style={{
                    width: `${percent}%`,
                    height: "100%",
                    borderRadius: 999,
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
          display: "grid",
          gridTemplateColumns:
            "repeat(3,1fr)",
          gap: 16,
        }}
      >

        <InfoCard
          title="En Büyük Neden"

          value={
            rootCauses[0]?.rootCause ??
            "-"
          }

        />

        <InfoCard
          title="Toplam Kategori"

          value={String(
            rootCauses.length
          )}

        />

        <InfoCard
          title="Toplam Olay"

          value={String(
            totalEvents
          )}

        />

      </div>

      <div
        style={{
          marginTop: 30,
          padding: 18,
          borderRadius: 16,
          background:
            "#fff7ed",
          border:
            "1px solid #fed7aa",
        }}
      >

        <div
          style={{
            fontWeight: 900,
            color: "#9a3412",
            marginBottom: 10,
          }}
        >
          🤖 DORA AI Değerlendirmesi
        </div>

        <div
          style={{
            lineHeight: 1.8,
            color: "#444",
          }}
        >
          En sık görülen kök nedenler
          öncelikli iyileştirme alanlarını
          göstermektedir.
          Bu kategoriler için
          eğitim planları,
          risk değerlendirmeleri,
          prosedür revizyonları,
          saha denetimleri
          ve DÖF süreçleri
          önceliklendirilmelidir.
        </div>

      </div>

    </section>

  );

}

function InfoCard({

  title,

  value,

}: {

  title: string;

  value: string;

}) {

  return (

    <div
      style={{
        background: "#f8fafc",
        borderRadius: 16,
        padding: 18,
      }}
    >

      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 24,
          fontWeight: 900,
        }}
      >
        {value}
      </div>

    </div>

  );

}