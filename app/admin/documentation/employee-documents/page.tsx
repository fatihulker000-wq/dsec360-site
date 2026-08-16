"use client";

import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  FilePlus2,
  FileSearch,
  FileText,
  Filter,
  LayoutDashboard,
  Loader2,
  MailCheck,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import EmployeeDocumentFileUploader, {
  type UploadedEmployeeDocumentFile,
} from "@/components/documentation/employee-documents/EmployeeDocumentFileUploader";

import EmployeeDocumentAssignmentCenter from "@/components/documentation/employee-documents/EmployeeDocumentAssignmentCenter";

type MainTab =
  | "DASHBOARD"
  | "LIBRARY"
  | "NEW_ASSIGNMENT"
  | "ASSIGNMENTS"
  | "READING"
  | "ANALYTICS"
  | "REPORTS"
  | "LOGS";

type CompanyItem = {
  id: string;
  name: string;
};

type CompanyResponse = {
  data?: Array<{
    id?: string | number | null;
    name?: string | null;
    title?: string | null;
    company_name?: string | null;
    is_active?: boolean | null;
  }>;
  error?: string;
  message?: string;
};

type EmployeeDocument = {
  id: string;
  firm_id: string;
  title: string;
  document_type: string;
  description?: string | null;
  file_url: string;
  file_name?: string | null;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  sha256_hash?: string | null;
  version_no: number;
  version_label?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  requires_acknowledgement: boolean;
  reading_policy: "STANDARD" | "CONTROLLED" | "STRICT";
  min_active_read_seconds: number;
  require_last_page: boolean;
  require_all_pages: boolean;
  page_count?: number | null;
  default_due_days?: number | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
};

type DocumentResponse = {
  success?: boolean;
  data?: EmployeeDocument[];
  error?: string;
  detail?: string;
};

type CreateForm = {
  title: string;
  documentType: string;
  description: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256Hash: string;
  versionNo: string;
  versionLabel: string;
  status: "DRAFT" | "PUBLISHED";
  readingPolicy: "STANDARD" | "CONTROLLED" | "STRICT";
  minActiveReadSeconds: string;
  pageCount: string;
  defaultDueDays: string;
  requiresAcknowledgement: boolean;
  requireLastPage: boolean;
  requireAllPages: boolean;
};

const EMPTY_FORM: CreateForm = {
  title: "",
  documentType: "ISG_TALIMATI",
  description: "",
  fileUrl: "",
  fileName: "",
  mimeType: "",
  fileSizeBytes: 0,
  sha256Hash: "",
  versionNo: "1",
  versionLabel: "V1",
  status: "DRAFT",
  readingPolicy: "CONTROLLED",
  minActiveReadSeconds: "120",
  pageCount: "",
  defaultDueDays: "7",
  requiresAcknowledgement: true,
  requireLastPage: true,
  requireAllPages: false,
};

const DOCUMENT_TYPES = [
  ["ISG_TALIMATI", "İSG Talimatı"],
  ["KKD_ZIMMET", "KKD Teslim / Zimmet Tutanağı"],
  ["TALIMAT_TAAHHUTNAME", "Talimat ve Taahhütname"],
  ["ISE_OZGÜ_TALIMAT", "İşe Özgü Talimat"],
  ["ACIL_DURUM_BILGILENDIRME", "Acil Durum Bilgilendirmesi"],
  ["PROSEDUR_POLITIKA", "Prosedür / Politika"],
  ["EKIPMAN_TALIMATI", "Ekipman Kullanım Talimatı"],
  ["GENEL_BILGILENDIRME", "Genel Bilgilendirme"],
  ["DIGER", "Diğer"],
] as const;

const tabs: Array<{
  value: MainTab;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "DASHBOARD", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { value: "LIBRARY", label: "Belge Havuzu", icon: <FileSearch size={17} /> },
  { value: "NEW_ASSIGNMENT", label: "Yeni Gönderim", icon: <Send size={17} /> },
  { value: "ASSIGNMENTS", label: "Gönderimler", icon: <MailCheck size={17} /> },
  { value: "READING", label: "Okuma & Onay", icon: <BookOpenCheck size={17} /> },
  { value: "ANALYTICS", label: "Analiz", icon: <BarChart3 size={17} /> },
  { value: "REPORTS", label: "Raporlar", icon: <FileCheck2 size={17} /> },
  { value: "LOGS", label: "İşlem Logları", icon: <Activity size={17} /> },
];

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
  const total = Math.max(0, Number(value || 0));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  if (minutes <= 0) return `${seconds} sn`;
  if (seconds === 0) return `${minutes} dk`;
  return `${minutes} dk ${seconds} sn`;
}

function documentTypeLabel(value: string) {
  return (
    DOCUMENT_TYPES.find(([code]) => code === value)?.[1] ||
    value
  );
}

function statusConfig(status: string) {
  switch (status) {
    case "PUBLISHED":
      return {
        label: "Yayında",
        color: "#166534",
        background: "#f0fdf4",
        border: "#bbf7d0",
      };

    case "ARCHIVED":
      return {
        label: "Arşiv",
        color: "#475569",
        background: "#f8fafc",
        border: "#cbd5e1",
      };

    default:
      return {
        label: "Taslak",
        color: "#92400e",
        background: "#fffbeb",
        border: "#fde68a",
      };
  }
}

function policyLabel(policy: string) {
  if (policy === "STRICT") return "Sıkı";
  if (policy === "STANDARD") return "Standart";
  return "Kontrollü";
}

export default function EmployeeDocumentManagementPage() {
  const [mainTab, setMainTab] =
    useState<MainTab>("DASHBOARD");

  const [companies, setCompanies] =
    useState<CompanyItem[]>([]);

  const [selectedCompanyId, setSelectedCompanyId] =
    useState("");

  const [documents, setDocuments] =
    useState<EmployeeDocument[]>([]);

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [typeFilter, setTypeFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [actionId, setActionId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [form, setForm] =
    useState<CreateForm>(EMPTY_FORM);

  const selectedCompany = useMemo(
    () =>
      companies.find(
        (item) => item.id === selectedCompanyId
      ) || null,
    [companies, selectedCompanyId]
  );

  const loadCompanies = useCallback(async () => {
    const response = await fetch(
      "/api/admin/companies",
      {
        cache: "no-store",
        credentials: "include",
      }
    );

    const json: CompanyResponse =
      await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        json.error ||
          json.message ||
          "Firmalar alınamadı."
      );
    }

    const rows = (
      Array.isArray(json.data) ? json.data : []
    )
      .map((item) => ({
        id: String(item.id || "").trim(),
        name: String(
          item.name ||
            item.title ||
            item.company_name ||
            ""
        ).trim(),
        active: item.is_active !== false,
      }))
      .filter(
        (item) =>
          item.id &&
          item.name &&
          item.active
      )
      .map(({ id, name }) => ({ id, name }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, "tr")
      );

    setCompanies(rows);
    setSelectedCompanyId(
      (current) => current || rows[0]?.id || ""
    );
  }, []);

  const loadDocuments = useCallback(
    async (firmId?: string) => {
      const targetFirmId =
        firmId || selectedCompanyId;

      if (!targetFirmId) {
        setDocuments([]);
        return;
      }

      const params = new URLSearchParams();
      params.set("firmId", targetFirmId);

      const response = await fetch(
        `/api/admin/employee-documents?${params.toString()}`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const json: DocumentResponse =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.detail ||
            json.error ||
            "Belgeler alınamadı."
        );
      }

      setDocuments(
        Array.isArray(json.data)
          ? json.data
          : []
      );
    },
    [selectedCompanyId]
  );

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      await loadCompanies();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Çalışan Belge Yönetimi yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }, [loadCompanies]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!selectedCompanyId) return;

    void (async () => {
      try {
        setLoading(true);
        setError("");
        await loadDocuments(selectedCompanyId);
      } catch (cause) {
        setDocuments([]);
        setError(
          cause instanceof Error
            ? cause.message
            : "Belgeler yüklenemedi."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCompanyId, loadDocuments]);

  const filteredDocuments = useMemo(() => {
    const search = searchText
      .trim()
      .toLocaleLowerCase("tr-TR");

    return documents.filter((item) => {
      if (
        statusFilter !== "all" &&
        item.status !== statusFilter
      ) {
        return false;
      }

      if (
        typeFilter !== "all" &&
        item.document_type !== typeFilter
      ) {
        return false;
      }

      if (!search) return true;

      return [
        item.title,
        item.description || "",
        item.document_type,
        item.file_name || "",
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(search);
    });
  }, [
    documents,
    searchText,
    statusFilter,
    typeFilter,
  ]);

  const dashboard = useMemo(() => {
    const published = documents.filter(
      (item) => item.status === "PUBLISHED"
    ).length;

    const draft = documents.filter(
      (item) => item.status === "DRAFT"
    ).length;

    const archived = documents.filter(
      (item) => item.status === "ARCHIVED"
    ).length;

    const controlled = documents.filter(
      (item) =>
        item.reading_policy === "CONTROLLED" ||
        item.reading_policy === "STRICT"
    ).length;

    return {
      total: documents.length,
      published,
      draft,
      archived,
      controlled,
    };
  }, [documents]);

  const createDocument = async () => {
    if (!selectedCompanyId) {
      setError("Önce firma seçin.");
      return;
    }

    if (!form.title.trim()) {
      setError("Belge adı zorunludur.");
      return;
    }

    if (!form.fileUrl.trim()) {
      setError(
        "Bu pakette belge dosya URL bilgisi zorunludur. Dosya yükleme alanı sonraki pakette Supabase Storage ile bağlanacaktır."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        "/api/admin/employee-documents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            firmId: selectedCompanyId,
            title: form.title.trim(),
            documentType: form.documentType,
            description:
              form.description.trim(),
            fileUrl: form.fileUrl.trim(),
            fileName:
              form.fileName.trim() || null,
            mimeType:
              form.mimeType || null,
            fileSizeBytes:
              form.fileSizeBytes || null,
            sha256Hash:
              form.sha256Hash || null,
            versionNo:
              Number(form.versionNo || 1),
            versionLabel:
              form.versionLabel.trim() || null,
            status: form.status,
            readingPolicy:
              form.readingPolicy,
            minActiveReadSeconds:
              Number(
                form.minActiveReadSeconds || 0
              ),
            pageCount:
              form.pageCount
                ? Number(form.pageCount)
                : null,
            defaultDueDays:
              form.defaultDueDays
                ? Number(form.defaultDueDays)
                : null,
            requiresAcknowledgement:
              form.requiresAcknowledgement,
            requireLastPage:
              form.requireLastPage,
            requireAllPages:
              form.requireAllPages,
          }),
        }
      );

      const json =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.detail ||
            json?.error ||
            "Belge oluşturulamadı."
        );
      }

      setForm(EMPTY_FORM);
      setShowCreate(false);
      setMessage(
        "Belge havuza başarıyla eklendi."
      );

      await loadDocuments(selectedCompanyId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Belge oluşturulurken hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (
    id: string,
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  ) => {
    try {
      setActionId(id);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/employee-documents/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );

      const json =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.detail ||
            json?.error ||
            "Belge güncellenemedi."
        );
      }

      setMessage(
        status === "PUBLISHED"
          ? "Belge yayınlandı."
          : status === "ARCHIVED"
          ? "Belge arşivlendi."
          : "Belge taslağa alındı."
      );

      await loadDocuments(selectedCompanyId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Belge durumu değiştirilemedi."
      );
    } finally {
      setActionId(null);
    }
  };

  const deleteDocument = async (
    document: EmployeeDocument
  ) => {
    const confirmed = window.confirm(
      `"${document.title}" belgesini silmek istediğinize emin misiniz? Çalışanlara atanmış belgeler silinemez.`
    );

    if (!confirmed) return;

    try {
      setActionId(document.id);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/employee-documents/${document.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const json =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json?.detail ||
            json?.error ||
            "Belge silinemedi."
        );
      }

      setMessage("Belge havuzdan kaldırıldı.");
      await loadDocuments(selectedCompanyId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Belge silinirken hata oluştu."
      );
    } finally {
      setActionId(null);
    }
  };

  const renderPlaceholder = (
    title: string,
    description: string
  ) => (
    <section style={panelStyle}>
      <div
        style={{
          minHeight: 330,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 620 }}>
          <ShieldCheck
            size={48}
            color="#7c3aed"
          />

          <h2
            style={{
              margin: "14px 0 0",
              color: "#0f172a",
              fontSize: 25,
              fontWeight: 950,
            }}
          >
            {title}
          </h2>

          <p
            style={{
              margin: "9px 0 0",
              color: "#64748b",
              lineHeight: 1.7,
            }}
          >
            {description}
          </p>

          <div
            style={{
              marginTop: 17,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 999,
              background: "#f5f3ff",
              border: "1px solid #ddd6fe",
              color: "#6d28d9",
              padding: "8px 12px",
              fontWeight: 900,
              fontSize: 12,
            }}
          >
            Paket altyapısı hazır • Sonraki aşamada aktif olacak
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f8fafc 0%,#f5f3ff 100%)",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 1540,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        <section
          style={{
            borderRadius: 28,
            background:
              "linear-gradient(135deg,#312e81 0%,#6d28d9 48%,#9333ea 100%)",
            color: "#ffffff",
            padding: 25,
            boxShadow:
              "0 24px 60px rgba(91,33,182,0.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "flex-start",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: 800 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 999,
                  padding: "7px 11px",
                  background:
                    "rgba(255,255,255,0.13)",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                <FileCheck2 size={16} />
                D-SEC Dokümantasyon Merkezi
              </div>

              <h1
                style={{
                  margin: "14px 0 0",
                  fontSize: 34,
                  lineHeight: 1.12,
                  fontWeight: 950,
                  letterSpacing: "-0.03em",
                }}
              >
                Çalışan Belge Yönetimi
              </h1>

              <p
                style={{
                  margin: "10px 0 0",
                  color:
                    "rgba(255,255,255,0.86)",
                  maxWidth: 780,
                  lineHeight: 1.65,
                }}
              >
                Çalışanlara talimat, zimmet,
                taahhütname ve bilgilendirme
                belgeleri gönderin; okunma,
                aktif görüntüleme ve elektronik
                onay süreçlerini yönetin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                void (async () => {
                  try {
                    setLoading(true);
                    setError("");
                    await Promise.all([
                      loadCompanies(),
                      loadDocuments(
                        selectedCompanyId
                      ),
                    ]);
                  } catch (cause) {
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : "Yenileme başarısız."
                    );
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
              disabled={loading}
              style={{
                minHeight: 44,
                borderRadius: 14,
                border:
                  "1px solid rgba(255,255,255,0.24)",
                background:
                  "rgba(255,255,255,0.13)",
                color: "#ffffff",
                padding: "0 15px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 900,
                cursor: loading
                  ? "wait"
                  : "pointer",
              }}
            >
              {loading ? (
                <Loader2
                  size={17}
                  className="employeeDocSpin"
                />
              ) : (
                <RefreshCw size={17} />
              )}
              Yenile
            </button>
          </div>

          <div
            className="employeeDocHeroGrid"
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns:
                "repeat(5,minmax(0,1fr))",
              gap: 10,
            }}
          >
            {[
              {
                label: "Toplam Belge",
                value: dashboard.total,
              },
              {
                label: "Yayında",
                value: dashboard.published,
              },
              {
                label: "Taslak",
                value: dashboard.draft,
              },
              {
                label: "Kontrollü Okuma",
                value: dashboard.controlled,
              },
              {
                label: "Arşiv",
                value: dashboard.archived,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  borderRadius: 17,
                  padding: 15,
                  background:
                    "rgba(255,255,255,0.12)",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div
                  style={{
                    color:
                      "rgba(255,255,255,0.76)",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {item.label}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 26,
                    fontWeight: 950,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {error ? (
          <section
            style={{
              border:
                "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              borderRadius: 16,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontWeight: 800,
            }}
          >
            <AlertTriangle size={18} />
            {error}
          </section>
        ) : null}

        {message ? (
          <section
            style={{
              border:
                "1px solid #bbf7d0",
              background: "#f0fdf4",
              color: "#166534",
              borderRadius: 16,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontWeight: 800,
            }}
          >
            <CheckCircle2 size={18} />
            {message}
          </section>
        ) : null}

        <section
          style={{
            borderRadius: 18,
            border:
              "1px solid #e5e7eb",
            background: "#ffffff",
            padding: 10,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {tabs.map((tab) => {
              const active =
                mainTab === tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() =>
                    setMainTab(tab.value)
                  }
                  style={{
                    minHeight: 41,
                    borderRadius: 12,
                    border: active
                      ? "1px solid #6d28d9"
                      : "1px solid transparent",
                    background: active
                      ? "#6d28d9"
                      : "#f8fafc",
                    color: active
                      ? "#ffffff"
                      : "#475569",
                    padding: "0 13px",
                    display:
                      "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    fontWeight: 900,
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <label
            style={{
              minWidth: 280,
              height: 43,
              borderRadius: 12,
              border:
                "1px solid #dbe3ec",
              padding: "0 11px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#ffffff",
            }}
          >
            <Users
              size={16}
              color="#64748b"
            />

            <select
              value={selectedCompanyId}
              onChange={(event) =>
                setSelectedCompanyId(
                  event.target.value
                )
              }
              style={{
                width: "100%",
                border: 0,
                outline: 0,
                background:
                  "transparent",
                color: "#334155",
                fontWeight: 800,
              }}
            >
              {companies.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        {mainTab === "DASHBOARD" ? (
          <div
            style={{
              display: "grid",
              gap: 18,
            }}
          >
            <section style={panelStyle}>
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
                  <h2 style={sectionTitle}>
                    Belge Süreci
                  </h2>
                  <p style={sectionSubtitle}>
                    {selectedCompany
                      ? `${selectedCompany.name} için çalışan belge yönetimi`
                      : "Firma seçimi yapın"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMainTab("LIBRARY");
                    setShowCreate(true);
                  }}
                  style={primaryButton}
                >
                  <Plus size={17} />
                  Yeni Belge
                </button>
              </div>

              <div
                className="employeeDocProcessGrid"
                style={{
                  marginTop: 17,
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4,minmax(0,1fr))",
                  gap: 12,
                }}
              >
                {[
                  {
                    icon: <FilePlus2 size={23} />,
                    title: "1. Belge Havuzu",
                    text:
                      "Talimat, zimmet, taahhütname ve bilgilendirme belgelerini oluşturun.",
                  },
                  {
                    icon: <Send size={23} />,
                    title: "2. Çalışanlara Ata",
                    text:
                      "Tüm çalışan, departman, görev veya kişi bazlı gönderim yapın.",
                  },
                  {
                    icon: <BookOpenCheck size={23} />,
                    title: "3. Okuma & Onay",
                    text:
                      "Aktif okuma süresini, sayfa görüntülemeyi ve onay kodunu kaydedin.",
                  },
                  {
                    icon: <BarChart3 size={23} />,
                    title: "4. Analiz & Rapor",
                    text:
                      "Okuyan, okumayan, onaylayan ve geciken çalışanları analiz edin.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      border:
                        "1px solid #e5e7eb",
                      background:
                        "#fafafa",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 45,
                        height: 45,
                        borderRadius: 14,
                        display: "grid",
                        placeItems:
                          "center",
                        color: "#6d28d9",
                        background:
                          "#f5f3ff",
                      }}
                    >
                      {item.icon}
                    </div>

                    <div
                      style={{
                        marginTop: 13,
                        fontWeight: 950,
                        color: "#0f172a",
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        color: "#64748b",
                        fontSize: 12,
                        lineHeight: 1.55,
                      }}
                    >
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={panelStyle}>
              <h2 style={sectionTitle}>
                Son Belgeler
              </h2>

              <p style={sectionSubtitle}>
                Belge havuzuna son eklenen kayıtlar
              </p>

              <div
                style={{
                  marginTop: 14,
                  display: "grid",
                  gap: 9,
                }}
              >
                {documents
                  .slice(0, 5)
                  .map((item) => {
                    const badge =
                      statusConfig(item.status);

                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: 12,
                          border:
                            "1px solid #e5e7eb",
                          borderRadius: 14,
                          padding:
                            "12px 14px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              color:
                                "#0f172a",
                              fontWeight: 900,
                            }}
                          >
                            {item.title}
                          </div>

                          <div
                            style={{
                              marginTop: 4,
                              color:
                                "#64748b",
                              fontSize: 12,
                            }}
                          >
                            {documentTypeLabel(
                              item.document_type
                            )}{" "}
                            • V
                            {item.version_no} •{" "}
                            {policyLabel(
                              item.reading_policy
                            )}
                          </div>
                        </div>

                        <span
                          style={{
                            padding:
                              "6px 9px",
                            borderRadius: 999,
                            background:
                              badge.background,
                            border: `1px solid ${badge.border}`,
                            color:
                              badge.color,
                            fontSize: 11,
                            fontWeight: 900,
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}

                {!loading &&
                documents.length === 0 ? (
                  <div
                    style={{
                      minHeight: 130,
                      display: "grid",
                      placeItems:
                        "center",
                      color: "#94a3b8",
                    }}
                  >
                    Henüz çalışan belgesi yok.
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        {mainTab === "LIBRARY" ? (
          <section style={panelStyle}>
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
                <h2 style={sectionTitle}>
                  Belge Havuzu
                </h2>
                <p style={sectionSubtitle}>
                  Çalışanlara gönderilecek
                  kontrollü belgeleri yönetin
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreate(
                    (current) => !current
                  )
                }
                style={primaryButton}
              >
                <Plus size={17} />
                {showCreate
                  ? "Formu Kapat"
                  : "Yeni Belge"}
              </button>
            </div>

            {showCreate ? (
              <div
                style={{
                  marginTop: 18,
                  border:
                    "1px solid #ddd6fe",
                  background:
                    "#faf5ff",
                  borderRadius: 18,
                  padding: 17,
                }}
              >
                <div
                  style={{
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      color: "#6d28d9",
                      fontWeight: 950,
                      fontSize: 12,
                    }}
                  >
                    BELGE HAVUZU
                  </div>

                  <h3
                    style={{
                      margin: "4px 0 0",
                      color: "#0f172a",
                      fontSize: 20,
                      fontWeight: 950,
                    }}
                  >
                    Yeni Çalışan Belgesi
                  </h3>
                </div>

                <div
                  className="employeeDocFormGrid"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3,minmax(0,1fr))",
                    gap: 12,
                  }}
                >
                  <Field
                    label="Belge adı"
                    value={form.title}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        title: value,
                      }))
                    }
                    placeholder="Ör. KKD Teslim ve Zimmet Tutanağı"
                  />

                  <SelectField
                    label="Belge türü"
                    value={
                      form.documentType
                    }
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        documentType: value,
                      }))
                    }
                    options={DOCUMENT_TYPES.map(
                      ([value, label]) => ({
                        value,
                        label,
                      })
                    )}
                  />

                  <SelectField
                    label="Durum"
                    value={form.status}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        status:
                          value as
                            | "DRAFT"
                            | "PUBLISHED",
                      }))
                    }
                    options={[
                      {
                        value: "DRAFT",
                        label: "Taslak",
                      },
                      {
                        value:
                          "PUBLISHED",
                        label: "Yayınla",
                      },
                    ]}
                  />

                  <EmployeeDocumentFileUploader
                    firmId={selectedCompanyId}
                    uploadedFile={
                      form.fileUrl
                        ? {
                            fileUrl: form.fileUrl,
                            fileName: form.fileName,
                            mimeType: form.mimeType,
                            fileSizeBytes: form.fileSizeBytes,
                            sha256Hash: form.sha256Hash,
                          }
                        : null
                    }
                    onUploaded={(file) =>
                      setForm((current) => ({
                        ...current,
                        fileUrl: file.fileUrl,
                        fileName: file.fileName,
                        mimeType: file.mimeType,
                        fileSizeBytes: file.fileSizeBytes,
                        sha256Hash: file.sha256Hash,
                      }))
                    }
                    onClear={() =>
                      setForm((current) => ({
                        ...current,
                        fileUrl: "",
                        fileName: "",
                        mimeType: "",
                        fileSizeBytes: 0,
                        sha256Hash: "",
                      }))
                    }
                  />

                  <SelectField
                    label="Okuma politikası"
                    value={
                      form.readingPolicy
                    }
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        readingPolicy:
                          value as
                            | "STANDARD"
                            | "CONTROLLED"
                            | "STRICT",
                      }))
                    }
                    options={[
                      {
                        value: "STANDARD",
                        label:
                          "Standart — aç + onay",
                      },
                      {
                        value:
                          "CONTROLLED",
                        label:
                          "Kontrollü — süre + son sayfa + onay",
                      },
                      {
                        value: "STRICT",
                        label:
                          "Sıkı — süre + tüm sayfalar + onay",
                      },
                    ]}
                  />

                  <Field
                    label="Minimum aktif okuma (sn)"
                    value={
                      form.minActiveReadSeconds
                    }
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        minActiveReadSeconds:
                          value,
                      }))
                    }
                    type="number"
                  />

                  <Field
                    label="Sayfa sayısı"
                    value={form.pageCount}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        pageCount: value,
                      }))
                    }
                    type="number"
                    placeholder="Ör. 8"
                  />

                  <Field
                    label="Varsayılan son gün"
                    value={
                      form.defaultDueDays
                    }
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        defaultDueDays:
                          value,
                      }))
                    }
                    type="number"
                  />

                  <Field
                    label="Versiyon no"
                    value={form.versionNo}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        versionNo: value,
                      }))
                    }
                    type="number"
                  />

                  <Field
                    label="Versiyon etiketi"
                    value={
                      form.versionLabel
                    }
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        versionLabel:
                          value,
                      }))
                    }
                    placeholder="V1"
                  />
                </div>

                <label
                  style={{
                    display: "grid",
                    gap: 6,
                    marginTop: 12,
                  }}
                >
                  <span
                    style={{
                      color: "#334155",
                      fontSize: 12,
                      fontWeight: 900,
                    }}
                  >
                    Açıklama
                  </span>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description:
                          event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Belgenin amacı ve kapsamı"
                    style={{
                      width: "100%",
                      resize: "vertical",
                      border:
                        "1px solid #dbe3ec",
                      borderRadius: 12,
                      padding: 11,
                      outline: 0,
                      font: "inherit",
                      boxSizing:
                        "border-box",
                    }}
                  />
                </label>

                <div
                  style={{
                    marginTop: 13,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <CheckOption
                    label="Elektronik onay zorunlu"
                    checked={
                      form.requiresAcknowledgement
                    }
                    onChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        requiresAcknowledgement:
                          checked,
                      }))
                    }
                  />

                  <CheckOption
                    label="Son sayfaya ulaşma zorunlu"
                    checked={
                      form.requireLastPage
                    }
                    onChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        requireLastPage:
                          checked,
                      }))
                    }
                  />

                  <CheckOption
                    label="Tüm sayfaları görme zorunlu"
                    checked={
                      form.requireAllPages
                    }
                    onChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        requireAllPages:
                          checked,
                      }))
                    }
                  />
                </div>

                <div
                  style={{
                    marginTop: 15,
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: 12,
                      maxWidth: 720,
                    }}
                  >
                    Belge dosyası özel Supabase Storage alanına yüklenir.
                    Dosyanın SHA-256 özeti kayıt altına alınır ve çalışanlara
                    atanan belge sürümüyle birlikte denetim izi korunur.
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void createDocument()
                    }
                    disabled={saving}
                    style={primaryButton}
                  >
                    {saving ? (
                      <Loader2
                        size={17}
                        className="employeeDocSpin"
                      />
                    ) : (
                      <FilePlus2
                        size={17}
                      />
                    )}
                    Belgeyi Havuzuna Ekle
                  </button>
                </div>
              </div>
            ) : null}

            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns:
                  "minmax(220px,1fr) 220px 240px",
                gap: 10,
              }}
              className="employeeDocFilterGrid"
            >
              <label style={searchField}>
                <Search size={16} />
                <input
                  value={searchText}
                  onChange={(event) =>
                    setSearchText(
                      event.target.value
                    )
                  }
                  placeholder="Belge ara..."
                  style={inputReset}
                />
              </label>

              <label style={searchField}>
                <Filter size={16} />
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  style={inputReset}
                >
                  <option value="all">
                    Tüm durumlar
                  </option>
                  <option value="DRAFT">
                    Taslak
                  </option>
                  <option value="PUBLISHED">
                    Yayında
                  </option>
                  <option value="ARCHIVED">
                    Arşiv
                  </option>
                </select>
              </label>

              <label style={searchField}>
                <FileText size={16} />
                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value
                    )
                  }
                  style={inputReset}
                >
                  <option value="all">
                    Tüm belge türleri
                  </option>

                  {DOCUMENT_TYPES.map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            <div
              style={{
                marginTop: 16,
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth: 1100,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "#f8fafc",
                      borderBottom:
                        "1px solid #e2e8f0",
                    }}
                  >
                    {[
                      "Belge",
                      "Tür",
                      "Versiyon",
                      "Okuma",
                      "Aktif Süre",
                      "Durum",
                      "Güncelleme",
                      "İşlem",
                    ].map((header) => (
                      <th
                        key={header}
                        style={{
                          padding:
                            "12px 10px",
                          textAlign:
                            "left",
                          color:
                            "#475569",
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredDocuments.map(
                    (item) => {
                      const badge =
                        statusConfig(
                          item.status
                        );

                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom:
                              "1px solid #eef2f7",
                          }}
                        >
                          <td
                            style={{
                              padding:
                                "13px 10px",
                            }}
                          >
                            <div
                              style={{
                                fontWeight:
                                  900,
                                color:
                                  "#0f172a",
                              }}
                            >
                              {item.title}
                            </div>

                            <div
                              style={{
                                marginTop: 4,
                                color:
                                  "#64748b",
                                fontSize: 11,
                              }}
                            >
                              {item.file_name ||
                                item.file_url}
                            </div>
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 10px",
                              color:
                                "#475569",
                              fontWeight:
                                800,
                            }}
                          >
                            {documentTypeLabel(
                              item.document_type
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 10px",
                              color:
                                "#475569",
                              fontWeight:
                                800,
                            }}
                          >
                            V
                            {item.version_no}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 10px",
                              color:
                                "#6d28d9",
                              fontWeight:
                                900,
                            }}
                          >
                            {policyLabel(
                              item.reading_policy
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 10px",
                              color:
                                "#475569",
                            }}
                          >
                            {formatSeconds(
                              item.min_active_read_seconds
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 10px",
                            }}
                          >
                            <span
                              style={{
                                display:
                                  "inline-flex",
                                borderRadius:
                                  999,
                                padding:
                                  "6px 9px",
                                color:
                                  badge.color,
                                background:
                                  badge.background,
                                border: `1px solid ${badge.border}`,
                                fontSize:
                                  11,
                                fontWeight:
                                  900,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 10px",
                              color:
                                "#64748b",
                              fontSize: 12,
                            }}
                          >
                            {formatDate(
                              item.updated_at
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 10px",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                gap: 7,
                                flexWrap:
                                  "wrap",
                              }}
                            >
                              <a
                                href={`/api/admin/employee-documents/${item.id}/file`}
                                target="_blank"
                                rel="noreferrer"
                                style={miniButton}
                              >
                                <FileSearch
                                  size={14}
                                />
                                Aç
                              </a>

                              {item.status !==
                              "PUBLISHED" ? (
                                <button
                                  type="button"
                                  disabled={
                                    actionId ===
                                    item.id
                                  }
                                  onClick={() =>
                                    void updateStatus(
                                      item.id,
                                      "PUBLISHED"
                                    )
                                  }
                                  style={miniButton}
                                >
                                  <CheckCircle2
                                    size={14}
                                  />
                                  Yayınla
                                </button>
                              ) : null}

                              {item.status !==
                              "ARCHIVED" ? (
                                <button
                                  type="button"
                                  disabled={
                                    actionId ===
                                    item.id
                                  }
                                  onClick={() =>
                                    void updateStatus(
                                      item.id,
                                      "ARCHIVED"
                                    )
                                  }
                                  style={miniButton}
                                >
                                  <Archive
                                    size={14}
                                  />
                                  Arşiv
                                </button>
                              ) : null}

                              <button
                                type="button"
                                disabled={
                                  actionId ===
                                  item.id
                                }
                                onClick={() =>
                                  void deleteDocument(
                                    item
                                  )
                                }
                                style={{
                                  ...miniButton,
                                  color:
                                    "#b91c1c",
                                  border:
                                    "1px solid #fecaca",
                                  background:
                                    "#fef2f2",
                                }}
                              >
                                <Trash2
                                  size={14}
                                />
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>

              {!loading &&
              filteredDocuments.length ===
                0 ? (
                <div
                  style={{
                    minHeight: 220,
                    display: "grid",
                    placeItems:
                      "center",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  <div>
                    <FileText
                      size={40}
                    />
                    <div
                      style={{
                        marginTop: 10,
                        fontWeight: 900,
                      }}
                    >
                      Belge bulunamadı
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {mainTab === "NEW_ASSIGNMENT" ? (
          <EmployeeDocumentAssignmentCenter
            firmId={selectedCompanyId}
            documents={documents}
            initialView="new"
          />
        ) : null}

        {mainTab === "ASSIGNMENTS" ? (
          <EmployeeDocumentAssignmentCenter
            firmId={selectedCompanyId}
            documents={documents}
            initialView="list"
          />
        ) : null}

        {mainTab === "READING"
          ? renderPlaceholder(
              "Okuma & Onay Takibi",
              "Belge açılma süresi, aktif okuma süresi, sayfa görüntülemeleri, okundu durumu ve elektronik onay kodları burada izlenecek."
            )
          : null}

        {mainTab === "ANALYTICS"
          ? renderPlaceholder(
              "Çalışan Belge Analizi",
              "Okuyan, okumayan, açıp tamamlamayan, okuduğu halde onaylamayan ve geciken çalışan analizleri burada yer alacak."
            )
          : null}

        {mainTab === "REPORTS"
          ? renderPlaceholder(
              "Belge Raporları",
              "Çalışan Belge Okuma ve Onay Raporu ile Excel/PDF çıktıları burada üretilecek."
            )
          : null}

        {mainTab === "LOGS"
          ? renderPlaceholder(
              "İşlem Logları",
              "ASSIGNED, EMAIL_SENT, DOCUMENT_OPENED, READING_HEARTBEAT, PAGE_VIEWED, DOCUMENT_ACKNOWLEDGED gibi denetim logları burada gösterilecek."
            )
          : null}
      </div>

      <style jsx>{`
        .employeeDocSpin {
          animation: employee-doc-spin 0.9s linear infinite;
        }

        @keyframes employee-doc-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1200px) {
          .employeeDocHeroGrid,
          .employeeDocProcessGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .employeeDocFormGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }

          .employeeDocFilterGrid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 720px) {
          .employeeDocHeroGrid,
          .employeeDocProcessGrid,
          .employeeDocFormGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
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

const sectionTitle: React.CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: 23,
  fontWeight: 950,
};

const sectionSubtitle: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#64748b",
  lineHeight: 1.55,
};

const primaryButton: React.CSSProperties = {
  minHeight: 42,
  borderRadius: 13,
  border: 0,
  background: "#6d28d9",
  color: "#ffffff",
  padding: "0 15px",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 900,
  cursor: "pointer",
};

const miniButton: React.CSSProperties = {
  minHeight: 32,
  borderRadius: 9,
  border: "1px solid #dbe3ec",
  background: "#ffffff",
  color: "#475569",
  padding: "0 9px",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 11,
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none",
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

const inputReset: React.CSSProperties = {
  width: "100%",
  border: 0,
  outline: 0,
  background: "transparent",
  color: "#334155",
  fontWeight: 700,
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: 6,
      }}
    >
      <span
        style={{
          color: "#334155",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        style={{
          height: 42,
          borderRadius: 12,
          border: "1px solid #dbe3ec",
          background: "#ffffff",
          padding: "0 11px",
          outline: 0,
          color: "#334155",
          fontWeight: 700,
        }}
      />
    </label>
  );
}

function SelectField({
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
      <span
        style={{
          color: "#334155",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={{
          height: 42,
          borderRadius: 12,
          border: "1px solid #dbe3ec",
          background: "#ffffff",
          padding: "0 11px",
          outline: 0,
          color: "#334155",
          fontWeight: 700,
        }}
      >
        {options.map((item) => (
          <option
            key={item.value}
            value={item.value}
          >
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        border:
          "1px solid #ddd6fe",
        background: "#ffffff",
        color: "#5b21b6",
        borderRadius: 999,
        padding: "8px 11px",
        fontSize: 12,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
      />
      {label}
    </label>
  );
}