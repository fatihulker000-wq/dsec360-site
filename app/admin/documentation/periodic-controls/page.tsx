"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  TestTube2,
  Wrench,
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
  error?: string;
  message?: string;
};

type EquipmentRecord = {
  id: string;
  firm_id: string;

  equipment_name: string;
  equipment_type: string;
  serial_no: string;
  location: string;

  legal_period_months: number;

  last_control_millis: number | null;
  next_due_millis: number | null;

  report_no: string;
  status: string;
  note: string;

  created_at_millis: number;
  updated_at_millis: number;
};

type MeasurementRecord = {
  id: string;
  firm_id: string;

  measurement_type: string;
  area_name: string;

  measurement_date_millis: number | null;
  next_due_millis: number | null;

  legal_period_months: number;

  measured_by: string;
  report_no: string;
  result_summary: string;

  status: string;
  note: string;

  created_at_millis: number;
  updated_at_millis: number;
};

type PeriodicControlResponse = {
  success?: boolean;
  firmId?: string;
  equipmentCount?: number;
  measurementCount?: number;
  equipments?: EquipmentRecord[];
  measurements?: MeasurementRecord[];
  error?: string;
  detail?: string;
};

type ActiveTab =
  | "EQUIPMENTS"
  | "MEASUREMENTS"
  | "WARNINGS";

function formatDate(
  millis?: number | null
): string {
  if (!millis) {
    return "-";
  }

  const date = new Date(millis);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function normalizeStatus(
  status?: string | null
): string {
  return String(status || "")
    .trim()
    .toLocaleUpperCase("tr-TR");
}

function getRecordStatus(
  status: string,
  nextDueMillis: number | null
) {
  const normalized =
    normalizeStatus(status);

  if (!nextDueMillis) {
    return {
      key: "MISSING",
      label: "Eksik",
      color: "#b45309",
      background: "#fffbeb",
      border: "#fde68a",
    };
  }

  if (nextDueMillis < Date.now()) {
    return {
      key: "EXPIRED",
      label: "Süresi Geçti",
      color: "#b91c1c",
      background: "#fef2f2",
      border: "#fecaca",
    };
  }

  if (
    normalized === "UYGUN_DEGIL" ||
    normalized === "UYGUN DEĞİL"
  ) {
    return {
      key: "NOT_SUITABLE",
      label: "Uygun Değil",
      color: "#b91c1c",
      background: "#fef2f2",
      border: "#fecaca",
    };
  }

  if (normalized === "EKSIK") {
    return {
      key: "MISSING",
      label: "Eksik",
      color: "#b45309",
      background: "#fffbeb",
      border: "#fde68a",
    };
  }

  return {
    key: "SUITABLE",
    label: "Uygun",
    color: "#047857",
    background: "#ecfdf5",
    border: "#a7f3d0",
  };
}

function remainingTime(
  nextDueMillis: number | null
): string {
  if (!nextDueMillis) {
    return "Tarih girilmedi";
  }

  const now = new Date();
  const due = new Date(nextDueMillis);

  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const difference =
    due.getTime() - now.getTime();

  const days = Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );

  if (days < 0) {
    return `${Math.abs(days)} gün gecikti`;
  }

  if (days === 0) {
    return "Bugün son gün";
  }

  if (days < 30) {
    return `${days} gün kaldı`;
  }

  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  if (remainingDays === 0) {
    return `${months} ay kaldı`;
  }

  return `${months} ay ${remainingDays} gün kaldı`;
}

function isWarningRecord(
  status: string,
  nextDueMillis: number | null
): boolean {
  const state = getRecordStatus(
    status,
    nextDueMillis
  );

  return state.key !== "SUITABLE";
}

export default function PeriodicControlsPage() {
  const [companies, setCompanies] =
    useState<CompanyItem[]>([]);

  const [
    selectedCompanyId,
    setSelectedCompanyId,
  ] = useState("");

  const [equipments, setEquipments] =
    useState<EquipmentRecord[]>([]);

  const [
    measurements,
    setMeasurements,
  ] = useState<MeasurementRecord[]>([]);

  const [activeTab, setActiveTab] =
    useState<ActiveTab>("EQUIPMENTS");

  const [searchText, setSearchText] =
    useState("");

  const [loadingCompanies, setLoadingCompanies] =
    useState(true);

  const [loadingRecords, setLoadingRecords] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const selectedCompany = useMemo(
    () =>
      companies.find(
        (item) =>
          item.id === selectedCompanyId
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

        const companyRows = (
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
            (item) =>
              item.id &&
              item.name &&
              item.isActive
          )
          .sort((first, second) =>
            first.name.localeCompare(
              second.name,
              "tr"
            )
          );

        setCompanies(companyRows);

        setSelectedCompanyId(
          (current) =>
            current ||
            companyRows[0]?.id ||
            ""
        );
      } catch (loadError) {
        console.error(
          "Periodic control company error:",
          loadError
        );

        setCompanies([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Firmalar yüklenemedi."
        );
      } finally {
        setLoadingCompanies(false);
      }
    }, []);

  const loadRecords =
    useCallback(async () => {
      if (!selectedCompanyId) {
        setEquipments([]);
        setMeasurements([]);
        return;
      }

      try {
        setLoadingRecords(true);
        setError("");

        const query = new URLSearchParams({
          firmId: selectedCompanyId,
        });

        const response = await fetch(
          `/api/admin/documentation/periodic-controls?${query.toString()}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const json: PeriodicControlResponse =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            json.detail ||
              json.error ||
              "Kayıtlar alınamadı."
          );
        }

        setEquipments(
          Array.isArray(json.equipments)
            ? json.equipments
            : []
        );

        setMeasurements(
          Array.isArray(json.measurements)
            ? json.measurements
            : []
        );
      } catch (loadError) {
        console.error(
          "Periodic control record error:",
          loadError
        );

        setEquipments([]);
        setMeasurements([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Kayıtlar yüklenemedi."
        );
      } finally {
        setLoadingRecords(false);
      }
    }, [selectedCompanyId]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");

      await Promise.all([
        loadCompanies(),
        loadRecords(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredEquipments =
    useMemo(() => {
      const normalizedSearch =
        searchText
          .trim()
          .toLocaleLowerCase("tr-TR");

      if (!normalizedSearch) {
        return equipments;
      }

      return equipments.filter((item) =>
        [
          item.equipment_name,
          item.equipment_type,
          item.serial_no,
          item.location,
          item.report_no,
          item.status,
          item.note,
        ]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch)
      );
    }, [equipments, searchText]);

  const filteredMeasurements =
    useMemo(() => {
      const normalizedSearch =
        searchText
          .trim()
          .toLocaleLowerCase("tr-TR");

      if (!normalizedSearch) {
        return measurements;
      }

      return measurements.filter((item) =>
        [
          item.measurement_type,
          item.area_name,
          item.measured_by,
          item.report_no,
          item.result_summary,
          item.status,
          item.note,
        ]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch)
      );
    }, [measurements, searchText]);

  const warningEquipments =
    useMemo(
      () =>
        equipments.filter((item) =>
          isWarningRecord(
            item.status,
            item.next_due_millis
          )
        ),
      [equipments]
    );

  const warningMeasurements =
    useMemo(
      () =>
        measurements.filter((item) =>
          isWarningRecord(
            item.status,
            item.next_due_millis
          )
        ),
      [measurements]
    );

  const metrics = useMemo(() => {
    const suitableEquipmentCount =
      equipments.filter(
        (item) =>
          getRecordStatus(
            item.status,
            item.next_due_millis
          ).key === "SUITABLE"
      ).length;

    const suitableMeasurementCount =
      measurements.filter(
        (item) =>
          getRecordStatus(
            item.status,
            item.next_due_millis
          ).key === "SUITABLE"
      ).length;

    const expiredCount = [
      ...equipments.map((item) => ({
        status: item.status,
        nextDueMillis:
          item.next_due_millis,
      })),

      ...measurements.map((item) => ({
        status: item.status,
        nextDueMillis:
          item.next_due_millis,
      })),
    ].filter(
      (item) =>
        getRecordStatus(
          item.status,
          item.nextDueMillis
        ).key === "EXPIRED"
    ).length;

    const thirtyDaysLater =
      Date.now() +
      30 * 24 * 60 * 60 * 1000;

    const dueSoonCount = [
      ...equipments.map(
        (item) => item.next_due_millis
      ),

      ...measurements.map(
        (item) => item.next_due_millis
      ),
    ].filter(
      (value) =>
        value !== null &&
        value >= Date.now() &&
        value <= thirtyDaysLater
    ).length;

    return {
      equipmentCount: equipments.length,
      measurementCount:
        measurements.length,

      warningCount:
        warningEquipments.length +
        warningMeasurements.length,

      suitableCount:
        suitableEquipmentCount +
        suitableMeasurementCount,

      expiredCount,
      dueSoonCount,
    };
  }, [
    equipments,
    measurements,
    warningEquipments,
    warningMeasurements,
  ]);

  const tabs: Array<{
    key: ActiveTab;
    label: string;
    count: number;
    icon: React.ReactNode;
  }> = [
    {
      key: "EQUIPMENTS",
      label: "İş Ekipmanları",
      count: equipments.length,
      icon: <Wrench size={17} />,
    },
    {
      key: "MEASUREMENTS",
      label: "Ortam Ölçümleri",
      count: measurements.length,
      icon: <TestTube2 size={17} />,
    },
    {
      key: "WARNINGS",
      label: "Uyarılar",
      count:
        warningEquipments.length +
        warningMeasurements.length,
      icon: <AlertTriangle size={17} />,
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "linear-gradient(180deg,#f8fafc 0%,#fff7ed 100%)",
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
            overflow: "hidden",
            padding: 25,
            color: "#ffffff",
            background:
              "linear-gradient(135deg,#5f0f1b 0%,#991b1b 48%,#d97706 100%)",
            boxShadow:
              "0 24px 60px rgba(127,29,29,0.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              justifyContent:
                "space-between",
              gap: 18,
            }}
          >
            <div style={{ maxWidth: 900 }}>
              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/admin/documentation";
                }}
                style={{
                  border: 0,
                  color: "#ffffff",
                  background:
                    "rgba(255,255,255,0.13)",
                  borderRadius: 999,
                  padding: "8px 12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontWeight: 850,
                  cursor: "pointer",
                }}
              >
                <ArrowLeft size={16} />
                Dokümantasyona Dön
              </button>

              <h1
                style={{
                  margin: "17px 0 0",
                  fontSize: 34,
                  lineHeight: 1.12,
                  fontWeight: 950,
                  letterSpacing:
                    "-0.03em",
                }}
              >
                Periyodik Kontrol ve
                Ortam Ölçümleri
              </h1>

              <p
                style={{
                  margin: "10px 0 0",
                  maxWidth: 800,
                  color:
                    "rgba(255,255,255,0.86)",
                  fontSize: 15,
                  lineHeight: 1.65,
                }}
              >
                İş ekipmanlarının yasal
                kontrollerini, ortam ölçüm
                raporlarını, süre
                aşımlarını ve eksik
                kayıtları firma bazında
                takip edin.
              </p>
            </div>

            <button
              type="button"
              disabled={refreshing}
              onClick={() =>
                void handleRefresh()
              }
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
                cursor: refreshing
                  ? "wait"
                  : "pointer",
              }}
            >
              {refreshing ? (
                <Loader2
                  size={17}
                  className="periodicSpin"
                />
              ) : (
                <RefreshCw size={17} />
              )}

              Yenile
            </button>
          </div>

          <div
            className="periodicHeroGrid"
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
                label: "Ekipman",
                value:
                  metrics.equipmentCount,
                icon: <Wrench size={17} />,
              },
              {
                label: "Ölçüm",
                value:
                  metrics.measurementCount,
                icon: (
                  <TestTube2 size={17} />
                ),
              },
              {
                label: "Uygun",
                value:
                  metrics.suitableCount,
                icon: (
                  <CheckCircle2
                    size={17}
                  />
                ),
              },
              {
                label: "Uyarı",
                value:
                  metrics.warningCount,
                icon: (
                  <AlertTriangle
                    size={17}
                  />
                ),
              },
              {
                label: "Süresi Geçen",
                value:
                  metrics.expiredCount,
                icon: (
                  <CalendarClock
                    size={17}
                  />
                ),
              },
              {
                label: "30 Gün İçinde",
                value:
                  metrics.dueSoonCount,
                icon: <Gauge size={17} />,
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
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    color:
                      "rgba(255,255,255,0.78)",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {item.icon}
                  {item.label}
                </div>

                <div
                  style={{
                    marginTop: 7,
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
            padding: 11,
            display: "flex",
            flexWrap: "wrap",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 11,
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
                tab.key === activeTab;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setActiveTab(tab.key)
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
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  <span
                    style={{
                      minWidth: 23,
                      height: 23,
                      padding: "0 6px",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 999,
                      background: active
                        ? "rgba(255,255,255,0.18)"
                        : "#e2e8f0",
                      fontSize: 11,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <label
            style={{
              minWidth: 300,
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
              onChange={(event) => {
                setSelectedCompanyId(
                  event.target.value
                );

                setSearchText("");
              }}
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
              justifyContent:
                "space-between",
              alignItems: "flex-end",
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
                {activeTab === "EQUIPMENTS"
                  ? "İş Ekipmanları Periyodik Kontrol"
                  : activeTab ===
                      "MEASUREMENTS"
                    ? "Ortam Ölçümleri"
                    : "Süre ve Eksik Kayıt Uyarıları"}
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#64748b",
                }}
              >
                {selectedCompany
                  ? `${selectedCompany.name} kayıtları`
                  : "Firma seçimi yapın"}
              </p>
            </div>

            <label
              style={{
                width: 330,
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
                placeholder="Kayıt ara..."
                style={{
                  width: "100%",
                  border: 0,
                  outline: 0,
                  background:
                    "transparent",
                }}
              />
            </label>
          </div>

          {loadingRecords ? (
            <div
              style={{
                minHeight: 240,
                display: "grid",
                placeItems: "center",
                color: "#64748b",
                fontWeight: 800,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Loader2
                  size={22}
                  className="periodicSpin"
                />
                Kayıtlar yükleniyor...
              </div>
            </div>
          ) : null}

          {!loadingRecords &&
          activeTab === "EQUIPMENTS" ? (
            <EquipmentTable
              records={filteredEquipments}
            />
          ) : null}

          {!loadingRecords &&
          activeTab === "MEASUREMENTS" ? (
            <MeasurementTable
              records={filteredMeasurements}
            />
          ) : null}

          {!loadingRecords &&
          activeTab === "WARNINGS" ? (
            <WarningArea
              equipments={
                warningEquipments
              }
              measurements={
                warningMeasurements
              }
            />
          ) : null}
        </section>
      </div>

      <style jsx>{`
        .periodicSpin {
          animation: periodic-spin 0.9s
            linear infinite;
        }

        @keyframes periodic-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1200px) {
          .periodicHeroGrid {
            grid-template-columns: repeat(
              3,
              minmax(0, 1fr)
            ) !important;
          }
        }

        @media (max-width: 700px) {
          main {
            padding: 12px !important;
          }

          .periodicHeroGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

function EquipmentTable({
  records,
}: {
  records: EquipmentRecord[];
}) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={<Wrench size={42} />}
        title="İş ekipmanı kaydı bulunamadı"
        description="App veya web üzerinden eklenen iş ekipmanı kayıtları burada görüntülenecek."
      />
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          minWidth: 1180,
          borderCollapse: "collapse",
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
              "Ekipman",
              "Tür",
              "Seri No",
              "Konum",
              "Periyot",
              "Son Kontrol",
              "Sonraki Kontrol",
              "Kalan Süre",
              "Rapor No",
              "Durum",
            ].map((header) => (
              <th
                key={header}
                style={{
                  padding: "12px 10px",
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
          {records.map((item) => {
            const status =
              getRecordStatus(
                item.status,
                item.next_due_millis
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
                    padding: "13px 10px",
                    color: "#0f172a",
                    fontWeight: 900,
                  }}
                >
                  {item.equipment_name}
                </td>

                <td style={tableTextStyle}>
                  {item.equipment_type ||
                    "-"}
                </td>

                <td style={tableTextStyle}>
                  {item.serial_no || "-"}
                </td>

                <td style={tableTextStyle}>
                  {item.location || "-"}
                </td>

                <td style={tableTextStyle}>
                  {item.legal_period_months} ay
                </td>

                <td style={tableTextStyle}>
                  {formatDate(
                    item.last_control_millis
                  )}
                </td>

                <td style={tableTextStyle}>
                  {formatDate(
                    item.next_due_millis
                  )}
                </td>

                <td
                  style={{
                    ...tableTextStyle,
                    color: status.color,
                    fontWeight: 850,
                  }}
                >
                  {remainingTime(
                    item.next_due_millis
                  )}
                </td>

                <td style={tableTextStyle}>
                  {item.report_no || "-"}
                </td>

                <td
                  style={{
                    padding: "13px 10px",
                  }}
                >
                  <StatusBadge
                    status={status}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MeasurementTable({
  records,
}: {
  records: MeasurementRecord[];
}) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={<TestTube2 size={42} />}
        title="Ortam ölçümü kaydı bulunamadı"
        description="Gürültü, aydınlatma, toz, gaz ve diğer ortam ölçümleri burada görüntülenecek."
      />
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          minWidth: 1220,
          borderCollapse: "collapse",
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
              "Ölçüm Türü",
              "Alan / Bölüm",
              "Ölçüm Tarihi",
              "Sonraki Ölçüm",
              "Periyot",
              "Ölçümü Yapan",
              "Rapor No",
              "Sonuç",
              "Kalan Süre",
              "Durum",
            ].map((header) => (
              <th
                key={header}
                style={{
                  padding: "12px 10px",
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
          {records.map((item) => {
            const status =
              getRecordStatus(
                item.status,
                item.next_due_millis
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
                    padding: "13px 10px",
                    color: "#0f172a",
                    fontWeight: 900,
                  }}
                >
                  {item.measurement_type}
                </td>

                <td style={tableTextStyle}>
                  {item.area_name || "-"}
                </td>

                <td style={tableTextStyle}>
                  {formatDate(
                    item.measurement_date_millis
                  )}
                </td>

                <td style={tableTextStyle}>
                  {formatDate(
                    item.next_due_millis
                  )}
                </td>

                <td style={tableTextStyle}>
                  {item.legal_period_months} ay
                </td>

                <td style={tableTextStyle}>
                  {item.measured_by || "-"}
                </td>

                <td style={tableTextStyle}>
                  {item.report_no || "-"}
                </td>

                <td style={tableTextStyle}>
                  {item.result_summary || "-"}
                </td>

                <td
                  style={{
                    ...tableTextStyle,
                    color: status.color,
                    fontWeight: 850,
                  }}
                >
                  {remainingTime(
                    item.next_due_millis
                  )}
                </td>

                <td
                  style={{
                    padding: "13px 10px",
                  }}
                >
                  <StatusBadge
                    status={status}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WarningArea({
  equipments,
  measurements,
}: {
  equipments: EquipmentRecord[];
  measurements: MeasurementRecord[];
}) {
  if (
    equipments.length === 0 &&
    measurements.length === 0
  ) {
    return (
      <EmptyState
        icon={<CheckCircle2 size={42} />}
        title="Aktif uyarı bulunmuyor"
        description="Süresi geçen, eksik veya uygun olmayan kayıt bulunmuyor."
      />
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
      }}
    >
      {equipments.map((item) => {
        const status =
          getRecordStatus(
            item.status,
            item.next_due_millis
          );

        return (
          <WarningCard
            key={`equipment-${item.id}`}
            icon={<ClipboardCheck size={20} />}
            title={item.equipment_name}
            description={`${item.equipment_type || "Ekipman"} • ${item.location || "Konum belirtilmedi"}`}
            dateText={`Sonraki kontrol: ${formatDate(item.next_due_millis)}`}
            remainingTextValue={remainingTime(
              item.next_due_millis
            )}
            status={status}
          />
        );
      })}

      {measurements.map((item) => {
        const status =
          getRecordStatus(
            item.status,
            item.next_due_millis
          );

        return (
          <WarningCard
            key={`measurement-${item.id}`}
            icon={<TestTube2 size={20} />}
            title={item.measurement_type}
            description={`${item.area_name || "Alan belirtilmedi"} • ${item.measured_by || "Ölçümü yapan belirtilmedi"}`}
            dateText={`Sonraki ölçüm: ${formatDate(item.next_due_millis)}`}
            remainingTextValue={remainingTime(
              item.next_due_millis
            )}
            status={status}
          />
        );
      })}
    </div>
  );
}

function WarningCard({
  icon,
  title,
  description,
  dateText,
  remainingTextValue,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  dateText: string;
  remainingTextValue: string;
  status: ReturnType<
    typeof getRecordStatus
  >;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${status.border}`,
        background: status.background,
        padding: 15,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent:
          "space-between",
        gap: 13,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            display: "grid",
            placeItems: "center",
            color: status.color,
            background: "#ffffff",
          }}
        >
          {icon}
        </div>

        <div>
          <div
            style={{
              color: "#0f172a",
              fontWeight: 950,
            }}
          >
            {title}
          </div>

          <div
            style={{
              marginTop: 4,
              color: "#64748b",
              fontSize: 13,
            }}
          >
            {description}
          </div>

          <div
            style={{
              marginTop: 6,
              color: status.color,
              fontSize: 12,
              fontWeight: 850,
            }}
          >
            {dateText} •{" "}
            {remainingTextValue}
          </div>
        </div>
      </div>

      <StatusBadge status={status} />
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: ReturnType<
    typeof getRecordStatus
  >;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        borderRadius: 999,
        padding: "6px 9px",
        color: status.color,
        background: status.background,
        border: `1px solid ${status.border}`,
        fontSize: 11,
        fontWeight: 900,
        whiteSpace: "nowrap",
      }}
    >
      {status.label}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        minHeight: 240,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        color: "#94a3b8",
      }}
    >
      <div style={{ maxWidth: 450 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>

        <div
          style={{
            marginTop: 12,
            color: "#334155",
            fontWeight: 950,
            fontSize: 17,
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: 6,
            color: "#64748b",
            lineHeight: 1.55,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

const tableTextStyle:
  React.CSSProperties = {
    padding: "13px 10px",
    color: "#475569",
    fontSize: 13,
  };