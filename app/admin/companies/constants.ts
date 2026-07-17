export const DEMO_COMPANY_NAME =
  "D-SEC Demo Lojistik ve Depolama A.Ş.";

export const BRAND = {
  red: "#C62828",
  redDark: "#8E1B1B",

  blue: "#1565C0",

  green: "#2E7D32",

  orange: "#EF6C00",

  yellow: "#F9A825",

  text: "#1F2937",

  muted: "#6B7280",

  border: "#E5E7EB",

  background: "#F8FAFC",

  card: "#FFFFFF",
};

export const COMPANY_STATUS = [
  {
    value: "ALL",
    label: "Tüm Firmalar",
  },
  {
    value: "ACTIVE",
    label: "Aktif",
  },
  {
    value: "PASSIVE",
    label: "Pasif",
  },
  {
    value: "DEMO",
    label: "Demo Firma",
  },
] as const;

export const COMPANY_SORT = [
  {
    value: "NAME",
    label: "Firma Adı",
  },
  {
    value: "EMPLOYEE",
    label: "Çalışan Sayısı",
  },
  {
    value: "NEWEST",
    label: "En Yeni",
  },
] as const;

export const DANGER_CLASS_COLOR = {
  "Az Tehlikeli": "#2E7D32",

  "Tehlikeli": "#EF6C00",

  "Çok Tehlikeli": "#C62828",
} as const;

export const PERFORMANCE_STATUS = {
  GOOD: {
    color: "#2E7D32",
    text: "İYİ",
  },

  DEVELOP: {
    color: "#F9A825",
    text: "GELİŞTİR",
  },

  HIGH: {
    color: "#EF6C00",
    text: "YÜKSEK",
  },

  CRITICAL: {
    color: "#C62828",
    text: "KRİTİK",
  },
} as const;

export const DEFAULT_FILTERS = {
  status: "ALL",

  sort: "NAME",

  search: "",
};

export const KPI_ICONS = {
  employee: "👷",

  training: "🎓",

  audit: "🔍",

  health: "❤️",

  accident: "⚠️",

  dof: "✅",
};