"use client";

import { InvestigationFile } from "./InvestigationTypes";

const row: React.CSSProperties = {
  display: "flex",
  gap: 12,
  padding: "14px 0",
  borderBottom: "1px solid #efefef",
};

const dot: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  background: "#d32f2f",
  marginTop: 6,
};

export default function InvestigationTimeline({
  file,
}: {
  file: InvestigationFile;
}) {
  const logs = [
    {
      title: "Soruşturma Dosyası Oluşturuldu",
      date: file.createdAt,
    },
    {
      title: "Son Güncelleme",
      date: file.updatedAt,
    },
  ];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 20,
        border: "1px solid #ececec",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 18,
          marginBottom: 20,
        }}
      >
        İşlem Geçmişi
      </div>

      {logs.map((log, i) => (
        <div key={i} style={row}>
          <div style={dot} />

          <div>
            <div
              style={{
                fontWeight: 600,
              }}
            >
              {log.title}
            </div>

            <div
              style={{
                color: "#777",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              {new Date(log.date).toLocaleString("tr-TR")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}