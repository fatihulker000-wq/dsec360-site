"use client";

import type {
  AnalyticsCompanyComparison,
} from "./types";

export default function ReportCompanyComparisonTable({
  rows,
}: {
  rows: AnalyticsCompanyComparison[];
}) {
  return (
    <section
      style={{
        padding: 18,
        borderRadius: 20,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3
        style={{
          margin: "0 0 14px",
          fontSize: 20,
          fontWeight: 950,
        }}
      >
        Firma Karşılaştırması
      </h3>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            minWidth: 760,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              {[
                "Firma",
                "Çalışan",
                "Eğitim",
                "Denetim",
                "Risk",
                "Genel",
              ].map((head) => (
                <th
                  key={head}
                  style={thStyle}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.companyId}>
                <td style={tdStyle}>
                  {row.companyName}
                </td>
                <td style={tdStyle}>
                  {row.employeeCount}
                </td>
                <td style={tdStyle}>
                  {row.trainingScore}
                </td>
                <td style={tdStyle}>
                  {row.auditScore}
                </td>
                <td style={tdStyle}>
                  {row.riskScore}
                </td>
                <td style={tdStyle}>
                  <strong>
                    {row.overallScore}
                  </strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  background: "#f8fafc",
  borderBottom: "1px solid #e5e7eb",
};

const tdStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
};
