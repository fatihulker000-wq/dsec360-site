"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Edit3,
  Gauge,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  TestTube2,
  Trash2,
  Wrench,
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
  equipments?: EquipmentRecord[];
  measurements?: MeasurementRecord[];
  error?: string;
  detail?: string;
};

type ActiveTab = "EQUIPMENTS" | "MEASUREMENTS" | "WARNINGS";
type DialogState =
  | { type: "NONE" }
  | { type: "EQUIPMENT"; item: EquipmentRecord | null }
  | { type: "MEASUREMENT"; item: MeasurementRecord | null };

type EquipmentForm = {
  equipmentName: string;
  equipmentType: string;
  serialNo: string;
  location: string;
  legalPeriodMonths: string;
  lastControlDate: string;
  reportNo: string;
  status: string;
  note: string;
};

type MeasurementForm = {
  measurementType: string;
  areaName: string;
  measurementDate: string;
  legalPeriodMonths: string;
  measuredBy: string;
  reportNo: string;
  resultSummary: string;
  status: string;
  note: string;
};

const EQUIPMENT_OPTIONS = [
  "Forklift",
  "Vinç",
  "Caraskal",
  "Kompresör",
  "Basınçlı Kap",
  "Hava Tankı",
  "Kazan",
  "Elektrik Tesisatı",
  "Topraklama",
  "Paratoner",
  "Yangın Tesisatı",
  "Havalandırma Tesisatı",
  "Asansör",
  "Transpalet",
  "Diğer",
];

const EQUIPMENT_TYPES = [
  "Kaldırma Ekipmanı",
  "Basınçlı Kap",
  "Elektrik Tesisatı",
  "Yangın Tesisatı",
  "Havalandırma Tesisatı",
  "Diğer",
];

const MEASUREMENT_OPTIONS = [
  "Gürültü Ölçümü",
  "Aydınlatma Ölçümü",
  "Termal Konfor Ölçümü",
  "Toz Ölçümü",
  "Gaz Ölçümü",
  "VOC Ölçümü",
  "Titreşim Ölçümü",
  "Kimyasal Maruziyet Ölçümü",
  "Diğer",
];

const EMPTY_EQUIPMENT_FORM: EquipmentForm = {
  equipmentName: "Forklift",
  equipmentType: "Kaldırma Ekipmanı",
  serialNo: "",
  location: "",
  legalPeriodMonths: "12",
  lastControlDate: "",
  reportNo: "",
  status: "UYGUN",
  note: "",
};

const EMPTY_MEASUREMENT_FORM: MeasurementForm = {
  measurementType: "Gürültü Ölçümü",
  areaName: "",
  measurementDate: "",
  legalPeriodMonths: "12",
  measuredBy: "",
  reportNo: "",
  resultSummary: "",
  status: "UYGUN",
  note: "",
};

function toDateInput(millis: number | null): string {
  if (!millis) return "";
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return "";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function fromDateInput(value: string): number | null {
  if (!value) return null;
  const millis = new Date(`${value}T00:00:00`).getTime();
  return Number.isFinite(millis) ? millis : null;
}

function addMonths(millis: number | null, months: number): number | null {
  if (!millis) return null;
  const date = new Date(millis);
  date.setMonth(date.getMonth() + Math.max(1, months));
  return date.getTime();
}

function formatDate(millis?: number | null): string {
  if (!millis) return "-";
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function statusInfo(status: string, nextDueMillis: number | null) {
  const normalized = String(status || "").trim().toUpperCase();

  if (!nextDueMillis) {
    return {
      key: "MISSING",
      label: "Eksik",
      color: "#92400e",
      background: "#fffbeb",
      border: "#fde68a",
      priority: 1,
    };
  }

  const today = new Date();
  const due = new Date(nextDueMillis);
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const daysRemaining = Math.ceil(
    (due.getTime() - today.getTime()) / 86400000
  );

  if (daysRemaining < 0) {
    return {
      key: "EXPIRED",
      label: "Kritik / Süresi Geçti",
      color: "#7f1d1d",
      background: "#fee2e2",
      border: "#fca5a5",
      priority: 0,
    };
  }

  if (normalized === "UYGUN_DEGIL" || normalized === "UYGUN DEĞİL") {
    return {
      key: "NOT_SUITABLE",
      label: "Uygun Değil",
      color: "#991b1b",
      background: "#fef2f2",
      border: "#fecaca",
      priority: 1,
    };
  }

  if (normalized === "EKSIK") {
    return {
      key: "MISSING",
      label: "Eksik",
      color: "#92400e",
      background: "#fffbeb",
      border: "#fde68a",
      priority: 1,
    };
  }

  if (daysRemaining <= 7) {
    return {
      key: "DUE_7",
      label: "7 Gün İçinde",
      color: "#b91c1c",
      background: "#fef2f2",
      border: "#fecaca",
      priority: 2,
    };
  }

  if (daysRemaining <= 15) {
    return {
      key: "DUE_15",
      label: "15 Gün İçinde",
      color: "#c2410c",
      background: "#fff7ed",
      border: "#fed7aa",
      priority: 3,
    };
  }

  if (daysRemaining <= 30) {
    return {
      key: "DUE_30",
      label: "30 Gün İçinde",
      color: "#a16207",
      background: "#fefce8",
      border: "#fde68a",
      priority: 4,
    };
  }

  return {
    key: "SUITABLE",
    label: "Uygun",
    color: "#047857",
    background: "#ecfdf5",
    border: "#a7f3d0",
    priority: 5,
  };
}

function remainingTime(nextDueMillis: number | null): string {
  if (!nextDueMillis) return "Tarih girilmedi";
  const now = new Date();
  const due = new Date(nextDueMillis);
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const days = Math.ceil((due.getTime() - now.getTime()) / 86400000);

  if (days < 0) return `${Math.abs(days)} gün gecikti`;
  if (days === 0) return "Bugün son gün";
  if (days < 30) return `${days} gün kaldı`;

  const months = Math.floor(days / 30);
  const rest = days % 30;
  return rest === 0
    ? `${months} ay kaldı`
    : `${months} ay ${rest} gün kaldı`;
}

function urgencyPriority(
  status: string,
  nextDueMillis: number | null
): number {
  return statusInfo(status, nextDueMillis).priority;
}

function sortByUrgency<T extends {
  status: string;
  next_due_millis: number | null;
}>(records: T[]): T[] {
  return [...records].sort((first, second) => {
    const priorityDifference =
      urgencyPriority(first.status, first.next_due_millis) -
      urgencyPriority(second.status, second.next_due_millis);

    if (priorityDifference !== 0) return priorityDifference;

    const firstDate = first.next_due_millis ?? Number.MAX_SAFE_INTEGER;
    const secondDate = second.next_due_millis ?? Number.MAX_SAFE_INTEGER;
    return firstDate - secondDate;
  });
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 43,
  borderRadius: 11,
  border: "1px solid #cbd5e1",
  padding: "9px 11px",
  outline: "none",
  background: "#ffffff",
  color: "#0f172a",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  color: "#334155",
  fontSize: 13,
  fontWeight: 800,
};

export default function PeriodicControlsPage() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [equipments, setEquipments] = useState<EquipmentRecord[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("EQUIPMENTS");
  const [searchText, setSearchText] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState("");
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<DialogState>({ type: "NONE" });
  const [equipmentForm, setEquipmentForm] =
    useState<EquipmentForm>(EMPTY_EQUIPMENT_FORM);
  const [measurementForm, setMeasurementForm] =
    useState<MeasurementForm>(EMPTY_MEASUREMENT_FORM);

  const selectedCompany = useMemo(
    () => companies.find((item) => item.id === selectedCompanyId) || null,
    [companies, selectedCompanyId]
  );

  const loadCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      setError("");

      const response = await fetch("/api/admin/companies", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json: CompaniesResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.error || json.message || "Firmalar alınamadı.");
      }

      const rows = (Array.isArray(json.data) ? json.data : [])
        .map(
          (row): CompanyItem => ({
            id: String(row.id || "").trim(),
            name: String(
              row.name || row.title || row.company_name || ""
            ).trim(),
            isActive: row.is_active !== false,
          })
        )
        .filter((item) => item.id && item.name && item.isActive)
        .sort((a, b) => a.name.localeCompare(b.name, "tr"));

      setCompanies(rows);
      setSelectedCompanyId((current) => current || rows[0]?.id || "");
    } catch (loadError) {
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

  const loadRecords = useCallback(async () => {
    if (!selectedCompanyId) {
      setEquipments([]);
      setMeasurements([]);
      return;
    }

    try {
      setLoadingRecords(true);
      setError("");

      const query = new URLSearchParams({ firmId: selectedCompanyId });
      const response = await fetch(
        `/api/admin/documentation/periodic-controls?${query.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const json: PeriodicControlResponse =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.detail || json.error || "Kayıtlar alınamadı.");
      }

      setEquipments(Array.isArray(json.equipments) ? json.equipments : []);
      setMeasurements(
        Array.isArray(json.measurements) ? json.measurements : []
      );
    } catch (loadError) {
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
      await Promise.all([loadCompanies(), loadRecords()]);
    } finally {
      setRefreshing(false);
    }
  };

  const openNewEquipment = () => {
    if (!selectedCompanyId) {
      setError("Önce firma seçmelisiniz.");
      return;
    }
    setEquipmentForm(EMPTY_EQUIPMENT_FORM);
    setDialog({ type: "EQUIPMENT", item: null });
  };

  const openEditEquipment = (item: EquipmentRecord) => {
    setEquipmentForm({
      equipmentName: item.equipment_name,
      equipmentType: item.equipment_type,
      serialNo: item.serial_no,
      location: item.location,
      legalPeriodMonths: String(item.legal_period_months || 12),
      lastControlDate: toDateInput(item.last_control_millis),
      reportNo: item.report_no,
      status: item.status || "UYGUN",
      note: item.note,
    });
    setDialog({ type: "EQUIPMENT", item });
  };

  const openNewMeasurement = () => {
    if (!selectedCompanyId) {
      setError("Önce firma seçmelisiniz.");
      return;
    }
    setMeasurementForm(EMPTY_MEASUREMENT_FORM);
    setDialog({ type: "MEASUREMENT", item: null });
  };

  const openEditMeasurement = (item: MeasurementRecord) => {
    setMeasurementForm({
      measurementType: item.measurement_type,
      areaName: item.area_name,
      measurementDate: toDateInput(item.measurement_date_millis),
      legalPeriodMonths: String(item.legal_period_months || 12),
      measuredBy: item.measured_by,
      reportNo: item.report_no,
      resultSummary: item.result_summary,
      status: item.status || "UYGUN",
      note: item.note,
    });
    setDialog({ type: "MEASUREMENT", item });
  };

  const saveEquipment = async () => {
    if (!equipmentForm.equipmentName.trim()) {
      setError("Ekipman adı zorunludur.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const period = Math.max(
        1,
        Number.parseInt(equipmentForm.legalPeriodMonths, 10) || 12
      );
      const lastControlMillis = fromDateInput(equipmentForm.lastControlDate);
      const nextDueMillis = addMonths(lastControlMillis, period);
      const editing =
        dialog.type === "EQUIPMENT" ? dialog.item : null;

      const response = await fetch(
        "/api/admin/documentation/periodic-controls",
        {
          method: editing ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordType: "EQUIPMENT",
            id: editing?.id,
            firmId: selectedCompanyId,
            equipmentName: equipmentForm.equipmentName.trim(),
            equipmentType: equipmentForm.equipmentType.trim(),
            serialNo: equipmentForm.serialNo.trim(),
            location: equipmentForm.location.trim(),
            legalPeriodMonths: period,
            lastControlMillis,
            nextDueMillis,
            reportNo: equipmentForm.reportNo.trim(),
            status: lastControlMillis ? equipmentForm.status : "EKSIK",
            note: equipmentForm.note.trim(),
          }),
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.detail || json.error || "Kayıt kaydedilemedi.");
      }

      setDialog({ type: "NONE" });
      await loadRecords();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Kayıt kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveMeasurement = async () => {
    if (!measurementForm.measurementType.trim()) {
      setError("Ölçüm türü zorunludur.");
      return;
    }
    if (!measurementForm.areaName.trim()) {
      setError("Alan / bölüm zorunludur.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const period = Math.max(
        1,
        Number.parseInt(measurementForm.legalPeriodMonths, 10) || 12
      );
      const measurementDateMillis = fromDateInput(
        measurementForm.measurementDate
      );
      const nextDueMillis = addMonths(measurementDateMillis, period);
      const editing =
        dialog.type === "MEASUREMENT" ? dialog.item : null;

      const response = await fetch(
        "/api/admin/documentation/periodic-controls",
        {
          method: editing ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordType: "MEASUREMENT",
            id: editing?.id,
            firmId: selectedCompanyId,
            measurementType: measurementForm.measurementType.trim(),
            areaName: measurementForm.areaName.trim(),
            measurementDateMillis,
            nextDueMillis,
            legalPeriodMonths: period,
            measuredBy: measurementForm.measuredBy.trim(),
            reportNo: measurementForm.reportNo.trim(),
            resultSummary: measurementForm.resultSummary.trim(),
            status: measurementDateMillis ? measurementForm.status : "EKSIK",
            note: measurementForm.note.trim(),
          }),
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.detail || json.error || "Kayıt kaydedilemedi.");
      }

      setDialog({ type: "NONE" });
      await loadRecords();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Kayıt kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (
    recordType: "EQUIPMENT" | "MEASUREMENT",
    id: string,
    label: string
  ) => {
    const confirmed = window.confirm(
      `${label} kaydı silinsin mi? Bu işlem App senkronuna da yansır.`
    );
    if (!confirmed) return;

    const key = `${recordType}-${id}`;

    try {
      setDeletingKey(key);
      setError("");

      const query = new URLSearchParams({ id, recordType });
      const response = await fetch(
        `/api/admin/documentation/periodic-controls?${query.toString()}`,
        {
          method: "DELETE",
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.detail || json.error || "Kayıt silinemedi.");
      }

      await loadRecords();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Kayıt silinemedi."
      );
    } finally {
      setDeletingKey("");
    }
  };

  const normalizedSearch = searchText.trim().toLocaleLowerCase("tr-TR");

  const filteredEquipments = useMemo(() => {
    const rows = !normalizedSearch
      ? equipments
      : equipments.filter((item) =>
          [
            item.equipment_name,
            item.equipment_type,
            item.serial_no,
            item.location,
            item.report_no,
            item.note,
          ]
            .join(" ")
            .toLocaleLowerCase("tr-TR")
            .includes(normalizedSearch)
        );

    return sortByUrgency(rows);
  }, [equipments, normalizedSearch]);

  const filteredMeasurements = useMemo(() => {
    const rows = !normalizedSearch
      ? measurements
      : measurements.filter((item) =>
          [
            item.measurement_type,
            item.area_name,
            item.measured_by,
            item.report_no,
            item.result_summary,
            item.note,
          ]
            .join(" ")
            .toLocaleLowerCase("tr-TR")
            .includes(normalizedSearch)
        );

    return sortByUrgency(rows);
  }, [measurements, normalizedSearch]);

  const warningEquipments = useMemo(
    () =>
      sortByUrgency(
        equipments.filter(
          (item) =>
            statusInfo(item.status, item.next_due_millis).key !==
            "SUITABLE"
        )
      ),
    [equipments]
  );

  const warningMeasurements = useMemo(
    () =>
      sortByUrgency(
        measurements.filter(
          (item) =>
            statusInfo(item.status, item.next_due_millis).key !==
            "SUITABLE"
        )
      ),
    [measurements]
  );

  const metrics = useMemo(() => {
    const all = [
      ...equipments.map((item) => ({
        status: item.status,
        nextDue: item.next_due_millis,
      })),
      ...measurements.map((item) => ({
        status: item.status,
        nextDue: item.next_due_millis,
      })),
    ];

    const countByKey = (key: string) =>
      all.filter(
        (item) => statusInfo(item.status, item.nextDue).key === key
      ).length;

    return {
      equipmentCount: equipments.length,
      measurementCount: measurements.length,
      suitableCount: countByKey("SUITABLE"),
      expiredCount: countByKey("EXPIRED"),
      due7Count: countByKey("DUE_7"),
      due15Count: countByKey("DUE_15"),
      due30Count: countByKey("DUE_30"),
      otherWarningCount:
        countByKey("MISSING") + countByKey("NOT_SUITABLE"),
      warningCount: all.filter(
        (item) => statusInfo(item.status, item.nextDue).key !== "SUITABLE"
      ).length,
    };
  }, [equipments, measurements]);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "linear-gradient(180deg,#f8fafc 0%,#fff7ed 100%)",
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
            boxShadow: "0 24px 60px rgba(127,29,29,0.22)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 18,
            }}
          >
            <div style={{ maxWidth: 860 }}>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/admin/documentation";
                }}
                style={{
                  border: 0,
                  color: "#ffffff",
                  background: "rgba(255,255,255,0.13)",
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
                }}
              >
                Periyodik Kontrol ve Ortam Ölçümleri
              </h1>

              <p
                style={{
                  margin: "10px 0 0",
                  color: "rgba(255,255,255,0.86)",
                  lineHeight: 1.65,
                }}
              >
                İş ekipmanlarını, ortam ölçümlerini, süre aşımlarını ve eksik
                kayıtları App ve Web arasında çift yönlü yönetin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              style={{
                height: 44,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.24)",
                background: "rgba(255,255,255,0.13)",
                color: "#ffffff",
                padding: "0 15px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 850,
                cursor: refreshing ? "wait" : "pointer",
              }}
            >
              {refreshing ? (
                <Loader2 size={17} className="periodicSpin" />
              ) : (
                <RefreshCw size={17} />
              )}
              Yenile
            </button>
          </div>

          <div className="periodicHeroGrid">
            {[
              ["Ekipman", metrics.equipmentCount, <Wrench key="e" size={17} />],
              [
                "Ölçüm",
                metrics.measurementCount,
                <TestTube2 key="m" size={17} />,
              ],
              [
                "Kritik",
                metrics.expiredCount,
                <AlertTriangle key="k" size={17} />,
              ],
              [
                "7 Gün",
                metrics.due7Count,
                <CalendarClock key="7" size={17} />,
              ],
              [
                "15 Gün",
                metrics.due15Count,
                <CalendarClock key="15" size={17} />,
              ],
              [
                "30 Gün",
                metrics.due30Count,
                <Gauge key="30" size={17} />,
              ],
              [
                "Diğer Uyarı",
                metrics.otherWarningCount,
                <AlertTriangle key="d" size={17} />,
              ],
              [
                "Uygun",
                metrics.suitableCount,
                <CheckCircle2 key="u" size={17} />,
              ],
            ].map(([label, value, icon]) => (
              <div
                key={String(label)}
                style={{
                  borderRadius: 17,
                  padding: 15,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    color: "rgba(255,255,255,0.78)",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {icon}
                  {label}
                </div>
                <div style={{ marginTop: 7, fontSize: 25, fontWeight: 950 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {error ? (
          <section
            style={{
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              borderRadius: 16,
              padding: 14,
              display: "flex",
              gap: 9,
              fontWeight: 800,
            }}
          >
            <AlertTriangle size={18} />
            {error}
          </section>
        ) : null}

        <section className="toolbar">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <TabButton
              active={activeTab === "EQUIPMENTS"}
              onClick={() => setActiveTab("EQUIPMENTS")}
              icon={<Wrench size={17} />}
              label={`İş Ekipmanları (${equipments.length})`}
            />
            <TabButton
              active={activeTab === "MEASUREMENTS"}
              onClick={() => setActiveTab("MEASUREMENTS")}
              icon={<TestTube2 size={17} />}
              label={`Ortam Ölçümleri (${measurements.length})`}
            />
            <TabButton
              active={activeTab === "WARNINGS"}
              onClick={() => setActiveTab("WARNINGS")}
              icon={<AlertTriangle size={17} />}
              label={`Uyarılar (${
                warningEquipments.length + warningMeasurements.length
              })`}
            />
          </div>

          <label className="companySelect">
            <Building2 size={16} />
            <select
              value={selectedCompanyId}
              disabled={loadingCompanies}
              onChange={(event) => {
                setSelectedCompanyId(event.target.value);
                setSearchText("");
              }}
            >
              {companies.length === 0 ? (
                <option value="">Firma bulunamadı</option>
              ) : null}
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section
          style={{
            borderRadius: 18,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            padding: 14,
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 14 }}>
            Yaklaşan Süre Uyarı Seviyeleri
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              ["Süresi Geçti / Kritik", "#7f1d1d", "#fee2e2", "#fca5a5"],
              ["7 Gün İçinde", "#b91c1c", "#fef2f2", "#fecaca"],
              ["15 Gün İçinde", "#c2410c", "#fff7ed", "#fed7aa"],
              ["30 Gün İçinde", "#a16207", "#fefce8", "#fde68a"],
              ["Uygun", "#047857", "#ecfdf5", "#a7f3d0"],
            ].map(([label, color, background, border]) => (
              <span
                key={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 30,
                  borderRadius: 999,
                  padding: "0 10px",
                  color,
                  background,
                  border: `1px solid ${border}`,
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        <section className="contentCard">
          <div className="contentHeader">
            <div>
              <h2 style={{ margin: 0, fontSize: 23 }}>
                {activeTab === "EQUIPMENTS"
                  ? "İş Ekipmanları Periyodik Kontrol"
                  : activeTab === "MEASUREMENTS"
                    ? "Ortam Ölçümleri"
                    : "Süre ve Eksik Kayıt Uyarıları"}
              </h2>
              <p style={{ margin: "5px 0 0", color: "#64748b" }}>
                {selectedCompany
                  ? `${selectedCompany.name} kayıtları`
                  : "Firma seçimi yapın"}
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
              <label className="searchBox">
                <Search size={16} />
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Kayıt ara..."
                />
              </label>

              {activeTab === "EQUIPMENTS" ? (
                <button className="primaryButton" onClick={openNewEquipment}>
                  <Plus size={17} />
                  Yeni İş Ekipmanı
                </button>
              ) : null}

              {activeTab === "MEASUREMENTS" ? (
                <button className="primaryButton" onClick={openNewMeasurement}>
                  <Plus size={17} />
                  Yeni Ortam Ölçümü
                </button>
              ) : null}
            </div>
          </div>

          {loadingRecords ? (
            <div className="loadingArea">
              <Loader2 size={22} className="periodicSpin" />
              Kayıtlar yükleniyor...
            </div>
          ) : null}

          {!loadingRecords && activeTab === "EQUIPMENTS" ? (
            <EquipmentTable
              records={filteredEquipments}
              deletingKey={deletingKey}
              onEdit={openEditEquipment}
              onDelete={(item) =>
                void deleteRecord("EQUIPMENT", item.id, item.equipment_name)
              }
            />
          ) : null}

          {!loadingRecords && activeTab === "MEASUREMENTS" ? (
            <MeasurementTable
              records={filteredMeasurements}
              deletingKey={deletingKey}
              onEdit={openEditMeasurement}
              onDelete={(item) =>
                void deleteRecord(
                  "MEASUREMENT",
                  item.id,
                  item.measurement_type
                )
              }
            />
          ) : null}

          {!loadingRecords && activeTab === "WARNINGS" ? (
            <WarningArea
              equipments={warningEquipments}
              measurements={warningMeasurements}
            />
          ) : null}
        </section>
      </div>

      {dialog.type === "EQUIPMENT" ? (
        <Modal
          title={dialog.item ? "İş Ekipmanını Düzenle" : "Yeni İş Ekipmanı"}
          onClose={() => setDialog({ type: "NONE" })}
        >
          <div className="formGrid">
            <SelectField
              label="Ekipman"
              value={equipmentForm.equipmentName}
              options={EQUIPMENT_OPTIONS}
              onChange={(value) =>
                setEquipmentForm((current) => ({
                  ...current,
                  equipmentName: value,
                }))
              }
            />
            <SelectField
              label="Ekipman Türü"
              value={equipmentForm.equipmentType}
              options={EQUIPMENT_TYPES}
              onChange={(value) =>
                setEquipmentForm((current) => ({
                  ...current,
                  equipmentType: value,
                }))
              }
            />
            <TextField
              label="Seri No"
              value={equipmentForm.serialNo}
              onChange={(value) =>
                setEquipmentForm((current) => ({
                  ...current,
                  serialNo: value,
                }))
              }
            />
            <TextField
              label="Konum / Bölüm"
              value={equipmentForm.location}
              onChange={(value) =>
                setEquipmentForm((current) => ({
                  ...current,
                  location: value,
                }))
              }
            />
            <TextField
              label="Yasal Periyot / Ay"
              type="number"
              value={equipmentForm.legalPeriodMonths}
              onChange={(value) =>
                setEquipmentForm((current) => ({
                  ...current,
                  legalPeriodMonths: value,
                }))
              }
            />
            <TextField
              label="Son Kontrol Tarihi"
              type="date"
              value={equipmentForm.lastControlDate}
              onChange={(value) =>
                setEquipmentForm((current) => ({
                  ...current,
                  lastControlDate: value,
                }))
              }
            />
            <TextField
              label="Rapor No"
              value={equipmentForm.reportNo}
              onChange={(value) =>
                setEquipmentForm((current) => ({
                  ...current,
                  reportNo: value,
                }))
              }
            />
            <SelectField
              label="Durum"
              value={equipmentForm.status}
              options={["UYGUN", "UYGUN_DEGIL", "EKSIK"]}
              onChange={(value) =>
                setEquipmentForm((current) => ({
                  ...current,
                  status: value,
                }))
              }
            />
          </div>
          <TextAreaField
            label="Not"
            value={equipmentForm.note}
            onChange={(value) =>
              setEquipmentForm((current) => ({ ...current, note: value }))
            }
          />
          <ModalActions
            saving={saving}
            onCancel={() => setDialog({ type: "NONE" })}
            onSave={() => void saveEquipment()}
          />
        </Modal>
      ) : null}

      {dialog.type === "MEASUREMENT" ? (
        <Modal
          title={
            dialog.item ? "Ortam Ölçümünü Düzenle" : "Yeni Ortam Ölçümü"
          }
          onClose={() => setDialog({ type: "NONE" })}
        >
          <div className="formGrid">
            <SelectField
              label="Ölçüm Türü"
              value={measurementForm.measurementType}
              options={MEASUREMENT_OPTIONS}
              onChange={(value) =>
                setMeasurementForm((current) => ({
                  ...current,
                  measurementType: value,
                }))
              }
            />
            <TextField
              label="Alan / Bölüm"
              value={measurementForm.areaName}
              onChange={(value) =>
                setMeasurementForm((current) => ({
                  ...current,
                  areaName: value,
                }))
              }
            />
            <TextField
              label="Ölçüm Tarihi"
              type="date"
              value={measurementForm.measurementDate}
              onChange={(value) =>
                setMeasurementForm((current) => ({
                  ...current,
                  measurementDate: value,
                }))
              }
            />
            <TextField
              label="Periyot / Ay"
              type="number"
              value={measurementForm.legalPeriodMonths}
              onChange={(value) =>
                setMeasurementForm((current) => ({
                  ...current,
                  legalPeriodMonths: value,
                }))
              }
            />
            <TextField
              label="Ölçümü Yapan"
              value={measurementForm.measuredBy}
              onChange={(value) =>
                setMeasurementForm((current) => ({
                  ...current,
                  measuredBy: value,
                }))
              }
            />
            <TextField
              label="Rapor No"
              value={measurementForm.reportNo}
              onChange={(value) =>
                setMeasurementForm((current) => ({
                  ...current,
                  reportNo: value,
                }))
              }
            />
            <SelectField
              label="Durum"
              value={measurementForm.status}
              options={["UYGUN", "UYGUN_DEGIL", "EKSIK"]}
              onChange={(value) =>
                setMeasurementForm((current) => ({
                  ...current,
                  status: value,
                }))
              }
            />
          </div>
          <TextAreaField
            label="Sonuç Özeti"
            value={measurementForm.resultSummary}
            onChange={(value) =>
              setMeasurementForm((current) => ({
                ...current,
                resultSummary: value,
              }))
            }
          />
          <TextAreaField
            label="Not"
            value={measurementForm.note}
            onChange={(value) =>
              setMeasurementForm((current) => ({ ...current, note: value }))
            }
          />
          <ModalActions
            saving={saving}
            onCancel={() => setDialog({ type: "NONE" })}
            onSave={() => void saveMeasurement()}
          />
        </Modal>
      ) : null}

      <style jsx>{`
        .periodicSpin {
          animation: periodic-spin 0.9s linear infinite;
        }
        @keyframes periodic-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .periodicHeroGrid {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(8, minmax(0, 1fr));
          gap: 10px;
        }
        .toolbar,
        .contentCard {
          border: 1px solid #e5e7eb;
          background: #ffffff;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
        }
        .toolbar {
          border-radius: 18px;
          padding: 11px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 11px;
        }
        .contentCard {
          border-radius: 22px;
          padding: 19px;
        }
        .contentHeader {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          margin-bottom: 17px;
        }
        .companySelect,
        .searchBox {
          min-height: 43px;
          border-radius: 12px;
          border: 1px solid #dbe3ec;
          padding: 0 11px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #64748b;
        }
        .companySelect {
          min-width: 300px;
        }
        .companySelect select,
        .searchBox input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #334155;
        }
        .searchBox {
          width: 290px;
        }
        .primaryButton {
          min-height: 43px;
          border: 0;
          border-radius: 12px;
          background: #7f1d1d;
          color: #ffffff;
          padding: 0 15px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 900;
          cursor: pointer;
        }
        .loadingArea {
          min-height: 240px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          color: #64748b;
          font-weight: 800;
        }
        .formGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
        }
        @media (max-width: 1350px) {
          .periodicHeroGrid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .periodicHeroGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 700px) {
          main {
            padding: 12px !important;
          }
          .periodicHeroGrid,
          .formGrid {
            grid-template-columns: 1fr;
          }
          .companySelect,
          .searchBox {
            width: 100%;
            min-width: 0;
          }
        }
      `}</style>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 43,
        borderRadius: 12,
        border: active ? "1px solid #7f1d1d" : "1px solid transparent",
        background: active ? "#7f1d1d" : "#f8fafc",
        color: active ? "#ffffff" : "#475569",
        padding: "0 15px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function EquipmentTable({
  records,
  deletingKey,
  onEdit,
  onDelete,
}: {
  records: EquipmentRecord[];
  deletingKey: string;
  onEdit: (item: EquipmentRecord) => void;
  onDelete: (item: EquipmentRecord) => void;
}) {
  if (records.length === 0) {
    return <EmptyState title="İş ekipmanı kaydı bulunamadı" />;
  }

  return (
    <TableShell
      headers={[
        "Ekipman",
        "Tür",
        "Seri No",
        "Konum",
        "Son Kontrol",
        "Sonraki Kontrol",
        "Durum",
        "İşlemler",
      ]}
    >
      {records.map((item) => {
        const status = statusInfo(item.status, item.next_due_millis);
        const key = `EQUIPMENT-${item.id}`;

        return (
          <tr key={item.id} style={{ borderBottom: "1px solid #eef2f7" }}>
            <StrongCell>{item.equipment_name}</StrongCell>
            <Cell>{item.equipment_type || "-"}</Cell>
            <Cell>{item.serial_no || "-"}</Cell>
            <Cell>{item.location || "-"}</Cell>
            <Cell>{formatDate(item.last_control_millis)}</Cell>
            <Cell>
              {formatDate(item.next_due_millis)}
              <small style={{ display: "block", color: status.color }}>
                {remainingTime(item.next_due_millis)}
              </small>
            </Cell>
            <Cell>
              <StatusBadge status={status} />
            </Cell>
            <ActionCell
              deleting={deletingKey === key}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          </tr>
        );
      })}
    </TableShell>
  );
}

function MeasurementTable({
  records,
  deletingKey,
  onEdit,
  onDelete,
}: {
  records: MeasurementRecord[];
  deletingKey: string;
  onEdit: (item: MeasurementRecord) => void;
  onDelete: (item: MeasurementRecord) => void;
}) {
  if (records.length === 0) {
    return <EmptyState title="Ortam ölçümü kaydı bulunamadı" />;
  }

  return (
    <TableShell
      headers={[
        "Ölçüm Türü",
        "Alan / Bölüm",
        "Ölçüm Tarihi",
        "Sonraki Ölçüm",
        "Ölçümü Yapan",
        "Rapor No",
        "Durum",
        "İşlemler",
      ]}
    >
      {records.map((item) => {
        const status = statusInfo(item.status, item.next_due_millis);
        const key = `MEASUREMENT-${item.id}`;

        return (
          <tr key={item.id} style={{ borderBottom: "1px solid #eef2f7" }}>
            <StrongCell>{item.measurement_type}</StrongCell>
            <Cell>{item.area_name || "-"}</Cell>
            <Cell>{formatDate(item.measurement_date_millis)}</Cell>
            <Cell>
              {formatDate(item.next_due_millis)}
              <small style={{ display: "block", color: status.color }}>
                {remainingTime(item.next_due_millis)}
              </small>
            </Cell>
            <Cell>{item.measured_by || "-"}</Cell>
            <Cell>{item.report_no || "-"}</Cell>
            <Cell>
              <StatusBadge status={status} />
            </Cell>
            <ActionCell
              deleting={deletingKey === key}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          </tr>
        );
      })}
    </TableShell>
  );
}

function TableShell({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          minWidth: 1050,
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            {headers.map((header) => (
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
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: "13px 10px", color: "#475569", fontSize: 13 }}>
      {children}
    </td>
  );
}

function StrongCell({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: "13px 10px",
        color: "#0f172a",
        fontSize: 13,
        fontWeight: 900,
      }}
    >
      {children}
    </td>
  );
}

function ActionCell({
  deleting,
  onEdit,
  onDelete,
}: {
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <td style={{ padding: "10px" }}>
      <div style={{ display: "flex", gap: 7 }}>
        <button
          type="button"
          onClick={onEdit}
          style={{
            minHeight: 35,
            borderRadius: 9,
            border: "1px solid #bfdbfe",
            background: "#eff6ff",
            color: "#1d4ed8",
            padding: "0 10px",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          <Edit3 size={14} />
          Düzenle
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          style={{
            minHeight: 35,
            borderRadius: 9,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
            padding: "0 10px",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 800,
            cursor: deleting ? "wait" : "pointer",
          }}
        >
          {deleting ? (
            <Loader2 size={14} className="periodicSpin" />
          ) : (
            <Trash2 size={14} />
          )}
          Sil
        </button>
      </div>
    </td>
  );
}

function WarningArea({
  equipments,
  measurements,
}: {
  equipments: EquipmentRecord[];
  measurements: MeasurementRecord[];
}) {
  const rows = [
    ...equipments.map((item) => ({
      id: `e-${item.id}`,
      title: item.equipment_name,
      subtitle: `${item.equipment_type || "Ekipman"} • ${
        item.location || "Konum belirtilmedi"
      }`,
      status: statusInfo(item.status, item.next_due_millis),
      date: item.next_due_millis,
    })),
    ...measurements.map((item) => ({
      id: `m-${item.id}`,
      title: item.measurement_type,
      subtitle: `${item.area_name || "Alan belirtilmedi"} • ${
        item.measured_by || "Ölçümü yapan belirtilmedi"
      }`,
      status: statusInfo(item.status, item.next_due_millis),
      date: item.next_due_millis,
    })),
  ];

  if (rows.length === 0) {
    return <EmptyState title="Aktif uyarı bulunmuyor" />;
  }

  return (
    <div style={{ display: "grid", gap: 11 }}>
      {rows.map((row) => (
        <div
          key={row.id}
          style={{
            borderRadius: 17,
            border: `1px solid ${row.status.border}`,
            background: row.status.background,
            padding: 14,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <strong>{row.title}</strong>
            <div style={{ marginTop: 4, color: "#64748b", fontSize: 13 }}>
              {row.subtitle}
            </div>
            <div
              style={{
                marginTop: 6,
                color: row.status.color,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Sonraki tarih: {formatDate(row.date)} • {remainingTime(row.date)}
            </div>
          </div>
          <StatusBadge status={row.status} />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: ReturnType<typeof statusInfo>;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 29,
        borderRadius: 999,
        padding: "0 9px",
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

function EmptyState({ title }: { title: string }) {
  return (
    <div
      style={{
        minHeight: 220,
        display: "grid",
        placeItems: "center",
        color: "#64748b",
        fontWeight: 850,
      }}
    >
      {title}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        padding: 18,
        background: "rgba(15,23,42,0.58)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <section
        style={{
          width: "min(760px,100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          borderRadius: 22,
          background: "#ffffff",
          boxShadow: "0 30px 90px rgba(15,23,42,0.28)",
          padding: 20,
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <h2 style={{ margin: 0, color: "#0f172a" }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </header>
        <div style={{ display: "grid", gap: 14 }}>{children}</div>
      </section>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label style={labelStyle}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={fieldStyle}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label style={labelStyle}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={fieldStyle}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "UYGUN_DEGIL" ? "Uygun Değil" : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={labelStyle}>
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        style={{ ...fieldStyle, resize: "vertical" }}
      />
    </label>
  );
}

function ModalActions({
  saving,
  onCancel,
  onSave,
}: {
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 9,
        marginTop: 4,
      }}
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        style={{
          minHeight: 42,
          borderRadius: 11,
          border: "1px solid #cbd5e1",
          background: "#ffffff",
          color: "#475569",
          padding: "0 15px",
          fontWeight: 850,
          cursor: "pointer",
        }}
      >
        Vazgeç
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        style={{
          minHeight: 42,
          borderRadius: 11,
          border: 0,
          background: "#7f1d1d",
          color: "#ffffff",
          padding: "0 17px",
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontWeight: 900,
          cursor: saving ? "wait" : "pointer",
        }}
      >
        {saving ? <Loader2 size={16} className="periodicSpin" /> : null}
        Kaydet
      </button>
    </div>
  );
}