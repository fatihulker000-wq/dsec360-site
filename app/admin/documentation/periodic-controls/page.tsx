"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Edit3,
  FileDown,
  FileSpreadsheet,
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

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function printableStatus(
  status: string,
  nextDueMillis: number | null
): string {
  return statusInfo(status, nextDueMillis).label;
}

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function excelCell(
  value: unknown,
  styleId = "Cell",
  type: "String" | "Number" = "String"
): string {
  const normalized =
    type === "Number"
      ? Number.isFinite(Number(value))
        ? String(Number(value))
        : "0"
      : escapeXml(value);

  return `<Cell ss:StyleID="${styleId}"><Data ss:Type="${type}">${normalized}</Data></Cell>`;
}

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


  const createPdfReport = () => {
    if (!selectedCompanyId || !selectedCompany) {
      setError("PDF raporu için firma seçmelisiniz.");
      return;
    }

    const reportWindow = window.open("", "_blank", "width=1200,height=900");

    if (!reportWindow) {
      setError(
        "PDF penceresi açılamadı. Tarayıcı açılır pencere iznini kontrol edin."
      );
      return;
    }

    const generatedAt = new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());

    const equipmentRows = sortByUrgency(equipments)
      .map((item, index) => {
        const info = statusInfo(item.status, item.next_due_millis);

        return `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(item.equipment_name)}</strong></td>
            <td>${escapeHtml(item.equipment_type || "-")}</td>
            <td>${escapeHtml(item.serial_no || "-")}</td>
            <td>${escapeHtml(item.location || "-")}</td>
            <td>${item.legal_period_months || 12} ay</td>
            <td>${formatDate(item.last_control_millis)}</td>
            <td>${formatDate(item.next_due_millis)}</td>
            <td>${escapeHtml(remainingTime(item.next_due_millis))}</td>
            <td>${escapeHtml(item.report_no || "-")}</td>
            <td>
              <span class="status" style="color:${info.color};background:${info.background};border-color:${info.border}">
                ${escapeHtml(info.label)}
              </span>
            </td>
            <td>${escapeHtml(item.note || "-")}</td>
          </tr>`;
      })
      .join("");

    const measurementRows = sortByUrgency(measurements)
      .map((item, index) => {
        const info = statusInfo(item.status, item.next_due_millis);

        return `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(item.measurement_type)}</strong></td>
            <td>${escapeHtml(item.area_name || "-")}</td>
            <td>${formatDate(item.measurement_date_millis)}</td>
            <td>${formatDate(item.next_due_millis)}</td>
            <td>${item.legal_period_months || 12} ay</td>
            <td>${escapeHtml(item.measured_by || "-")}</td>
            <td>${escapeHtml(item.report_no || "-")}</td>
            <td>${escapeHtml(item.result_summary || "-")}</td>
            <td>${escapeHtml(remainingTime(item.next_due_millis))}</td>
            <td>
              <span class="status" style="color:${info.color};background:${info.background};border-color:${info.border}">
                ${escapeHtml(info.label)}
              </span>
            </td>
            <td>${escapeHtml(item.note || "-")}</td>
          </tr>`;
      })
      .join("");

    const criticalRecords = [
      ...equipments.map((item) => ({
        title: item.equipment_name,
        detail: `${item.equipment_type || "Ekipman"} / ${
          item.location || "Konum belirtilmedi"
        }`,
        status: item.status,
        due: item.next_due_millis,
      })),
      ...measurements.map((item) => ({
        title: item.measurement_type,
        detail: `${item.area_name || "Alan belirtilmedi"} / ${
          item.measured_by || "Ölçümü yapan belirtilmedi"
        }`,
        status: item.status,
        due: item.next_due_millis,
      })),
    ]
      .filter(
        (item) => statusInfo(item.status, item.due).key !== "SUITABLE"
      )
      .sort(
        (first, second) =>
          urgencyPriority(first.status, first.due) -
            urgencyPriority(second.status, second.due) ||
          (first.due ?? Number.MAX_SAFE_INTEGER) -
            (second.due ?? Number.MAX_SAFE_INTEGER)
      )
      .map((item) => {
        const info = statusInfo(item.status, item.due);
        return `
          <div class="warning-row">
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <div class="muted">${escapeHtml(item.detail)}</div>
            </div>
            <div class="warning-right">
              <span class="status" style="color:${info.color};background:${info.background};border-color:${info.border}">
                ${escapeHtml(info.label)}
              </span>
              <div class="remaining">${escapeHtml(
                remainingTime(item.due)
              )}</div>
            </div>
          </div>`;
      })
      .join("");

    const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>Periyodik Kontrol Durum Raporu</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #172033;
      background: #ffffff;
      font-size: 10px;
    }
    .report { width: 100%; }
    .hero {
      border-radius: 18px;
      padding: 22px;
      color: #ffffff;
      background: linear-gradient(135deg,#5f0f1b 0%,#991b1b 52%,#d97706 100%);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .hero h1 { margin: 0; font-size: 25px; }
    .hero p { margin: 8px 0 0; color: rgba(255,255,255,.88); }
    .report-meta {
      margin-top: 15px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .meta-card {
      border-radius: 10px;
      padding: 9px 11px;
      background: rgba(255,255,255,.13);
      border: 1px solid rgba(255,255,255,.18);
    }
    .meta-card small { display: block; color: rgba(255,255,255,.73); }
    .meta-card strong { display: block; margin-top: 4px; font-size: 12px; }
    .metrics {
      margin-top: 12px;
      display: grid;
      grid-template-columns: repeat(8, minmax(0,1fr));
      gap: 7px;
    }
    .metric {
      border-radius: 10px;
      padding: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .metric span { display: block; color: #64748b; font-size: 9px; }
    .metric strong { display: block; margin-top: 4px; font-size: 18px; }
    .section { margin-top: 16px; break-inside: avoid-page; }
    .section h2 {
      margin: 0 0 8px;
      padding-bottom: 7px;
      border-bottom: 2px solid #7f1d1d;
      font-size: 16px;
      color: #7f1d1d;
    }
    table { width: 100%; border-collapse: collapse; table-layout: auto; }
    th, td {
      border: 1px solid #dbe3ec;
      padding: 6px;
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 8.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    tr { break-inside: avoid; }
    .status {
      display: inline-block;
      border: 1px solid;
      border-radius: 999px;
      padding: 3px 6px;
      font-size: 8.5px;
      font-weight: 700;
      white-space: nowrap;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .warning-list { display: grid; gap: 6px; }
    .warning-row {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      break-inside: avoid;
    }
    .warning-right { text-align: right; }
    .remaining { margin-top: 4px; font-weight: 700; }
    .muted { margin-top: 3px; color: #64748b; }
    .empty {
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      padding: 16px;
      color: #64748b;
      text-align: center;
    }
    .signatures {
      margin-top: 24px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      break-inside: avoid;
    }
    .signature {
      min-height: 85px;
      border-top: 1px solid #94a3b8;
      padding-top: 7px;
      text-align: center;
      color: #475569;
    }
    .footer {
      margin-top: 18px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    .screen-actions {
      position: sticky;
      top: 0;
      z-index: 2;
      padding: 10px 0;
      background: #ffffff;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .screen-actions button {
      border: 0;
      border-radius: 9px;
      padding: 10px 14px;
      color: #ffffff;
      background: #7f1d1d;
      font-weight: 700;
      cursor: pointer;
    }
    @media print {
      .screen-actions { display: none; }
      .section { break-inside: auto; }
    }
  </style>
</head>
<body>
  <div class="screen-actions">
    <button onclick="window.print()">PDF Olarak Kaydet / Yazdır</button>
  </div>

  <main class="report">
    <section class="hero">
      <h1>D-SEC Periyodik Kontrol ve Ortam Ölçümleri Durum Raporu</h1>
      <p>İş ekipmanları, ortam ölçümleri, kritik süreler ve yaklaşan kontroller</p>

      <div class="report-meta">
        <div class="meta-card">
          <small>Firma</small>
          <strong>${escapeHtml(selectedCompany.name)}</strong>
        </div>
        <div class="meta-card">
          <small>Rapor Tarihi</small>
          <strong>${escapeHtml(generatedAt)}</strong>
        </div>
        <div class="meta-card">
          <small>Rapor Kapsamı</small>
          <strong>Tüm Periyodik Kontrol ve Ölçüm Kayıtları</strong>
        </div>
      </div>
    </section>

    <section class="metrics">
      <div class="metric"><span>Ekipman</span><strong>${metrics.equipmentCount}</strong></div>
      <div class="metric"><span>Ölçüm</span><strong>${metrics.measurementCount}</strong></div>
      <div class="metric"><span>Kritik</span><strong>${metrics.expiredCount}</strong></div>
      <div class="metric"><span>7 Gün</span><strong>${metrics.due7Count}</strong></div>
      <div class="metric"><span>15 Gün</span><strong>${metrics.due15Count}</strong></div>
      <div class="metric"><span>30 Gün</span><strong>${metrics.due30Count}</strong></div>
      <div class="metric"><span>Diğer Uyarı</span><strong>${metrics.otherWarningCount}</strong></div>
      <div class="metric"><span>Uygun</span><strong>${metrics.suitableCount}</strong></div>
    </section>

    <section class="section">
      <h2>1. Kritik ve Yaklaşan Süre Uyarıları</h2>
      <div class="warning-list">
        ${
          criticalRecords ||
          '<div class="empty">Kritik veya yaklaşan süre uyarısı bulunmuyor.</div>'
        }
      </div>
    </section>

    <section class="section">
      <h2>2. İş Ekipmanları Periyodik Kontrol Kayıtları</h2>
      ${
        equipmentRows
          ? `<table>
              <thead>
                <tr>
                  <th>No</th><th>Ekipman</th><th>Tür</th><th>Seri No</th>
                  <th>Konum</th><th>Periyot</th><th>Son Kontrol</th>
                  <th>Sonraki Kontrol</th><th>Kalan Süre</th><th>Rapor No</th>
                  <th>Durum</th><th>Not</th>
                </tr>
              </thead>
              <tbody>${equipmentRows}</tbody>
            </table>`
          : '<div class="empty">İş ekipmanı kaydı bulunmuyor.</div>'
      }
    </section>

    <section class="section">
      <h2>3. Ortam Ölçümü Kayıtları</h2>
      ${
        measurementRows
          ? `<table>
              <thead>
                <tr>
                  <th>No</th><th>Ölçüm Türü</th><th>Alan / Bölüm</th>
                  <th>Ölçüm Tarihi</th><th>Sonraki Ölçüm</th><th>Periyot</th>
                  <th>Ölçümü Yapan</th><th>Rapor No</th><th>Sonuç Özeti</th>
                  <th>Kalan Süre</th><th>Durum</th><th>Not</th>
                </tr>
              </thead>
              <tbody>${measurementRows}</tbody>
            </table>`
          : '<div class="empty">Ortam ölçümü kaydı bulunmuyor.</div>'
      }
    </section>

    <section class="section">
      <h2>4. Genel Değerlendirme</h2>
      <p>
        Bu raporda toplam <strong>${metrics.equipmentCount}</strong> iş ekipmanı
        ve <strong>${metrics.measurementCount}</strong> ortam ölçümü kaydı
        değerlendirilmiştir. Kritik veya süresi geçmiş kayıt sayısı
        <strong>${metrics.expiredCount}</strong>, 30 gün içinde işlem gerektiren
        toplam kayıt sayısı
        <strong>${
          metrics.due7Count + metrics.due15Count + metrics.due30Count
        }</strong> olarak belirlenmiştir.
      </p>
      <p>
        Süresi geçmiş, eksik veya uygun olmayan kayıtlar için gerekli kontrol,
        ölçüm ve düzeltici işlemlerin gecikmeden planlanması önerilir.
      </p>
    </section>

    <section class="signatures">
      <div class="signature">Hazırlayan<br /><strong>İSG Uzmanı</strong></div>
      <div class="signature">Kontrol Eden<br /><strong>İşyeri Yetkilisi</strong></div>
      <div class="signature">Onaylayan<br /><strong>İşveren / İşveren Vekili</strong></div>
    </section>

    <footer class="footer">
      <span>D-SEC Dijital Sağlık • Emniyet • Çevre</span>
      <span>${escapeHtml(selectedCompany.name)}</span>
    </footer>
  </main>

  <script>
    window.addEventListener("load", function () {
      window.setTimeout(function () { window.print(); }, 350);
    });
  </script>
</body>
</html>`;

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  const createExcelReport = () => {
    if (!selectedCompanyId || !selectedCompany) {
      setError("Excel raporu için firma seçmelisiniz.");
      return;
    }

    setError("");

    const generatedAt = new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());

    const equipmentHeader = [
      "Sıra",
      "Ekipman",
      "Tür",
      "Seri No",
      "Konum / Bölüm",
      "Yasal Periyot (Ay)",
      "Son Kontrol",
      "Sonraki Kontrol",
      "Kalan Süre",
      "Rapor No",
      "Durum",
      "Not",
    ];

    const measurementHeader = [
      "Sıra",
      "Ölçüm Türü",
      "Alan / Bölüm",
      "Ölçüm Tarihi",
      "Sonraki Ölçüm",
      "Periyot (Ay)",
      "Ölçümü Yapan",
      "Rapor No",
      "Sonuç Özeti",
      "Kalan Süre",
      "Durum",
      "Not",
    ];

    const equipmentRows = sortByUrgency(equipments)
      .map((item, index) => {
        const info = statusInfo(item.status, item.next_due_millis);
        const statusStyle =
          info.key === "EXPIRED"
            ? "Critical"
            : info.key === "DUE_7"
              ? "RedWarning"
              : info.key === "DUE_15"
                ? "OrangeWarning"
                : info.key === "DUE_30"
                  ? "YellowWarning"
                  : info.key === "SUITABLE"
                    ? "Suitable"
                    : "Warning";

        return `<Row>
          ${excelCell(index + 1, "Cell", "Number")}
          ${excelCell(item.equipment_name)}
          ${excelCell(item.equipment_type || "-")}
          ${excelCell(item.serial_no || "-")}
          ${excelCell(item.location || "-")}
          ${excelCell(item.legal_period_months || 12, "Cell", "Number")}
          ${excelCell(formatDate(item.last_control_millis))}
          ${excelCell(formatDate(item.next_due_millis))}
          ${excelCell(remainingTime(item.next_due_millis))}
          ${excelCell(item.report_no || "-")}
          ${excelCell(info.label, statusStyle)}
          ${excelCell(item.note || "-")}
        </Row>`;
      })
      .join("");

    const measurementRows = sortByUrgency(measurements)
      .map((item, index) => {
        const info = statusInfo(item.status, item.next_due_millis);
        const statusStyle =
          info.key === "EXPIRED"
            ? "Critical"
            : info.key === "DUE_7"
              ? "RedWarning"
              : info.key === "DUE_15"
                ? "OrangeWarning"
                : info.key === "DUE_30"
                  ? "YellowWarning"
                  : info.key === "SUITABLE"
                    ? "Suitable"
                    : "Warning";

        return `<Row>
          ${excelCell(index + 1, "Cell", "Number")}
          ${excelCell(item.measurement_type)}
          ${excelCell(item.area_name || "-")}
          ${excelCell(formatDate(item.measurement_date_millis))}
          ${excelCell(formatDate(item.next_due_millis))}
          ${excelCell(item.legal_period_months || 12, "Cell", "Number")}
          ${excelCell(item.measured_by || "-")}
          ${excelCell(item.report_no || "-")}
          ${excelCell(item.result_summary || "-")}
          ${excelCell(remainingTime(item.next_due_millis))}
          ${excelCell(info.label, statusStyle)}
          ${excelCell(item.note || "-")}
        </Row>`;
      })
      .join("");

    const summaryRows = [
      ["Firma", selectedCompany.name],
      ["Rapor Tarihi", generatedAt],
      ["Toplam İş Ekipmanı", metrics.equipmentCount],
      ["Toplam Ortam Ölçümü", metrics.measurementCount],
      ["Kritik / Süresi Geçen", metrics.expiredCount],
      ["7 Gün İçinde", metrics.due7Count],
      ["15 Gün İçinde", metrics.due15Count],
      ["30 Gün İçinde", metrics.due30Count],
      ["Diğer Uyarı", metrics.otherWarningCount],
      ["Uygun", metrics.suitableCount],
    ]
      .map(
        ([label, value]) =>
          `<Row>${excelCell(label, "SummaryLabel")}${excelCell(value, "SummaryValue")}</Row>`
      )
      .join("");

    const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>D-SEC</Author>
  <Company>D-SEC</Company>
  <Title>Periyodik Kontrol ve Ortam Ölçümleri</Title>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
  <Style ss:ID="Cell"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
  <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16" ss:Color="#FFFFFF"/><Interior ss:Color="#7F1D1D" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>
  <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#991B1B" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#7F1D1D"/></Borders></Style>
  <Style ss:ID="SummaryLabel"><Font ss:Bold="1"/><Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
  <Style ss:ID="SummaryValue"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>
  <Style ss:ID="Critical"><Font ss:Bold="1" ss:Color="#7F1D1D"/><Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/></Style>
  <Style ss:ID="RedWarning"><Font ss:Bold="1" ss:Color="#B91C1C"/><Interior ss:Color="#FEF2F2" ss:Pattern="Solid"/></Style>
  <Style ss:ID="OrangeWarning"><Font ss:Bold="1" ss:Color="#C2410C"/><Interior ss:Color="#FFF7ED" ss:Pattern="Solid"/></Style>
  <Style ss:ID="YellowWarning"><Font ss:Bold="1" ss:Color="#A16207"/><Interior ss:Color="#FEFCE8" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Warning"><Font ss:Bold="1" ss:Color="#92400E"/><Interior ss:Color="#FFFBEB" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Suitable"><Font ss:Bold="1" ss:Color="#047857"/><Interior ss:Color="#ECFDF5" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="Genel Özet">
  <Table>
   <Column ss:Width="190"/><Column ss:Width="220"/>
   <Row ss:Height="28"><Cell ss:MergeAcross="1" ss:StyleID="Title"><Data ss:Type="String">D-SEC PERİYODİK KONTROL DURUM RAPORU</Data></Cell></Row>
   ${summaryRows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><Selected/><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane></WorksheetOptions>
 </Worksheet>
 <Worksheet ss:Name="İş Ekipmanları">
  <Table>
   ${equipmentHeader.map(() => '<Column ss:AutoFitWidth="1" ss:Width="105"/>').join("")}
   <Row ss:Height="28"><Cell ss:MergeAcross="11" ss:StyleID="Title"><Data ss:Type="String">${escapeXml(selectedCompany.name)} - İş Ekipmanları</Data></Cell></Row>
   <Row>${equipmentHeader.map((header) => excelCell(header, "Header")).join("")}</Row>
   ${equipmentRows || `<Row><Cell ss:MergeAcross="11"><Data ss:Type="String">Kayıt bulunmuyor.</Data></Cell></Row>`}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>2</SplitHorizontal><TopRowBottomPane>2</TopRowBottomPane><AutoFilter x:Range="R2C1:R2C12"/></WorksheetOptions>
 </Worksheet>
 <Worksheet ss:Name="Ortam Ölçümleri">
  <Table>
   ${measurementHeader.map(() => '<Column ss:AutoFitWidth="1" ss:Width="105"/>').join("")}
   <Row ss:Height="28"><Cell ss:MergeAcross="11" ss:StyleID="Title"><Data ss:Type="String">${escapeXml(selectedCompany.name)} - Ortam Ölçümleri</Data></Cell></Row>
   <Row>${measurementHeader.map((header) => excelCell(header, "Header")).join("")}</Row>
   ${measurementRows || `<Row><Cell ss:MergeAcross="11"><Data ss:Type="String">Kayıt bulunmuyor.</Data></Cell></Row>`}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>2</SplitHorizontal><TopRowBottomPane>2</TopRowBottomPane><AutoFilter x:Range="R2C1:R2C12"/></WorksheetOptions>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([workbook], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeCompanyName = selectedCompany.name
      .replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ_-]+/g, "_")
      .replace(/^_+|_+$/g, "");

    anchor.href = url;
    anchor.download = `Periyodik_Kontrol_${safeCompanyName || "Firma"}_${new Date()
      .toISOString()
      .slice(0, 10)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
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

              <button
                className="secondaryReportButton"
                onClick={createPdfReport}
                type="button"
              >
                <FileDown size={17} />
                PDF Durum Raporu
              </button>

              <button
                className="excelReportButton"
                onClick={createExcelReport}
                type="button"
              >
                <FileSpreadsheet size={17} />
                Excel Aktar
              </button>

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
        .secondaryReportButton {
          min-height: 43px;
          border: 1px solid #b45309;
          border-radius: 12px;
          background: #fffbeb;
          color: #92400e;
          padding: 0 15px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 900;
          cursor: pointer;
        }

        .excelReportButton {
          min-height: 43px;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          background: #ecfdf5;
          color: #047857;
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