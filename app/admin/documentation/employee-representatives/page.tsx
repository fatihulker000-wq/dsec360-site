"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type CompanyItem = {
  id: string;
  name: string;
};

type EmployeeItem = {
  id: string;
  firm_id: string;
  full_name: string;
  department?: string | null;
  job_title?: string | null;
  registry_no?: string | null;
  active?: boolean | null;
};

type RepresentativeItem = {
  id: string;
  firmId: string | null;
  employeeId: string | null;
  employeeName: string;
  department: string | null;
  jobTitle: string | null;
  registryNo: string | null;
  representativeType:
    | "PRIMARY"
    | "SUBSTITUTE";
  determinationMethod:
    | "ELECTION"
    | "APPOINTMENT"
    | "AUTHORIZED_UNION";
  isHeadRepresentative: boolean;
  selectionDate: string | null;
  dutyStartDate: string | null;
  dutyEndDate: string | null;
  status:
    | "ACTIVE"
    | "PASSIVE"
    | "EXPIRED"
    | "CANCELLED";
  calculatedStatus:
    | "ACTIVE"
    | "EXPIRING_SOON"
    | "EXPIRED"
    | "PASSIVE"
    | "CANCELLED"
    | "DELETED";
  remainingDays: number | null;
  workplaceSection: string | null;
  shiftName: string | null;
  note: string | null;
};

type ComplianceSummary = {
  employeeCount: number;
  requiredPrimaryCount: number;
  activePrimaryCount: number;
  activeSubstituteCount: number;
  missingPrimaryCount: number;
  headRepresentativeCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  complianceStatus:
    | "NOT_REQUIRED"
    | "CRITICAL"
    | "MISSING"
    | "HEAD_MISSING"
    | "WARNING"
    | "COMPLIANT";
  complianceMessage: string;
};

type ApiResponse = {
  success?: boolean;
  representatives?: RepresentativeItem[];
  employees?: EmployeeItem[];
  companies?: CompanyItem[];
  compliance?: ComplianceSummary | null;
  scope?: {
    role?: string;
    companyId?: string | null;
    readOnly?: boolean;
  };
  error?: string;
  message?: string;
};

type RepresentativeForm = {
  employeeId: string;
  representativeType:
    | "PRIMARY"
    | "SUBSTITUTE";
  determinationMethod:
    | "ELECTION"
    | "APPOINTMENT"
    | "AUTHORIZED_UNION";
  isHeadRepresentative: boolean;
  selectionDate: string;
  dutyStartDate: string;
  dutyEndDate: string;
  workplaceSection: string;
  shiftName: string;
  unionName: string;
  electionReferenceNo: string;
  appointmentReferenceNo: string;
  note: string;
};

const emptyRepresentativeForm: RepresentativeForm = {
  employeeId: "",
  representativeType: "PRIMARY",
  determinationMethod: "ELECTION",
  isHeadRepresentative: false,
  selectionDate: "",
  dutyStartDate: new Date().toISOString().slice(0, 10),
  dutyEndDate: "",
  workplaceSection: "",
  shiftName: "",
  unionName: "",
  electionReferenceNo: "",
  appointmentReferenceNo: "",
  note: "",
};

function statusMeta(
  status?: ComplianceSummary["complianceStatus"]
) {
  switch (status) {
    case "COMPLIANT":
      return {
        title: "Mevzuata Uygun",
        description:
          "Aktif asıl çalışan temsilcisi sayısı gerekliliği karşılıyor.",
        color: "#047857",
        background: "#ecfdf5",
        border: "#a7f3d0",
        icon: <CheckCircle2 size={22} />,
      };

    case "NOT_REQUIRED":
      return {
        title: "Temsilci Zorunluluğu Yok",
        description:
          "Aktif çalışan sayısı iki kişinin altında.",
        color: "#475569",
        background: "#f8fafc",
        border: "#cbd5e1",
        icon: <BadgeCheck size={22} />,
      };

    case "HEAD_MISSING":
      return {
        title: "Baş Temsilci Eksik",
        description:
          "Birden fazla asıl temsilci bulunduğu için baş temsilci belirlenmelidir.",
        color: "#b45309",
        background: "#fffbeb",
        border: "#fde68a",
        icon: <AlertTriangle size={22} />,
      };

    case "WARNING":
      return {
        title: "Takip Gerekiyor",
        description:
          "Süresi dolan veya görev süresi yaklaşan kayıt bulunuyor.",
        color: "#b45309",
        background: "#fffbeb",
        border: "#fde68a",
        icon: <CalendarClock size={22} />,
      };

    case "CRITICAL":
      return {
        title: "Kritik Eksiklik",
        description:
          "Aktif asıl çalışan temsilcisi bulunmuyor.",
        color: "#b91c1c",
        background: "#fef2f2",
        border: "#fecaca",
        icon: <ShieldAlert size={22} />,
      };

    default:
      return {
        title: "Temsilci Eksik",
        description:
          "Yasal gerekliliğe göre eksik asıl çalışan temsilcisi bulunuyor.",
        color: "#b91c1c",
        background: "#fef2f2",
        border: "#fecaca",
        icon: <AlertTriangle size={22} />,
      };
  }
}

function representativeTypeLabel(
  value: RepresentativeItem["representativeType"]
) {
  return value === "SUBSTITUTE"
    ? "Yedek"
    : "Asıl";
}

function determinationLabel(
  value: RepresentativeItem["determinationMethod"]
) {
  if (value === "APPOINTMENT") {
    return "Atama";
  }

  if (value === "AUTHORIZED_UNION") {
    return "Yetkili Sendika";
  }

  return "Seçim";
}

function representativeStatusLabel(
  value: RepresentativeItem["calculatedStatus"]
) {
  switch (value) {
    case "EXPIRING_SOON":
      return "Süresi Yaklaşıyor";

    case "EXPIRED":
      return "Süresi Doldu";

    case "PASSIVE":
      return "Pasif";

    case "CANCELLED":
      return "İptal";

    case "DELETED":
      return "Silindi";

    default:
      return "Aktif";
  }
}

function representativeStatusStyle(
  value: RepresentativeItem["calculatedStatus"]
) {
  if (value === "ACTIVE") {
    return {
      color: "#047857",
      background: "#ecfdf5",
      border: "#a7f3d0",
    };
  }

  if (value === "EXPIRING_SOON") {
    return {
      color: "#b45309",
      background: "#fffbeb",
      border: "#fde68a",
    };
  }

  return {
    color: "#b91c1c",
    background: "#fef2f2",
    border: "#fecaca",
  };
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "tr-TR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(date);
}

export default function EmployeeRepresentativesPage() {
  const [companies, setCompanies] =
    useState<CompanyItem[]>([]);

  const [
    selectedCompanyId,
    setSelectedCompanyId,
  ] = useState("");

  const [employees, setEmployees] =
    useState<EmployeeItem[]>([]);

  const [
    representatives,
    setRepresentatives,
  ] = useState<
    RepresentativeItem[]
  >([]);

  const [
    compliance,
    setCompliance,
  ] =
    useState<ComplianceSummary | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [readOnly, setReadOnly] =
    useState(false);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    editingRepresentative,
    setEditingRepresentative,
  ] =
    useState<RepresentativeItem | null>(
      null
    );

  const [form, setForm] =
    useState<RepresentativeForm>(
      emptyRepresentativeForm
    );

  const [saving, setSaving] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const loadData =
    useCallback(
      async (
        firmId?: string,
        silent = false
      ) => {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const query =
            firmId
              ? `?firmId=${encodeURIComponent(
                  firmId
                )}`
              : "";

          const response =
            await fetch(
              `/api/admin/documentation/employee-representatives${query}`,
              {
                method: "GET",
                credentials:
                  "include",
                cache: "no-store",
              }
            );

          const json: ApiResponse =
            await response
              .json()
              .catch(() => ({}));

          if (
            !response.ok ||
            json.success === false
          ) {
            throw new Error(
              json.error ||
                json.message ||
                "Çalışan temsilcisi verileri alınamadı."
            );
          }

          const nextCompanies =
            Array.isArray(
              json.companies
            )
              ? json.companies
              : [];

          const nextCompanyId =
            String(
              json.scope
                ?.companyId ||
                firmId ||
                nextCompanies[0]
                  ?.id ||
                ""
            ).trim();

          setCompanies(
            nextCompanies
          );

          setEmployees(
            Array.isArray(
              json.employees
            )
              ? json.employees
              : []
          );

          setRepresentatives(
            Array.isArray(
              json.representatives
            )
              ? json.representatives
              : []
          );

          setCompliance(
            json.compliance ||
              null
          );

          setReadOnly(
            json.scope
              ?.readOnly === true
          );

          setSelectedCompanyId(
            nextCompanyId
          );

          if (
            !firmId &&
            nextCompanyId &&
            !json.compliance
          ) {
            window.setTimeout(
              () => {
                void loadData(
                  nextCompanyId,
                  true
                );
              },
              0
            );
          }
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Çalışan temsilcisi verileri yüklenemedi."
          );

          setRepresentatives(
            []
          );

          setEmployees([]);
          setCompliance(null);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedCompany =
    useMemo(
      () =>
        companies.find(
          (company) =>
            String(
              company.id
            ) ===
            String(
              selectedCompanyId
            )
        ) || null,
      [
        companies,
        selectedCompanyId,
      ]
    );

  const status =
    statusMeta(
      compliance
        ?.complianceStatus
    );

  const cards = [
    {
      label:
        "Toplam Çalışan",
      value:
        compliance
          ?.employeeCount ?? 0,
      detail:
        "Aktif çalışan sayısı",
      icon: (
        <Users size={20} />
      ),
    },
    {
      label:
        "Gerekli Asıl Temsilci",
      value:
        compliance
          ?.requiredPrimaryCount ??
        0,
      detail:
        "Mevzuat hesabı",
      icon: (
        <UserCheck
          size={20}
        />
      ),
    },
    {
      label:
        "Aktif Asıl",
      value:
        compliance
          ?.activePrimaryCount ??
        0,
      detail:
        "Görev süresi devam eden",
      icon: (
        <BadgeCheck
          size={20}
        />
      ),
    },
    {
      label:
        "Eksik Temsilci",
      value:
        compliance
          ?.missingPrimaryCount ??
        0,
      detail:
        "Tamamlanması gereken",
      icon: (
        <AlertTriangle
          size={20}
        />
      ),
    },
    {
      label:
        "Aktif Yedek",
      value:
        compliance
          ?.activeSubstituteCount ??
        0,
      detail:
        "Yedek temsilci",
      icon: (
        <Users size={20} />
      ),
    },
    {
      label:
        "Baş Temsilci",
      value:
        compliance
          ?.headRepresentativeCount ??
        0,
      detail:
        "Aktif baş temsilci",
      icon: (
        <UserCheck
          size={20}
        />
      ),
    },
    {
      label:
        "Süresi Dolan",
      value:
        compliance
          ?.expiredCount ?? 0,
      detail:
        "Yenilenmesi gereken",
      icon: (
        <ShieldAlert
          size={20}
        />
      ),
    },
    {
      label:
        "30 Gün İçinde",
      value:
        compliance
          ?.expiringSoonCount ??
        0,
      detail:
        "Süresi yaklaşan",
      icon: (
        <CalendarClock
          size={20}
        />
      ),
    },
  ];



  const openCreateModal = () => {
    setEditingRepresentative(
      null
    );

    setForm({
      ...emptyRepresentativeForm,
      dutyStartDate:
        new Date()
          .toISOString()
          .slice(0, 10),
    });

    setModalOpen(true);
    setError("");
  };

  const openEditModal = (
    item: RepresentativeItem
  ) => {
    setEditingRepresentative(
      item
    );

    setForm({
      employeeId:
        item.employeeId || "",

      representativeType:
        item.representativeType,

      determinationMethod:
        item.determinationMethod,

      isHeadRepresentative:
        item.isHeadRepresentative,

      selectionDate:
        item.selectionDate || "",

      dutyStartDate:
        item.dutyStartDate || "",

      dutyEndDate:
        item.dutyEndDate || "",

      workplaceSection:
        item.workplaceSection || "",

      shiftName:
        item.shiftName || "",

      unionName: "",

      electionReferenceNo:
        "",

      appointmentReferenceNo:
        "",

      note:
        item.note || "",
    });

    setModalOpen(true);
    setError("");
  };

  const saveRepresentative =
    async () => {
      if (!selectedCompanyId) {
        setError(
          "Önce firma seçmelisiniz."
        );
        return;
      }

      if (!form.employeeId) {
        setError(
          "Çalışan seçimi zorunludur."
        );
        return;
      }

      if (!form.dutyStartDate) {
        setError(
          "Görev başlangıç tarihi zorunludur."
        );
        return;
      }

      if (
        form.dutyEndDate &&
        form.dutyEndDate <
          form.dutyStartDate
      ) {
        setError(
          "Görev bitiş tarihi başlangıç tarihinden önce olamaz."
        );
        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await fetch(
            "/api/admin/documentation/employee-representatives",
            {
              method:
                editingRepresentative
                  ? "PUT"
                  : "POST",

              credentials:
                "include",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  ...(editingRepresentative
                    ? {
                        id:
                          editingRepresentative.id,
                      }
                    : {}),

                  firmId:
                    selectedCompanyId,

                  employeeId:
                    form.employeeId,

                  representativeType:
                    form.representativeType,

                  determinationMethod:
                    form.determinationMethod,

                  isHeadRepresentative:
                    form.representativeType ===
                    "PRIMARY"
                      ? form.isHeadRepresentative
                      : false,

                  selectionDate:
                    form.selectionDate ||
                    null,

                  dutyStartDate:
                    form.dutyStartDate,

                  dutyEndDate:
                    form.dutyEndDate ||
                    null,

                  workplaceSection:
                    form.workplaceSection ||
                    null,

                  shiftName:
                    form.shiftName ||
                    null,

                  unionName:
                    form.unionName ||
                    null,

                  electionReferenceNo:
                    form.electionReferenceNo ||
                    null,

                  appointmentReferenceNo:
                    form.appointmentReferenceNo ||
                    null,

                  note:
                    form.note ||
                    null,

                  status:
                    "ACTIVE",
                }),
            }
          );

        const json =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          json?.success === false
        ) {
          throw new Error(
            json?.error ||
              json?.message ||
              "Çalışan temsilcisi kaydedilemedi."
          );
        }

        setModalOpen(false);
        setEditingRepresentative(
          null
        );
        setForm(
          emptyRepresentativeForm
        );

        setSuccess(
          editingRepresentative
            ? "Çalışan temsilcisi güncellendi."
            : "Çalışan temsilcisi eklendi."
        );

        await loadData(
          selectedCompanyId,
          true
        );
      } catch (
        saveError
      ) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Çalışan temsilcisi kaydedilemedi."
        );
      } finally {
        setSaving(false);
      }
    };

  const deleteRepresentative =
    async (
      item: RepresentativeItem
    ) => {
      if (
        !window.confirm(
          `${item.employeeName} çalışan temsilcisi kaydı silinsin mi?`
        )
      ) {
        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const response =
          await fetch(
            `/api/admin/documentation/employee-representatives?id=${encodeURIComponent(
              item.id
            )}`,
            {
              method:
                "DELETE",

              credentials:
                "include",
            }
          );

        const json =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          json?.success === false
        ) {
          throw new Error(
            json?.error ||
              json?.message ||
              "Çalışan temsilcisi silinemedi."
          );
        }

        setSuccess(
          "Çalışan temsilcisi kaydı silindi."
        );

        await loadData(
          selectedCompanyId,
          true
        );
      } catch (
        deleteError
      ) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Çalışan temsilcisi silinemedi."
        );
      } finally {
        setSaving(false);
      }
    };


  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "linear-gradient(180deg,#f8fafc 0%,#eff6ff 100%)",
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
            overflow:
              "hidden",
            borderRadius: 28,
            padding: 25,
            color: "#ffffff",
            background:
              "linear-gradient(135deg,#0f172a 0%,#1d4ed8 58%,#38bdf8 100%)",
            boxShadow:
              "0 24px 60px rgba(30,64,175,.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems:
                "flex-start",
              justifyContent:
                "space-between",
              gap: 18,
            }}
          >
            <div
              style={{
                maxWidth: 820,
              }}
            >
              <Link
                href="/admin/documentation"
                style={{
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: 7,
                  color:
                    "rgba(255,255,255,.85)",
                  textDecoration:
                    "none",
                  fontWeight: 850,
                  fontSize: 13,
                }}
              >
                <ArrowLeft
                  size={16}
                />
                Dokümantasyon
                Merkezine Dön
              </Link>

              <div
                style={{
                  marginTop: 18,
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: 8,
                  padding:
                    "7px 11px",
                  borderRadius: 999,
                  background:
                    "rgba(255,255,255,.13)",
                  fontSize: 12,
                  fontWeight: 850,
                }}
              >
                <UserCheck
                  size={16}
                />
                D-SEC Çalışan
                Temsilcisi Merkezi
              </div>

              <h1
                style={{
                  margin:
                    "14px 0 0",
                  fontSize: 34,
                  lineHeight: 1.12,
                  fontWeight: 950,
                  letterSpacing:
                    "-.03em",
                }}
              >
                Çalışan Temsilcisi
                Yönetimi
              </h1>

              <p
                style={{
                  margin:
                    "10px 0 0",
                  maxWidth: 760,
                  color:
                    "rgba(255,255,255,.84)",
                  lineHeight: 1.65,
                  fontSize: 15,
                }}
              >
                Çalışan sayısına
                göre gerekli temsilci
                sayısını otomatik
                hesaplayın; eksik,
                süresi dolan ve baş
                temsilci eksikliği
                durumlarını tek
                merkezden takip edin.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  void loadData(
                    selectedCompanyId,
                    true
                  )
                }
                disabled={
                  refreshing
                }
                style={{
                  minHeight: 44,
                  borderRadius: 14,
                  border:
                    "1px solid rgba(255,255,255,.25)",
                  background:
                    "rgba(255,255,255,.13)",
                  color: "#fff",
                  padding:
                    "0 15px",
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: 8,
                  fontWeight: 850,
                  cursor:
                    refreshing
                      ? "wait"
                      : "pointer",
                }}
              >
                {refreshing ? (
                  <Loader2
                    size={17}
                    className="representativeSpin"
                  />
                ) : (
                  <RefreshCw
                    size={17}
                  />
                )}
                Yenile
              </button>

              {!readOnly ? (
                <button
                  type="button"
                  onClick={
                    openCreateModal
                  }
                  style={{
                    minHeight: 44,
                    borderRadius: 14,
                    border: 0,
                    background:
                      "#ffffff",
                    color:
                      "#1d4ed8",
                    padding:
                      "0 16px",
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
                  <Plus
                    size={17}
                  />
                  Temsilci Ekle
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section
          style={{
            borderRadius: 18,
            border:
              "1px solid #dbeafe",
            background: "#fff",
            padding: 12,
            display: "flex",
            flexWrap: "wrap",
            alignItems:
              "center",
            justifyContent:
              "space-between",
            gap: 12,
            boxShadow:
              "0 10px 28px rgba(15,23,42,.04)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                fontWeight: 800,
              }}
            >
              İşlem Firması
            </div>

            <div
              style={{
                marginTop: 3,
                color: "#0f172a",
                fontWeight: 950,
              }}
            >
              {selectedCompany
                ?.name ||
                "Firma seçiniz"}
            </div>
          </div>

          <label
            style={{
              minWidth: 300,
              height: 44,
              borderRadius: 13,
              border:
                "1px solid #dbeafe",
              display: "flex",
              alignItems:
                "center",
              gap: 8,
              padding:
                "0 12px",
              background: "#fff",
              color: "#64748b",
            }}
          >
            <Building2
              size={17}
            />

            <select
              value={
                selectedCompanyId
              }
              disabled={
                loading ||
                companies.length ===
                  0
              }
              onChange={(
                event
              ) => {
                const firmId =
                  event.target.value;

                setSelectedCompanyId(
                  firmId
                );

                void loadData(
                  firmId,
                  true
                );
              }}
              style={{
                width: "100%",
                border: 0,
                outline: 0,
                background:
                  "transparent",
                color: "#334155",
                fontWeight: 850,
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

        {success ? (
          <section
            style={{
              borderRadius: 16,
              border:
                "1px solid #a7f3d0",
              background:
                "#ecfdf5",
              color: "#047857",
              padding: 14,
              display: "flex",
              alignItems:
                "center",
              gap: 9,
              fontWeight: 800,
            }}
          >
            <CheckCircle2
              size={18}
            />
            {success}
          </section>
        ) : null}

        {error ? (
          <section
            style={{
              borderRadius: 16,
              border:
                "1px solid #fecaca",
              background:
                "#fef2f2",
              color: "#b91c1c",
              padding: 14,
              display: "flex",
              alignItems:
                "center",
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

        {loading ? (
          <section
            style={{
              minHeight: 320,
              display: "grid",
              placeItems:
                "center",
              borderRadius: 22,
              border:
                "1px solid #e2e8f0",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "grid",
                justifyItems:
                  "center",
                gap: 10,
                color: "#64748b",
                fontWeight: 800,
              }}
            >
              <Loader2
                size={30}
                className="representativeSpin"
              />
              Veriler
              yükleniyor...
            </div>
          </section>
        ) : (
          <>
            <section
              className="representativeCardGrid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4,minmax(0,1fr))",
                gap: 13,
              }}
            >
              {cards.map(
                (card) => (
                  <article
                    key={
                      card.label
                    }
                    style={{
                      borderRadius: 20,
                      border:
                        "1px solid #e2e8f0",
                      background:
                        "#ffffff",
                      padding: 18,
                      boxShadow:
                        "0 10px 28px rgba(15,23,42,.05)",
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
                          "#1d4ed8",
                        background:
                          "#eff6ff",
                      }}
                    >
                      {card.icon}
                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        color:
                          "#64748b",
                        fontSize: 12,
                        fontWeight: 850,
                      }}
                    >
                      {card.label}
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        color:
                          "#0f172a",
                        fontSize: 30,
                        fontWeight: 950,
                      }}
                    >
                      {card.value}
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        color:
                          "#94a3b8",
                        fontSize: 12,
                      }}
                    >
                      {card.detail}
                    </div>
                  </article>
                )
              )}
            </section>

            <section
              style={{
                borderRadius: 22,
                border: `1px solid ${status.border}`,
                background:
                  status.background,
                padding: 20,
                display: "flex",
                alignItems:
                  "flex-start",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  flex: "0 0 auto",
                  borderRadius: 14,
                  display: "grid",
                  placeItems:
                    "center",
                  color:
                    status.color,
                  background:
                    "#ffffff",
                }}
              >
                {status.icon}
              </div>

              <div>
                <div
                  style={{
                    color:
                      status.color,
                    fontSize: 18,
                    fontWeight: 950,
                  }}
                >
                  {status.title}
                </div>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color:
                      status.color,
                    lineHeight: 1.6,
                    fontWeight: 700,
                  }}
                >
                  {compliance
                    ?.complianceMessage ||
                    status.description}
                </p>
              </div>
            </section>

            <section
              style={{
                overflow:
                  "hidden",
                borderRadius: 22,
                border:
                  "1px solid #e2e8f0",
                background: "#fff",
                boxShadow:
                  "0 12px 30px rgba(15,23,42,.05)",
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
                  padding: 18,
                  borderBottom:
                    "1px solid #e2e8f0",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color:
                        "#0f172a",
                      fontSize: 21,
                      fontWeight: 950,
                    }}
                  >
                    Çalışan
                    Temsilcileri
                  </h2>

                  <p
                    style={{
                      margin:
                        "5px 0 0",
                      color:
                        "#64748b",
                    }}
                  >
                    Asıl, yedek ve baş
                    temsilci kayıtları
                  </p>
                </div>

                <div
                  style={{
                    borderRadius: 999,
                    padding:
                      "7px 11px",
                    color:
                      "#1d4ed8",
                    background:
                      "#eff6ff",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {
                    representatives.length
                  } kayıt
                </div>
              </div>

              <div
                style={{
                  overflowX:
                    "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    minWidth: 1080,
                    borderCollapse:
                      "collapse",
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
                        "Çalışan",
                        "Bölüm / Ünvan",
                        "Temsilci Türü",
                        "Belirlenme",
                        "Baş Temsilci",
                        "Başlangıç",
                        "Bitiş",
                        "Durum",
                        "İşlemler",
                      ].map(
                        (header) => (
                          <th
                            key={
                              header
                            }
                            style={{
                              padding:
                                "12px 11px",
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
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {representatives.map(
                      (
                        item
                      ) => {
                        const badge =
                          representativeStatusStyle(
                            item.calculatedStatus
                          );

                        return (
                          <tr
                            key={
                              item.id
                            }
                            style={{
                              borderBottom:
                                "1px solid #eef2f7",
                            }}
                          >
                            <td
                              style={{
                                padding:
                                  "13px 11px",
                              }}
                            >
                              <div
                                style={{
                                  color:
                                    "#0f172a",
                                  fontWeight: 900,
                                }}
                              >
                                {
                                  item.employeeName
                                }
                              </div>

                              <div
                                style={{
                                  marginTop: 3,
                                  color:
                                    "#94a3b8",
                                  fontSize: 12,
                                }}
                              >
                                {
                                  item.registryNo ||
                                  "-"
                                }
                              </div>
                            </td>

                            <td
                              style={{
                                padding:
                                  "13px 11px",
                                color:
                                  "#475569",
                              }}
                            >
                              <div>
                                {
                                  item.department ||
                                  "-"
                                }
                              </div>

                              <div
                                style={{
                                  marginTop: 3,
                                  color:
                                    "#94a3b8",
                                  fontSize: 12,
                                }}
                              >
                                {
                                  item.jobTitle ||
                                  "-"
                                }
                              </div>
                            </td>

                            <td
                              style={{
                                padding:
                                  "13px 11px",
                                color:
                                  "#334155",
                                fontWeight: 850,
                              }}
                            >
                              {representativeTypeLabel(
                                item.representativeType
                              )}
                            </td>

                            <td
                              style={{
                                padding:
                                  "13px 11px",
                                color:
                                  "#475569",
                              }}
                            >
                              {determinationLabel(
                                item.determinationMethod
                              )}
                            </td>

                            <td
                              style={{
                                padding:
                                  "13px 11px",
                              }}
                            >
                              {item.isHeadRepresentative
                                ? "Evet"
                                : "-"}
                            </td>

                            <td
                              style={{
                                padding:
                                  "13px 11px",
                                color:
                                  "#475569",
                              }}
                            >
                              {formatDate(
                                item.dutyStartDate
                              )}
                            </td>

                            <td
                              style={{
                                padding:
                                  "13px 11px",
                                color:
                                  "#475569",
                              }}
                            >
                              {formatDate(
                                item.dutyEndDate
                              )}
                            </td>

                            <td
                              style={{
                                padding:
                                  "13px 11px",
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
                                {representativeStatusLabel(
                                  item.calculatedStatus
                                )}
                              </span>
                            </td>

                            <td
                              style={{
                                padding:
                                  "13px 11px",
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    "flex",
                                  gap: 6,
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(
                                      item
                                    )
                                  }
                                  disabled={
                                    readOnly ||
                                    saving
                                  }
                                  style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    border:
                                      "1px solid #dbeafe",
                                    background:
                                      "#eff6ff",
                                    color:
                                      "#1d4ed8",
                                    display:
                                      "grid",
                                    placeItems:
                                      "center",
                                    cursor:
                                      readOnly ||
                                      saving
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity:
                                      readOnly
                                        ? 0.5
                                        : 1,
                                  }}
                                  aria-label="Temsilciyi düzenle"
                                >
                                  <Pencil
                                    size={15}
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void deleteRepresentative(
                                      item
                                    )
                                  }
                                  disabled={
                                    readOnly ||
                                    saving
                                  }
                                  style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    border:
                                      "1px solid #fecaca",
                                    background:
                                      "#fef2f2",
                                    color:
                                      "#b91c1c",
                                    display:
                                      "grid",
                                    placeItems:
                                      "center",
                                    cursor:
                                      readOnly ||
                                      saving
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity:
                                      readOnly
                                        ? 0.5
                                        : 1,
                                  }}
                                  aria-label="Temsilciyi sil"
                                >
                                  <Trash2
                                    size={15}
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {representatives.length ===
              0 ? (
                <div
                  style={{
                    minHeight: 220,
                    display: "grid",
                    placeItems:
                      "center",
                    textAlign:
                      "center",
                    color:
                      "#94a3b8",
                  }}
                >
                  <div>
                    <UserCheck
                      size={42}
                    />

                    <div
                      style={{
                        marginTop: 10,
                        color:
                          "#475569",
                        fontWeight: 900,
                      }}
                    >
                      Henüz çalışan
                      temsilcisi kaydı
                      bulunmuyor
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        fontSize: 13,
                      }}
                    >
                      Yukarıdaki
                      “Temsilci Ekle”
                      düğmesiyle ilk
                      kaydı
                      oluşturabilirsiniz.
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          </>
        )}
      </div>

      {modalOpen ? (
        <div
          onClick={() => {
            if (!saving) {
              setModalOpen(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 20000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background:
              "rgba(15,23,42,.68)",
            backdropFilter:
              "blur(4px)",
          }}
        >
          <div
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              width:
                "min(900px,100%)",
              maxHeight: "92vh",
              overflow: "hidden",
              display: "flex",
              flexDirection:
                "column",
              borderRadius: 26,
              background: "#fff",
              boxShadow:
                "0 32px 90px rgba(0,0,0,.28)",
            }}
          >
            <div
              style={{
                flex: "0 0 auto",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap: 12,
                padding: 20,
                borderBottom:
                  "1px solid #e2e8f0",
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      "#1d4ed8",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  Çalışan Temsilcisi
                </div>

                <h2
                  style={{
                    margin:
                      "5px 0 0",
                    color:
                      "#0f172a",
                    fontSize: 23,
                    fontWeight: 950,
                  }}
                >
                  {editingRepresentative
                    ? "Temsilciyi Düzenle"
                    : "Yeni Temsilci Ekle"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                disabled={saving}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border:
                    "1px solid #e2e8f0",
                  background: "#fff",
                  display: "grid",
                  placeItems:
                    "center",
                  cursor:
                    saving
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                minHeight: 0,
                flex: "1 1 auto",
                overflowY: "auto",
                padding: 20,
              }}
            >
              <div
                className="representativeFormGrid"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2,minmax(0,1fr))",
                  gap: 14,
                }}
              >
                <label
                  style={{
                    display: "grid",
                    gap: 6,
                    gridColumn:
                      "1 / -1",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 850,
                      color: "#475569",
                    }}
                  >
                    Çalışan *
                  </span>

                  <select
                    value={
                      form.employeeId
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        employeeId:
                          event.target
                            .value,
                      })
                    }
                    disabled={
                      Boolean(
                        editingRepresentative
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="">
                      Çalışan seçiniz
                    </option>

                    {employees.map(
                      (employee) => (
                        <option
                          key={
                            employee.id
                          }
                          value={
                            employee.id
                          }
                        >
                          {
                            employee.full_name
                          }
                          {employee.department
                            ? ` · ${employee.department}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <FormField
                  label="Temsilci Türü"
                >
                  <select
                    value={
                      form.representativeType
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event.target
                          .value as
                          | "PRIMARY"
                          | "SUBSTITUTE";

                      setForm({
                        ...form,
                        representativeType:
                          value,
                        isHeadRepresentative:
                          value ===
                          "PRIMARY"
                            ? form.isHeadRepresentative
                            : false,
                      });
                    }}
                    style={inputStyle}
                  >
                    <option value="PRIMARY">
                      Asıl
                    </option>

                    <option value="SUBSTITUTE">
                      Yedek
                    </option>
                  </select>
                </FormField>

                <FormField
                  label="Belirlenme Yöntemi"
                >
                  <select
                    value={
                      form.determinationMethod
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        determinationMethod:
                          event.target
                            .value as RepresentativeForm["determinationMethod"],
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="ELECTION">
                      Seçim
                    </option>

                    <option value="APPOINTMENT">
                      Atama
                    </option>

                    <option value="AUTHORIZED_UNION">
                      Yetkili Sendika
                    </option>
                  </select>
                </FormField>

                <FormField
                  label="Seçim Tarihi"
                >
                  <input
                    type="date"
                    value={
                      form.selectionDate
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        selectionDate:
                          event.target
                            .value,
                      })
                    }
                    style={inputStyle}
                  />
                </FormField>

                <FormField
                  label="Görev Başlangıcı *"
                >
                  <input
                    type="date"
                    value={
                      form.dutyStartDate
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        dutyStartDate:
                          event.target
                            .value,
                      })
                    }
                    style={inputStyle}
                  />
                </FormField>

                <FormField
                  label="Görev Bitişi"
                >
                  <input
                    type="date"
                    value={
                      form.dutyEndDate
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        dutyEndDate:
                          event.target
                            .value,
                      })
                    }
                    style={inputStyle}
                  />
                </FormField>

                <FormField
                  label="İşyeri Bölümü"
                >
                  <input
                    value={
                      form.workplaceSection
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        workplaceSection:
                          event.target
                            .value,
                      })
                    }
                    style={inputStyle}
                  />
                </FormField>

                <FormField
                  label="Vardiya"
                >
                  <input
                    value={
                      form.shiftName
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        shiftName:
                          event.target
                            .value,
                      })
                    }
                    style={inputStyle}
                  />
                </FormField>

                {form.determinationMethod ===
                "AUTHORIZED_UNION" ? (
                  <FormField
                    label="Yetkili Sendika"
                  >
                    <input
                      value={
                        form.unionName
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,
                          unionName:
                            event.target
                              .value,
                        })
                      }
                      style={inputStyle}
                    />
                  </FormField>
                ) : null}

                {form.determinationMethod ===
                "ELECTION" ? (
                  <FormField
                    label="Seçim Referans No"
                  >
                    <input
                      value={
                        form.electionReferenceNo
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,
                          electionReferenceNo:
                            event.target
                              .value,
                        })
                      }
                      style={inputStyle}
                    />
                  </FormField>
                ) : null}

                {form.determinationMethod ===
                "APPOINTMENT" ? (
                  <FormField
                    label="Atama Referans No"
                  >
                    <input
                      value={
                        form.appointmentReferenceNo
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,
                          appointmentReferenceNo:
                            event.target
                              .value,
                        })
                      }
                      style={inputStyle}
                    />
                  </FormField>
                ) : null}

                <label
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 10,
                    minHeight: 46,
                    borderRadius: 13,
                    border:
                      "1px solid #dbeafe",
                    padding:
                      "0 13px",
                    background:
                      form.representativeType ===
                      "PRIMARY"
                        ? "#eff6ff"
                        : "#f8fafc",
                    color:
                      "#334155",
                    fontWeight: 850,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      form.isHeadRepresentative
                    }
                    disabled={
                      form.representativeType !==
                      "PRIMARY"
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        isHeadRepresentative:
                          event.target
                            .checked,
                      })
                    }
                  />

                  Baş Temsilci
                </label>

                <label
                  style={{
                    display: "grid",
                    gap: 6,
                    gridColumn:
                      "1 / -1",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 850,
                      color: "#475569",
                    }}
                  >
                    Not
                  </span>

                  <textarea
                    rows={4}
                    value={
                      form.note
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        note:
                          event.target
                            .value,
                      })
                    }
                    style={{
                      ...inputStyle,
                      minHeight: 110,
                      resize:
                        "vertical",
                      paddingTop: 12,
                    }}
                  />
                </label>
              </div>
            </div>

            <div
              style={{
                flex: "0 0 auto",
                display: "flex",
                justifyContent:
                  "flex-end",
                gap: 10,
                padding: 18,
                borderTop:
                  "1px solid #e2e8f0",
                background: "#fff",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                disabled={saving}
                style={{
                  minHeight: 43,
                  borderRadius: 13,
                  border:
                    "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#475569",
                  padding:
                    "0 16px",
                  fontWeight: 850,
                  cursor:
                    saving
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={() =>
                  void saveRepresentative()
                }
                disabled={saving}
                style={{
                  minHeight: 43,
                  borderRadius: 13,
                  border: 0,
                  background:
                    saving
                      ? "#93c5fd"
                      : "#1d4ed8",
                  color: "#fff",
                  padding:
                    "0 17px",
                  display:
                    "inline-flex",
                  alignItems:
                    "center",
                  gap: 8,
                  fontWeight: 900,
                  cursor:
                    saving
                      ? "wait"
                      : "pointer",
                }}
              >
                {saving ? (
                  <Loader2
                    size={17}
                    className="representativeSpin"
                  />
                ) : (
                  <Save
                    size={17}
                  />
                )}

                {saving
                  ? "Kaydediliyor..."
                  : editingRepresentative
                    ? "Güncelle"
                    : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .representativeSpin {
          animation: representative-spin
            0.9s linear infinite;
        }

        @keyframes representative-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .representativeCardGrid {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            ) !important;
          }
        }

        @media (max-width: 680px) {
          main {
            padding: 12px !important;
          }

          .representativeCardGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
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
          fontSize: 12,
          fontWeight: 850,
          color: "#475569",
        }}
      >
        {label}
      </span>

      {children}
    </label>
  );
}

const inputStyle:
  React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 44,
  borderRadius: 13,
  border: "1px solid #dbeafe",
  background: "#fff",
  color: "#0f172a",
  padding: "0 12px",
  outline: "none",
  fontSize: 14,
};
