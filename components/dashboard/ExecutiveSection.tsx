"use client";

import { BRAND, cardStyle, softPanelStyle } from "./styles";
import  StatusDonut  from "./StatusDonut";
import type { ExecutiveSummary } from "./types";

type Props = {
  isMobile: boolean;
  adminRole: string;
  adminCompanyId: string;
  companies: string[];
  selectedCompany: string;
  setSelectedCompany: (value: string) => void;
  filteredRiskUsers: unknown[];
  ceoSummary: ExecutiveSummary;
  summary: {
    completed_count?: number;
    total_assignments?: number;
    in_progress_count?: number;
    not_started_count?: number;
  } | null;
  totals: {
    completed: number;
    assigned: number;
    inProgress: number;
    notStarted: number;
  };
};

export default function ExecutiveSection({
  isMobile,
  adminRole,
  adminCompanyId,
  companies,
  selectedCompany,
  setSelectedCompany,
  filteredRiskUsers,
  ceoSummary,
  summary,
  totals,
}: Props) {
  return (
    <>
      <div
        style={{
          ...cardStyle(),
          marginBottom: 20,
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "minmax(0,1.3fr) minmax(280px,0.7fr)",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: BRAND.text,
            }}
          >
            CEO Executive Özeti
          </div>

          <div
            style={{
              marginTop: 8,
              color: BRAND.muted,
              lineHeight: 1.8,
            }}
          >
            {ceoSummary.executiveRiskScore >= 70
              ? "Operasyonel risk yükselmiş görünüyor."
              : ceoSummary.executiveRiskScore >= 40
              ? "Sistem kontrol altında ancak dikkat gerektiriyor."
              : "Kurumsal görünüm sağlıklı."}
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit,minmax(180px,1fr))",
              gap: 12,
            }}
          >
            <StatusDonut
              label="Tamamlanan"
              value={summary?.completed_count ?? totals.completed}
              total={summary?.total_assignments ?? totals.assigned}
              color={BRAND.green}
              softBg={BRAND.greenSoft}
            />

            <StatusDonut
              label="Devam Eden"
              value={summary?.in_progress_count ?? totals.inProgress}
              total={summary?.total_assignments ?? totals.assigned}
              color={BRAND.blue}
              softBg={BRAND.blueSoft}
            />

            <StatusDonut
              label="Başlamayan"
              value={summary?.not_started_count ?? totals.notStarted}
              total={summary?.total_assignments ?? totals.assigned}
              color={BRAND.amber}
              softBg={BRAND.amberSoft}
            />
          </div>
        </div>

        <div
          style={{
            ...softPanelStyle("#fafafa"),
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              fontWeight: 900,
              color: BRAND.text,
            }}
          >
            Firma Filtresi
          </div>

          {adminRole === "company_admin" ? (
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                background: "#fff",
                fontWeight: 700,
              }}
            >
              {adminCompanyId}
            </div>
          ) : (
            <select
              value={selectedCompany}
              onChange={(e) =>
                setSelectedCompany(e.target.value)
              }
              style={{
                padding: 12,
                borderRadius: 12,
              }}
            >
              <option value="all">
                Tüm Firmalar
              </option>

              {companies.map((company) => (
                <option
                  key={company}
                  value={company}
                >
                  {company}
                </option>
              ))}
            </select>
          )}

          <div style={softPanelStyle(BRAND.redSoft)}>
            <div
              style={{
                fontSize: 12,
                color: BRAND.muted,
              }}
            >
              Seçili Firmada Riskli
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 24,
                fontWeight: 900,
                color: BRAND.red,
              }}
            >
              {filteredRiskUsers.length}
            </div>
          </div>
        </div>
      </div>

      <section
        style={{
          ...cardStyle(isMobile),
          marginTop: 20,
          background:
            ceoSummary.executiveRiskScore >= 70
              ? "linear-gradient(135deg,#7f1d1d,#b91c1c)"
              : ceoSummary.executiveRiskScore >= 40
              ? "linear-gradient(135deg,#92400e,#d97706)"
              : "linear-gradient(135deg,#166534,#16a34a)",
          color: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              CEO ALARM PANELİ
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 28,
                fontWeight: 900,
              }}
            >
              {ceoSummary.healthLabel === "Kritik"
                ? "Üst yönetim müdahalesi önerilir"
                : ceoSummary.healthLabel === "Dikkat"
                ? "Yakın takip önerilir"
                : "Operasyon dengeli"}
            </div>
          </div>

          <div
            style={{
              padding: "12px 16px",
              borderRadius: 16,
              background:
                "rgba(255,255,255,.15)",
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            Skor: {ceoSummary.executiveRiskScore}
          </div>
        </div>
      </section>
    </>
  );
}