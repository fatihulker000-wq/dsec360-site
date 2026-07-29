import type {
  DocumentationCategory,
  DocumentationStatus,
  DocumentFormData,
} from "./types";

export const DOCUMENTATION_CATEGORIES: Array<{
  value: DocumentationCategory;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "TRAINING",
    label: "Eğitim Dokümanları",
    shortLabel: "Eğitim",
    description:
      "Eğitim sertifikaları, katılım kayıtları ve eğitim dokümanları",
  },
  {
    value: "INSPECTION",
    label: "Denetim Dokümanları",
    shortLabel: "Denetim",
    description:
      "Denetim formları, kontrol listeleri ve raporlar",
  },
  {
    value: "RISK",
    label: "Risk Değerlendirmeleri",
    shortLabel: "Risk",
    description:
      "Risk analizleri ve aksiyon planları",
  },
  {
    value: "FORMS",
    label: "Formlar",
    shortLabel: "Form",
    description:
      "Kurumsal formlar ve şablonlar",
  },
  {
    value: "INSTRUCTIONS",
    label: "Talimat ve Prosedürler",
    shortLabel: "Talimat",
    description:
      "İş talimatları ve prosedürler",
  },
  {
    value: "BOARD",
    label: "Kurul Evrakları",
    shortLabel: "Kurul",
    description:
      "İSG Kurulu evrakları",
  },
  {
    value: "EMPLOYEE_REPRESENTATIVE",
    label: "Çalışan Temsilcisi",
    shortLabel: "Temsilci",
    description:
      "Temsilci seçim ve görevlendirme kayıtları",
  },
  {
    value: "PERIODIC_CONTROL",
    label: "Periyodik Kontroller",
    shortLabel: "Kontrol",
    description:
      "Makine, ekipman ve ortam ölçümleri",
  },
];

export const DOCUMENTATION_STATUSES: Array<{
  value: DocumentationStatus;
  label: string;
}> = [
  {
    value: "DRAFT",
    label: "Taslak",
  },
  {
    value: "ACTIVE",
    label: "Aktif",
  },
  {
    value: "REVISION",
    label: "Revizyonda",
  },
  {
    value: "EXPIRED",
    label: "Süresi Doldu",
  },
];

export const DOCUMENT_UPLOAD_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp";

export const DOCUMENT_UPLOAD_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "jpg",
  "jpeg",
  "png",
  "webp",
] as const;

export const DOCUMENT_UPLOAD_MIME_TYPES = [
  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",

  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "image/jpeg",

  "image/png",

  "image/webp",
] as const;

export const DEFAULT_DOCUMENT_MAX_SIZE_MB = 25;

export const DOCUMENT_STATUS_COLORS = {
  DRAFT: "#64748b",

  ACTIVE: "#16a34a",

  REVISION: "#ea580c",

  EXPIRED: "#dc2626",
};

export const DOCUMENT_CATEGORY_ICONS = {
  TRAINING: "🎓",

  INSPECTION: "📋",

  RISK: "⚠",

  FORMS: "📄",

  INSTRUCTIONS: "📘",

  BOARD: "🏛",

  EMPLOYEE_REPRESENTATIVE: "👤",

  PERIODIC_CONTROL: "🛠",
};

export function createEmptyDocumentForm(
  firmId: string = ""
): DocumentFormData {
  return {
    firmId,

    category: "INSTRUCTIONS",

    title: "",

    documentNo: "",

    revisionNo: "R0",

    department: "",

    preparedBy: "",

    controlledBy: "",

    approvedBy: "",

    publishedAt: new Date()
      .toISOString()
      .substring(0, 10),

    validUntil: "",

    revisionReason: "",

    description: "",

    status: "DRAFT",

    file: null,
  };
}

export function getCategoryLabel(
  category: DocumentationCategory
) {
  return (
    DOCUMENTATION_CATEGORIES.find(
      (item) => item.value === category
    )?.label ?? category
  );
}

export function getCategoryIcon(
  category: DocumentationCategory
) {
  return DOCUMENT_CATEGORY_ICONS[category];
}

export function getStatusLabel(
  status: DocumentationStatus
) {
  return (
    DOCUMENTATION_STATUSES.find(
      (item) => item.value === status
    )?.label ?? status
  );
}

export function getStatusColor(
  status: DocumentationStatus
) {
  return (
    DOCUMENT_STATUS_COLORS[status] ??
    "#64748b"
  );
}