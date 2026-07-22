"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Factory,
  FolderTree,
  ShieldAlert,
} from "lucide-react";

import type { RiskRecord } from "../types";
import {
  riskBackground,
  riskColor,
  riskLabel,
} from "../helpers";

type Props = {
  records: RiskRecord[];
  loading?: boolean;
  onSelect?: (record: RiskRecord) => void;
};

type TreeNode = {
  company: string;
  departments: Array<{
    department: string;
    processes: Array<{
      process: string;
      records: RiskRecord[];
    }>;
  }>;
};

function safeLabel(value: string | null | undefined, fallback: string) {
  const text = String(value || "").trim();
  return text || fallback;
}

export default function RiskTreeCard({
  records,
  loading = false,
  onSelect,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set()
  );

  const tree = useMemo<TreeNode[]>(() => {
    const companyMap = new Map<
      string,
      Map<string, Map<string, RiskRecord[]>>
    >();

    records.forEach((record) => {
      const company = safeLabel(
        record.company,
        "Firma belirtilmemiş"
      );

      const department = safeLabel(
        record.department,
        "Departman belirtilmemiş"
      );

      const process = safeLabel(
        record.process,
        "Süreç belirtilmemiş"
      );

      if (!companyMap.has(company)) {
        companyMap.set(company, new Map());
      }

      const departmentMap = companyMap.get(company)!;

      if (!departmentMap.has(department)) {
        departmentMap.set(department, new Map());
      }

      const processMap = departmentMap.get(department)!;

      if (!processMap.has(process)) {
        processMap.set(process, []);
      }

      processMap.get(process)!.push(record);
    });

    return Array.from(companyMap.entries())
      .map(([company, departmentMap]) => ({
        company,
        departments: Array.from(departmentMap.entries())
          .map(([department, processMap]) => ({
            department,
            processes: Array.from(processMap.entries())
              .map(([process, processRecords]) => ({
                process,
                records: [...processRecords].sort(
                  (a, b) =>
                    Number(b.score || 0) -
                    Number(a.score || 0)
                ),
              }))
              .sort((a, b) =>
                a.process.localeCompare(b.process, "tr")
              ),
          }))
          .sort((a, b) =>
            a.department.localeCompare(
              b.department,
              "tr"
            )
          ),
      }))
      .sort((a, b) =>
        a.company.localeCompare(b.company, "tr")
      );
  }, [records]);

  const toggle = (key: string) => {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

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
            <FolderTree size={19} color="#6b1020" />
            Risk Ağacı
          </div>

          <p
            style={{
              margin: "5px 0 0",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            Firma, departman ve süreç kırılımında
            risk envanteri
          </p>
        </div>

        <span
          style={{
            borderRadius: 999,
            padding: "6px 10px",
            background: "#fff1f2",
            color: "#6b1020",
            border: "1px solid #fecdd3",
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          {records.length} risk
        </span>
      </header>

      {loading ? (
        <div
          style={{
            minHeight: 320,
            display: "grid",
            placeItems: "center",
            color: "#94a3b8",
          }}
        >
          Risk ağacı yükleniyor...
        </div>
      ) : tree.length === 0 ? (
        <div
          style={{
            minHeight: 320,
            display: "grid",
            placeItems: "center",
            color: "#94a3b8",
            textAlign: "center",
            padding: 24,
          }}
        >
          Risk ağacında gösterilecek kayıt bulunmuyor.
        </div>
      ) : (
        <div
          style={{
            maxHeight: 520,
            overflowY: "auto",
            padding: 12,
          }}
        >
          {tree.map((companyNode) => {
            const companyKey = `company:${companyNode.company}`;
            const companyOpen = expanded.has(companyKey);

            const companyRiskCount =
              companyNode.departments.reduce(
                (sum, department) =>
                  sum +
                  department.processes.reduce(
                    (processSum, process) =>
                      processSum + process.records.length,
                    0
                  ),
                0
              );

            return (
              <div key={companyKey}>
                <button
                  type="button"
                  onClick={() => toggle(companyKey)}
                  style={{
                    width: "100%",
                    border: 0,
                    borderRadius: 13,
                    background: "#f8fafc",
                    padding: 11,
                    display: "grid",
                    gridTemplateColumns:
                      "22px 28px minmax(0, 1fr) auto",
                    gap: 8,
                    alignItems: "center",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "#0f172a",
                  }}
                >
                  {companyOpen ? (
                    <ChevronDown size={17} />
                  ) : (
                    <ChevronRight size={17} />
                  )}

                  <Building2 size={17} color="#6b1020" />

                  <strong>{companyNode.company}</strong>

                  <span
                    style={{
                      borderRadius: 999,
                      padding: "4px 8px",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    {companyRiskCount}
                  </span>
                </button>

                {companyOpen ? (
                  <div
                    style={{
                      marginLeft: 20,
                      paddingLeft: 13,
                      borderLeft: "2px solid #e2e8f0",
                    }}
                  >
                    {companyNode.departments.map(
                      (departmentNode) => {
                        const departmentKey =
                          `${companyKey}:department:${departmentNode.department}`;

                        const departmentOpen =
                          expanded.has(departmentKey);

                        const departmentCount =
                          departmentNode.processes.reduce(
                            (sum, process) =>
                              sum + process.records.length,
                            0
                          );

                        return (
                          <div
                            key={departmentKey}
                            style={{ marginTop: 8 }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                toggle(departmentKey)
                              }
                              style={{
                                width: "100%",
                                border: 0,
                                borderRadius: 11,
                                background: "#ffffff",
                                padding: 9,
                                display: "grid",
                                gridTemplateColumns:
                                  "20px 25px minmax(0, 1fr) auto",
                                gap: 7,
                                alignItems: "center",
                                textAlign: "left",
                                cursor: "pointer",
                                color: "#334155",
                              }}
                            >
                              {departmentOpen ? (
                                <ChevronDown size={15} />
                              ) : (
                                <ChevronRight size={15} />
                              )}

                              <Factory
                                size={15}
                                color="#475569"
                              />

                              <strong
                                style={{ fontSize: 12 }}
                              >
                                {departmentNode.department}
                              </strong>

                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 900,
                                  color: "#64748b",
                                }}
                              >
                                {departmentCount}
                              </span>
                            </button>

                            {departmentOpen ? (
                              <div
                                style={{
                                  marginLeft: 18,
                                  paddingLeft: 12,
                                  borderLeft:
                                    "1px solid #e2e8f0",
                                }}
                              >
                                {departmentNode.processes.map(
                                  (processNode) => {
                                    const processKey =
                                      `${departmentKey}:process:${processNode.process}`;

                                    const processOpen =
                                      expanded.has(processKey);

                                    return (
                                      <div
                                        key={processKey}
                                        style={{
                                          marginTop: 7,
                                        }}
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggle(processKey)
                                          }
                                          style={{
                                            width: "100%",
                                            border: 0,
                                            borderRadius: 10,
                                            background: "#f8fafc",
                                            padding: 8,
                                            display: "grid",
                                            gridTemplateColumns:
                                              "18px minmax(0, 1fr) auto",
                                            gap: 6,
                                            alignItems: "center",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            color: "#475569",
                                          }}
                                        >
                                          {processOpen ? (
                                            <ChevronDown
                                              size={14}
                                            />
                                          ) : (
                                            <ChevronRight
                                              size={14}
                                            />
                                          )}

                                          <span
                                            style={{
                                              fontSize: 11,
                                              fontWeight: 850,
                                            }}
                                          >
                                            {processNode.process}
                                          </span>

                                          <span
                                            style={{
                                              fontSize: 10,
                                              fontWeight: 900,
                                            }}
                                          >
                                            {
                                              processNode.records
                                                .length
                                            }
                                          </span>
                                        </button>

                                        {processOpen ? (
                                          <div
                                            style={{
                                              display: "grid",
                                              gap: 6,
                                              marginTop: 6,
                                              marginLeft: 14,
                                            }}
                                          >
                                            {processNode.records.map(
                                              (record) => (
                                                <button
                                                  key={record.id}
                                                  type="button"
                                                  onClick={() =>
                                                    onSelect?.(
                                                      record
                                                    )
                                                  }
                                                  style={{
                                                    borderRadius: 10,
                                                    border:
                                                      "1px solid #e5e7eb",
                                                    background:
                                                      "#ffffff",
                                                    padding: 9,
                                                    display: "grid",
                                                    gridTemplateColumns:
                                                      "25px minmax(0, 1fr) auto",
                                                    gap: 8,
                                                    alignItems:
                                                      "center",
                                                    textAlign:
                                                      "left",
                                                    cursor:
                                                      "pointer",
                                                  }}
                                                >
                                                  <ShieldAlert
                                                    size={15}
                                                    color={riskColor(
                                                      record.level
                                                    )}
                                                  />

                                                  <span>
                                                    <span
                                                      style={{
                                                        display:
                                                          "block",
                                                        color:
                                                          "#0f172a",
                                                        fontSize:
                                                          11,
                                                        fontWeight:
                                                          900,
                                                      }}
                                                    >
                                                      {record.activity ||
                                                        record.hazard}
                                                    </span>

                                                    <span
                                                      style={{
                                                        display:
                                                          "block",
                                                        marginTop: 3,
                                                        color:
                                                          "#94a3b8",
                                                        fontSize:
                                                          10,
                                                      }}
                                                    >
                                                      {record.hazard}
                                                    </span>
                                                  </span>

                                                  <span
                                                    style={{
                                                      borderRadius:
                                                        999,
                                                      padding:
                                                        "4px 7px",
                                                      background:
                                                        riskBackground(
                                                          record.level
                                                        ),
                                                      color:
                                                        riskColor(
                                                          record.level
                                                        ),
                                                      fontSize: 9,
                                                      fontWeight:
                                                        900,
                                                    }}
                                                  >
                                                    {record.score} ·{" "}
                                                    {riskLabel(
                                                      record.level
                                                    )}
                                                  </span>
                                                </button>
                                              )
                                            )}
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            ) : null}
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}