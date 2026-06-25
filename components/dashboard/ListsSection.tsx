"use client";

import { BRAND, cardStyle, softPanelStyle } from "./styles";
import EmptyState from "./EmptyState";
import MiniBarChart from "./MiniBarChart";

type RiskUser = {
  user_id: string;
  full_name: string;
  email: string;
};

type Training = {
  title: string;
  completed_count: number;
  not_started_count: number;
};

type UpcomingTraining = {
  id: string;
  title: string;
  company: string;
  date: string;
};

type Props = {
  isMobile: boolean;
  aiComment: string;
  filteredRiskUsers: RiskUser[];
  filteredInProgressUsers: RiskUser[];
  filteredCompletedUsers: RiskUser[];
  groupedRiskCompanies: { name: string; count: number }[];
  groupedRiskTrainings: { name: string; count: number }[];
  topRiskTrainings: Training[];
  bestTrainings: Training[];
  topEmployees: { full_name: string; email: string; count: number }[];
  upcomingTrainings: UpcomingTraining[];
  upcomingInspections: {
    id: string;
    title: string;
    company: string;
    due_date: string;
  }[];
};

export default function ListsSection({
  isMobile,
  aiComment,
  filteredRiskUsers,
  filteredInProgressUsers,
  filteredCompletedUsers,
  groupedRiskCompanies,
  groupedRiskTrainings,
  topRiskTrainings,
  bestTrainings,
  topEmployees,
  upcomingTrainings,
  upcomingInspections,
}: Props) {
  return (
    <>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 18,
          marginTop: 20,
        }}
      >
        <div style={cardStyle(isMobile)}>
          <h3 style={{ margin: 0, marginBottom: 16, fontSize: 22, fontWeight: 900 }}>
            AI Yönetim Yorumu
          </h3>
          <div style={{ ...softPanelStyle("#fff7ed", isMobile), lineHeight: 1.8 }}>
            {aiComment}
          </div>
        </div>

<div style={cardStyle(isMobile)}>
  <h3 style={{ margin: 0, marginBottom: 16, fontSize: 22, fontWeight: 900 }}>
    Yaklaşan Eğitimler
  </h3>

  {upcomingTrainings.length === 0 ? (
    <EmptyState text="Yaklaşan eğitim bulunamadı." />
  ) : (
    <div style={{ display: "grid", gap: 12 }}>
      {upcomingTrainings.map((item) => (
        <div
          key={item.id}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: `1px solid ${BRAND.border}`,
            background: "#fff",
          }}
        >
          <div style={{ fontWeight: 900, color: BRAND.text }}>
            {item.title}
          </div>

          <div style={{ marginTop: 6, fontSize: 13, color: BRAND.muted }}>
            {item.company}
          </div>

          <div
            style={{
              marginTop: 8,
              display: "inline-flex",
              padding: "5px 9px",
              borderRadius: 999,
              background: "#eff6ff",
              color: BRAND.blue,
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {new Date(item.date).toLocaleDateString("tr-TR")}
          </div>
        </div>
      ))}
    </div>
  )}
</div>

<div style={cardStyle(isMobile)}>
  <h3 style={{ margin: 0, marginBottom: 16, fontSize: 22, fontWeight: 900 }}>
    Yaklaşan Denetimler
  </h3>

  {upcomingInspections.length === 0 ? (
    <EmptyState text="Yaklaşan denetim bulunamadı." />
  ) : (
    <div style={{ display: "grid", gap: 12 }}>
      {upcomingInspections.map((item) => (
        <div
          key={item.id}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: `1px solid ${BRAND.border}`,
            background: "#fff",
          }}
        >
          <div style={{ fontWeight: 900, color: BRAND.text }}>
            {item.title}
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: BRAND.muted,
            }}
          >
            {item.company}
          </div>

          <div
            style={{
              marginTop: 8,
              display: "inline-flex",
              padding: "5px 9px",
              borderRadius: 999,
              background: "#fff7ed",
              color: BRAND.amber,
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {new Date(item.due_date).toLocaleDateString("tr-TR")}
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        <div style={cardStyle(isMobile)}>
          <h3 style={{ margin: 0, marginBottom: 16, fontSize: 22, fontWeight: 900 }}>
            Riskli Firmalar
          </h3>
          {groupedRiskCompanies.length === 0 ? (
            <EmptyState text="Riskli firma bulunamadı." />
          ) : (
            <MiniBarChart
              items={groupedRiskCompanies.map((x) => ({
                label: x.name,
                value: x.count,
              }))}
              color={BRAND.red}
            />
          )}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 18,
          marginTop: 20,
        }}
      >
        <div style={cardStyle(isMobile)}>
          <h3 style={{ margin: 0, marginBottom: 16, fontSize: 22, fontWeight: 900 }}>
            Riskli Eğitimler
          </h3>
          {groupedRiskTrainings.length === 0 ? (
            <EmptyState text="Riskli eğitim bulunamadı." />
          ) : (
            <MiniBarChart
              items={groupedRiskTrainings.map((x) => ({
                label: x.name,
                value: x.count,
              }))}
              color={BRAND.amber}
            />
          )}
        </div>

        <div style={cardStyle(isMobile)}>
          <h3 style={{ margin: 0, marginBottom: 16, fontSize: 22, fontWeight: 900 }}>
            En Riskli Eğitimler
          </h3>
          {topRiskTrainings.length === 0 ? (
            <EmptyState text="Veri bulunamadı." />
          ) : (
            <MiniBarChart
              items={topRiskTrainings.map((x) => ({
                label: x.title,
                value: x.not_started_count,
              }))}
              color={BRAND.red}
            />
          )}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 18,
          marginTop: 20,
        }}
      >
        <div style={cardStyle(isMobile)}>
          <h3 style={{ margin: 0, marginBottom: 16, fontSize: 22, fontWeight: 900 }}>
            Başarılı Eğitimler
          </h3>
          {bestTrainings.length === 0 ? (
            <EmptyState text="Veri bulunamadı." />
          ) : (
            <MiniBarChart
              items={bestTrainings.map((x) => ({
                label: x.title,
                value: x.completed_count,
              }))}
              color={BRAND.green}
            />
          )}
        </div>

        <div style={cardStyle(isMobile)}>
          <h3 style={{ margin: 0, marginBottom: 16, fontSize: 22, fontWeight: 900 }}>
            En Riskli Çalışanlar
          </h3>

          {topEmployees.length === 0 ? (
            <EmptyState text="Riskli çalışan bulunamadı." />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {topEmployees.map((employee, index) => (
                <div
                  key={employee.email}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: `1px solid ${BRAND.border}`,
                    background: "#fff",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      {index + 1}. {employee.full_name}
                    </div>
                    <div style={{ fontSize: 13, color: BRAND.muted }}>
                      {employee.email}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: BRAND.redSoft,
                      color: BRAND.red,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: 20,
                    }}
                  >
                    {employee.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 16,
          marginTop: 20,
        }}
      >
        <div style={softPanelStyle("#fff1f1", isMobile)}>
          Riskli Kullanıcı
          <div style={{ fontSize: 30, fontWeight: 900, color: BRAND.red }}>
            {filteredRiskUsers.length}
          </div>
        </div>

        <div style={softPanelStyle("#eff6ff", isMobile)}>
          Devam Eden
          <div style={{ fontSize: 30, fontWeight: 900, color: BRAND.blue }}>
            {filteredInProgressUsers.length}
          </div>
        </div>

        <div style={softPanelStyle("#f0fdf4", isMobile)}>
          Tamamlanan
          <div style={{ fontSize: 30, fontWeight: 900, color: BRAND.green }}>
            {filteredCompletedUsers.length}
          </div>
        </div>
      </section>
    </>
  );
}