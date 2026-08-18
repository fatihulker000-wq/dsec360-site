"use client";

import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileSearch,
  FileText,
  Loader2,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Employee = {
  id: string;
  full_name: string;
  department?: string | null;
  job_title?: string | null;
  email?: string | null;
  registry_no?: string | null;
  active: boolean;
};

type AssignmentRow = {
  id: string;
  document_id: string;
  document_title: string;
  document_type: string;
  version_no: number;
  employee_id: string;
  employee_full_name: string;
  employee_email?: string | null;
  department?: string | null;
  job_title?: string | null;
  assigned_at: string;
  due_at?: string | null;
  effective_status: string;
  first_opened_at?: string | null;
  active_read_seconds: number;
  acknowledgement_at?: string | null;
  acknowledgement_code?: string | null;
};

type Props = {
  firmId: string;
};

type StatusFilter =
  | "ALL"
  | "UNOPENED"
  | "OPENED"
  | "READING"
  | "READ"
  | "ACKNOWLEDGED"
  | "OVERDUE";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatSeconds(value?: number | null) {
  const total = Math.max(0, Math.floor(Number(value || 0)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return `${hours} sa${minutes ? ` ${minutes} dk` : ""}${seconds ? ` ${seconds} sn` : ""}`;
  }

  if (minutes > 0) {
    return `${minutes} dk${seconds ? ` ${seconds} sn` : ""}`;
  }

  return `${seconds} sn`;
}

function normalizeStatus(value?: string | null) {
  return String(value || "").trim().toUpperCase();
}

function isUnopened(value?: string | null) {
  const status = normalizeStatus(value);
  return !status || status === "ASSIGNED" || status === "SENT";
}

function statusLabel(value?: string | null) {
  switch (normalizeStatus(value)) {
    case "ACKNOWLEDGED":
      return "Onaylandı";
    case "READ":
      return "Okundu";
    case "READING":
      return "Okunuyor";
    case "OPENED":
      return "Açıldı";
    case "OVERDUE":
      return "Gecikti";
    case "SENT":
      return "Gönderildi";
    case "CANCELLED":
      return "İptal";
    default:
      return "Atandı";
  }
}

function statusStyle(value?: string | null) {
  const status = normalizeStatus(value);

  if (status === "ACKNOWLEDGED" || status === "READ") {
    return {
      color: "#166534",
      background: "#f0fdf4",
      border: "#bbf7d0",
    };
  }

  if (status === "OVERDUE") {
    return {
      color: "#b91c1c",
      background: "#fef2f2",
      border: "#fecaca",
    };
  }

  if (status === "OPENED" || status === "READING") {
    return {
      color: "#1d4ed8",
      background: "#eff6ff",
      border: "#bfdbfe",
    };
  }

  return {
    color: "#92400e",
    background: "#fffbeb",
    border: "#fde68a",
  };
}

export default function EmployeeDocumentEmployeeCards({ firmId }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!firmId) {
      setEmployees([]);
      setAssignments([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [employeeResponse, assignmentResponse] = await Promise.all([
        fetch(`/api/admin/employees?firmId=${encodeURIComponent(firmId)}`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(
          `/api/admin/employee-document-assignments?firmId=${encodeURIComponent(firmId)}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        ),
      ]);

      const employeeJson = await employeeResponse.json().catch(() => ({}));
      const assignmentJson = await assignmentResponse.json().catch(() => ({}));

      if (!employeeResponse.ok) {
        throw new Error(employeeJson?.error || "Çalışanlar alınamadı.");
      }

      if (!assignmentResponse.ok) {
        throw new Error(
          assignmentJson?.detail ||
            assignmentJson?.error ||
            "Belge atamaları alınamadı."
        );
      }

      const employeeRows: Employee[] = Array.isArray(employeeJson?.data)
        ? employeeJson.data
            .map((item: Employee) => ({
              id: String(item.id || "").trim(),
              full_name: String(item.full_name || "").trim(),
              department: item.department ? String(item.department) : null,
              job_title: item.job_title ? String(item.job_title) : null,
              email: item.email ? String(item.email) : null,
              registry_no: item.registry_no ? String(item.registry_no) : null,
              active: item.active !== false,
            }))
            .filter((item: Employee) => item.id && item.full_name && item.active)
        : [];

      const assignmentRows: AssignmentRow[] = Array.isArray(assignmentJson?.data)
        ? assignmentJson.data.map((item: AssignmentRow) => ({
            ...item,
            id: String(item.id || ""),
            document_id: String(item.document_id || ""),
            document_title: String(item.document_title || "Belge"),
            document_type: String(item.document_type || ""),
            version_no: Number(item.version_no || 1),
            employee_id: String(item.employee_id || ""),
            employee_full_name: String(item.employee_full_name || ""),
            active_read_seconds: Number(item.active_read_seconds || 0),
            effective_status: String(item.effective_status || "ASSIGNED"),
          }))
        : [];

      setEmployees(employeeRows);
      setAssignments(assignmentRows.filter((item) => item.employee_id));
    } catch (cause) {
      setEmployees([]);
      setAssignments([]);
      setError(
        cause instanceof Error
          ? cause.message
          : "Çalışan belge kartları yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    setExpandedEmployeeId(null);
    void load();
  }, [load]);

  const cards = useMemo(() => {
    const byEmployee = new Map<string, AssignmentRow[]>();

    assignments.forEach((row) => {
      const list = byEmployee.get(row.employee_id) || [];
      list.push(row);
      byEmployee.set(row.employee_id, list);
    });

    return employees
      .map((employee) => {
        const rows = (byEmployee.get(employee.id) || []).sort(
          (a, b) =>
            new Date(b.assigned_at).getTime() -
            new Date(a.assigned_at).getTime()
        );

        const total = rows.length;
        const unopened = rows.filter((row) => isUnopened(row.effective_status)).length;
        const opened = rows.filter(
          (row) => normalizeStatus(row.effective_status) === "OPENED"
        ).length;
        const reading = rows.filter(
          (row) => normalizeStatus(row.effective_status) === "READING"
        ).length;
        const read = rows.filter(
          (row) => normalizeStatus(row.effective_status) === "READ"
        ).length;
        const acknowledged = rows.filter(
          (row) => normalizeStatus(row.effective_status) === "ACKNOWLEDGED"
        ).length;
        const overdue = rows.filter(
          (row) => normalizeStatus(row.effective_status) === "OVERDUE"
        ).length;

        const completed = read + acknowledged;
        const completionRate =
          total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          employee,
          rows,
          total,
          unopened,
          opened,
          reading,
          read,
          acknowledged,
          overdue,
          completed,
          completionRate,
        };
      })
      .sort((a, b) =>
        a.employee.full_name.localeCompare(b.employee.full_name, "tr")
      );
  }, [employees, assignments]);

  const filteredCards = useMemo(() => {
    const search = searchText.trim().toLocaleLowerCase("tr-TR");

    return cards.filter((card) => {
      if (search) {
        const text = [
          card.employee.full_name,
          card.employee.email || "",
          card.employee.department || "",
          card.employee.job_title || "",
          card.employee.registry_no || "",
        ]
          .join(" ")
          .toLocaleLowerCase("tr-TR");

        if (!text.includes(search)) return false;
      }

      if (statusFilter === "ALL") return true;

      return card.rows.some((row) => {
        const status = normalizeStatus(row.effective_status);

        if (statusFilter === "UNOPENED") {
          return isUnopened(status);
        }

        return status === statusFilter;
      });
    });
  }, [cards, searchText, statusFilter]);

  const summary = useMemo(
    () => ({
      totalEmployees: cards.length,
      assignedEmployees: cards.filter((card) => card.total > 0).length,
      totalAssignments: assignments.length,
      unopened: assignments.filter((row) => isUnopened(row.effective_status)).length,
      readOrApproved: assignments.filter((row) =>
        ["READ", "ACKNOWLEDGED"].includes(
          normalizeStatus(row.effective_status)
        )
      ).length,
      overdue: assignments.filter(
        (row) => normalizeStatus(row.effective_status) === "OVERDUE"
      ).length,
    }),
    [cards, assignments]
  );

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Kişi Bazlı Belge Görünümü</div>
          <h2 style={titleStyle}>Çalışan Kartları</h2>
          <p style={subtitleStyle}>
            Her çalışana atanmış belgeleri; açılma, okuma, aktif okuma süresi,
            onay ve gecikme durumlarıyla tek kart altında görüntüleyin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          style={secondaryButton}
        >
          {loading ? <Loader2 size={16} /> : <Users size={16} />}
          Yenile
        </button>
      </div>

      {error ? (
        <div style={errorBox}>
          <AlertTriangle size={17} />
          {error}
        </div>
      ) : null}

      <div className="employeeCardSummaryGrid" style={summaryGrid}>
        <SummaryBox label="Toplam Çalışan" value={summary.totalEmployees} icon={<Users size={18} />} />
        <SummaryBox label="Belge Atanan" value={summary.assignedEmployees} icon={<UserRound size={18} />} />
        <SummaryBox label="Toplam Atama" value={summary.totalAssignments} icon={<FileText size={18} />} />
        <SummaryBox label="Açılmadı" value={summary.unopened} icon={<Clock3 size={18} />} />
        <SummaryBox label="Okundu / Onaylandı" value={summary.readOrApproved} icon={<CheckCircle2 size={18} />} />
        <SummaryBox label="Geciken" value={summary.overdue} icon={<AlertTriangle size={18} />} />
      </div>

      <div className="employeeCardFilters" style={filterGrid}>
        <label style={filterBox}>
          <Search size={16} />
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Çalışan, birim, görev, e-posta veya sicil ara..."
            style={inputReset}
          />
        </label>

        <label style={filterBox}>
          <BookOpenCheck size={16} />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            style={inputReset}
          >
            <option value="ALL">Tüm belge durumları</option>
            <option value="UNOPENED">Açılmamış belgesi olanlar</option>
            <option value="OPENED">Açılmış belgesi olanlar</option>
            <option value="READING">Okunuyor</option>
            <option value="READ">Okunmuş belgesi olanlar</option>
            <option value="ACKNOWLEDGED">Onaylanmış belgesi olanlar</option>
            <option value="OVERDUE">Geciken belgesi olanlar</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div style={emptyStyle}>Çalışan kartları yükleniyor...</div>
      ) : filteredCards.length === 0 ? (
        <div style={emptyStyle}>Çalışan bulunamadı.</div>
      ) : (
        <div className="employeeCardsGrid" style={cardsGrid}>
          {filteredCards.map((card) => {
            const expanded = expandedEmployeeId === card.employee.id;

            return (
              <article key={card.employee.id} style={cardStyle}>
                <div style={{ padding: 16 }}>
                  <div style={personHeader}>
                    <div style={avatarStyle}>
                      <UserRound size={22} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={personName}>{card.employee.full_name}</div>
                      <div style={personMeta}>
                        {card.employee.department || "Birim yok"} •{" "}
                        {card.employee.job_title || "Görev yok"}
                      </div>
                      <div style={personSmall}>
                        {card.employee.email || "E-posta yok"}
                        {card.employee.registry_no
                          ? ` • Sicil: ${card.employee.registry_no}`
                          : ""}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={rateStyle}>{card.completionRate}%</div>
                      <div style={rateLabel}>tamamlanma</div>
                    </div>
                  </div>

                  <div style={progressTrack}>
                    <div
                      style={{
                        ...progressBar,
                        width: `${Math.min(
                          100,
                          Math.max(0, card.completionRate)
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="employeeCardMetricGrid" style={metricGrid}>
                    <Metric label="Toplam" value={card.total} />
                    <Metric label="Açılmadı" value={card.unopened} />
                    <Metric label="Açık / Okunuyor" value={card.opened + card.reading} />
                    <Metric label="Okundu" value={card.read} />
                    <Metric label="Onaylandı" value={card.acknowledged} />
                    <Metric label="Geciken" value={card.overdue} />
                    <Metric label="Tamamlanan" value={card.completed} />
                    <Metric label="Bekleyen" value={Math.max(0, card.total - card.completed)} />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedEmployeeId(expanded ? null : card.employee.id)
                    }
                    style={{
                      ...expandButton,
                      background: expanded ? "#6d28d9" : "#f5f3ff",
                      color: expanded ? "#fff" : "#6d28d9",
                    }}
                  >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {expanded ? "Belgeleri Gizle" : `Belgeleri Gör (${card.total})`}
                  </button>
                </div>

                {expanded ? (
                  <div style={documentListArea}>
                    {card.rows.length === 0 ? (
                      <div style={emptySmall}>
                        Bu çalışana henüz belge atanmamış.
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 9 }}>
                        {card.rows.map((row) => {
                          const badge = statusStyle(row.effective_status);

                          return (
                            <div key={row.id} style={documentRow}>
                              <div style={documentTop}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={documentTitle}>
                                    {row.document_title}
                                  </div>
                                  <div style={documentMeta}>
                                    V{row.version_no} • Atama:{" "}
                                    {formatDate(row.assigned_at)}
                                  </div>
                                </div>

                                <span
                                  style={{
                                    ...statusBadge,
                                    color: badge.color,
                                    background: badge.background,
                                    border: `1px solid ${badge.border}`,
                                  }}
                                >
                                  {statusLabel(row.effective_status)}
                                </span>
                              </div>

                              <div className="employeeDocumentDetailGrid" style={detailGrid}>
                                <Detail label="İlk Açılma" value={formatDate(row.first_opened_at)} />
                                <Detail label="Aktif Okuma" value={formatSeconds(row.active_read_seconds)} />
                                <Detail label="Son Tarih" value={formatDate(row.due_at)} />
                                <Detail label="Onay" value={formatDate(row.acknowledgement_at)} />
                              </div>

                              <div style={documentBottom}>
                                <div style={approvalText}>
                                  Onay kodu:{" "}
                                  <strong>{row.acknowledgement_code || "-"}</strong>
                                </div>

                                {row.document_id ? (
                                  <a
                                    href={`/api/admin/employee-documents/${row.document_id}/file`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={openButton}
                                  >
                                    <FileSearch size={14} />
                                    Belgeyi Aç
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @media (max-width: 1200px) {
          .employeeCardSummaryGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }

          .employeeCardsGrid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 760px) {
          .employeeCardSummaryGrid,
          .employeeCardMetricGrid,
          .employeeDocumentDetailGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .employeeCardFilters {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

function SummaryBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div style={summaryBox}>
      <div style={summaryTop}>
        <span>{label}</span>
        {icon}
      </div>
      <div style={summaryValue}>{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={metricBox}>
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailBox}>
      <div style={detailLabel}>{label}</div>
      <div style={detailValue}>{value}</div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  padding: 19,
  boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#6d28d9",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: ".06em",
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#0f172a",
  fontSize: 23,
  fontWeight: 950,
};

const subtitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#64748b",
  lineHeight: 1.55,
  maxWidth: 760,
  fontSize: 12,
};

const secondaryButton: React.CSSProperties = {
  minHeight: 40,
  borderRadius: 12,
  border: "1px solid #dbe3ec",
  background: "#ffffff",
  color: "#475569",
  padding: "0 12px",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontWeight: 900,
  cursor: "pointer",
};

const errorBox: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 13,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  padding: 11,
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  fontWeight: 850,
};

const summaryGrid: React.CSSProperties = {
  marginTop: 17,
  display: "grid",
  gridTemplateColumns: "repeat(6,minmax(0,1fr))",
  gap: 9,
};

const summaryBox: React.CSSProperties = {
  borderRadius: 15,
  border: "1px solid #e5e7eb",
  background: "#fafafa",
  padding: 12,
};

const summaryTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  color: "#6d28d9",
  fontSize: 10,
  fontWeight: 900,
  textTransform: "uppercase",
};

const summaryValue: React.CSSProperties = {
  marginTop: 6,
  color: "#0f172a",
  fontSize: 23,
  fontWeight: 950,
};

const filterGrid: React.CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "minmax(260px,1fr) 230px",
  gap: 10,
};

const filterBox: React.CSSProperties = {
  minHeight: 42,
  borderRadius: 12,
  border: "1px solid #dbe3ec",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "0 11px",
  color: "#64748b",
};

const inputReset: React.CSSProperties = {
  width: "100%",
  border: 0,
  outline: 0,
  background: "transparent",
  color: "#334155",
  font: "inherit",
  fontSize: 12,
  fontWeight: 750,
};

const emptyStyle: React.CSSProperties = {
  minHeight: 220,
  display: "grid",
  placeItems: "center",
  color: "#94a3b8",
};

const cardsGrid: React.CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 13,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 20,
  background: "#ffffff",
  overflow: "hidden",
  boxShadow: "0 10px 28px rgba(15,23,42,.045)",
};

const personHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
};

const avatarStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: "#f5f3ff",
  color: "#6d28d9",
  display: "grid",
  placeItems: "center",
  flex: "0 0 auto",
};

const personName: React.CSSProperties = {
  color: "#0f172a",
  fontSize: 16,
  fontWeight: 950,
};

const personMeta: React.CSSProperties = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 12,
};

const personSmall: React.CSSProperties = {
  marginTop: 3,
  color: "#94a3b8",
  fontSize: 11,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const rateStyle: React.CSSProperties = {
  color: "#6d28d9",
  fontSize: 21,
  fontWeight: 950,
};

const rateLabel: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 10,
  fontWeight: 800,
};

const progressTrack: React.CSSProperties = {
  marginTop: 13,
  height: 7,
  background: "#f1f5f9",
  borderRadius: 999,
  overflow: "hidden",
};

const progressBar: React.CSSProperties = {
  height: "100%",
  background: "#6d28d9",
  borderRadius: 999,
};

const metricGrid: React.CSSProperties = {
  marginTop: 13,
  display: "grid",
  gridTemplateColumns: "repeat(4,minmax(0,1fr))",
  gap: 7,
};

const metricBox: React.CSSProperties = {
  borderRadius: 11,
  background: "#f8fafc",
  padding: "8px 7px",
  textAlign: "center",
};

const metricLabel: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 9,
  fontWeight: 900,
  textTransform: "uppercase",
  minHeight: 22,
};

const metricValue: React.CSSProperties = {
  marginTop: 3,
  color: "#0f172a",
  fontSize: 16,
  fontWeight: 950,
};

const expandButton: React.CSSProperties = {
  width: "100%",
  marginTop: 13,
  minHeight: 40,
  borderRadius: 12,
  border: "1px solid #ddd6fe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontWeight: 900,
  cursor: "pointer",
};

const documentListArea: React.CSSProperties = {
  borderTop: "1px solid #e5e7eb",
  background: "#f8fafc",
  padding: 13,
};

const emptySmall: React.CSSProperties = {
  minHeight: 90,
  display: "grid",
  placeItems: "center",
  color: "#94a3b8",
  fontSize: 12,
};

const documentRow: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  borderRadius: 14,
  padding: 12,
};

const documentTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const documentTitle: React.CSSProperties = {
  color: "#0f172a",
  fontWeight: 900,
  fontSize: 13,
};

const documentMeta: React.CSSProperties = {
  marginTop: 3,
  color: "#64748b",
  fontSize: 11,
};

const statusBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 8px",
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 900,
};

const detailGrid: React.CSSProperties = {
  marginTop: 10,
  display: "grid",
  gridTemplateColumns: "repeat(4,minmax(0,1fr))",
  gap: 7,
};

const detailBox: React.CSSProperties = {
  borderRadius: 10,
  background: "#f8fafc",
  padding: 8,
};

const detailLabel: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 9,
  fontWeight: 900,
  textTransform: "uppercase",
};

const detailValue: React.CSSProperties = {
  marginTop: 4,
  color: "#334155",
  fontSize: 11,
  fontWeight: 800,
  lineHeight: 1.4,
};

const documentBottom: React.CSSProperties = {
  marginTop: 9,
  display: "flex",
  justifyContent: "space-between",
  gap: 9,
  flexWrap: "wrap",
  alignItems: "center",
};

const approvalText: React.CSSProperties = {
  color: "#64748b",
  fontSize: 11,
};

const openButton: React.CSSProperties = {
  minHeight: 34,
  borderRadius: 10,
  border: "1px solid #dbeafe",
  background: "#eff6ff",
  color: "#1d4ed8",
  padding: "0 10px",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  textDecoration: "none",
  fontSize: 11,
  fontWeight: 900,
};