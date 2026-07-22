"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building,
} from "lucide-react";

import type { RiskRecord } from "../types";

type Props = {
  records: RiskRecord[];
  loading?: boolean;
  limit?: number;
  onSelectDepartment?: (
    department: string,
    records: RiskRecord[]
  ) => void;
};

type DepartmentStat = {
  department: string;
  total: number;
  critical: number;
  openDof: number;
  averageScore: number;
  records: RiskRecord[];
};

export default function DepartmentRiskChart({
  records,
  loading = false,
  limit = 10,
  onSelectDepartment,
}: Props) {
  const stats = useMemo<DepartmentStat[]>(() => {
    const map = new Map<string, RiskRecord[]>();

    records.forEach((record) => {
      const department =
        String(record.department || "").trim() ||
        "Departman belirtilmemiş";

      if (!map.has(department)) {
        map.set(department, []);
      }

      map.get(department)!.push(record);
    });

    return Array.from(map.entries())
      .map(([department, departmentRecords]) => ({
        department,
        total: departmentRecords.length,
        critical: departmentRecords.filter(
          (record) =>
            record.level === "VERY_HIGH" ||
            record.level === "INTOLERABLE"
        ).length,
        openDof: departmentRecords.filter(
          (record) => !record.completed
        ).length,
        averageScore:
          departmentRecords.length > 0
            ? Math.round(
                departmentRecords.reduce(
                  (sum, record) =>
                    sum + Number(record.score || 0),
                  0
                ) / departmentRecords.length
              )
            : 0,
        records: departmentRecords,
      }))
      .sort((a, b) => {
        if (b.critical !== a.critical) {
          return b.critical - a.critical;
        }

        if (b.averageScore !== a.averageScore) {
          return b.averageScore - a.averageScore;
        }

        return b.total - a.total;
      })
      .slice(0, limit);
  }, [records, limit]);

  const maximum = Math.max(
    ...stats.map((item) => item.total),
    1
  );

  return (
    <section
      style={{
        borderRadius: 22,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        overflow: "hidden",
        boxShadow:
          "0 14px 35px rgba(15,23,42,0.05)",
      }}
    >
      <header
        style={{
          padding: 18,
          borderBottom: "1px solid #eef2f7",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#0f172a",
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            <BarChart3 size={19} color="#2563eb" />
            Departman Bazlı Risk
          </div>

          <p
            style={{
              margin: "5px 0 0",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            Risk yoğunluğu, kritik risk ve açık DÖF
            karşılaştırması
          </p>
        </div>

        <span
          style={{
            borderRadius: 999,
            padding: "6px 10px",
            background: "#eff6ff",
            color: "#1d4ed8",
            border: "1px solid #bfdbfe",
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          {stats.length} departman
        </span>
      </header>

      {loading ? (
        <div
          style={{
            minHeight: 360,
            display: "grid",
            placeItems: "center",
            color: "#94a3b8",
          }}
        >
          Departman analizi yükleniyor...
        </div>
      ) : stats.length === 0 ? (
        <div
          style={{
            minHeight: 360,
            display: "grid",
            placeItems: "center",
            color: "#94a3b8",
            textAlign: "center",
            padding: 24,
          }}
        >
          <div>
            <AlertTriangle size={36} />
            <p style={{ margin: "10px 0 0" }}>
              Departman bazlı analiz için kayıt
              bulunmuyor.
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: 15,
            display: "grid",
            gap: 13,
          }}
        >
          {stats.map((item) => {
            const width = Math.max(
              4,
              (item.total / maximum) * 100
            );

            return (
              <button
                key={item.department}
                type="button"
                onClick={() =>
                  onSelectDepartment?.(
                    item.department,
                    item.records
                  )
                }
                style={{
                  border: 0,
                  background: "transparent",
                  padding: 0,
                  textAlign: "left",
                  cursor: "pointer",
                  display: "grid",
                  gap: 7,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      minWidth: 0,
                    }}
                  >
                    <Building
                      size={15}
                      color="#475569"
                    />

                    <strong
                      style={{
                        color: "#0f172a",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.department}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "flex-end",
                      gap: 6,
                      fontSize: 9,
                      fontWeight: 900,
                    }}
                  >
                    <span
                      style={{
                        borderRadius: 999,
                        padding: "4px 7px",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                      }}
                    >
                      {item.total} risk
                    </span>

                    <span
                      style={{
                        borderRadius: 999,
                        padding: "4px 7px",
                        background: "#fef2f2",
                        color: "#b91c1c",
                      }}
                    >
                      {item.critical} kritik
                    </span>

                    <span
                      style={{
                        borderRadius: 999,
                        padding: "4px 7px",
                        background: "#fffbeb",
                        color: "#92400e",
                      }}
                    >
                      {item.openDof} açık DÖF
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    height: 12,
                    borderRadius: 999,
                    background: "#e2e8f0",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${width}%`,
                      height: "100%",
                      borderRadius: 999,
                      background:
                        item.critical > 0
                          ? "linear-gradient(90deg,#f97316,#dc2626)"
                          : "linear-gradient(90deg,#3b82f6,#2563eb)",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#94a3b8",
                    fontSize: 10,
                  }}
                >
                  <span>
                    Ortalama skor:{" "}
                    <strong
                      style={{ color: "#475569" }}
                    >
                      {item.averageScore}
                    </strong>
                  </span>

                  <span>Detay için tıklayın</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}