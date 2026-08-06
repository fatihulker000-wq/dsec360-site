"use client";

import {
  AlertTriangle,
  Archive,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileClock,
  FileText,
  FolderArchive,
  GraduationCap,
  HardHat,
  LayoutDashboard,
  Loader2,
  Plus,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDocumentationRecords,
} from "@/lib/documentation/services";

import type {
  DocumentationRecord,
} from "@/lib/documentation/types";

type MainTab =
  | "DASHBOARD"
  | "DOCUMENTS"
  | "FORMS"
  | "REVISIONS";

type DocumentationCategory =
  | "TRAINING"
  | "INSPECTION"
  | "RISK"
  | "FORMS"
  | "INSTRUCTIONS"
  | "BOARD"
  | "EMPLOYEE_REPRESENTATIVE"
  | "PERIODIC_CONTROL";

type CompanyItem = {
  id: string;
  name: string;
  isActive: boolean;
};

type CompaniesResponse = {
  data?: Array<{
    id?: string | number | null;
    name?: string | null;
    title?: string | null;
    company_name?: string | null;
    is_active?: boolean | null;
  }>;
  message?: string;
  error?: string;
};


type CategoryDefinition = {
  value: DocumentationCategory;
  title: string;
  description: string;
  badge: string;
  color: string;
  softColor: string;
  icon: React.ReactNode;
};

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    value: "TRAINING",
    title: "Eğitim Dokümanları",
    description:
      "Sertifikalar, katılım kayıtları ve eğitim belgeleri",
    badge: "Eğitim",
    color: "#b91c1c",
    softColor: "#fef2f2",
    icon: <GraduationCap size={25} />,
  },
  {
    value: "INSPECTION",
    title: "Denetim Formları",
    description:
      "Denetim şablonları ve madde kütüphanesi",
    badge: "Form",
    color: "#9f1239",
    softColor: "#fff1f2",
    icon: <ClipboardCheck size={25} />,
  },
  {
    value: "RISK",
    title: "Risk Dokümanları",
    description:
      "Risk değerlendirmeleri, metodolojiler ve raporlar",
    badge: "Risk",
    color: "#c2410c",
    softColor: "#fff7ed",
    icon: <ShieldCheck size={25} />,
  },
  {
    value: "FORMS",
    title: "Formlar ve Şablonlar",
    description:
      "Ek-2, Ek-1 ve kurumsal form şablonları",
    badge: "Şablon",
    color: "#2563eb",
    softColor: "#eff6ff",
    icon: <FileText size={25} />,
  },
  {
    value: "INSTRUCTIONS",
    title: "Talimatlar ve Prosedürler",
    description:
      "İş talimatları, prosedürler ve politikalar",
    badge: "Prosedür",
    color: "#059669",
    softColor: "#ecfdf5",
    icon: <BookOpenCheck size={25} />,
  },
  {
  value: "BOARD",
  title: "İSG Kurul Merkezi",
  description:
    "Toplantılar, gündemler, katılımcılar, kararlar ve kurul tutanakları",
  badge: "Kurul",
  color: "#ef4444",
  softColor: "#fef2f2",
  icon: <Users size={25} />,
},
  {
    value: "EMPLOYEE_REPRESENTATIVE",
    title: "Çalışan Temsilcisi",
    description:
      "Seçim, görevlendirme ve yeterlilik kayıtları",
    badge: "Temsilci",
    color: "#3b82f6",
    softColor: "#eff6ff",
    icon: <UserCheck size={25} />,
  },
  {
    value: "PERIODIC_CONTROL",
    title: "Periyodik Kontrol ve Ölçümler",
    description:
      "Ekipman kontrolleri ve ortam ölçüm raporları",
    badge: "Kontrol",
    color: "#b45309",
    softColor: "#fffbeb",
    icon: <Wrench size={25} />,
  },
];


function formatDate(value?: number | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function statusLabel(
  status: DocumentationRecord["status"]
) {
  switch (status) {
    case "ACTIVE":
      return "Aktif";

    case "REVISION":
      return "Revizyonda";

    case "EXPIRED":
      return "Süresi Doldu";

    default:
      return "Taslak";
  }
}

function statusStyle(
  status: DocumentationRecord["status"]
) {
  switch (status) {
    case "ACTIVE":
      return {
        color: "#047857",
        background: "#ecfdf5",
        border: "#a7f3d0",
      };

    case "REVISION":
      return {
        color: "#b45309",
        background: "#fffbeb",
        border: "#fde68a",
      };

    case "EXPIRED":
      return {
        color: "#b91c1c",
        background: "#fef2f2",
        border: "#fecaca",
      };

    default:
      return {
        color: "#475569",
        background: "#f8fafc",
        border: "#cbd5e1",
      };
  }
}

export default function DocumentationPage() {
  const [mainTab, setMainTab] =
    useState<MainTab>("DASHBOARD");

  const [companies, setCompanies] =
    useState<CompanyItem[]>([]);

  const [
    selectedCompanyId,
    setSelectedCompanyId,
  ] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<DocumentationCategory | "ALL">(
    "ALL"
  );

  const [records, setRecords] =
  useState<DocumentationRecord[]>([]);

  const [searchText, setSearchText] =
    useState("");

  const [loadingCompanies, setLoadingCompanies] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

const [
  loadingDocuments,
  setLoadingDocuments,
] = useState(false);

  const [error, setError] =
    useState("");

  const selectedCompany = useMemo(
    () =>
      companies.find(
        (company) =>
          company.id === selectedCompanyId
      ) || null,
    [companies, selectedCompanyId]
  );

  const filteredRecords = useMemo(() => {
    const normalizedSearch =
      searchText
        .trim()
        .toLocaleLowerCase("tr-TR");

    return records.filter((record) => {
      const categoryMatches =
        selectedCategory === "ALL" ||
        record.category === selectedCategory;

      const companyMatches =
        !selectedCompanyId ||
        !record.firmId ||
        record.firmId === selectedCompanyId;

      const searchMatches =
        !normalizedSearch ||
        [
          record.title,
          record.documentNo,
          record.revisionNo,
          record.preparedBy,
          record.approvedBy,
        ]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch);

      return (
        categoryMatches &&
        companyMatches &&
        searchMatches
      );
    });
  }, [
    records,
    selectedCategory,
    selectedCompanyId,
    searchText,
  ]);

  const totals = useMemo(() => {
    const now = Date.now();

    const total = filteredRecords.length;

    const active =
      filteredRecords.filter(
        (record) =>
          record.status === "ACTIVE"
      ).length;

    const revision =
      filteredRecords.filter(
        (record) =>
          record.status === "REVISION"
      ).length;

    const expired =
      filteredRecords.filter(
        (record) =>
          record.status === "EXPIRED" ||
          (
            record.validUntilMillis !== null &&
            record.validUntilMillis < now
          )
      ).length;

    const draft =
      filteredRecords.filter(
        (record) =>
          record.status === "DRAFT"
      ).length;

    const revisionSoon =
      filteredRecords.filter(
        (record) =>
          record.validUntilMillis !== null &&
          record.validUntilMillis >= now &&
          record.validUntilMillis <=
            now +
              30 *
                24 *
                60 *
                60 *
                1000
      ).length;

    return {
      total,
      active,
      revision,
      expired,
      draft,
      revisionSoon,
    };
  }, [filteredRecords]);

  const loadCompanies =
    useCallback(async () => {
      try {
        setLoadingCompanies(true);
        setError("");

        const response = await fetch(
          "/api/admin/companies",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const json: CompaniesResponse =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            json.error ||
              json.message ||
              "Firmalar alınamadı."
          );
        }

        const rows = (
          Array.isArray(json.data)
            ? json.data
            : []
        )
          .map(
            (row): CompanyItem => ({
              id: String(
                row.id || ""
              ).trim(),

              name: String(
                row.name ||
                  row.title ||
                  row.company_name ||
                  ""
              ).trim(),

              isActive:
                row.is_active !== false,
            })
          )
          .filter(
            (company) =>
              company.id &&
              company.name &&
              company.isActive
          )
          .sort((a, b) =>
            a.name.localeCompare(
              b.name,
              "tr"
            )
          );

        setCompanies(rows);

        setSelectedCompanyId(
          (current) =>
            current ||
            rows[0]?.id ||
            ""
        );
      } catch (companyError) {
        console.error(
          "Documentation company load error:",
          companyError
        );

        setCompanies([]);

        setError(
          companyError instanceof Error
            ? companyError.message
            : "Firmalar yüklenemedi."
        );
      } finally {
        setLoadingCompanies(false);
      }
    }, []);

const loadDocumentation =
  useCallback(async () => {
    if (!selectedCompanyId) {
      setRecords([]);
      return;
    }

    try {
      setLoadingDocuments(true);
      setError("");

      const rows =
        await getDocumentationRecords(
          selectedCompanyId
        );

      setRecords(rows);
    } catch (error) {
      console.error(
        "Documentation load error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Dokümanlar yüklenemedi."
      );

      setRecords([]);
    } finally {
      setLoadingDocuments(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

useEffect(() => {
  void loadDocumentation();
}, [loadDocumentation]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
  loadCompanies(),
  loadDocumentation(),
]);
    } finally {
      setLoading(false);
    }
  };

const openCategory = (
  category: DocumentationCategory
) => {
  if (category === "TRAINING") {
    window.location.href =
      "/admin/documentation/training-documents";
    return;
  }

  if (category === "INSPECTION") {
    window.location.href =
      "/admin/documentation/inspection-forms";
    return;
  }

if (category === "RISK") {
  window.location.href =
    "/admin/documentation/risk-documents";
  return;
}

  if (category === "BOARD") {
    window.location.href =
      "/admin/documentation/board";
    return;
  }

  if (
    category ===
    "EMPLOYEE_REPRESENTATIVE"
  ) {
    window.location.href =
      "/admin/documentation/employee-representatives";
    return;
  }

  if (category === "PERIODIC_CONTROL") {
    window.location.href =
      "/admin/documentation/periodic-controls";
    return;
  }

  setSelectedCategory(category);
  setMainTab("DOCUMENTS");
};

  const tabs: Array<{
    value: MainTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      value: "DASHBOARD",
      label: "Dashboard",
      icon: <LayoutDashboard size={17} />,
    },
    {
      value: "DOCUMENTS",
      label: "Dokümanlar",
      icon: <FolderArchive size={17} />,
    },
    {
      value: "FORMS",
      label: "Formlar ve Şablonlar",
      icon: <FileText size={17} />,
    },
    {
      value: "REVISIONS",
      label: "Revizyon Merkezi",
      icon: <FileClock size={17} />,
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f8fafc 0%,#fff7ed 100%)",
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
            overflow: "hidden",
            borderRadius: 28,
            background:
              "linear-gradient(135deg,#5f0f1b 0%,#991b1b 48%,#d97706 100%)",
            padding: 25,
            color: "#ffffff",
            boxShadow:
              "0 24px 60px rgba(127,29,29,0.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 18,
              justifyContent:
                "space-between",
              alignItems: "flex-start",
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
                  marginBottom: 14,
                  fontSize: 12,
                  fontWeight: 850,
                }}
              >
                <Archive size={16} />
                D-SEC Dokümantasyon Merkezi
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: 34,
                  lineHeight: 1.12,
                  fontWeight: 950,
                  letterSpacing:
                    "-0.03em",
                }}
              >
                Kurumsal Doküman ve
                Revizyon Yönetimi
              </h1>

              <p
                style={{
                  margin: "10px 0 0",
                  maxWidth: 760,
                  color:
                    "rgba(255,255,255,0.86)",
                  lineHeight: 1.65,
                  fontSize: 15,
                }}
              >
                İSG dokümanlarını,
                formları, talimatları,
                kurul kayıtlarını ve
                kontrol raporlarını firma
                bazında tek merkezden
                yönetin.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleRefresh()
              }
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
                fontWeight: 850,
                cursor: loading
                  ? "wait"
                  : "pointer",
              }}
            >
              {loading ? (
                <Loader2
                  size={17}
                  className="documentationSpin"
                />
              ) : (
                <RefreshCw size={17} />
              )}

              Yenile
            </button>
          </div>

          <div
            className="documentationHeroGrid"
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns:
                "repeat(6,minmax(0,1fr))",
              gap: 10,
            }}
          >
            {[
              {
                label: "Toplam",
                value: totals.total,
              },
              {
                label: "Aktif",
                value: totals.active,
              },
              {
                label: "Revizyonda",
                value: totals.revision,
              },
              {
                label: "Süresi Dolan",
                value: totals.expired,
              },
              {
                label: "Taslak",
                value: totals.draft,
              },
              {
                label: "30 Gün İçinde",
                value: totals.revisionSoon,
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
                    color: "#ffffff",
                    fontSize: 25,
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
            boxShadow:
              "0 10px 28px rgba(15,23,42,0.04)",
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
                    setMainTab(
                      tab.value
                    )
                  }
                  style={{
                    minHeight: 43,
                    borderRadius: 12,
                    border: active
                      ? "1px solid #7f1d1d"
                      : "1px solid transparent",
                    background: active
                      ? "#7f1d1d"
                      : "#f8fafc",
                    color: active
                      ? "#ffffff"
                      : "#475569",
                    padding: "0 15px",
                    display:
                      "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 900,
                    cursor: "pointer",
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
              color: "#64748b",
            }}
          >
            <Building2 size={16} />

            <select
              value={selectedCompanyId}
              disabled={loadingCompanies}
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
              {companies.length === 0 ? (
                <option value="">
                  Firma bulunamadı
                </option>
              ) : null}

              {companies.map(
                (company) => (
                  <option
                    key={company.id}
                    value={company.id}
                  >
                    {company.name}
                  </option>
                )
              )}
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
            <section>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent:
                    "space-between",
                  alignItems: "flex-end",
                  gap: 12,
                  marginBottom: 13,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#0f172a",
                      fontSize: 25,
                      fontWeight: 950,
                    }}
                  >
                    Doküman Alanları
                  </h2>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#64748b",
                    }}
                  >
                    {selectedCompany
                      ? `${selectedCompany.name} için kurumsal doküman merkezi`
                      : "Firma seçimi yapın"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(
                      "ALL"
                    );

                    setMainTab(
                      "DOCUMENTS"
                    );
                  }}
                  style={{
                    minHeight: 42,
                    borderRadius: 13,
                    border: 0,
                    background: "#7f1d1d",
                    color: "#ffffff",
                    padding: "0 15px",
                    display:
                      "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 850,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={17} />
                  Yeni Doküman
                </button>
              </div>

              <div
                className="documentationCategoryGrid"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4,minmax(0,1fr))",
                  gap: 14,
                }}
              >
                {CATEGORY_DEFINITIONS.map(
                  (category) => (
                    <button
                      key={
                        category.value
                      }
                      type="button"
                      onClick={() =>
                        openCategory(
                          category.value
                        )
                      }
                      style={{
                        minHeight: 225,
                        borderRadius: 23,
                        border:
                          "1px solid #e5e7eb",
                        background: "#ffffff",
                        padding: 19,
                        textAlign: "left",
                        cursor: "pointer",
                        boxShadow:
                          "0 12px 30px rgba(15,23,42,0.06)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "flex-start",
                          justifyContent:
                            "space-between",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 53,
                            height: 53,
                            borderRadius: 16,
                            display: "grid",
                            placeItems:
                              "center",
                            color:
                              category.color,
                            background:
                              category.softColor,
                          }}
                        >
                          {category.icon}
                        </div>

                        <span
                          style={{
                            borderRadius: 999,
                            padding:
                              "6px 10px",
                            color:
                              category.color,
                            background:
                              category.softColor,
                            fontSize: 11,
                            fontWeight: 900,
                          }}
                        >
                          {category.badge}
                        </span>
                      </div>

                      <h3
                        style={{
                          margin:
                            "22px 0 0",
                          color: "#0f172a",
                          fontSize: 19,
                          fontWeight: 950,
                        }}
                      >
                        {category.title}
                      </h3>

                      <p
                        style={{
                          margin:
                            "8px 0 0",
                          color: "#64748b",
                          lineHeight: 1.55,
                          fontSize: 13,
                        }}
                      >
                        {
                          category.description
                        }
                      </p>

                      <div
                        style={{
                          marginTop: 22,
                          color:
                            category.color,
                          fontSize: 13,
                          fontWeight: 900,
                        }}
                      >
                        Modülü Aç →
                      </div>
                    </button>
                  )
                )}
              </div>
            </section>

            <section
              style={{
                borderRadius: 22,
                border:
                  "1px solid #e5e7eb",
                background: "#ffffff",
                padding: 19,
                boxShadow:
                  "0 12px 30px rgba(15,23,42,0.05)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: 21,
                  fontWeight: 950,
                }}
              >
                Planlanan İşlemler
              </h2>

              <p
                style={{
                  margin: "5px 0 17px",
                  color: "#64748b",
                }}
              >
                Dokümantasyon merkezine
                eklenecek kurumsal
                özellikler
              </p>

              <div
                className="plannedGrid"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4,minmax(0,1fr))",
                  gap: 11,
                }}
              >
                {[
                  {
                    title:
                      "Revizyon Geçmişi",
                    text:
                      "Her doküman için sürüm takibi",
                    icon: (
                      <FileClock
                        size={21}
                      />
                    ),
                  },
                  {
                    title:
                      "Okundu Onayı",
                    text:
                      "Çalışan ve kullanıcı onayları",
                    icon: (
                      <CheckCircle2
                        size={21}
                      />
                    ),
                  },
                  {
                    title:
                      "QR Doküman Erişimi",
                    text:
                      "Sahada hızlı ve güvenli erişim",
                    icon: (
                      <FileCheck2
                        size={21}
                      />
                    ),
                  },
                  {
                    title:
                      "Eksik Doküman Takibi",
                    text:
                      "Eksik ve süresi dolan kayıt uyarıları",
                    icon: (
                      <AlertTriangle
                        size={21}
                      />
                    ),
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      borderRadius: 17,
                      border:
                        "1px solid #e2e8f0",
                      background:
                        "#f8fafc",
                      padding: 15,
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 13,
                        display: "grid",
                        placeItems:
                          "center",
                        color: "#9f1239",
                        background:
                          "#fff1f2",
                      }}
                    >
                      {item.icon}
                    </div>

                    <div
                      style={{
                        marginTop: 13,
                        color: "#0f172a",
                        fontWeight: 900,
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        color: "#64748b",
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {mainTab === "DOCUMENTS" ? (
          <section
            style={{
              borderRadius: 22,
              border:
                "1px solid #e5e7eb",
              background: "#ffffff",
              padding: 19,
              boxShadow:
                "0 12px 30px rgba(15,23,42,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: 12,
                marginBottom: 17,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontSize: 23,
                    fontWeight: 950,
                  }}
                >
                  Doküman Kayıtları
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#64748b",
                  }}
                >
                  Firma ve kategori bazlı
                  doküman listesi
                </p>
              </div>

              <button
                type="button"
                style={{
                  minHeight: 42,
                  borderRadius: 13,
                  border: 0,
                  background: "#7f1d1d",
                  color: "#ffffff",
                  padding: "0 15px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 850,
                  cursor: "pointer",
                }}
              >
                <Plus size={17} />
                Yeni Doküman
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 17,
              }}
            >
              <label
                style={{
                  flex: "1 1 300px",
                  height: 43,
                  borderRadius: 12,
                  border:
                    "1px solid #dbe3ec",
                  padding: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#ffffff",
                  color: "#64748b",
                }}
              >
                <Search size={16} />

                <input
                  value={searchText}
                  onChange={(event) =>
                    setSearchText(
                      event.target.value
                    )
                  }
                  placeholder="Doküman ara..."
                  style={{
                    width: "100%",
                    border: 0,
                    outline: 0,
                    background:
                      "transparent",
                  }}
                />
              </label>

              <select
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(
                    event.target
                      .value as
                      | DocumentationCategory
                      | "ALL"
                  )
                }
                style={{
                  minWidth: 240,
                  height: 43,
                  borderRadius: 12,
                  border:
                    "1px solid #dbe3ec",
                  background: "#ffffff",
                  padding: "0 11px",
                  color: "#334155",
                  fontWeight: 800,
                }}
              >
                <option value="ALL">
                  Tüm Kategoriler
                </option>

                {CATEGORY_DEFINITIONS.map(
                  (category) => (
                    <option
                      key={
                        category.value
                      }
                      value={
                        category.value
                      }
                    >
                      {category.title}
                    </option>
                  )
                )}
              </select>
            </div>

{loadingDocuments && (
  <div
    style={{
      padding: 30,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 12,
      color: "#64748b",
      fontWeight: 700,
    }}
  >
    <Loader2
      size={20}
      className="documentationSpin"
    />
    Dokümanlar yükleniyor...
  </div>
)}

            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  minWidth: 1040,
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
                      "Doküman",
                      "Kategori",
                      "Doküman No",
                      "Revizyon",
                      "Hazırlayan",
                      "Onaylayan",
                      "Yayın",
                      "Geçerlilik",
                      "Durum",
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
                  {filteredRecords.map(
                    (record) => {
                      const category =
                        CATEGORY_DEFINITIONS.find(
                          (item) =>
                            item.value ===
                            record.category
                        );

                      const badge =
                        statusStyle(
                          record.status
                        );

                      return (
                        <tr
                          key={record.id}
                          style={{
                            borderBottom:
                              "1px solid #eef2f7",
                          }}
                        >
                          <td
                            style={{
                              padding:
                                "13px 10px",
                              color:
                                "#0f172a",
                              fontWeight: 850,
                            }}
                          >
                            {record.title}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 10px",
                              color:
                                category?.color ||
                                "#475569",
                              fontWeight: 800,
                            }}
                          >
                            {category?.badge ||
                              record.category}
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 10px",
                              color:
                                "#475569",
                            }}
                          >
                            {
                              record.documentNo
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 10px",
                              color:
                                "#475569",
                              fontWeight: 800,
                            }}
                          >
                            {
                              record.revisionNo
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 10px",
                              color:
                                "#475569",
                            }}
                          >
                            {
                              record.preparedBy
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 10px",
                              color:
                                "#475569",
                            }}
                          >
                            {
                              record.approvedBy
                            }
                          </td>

                          <td
                            style={{
                              padding:
                                "13px 10px",
                              color:
                                "#475569",
                            }}
                          >
                            {formatDate(
                              record.publishedAtMillis
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
                            {formatDate(
                              record.validUntilMillis
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
                                borderRadius: 999,
                                padding:
                                  "6px 9px",
                                color:
                                  badge.color,
                                background:
                                  badge.background,
                                border: `1px solid ${badge.border}`,
                                fontSize: 11,
                                fontWeight: 900,
                              }}
                            >
                              {statusLabel(
                                record.status
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {!loadingDocuments &&
filteredRecords.length === 0 ? (
              <div
                style={{
                  minHeight: 190,
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                  color: "#94a3b8",
                }}
              >
                <div>
                  <FolderArchive
                    size={38}
                  />

                  <div
                    style={{
                      marginTop: 10,
                      fontWeight: 850,
                    }}
                  >
                    Kayıt bulunamadı
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {mainTab === "FORMS" ? (
          <section
            style={{
              minHeight: 330,
              borderRadius: 22,
              border:
                "1px solid #e5e7eb",
              background: "#ffffff",
              padding: 24,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
            }}
          >
            <div>
              <Scale
                size={46}
                color="#2563eb"
              />

              <h2
                style={{
                  margin: "14px 0 7px",
                  color: "#0f172a",
                }}
              >
                Formlar ve Şablonlar
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                }}
              >
                Sonraki adımda form
                yükleme, şablon oluşturma
                ve PDF işlemleri
                eklenecek.
              </p>
            </div>
          </section>
        ) : null}

        {mainTab === "REVISIONS" ? (
          <section
            style={{
              minHeight: 330,
              borderRadius: 22,
              border:
                "1px solid #e5e7eb",
              background: "#ffffff",
              padding: 24,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
            }}
          >
            <div>
              <FileClock
                size={46}
                color="#b45309"
              />

              <h2
                style={{
                  margin: "14px 0 7px",
                  color: "#0f172a",
                }}
              >
                Revizyon Merkezi
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                }}
              >
                Doküman sürümleri,
                geçerlilik tarihleri ve
                revizyon geçmişi burada
                yönetilecek.
              </p>
            </div>
          </section>
        ) : null}
      </div>

      <style jsx>{`
        .documentationSpin {
          animation: documentation-spin 0.9s
            linear infinite;
        }

        @keyframes documentation-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1200px) {
          .documentationCategoryGrid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;
          }

          .documentationHeroGrid {
            grid-template-columns: repeat(
              3,
              minmax(0, 1fr)
            ) !important;
          }

          .plannedGrid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;
          }
        }

        @media (max-width: 700px) {
          main {
            padding: 12px !important;
          }

          .documentationCategoryGrid,
          .documentationHeroGrid,
          .plannedGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}