"use client";

import { useMemo } from "react";

import { InvestigationReport as InvestigationReportType } from "./types";
import { FiveWhyEngine } from "./FiveWhyEngine";
import { FishboneEngine } from "./FishboneEngine";
import { RootCauseEngine } from "./RootCauseEngine";

interface Props {
  report: InvestigationReportType;
  companyName?: string;
  incidentTitle?: string;
  incidentNo?: string;
}

export default function InvestigationReport({
  report,
  companyName = "D-SEC Firma",
  incidentTitle = "Kaza / Olay Soruşturması",
  incidentNo = "-",
}: Props) {
  const fiveWhy = useMemo(
    () => FiveWhyEngine.analyze(report.fiveWhy),
    [report.fiveWhy]
  );

  const fishbone = useMemo(
    () => FishboneEngine.analyze(report.fishbone),
    [report.fishbone]
  );

  const rootCause = useMemo(
    () => RootCauseEngine.analyze(report.rootCauses),
    [report.rootCauses]
  );

  const completedActions = report.actions.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  const actionCompletionRate =
    report.actions.length === 0
      ? 0
      : Math.round(
          (completedActions / report.actions.length) * 100
        );

  const investigationScore = Math.round(
    (
      fiveWhy.score +
      fishbone.score +
      rootCause.score +
      actionCompletionRate
    ) / 4
  );

  const printReport = () => {
    window.print();
  };

  return (
    <section
      id="investigation-report"
      style={{
        display: "grid",
        gap: 22,
        padding: 24,
        background: "#f8fafc",
        borderRadius: 22,
      }}
    >
      <header
        style={{
          padding: 26,
          borderRadius: 22,
          background:
            "linear-gradient(135deg,#4a0d1a 0%,#7a0017 55%,#b91c1c 100%)",
          color: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 1,
                opacity: 0.85,
              }}
            >
              D-SEC INVESTIGATION REPORT
            </div>

            <h1
              style={{
                margin: "10px 0 0",
                fontSize: 32,
                fontWeight: 950,
              }}
            >
              {incidentTitle}
            </h1>

            <div
              style={{
                marginTop: 12,
                opacity: 0.9,
                lineHeight: 1.7,
              }}
            >
              Firma: {companyName}
              <br />
              Olay No: {incidentNo}
              <br />
              Soruşturma No: {report.investigationNo}
            </div>
          </div>

          <div
            style={{
              minWidth: 180,
              padding: 20,
              borderRadius: 18,
              background: "rgba(255,255,255,.12)",
              border: "1px solid rgba(255,255,255,.2)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                opacity: 0.85,
              }}
            >
              SORUŞTURMA SKORU
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 48,
                fontWeight: 950,
              }}
            >
              {investigationScore}
            </div>

            <div
              style={{
                marginTop: 4,
                fontWeight: 800,
              }}
            >
              {getScoreLabel(investigationScore)}
            </div>
          </div>
        </div>
      </header>

      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={printReport}
          style={buttonStyle}
        >
          PDF / Yazdır
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 14,
        }}
      >
        <Kpi title="Durum" value={report.status} />
        <Kpi title="Öncelik" value={report.priority} />
        <Kpi title="Şiddet" value={report.severity} />
        <Kpi title="Araştırmacı" value={report.investigator || "-"} />
        <Kpi title="5 Why" value={`${fiveWhy.score}/100`} />
        <Kpi title="Fishbone" value={`${fishbone.score}/100`} />
        <Kpi title="Kök Neden" value={`${rootCause.score}/100`} />
        <Kpi
          title="DÖF Tamamlama"
          value={`%${actionCompletionRate}`}
        />
      </div>

      <ReportSection title="1. Yönetici Özeti">
        <InfoRow
          label="Başlangıç Tarihi"
          value={formatDate(report.startedAt)}
        />
        <InfoRow
          label="Tamamlanma Tarihi"
          value={formatDate(report.completedAt)}
        />
        <InfoRow
          label="Özet"
          value={report.summary || "-"}
        />
        <InfoRow
          label="Bulgular"
          value={report.findings || "-"}
        />
        <InfoRow
          label="Öneriler"
          value={report.recommendations || "-"}
        />
      </ReportSection>

      <ReportSection title="2. Soruşturma Ekibi ve Kişiler">
        {report.people.length === 0 ? (
          <EmptyText />
        ) : (
          <SimpleTable
            headers={[
              "Ad Soyad",
              "Görev",
              "Departman",
              "Rol",
            ]}
            rows={report.people.map((item) => [
              item.fullName,
              item.title,
              item.department,
              item.role,
            ])}
          />
        )}
      </ReportSection>

      <ReportSection title="3. Tanık Görüşmeleri">
        {report.interviews.length === 0 ? (
          <EmptyText />
        ) : (
          <SimpleTable
            headers={[
              "Görüşülen Kişi",
              "Tarih",
              "Görüşmeyi Yapan",
              "Özet",
            ]}
            rows={report.interviews.map((item) => [
              getPersonName(report, item.personId),
              formatDate(item.interviewDate),
              item.interviewer,
              item.summary,
            ])}
          />
        )}
      </ReportSection>

      <ReportSection title="4. 5 Why Analizi">
        <SimpleTable
          headers={["Seviye", "Soru", "Cevap"]}
          rows={report.fiveWhy.map((item) => [
            String(item.level),
            item.question,
            item.answer || "-",
          ])}
        />

        <AnalysisBox
          title="5 Why Sonucu"
          score={fiveWhy.score}
          text={
            fiveWhy.rootCause ||
            "Henüz kök neden belirlenmedi."
          }
        />
      </ReportSection>

      <ReportSection title="5. Fishbone Analizi">
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 14,
          }}
        >
          {report.fishbone.map((category) => (
            <div
              key={category.title}
              style={{
                padding: 16,
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
              }}
            >
              <strong>{category.title}</strong>

              {category.causes.length === 0 ? (
                <div
                  style={{
                    marginTop: 10,
                    color: "#94a3b8",
                  }}
                >
                  Neden eklenmemiş.
                </div>
              ) : (
                <ul
                  style={{
                    margin: "10px 0 0",
                    paddingLeft: 20,
                    lineHeight: 1.8,
                  }}
                >
                  {category.causes.map((cause, index) => (
                    <li key={`${category.title}-${index}`}>
                      {cause}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <AnalysisBox
          title="En Güçlü Kategori"
          score={fishbone.score}
          text={fishbone.strongestCategory}
        />
      </ReportSection>

      <ReportSection title="6. Kök Neden Analizi">
        {rootCause.selectedRootCauses.length === 0 ? (
          <EmptyText />
        ) : (
          <SimpleTable
            headers={[
              "Kök Neden",
              "Kategori",
              "Olasılık",
            ]}
            rows={rootCause.selectedRootCauses.map((item) => [
              item.title,
              item.category,
              `%${item.probability}`,
            ])}
          />
        )}

        <AnalysisBox
          title="Birincil Kök Neden"
          score={rootCause.score}
          text={
            rootCause.primaryRootCause?.title ||
            "Birincil kök neden seçilmedi."
          }
        />
      </ReportSection>

      <ReportSection title="7. Deliller">
        {report.evidences.length === 0 ? (
          <EmptyText />
        ) : (
          <SimpleTable
            headers={[
              "Dosya",
              "Tür",
              "Ekleyen",
              "Tarih",
            ]}
            rows={report.evidences.map((item) => [
              item.fileName,
              item.type,
              item.uploadedBy,
              formatDate(item.uploadedAt),
            ])}
          />
        )}
      </ReportSection>

      <ReportSection title="8. DÖF ve Aksiyonlar">
        {report.actions.length === 0 ? (
          <EmptyText />
        ) : (
          <SimpleTable
            headers={[
              "Aksiyon",
              "Sorumlu",
              "Termin",
              "Durum",
            ]}
            rows={report.actions.map((item) => [
              item.title,
              item.responsible,
              formatDate(item.dueDate),
              item.status,
            ])}
          />
        )}
      </ReportSection>

      <ReportSection title="9. DORA AI Değerlendirmesi">
        <div
          style={{
            padding: 18,
            borderRadius: 16,
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e3a8a",
            lineHeight: 1.8,
          }}
        >
          <strong>
            Genel soruşturma skoru: {investigationScore}/100
          </strong>

          <p style={{ marginBottom: 0 }}>
            5 Why, Fishbone, kök neden ve DÖF süreçleri
            birlikte değerlendirilmiştir. Eksik veya düşük
            puanlı alanlar tamamlanmadan soruşturmanın
            kapatılmaması önerilir.
          </p>
        </div>
      </ReportSection>

      <ReportSection title="10. Onay ve İmzalar">
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 18,
          }}
        >
          <SignatureBox title="Soruşturmayı Yürüten" />
          <SignatureBox title="İSG Uzmanı" />
          <SignatureBox title="Bölüm Yöneticisi" />
          <SignatureBox title="İşveren / Vekili" />
        </div>
      </ReportSection>

      <footer
        style={{
          paddingTop: 18,
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          color: "#64748b",
          fontSize: 12,
        }}
      >
        <strong>D-SEC Kaza ve Olay Yönetimi</strong>

        <span>
          Rapor tarihi:{" "}
          {new Date().toLocaleString("tr-TR")}
        </span>
      </footer>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          #investigation-report {
            padding: 0 !important;
            background: white !important;
          }

          section,
          article,
          table {
            break-inside: avoid;
          }
        }
      `}</style>
    </section>
  );
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article
      style={{
        padding: 22,
        borderRadius: 18,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <h2
        style={{
          margin: "0 0 18px",
          fontSize: 20,
          fontWeight: 900,
          color: "#111827",
        }}
      >
        {title}
      </h2>

      {children}
    </article>
  );
}

function Kpi({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 14,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#64748b",
          fontWeight: 800,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 20,
          fontWeight: 900,
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 16,
        padding: "11px 0",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      <strong>{label}</strong>

      <div
        style={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.7,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function AnalysisBox({
  title,
  score,
  text,
}: {
  title: string;
  score: number;
  text: string;
}) {
  return (
    <div
      style={{
        marginTop: 18,
        padding: 16,
        borderRadius: 14,
        background: "#fff7ed",
        border: "1px solid #fed7aa",
      }}
    >
      <strong>
        {title} — {score}/100
      </strong>

      <div
        style={{
          marginTop: 8,
          lineHeight: 1.7,
          color: "#7c2d12",
        }}
      >
        {text || "-"}
      </div>
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 650,
        }}
      >
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                style={{
                  textAlign: "left",
                  padding: 12,
                  background: "#f8fafc",
                  color: "#475569",
                  fontSize: 12,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  style={{
                    padding: 12,
                    borderBottom: "1px solid #f1f5f9",
                    verticalAlign: "top",
                    lineHeight: 1.6,
                  }}
                >
                  {cell || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SignatureBox({ title }: { title: string }) {
  return (
    <div
      style={{
        minHeight: 130,
        padding: 16,
        borderRadius: 14,
        border: "1px dashed #94a3b8",
        background: "#f8fafc",
      }}
    >
      <strong>{title}</strong>

      <div
        style={{
          marginTop: 70,
          paddingTop: 8,
          borderTop: "1px solid #cbd5e1",
          color: "#64748b",
          fontSize: 12,
        }}
      >
        Ad Soyad / İmza / Tarih
      </div>
    </div>
  );
}

function EmptyText() {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 14,
        background: "#f8fafc",
        color: "#64748b",
      }}
    >
      Kayıt bulunmuyor.
    </div>
  );
}

function getPersonName(
  report: InvestigationReportType,
  personId: string
) {
  return (
    report.people.find((person) => person.id === personId)
      ?.fullName || "-"
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("tr-TR");
}

function getScoreLabel(score: number) {
  if (score >= 90) {
    return "Mükemmel";
  }

  if (score >= 75) {
    return "İyi";
  }

  if (score >= 50) {
    return "Geliştirilmeli";
  }

  return "Yetersiz";
}

const buttonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "11px 18px",
  background: "#111827",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};