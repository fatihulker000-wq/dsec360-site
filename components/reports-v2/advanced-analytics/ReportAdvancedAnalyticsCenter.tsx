"use client";

import React from "react";

export interface ReportAdvancedAnalyticsCenterProps {
  input?: unknown;
}

export default function ReportAdvancedAnalyticsCenter({
  input,
}: ReportAdvancedAnalyticsCenterProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 24,
      }}
    >
      <h2
        style={{
          margin: 0,
          marginBottom: 16,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        Gelişmiş Analitik Merkezi
      </h2>

      <p
        style={{
          color: "#64748b",
          marginBottom: 24,
        }}
      >
        Şirket karşılaştırmaları, eğilim analizleri ve gelişmiş grafikler bu
        alanda görüntülenir.
      </p>

      <pre
        style={{
          background: "#f8fafc",
          borderRadius: 12,
          padding: 16,
          overflow: "auto",
          fontSize: 12,
        }}
      >
        {JSON.stringify(input, null, 2)}
      </pre>
    </div>
  );
}