"use client";

import { cardStyle, BRAND } from "../dashboard/styles";
import EmptyState from "../dashboard/EmptyState";
import {
  UpcomingHealthExam,
  RecentPrescription,
  RecentEk2,
  HealthAlert,
} from "./types";
import { formatHealthDate } from "./healthHelpers";

type Props = {
  isMobile: boolean;
  upcomingExams: UpcomingHealthExam[];
  recentPrescriptions: RecentPrescription[];
  recentEk2: RecentEk2[];
  alerts: HealthAlert[];
};

export default function HealthListsSection({
  isMobile,
  upcomingExams,
  recentPrescriptions,
  recentEk2,
  alerts,
}: Props) {
  return (
    <>
      {/* SATIR 1 */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 18,
          marginTop: 20,
        }}
      >
        {/* Yaklaşan Muayeneler */}

        <div style={cardStyle(isMobile)}>
          <h3 style={{ margin: 0, marginBottom: 18 }}>
            Yaklaşan Muayeneler
          </h3>

          {upcomingExams.length === 0 ? (
            <EmptyState text="Yaklaşan muayene bulunamadı." />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {upcomingExams.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: `1px solid ${BRAND.border}`,
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>
                    {item.employeeName}
                  </div>

                  <div
                    style={{
                      color: BRAND.muted,
                      marginTop: 4,
                      fontSize: 13,
                    }}
                  >
                    {item.companyName}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{item.examType}</span>

                    <strong>
                      {formatHealthDate(item.dueDate)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Son Reçeteler */}

        <div style={cardStyle(isMobile)}>
          <h3 style={{ margin: 0, marginBottom: 18 }}>
            Son Reçeteler
          </h3>

          {recentPrescriptions.length === 0 ? (
            <EmptyState text="Reçete bulunamadı." />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {recentPrescriptions.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: `1px solid ${BRAND.border}`,
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>
                    {item.employeeName}
                  </div>

                  <div
                    style={{
                      color: BRAND.muted,
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {item.companyName}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      {item.medicineCount} ilaç
                    </span>

                    <strong>
                      {formatHealthDate(item.createdAt)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SATIR 2 */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 18,
          marginTop: 20,
        }}
      >
        {/* Son EK2 */}

        <div style={cardStyle(isMobile)}>
          <h3 style={{ margin: 0, marginBottom: 18 }}>
            Son EK-2 Formları
          </h3>

          {recentEk2.length === 0 ? (
            <EmptyState text="EK-2 bulunamadı." />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {recentEk2.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: `1px solid ${BRAND.border}`,
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>
                    {item.employeeName}
                  </div>

                  <div
                    style={{
                      color: BRAND.muted,
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {item.companyName}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{item.decision}</span>

                    <strong>
                      {formatHealthDate(item.createdAt)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kritik Uyarılar */}

        <div style={cardStyle(isMobile)}>
          <h3 style={{ margin: 0, marginBottom: 18 }}>
            Kritik Sağlık Uyarıları
          </h3>

          {alerts.length === 0 ? (
            <EmptyState text="Uyarı bulunmuyor." />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {alerts.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderLeft: "5px solid #dc2626",
                    background: "#fff7f7",
                    borderRadius: 10,
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 900 }}>
                    {item.title}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      color: BRAND.muted,
                      fontSize: 13,
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}