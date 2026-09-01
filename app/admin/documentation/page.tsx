"use client";

import {
  AlertTriangle,
  Archive,
  BookOpenCheck,
  Building2,
  ClipboardCheck,
  FileClock,
  FileText,
  FolderArchive,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
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
  | "PERIODIC_CONTROL"
  | "EMPLOYEE_DOCUMENTS"
  | "EMPLOYEE_SURVEYS";

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

type FormStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "PASSIVE"
  | "REVISION";

type FormTemplateRecord = {
  id: string;
  company_id: string | null;
  template_code: string;
  title: string;
  short_title: string | null;
  category: string;
  version_no: number;
  revision_no: number;
  status: FormStatus;
  is_active: boolean;
  is_deleted: boolean;
  updated_at?: string | null;
};

type FormTemplatesResponse = {
  success?: boolean;
  records?: FormTemplateRecord[];
  error?: string;
  detail?: string;
};

type InstructionStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "PASSIVE"
  | "REVISION";

type InstructionRecord = {
  id: string;
  companyId: string | null;
  instructionCode: string;
  title: string;
  shortTitle: string;
  category: string;
  versionNo: number;
  revisionNo: number;
  revisionReason: string;
  status: InstructionStatus;
  isSystem: boolean;
  isActive: boolean;
  isDeleted: boolean;
  requiresReadConfirmation: boolean;
  publishedAt: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type InstructionsResponse = {
  success?: boolean;
  records?: InstructionRecord[];
  error?: string;
  detail?: string;
};

type BoardMeeting = {
  id?: string;
  status?: string;
  isDeleted?: boolean;
  is_deleted?: boolean;
};

type BoardResponse = {
  success?: boolean;
  meetings?: BoardMeeting[];
  data?: BoardMeeting[];
  records?: BoardMeeting[];
  error?: string;
  message?: string;
};

type RepresentativeItem = {
  id?: string;
  status?: string;
  isActive?: boolean;
  is_active?: boolean;
};

type RepresentativesResponse = {
  success?: boolean;
  representatives?: RepresentativeItem[];
  error?: string;
  message?: string;
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

type UnifiedDocumentRow = {
  id: string;
  title: string;
  category: "Form" | "Talimat";
  code: string;
  versionNo: number;
  revisionNo: number;
  status: string;
  updatedAt?: string | null;
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
    value: "EMPLOYEE_DOCUMENTS",
    title: "Çalışan Belge Yönetimi",
    description:
      "Talimat, zimmet, taahhütname ve bilgilendirme belgelerini çalışanlara gönderin; okunma ve onay süreçlerini izleyin",
    badge: "Çalışan",
    color: "#7c3aed",
    softColor: "#f5f3ff",
    icon: <FileText size={25} />,
  },
  {
    value: "EMPLOYEE_SURVEYS",
    title: "Çalışan Anket & Geri Bildirim Merkezi",
    description:
      "Çalışan görüşlerini ölçün, riskli yanıtları analiz edin ve sonuçları aksiyona dönüştürün",
    badge: "Geri Bildirim",
    color: "#0f766e",
    softColor: "#f0fdfa",
    icon: <MessageSquareText size={25} />,
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

function resolveBoardMeetings(
  json: BoardResponse
): BoardMeeting[] {
  if (Array.isArray(json.meetings)) {
    return json.meetings;
  }

  if (Array.isArray(json.data)) {
    return json.data;
  }

  if (Array.isArray(json.records)) {
    return json.records;
  }

  return [];
}

function statusLabel(status: string) {
  switch (status.toUpperCase()) {
    case "PUBLISHED":
    case "ACTIVE":
      return "Aktif";

    case "REVISION":
      return "Revizyonda";

    case "PASSIVE":
      return "Pasif";

    default:
      return "Taslak";
  }
}

function statusStyle(status: string) {
  switch (status.toUpperCase()) {
    case "PUBLISHED":
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

    case "PASSIVE":
      return {
        color: "#64748b",
        background: "#f8fafc",
        border: "#cbd5e1",
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

  const [formTemplates, setFormTemplates] =
    useState<FormTemplateRecord[]>([]);

  const [instructions, setInstructions] =
    useState<InstructionRecord[]>([]);

  const [boardMeetings, setBoardMeetings] =
    useState<BoardMeeting[]>([]);

  const [
    representatives,
    setRepresentatives,
  ] = useState<RepresentativeItem[]>([]);

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

  const loadLiveDocumentation =
    useCallback(async () => {
      if (!selectedCompanyId) {
        setFormTemplates([]);
        setInstructions([]);
        setBoardMeetings([]);
        setRepresentatives([]);
        return;
      }

      try {
        setLoadingDocuments(true);
        setError("");

        /*
         * APP ana ekranıyla aynı kaynaklar:
         * 1) yayımlanmış form şablonları
         * 2) genel + seçili firma talimatları
         * 3) seçili firma kurul toplantıları
         * 4) seçili firma çalışan temsilcileri
         */
        const [
          formsResponse,
          instructionsResponse,
          boardResponse,
          representativesResponse,
        ] = await Promise.all([
          fetch(
            "/api/admin/documentation/form-templates",
            {
              cache: "no-store",
              headers: {
                Accept: "application/json",
              },
            }
          ),
          fetch(
            `/api/admin/documentation/instructions?companyId=${encodeURIComponent(
              selectedCompanyId
            )}`,
            {
              cache: "no-store",
              headers: {
                Accept: "application/json",
              },
            }
          ),
          fetch(
            `/api/admin/documentation/board?firmId=${encodeURIComponent(
              selectedCompanyId
            )}`,
            {
              cache: "no-store",
              credentials: "include",
            }
          ),
          fetch(
            `/api/admin/documentation/employee-representatives?firmId=${encodeURIComponent(
              selectedCompanyId
            )}`,
            {
              cache: "no-store",
              credentials: "include",
            }
          ),
        ]);

        const [
          formsJson,
          instructionsJson,
          boardJson,
          representativesJson,
        ] = await Promise.all([
          formsResponse
            .json()
            .catch(() => ({})) as Promise<FormTemplatesResponse>,
          instructionsResponse
            .json()
            .catch(() => ({})) as Promise<InstructionsResponse>,
          boardResponse
            .json()
            .catch(() => ({})) as Promise<BoardResponse>,
          representativesResponse
            .json()
            .catch(() => ({})) as Promise<RepresentativesResponse>,
        ]);

        if (
          !formsResponse.ok ||
          formsJson.success === false
        ) {
          throw new Error(
            formsJson.detail ||
              formsJson.error ||
              "Form şablonları alınamadı."
          );
        }

        if (
          !instructionsResponse.ok ||
          instructionsJson.success === false
        ) {
          throw new Error(
            instructionsJson.detail ||
              instructionsJson.error ||
              "Talimatlar alınamadı."
          );
        }

        if (
          !boardResponse.ok ||
          boardJson.success === false
        ) {
          throw new Error(
            boardJson.error ||
              boardJson.message ||
              "Kurul kayıtları alınamadı."
          );
        }

        if (
          !representativesResponse.ok ||
          representativesJson.success === false
        ) {
          throw new Error(
            representativesJson.error ||
              representativesJson.message ||
              "Çalışan temsilcileri alınamadı."
          );
        }

        setFormTemplates(
          Array.isArray(formsJson.records)
            ? formsJson.records
            : []
        );

        setInstructions(
          Array.isArray(
            instructionsJson.records
          )
            ? instructionsJson.records
            : []
        );

        setBoardMeetings(
          resolveBoardMeetings(boardJson)
        );

        setRepresentatives(
          Array.isArray(
            representativesJson.representatives
          )
            ? representativesJson.representatives
            : []
        );
      } catch (loadError) {
        console.error(
          "Documentation live load error:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Dokümantasyon verileri yüklenemedi."
        );

        setFormTemplates([]);
        setInstructions([]);
        setBoardMeetings([]);
        setRepresentatives([]);
      } finally {
        setLoadingDocuments(false);
      }
    }, [selectedCompanyId]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    void loadLiveDocumentation();
  }, [loadLiveDocumentation]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadCompanies(),
        loadLiveDocumentation(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * APP ile BİREBİR KPI hesabı.
   *
   * App:
   * formCount = PUBLISHED + active form template
   * instructionCount = PUBLISHED + active + genel/seçili firma
   * boardCount = seçili firmanın toplantıları
   * representativeCount = seçili firmanın temsilcileri
   */
  const liveDashboard = useMemo(() => {
    const publishedForms =
      formTemplates.filter(
        (item) =>
          !item.is_deleted &&
          item.is_active &&
          item.status === "PUBLISHED"
      );

    const publishedInstructions =
      instructions.filter(
        (item) =>
          !item.isDeleted &&
          item.isActive &&
          item.status === "PUBLISHED" &&
          (
            !item.companyId ||
            item.companyId ===
              selectedCompanyId
          )
      );

    const activeMeetings =
      boardMeetings.filter(
        (item) =>
          item.isDeleted !== true &&
          item.is_deleted !== true
      );

    const activeRepresentatives =
      representatives.filter(
        (item) =>
          item.isActive !== false &&
          item.is_active !== false &&
          String(
            item.status || "ACTIVE"
          ).toUpperCase() !==
            "PASSIVE"
      );

    const revision =
      formTemplates.filter(
        (item) =>
          !item.is_deleted &&
          item.status === "REVISION"
      ).length +
      instructions.filter(
        (item) =>
          !item.isDeleted &&
          item.status === "REVISION" &&
          (
            !item.companyId ||
            item.companyId ===
              selectedCompanyId
          )
      ).length;

    const draft =
      formTemplates.filter(
        (item) =>
          !item.is_deleted &&
          item.status === "DRAFT"
      ).length +
      instructions.filter(
        (item) =>
          !item.isDeleted &&
          item.status === "DRAFT" &&
          (
            !item.companyId ||
            item.companyId ===
              selectedCompanyId
          )
      ).length;

    /*
     * Ana Dokümantasyon KPI'larına yalnızca HAM / MASTER
     * dokümanlar dahil edilir.
     *
     * Dahil:
     * - Yayımlanmış form şablonları
     * - Yayımlanmış talimat / prosedür şablonları
     *
     * Dahil değil:
     * - Kurul toplantıları
     * - Çalışan temsilcisi görevlendirmeleri
     * - Doldurulmuş Ek-2 kayıtları
     * - Uygulanmış denetimler
     * - Eğitim katılım / sertifika kayıtları
     * - Periyodik kontrol uygulama kayıtları
     *
     * Bunlar dokümanın kendisi değil, dokümanın uygulanması sonucu
     * oluşan operasyonel kayıtlardır.
     */
    const total =
      publishedForms.length +
      publishedInstructions.length;

    return {
      total,
      active: total,
      revision,
      expired: 0,
      draft,
      revisionSoon: 0,
      formCount:
        publishedForms.length,
      instructionCount:
        publishedInstructions.length,
      boardCount:
        activeMeetings.length,
      representativeCount:
        activeRepresentatives.length,
      publishedForms,
      publishedInstructions,
    };
  }, [
    formTemplates,
    instructions,
    boardMeetings,
    representatives,
    selectedCompanyId,
  ]);

  const unifiedDocuments =
    useMemo<UnifiedDocumentRow[]>(
      () => [
        ...liveDashboard.publishedForms.map(
          (item) => ({
            id: `FORM-${item.id}`,
            title:
              item.short_title ||
              item.title,
            category: "Form" as const,
            code:
              item.template_code,
            versionNo:
              Number(
                item.version_no || 1
              ),
            revisionNo:
              Number(
                item.revision_no || 0
              ),
            status:
              item.status,
            updatedAt:
              item.updated_at,
          })
        ),

        ...liveDashboard
          .publishedInstructions
          .map((item) => ({
            id: `INSTRUCTION-${item.id}`,
            title:
              item.shortTitle ||
              item.title,
            category:
              "Talimat" as const,
            code:
              item.instructionCode,
            versionNo:
              Number(
                item.versionNo || 1
              ),
            revisionNo:
              Number(
                item.revisionNo || 0
              ),
            status:
              item.status,
            updatedAt:
              item.updatedAt,
          })),
      ],
      [liveDashboard]
    );

  const filteredDocuments =
    useMemo(() => {
      const search =
        searchText
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      if (!search) {
        return unifiedDocuments;
      }

      return unifiedDocuments.filter(
        (item) =>
          [
            item.title,
            item.category,
            item.code,
          ]
            .join(" ")
            .toLocaleLowerCase(
              "tr-TR"
            )
            .includes(search)
      );
    }, [
      unifiedDocuments,
      searchText,
    ]);

  const revisionRows =
    useMemo<UnifiedDocumentRow[]>(
      () => [
        ...formTemplates
          .filter(
            (item) =>
              !item.is_deleted &&
              (
                item.status ===
                  "REVISION" ||
                item.status ===
                  "DRAFT"
              )
          )
          .map((item) => ({
            id: `REV-FORM-${item.id}`,
            title:
              item.short_title ||
              item.title,
            category: "Form" as const,
            code:
              item.template_code,
            versionNo:
              Number(
                item.version_no || 1
              ),
            revisionNo:
              Number(
                item.revision_no || 0
              ),
            status:
              item.status,
            updatedAt:
              item.updated_at,
          })),

        ...instructions
          .filter(
            (item) =>
              !item.isDeleted &&
              (
                !item.companyId ||
                item.companyId ===
                  selectedCompanyId
              ) &&
              (
                item.status ===
                  "REVISION" ||
                item.status ===
                  "DRAFT"
              )
          )
          .map((item) => ({
            id:
              `REV-INSTRUCTION-${item.id}`,
            title:
              item.shortTitle ||
              item.title,
            category:
              "Talimat" as const,
            code:
              item.instructionCode,
            versionNo:
              Number(
                item.versionNo || 1
              ),
            revisionNo:
              Number(
                item.revisionNo || 0
              ),
            status:
              item.status,
            updatedAt:
              item.updatedAt,
          })),
      ],
      [
        formTemplates,
        instructions,
        selectedCompanyId,
      ]
    );

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

    if (category === "FORMS") {
      window.location.href =
        "/admin/documentation/form-templates";
      return;
    }

    if (category === "INSTRUCTIONS") {
      window.location.href =
        "/admin/documentation/instructions";
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

    if (
      category ===
      "EMPLOYEE_DOCUMENTS"
    ) {
      window.location.href =
        "/admin/documentation/employee-documents";
      return;
    }

    if (
      category ===
      "EMPLOYEE_SURVEYS"
    ) {
      window.location.href =
        "/admin/documentation/employee-surveys";
      return;
    }

    if (
      category ===
      "PERIODIC_CONTROL"
    ) {
      window.location.href =
        "/admin/documentation/periodic-controls";
    }
  };

  const tabs: Array<{
    value: MainTab;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      value: "DASHBOARD",
      label: "Dashboard",
      icon: (
        <LayoutDashboard size={17} />
      ),
    },
    {
      value: "DOCUMENTS",
      label: "Dokümanlar",
      icon: (
        <FolderArchive size={17} />
      ),
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

  const renderDocumentTable = (
    rows: UnifiedDocumentRow[],
    emptyText: string
  ) => (
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
          minWidth: 820,
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
              "Tür",
              "Kod",
              "Versiyon",
              "Revizyon",
              "Durum",
            ].map((header) => (
              <th
                key={header}
                style={{
                  padding:
                    "12px 10px",
                  textAlign: "left",
                  color: "#475569",
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
          {rows.map((record) => {
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
                      record.category ===
                      "Form"
                        ? "#2563eb"
                        : "#059669",
                    fontWeight: 850,
                  }}
                >
                  {record.category}
                </td>

                <td
                  style={{
                    padding:
                      "13px 10px",
                    color:
                      "#475569",
                  }}
                >
                  {record.code}
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
                  {record.versionNo}
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
                  {record.revisionNo}
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
                      border:
                        `1px solid ${badge.border}`,
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
          })}
        </tbody>
      </table>

      {!loadingDocuments &&
      rows.length === 0 ? (
        <div
          style={{
            minHeight: 190,
            display: "grid",
            placeItems:
              "center",
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
              {emptyText}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

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
              alignItems:
                "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: 800,
              }}
            >
              <div
                style={{
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: 8,
                  borderRadius: 999,
                  padding:
                    "7px 11px",
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
                  margin:
                    "10px 0 0",
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
                padding:
                  "0 15px",
                display:
                  "inline-flex",
                alignItems:
                  "center",
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
                <RefreshCw
                  size={17}
                />
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
                value:
                  liveDashboard.total,
              },
              {
                label: "Aktif",
                value:
                  liveDashboard.active,
              },
              {
                label: "Revizyonda",
                value:
                  liveDashboard.revision,
              },
              {
                label:
                  "Süresi Dolan",
                value:
                  liveDashboard.expired,
              },
              {
                label: "Taslak",
                value:
                  liveDashboard.draft,
              },
              {
                label:
                  "30 Gün İçinde",
                value:
                  liveDashboard.revisionSoon,
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
                    color:
                      "#ffffff",
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
              background:
                "#fef2f2",
              color: "#b91c1c",
              borderRadius: 16,
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontWeight: 800,
            }}
          >
            <AlertTriangle
              size={18}
            />
            {error}
          </section>
        ) : null}

        <section
          style={{
            borderRadius: 18,
            border:
              "1px solid #e5e7eb",
            background:
              "#ffffff",
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
                mainTab ===
                tab.value;

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    if (
                      tab.value ===
                      "FORMS"
                    ) {
                      window.location.href =
                        "/admin/documentation/form-templates";
                      return;
                    }

                    setMainTab(
                      tab.value
                    );
                  }}
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
                    padding:
                      "0 15px",
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: 8,
                    fontWeight: 900,
                    cursor:
                      "pointer",
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
              padding:
                "0 11px",
              display: "flex",
              alignItems:
                "center",
              gap: 8,
              background:
                "#ffffff",
              color:
                "#64748b",
            }}
          >
            <Building2
              size={16}
            />

            <select
              value={
                selectedCompanyId
              }
              disabled={
                loadingCompanies
              }
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
                color:
                  "#334155",
                fontWeight: 800,
              }}
            >
              {companies.length ===
              0 ? (
                <option value="">
                  Firma bulunamadı
                </option>
              ) : null}

              {companies.map(
                (company) => (
                  <option
                    key={
                      company.id
                    }
                    value={
                      company.id
                    }
                  >
                    {
                      company.name
                    }
                  </option>
                )
              )}
            </select>
          </label>
        </section>

        {mainTab ===
        "DASHBOARD" ? (
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
                  flexWrap:
                    "wrap",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-end",
                  gap: 12,
                  marginBottom: 13,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color:
                        "#0f172a",
                      fontSize: 25,
                      fontWeight: 950,
                    }}
                  >
                    Doküman Alanları
                  </h2>

                  <p
                    style={{
                      margin:
                        "5px 0 0",
                      color:
                        "#64748b",
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
                    setMainTab(
                      "DOCUMENTS"
                    );
                  }}
                  style={{
                    minHeight: 42,
                    borderRadius: 13,
                    border: 0,
                    background:
                      "#7f1d1d",
                    color:
                      "#ffffff",
                    padding:
                      "0 15px",
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: 8,
                    fontWeight: 850,
                    cursor:
                      "pointer",
                  }}
                >
                  <Plus size={17} />
                  Dokümanları Gör
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
                        background:
                          "#ffffff",
                        padding: 19,
                        textAlign:
                          "left",
                        cursor:
                          "pointer",
                        boxShadow:
                          "0 12px 30px rgba(15,23,42,0.06)",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
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
                            display:
                              "grid",
                            placeItems:
                              "center",
                            color:
                              category.color,
                            background:
                              category.softColor,
                          }}
                        >
                          {
                            category.icon
                          }
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
                          {
                            category.badge
                          }
                        </span>
                      </div>

                      <h3
                        style={{
                          margin:
                            "22px 0 0",
                          color:
                            "#0f172a",
                          fontSize: 19,
                          fontWeight: 950,
                        }}
                      >
                        {
                          category.title
                        }
                      </h3>

                      <p
                        style={{
                          margin:
                            "8px 0 0",
                          color:
                            "#64748b",
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
                background:
                  "#ffffff",
                padding: 19,
                boxShadow:
                  "0 12px 30px rgba(15,23,42,0.05)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color:
                    "#0f172a",
                  fontSize: 21,
                  fontWeight: 950,
                }}
              >
                Canlı Kayıt Özeti
              </h2>

              <p
                style={{
                  margin:
                    "5px 0 17px",
                  color:
                    "#64748b",
                }}
              >
                Ham dokümanlar ve uygulama kayıtları ayrı gösterilir
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
                      "Formlar",
                    text:
                      `${liveDashboard.formCount} yayınlanmış form • Ana toplama dahil`,
                    icon:
                      <FileText
                        size={21}
                      />,
                  },
                  {
                    title:
                      "Talimatlar",
                    text:
                      `${liveDashboard.instructionCount} yayınlanmış talimat • Ana toplama dahil`,
                    icon:
                      <BookOpenCheck
                        size={21}
                      />,
                  },
                  {
                    title:
                      "Kurul",
                    text:
                      `${liveDashboard.boardCount} toplantı kaydı • Ana toplama dahil değil`,
                    icon:
                      <Users
                        size={21}
                      />,
                  },
                  {
                    title:
                      "Çalışan Temsilcisi",
                    text:
                      `${liveDashboard.representativeCount} aktif kayıt • Ana toplama dahil değil`,
                    icon:
                      <UserCheck
                        size={21}
                      />,
                  },
                ].map((item) => (
                  <div
                    key={
                      item.title
                    }
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
                        display:
                          "grid",
                        placeItems:
                          "center",
                        color:
                          "#9f1239",
                        background:
                          "#fff1f2",
                      }}
                    >
                      {item.icon}
                    </div>

                    <div
                      style={{
                        marginTop: 13,
                        color:
                          "#0f172a",
                        fontWeight: 900,
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        color:
                          "#64748b",
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

        {mainTab ===
        "DOCUMENTS" ? (
          <section
            style={{
              borderRadius: 22,
              border:
                "1px solid #e5e7eb",
              background:
                "#ffffff",
              padding: 19,
              boxShadow:
                "0 12px 30px rgba(15,23,42,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems:
                  "center",
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
                    color:
                      "#0f172a",
                    fontSize: 23,
                    fontWeight: 950,
                  }}
                >
                  Doküman Kayıtları
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color:
                      "#64748b",
                  }}
                >
                  Form ve talimat
                  kütüphanesindeki canlı
                  kayıtlar
                </p>
              </div>
            </div>

            <label
              style={{
                height: 43,
                borderRadius: 12,
                border:
                  "1px solid #dbe3ec",
                padding:
                  "0 12px",
                display: "flex",
                alignItems:
                  "center",
                gap: 8,
                background:
                  "#ffffff",
                color:
                  "#64748b",
                marginBottom: 17,
              }}
            >
              <Search size={16} />

              <input
                value={
                  searchText
                }
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

            {loadingDocuments ? (
              <div
                style={{
                  padding: 30,
                  display: "flex",
                  justifyContent:
                    "center",
                  alignItems:
                    "center",
                  gap: 12,
                  color:
                    "#64748b",
                  fontWeight: 700,
                }}
              >
                <Loader2
                  size={20}
                  className="documentationSpin"
                />
                Dokümanlar yükleniyor...
              </div>
            ) : null}

            {renderDocumentTable(
              filteredDocuments,
              "Kayıt bulunamadı"
            )}
          </section>
        ) : null}

        {mainTab ===
        "REVISIONS" ? (
          <section
            style={{
              borderRadius: 22,
              border:
                "1px solid #e5e7eb",
              background:
                "#ffffff",
              padding: 19,
              boxShadow:
                "0 12px 30px rgba(15,23,42,0.05)",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 23,
                fontWeight: 950,
              }}
            >
              Revizyon Merkezi
            </h2>

            <p
              style={{
                margin:
                  "5px 0 17px",
                color: "#64748b",
              }}
            >
              Revizyondaki ve taslak
              form/talimat kayıtları
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2,minmax(0,1fr))",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  borderRadius: 17,
                  padding: 16,
                  background:
                    "#fffbeb",
                  border:
                    "1px solid #fde68a",
                }}
              >
                <div
                  style={{
                    color:
                      "#92400e",
                    fontWeight: 800,
                  }}
                >
                  Revizyonda
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 27,
                    fontWeight: 950,
                    color:
                      "#b45309",
                  }}
                >
                  {
                    liveDashboard.revision
                  }
                </div>
              </div>

              <div
                style={{
                  borderRadius: 17,
                  padding: 16,
                  background:
                    "#f8fafc",
                  border:
                    "1px solid #cbd5e1",
                }}
              >
                <div
                  style={{
                    color:
                      "#475569",
                    fontWeight: 800,
                  }}
                >
                  Taslak
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 27,
                    fontWeight: 950,
                    color:
                      "#334155",
                  }}
                >
                  {
                    liveDashboard.draft
                  }
                </div>
              </div>
            </div>

            {renderDocumentTable(
              revisionRows,
              "Revizyon veya taslak kayıt yok"
            )}
          </section>
        ) : null}

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
      </div>
    </main>
  );
}
