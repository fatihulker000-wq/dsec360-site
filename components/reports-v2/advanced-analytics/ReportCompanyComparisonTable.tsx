"use client";

import React from "react";

export interface CompanyComparisonItem {
  company: string;
  score: number;
}

interface Props {
  companies?: CompanyComparisonItem[];
}

export default function ReportCompanyComparisonTable({
  companies = [],
}: Props) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 24,
      }}
    >
      <h2
        style={{
          margin: 0,
          marginBottom: 20,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        Firma Karşılaştırması
      </h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: 10,
              }}
            >
              Firma
            </th>

            <th
              style={{
                textAlign: "right",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: 10,
              }}
            >
              Skor
            </th>
          </tr>
        </thead>

        <tbody>
          {companies.map((item) => (
            <tr key={item.company}>
              <td
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {item.company}
              </td>

              <td
                style={{
                  textAlign: "right",
                  fontWeight: 700,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {item.score}
              </td>
            </tr>
          ))}

          {companies.length === 0 && (
            <tr>
              <td
                colSpan={2}
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                Karşılaştırma verisi bulunamadı.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}