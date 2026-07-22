/* ==========================================================
   D-SEC Enterprise
   Risk Management V2
   Constants
========================================================== */

import type {
  RiskLevel,
  RiskMethod,
} from "./types";

/* ==========================================================
   RISK METHODS
========================================================== */

export const RISK_METHODS: {
  value: RiskMethod;
  label: string;
}[] = [
  {
    value: "FINE_KINNEY",
    label: "Fine Kinney",
  },
  {
    value: "MATRIX_5X5",
    label: "5x5 Risk Matrisi",
  },
];

/* ==========================================================
   RISK LEVELS
========================================================== */

export const RISK_LEVELS: {
  value: RiskLevel;
  label: string;
  color: string;
  background: string;
}[] = [
  {
    value: "LOW",
    label: "Düşük",
    color: "#166534",
    background: "#DCFCE7",
  },
  {
    value: "MEDIUM",
    label: "Orta",
    color: "#92400E",
    background: "#FEF3C7",
  },
  {
    value: "HIGH",
    label: "Yüksek",
    color: "#B45309",
    background: "#FED7AA",
  },
  {
    value: "VERY_HIGH",
    label: "Çok Yüksek",
    color: "#B91C1C",
    background: "#FEE2E2",
  },
  {
    value: "INTOLERABLE",
    label: "Kabul Edilemez",
    color: "#7F1D1D",
    background: "#FECACA",
  },
];

/* ==========================================================
   DANGER CLASS
========================================================== */

export const DANGER_CLASSES = [
  {
    value: "AZ_TEHLIKELI",
    label: "Az Tehlikeli",
  },
  {
    value: "TEHLIKELI",
    label: "Tehlikeli",
  },
  {
    value: "COK_TEHLIKELI",
    label: "Çok Tehlikeli",
  },
];

/* ==========================================================
   SUPPORT TEAMS
========================================================== */

export const SUPPORT_TEAM_TYPES = [
  {
    value: "YANGIN",
    label: "Yangınla Mücadele",
  },
  {
    value: "ARAMA_KURTARMA",
    label: "Arama Kurtarma",
  },
  {
    value: "TAHLIYE",
    label: "Tahliye",
  },
  {
    value: "ILK_YARDIM",
    label: "İlk Yardım",
  },
  {
    value: "KORUMA",
    label: "Koruma",
  },
  {
    value: "HABERLESME",
    label: "Haberleşme",
  },
];

/* ==========================================================
   TEAM ROLE
========================================================== */

export const TEAM_ROLES = [
  {
    value: "EKIP_LIDERI",
    label: "Ekip Lideri",
  },
  {
    value: "EKIP_UYESI",
    label: "Ekip Üyesi",
  },
  {
    value: "YEDEK_UYE",
    label: "Yedek Üye",
  },
];

/* ==========================================================
   SIGNATURE STATUS
========================================================== */

export const SIGNATURE_STATUS = [
  {
    value: "IMZA_BEKLIYOR",
    label: "İmza Bekliyor",
  },
  {
    value: "IMZALANDI",
    label: "İmzalandı",
  },
];

/* ==========================================================
   DRILL TYPES
========================================================== */

export const DRILL_TYPES = [
  {
    value: "YANGIN_TAHLIYE",
    label: "Yangın Tahliye",
  },
  {
    value: "DEPREM",
    label: "Deprem",
  },
  {
    value: "KIMYASAL",
    label: "Kimyasal",
  },
  {
    value: "PATLAMA",
    label: "Patlama",
  },
  {
    value: "GENEL",
    label: "Genel Tatbikat",
  },
];

/* ==========================================================
   DRILL STATUS
========================================================== */

export const DRILL_STATUS = [
  {
    value: "PLANLANDI",
    label: "Planlandı",
  },
  {
    value: "GEÇERLİ",
    label: "Geçerli",
  },
  {
    value: "TAMAMLANDI",
    label: "Tamamlandı",
  },
  {
    value: "IPTAL",
    label: "İptal",
  },
];

/* ==========================================================
   KPI COLORS
========================================================== */

export const KPI_COLORS = {
  primary: "#991B1B",
  success: "#15803D",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#2563EB",
};

/* ==========================================================
   CHART COLORS
========================================================== */

export const CHART_COLORS = [
  "#16A34A",
  "#CA8A04",
  "#EA580C",
  "#DC2626",
  "#7F1D1D",
];