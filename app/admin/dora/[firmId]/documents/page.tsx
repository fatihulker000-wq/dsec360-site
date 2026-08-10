"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

type DoraFirm = {
  id: string;
  firm_name: string;
  danger_class?: string | null;
  sector?: string | null;
  nace_code?: string | null;
  authorized_person?: string | null;
  employee_count?: number | null;
};

type DoraDocument = {
  id: string;
  firm_id: string;

  sync_key?: string | null;
  app_local_id?: number | null;
  app_firm_local_id?: number | null;

  document_type: string;
  title: string;
  status?: string | null;

  content_json?: Record<string, unknown> | null;
  file_url?: string | null;

  version_no?: number | null;
  note?: string | null;

  document_no?: string | null;
  revision_no?: number | null;
  revision_date_millis?: number | null;

  effective_date_millis?: number | null;
  expiry_date_millis?: number | null;

  prepared_by?: string | null;
  approved_by?: string | null;
  approval_status?: string | null;

  template_key?: string | null;
  template_version?: number | null;
  generated_by_dora?: boolean | null;

  created_at_millis?: number | null;
  updated_at_millis?: number | null;
};

type DoraFirmResponse = {
  success?: boolean;
  error?: string;
  firm?: DoraFirm;
};

type DoraDocumentsResponse = {
  success?: boolean;
  error?: string;
  documents?: DoraDocument[];
  document?: DoraDocument;
};

type DoraDocumentTemplate = {
  key: string;
  title: string;
  description: string;
  category: string;
  defaultContent: string[];
};

type DoraDocumentForm = {
  id: string;

  documentType: string;
  title: string;
  category: string;
  documentNo: string;

  status: string;
  approvalStatus: string;

  versionNo: string;
  revisionNo: string;

  preparedBy: string;
  approvedBy: string;

  effectiveDate: string;
  expiryDate: string;

  note: string;
  bodyText: string;
};

const DOCUMENT_TEMPLATES: DoraDocumentTemplate[] = [
  {
    key: "ISG_POLITIKASI",
    title: "İSG Politikası",
    description:
      "Firmanın iş sağlığı ve güvenliği yaklaşımını, hedeflerini ve yönetim taahhüdünü tanımlar.",
    category: "Politika",
    defaultContent: [
      "Amaç ve Kapsam",
      "Yönetimin Taahhüdü",
      "Yasal Uyum",
      "Çalışan Katılımı",
      "Sürekli İyileştirme",
      "İSG Hedefleri",
    ],
  },
  {
    key: "ACIL_DURUM_EYLEM_PLANI",
    title: "Acil Durum Eylem Planı",
    description:
      "Acil durum senaryoları, organizasyon, görevler, iletişim ve tahliye esasları için başlangıç taslağı.",
    category: "Acil Durum",
    defaultContent: [
      "Amaç ve Kapsam",
      "Acil Durum Senaryoları",
      "Organizasyon ve Sorumluluklar",
      "Tahliye Esasları",
      "Toplanma Alanı",
      "İletişim ve Haberleşme",
      "Tatbikat ve Gözden Geçirme",
    ],
  },
  {
    key: "YILLIK_EGITIM_PLANI",
    title: "Yıllık İSG Eğitim Planı",
    description:
      "Yıllık eğitim ihtiyaçlarını, planlanan konuları, hedef grupları ve dönemleri yapılandırır.",
    category: "Eğitim",
    defaultContent: [
      "Yıllık Eğitim Hedefleri",
      "Hedef Çalışan Grupları",
      "Planlanan Eğitim Konuları",
      "Eğitim Dönemleri",
      "Eğitici / Sorumlu",
      "Ölçme ve Değerlendirme",
    ],
  },
  {
    key: "RISK_DEGERLENDIRME_EKIBI",
    title: "Risk Değerlendirme Ekibi Dokümanı",
    description:
      "DORA içinde tanımlı çalışanlardan risk değerlendirme ekibi kurulmasına yönelik görevlendirme taslağı.",
    category: "Risk",
    defaultContent: [
      "Ekip Oluşturma Amacı",
      "Ekip Üyeleri",
      "Görev ve Sorumluluklar",
      "Çalışma Esasları",
      "Fine Kinney Değerlendirme Yaklaşımı",
      "Onay ve Yürürlük",
    ],
  },
  {
    key: "ISG_KURUL_DOKUMANI",
    title: "İSG Kurul Dokümanı",
    description:
      "İSG kurulunun oluşumu, üyeleri, görevleri ve toplantı çalışma esasları için hızlı taslak.",
    category: "Kurul",
    defaultContent: [
      "Kurulun Oluşumu",
      "Kurul Üyeleri",
      "Görev ve Yetkiler",
      "Toplantı Periyodu",
      "Kararların Takibi",
      "Sekretarya ve Kayıt",
    ],
  },
  {
    key: "ACIL_DESTEK_EKIPLERI",
    title: "Acil Durum Destek Ekipleri",
    description:
      "Yangın, arama-kurtarma, tahliye, koruma ve ilk yardım organizasyonu için görevlendirme taslağı.",
    category: "Acil Durum",
    defaultContent: [
      "Ekip Yapısı",
      "Yangınla Mücadele",
      "Arama Kurtarma",
      "Tahliye",
      "Koruma",
      "İlk Yardım",
      "Görevlendirme ve İletişim",
    ],
  },
  {
    key: "KKD_ZIMMET_FORMU",
    title: "KKD Zimmet / Teslim Formu",
    description:
      "Çalışanlara verilen kişisel koruyucu donanımların kayıt altına alınması için hızlı form.",
    category: "KKD",
    defaultContent: [
      "Çalışan Bilgileri",
      "Teslim Edilen KKD",
      "Teslim Tarihi",
      "Kullanım ve Bakım Sorumluluğu",
      "Çalışan Beyanı",
      "İmza Alanları",
    ],
  },
  {
    key: "TEMEL_ISG_TALIMATLARI",
    title: "Temel İSG Talimatları",
    description:
      "İşyerinde genel güvenli çalışma kurallarını hızlı şekilde yayımlamak için başlangıç metni.",
    category: "Talimat",
    defaultContent: [
      "Genel Güvenlik Kuralları",
      "KKD Kullanımı",
      "Makine ve Ekipman Güvenliği",
      "Elektrik Güvenliği",
      "Acil Durum Kuralları",
      "Ramak Kala ve Olay Bildirimi",
    ],
  },
  {
    key: "ISG_TAAHHUTNAMESI",
    title: "İSG Taahhütnamesi",
    description:
      "Çalışan veya görevlilerin iş sağlığı ve güvenliği kurallarına uyum taahhüdü için taslak.",
    category: "Taahhüt",
    defaultContent: [
      "Kurallara Uyum",
      "KKD Kullanım Taahhüdü",
      "Talimatlara Uyum",
      "Tehlike Bildirimi",
      "Yetkisiz Müdahale Yasağı",
      "Çalışan Beyanı",
    ],
  },
  {
    key: "EGITIM_KATILIM_FORMU",
    title: "Eğitim Katılım Formu",
    description:
      "DORA içindeki eğitim faaliyetlerinin katılımcı kayıtlarını belgelemek için form taslağı.",
    category: "Eğitim",
    defaultContent: [
      "Eğitim Bilgileri",
      "Eğitim Konusu",
      "Eğitim Tarihi",
      "Eğitici",
      "Katılımcılar",
      "İmza Alanları",
    ],
  },
  {
    key: "EK2_SAGLIK_FORMU",
    title: "EK-2 Sağlık Formu Taslağı",
    description:
      "DORA içinde hızlı sağlık dokümanı hazırlığı için taslak kayıt. Ana Sağlık modülüne bağlı değildir.",
    category: "Sağlık",
    defaultContent: [
      "Çalışan Bilgileri",
      "İş / Görev Bilgisi",
      "Sağlık Değerlendirme Alanı",
      "Muayene Notları",
      "Sonuç / Kanaat",
      "İmza Alanları",
    ],
  },
];

const EMPTY_FORM: DoraDocumentForm = {
  id: "",
  documentType: "",
  title: "",
  category: "",
  documentNo: "",
  status: "DRAFT",
  approvalStatus: "DRAFT",
  versionNo: "1",
  revisionNo: "0",
  preparedBy: "",
  approvedBy: "",
  effectiveDate: "",
  expiryDate: "",
  note: "",
  bodyText: "",
};

function value(input: unknown): string {
  return String(input ?? "").trim();
}

function normalizeStatus(input?: string | null): string {
  return value(input).toUpperCase();
}

function statusLabel(input?: string | null): string {
  const normalized = normalizeStatus(input);

  switch (normalized) {
    case "DRAFT":
      return "Taslak";

    case "READY":
      return "Hazır";

    case "APPROVED":
    case "ONAYLANDI":
      return "Onaylandı";

    case "REVISION":
    case "REVIZYONDA":
      return "Revizyonda";

    case "ARCHIVED":
      return "Arşiv";

    default:
      return normalized
        ? normalized
            .replaceAll("_", " ")
            .toLocaleLowerCase("tr-TR")
            .replace(
              /(^|\s)\S/g,
              (char) =>
                char.toLocaleUpperCase("tr-TR")
            )
        : "Taslak";
  }
}

function statusClass(input?: string | null): string {
  const normalized = normalizeStatus(input);

  if (
    normalized === "APPROVED" ||
    normalized === "ONAYLANDI"
  ) {
    return "approved";
  }

  if (
    normalized === "READY"
  ) {
    return "ready";
  }

  if (
    normalized === "REVISION" ||
    normalized === "REVIZYONDA"
  ) {
    return "revision";
  }

  return "draft";
}

function dateInputFromMillis(
  input?: number | null
): string {
  if (!input) {
    return "";
  }

  const date = new Date(input);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function millisFromDateInput(
  input: string
): number | null {
  const trimmed =
    input.trim();

  if (!trimmed) {
    return null;
  }

  const date =
    new Date(
      `${trimmed}T00:00:00`
    );

  const time =
    date.getTime();

  return Number.isNaN(time)
    ? null
    : time;
}

function formatDate(
  input?: number | null
): string {
  if (!input) {
    return "-";
  }

  const date =
    new Date(input);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "tr-TR"
  );
}

function bodyTextFromDocument(
  document: DoraDocument
): string {
  const content =
    document.content_json;

  if (
    content &&
    typeof content === "object"
  ) {
    const body =
      (content as Record<string, unknown>)
        .body;

    if (
      typeof body === "string"
    ) {
      return body;
    }

    const sections =
      (content as Record<string, unknown>)
        .sections;

    if (
      Array.isArray(sections)
    ) {
      return sections
        .map((item) =>
          typeof item === "string"
            ? item
            : ""
        )
        .filter(Boolean)
        .join("\n\n");
    }
  }

  return "";
}

function slugifyDocumentType(
  input: string
): string {
  const normalized =
    input
      .trim()
      .toLocaleUpperCase("tr-TR")
      .replaceAll("İ", "I")
      .replaceAll("Ş", "S")
      .replaceAll("Ğ", "G")
      .replaceAll("Ü", "U")
      .replaceAll("Ö", "O")
      .replaceAll("Ç", "C")
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  return normalized
    ? `CUSTOM_${normalized.slice(0, 48)}`
    : `CUSTOM_${Date.now()}`;
}

function customDocumentBody(
  firm: DoraFirm,
  title: string
): string {
  return [
    title,
    "",
    `Firma: ${firm.firm_name}`,
    `Sektör: ${firm.sector || "-"}`,
    `NACE: ${firm.nace_code || "-"}`,
    `Tehlike Sınıfı: ${firm.danger_class || "-"}`,
    `Yetkili: ${firm.authorized_person || "-"}`,
    "",
    "Amaç ve Kapsam",
    "Bu bölüm kullanıcı tarafından düzenlenebilir.",
    "",
    "Uygulama Esasları",
    "Bu bölüm kullanıcı tarafından düzenlenebilir.",
    "",
    "Görev ve Sorumluluklar",
    "Bu bölüm kullanıcı tarafından düzenlenebilir.",
    "",
    "Kayıt ve İzleme",
    "Bu bölüm kullanıcı tarafından düzenlenebilir.",
  ].join("\\n");
}

function createDefaultBody(
  template: DoraDocumentTemplate,
  firm: DoraFirm
): string {
  const header = [
    `${template.title}`,
    "",
    `Firma: ${firm.firm_name}`,
    `Sektör: ${firm.sector || "-"}`,
    `NACE: ${firm.nace_code || "-"}`,
    `Tehlike Sınıfı: ${firm.danger_class || "-"}`,
    `Yetkili: ${firm.authorized_person || "-"}`,
    "",
  ];

  const sections =
    template.defaultContent.flatMap(
      (section) => [
        section,
        "Bu bölüm DORA tarafından başlangıç taslağı olarak oluşturulmuştur. Firma koşullarına göre düzenleyiniz.",
        "",
      ]
    );

  return [
    ...header,
    ...sections,
  ].join("\n");
}

export default function DoraDocumentsPage() {
  const router = useRouter();
  const params = useParams();

  const firmId =
    value(params.firmId);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [firm, setFirm] =
    useState<DoraFirm | null>(
      null
    );

  const [documents, setDocuments] =
    useState<DoraDocument[]>([]);

  const [search, setSearch] =
    useState("");

  const [formOpen, setFormOpen] =
    useState(false);

  const [previewOpen, setPreviewOpen] =
    useState(false);

  const [form, setForm] =
    useState<DoraDocumentForm>(
      EMPTY_FORM
    );

  const [previewDocument, setPreviewDocument] =
    useState<DoraDocument | null>(
      null
    );

  const load = useCallback(
    async () => {
      if (!firmId) {
        setError(
          "DORA firma ID bulunamadı."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          firmResponse,
          documentResponse,
        ] = await Promise.all([
          fetch(
            `/api/dora/firms?id=${encodeURIComponent(
              firmId
            )}`,
            {
              cache: "no-store",
            }
          ),

          fetch(
            `/api/dora/documents?firmId=${encodeURIComponent(
              firmId
            )}`,
            {
              cache: "no-store",
            }
          ),
        ]);

        const firmJson =
          (await firmResponse.json()) as DoraFirmResponse;

        const documentJson =
          (await documentResponse.json()) as DoraDocumentsResponse;

        if (
          !firmResponse.ok ||
          firmJson.success === false
        ) {
          throw new Error(
            firmJson.error ||
              "DORA firma bilgileri alınamadı."
          );
        }

        if (
          !documentResponse.ok ||
          documentJson.success === false
        ) {
          throw new Error(
            documentJson.error ||
              "DORA dokümanları alınamadı."
          );
        }

        setFirm(
          firmJson.firm ?? null
        );

        setDocuments(
          Array.isArray(
            documentJson.documents
          )
            ? documentJson.documents
            : []
        );
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "DORA Doküman Merkezi yüklenemedi."
        );
      } finally {
        setLoading(false);
      }
    },
    [firmId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const documentMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          DoraDocument
        >();

      documents.forEach(
        (document) => {
          map.set(
            normalizeStatus(
              document.document_type
            ),
            document
          );
        }
      );

      return map;
    }, [documents]);

  const filteredTemplates =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      if (!q) {
        return DOCUMENT_TEMPLATES;
      }

      return DOCUMENT_TEMPLATES.filter(
        (template) =>
          [
            template.title,
            template.description,
            template.category,
            template.key,
          ]
            .join(" ")
            .toLocaleLowerCase(
              "tr-TR"
            )
            .includes(q)
      );
    }, [search]);

  const draftCount =
    documents.filter(
      (document) =>
        normalizeStatus(
          document.status
        ) === "DRAFT"
    ).length;

  const readyCount =
    documents.filter(
      (document) =>
        normalizeStatus(
          document.status
        ) === "READY"
    ).length;

  const approvedCount =
    documents.filter(
      (document) =>
        [
          "APPROVED",
          "ONAYLANDI",
        ].includes(
          normalizeStatus(
            document.approval_status ||
              document.status
          )
        )
    ).length;

  const revisionCount =
    documents.filter(
      (document) =>
        [
          "REVISION",
          "REVIZYONDA",
        ].includes(
          normalizeStatus(
            document.status
          )
        )
    ).length;

  function openCustomDocument() {
    if (!firm) {
      return;
    }

    setForm({
      ...EMPTY_FORM,
      documentType: "",
      title: "",
      category: "Özel Doküman",
      documentNo: "",
      preparedBy:
        firm.authorized_person ||
        "",
      bodyText:
        customDocumentBody(
          firm,
          "Yeni DORA Dokümanı"
        ),
    });

    setFormOpen(true);
  }

  function openNewDocument(
    template: DoraDocumentTemplate
  ) {
    if (!firm) {
      return;
    }

    const existing =
      documentMap.get(
        template.key
      );

    if (existing) {
      editDocument(existing);
      return;
    }

    setForm({
      ...EMPTY_FORM,

      documentType:
        template.key,

      title:
        template.title,

      category:
        template.category,

      documentNo:
        `DORA-${template.key}`,

      preparedBy:
        firm.authorized_person ||
        "",

      bodyText:
        createDefaultBody(
          template,
          firm
        ),
    });

    setFormOpen(true);
  }

  function editDocument(
    document: DoraDocument
  ) {
    setForm({
      id:
        document.id,

      documentType:
        document.document_type,

      title:
        document.title,

      category:
        String(
          (
            document.content_json as
              | Record<string, unknown>
              | null
              | undefined
          )?.category ?? ""
        ),

      documentNo:
        value(
          document.document_no
        ),

      status:
        normalizeStatus(
          document.status
        ) || "DRAFT",

      approvalStatus:
        normalizeStatus(
          document.approval_status
        ) || "DRAFT",

      versionNo:
        String(
          Math.max(
            1,
            Number(
              document.version_no ??
                1
            )
          )
        ),

      revisionNo:
        String(
          Math.max(
            0,
            Number(
              document.revision_no ??
                0
            )
          )
        ),

      preparedBy:
        value(
          document.prepared_by
        ),

      approvedBy:
        value(
          document.approved_by
        ),

      effectiveDate:
        dateInputFromMillis(
          document.effective_date_millis
        ),

      expiryDate:
        dateInputFromMillis(
          document.expiry_date_millis
        ),

      note:
        value(
          document.note
        ),

      bodyText:
        bodyTextFromDocument(
          document
        ),
    });

    setFormOpen(true);
  }

  function preview(
    document: DoraDocument
  ) {
    setPreviewDocument(
      document
    );

    setPreviewOpen(true);
  }

  async function saveDocument() {
    if (
      !form.title.trim()
    ) {
      alert(
        "Doküman başlığı zorunludur."
      );
      return;
    }

    const derivedDocumentType =
      form.documentType.trim() ||
      slugifyDocumentType(
        form.title
      );

    try {
      setSaving(true);

      const editing =
        Boolean(form.id);

      const response =
        await fetch(
          "/api/dora/documents",
          {
            method:
              editing
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  form.id ||
                  undefined,

                firmId,

                documentType:
                  derivedDocumentType,

                title:
                  form.title,

                documentNo:
                  form.documentNo,

                status:
                  form.status,

                approvalStatus:
                  form.approvalStatus,

                versionNo:
                  Number(
                    form.versionNo ||
                      1
                  ),

                revisionNo:
                  Number(
                    form.revisionNo ||
                      0
                  ),

                revisionDateMillis:
                  Number(
                    form.revisionNo ||
                      0
                  ) > 0
                    ? Date.now()
                    : null,

                effectiveDateMillis:
                  millisFromDateInput(
                    form.effectiveDate
                  ),

                expiryDateMillis:
                  millisFromDateInput(
                    form.expiryDate
                  ),

                preparedBy:
                  form.preparedBy,

                approvedBy:
                  form.approvedBy,

                templateKey:
                  form.documentType.trim()
                    ? form.documentType
                    : derivedDocumentType,

                templateVersion:
                  1,

                generatedByDora:
                  true,

                note:
                  form.note,

                contentJson: {
                  body:
                    form.bodyText,

                  category:
                    form.category,

                  customDocument:
                    form.documentType.trim() === "",

                  source:
                    "DORA_WEB",

                  updatedAtMillis:
                    Date.now(),
                },
              }),
          }
        );

      const json =
        (await response.json()) as DoraDocumentsResponse;

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "DORA dokümanı kaydedilemedi."
        );
      }

      setFormOpen(false);

      setForm({
        ...EMPTY_FORM,
      });

      await load();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "DORA dokümanı kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  async function quickStatus(
    document: DoraDocument,
    status: string
  ) {
    try {
      setSaving(true);

      const approved =
        status === "APPROVED";

      const response =
        await fetch(
          "/api/dora/documents",
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  document.id,

                firmId,

                status,

                approvalStatus:
                  approved
                    ? "APPROVED"
                    : document.approval_status ||
                      "DRAFT",

                approvedBy:
                  approved
                    ? document.approved_by ||
                      firm?.authorized_person ||
                      ""
                    : document.approved_by ||
                      "",
              }),
          }
        );

      const json =
        (await response.json()) as DoraDocumentsResponse;

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "Doküman durumu güncellenemedi."
        );
      }

      await load();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Doküman durumu güncellenemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  function downloadPdf(
    document: DoraDocument
  ) {
    const url =
      `/api/dora/documents/pdf?id=${encodeURIComponent(
        document.id
      )}&firmId=${encodeURIComponent(
        firmId
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function deleteDocument(
    document: DoraDocument
  ) {
    const ok =
      window.confirm(
        `${document.title} DORA dokümanı silinsin mi?\n\nBu işlem yalnızca DORA doküman kaydını etkiler.`
      );

    if (!ok) {
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/dora/documents",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  document.id,

                firmId,
              }),
          }
        );

      const json =
        (await response.json()) as DoraDocumentsResponse;

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "DORA dokümanı silinemedi."
        );
      }

      await load();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "DORA dokümanı silinemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          DORA Doküman Merkezi
          yükleniyor...
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (
    error ||
    !firm
  ) {
    return (
      <main className="page">
        <div className="topbar">
          <button
            className="back"
            onClick={() =>
              router.push(
                `/admin/dora/${firmId}`
              )
            }
          >
            ← DORA
          </button>
        </div>

        <div className="error">
          {error ||
            "DORA firma bilgisi bulunamadı."}
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="topbar">
        <button
          className="back"
          onClick={() =>
            router.push(
              `/admin/dora/${firmId}`
            )
          }
        >
          ← DORA Çalışma Alanı
        </button>

        <button
          className="refresh"
          onClick={() =>
            void load()
          }
        >
          Yenile
        </button>
      </div>

      <section className="hero">
        <div>
          <div className="eyebrow">
            DORA • BAĞIMSIZ HIZLI DOKÜMAN ÜRETİMİ
          </div>

          <h1>
            Hızlı Doküman Merkezi
          </h1>

          <p>
            {firm.firm_name} için
            DORA&apos;nın kendi
            bağımsız dokümanlarını
            oluşturun, düzenleyin,
            önizleyin ve yönetin.
          </p>

          <div className="heroMeta">
            <span>
              {documents.length} oluşturulmuş doküman
            </span>

            <span>
              DORA verisi
            </span>

            <span>
              Ana Dokümantasyon&apos;dan bağımsız
            </span>
          </div>
        </div>

        <div className="heroSide">
          <button
            className="heroNewButton"
            onClick={openCustomDocument}
          >
            + Yeni Doküman
          </button>

          <div className="heroMark">
            DORA
            <span>
              DOC
            </span>
          </div>
        </div>
      </section>

      <section className="kpis">
        <Kpi
          title="Toplam"
          value={
            documents.length
          }
          detail="Oluşturulmuş doküman"
        />

        <Kpi
          title="Taslak"
          value={
            draftCount
          }
          detail="Düzenleme aşamasında"
        />

        <Kpi
          title="Hazır / Onaylı"
          value={
            readyCount +
            approvedCount
          }
          detail={`${readyCount} hazır • ${approvedCount} onaylı`}
        />

        <Kpi
          title="Revizyon"
          value={
            revisionCount
          }
          detail="Revizyon bekleyen"
        />
      </section>

      <section className="section">
        <div className="sectionTitle">
          <div>
            <div className="sectionEyebrow">
              DORA DOKÜMAN KATALOĞU
            </div>

            <h2>
              Hızlı oluşturulabilir dokümanlar
            </h2>

            <p>
              Hazır 11 şablondan birini kullanın
              veya ihtiyacınıza göre yeni bir
              DORA dokümanı oluşturun.
            </p>
          </div>

          <button
            className="primary"
            onClick={openCustomDocument}
          >
            + Yeni Doküman
          </button>
        </div>

        <div className="toolbar">
          <input
            className="search"
            placeholder="Doküman, kategori veya açıklama ara..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          <div className="resultCount">
            {filteredTemplates.length}
            {" "}şablon
          </div>
        </div>

        <div className="templateGrid">
          {filteredTemplates.map(
            (template) => {
              const existing =
                documentMap.get(
                  template.key
                );

              return (
                <article
                  className="templateCard"
                  key={template.key}
                >
                  <div className="templateTop">
                    <div className="templateIcon">
                      D
                    </div>

                    <div className="templateIdentity">
                      <span>
                        {template.category}
                      </span>

                      <h3>
                        {template.title}
                      </h3>
                    </div>

                    <div
                      className={`docState ${
                        existing
                          ? statusClass(
                              existing.approval_status ||
                                existing.status
                            )
                          : "emptyState"
                      }`}
                    >
                      {existing
                        ? statusLabel(
                            existing.approval_status ||
                              existing.status
                          )
                        : "Oluşturulmadı"}
                    </div>
                  </div>

                  <p>
                    {template.description}
                  </p>

                  {existing && (
                    <div className="templateInfo">
                      <span>
                        No:{" "}
                        {existing.document_no ||
                          "-"}
                      </span>

                      <span>
                        Rev:{" "}
                        {existing.revision_no ??
                          0}
                      </span>
                    </div>
                  )}

                  <div className="templateActions">
                    <button
                      className="primary"
                      onClick={() =>
                        openNewDocument(
                          template
                        )
                      }
                    >
                      {existing
                        ? "Düzenle"
                        : "Oluştur"}
                    </button>

                    {existing && (
                      <>
                        <button
                          className="outline"
                          onClick={() =>
                            preview(
                              existing
                            )
                          }
                        >
                          Önizle
                        </button>

                        <button
                          className="pdfBtn"
                          onClick={() =>
                            downloadPdf(
                              existing
                            )
                          }
                        >
                          PDF İndir
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <div>
            <div className="sectionEyebrow">
              OLUŞTURULAN DOKÜMANLAR
            </div>

            <h2>
              DORA Doküman Arşivi
            </h2>

            <p>
              Yalnızca bu DORA
              firmasına ait dokümanlar.
            </p>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="empty">
            <div className="emptyMark">
              D
            </div>

            <h3>
              Henüz doküman oluşturulmadı
            </h3>

            <p>
              Yukarıdaki hızlı
              doküman kataloğundan
              bir doküman seçerek
              başlayabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="documentList">
            {documents.map(
              (document) => (
                <article
                  className="documentRow"
                  key={document.id}
                >
                  <div className="docMain">
                    <div className="docIcon">
                      D
                    </div>

                    <div>
                      <h3>
                        {document.title}
                      </h3>

                      <div className="docMeta">
                        <span>
                          {document.document_no ||
                            "-"}
                        </span>

                        <span>
                          v
                          {document.version_no ??
                            1}
                        </span>

                        <span>
                          Rev.
                          {document.revision_no ??
                            0}
                        </span>

                        <span>
                          {formatDate(
                            document.updated_at_millis
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`docState ${statusClass(
                      document.approval_status ||
                        document.status
                    )}`}
                  >
                    {statusLabel(
                      document.approval_status ||
                        document.status
                    )}
                  </div>

                  <div className="rowActions">
                    <button
                      className="outline"
                      onClick={() =>
                        preview(
                          document
                        )
                      }
                    >
                      Önizle
                    </button>

                    <button
                      className="pdfBtn"
                      onClick={() =>
                        downloadPdf(
                          document
                        )
                      }
                    >
                      PDF İndir
                    </button>

                    <button
                      className="outline"
                      onClick={() =>
                        editDocument(
                          document
                        )
                      }
                    >
                      Düzenle
                    </button>

                    <button
                      className="outline"
                      disabled={saving}
                      onClick={() =>
                        void quickStatus(
                          document,
                          "READY"
                        )
                      }
                    >
                      Hazır
                    </button>

                    <button
                      className="approveBtn"
                      disabled={saving}
                      onClick={() =>
                        void quickStatus(
                          document,
                          "APPROVED"
                        )
                      }
                    >
                      Onayla
                    </button>

                    <button
                      className="dangerBtn"
                      disabled={saving}
                      onClick={() =>
                        void deleteDocument(
                          document
                        )
                      }
                    >
                      Sil
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      <section className="independence">
        <div className="independenceMark">
          D
        </div>

        <div>
          <strong>
            DORA Doküman Merkezi bağımsızdır.
          </strong>

          <p>
            Bu ekranda oluşturulan
            dokümanlar yalnızca
            dora_documents veri
            alanında tutulur. Ana
            D-SEC Dokümantasyon,
            Eğitim, Sağlık, Acil
            Durum veya diğer
            modüllere otomatik kayıt
            yapılmaz.
          </p>
        </div>
      </section>

      {formOpen && (
        <div
          className="modalBackdrop"
          onMouseDown={() =>
            !saving &&
            setFormOpen(false)
          }
        >
          <div
            className="modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modalHeader">
              <div>
                <div className="sectionEyebrow">
                  DORA DOKÜMAN EDİTÖRÜ
                </div>

                <h2>
                  {form.title ||
                    "DORA Dokümanı"}
                </h2>

                <p>
                  Başlangıç taslağını
                  firma koşullarına göre
                  düzenleyin.
                </p>
              </div>

              <button
                className="close"
                disabled={saving}
                onClick={() =>
                  setFormOpen(false)
                }
              >
                ×
              </button>
            </div>

            {!form.documentType && (
              <div className="customNotice">
                <strong>
                  Özel DORA Dokümanı
                </strong>

                <span>
                  Bu doküman hazır 11 şablondan bağımsız
                  oluşturulacaktır. Kaydedildiğinde
                  DORA içinde benzersiz bir doküman türü
                  otomatik üretilecektir.
                </span>
              </div>
            )}

            <div className="formGrid">
              <Field
                label="Doküman Başlığı *"
                value={form.title}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      title: v,
                      bodyText:
                        !old.id &&
                        !old.documentType &&
                        firm
                          ? customDocumentBody(
                              firm,
                              v || "Yeni DORA Dokümanı"
                            )
                          : old.bodyText,
                    })
                  )
                }
              />

              <Field
                label="Kategori"
                value={form.category}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      category: v,
                    })
                  )
                }
              />

              <Field
                label="Doküman No"
                value={
                  form.documentNo
                }
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      documentNo: v,
                    })
                  )
                }
              />

              <label className="field">
                <span>
                  Doküman Durumu
                </span>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm(
                      (old) => ({
                        ...old,
                        status:
                          event.target.value,
                      })
                    )
                  }
                >
                  <option value="DRAFT">
                    Taslak
                  </option>

                  <option value="READY">
                    Hazır
                  </option>

                  <option value="REVISION">
                    Revizyonda
                  </option>

                  <option value="APPROVED">
                    Onaylandı
                  </option>
                </select>
              </label>

              <label className="field">
                <span>
                  Onay Durumu
                </span>

                <select
                  value={
                    form.approvalStatus
                  }
                  onChange={(event) =>
                    setForm(
                      (old) => ({
                        ...old,
                        approvalStatus:
                          event.target.value,
                      })
                    )
                  }
                >
                  <option value="DRAFT">
                    Taslak
                  </option>

                  <option value="READY">
                    Hazır
                  </option>

                  <option value="APPROVED">
                    Onaylandı
                  </option>
                </select>
              </label>

              <Field
                label="Versiyon"
                value={
                  form.versionNo
                }
                type="number"
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      versionNo: v,
                    })
                  )
                }
              />

              <Field
                label="Revizyon No"
                value={
                  form.revisionNo
                }
                type="number"
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      revisionNo: v,
                    })
                  )
                }
              />

              <Field
                label="Hazırlayan"
                value={
                  form.preparedBy
                }
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      preparedBy: v,
                    })
                  )
                }
              />

              <Field
                label="Onaylayan"
                value={
                  form.approvedBy
                }
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      approvedBy: v,
                    })
                  )
                }
              />

              <Field
                label="Yürürlük Tarihi"
                value={
                  form.effectiveDate
                }
                type="date"
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      effectiveDate: v,
                    })
                  )
                }
              />

              <Field
                label="Geçerlilik Bitişi"
                value={
                  form.expiryDate
                }
                type="date"
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      expiryDate: v,
                    })
                  )
                }
              />
            </div>

            <div className="editorSection">
              <label className="field">
                <span>
                  Doküman İçeriği
                </span>

                <textarea
                  className="editor"
                  rows={22}
                  value={
                    form.bodyText
                  }
                  onChange={(event) =>
                    setForm(
                      (old) => ({
                        ...old,
                        bodyText:
                          event.target.value,
                      })
                    )
                  }
                />
              </label>

              <label className="field">
                <span>
                  Not
                </span>

                <textarea
                  rows={4}
                  value={form.note}
                  onChange={(event) =>
                    setForm(
                      (old) => ({
                        ...old,
                        note:
                          event.target.value,
                      })
                    )
                  }
                />
              </label>
            </div>

            <div className="modalActions">
              <button
                className="outline"
                disabled={saving}
                onClick={() =>
                  setFormOpen(false)
                }
              >
                Vazgeç
              </button>

              <button
                className="primary"
                disabled={saving}
                onClick={() =>
                  void saveDocument()
                }
              >
                {saving
                  ? "Kaydediliyor..."
                  : "Dokümanı Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewOpen &&
        previewDocument && (
          <div
            className="modalBackdrop"
            onMouseDown={() =>
              setPreviewOpen(false)
            }
          >
            <div
              className="previewModal"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="previewHeader">
                <div>
                  <div className="sectionEyebrow">
                    DORA ÖNİZLEME
                  </div>

                  <h2>
                    {previewDocument.title}
                  </h2>
                </div>

                <div className="previewHeaderActions">
                  <button
                    className="pdfBtn"
                    onClick={() =>
                      downloadPdf(
                        previewDocument
                      )
                    }
                  >
                    PDF İndir
                  </button>

                  <button
                    className="close"
                    onClick={() =>
                      setPreviewOpen(false)
                    }
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="previewInfoGrid">
                <PreviewInfo
                  label="Doküman No"
                  value={
                    previewDocument.document_no ||
                    "-"
                  }
                />

                <PreviewInfo
                  label="Versiyon"
                  value={String(
                    previewDocument.version_no ??
                      1
                  )}
                />

                <PreviewInfo
                  label="Revizyon"
                  value={String(
                    previewDocument.revision_no ??
                      0
                  )}
                />

                <PreviewInfo
                  label="Durum"
                  value={statusLabel(
                    previewDocument.approval_status ||
                      previewDocument.status
                  )}
                />

                <PreviewInfo
                  label="Hazırlayan"
                  value={
                    previewDocument.prepared_by ||
                    "-"
                  }
                />

                <PreviewInfo
                  label="Onaylayan"
                  value={
                    previewDocument.approved_by ||
                    "-"
                  }
                />

                <PreviewInfo
                  label="Yürürlük"
                  value={formatDate(
                    previewDocument.effective_date_millis
                  )}
                />

                <PreviewInfo
                  label="Geçerlilik"
                  value={formatDate(
                    previewDocument.expiry_date_millis
                  )}
                />
              </div>

              <div className="paper">
                <div className="paperHeader">
                  <strong>
                    {firm.firm_name}
                  </strong>

                  <span>
                    {previewDocument.document_no ||
                      "DORA"}
                  </span>
                </div>

                <h1>
                  {previewDocument.title}
                </h1>

                <pre>
                  {bodyTextFromDocument(
                    previewDocument
                  ) ||
                    "Doküman içeriği bulunamadı."}
                </pre>
              </div>
            </div>
          </div>
        )}

      <style jsx>{styles}</style>
    </main>
  );
}

function Kpi({
  title,
  value: kpiValue,
  detail,
}: {
  title: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="kpi">
      <span>{title}</span>

      <strong>{kpiValue}</strong>

      <small>{detail}</small>
    </article>
  );
}

function Field({
  label,
  value: fieldValue,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>

      <input
        type={type}
        value={fieldValue}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />
    </label>
  );
}

function PreviewInfo({
  label,
  value: previewValue,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="previewInfo">
      <span>{label}</span>
      <strong>{previewValue}</strong>
    </div>
  );
}

const styles = `
  :global(*) {
    box-sizing: border-box;
  }

  .page {
    min-height: 100vh;
    padding: 24px;
    color: #172033;
    background:
      linear-gradient(
        180deg,
        #f7f8fb 0%,
        #ffffff 430px
      );
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  .topbar {
    max-width: 1450px;
    margin: 0 auto 14px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .back,
  .refresh,
  .outline,
  .dangerBtn,
  .approveBtn,
  .pdfBtn {
    border: 1px solid #d0d5dd;
    background: #ffffff;
    color: #344054;
    padding: 10px 14px;
    border-radius: 12px;
    font-weight: 750;
    cursor: pointer;
  }

  .dangerBtn {
    color: #b42318;
    border-color: #fecdca;
    background: #fffafa;
  }

  .approveBtn {
    color: #027a48;
    border-color: #abefc6;
    background: #ecfdf3;
  }

  .pdfBtn {
    color: #ffffff;
    border-color: #7a2633;
    background: #7a2633;
  }

  .pdfBtn:hover {
    background: #641f2a;
    border-color: #641f2a;
  }

  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .hero {
    max-width: 1450px;
    margin: 0 auto;
    min-height: 235px;
    padding: 30px;
    border-radius: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    color: #ffffff;
    background:
      radial-gradient(
        circle at 82% 20%,
        rgba(255,255,255,0.18),
        transparent 28%
      ),
      linear-gradient(
        120deg,
        #50141f 0%,
        #7a2633 48%,
        #d0602c 100%
      );
    box-shadow:
      0 22px 50px
      rgba(73,20,31,0.17);
  }

  .eyebrow,
  .sectionEyebrow {
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.14em;
  }

  .eyebrow {
    color: rgba(255,255,255,0.76);
    margin-bottom: 10px;
  }

  .sectionEyebrow {
    color: #8c3543;
    margin-bottom: 7px;
  }

  .hero h1 {
    margin: 0;
    font-size: clamp(34px, 5vw, 56px);
    letter-spacing: -0.04em;
  }

  .hero p {
    margin: 14px 0 0;
    max-width: 760px;
    color: rgba(255,255,255,0.86);
    line-height: 1.6;
  }

  .heroMeta {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
    margin-top: 17px;
  }

  .heroMeta span {
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.11);
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 750;
  }

  .heroSide {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 0 0 auto;
  }

  .heroNewButton {
    border: 1px solid rgba(255,255,255,0.28);
    background: rgba(255,255,255,0.12);
    color: #ffffff;
    padding: 12px 15px;
    border-radius: 13px;
    font-weight: 850;
    cursor: pointer;
  }

  .heroNewButton:hover {
    background: rgba(255,255,255,0.18);
  }

  .heroMark {
    width: 145px;
    height: 145px;
    flex: 0 0 auto;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.94);
    color: #70202d;
    font-size: 22px;
    font-weight: 950;
  }

  .heroMark span {
    display: block;
    margin-top: 2px;
    font-size: 11px;
    letter-spacing: 0.14em;
  }

  .kpis {
    max-width: 1400px;
    margin: -26px auto 0;
    position: relative;
    z-index: 3;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 13px;
  }

  .kpi {
    min-height: 116px;
    padding: 17px;
    border-radius: 19px;
    background: #ffffff;
    border: 1px solid #eaecf0;
    box-shadow:
      0 14px 34px
      rgba(16,24,40,0.07);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .kpi span {
    color: #667085;
    font-size: 12px;
    font-weight: 800;
  }

  .kpi strong {
    color: #531823;
    font-size: 32px;
    margin: 7px 0;
  }

  .kpi small {
    color: #98a2b3;
  }

  .section,
  .independence {
    max-width: 1450px;
    margin-left: auto;
    margin-right: auto;
  }

  .section {
    margin-top: 26px;
    background: #ffffff;
    border: 1px solid #eaecf0;
    border-radius: 23px;
    padding: 22px;
  }

  .sectionTitle {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }

  .sectionTitle h2 {
    margin: 0;
  }

  .sectionTitle p {
    margin: 7px 0 0;
    color: #667085;
    line-height: 1.55;
  }

  .toolbar {
    margin-top: 18px;
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .search {
    flex: 1;
    border: 1px solid #d0d5dd;
    border-radius: 13px;
    padding: 12px 13px;
    outline: none;
  }

  .resultCount {
    color: #667085;
    font-size: 13px;
    font-weight: 750;
  }

  .templateGrid {
    margin-top: 17px;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .templateCard {
    min-height: 260px;
    border: 1px solid #e4e7ec;
    border-radius: 20px;
    padding: 17px;
    background: #fcfcfd;
    display: flex;
    flex-direction: column;
  }

  .templateTop {
    display: flex;
    gap: 11px;
    align-items: flex-start;
  }

  .templateIcon,
  .docIcon {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    background: #f5e9eb;
    color: #7a2633;
    font-weight: 950;
  }

  .templateIcon {
    width: 43px;
    height: 43px;
    border-radius: 13px;
  }

  .templateIdentity {
    flex: 1;
    min-width: 0;
  }

  .templateIdentity span {
    color: #98a2b3;
    font-size: 10px;
    font-weight: 850;
  }

  .templateIdentity h3 {
    margin: 3px 0 0;
    color: #101828;
    font-size: 16px;
  }

  .templateCard > p {
    color: #667085;
    line-height: 1.55;
    font-size: 13px;
    flex: 1;
  }

  .templateInfo {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    color: #667085;
    font-size: 11px;
    margin-bottom: 10px;
  }

  .templateActions {
    display: flex;
    gap: 8px;
  }

  .primary {
    border: 0;
    background: #7a2633;
    color: #ffffff;
    padding: 11px 15px;
    border-radius: 12px;
    font-weight: 850;
    cursor: pointer;
  }

  .docState {
    flex: 0 0 auto;
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 900;
  }

  .docState.draft {
    background: #f2f4f7;
    color: #667085;
  }

  .docState.ready {
    background: #fff7ed;
    color: #b54708;
  }

  .docState.approved {
    background: #ecfdf3;
    color: #027a48;
  }

  .docState.revision {
    background: #fef3f2;
    color: #b42318;
  }

  .docState.emptyState {
    background: #f2f4f7;
    color: #98a2b3;
  }

  .documentList {
    display: grid;
    gap: 10px;
  }

  .documentRow {
    display: grid;
    grid-template-columns:
      minmax(260px, 1fr)
      auto
      minmax(420px, auto);
    gap: 12px;
    align-items: center;
    padding: 14px;
    border: 1px solid #eaecf0;
    border-radius: 16px;
    background: #fcfcfd;
  }

  .docMain {
    display: flex;
    gap: 11px;
    align-items: center;
    min-width: 0;
  }

  .docIcon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .docMain h3 {
    margin: 0;
    font-size: 15px;
  }

  .docMeta {
    margin-top: 4px;
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
    color: #98a2b3;
    font-size: 10px;
  }

  .rowActions {
    display: flex;
    gap: 7px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .empty {
    margin-top: 12px;
    padding: 42px 20px;
    text-align: center;
    border: 1px dashed #d0d5dd;
    border-radius: 18px;
    background: #fcfcfd;
  }

  .emptyMark {
    width: 58px;
    height: 58px;
    margin: 0 auto 11px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    background: #f5e9eb;
    color: #7a2633;
    font-weight: 950;
    font-size: 20px;
  }

  .empty h3 {
    margin: 0;
  }

  .empty p {
    color: #667085;
    margin: 7px 0 0;
  }

  .independence {
    margin-top: 22px;
    margin-bottom: 34px;
    border-radius: 19px;
    padding: 18px;
    display: flex;
    gap: 13px;
    background: #fff8f5;
    border: 1px solid #f8d9ce;
  }

  .independenceMark {
    width: 43px;
    height: 43px;
    flex: 0 0 auto;
    border-radius: 13px;
    display: grid;
    place-items: center;
    background: #7a2633;
    color: #ffffff;
    font-weight: 950;
  }

  .independence strong {
    color: #6e1f2c;
  }

  .independence p {
    margin: 5px 0 0;
    color: #80545c;
    font-size: 13px;
    line-height: 1.55;
  }

  .modalBackdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    padding: 24px;
    background: rgba(15,23,42,0.55);
    backdrop-filter: blur(6px);
    display: grid;
    place-items: center;
    overflow-y: auto;
  }

  .modal,
  .previewModal {
    width: min(1050px, 100%);
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    background: #ffffff;
    border-radius: 23px;
    box-shadow:
      0 30px 80px
      rgba(15,23,42,0.28);
  }

  .modalHeader,
  .previewHeader {
    padding: 21px;
    display: flex;
    justify-content: space-between;
    gap: 14px;
    align-items: flex-start;
    border-bottom: 1px solid #eaecf0;
  }

  .modalHeader h2,
  .previewHeader h2 {
    margin: 0;
  }

  .previewHeaderActions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .modalHeader p {
    margin: 6px 0 0;
    color: #667085;
  }

  .close {
    width: 37px;
    height: 37px;
    border: 1px solid #eaecf0;
    border-radius: 11px;
    background: #ffffff;
    color: #667085;
    font-size: 24px;
    cursor: pointer;
  }

  .customNotice {
    margin: 18px 21px 0;
    padding: 13px 14px;
    border-radius: 14px;
    background: #fff8f5;
    border: 1px solid #f8d9ce;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .customNotice strong {
    color: #6e1f2c;
  }

  .customNotice span {
    color: #80545c;
    font-size: 12px;
    line-height: 1.5;
  }

  .formGrid {
    padding: 21px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 13px;
  }

  .editorSection {
    padding: 0 21px 21px;
    display: grid;
    gap: 13px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .field span {
    color: #475467;
    font-size: 12px;
    font-weight: 800;
  }

  .field input,
  .field select,
  .field textarea {
    width: 100%;
    border: 1px solid #d0d5dd;
    background: #ffffff;
    border-radius: 12px;
    padding: 11px 12px;
    color: #172033;
    outline: none;
  }

  .field textarea {
    resize: vertical;
  }

  .editor {
    min-height: 420px;
    line-height: 1.55;
    font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Consolas,
      monospace;
  }

  .modalActions {
    padding: 17px 21px 21px;
    border-top: 1px solid #eaecf0;
    display: flex;
    justify-content: flex-end;
    gap: 9px;
  }

  .previewInfoGrid {
    padding: 18px 21px 0;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 9px;
  }

  .previewInfo {
    padding: 10px;
    border-radius: 12px;
    background: #f9fafb;
    border: 1px solid #f0f1f3;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .previewInfo span {
    color: #98a2b3;
    font-size: 10px;
    font-weight: 800;
  }

  .previewInfo strong {
    color: #344054;
    font-size: 12px;
  }

  .paper {
    margin: 20px;
    padding: 45px 55px;
    min-height: 700px;
    border: 1px solid #e4e7ec;
    background: #ffffff;
    box-shadow:
      0 10px 28px
      rgba(16,24,40,0.06);
  }

  .paperHeader {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    padding-bottom: 13px;
    border-bottom: 2px solid #7a2633;
    color: #531823;
  }

  .paper h1 {
    text-align: center;
    margin: 35px 0;
    color: #172033;
  }

  .paper pre {
    white-space: pre-wrap;
    word-break: break-word;
    font-family: inherit;
    line-height: 1.7;
    color: #344054;
  }

  .loading,
  .error {
    max-width: 900px;
    margin: 60px auto;
    padding: 20px;
    border-radius: 16px;
  }

  .loading {
    background: #ffffff;
    border: 1px solid #eaecf0;
    color: #667085;
    text-align: center;
  }

  .error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    font-weight: 700;
  }

  @media (
    max-width: 1180px
  ) {
    .templateGrid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .documentRow {
      grid-template-columns: 1fr;
    }

    .rowActions {
      justify-content: flex-start;
    }
  }

  @media (
    max-width: 900px
  ) {
    .kpis {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .previewInfoGrid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (
    max-width: 700px
  ) {
    .page {
      padding: 14px;
    }

    .hero {
      min-height: auto;
      padding: 22px 18px;
      border-radius: 22px;
    }

    .heroSide {
      width: 100%;
      justify-content: flex-start;
    }

    .heroNewButton {
      width: 100%;
    }

    .heroMark {
      display: none;
    }

    .sectionTitle {
      flex-direction: column;
      align-items: stretch;
    }

    .kpis {
      margin-top: 14px;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .templateGrid,
    .formGrid,
    .previewInfoGrid {
      grid-template-columns: 1fr;
    }

    .toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .paper {
      margin: 12px;
      padding: 24px 18px;
    }

    .modalBackdrop {
      padding: 12px;
    }
  }
`;