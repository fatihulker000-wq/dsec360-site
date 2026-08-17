"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  TimerReset,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Mode =
  | "READING"
  | "ANALYTICS"
  | "REPORTS"
  | "LOGS";

type DocumentItem = {
  id: string;
  title: string;
  document_type: string;
  version_no: number;
  status: string;
  min_active_read_seconds?: number;
  page_count?: number | null;
};

type AssignmentRow = {
  id: string;
  document_id: string;
  document_title: string;
  document_type: string;
  version_no: number;
  reading_policy?: string | null;

  employee_id: string;
  employee_full_name: string;
  employee_email?: string | null;
  department?: string | null;
  job_title?: string | null;

  assigned_at: string;
  due_at?: string | null;
  effective_status: string;
  email_status: string;

  first_opened_at?: string | null;
  last_opened_at?: string | null;
  opened_count?: number | null;
  total_open_seconds?: number | null;
  active_read_seconds?: number | null;
  last_page_viewed?: number | null;
  pages_viewed?: number[] | null;
  reading_completed_at?: string | null;
  acknowledgement_at?: string | null;
  acknowledgement_code?: string | null;
};

type AuditEvent = {
  id: string;
  assignment_id: string;
  session_id?: string | null;
  document_id: string;
  firm_id: string;
  employee_id: string;
  event_type: string;
  page_no?: number | null;
  active_seconds_delta?: number | null;
  total_open_seconds_delta?: number | null;
  metadata?: Record<string, unknown> | null;
  occurred_at: string;
};

type Props = {
  firmId: string;
  documents: DocumentItem[];
  mode: Mode;
};

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString(
    "tr-TR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  );
}

function formatSeconds(value?: number | null) {
  const total = Math.max(
    0,
    Number(value || 0)
  );

  const minutes =
    Math.floor(total / 60);

  const seconds =
    Math.floor(total % 60);

  if (minutes <= 0) {
    return `${seconds} sn`;
  }

  if (seconds === 0) {
    return `${minutes} dk`;
  }

  return `${minutes} dk ${seconds} sn`;
}

function statusLabel(value: string) {
  switch (value) {
    case "ACKNOWLEDGED":
      return "Onaylandı";
    case "READ":
      return "Okundu / Onay Bekliyor";
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

function statusStyle(value: string) {
  if (value === "ACKNOWLEDGED") {
    return {
      color: "#166534",
      background: "#f0fdf4",
      border: "#bbf7d0",
    };
  }

  if (value === "OVERDUE") {
    return {
      color: "#b91c1c",
      background: "#fef2f2",
      border: "#fecaca",
    };
  }

  if (
    value === "READ" ||
    value === "READING" ||
    value === "OPENED"
  ) {
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

function eventLabel(type: string) {
  const map: Record<
    string,
    string
  > = {
    ASSIGNED: "Belge atandı",
    EMAIL_QUEUED:
      "E-posta kuyruğa alındı",
    EMAIL_SENT:
      "E-posta gönderildi",
    EMAIL_FAILED:
      "E-posta başarısız",
    PORTAL_LOGIN:
      "Portal girişi",
    DOCUMENT_OPENED:
      "Belge açıldı",
    READING_STARTED:
      "Okuma başladı",
    READING_HEARTBEAT:
      "Aktif okuma",
    WINDOW_FOCUSED:
      "Pencere aktif",
    WINDOW_BLURRED:
      "Pencere pasif",
    PAGE_VIEWED:
      "Sayfa görüntülendi",
    LAST_PAGE_REACHED:
      "Son sayfaya ulaşıldı",
    READING_COMPLETED:
      "Okuma tamamlandı",
    DOCUMENT_CLOSED:
      "Belge kapatıldı",
    ACKNOWLEDGEMENT_CHECKED:
      "Onay şartı kontrol edildi",
    DOCUMENT_ACKNOWLEDGED:
      "Belge onaylandı",
    REMINDER_SENT:
      "Hatırlatma gönderildi",
    OVERDUE:
      "Süre geçti",
    CANCELLED:
      "Atama iptal edildi",
  };

  return map[type] || type;
}

function csvEscape(value: unknown) {
  const text = String(
    value ?? ""
  ).replace(/"/g, '""');

  return `"${text}"`;
}

function downloadText(
  fileName: string,
  content: string,
  type = "text/csv;charset=utf-8"
) {
  const blob = new Blob(
    ["\ufeff", content],
    { type }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

export default function EmployeeDocumentInsightsCenter({
  firmId,
  documents,
  mode,
}: Props) {
  const [assignments, setAssignments] =
    useState<AssignmentRow[]>([]);

  const [events, setEvents] =
    useState<AuditEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [documentFilter, setDocumentFilter] =
    useState("all");

  const [eventFilter, setEventFilter] =
    useState("all");

  const loadAssignments =
    useCallback(async () => {
      if (!firmId) {
        setAssignments([]);
        return;
      }

      const response = await fetch(
        `/api/admin/employee-document-assignments?firmId=${encodeURIComponent(
          firmId
        )}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const json =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.detail ||
            json?.error ||
            "Belge gönderimleri alınamadı."
        );
      }

      setAssignments(
        Array.isArray(json?.data)
          ? json.data
          : []
      );
    }, [firmId]);

  const loadEvents =
    useCallback(async () => {
      if (!firmId) {
        setEvents([]);
        return;
      }

      const response = await fetch(
        `/api/admin/employee-document-events?firmId=${encodeURIComponent(
          firmId
        )}&limit=1000`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const json =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.detail ||
            json?.error ||
            "İşlem logları alınamadı."
        );
      }

      setEvents(
        Array.isArray(json?.data)
          ? json.data
          : []
      );
    }, [firmId]);

  const loadAll =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        if (mode === "LOGS") {
          await Promise.all([
            loadAssignments(),
            loadEvents(),
          ]);
        } else {
          await loadAssignments();
        }
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Veriler yüklenemedi."
        );
      } finally {
        setLoading(false);
      }
    }, [
      loadAssignments,
      loadEvents,
      mode,
    ]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const stats = useMemo(() => {
    const total = assignments.length;

    const acknowledged =
      assignments.filter(
        (row) =>
          row.effective_status ===
          "ACKNOWLEDGED"
      ).length;

    const readWaiting =
      assignments.filter(
        (row) =>
          row.effective_status === "READ"
      ).length;

    const opened =
      assignments.filter((row) =>
        [
          "OPENED",
          "READING",
          "READ",
          "ACKNOWLEDGED",
        ].includes(
          row.effective_status
        )
      ).length;

    const unread =
      assignments.filter(
        (row) =>
          ![
            "OPENED",
            "READING",
            "READ",
            "ACKNOWLEDGED",
          ].includes(
            row.effective_status
          )
      ).length;

    const overdue =
      assignments.filter(
        (row) =>
          row.effective_status ===
          "OVERDUE"
      ).length;

    const completionRate =
      total > 0
        ? Math.round(
            (acknowledged / total) *
              100
          )
        : 0;

    const avgActiveSeconds =
      total > 0
        ? Math.round(
            assignments.reduce(
              (sum, row) =>
                sum +
                Number(
                  row.active_read_seconds ||
                    0
                ),
              0
            ) / total
          )
        : 0;

    return {
      total,
      acknowledged,
      readWaiting,
      opened,
      unread,
      overdue,
      completionRate,
      avgActiveSeconds,
    };
  }, [assignments]);

  const filteredAssignments =
    useMemo(() => {
      const search = searchText
        .trim()
        .toLocaleLowerCase(
          "tr-TR"
        );

      return assignments.filter(
        (row) => {
          if (
            statusFilter !== "all" &&
            row.effective_status !==
              statusFilter
          ) {
            return false;
          }

          if (
            documentFilter !==
              "all" &&
            row.document_id !==
              documentFilter
          ) {
            return false;
          }

          if (!search) {
            return true;
          }

          return [
            row.document_title,
            row.employee_full_name,
            row.employee_email || "",
            row.job_title || "",
            row.department || "",
            row.acknowledgement_code ||
              "",
          ]
            .join(" ")
            .toLocaleLowerCase(
              "tr-TR"
            )
            .includes(search);
        }
      );
    }, [
      assignments,
      documentFilter,
      searchText,
      statusFilter,
    ]);

  const assignmentMap =
    useMemo(
      () =>
        new Map(
          assignments.map((row) => [
            row.id,
            row,
          ])
        ),
      [assignments]
    );

  const filteredEvents =
    useMemo(() => {
      const search = searchText
        .trim()
        .toLocaleLowerCase(
          "tr-TR"
        );

      return events.filter(
        (event) => {
          if (
            eventFilter !== "all" &&
            event.event_type !==
              eventFilter
          ) {
            return false;
          }

          const assignment =
            assignmentMap.get(
              event.assignment_id
            );

          if (!search) {
            return true;
          }

          return [
            event.event_type,
            eventLabel(
              event.event_type
            ),
            assignment?.employee_full_name ||
              "",
            assignment?.document_title ||
              "",
            assignment?.employee_email ||
              "",
          ]
            .join(" ")
            .toLocaleLowerCase(
              "tr-TR"
            )
            .includes(search);
        }
      );
    }, [
      assignmentMap,
      eventFilter,
      events,
      searchText,
    ]);

  const documentAnalytics =
    useMemo(() => {
      return documents
        .map((document) => {
          const rows =
            assignments.filter(
              (row) =>
                row.document_id ===
                document.id
            );

          const acknowledged =
            rows.filter(
              (row) =>
                row.effective_status ===
                "ACKNOWLEDGED"
            ).length;

          const overdue =
            rows.filter(
              (row) =>
                row.effective_status ===
                "OVERDUE"
            ).length;

          const opened =
            rows.filter((row) =>
              [
                "OPENED",
                "READING",
                "READ",
                "ACKNOWLEDGED",
              ].includes(
                row.effective_status
              )
            ).length;

          return {
            id: document.id,
            title: document.title,
            total: rows.length,
            opened,
            acknowledged,
            overdue,
            rate:
              rows.length > 0
                ? Math.round(
                    (acknowledged /
                      rows.length) *
                      100
                  )
                : 0,
          };
        })
        .filter(
          (item) =>
            item.total > 0
        );
    }, [
      assignments,
      documents,
    ]);

  const exportCsv = () => {
    const headers = [
      "Belge",
      "Çalışan",
      "E-posta",
      "Görev",
      "Atama Tarihi",
      "Son Tarih",
      "Durum",
      "İlk Açılış",
      "Son Açılış",
      "Açılma Sayısı",
      "Toplam Açık Süre (sn)",
      "Aktif Okuma Süresi (sn)",
      "Son Görülen Sayfa",
      "Görülen Sayfalar",
      "Okuma Tamamlandı",
      "Onay Tarihi",
      "Onay Kodu",
      "E-posta Durumu",
    ];

    const rows =
      filteredAssignments.map(
        (row) => [
          row.document_title,
          row.employee_full_name,
          row.employee_email || "",
          row.job_title || "",
          formatDate(
            row.assigned_at
          ),
          formatDate(row.due_at),
          statusLabel(
            row.effective_status
          ),
          formatDate(
            row.first_opened_at
          ),
          formatDate(
            row.last_opened_at
          ),
          Number(
            row.opened_count || 0
          ),
          Number(
            row.total_open_seconds ||
              0
          ),
          Number(
            row.active_read_seconds ||
              0
          ),
          row.last_page_viewed ||
            "",
          Array.isArray(
            row.pages_viewed
          )
            ? row.pages_viewed.join(
                ","
              )
            : "",
          formatDate(
            row.reading_completed_at
          ),
          formatDate(
            row.acknowledgement_at
          ),
          row.acknowledgement_code ||
            "",
          row.email_status || "",
        ]
      );

    const csv = [
      headers
        .map(csvEscape)
        .join(";"),
      ...rows.map((row) =>
        row
          .map(csvEscape)
          .join(";")
      ),
    ].join("\n");

    downloadText(
      `dsec-calisan-belge-raporu-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      csv
    );
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <section style={panelStyle}>
        <div style={loadingStyle}>
          <Loader2 size={26} />
          Veriler yükleniyor...
        </div>
      </section>
    );
  }

  if (mode === "LOGS") {
    const eventTypes =
      Array.from(
        new Set(
          events.map(
            (event) =>
              event.event_type
          )
        )
      ).sort();

    return (
      <section style={panelStyle}>
        <Header
          title="İşlem Logları"
          description="Belge atama, e-posta, açılış, aktif okuma, sayfa görüntüleme ve elektronik onay audit kayıtları."
          onRefresh={() =>
            void loadAll()
          }
        />

        {error ? (
          <ErrorBox text={error} />
        ) : null}

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns:
              "minmax(260px,1fr) 280px",
            gap: 10,
          }}
          className="employeeDocumentLogFilters"
        >
          <SearchBox
            value={searchText}
            onChange={setSearchText}
            placeholder="Çalışan, belge veya işlem ara..."
          />

          <select
            value={eventFilter}
            onChange={(event) =>
              setEventFilter(
                event.target.value
              )
            }
            style={fieldInput}
          >
            <option value="all">
              Tüm işlemler
            </option>

            {eventTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {eventLabel(
                    type
                  )}
                </option>
              )
            )}
          </select>
        </div>

        <div
          style={{
            marginTop: 16,
            overflowX: "auto",
          }}
        >
          <table style={tableStyle}>
            <thead>
              <tr>
                {[
                  "Tarih",
                  "İşlem",
                  "Çalışan",
                  "Belge",
                  "Sayfa",
                  "Aktif Süre",
                  "Detay",
                ].map((header) => (
                  <th
                    key={header}
                    style={thStyle}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredEvents.map(
                (event) => {
                  const assignment =
                    assignmentMap.get(
                      event.assignment_id
                    );

                  return (
                    <tr
                      key={event.id}
                      style={trStyle}
                    >
                      <td style={tdStyle}>
                        {formatDate(
                          event.occurred_at
                        )}
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {eventLabel(
                            event.event_type
                          )}
                        </strong>
                        <div
                          style={
                            smallText
                          }
                        >
                          {
                            event.event_type
                          }
                        </div>
                      </td>

                      <td style={tdStyle}>
                        {assignment?.employee_full_name ||
                          event.employee_id}
                      </td>

                      <td style={tdStyle}>
                        {assignment?.document_title ||
                          event.document_id}
                      </td>

                      <td style={tdStyle}>
                        {event.page_no ||
                          "-"}
                      </td>

                      <td style={tdStyle}>
                        {event.active_seconds_delta
                          ? `${event.active_seconds_delta} sn`
                          : "-"}
                      </td>

                      <td style={tdStyle}>
                        <code
                          style={{
                            fontSize: 10,
                            color:
                              "#64748b",
                          }}
                        >
                          {event.metadata
                            ? JSON.stringify(
                                event.metadata
                              ).slice(
                                0,
                                180
                              )
                            : "-"}
                        </code>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>

          {filteredEvents.length ===
          0 ? (
            <EmptyState
              text="Gösterilecek işlem kaydı bulunamadı."
            />
          ) : null}
        </div>

        <ResponsiveStyle />
      </section>
    );
  }

  if (mode === "ANALYTICS") {
    return (
      <section style={panelStyle}>
        <Header
          title="Çalışan Belge Analizi"
          description="Okuyan, okumayan, açıp tamamlamayan, onaylayan ve geciken çalışanların gerçek zamanlı analizi."
          onRefresh={() =>
            void loadAll()
          }
        />

        {error ? (
          <ErrorBox text={error} />
        ) : null}

        <KpiGrid
          items={[
            {
              label: "Toplam Atama",
              value: stats.total,
              icon: <Users size={20} />,
            },
            {
              label: "Onaylandı",
              value:
                stats.acknowledged,
              icon: (
                <UserCheck
                  size={20}
                />
              ),
            },
            {
              label: "Okunmadı",
              value: stats.unread,
              icon: (
                <UserX size={20} />
              ),
            },
            {
              label: "Geciken",
              value: stats.overdue,
              icon: (
                <Clock3
                  size={20}
                />
              ),
            },
            {
              label: "Onay Oranı",
              value: `%${stats.completionRate}`,
              icon: (
                <BarChart3
                  size={20}
                />
              ),
            },
          ]}
        />

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1fr) minmax(0,1fr)",
            gap: 14,
          }}
          className="employeeDocumentAnalyticsGrid"
        >
          <div style={subPanel}>
            <h3 style={subTitle}>
              Belge Bazlı Tamamlama
            </h3>

            <div
              style={{
                marginTop: 12,
                display: "grid",
                gap: 12,
              }}
            >
              {documentAnalytics.map(
                (item) => (
                  <div
                    key={item.id}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap: 8,
                        fontSize: 12,
                      }}
                    >
                      <strong>
                        {item.title}
                      </strong>

                      <span>
                        %{item.rate}
                      </span>
                    </div>

                    <div
                      style={
                        progressTrack
                      }
                    >
                      <div
                        style={{
                          ...progressFill,
                          width: `${item.rate}%`,
                        }}
                      />
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        display:
                          "flex",
                        gap: 10,
                        flexWrap:
                          "wrap",
                        color:
                          "#64748b",
                        fontSize:
                          10,
                      }}
                    >
                      <span>
                        Atama:{" "}
                        {item.total}
                      </span>
                      <span>
                        Açıldı:{" "}
                        {item.opened}
                      </span>
                      <span>
                        Onay:{" "}
                        {item.acknowledged}
                      </span>
                      <span>
                        Geciken:{" "}
                        {item.overdue}
                      </span>
                    </div>
                  </div>
                )
              )}

              {documentAnalytics.length ===
              0 ? (
                <EmptyState
                  text="Analiz edilecek belge ataması bulunamadı."
                />
              ) : null}
            </div>
          </div>

          <div style={subPanel}>
            <h3 style={subTitle}>
              Süre Analizi
            </h3>

            <div
              style={{
                marginTop: 14,
                display: "grid",
                gap: 12,
              }}
            >
              <MetricRow
                label="Ortalama aktif okuma"
                value={formatSeconds(
                  stats.avgActiveSeconds
                )}
              />

              <MetricRow
                label="Belgeyi açan çalışan"
                value={`${stats.opened} / ${stats.total}`}
              />

              <MetricRow
                label="Okudu, onay bekliyor"
                value={String(
                  stats.readWaiting
                )}
              />

              <MetricRow
                label="Henüz açmayan"
                value={String(
                  stats.unread
                )}
              />

              <MetricRow
                label="Süresi geçen"
                value={String(
                  stats.overdue
                )}
              />
            </div>
          </div>
        </div>

        <ResponsiveStyle />
      </section>
    );
  }

  if (mode === "REPORTS") {
    return (
      <section
        style={panelStyle}
        className="employeeDocumentPrintable"
      >
        <Header
          title="Belge Raporları"
          description="Çalışan Belge Okuma ve Onay Raporunu filtreleyin; Excel uyumlu CSV indirin veya yazdır/PDF çıktısı alın."
          onRefresh={() =>
            void loadAll()
          }
        />

        {error ? (
          <ErrorBox text={error} />
        ) : null}

        <FilterBar
          searchText={searchText}
          setSearchText={
            setSearchText
          }
          statusFilter={
            statusFilter
          }
          setStatusFilter={
            setStatusFilter
          }
          documentFilter={
            documentFilter
          }
          setDocumentFilter={
            setDocumentFilter
          }
          documents={documents}
        />

        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 9,
            flexWrap: "wrap",
          }}
          className="noPrint"
        >
          <button
            type="button"
            onClick={exportCsv}
            style={primaryButton}
          >
            <Download size={16} />
            Excel / CSV İndir
          </button>

          <button
            type="button"
            onClick={printReport}
            style={secondaryButton}
          >
            <Printer size={16} />
            Yazdır / PDF
          </button>
        </div>

        <div
          style={{
            marginTop: 17,
            display: "grid",
            gridTemplateColumns:
              "repeat(4,minmax(0,1fr))",
            gap: 10,
          }}
          className="reportKpis"
        >
          <ReportKpi
            label="Toplam"
            value={
              filteredAssignments.length
            }
          />
          <ReportKpi
            label="Onaylandı"
            value={
              filteredAssignments.filter(
                (row) =>
                  row.effective_status ===
                  "ACKNOWLEDGED"
              ).length
            }
          />
          <ReportKpi
            label="Okunuyor / Açıldı"
            value={
              filteredAssignments.filter(
                (row) =>
                  [
                    "OPENED",
                    "READING",
                    "READ",
                  ].includes(
                    row.effective_status
                  )
              ).length
            }
          />
          <ReportKpi
            label="Geciken"
            value={
              filteredAssignments.filter(
                (row) =>
                  row.effective_status ===
                  "OVERDUE"
              ).length
            }
          />
        </div>

        <AssignmentTable
          rows={filteredAssignments}
          reportMode
        />

        <ResponsiveStyle />
      </section>
    );
  }

  // READING
  return (
    <section style={panelStyle}>
      <Header
        title="Okuma & Onay Takibi"
        description="Belge açılma zamanı, aktif okuma süresi, sayfa görüntüleme, okuma tamamlanma ve elektronik onay kayıtlarını izleyin."
        onRefresh={() =>
          void loadAll()
        }
      />

      {error ? (
        <ErrorBox text={error} />
      ) : null}

      <KpiGrid
        items={[
          {
            label: "Toplam Atama",
            value: stats.total,
            icon: <Users size={20} />,
          },
          {
            label: "Belgeyi Açan",
            value: stats.opened,
            icon: <Eye size={20} />,
          },
          {
            label: "Onay Bekleyen",
            value: stats.readWaiting,
            icon: (
              <TimerReset
                size={20}
              />
            ),
          },
          {
            label: "Onaylandı",
            value:
              stats.acknowledged,
            icon: (
              <CheckCircle2
                size={20}
              />
            ),
          },
          {
            label: "Geciken",
            value: stats.overdue,
            icon: (
              <AlertTriangle
                size={20}
              />
            ),
          },
        ]}
      />

      <FilterBar
        searchText={searchText}
        setSearchText={setSearchText}
        statusFilter={statusFilter}
        setStatusFilter={
          setStatusFilter
        }
        documentFilter={
          documentFilter
        }
        setDocumentFilter={
          setDocumentFilter
        }
        documents={documents}
      />

      <AssignmentTable
        rows={filteredAssignments}
      />

      <ResponsiveStyle />
    </section>
  );
}

function Header({
  title,
  description,
  onRefresh,
}: {
  title: string;
  description: string;
  onRefresh: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems:
          "flex-start",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div>
        <h2 style={titleStyle}>
          {title}
        </h2>

        <p style={subtitleStyle}>
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        style={secondaryButton}
        className="noPrint"
      >
        <RefreshCw size={16} />
        Yenile
      </button>
    </div>
  );
}

function KpiGrid({
  items,
}: {
  items: Array<{
    label: string;
    value: string | number;
    icon: React.ReactNode;
  }>;
}) {
  return (
    <div
      style={{
        marginTop: 16,
        display: "grid",
        gridTemplateColumns:
          "repeat(5,minmax(0,1fr))",
        gap: 10,
      }}
      className="employeeDocumentKpiGrid"
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            border:
              "1px solid #e5e7eb",
            background:
              "#f8fafc",
            borderRadius: 15,
            padding: 13,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              color: "#6d28d9",
            }}
          >
            {item.icon}
            <span
              style={{
                color:
                  "#64748b",
                fontSize: 11,
                fontWeight: 850,
              }}
            >
              {item.label}
            </span>
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 25,
              fontWeight: 950,
              color: "#0f172a",
            }}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterBar({
  searchText,
  setSearchText,
  statusFilter,
  setStatusFilter,
  documentFilter,
  setDocumentFilter,
  documents,
}: {
  searchText: string;
  setSearchText: (
    value: string
  ) => void;
  statusFilter: string;
  setStatusFilter: (
    value: string
  ) => void;
  documentFilter: string;
  setDocumentFilter: (
    value: string
  ) => void;
  documents: DocumentItem[];
}) {
  return (
    <div
      style={{
        marginTop: 16,
        display: "grid",
        gridTemplateColumns:
          "minmax(240px,1fr) 220px 260px",
        gap: 10,
      }}
      className="employeeDocumentFilterGrid noPrint"
    >
      <SearchBox
        value={searchText}
        onChange={setSearchText}
        placeholder="Çalışan, belge, e-posta veya onay kodu ara..."
      />

      <select
        value={statusFilter}
        onChange={(event) =>
          setStatusFilter(
            event.target.value
          )
        }
        style={fieldInput}
      >
        <option value="all">
          Tüm durumlar
        </option>
        <option value="ASSIGNED">
          Atandı
        </option>
        <option value="SENT">
          Gönderildi
        </option>
        <option value="OPENED">
          Açıldı
        </option>
        <option value="READING">
          Okunuyor
        </option>
        <option value="READ">
          Okundu / Onay Bekliyor
        </option>
        <option value="ACKNOWLEDGED">
          Onaylandı
        </option>
        <option value="OVERDUE">
          Gecikti
        </option>
      </select>

      <select
        value={documentFilter}
        onChange={(event) =>
          setDocumentFilter(
            event.target.value
          )
        }
        style={fieldInput}
      >
        <option value="all">
          Tüm belgeler
        </option>

        {documents.map(
          (document) => (
            <option
              key={document.id}
              value={document.id}
            >
              {document.title}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder: string;
}) {
  return (
    <label style={searchField}>
      <Search size={16} />

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        style={{
          width: "100%",
          border: 0,
          outline: 0,
          background:
            "transparent",
        }}
      />
    </label>
  );
}

function AssignmentTable({
  rows,
  reportMode = false,
}: {
  rows: AssignmentRow[];
  reportMode?: boolean;
}) {
  return (
    <div
      style={{
        marginTop: 16,
        overflowX: "auto",
      }}
    >
      <table style={tableStyle}>
        <thead>
          <tr>
            {[
              "Belge",
              "Çalışan",
              "Görev",
              "Durum",
              "Aktif Okuma",
              "Sayfa",
              "İlk Açılış",
              "Okuma Tamamlandı",
              "Onay Tarihi",
              "Onay Kodu",
            ].map((header) => (
              <th
                key={header}
                style={thStyle}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const badge =
              statusStyle(
                row.effective_status
              );

            const pageCount =
              Array.isArray(
                row.pages_viewed
              )
                ? new Set(
                    row.pages_viewed
                  ).size
                : 0;

            return (
              <tr
                key={row.id}
                style={trStyle}
              >
                <td style={tdStyle}>
                  <strong>
                    {row.document_title}
                  </strong>
                  <div
                    style={smallText}
                  >
                    V{row.version_no}
                  </div>
                </td>

                <td style={tdStyle}>
                  <strong>
                    {
                      row.employee_full_name
                    }
                  </strong>

                  <div
                    style={smallText}
                  >
                    {row.employee_email ||
                      "-"}
                  </div>
                </td>

                <td style={tdStyle}>
                  {row.job_title ||
                    "-"}
                </td>

                <td style={tdStyle}>
                  <span
                    style={{
                      display:
                        "inline-flex",
                      borderRadius:
                        999,
                      padding:
                        "6px 9px",
                      border: `1px solid ${badge.border}`,
                      background:
                        badge.background,
                      color:
                        badge.color,
                      fontSize: 10,
                      fontWeight:
                        900,
                    }}
                  >
                    {statusLabel(
                      row.effective_status
                    )}
                  </span>
                </td>

                <td style={tdStyle}>
                  {formatSeconds(
                    row.active_read_seconds
                  )}
                </td>

                <td style={tdStyle}>
                  {pageCount > 0
                    ? `${pageCount} görüldü`
                    : "-"}
                  <div
                    style={smallText}
                  >
                    Son:{" "}
                    {row.last_page_viewed ||
                      "-"}
                  </div>
                </td>

                <td style={tdStyle}>
                  {formatDate(
                    row.first_opened_at
                  )}
                </td>

                <td style={tdStyle}>
                  {formatDate(
                    row.reading_completed_at
                  )}
                </td>

                <td style={tdStyle}>
                  {formatDate(
                    row.acknowledgement_at
                  )}
                </td>

                <td style={tdStyle}>
                  {row.acknowledgement_code ? (
                    <strong
                      style={{
                        color:
                          "#166534",
                        fontSize: 11,
                      }}
                    >
                      {
                        row.acknowledgement_code
                      }
                    </strong>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rows.length === 0 ? (
        <EmptyState
          text={
            reportMode
              ? "Rapor kriterlerine uygun kayıt bulunamadı."
              : "İzlenecek çalışan belge kaydı bulunamadı."
          }
        />
      ) : null}
    </div>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        gap: 12,
        borderBottom:
          "1px solid #eef2f7",
        paddingBottom: 10,
      }}
    >
      <span
        style={{
          color: "#64748b",
          fontSize: 12,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: "#0f172a",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function ReportKpi({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        border:
          "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 13,
        background: "#fafafa",
      }}
    >
      <div
        style={{
          color: "#64748b",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 5,
          color: "#0f172a",
          fontSize: 23,
          fontWeight: 950,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        minHeight: 180,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        color: "#94a3b8",
        fontWeight: 800,
      }}
    >
      {text}
    </div>
  );
}

function ErrorBox({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        marginTop: 14,
        border:
          "1px solid #fecaca",
        background: "#fef2f2",
        color: "#b91c1c",
        borderRadius: 13,
        padding: 11,
        display: "flex",
        gap: 8,
        alignItems: "center",
        fontWeight: 800,
      }}
    >
      <AlertTriangle
        size={17}
      />
      {text}
    </div>
  );
}

function ResponsiveStyle() {
  return (
    <style jsx>{`
      @media (max-width: 1050px) {
        .employeeDocumentKpiGrid {
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          ) !important;
        }

        .employeeDocumentFilterGrid,
        .employeeDocumentLogFilters,
        .employeeDocumentAnalyticsGrid {
          grid-template-columns: 1fr !important;
        }

        .reportKpis {
          grid-template-columns: repeat(
            2,
            minmax(0, 1fr)
          ) !important;
        }
      }

      @media (max-width: 640px) {
        .employeeDocumentKpiGrid,
        .reportKpis {
          grid-template-columns: 1fr !important;
        }
      }

      @media print {
        .noPrint {
          display: none !important;
        }

        .employeeDocumentPrintable {
          box-shadow: none !important;
          border: 0 !important;
          padding: 0 !important;
        }

        body {
          background: #ffffff !important;
        }
      }
    `}</style>
  );
}

const panelStyle: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  padding: 19,
  boxShadow:
    "0 12px 30px rgba(15,23,42,0.05)",
};

const subPanel: React.CSSProperties = {
  borderRadius: 17,
  border: "1px solid #e5e7eb",
  background: "#fafafa",
  padding: 15,
};

const subTitle: React.CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: 16,
  fontWeight: 950,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: 23,
  fontWeight: 950,
};

const subtitleStyle: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#64748b",
  lineHeight: 1.55,
};

const searchField: React.CSSProperties = {
  height: 42,
  borderRadius: 12,
  border: "1px solid #dbe3ec",
  background: "#ffffff",
  padding: "0 11px",
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#64748b",
};

const fieldInput: React.CSSProperties = {
  width: "100%",
  height: 42,
  borderRadius: 12,
  border: "1px solid #dbe3ec",
  background: "#ffffff",
  padding: "0 11px",
  outline: 0,
  color: "#334155",
  fontWeight: 700,
};

const primaryButton: React.CSSProperties = {
  minHeight: 40,
  borderRadius: 11,
  border: 0,
  background: "#6d28d9",
  color: "#ffffff",
  padding: "0 13px",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  minHeight: 40,
  borderRadius: 11,
  border: "1px solid #dbe3ec",
  background: "#ffffff",
  color: "#475569",
  padding: "0 13px",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontWeight: 900,
  cursor: "pointer",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 1200,
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  padding: "11px 9px",
  textAlign: "left",
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: 11,
  fontWeight: 900,
};

const tdStyle: React.CSSProperties = {
  padding: "12px 9px",
  color: "#475569",
  fontSize: 11,
  verticalAlign: "top",
};

const trStyle: React.CSSProperties = {
  borderBottom: "1px solid #eef2f7",
};

const smallText: React.CSSProperties = {
  marginTop: 4,
  color: "#94a3b8",
  fontSize: 10,
};

const progressTrack: React.CSSProperties = {
  marginTop: 7,
  height: 8,
  borderRadius: 999,
  background: "#e5e7eb",
  overflow: "hidden",
};

const progressFill: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "#6d28d9",
};

const loadingStyle: React.CSSProperties = {
  minHeight: 300,
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: 8,
  color: "#64748b",
  fontWeight: 800,
};