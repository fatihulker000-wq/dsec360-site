"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Mail,
  MailX,
  Search,
  Send,
  UserCheck,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Employee = {
  id: string;
  firm_id?: string | null;
  full_name: string;
  department?: string | null;
  job_title?: string | null;
  email?: string | null;
  registry_no?: string | null;
  active: boolean;
};

type DocumentItem = {
  id: string;
  title: string;
  document_type: string;
  version_no: number;
  status: string;
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

  target_type: string;
  assigned_at: string;
  due_at?: string | null;
  effective_status: string;
  email_status: string;

  first_opened_at?: string | null;
  active_read_seconds: number;
  acknowledgement_at?: string | null;
  acknowledgement_code?: string | null;
};

type Props = {
  firmId: string;
  documents: DocumentItem[];
  initialView?: "new" | "list";
};

type TargetType =
  | "ALL"
  | "DEPARTMENT"
  | "JOB_TITLE"
  | "MULTI_PERSON"
  | "PERSON";

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function statusLabel(status: string) {
  switch (status) {
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

function statusColor(status: string) {
  if (status === "ACKNOWLEDGED") {
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

  if (
    status === "READ" ||
    status === "READING" ||
    status === "OPENED"
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

export default function EmployeeDocumentAssignmentCenter({
  firmId,
  documents,
  initialView = "new",
}: Props) {
  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [assignments, setAssignments] =
    useState<AssignmentRow[]>([]);

  const [loadingEmployees, setLoadingEmployees] =
    useState(false);

  const [loadingAssignments, setLoadingAssignments] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [documentId, setDocumentId] =
    useState("");

  const [targetType, setTargetType] =
    useState<TargetType>("ALL");

  const [department, setDepartment] =
    useState("");

  const [jobTitle, setJobTitle] =
    useState("");

  const [selectedEmployeeIds, setSelectedEmployeeIds] =
    useState<string[]>([]);

  const [employeeSearch, setEmployeeSearch] =
    useState("");

  const [dueAt, setDueAt] =
    useState("");

  const publishedDocuments = useMemo(
    () =>
      documents.filter(
        (document) =>
          document.status === "PUBLISHED"
      ),
    [documents]
  );

  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          employees
            .map((employee) =>
              String(employee.department || "").trim()
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(b, "tr")
      ),
    [employees]
  );

  const jobTitles = useMemo(
    () =>
      Array.from(
        new Set(
          employees
            .map((employee) =>
              String(employee.job_title || "").trim()
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(b, "tr")
      ),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const search = employeeSearch
      .trim()
      .toLocaleLowerCase("tr-TR");

    if (!search) return employees;

    return employees.filter((employee) =>
      [
        employee.full_name,
        employee.department || "",
        employee.job_title || "",
        employee.email || "",
        employee.registry_no || "",
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(search)
    );
  }, [employees, employeeSearch]);

  const loadEmployees = useCallback(async () => {
    if (!firmId) {
      setEmployees([]);
      return;
    }

    try {
      setLoadingEmployees(true);

      const response = await fetch(
        `/api/admin/employees?firmId=${encodeURIComponent(
          firmId
        )}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const json =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.error || "Çalışanlar alınamadı."
        );
      }

      const rows = Array.isArray(json?.data)
        ? json.data
        : [];

      setEmployees(
        rows
          .map(
            (employee: Employee): Employee => ({
              id: String(employee.id || ""),
              firm_id:
                employee.firm_id
                  ? String(employee.firm_id)
                  : null,
              full_name: String(
                employee.full_name || ""
              ).trim(),
              department:
                employee.department
                  ? String(employee.department)
                  : null,
              job_title:
                employee.job_title
                  ? String(employee.job_title)
                  : null,
              email:
                employee.email
                  ? String(employee.email)
                  : null,
              registry_no:
                employee.registry_no
                  ? String(employee.registry_no)
                  : null,
              active: employee.active !== false,
            })
          )
          .filter(
            (employee: Employee) =>
              employee.id &&
              employee.full_name &&
              employee.active
          )
      );
    } catch (cause) {
      setEmployees([]);
      setError(
        cause instanceof Error
          ? cause.message
          : "Çalışan listesi yüklenemedi."
      );
    } finally {
      setLoadingEmployees(false);
    }
  }, [firmId]);

  const loadAssignments = useCallback(async () => {
    if (!firmId) {
      setAssignments([]);
      return;
    }

    try {
      setLoadingAssignments(true);

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
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.detail ||
            json?.error ||
            "Gönderimler alınamadı."
        );
      }

      setAssignments(
        Array.isArray(json?.data)
          ? json.data
          : []
      );
    } catch (cause) {
      setAssignments([]);
      setError(
        cause instanceof Error
          ? cause.message
          : "Belge gönderimleri yüklenemedi."
      );
    } finally {
      setLoadingAssignments(false);
    }
  }, [firmId]);

  useEffect(() => {
    setSelectedEmployeeIds([]);
    setDepartment("");
    setJobTitle("");
    setError("");
    setMessage("");

    void loadEmployees();
    void loadAssignments();
  }, [loadEmployees, loadAssignments]);

  useEffect(() => {
    if (
      !documentId &&
      publishedDocuments.length > 0
    ) {
      setDocumentId(
        publishedDocuments[0].id
      );
    }
  }, [
    documentId,
    publishedDocuments,
  ]);

  const selectedCount = useMemo(() => {
    if (targetType === "ALL") {
      return employees.length;
    }

    if (targetType === "DEPARTMENT") {
      return employees.filter(
        (employee) =>
          String(employee.department || "") ===
          department
      ).length;
    }

    if (targetType === "JOB_TITLE") {
      return employees.filter(
        (employee) =>
          String(employee.job_title || "") ===
          jobTitle
      ).length;
    }

    return selectedEmployeeIds.length;
  }, [
    targetType,
    employees,
    department,
    jobTitle,
    selectedEmployeeIds,
  ]);

  const submit = async () => {
    if (!documentId) {
      setError(
        "Gönderilecek yayınlanmış belgeyi seçin."
      );
      return;
    }

    if (!firmId) {
      setError("Firma seçimi zorunludur.");
      return;
    }

    if (
      targetType === "DEPARTMENT" &&
      !department
    ) {
      setError("Departman seçin.");
      return;
    }

    if (
      targetType === "JOB_TITLE" &&
      !jobTitle
    ) {
      setError("Görev / kadro seçin.");
      return;
    }

    if (
      (targetType === "PERSON" ||
        targetType === "MULTI_PERSON") &&
      selectedEmployeeIds.length === 0
    ) {
      setError("En az bir çalışan seçin.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/employee-document-assignments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            documentId,
            firmId,
            targetType,
            department:
              targetType === "DEPARTMENT"
                ? department
                : null,
            jobTitle:
              targetType === "JOB_TITLE"
                ? jobTitle
                : null,
            employeeIds:
              targetType === "PERSON" ||
              targetType === "MULTI_PERSON"
                ? selectedEmployeeIds
                : [],
            dueAt:
              dueAt ||
              null,
          }),
        }
      );

      const json =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.detail ||
            json?.error ||
            "Belge ataması oluşturulamadı."
        );
      }

      setMessage(
        `${Number(json?.inserted || 0)} çalışan için belge ataması oluşturuldu. ` +
          `${Number(json?.emailed || 0)} e-posta gönderildi. ` +
          `${Number(json?.mailFailed || 0)} e-posta başarısız. ` +
          `${Number(json?.noEmail || 0)} çalışanın geçerli e-posta/portal hesabı yok. ` +
          `${Number(json?.skipped || 0)} mevcut atama atlandı.`
      );

      setSelectedEmployeeIds([]);

      await loadAssignments();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Belge gönderimi oluşturulamadı."
      );
    } finally {
      setSaving(false);
    }
  };

  if (initialView === "list") {
    return (
      <section style={panelStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={titleStyle}>
              Belge Gönderimleri
            </h2>
            <p style={subtitleStyle}>
              Çalışan bazlı atama kayıtları ve e-posta hazırlık durumları
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadAssignments()
            }
            style={secondaryButton}
          >
            {loadingAssignments ? (
              <Loader2 size={16} />
            ) : (
              <Filter size={16} />
            )}
            Yenile
          </button>
        </div>

        {error ? (
          <ErrorBox text={error} />
        ) : null}

        <div
          style={{
            marginTop: 16,
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 1120,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom:
                    "1px solid #e2e8f0",
                }}
              >
                {[
                  "Belge",
                  "Çalışan",
                  "Birim / Görev",
                  "Atama",
                  "Son Tarih",
                  "Durum",
                  "E-posta",
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
              {assignments.map((row) => {
                const badge =
                  statusColor(
                    row.effective_status
                  );

                return (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom:
                        "1px solid #eef2f7",
                    }}
                  >
                    <td style={tdStyle}>
                      <strong>
                        {row.document_title}
                      </strong>
                      <div style={smallText}>
                        V{row.version_no}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      <strong>
                        {row.employee_full_name}
                      </strong>
                      <div style={smallText}>
                        {row.employee_email || "E-posta yok"}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      {row.department || "-"}
                      <div style={smallText}>
                        {row.job_title || "-"}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      {formatDate(
                        row.assigned_at
                      )}
                    </td>

                    <td style={tdStyle}>
                      {formatDate(
                        row.due_at
                      )}
                    </td>

                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "6px 9px",
                          borderRadius: 999,
                          border: `1px solid ${badge.border}`,
                          background:
                            badge.background,
                          color: badge.color,
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        {statusLabel(
                          row.effective_status
                        )}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      {row.email_status ===
                      "NOT_REQUIRED" ? (
                        <span
                          style={{
                            display:
                              "inline-flex",
                            gap: 5,
                            alignItems:
                              "center",
                            color:
                              "#b91c1c",
                            fontWeight:
                              850,
                          }}
                        >
                          <MailX size={14} />
                          E-posta yok
                        </span>
                      ) : (
                        <span
                          style={{
                            display:
                              "inline-flex",
                            gap: 5,
                            alignItems:
                              "center",
                            color:
                              "#92400e",
                            fontWeight:
                              850,
                          }}
                        >
                          <Mail size={14} />
                          {row.email_status}
                        </span>
                      )}
                    </td>

                    <td style={tdStyle}>
                      {row.acknowledgement_code ||
                        "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loadingAssignments &&
          assignments.length === 0 ? (
            <div
              style={{
                minHeight: 220,
                display: "grid",
                placeItems: "center",
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              Henüz belge gönderimi yok.
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section style={panelStyle}>
      <div>
        <h2 style={titleStyle}>
          Yeni Belge Gönderimi
        </h2>
        <p style={subtitleStyle}>
          Yayınlanmış belgeyi tüm çalışanlara, departmana, görev/kadroya
          veya seçtiğiniz kişilere atayın.
        </p>
      </div>

      {error ? (
        <ErrorBox text={error} />
      ) : null}

      {message ? (
        <div
          style={{
            marginTop: 14,
            borderRadius: 13,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            padding: 11,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 850,
          }}
        >
          <CheckCircle2 size={17} />
          {message}
        </div>
      ) : null}

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns:
            "repeat(3,minmax(0,1fr))",
          gap: 12,
        }}
        className="employeeDocAssignmentGrid"
      >
        <Select
          label="Gönderilecek belge"
          value={documentId}
          onChange={setDocumentId}
          options={[
            {
              value: "",
              label:
                publishedDocuments.length
                  ? "Belge seçin"
                  : "Yayınlanmış belge yok",
            },
            ...publishedDocuments.map(
              (document) => ({
                value: document.id,
                label: `${document.title} • V${document.version_no}`,
              })
            ),
          ]}
        />

        <Select
          label="Hedefleme yöntemi"
          value={targetType}
          onChange={(value) => {
            setTargetType(
              value as TargetType
            );
            setSelectedEmployeeIds([]);
          }}
          options={[
            {
              value: "ALL",
              label: "Tüm aktif çalışanlar",
            },
            {
              value: "DEPARTMENT",
              label: "Departman bazlı",
            },
            {
              value: "JOB_TITLE",
              label: "Kadro / görev bazlı",
            },
            {
              value: "MULTI_PERSON",
              label: "Çoklu çalışan seçimi",
            },
            {
              value: "PERSON",
              label: "Tek çalışan",
            },
          ]}
        />

        <label
          style={{
            display: "grid",
            gap: 6,
          }}
        >
          <span style={fieldLabel}>
            Son okuma / onay zamanı
          </span>

          <input
            type="datetime-local"
            value={dueAt}
            onChange={(event) =>
              setDueAt(event.target.value)
            }
            style={fieldInput}
          />
        </label>

        {targetType === "DEPARTMENT" ? (
          <Select
            label="Departman"
            value={department}
            onChange={setDepartment}
            options={[
              {
                value: "",
                label: "Departman seçin",
              },
              ...departments.map(
                (value) => ({
                  value,
                  label: value,
                })
              ),
            ]}
          />
        ) : null}

        {targetType === "JOB_TITLE" ? (
          <Select
            label="Görev / kadro"
            value={jobTitle}
            onChange={setJobTitle}
            options={[
              {
                value: "",
                label:
                  "Görev / kadro seçin",
              },
              ...jobTitles.map(
                (value) => ({
                  value,
                  label: value,
                })
              ),
            ]}
          />
        ) : null}
      </div>

      {(targetType === "PERSON" ||
        targetType === "MULTI_PERSON") ? (
        <div
          style={{
            marginTop: 17,
            border:
              "1px solid #e5e7eb",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 12,
              background: "#f8fafc",
              borderBottom:
                "1px solid #e5e7eb",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Search
              size={16}
              color="#64748b"
            />

            <input
              value={employeeSearch}
              onChange={(event) =>
                setEmployeeSearch(
                  event.target.value
                )
              }
              placeholder="Çalışan, departman, görev veya e-posta ara..."
              style={{
                width: "100%",
                border: 0,
                outline: 0,
                background:
                  "transparent",
              }}
            />
          </div>

          <div
            style={{
              maxHeight: 390,
              overflowY: "auto",
            }}
          >
            {loadingEmployees ? (
              <div
                style={{
                  padding: 24,
                  display: "flex",
                  justifyContent:
                    "center",
                }}
              >
                <Loader2 size={20} />
              </div>
            ) : null}

            {filteredEmployees.map(
              (employee) => {
                const checked =
                  selectedEmployeeIds.includes(
                    employee.id
                  );

                return (
                  <label
                    key={employee.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "auto minmax(0,1fr) auto",
                      gap: 10,
                      alignItems: "center",
                      padding: "11px 12px",
                      borderBottom:
                        "1px solid #eef2f7",
                      cursor: "pointer",
                      background: checked
                        ? "#f5f3ff"
                        : "#ffffff",
                    }}
                  >
                    <input
                      type={
                        targetType === "PERSON"
                          ? "radio"
                          : "checkbox"
                      }
                      name={
                        targetType === "PERSON"
                          ? "employee-document-person"
                          : undefined
                      }
                      checked={checked}
                      onChange={() => {
                        if (
                          targetType ===
                          "PERSON"
                        ) {
                          setSelectedEmployeeIds([
                            employee.id,
                          ]);
                          return;
                        }

                        setSelectedEmployeeIds(
                          (current) =>
                            checked
                              ? current.filter(
                                  (id) =>
                                    id !==
                                    employee.id
                                )
                              : [
                                  ...current,
                                  employee.id,
                                ]
                        );
                      }}
                    />

                    <div>
                      <div
                        style={{
                          color:
                            "#0f172a",
                          fontWeight:
                            900,
                        }}
                      >
                        {employee.full_name}
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          color:
                            "#64748b",
                          fontSize: 11,
                        }}
                      >
                        {employee.department ||
                          "Departman yok"}{" "}
                        •{" "}
                        {employee.job_title ||
                          "Görev yok"}
                      </div>
                    </div>

                    <div
                      style={{
                        color:
                          employee.email
                            ? "#166534"
                            : "#b91c1c",
                        fontSize: 11,
                        fontWeight: 850,
                      }}
                    >
                      {employee.email ||
                        "E-posta yok"}
                    </div>
                  </label>
                );
              }
            )}
          </div>
        </div>
      ) : null}

      <div
        style={{
          marginTop: 17,
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={summaryPill}>
            <Users size={14} />
            Hedef: {selectedCount} çalışan
          </span>

          <span style={summaryPill}>
            <Mail size={14} />
            Atama sonrası portal bağlantısı e-posta ile gönderilir
          </span>
        </div>

        <button
          type="button"
          disabled={
            saving ||
            selectedCount <= 0 ||
            !documentId
          }
          onClick={() => void submit()}
          style={{
            ...primaryButton,
            opacity:
              saving ||
              selectedCount <= 0 ||
              !documentId
                ? 0.55
                : 1,
            cursor:
              saving ||
              selectedCount <= 0 ||
              !documentId
                ? "not-allowed"
                : "pointer",
          }}
        >
          {saving ? (
            <Loader2 size={17} />
          ) : (
            <Send size={17} />
          )}
          Belge Atamasını Oluştur
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 980px) {
          .employeeDocAssignmentGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
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

const fieldLabel: React.CSSProperties = {
  color: "#334155",
  fontSize: 12,
  fontWeight: 900,
};

const fieldInput: React.CSSProperties = {
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
  minHeight: 43,
  borderRadius: 12,
  border: 0,
  background: "#6d28d9",
  color: "#ffffff",
  padding: "0 15px",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 900,
};

const secondaryButton: React.CSSProperties = {
  minHeight: 39,
  borderRadius: 11,
  border: "1px solid #dbe3ec",
  background: "#ffffff",
  color: "#475569",
  padding: "0 12px",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontWeight: 850,
  cursor: "pointer",
};

const summaryPill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  borderRadius: 999,
  padding: "7px 10px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: 12,
  fontWeight: 850,
};

const thStyle: React.CSSProperties = {
  padding: "12px 10px",
  textAlign: "left",
  color: "#475569",
  fontSize: 12,
  fontWeight: 900,
};

const tdStyle: React.CSSProperties = {
  padding: "13px 10px",
  color: "#475569",
  fontSize: 12,
};

const smallText: React.CSSProperties = {
  marginTop: 4,
  color: "#94a3b8",
  fontSize: 11,
};

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: 6,
      }}
    >
      <span style={fieldLabel}>
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={fieldInput}
      >
        {options.map((option) => (
          <option
            key={`${label}-${option.value}`}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
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
        borderRadius: 13,
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#b91c1c",
        padding: 11,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        fontWeight: 850,
      }}
    >
      <AlertTriangle size={17} />
      {text}
    </div>
  );
}