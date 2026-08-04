"use client";

import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Edit3,
  Eye,
  FilePlus2,
  FileText,
  Layers3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Trash2,
  Upload,
  X,
  BarChart3,
  CalendarDays,
  Download,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Company = { id: string; name: string };

type AuditMode =
  | "CLASSIC"
  | "PHOTO"
  | "SCORING"
  | "ELMERI";

type FormItem = {
  orderNo: number;
  title: string;
  question: string;
  expectedCondition: string;
  requiredAction: string;
  legalReference: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  photoRequired: boolean;
  explanationRequired: boolean;
  actionRequired: boolean;
  score: number;
  weight: number;
};

type InspectionForm = {
  id: string;
  firm_id: string | null;
  visibility: "GLOBAL" | "FIRM";
  title: string;
  code: string;
  category: string;
  form_type: "STANDARD" | "PHOTO" | "SCORING" | "ELMERI";
  audit_modes: AuditMode[];
  description: string;
  version_no: number;
  status: "DRAFT" | "PUBLISHED" | "REVISION" | "PASSIVE";
  prepared_by: string;
  approved_by: string;
  item_count: number;
  usage_count: number;
  updated_at: string;
  items?: Array<{
    id: string;
    order_no: number;
    title: string;
    question: string;
    expected_condition: string;
    required_action: string;
    legal_reference: string;
    risk_level: FormItem["riskLevel"];
    photo_required: boolean;
    explanation_required: boolean;
    action_required: boolean;
    score: number;
    weight: number;
  }>;
};

type InspectionReport = {
  id: string;
  firm_id: string;
  form_id: string | null;
  inspection_remote_id: string | null;
  form_title: string;
  inspector_name: string;
  inspection_date: string | null;
  compliance_rate: number | null;
  total_item_count: number;
  compliant_count: number;
  partial_count: number;
  non_compliant_count: number;
  critical_count: number;
  report_status: string;
  generated_pdf_url: string | null;
  signed_pdf_url: string | null;
  created_at: string;
  updated_at: string;
  form?: {
    id: string;
    title: string;
    code: string;
    category: string;
    form_type: string;
    version_no: number;
  } | null;
};

type Editor = {
  id?: string;
  firmId: string;
  visibility: "GLOBAL" | "FIRM";
  title: string;
  code: string;
  category: string;
  formType: InspectionForm["form_type"];
  auditModes: AuditMode[];
  description: string;
  status: InspectionForm["status"];
  preparedBy: string;
  approvedBy: string;
  changeNote: string;
  items: FormItem[];
};

const newItem = (orderNo: number): FormItem => ({
  orderNo,
  title: "",
  question: "",
  expectedCondition: "",
  requiredAction: "",
  legalReference: "",
  riskLevel: "MEDIUM",
  photoRequired: false,
  explanationRequired: false,
  actionRequired: false,
  score: 0,
  weight: 1,
});

const newEditor = (firmId = ""): Editor => ({
  firmId,
  visibility: "FIRM",
  title: "",
  code: "",
  category: "GENEL",
  formType: "STANDARD",
  auditModes: [
    "CLASSIC",
    "PHOTO",
    "SCORING",
    "ELMERI",
  ],
  description: "",
  status: "DRAFT",
  preparedBy: "",
  approvedBy: "",
  changeNote: "",
  items: [newItem(1)],
});

function formToEditor(form: InspectionForm): Editor {
  return {
    id: form.id,
    firmId: form.firm_id || "",
    visibility: form.visibility,
    title: form.title,
    code: form.code,
    category: form.category,
    formType: form.form_type,
    auditModes:
      Array.isArray(form.audit_modes) &&
      form.audit_modes.length
        ? form.audit_modes
        : [
            "CLASSIC",
            "PHOTO",
            "SCORING",
            "ELMERI",
          ],
    description: form.description,
    status: form.status,
    preparedBy: form.prepared_by,
    approvedBy: form.approved_by,
    changeNote: "",
    items: (form.items || [])
      .sort((a, b) => a.order_no - b.order_no)
      .map((item) => ({
        orderNo: item.order_no,
        title: item.title,
        question: item.question,
        expectedCondition: item.expected_condition,
        requiredAction: item.required_action,
        legalReference: item.legal_reference,
        riskLevel: item.risk_level,
        photoRequired: item.photo_required,
        explanationRequired: item.explanation_required,
        actionRequired: item.action_required,
        score: Number(item.score || 0),
        weight: Number(item.weight || 1),
      })),
  };
}

const statusText: Record<InspectionForm["status"], string> = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayında",
  REVISION: "Revizyonda",
  PASSIVE: "Pasif",
};

const auditModeText: Record<
  AuditMode,
  string
> = {
  CLASSIC: "Klasik Denetim",
  PHOTO: "Fotoğraflı Denetim",
  SCORING: "Puanlamalı Denetim",
  ELMERI: "ELMERI Denetimi",
};

const auditModeOptions:
  AuditMode[] = [
    "CLASSIC",
    "PHOTO",
    "SCORING",
    "ELMERI",
  ];

const typeText: Record<InspectionForm["form_type"], string> = {
  STANDARD: "Standart",
  PHOTO: "Fotoğraflı",
  SCORING: "Puanlamalı",
  ELMERI: "Elmeri",
};

export default function InspectionFormsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [forms, setForms] = useState<InspectionForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState<Editor>(newEditor());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [preview, setPreview] = useState<InspectionForm | null>(null);
  const [activeTab, setActiveTab] =
    useState<"FORMS" | "REPORTS">("FORMS");
  const [reports, setReports] =
    useState<InspectionReport[]>([]);
  const [reportsLoading, setReportsLoading] =
    useState(false);
  const [reportSearch, setReportSearch] =
    useState("");

  const loadCompanies = useCallback(async () => {
    const response = await fetch("/api/admin/companies", {
      credentials: "include",
      cache: "no-store",
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error || "Firmalar alınamadı.");

    const rows = (Array.isArray(json.data) ? json.data : [])
      .map((item: any) => ({
        id: String(item.id || ""),
        name: String(item.name || item.title || item.company_name || ""),
      }))
      .filter((item: Company) => item.id && item.name);

    setCompanies(rows);
    setCompanyId((current) => current || rows[0]?.id || "");
  }, []);

  const loadForms = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const query = new URLSearchParams();
      if (companyId) query.set("firmId", companyId);

      const response = await fetch(
        `/api/admin/documentation/inspection-forms?${query.toString()}`,
        { credentials: "include", cache: "no-store" }
      );
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.detail || json.error || "Denetim formları alınamadı."
        );
      }

      setForms(Array.isArray(json.forms) ? json.forms : []);
    } catch (loadError) {
      setForms([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Denetim formları yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadCompanies().catch((e) =>
      setError(e instanceof Error ? e.message : "Firmalar alınamadı.")
    );
  }, [loadCompanies]);

  useEffect(() => {
    void loadForms();
  }, [loadForms]);

  const loadReports =
    useCallback(async () => {
      try {
        setReportsLoading(true);

        const query =
          new URLSearchParams();

        if (companyId) {
          query.set(
            "firmId",
            companyId
          );
        }

        const response = await fetch(
          `/api/admin/documentation/inspection-reports?${query.toString()}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const json = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            json.detail ||
              json.error ||
              "Denetim raporları alınamadı."
          );
        }

        setReports(
          Array.isArray(json.reports)
            ? json.reports
            : []
        );
      } catch (reportError) {
        setReports([]);
        setError(
          reportError instanceof Error
            ? reportError.message
            : "Denetim raporları yüklenemedi."
        );
      } finally {
        setReportsLoading(false);
      }
    }, [companyId]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const filteredForms = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");

    return forms.filter((form) => {
      const text = [
        form.title,
        form.code,
        form.category,
        form.description,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return (
        (!q || text.includes(q)) &&
        (!statusFilter || form.status === statusFilter) &&
        (!typeFilter || form.form_type === typeFilter)
      );
    });
  }, [forms, search, statusFilter, typeFilter]);

  const filteredReports =
    useMemo(() => {
      const query = reportSearch
        .trim()
        .toLocaleLowerCase("tr-TR");

      if (!query) {
        return reports;
      }

      return reports.filter((report) =>
        [
          report.form_title,
          report.inspector_name,
          report.report_status,
        ]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(query)
      );
    }, [reports, reportSearch]);

  const archiveCharts =
    useMemo(() => {
      const now = new Date();

      const monthRows = Array.from(
        { length: 6 },
        (_, index) => {
          const date = new Date(
            now.getFullYear(),
            now.getMonth() -
              (5 - index),
            1
          );

          return {
            key: `${date.getFullYear()}-${String(
              date.getMonth() + 1
            ).padStart(2, "0")}`,
            label: date.toLocaleDateString(
              "tr-TR",
              {
                month: "short",
                year: "2-digit",
              }
            ),
            count: 0,
          };
        }
      );

      const monthMap = new Map(
        monthRows.map((row) => [
          row.key,
          row,
        ])
      );

      reports.forEach((report) => {
        const rawDate =
          report.inspection_date ||
          report.created_at;

        if (!rawDate) return;

        const date = new Date(rawDate);

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return;
        }

        const key =
          `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;

        const row =
          monthMap.get(key);

        if (row) {
          row.count += 1;
        }
      });

      const categoryCounts =
        new Map<string, number>();

      reports.forEach((report) => {
        const category =
          report.form?.category
            ?.trim() ||
          report.form_title
            ?.trim() ||
          "Diğer";

        categoryCounts.set(
          category,
          (
            categoryCounts.get(
              category
            ) || 0
          ) + 1
        );
      });

      const categories =
        Array.from(
          categoryCounts.entries()
        )
          .map(
            ([label, count]) => ({
              label,
              count,
            })
          )
          .sort(
            (first, second) =>
              second.count -
              first.count
          )
          .slice(0, 6);

      const formCounts =
        new Map<string, number>();

      reports.forEach((report) => {
        const title =
          report.form_title
            ?.trim() ||
          "Adsız Form";

        formCounts.set(
          title,
          (
            formCounts.get(title) ||
            0
          ) + 1
        );
      });

      const mostUsedForms =
        Array.from(
          formCounts.entries()
        )
          .map(
            ([label, count]) => ({
              label,
              count,
            })
          )
          .sort(
            (first, second) =>
              second.count -
              first.count
          )
          .slice(0, 5);

      const signed =
        reports.filter(
          (report) =>
            !!report.signed_pdf_url
        ).length;

      const generatedOnly =
        reports.filter(
          (report) =>
            !report.signed_pdf_url &&
            !!report.generated_pdf_url
        ).length;

      const withoutPdf =
        reports.length -
        signed -
        generatedOnly;

      return {
        months: monthRows,
        categories,
        mostUsedForms,
        documentStatus: [
          {
            label: "İmzalı",
            count: signed,
          },
          {
            label: "PDF Var",
            count: generatedOnly,
          },
          {
            label: "Belge Bekliyor",
            count: withoutPdf,
          },
        ],
      };
    }, [reports]);

  const metrics = useMemo(
    () => ({
      total: forms.length,
      published: forms.filter((f) => f.status === "PUBLISHED").length,
      draft: forms.filter((f) => f.status === "DRAFT").length,
      revision: forms.filter((f) => f.status === "REVISION").length,
      passive: forms.filter((f) => f.status === "PASSIVE").length,
      items: forms.reduce((sum, f) => sum + Number(f.item_count || 0), 0),
      reports: reports.length,
      signedReports: reports.filter(
        (report) =>
          !!report.signed_pdf_url
      ).length,
    }),
    [forms, reports]
  );

  const updateItem = (index: number, patch: Partial<FormItem>) => {
    setEditor((current) => ({
      ...current,
      items: current.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));
  };

  const removeItem = (index: number) => {
    setEditor((current) => ({
      ...current,
      items: current.items
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, orderNo: i + 1 })),
    }));
  };

  const saveForm = async (publish: boolean) => {
    try {
      setSaving(true);
      setError("");

      if (!editor.title.trim()) {
        throw new Error(
          "Form adı zorunludur."
        );
      }

      if (!editor.auditModes.length) {
        throw new Error(
          "En az bir denetim çeşidi seçilmelidir."
        );
      }

      const items = editor.items
        .filter((item) => item.title.trim() || item.question.trim())
        .map((item, index) => ({ ...item, orderNo: index + 1 }));

      if (!items.length) throw new Error("En az bir madde ekleyin.");

      const response = await fetch(
        "/api/admin/documentation/inspection-forms",
        {
          method: editor.id ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editor,
            firmId:
              editor.visibility === "GLOBAL"
                ? ""
                : editor.firmId || companyId,
            status: publish ? "PUBLISHED" : editor.status,
            items,
          }),
        }
      );

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.detail || json.error || "Form kaydedilemedi.");
      }

      setEditorOpen(false);
      await loadForms();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Form kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  const action = async (id: string, actionName: string) => {
    try {
      const response = await fetch(
        "/api/admin/documentation/inspection-forms",
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action: actionName }),
        }
      );

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.detail || json.error || "İşlem başarısız.");
      }

      await loadForms();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "İşlem başarısız."
      );
    }
  };

  const deleteForm = async (form: InspectionForm) => {
    if (!window.confirm(`"${form.title}" formu silinsin mi?`)) return;

    const response = await fetch(
      `/api/admin/documentation/inspection-forms?id=${encodeURIComponent(
        form.id
      )}`,
      { method: "DELETE", credentials: "include" }
    );

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(json.detail || json.error || "Form silinemedi.");
      return;
    }

    await loadForms();
  };

  const importBulk = () => {
    const rawRows = bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!rawRows.length) {
      setError(
        "Toplu aktarım alanında madde bulunamadı."
      );
      return;
    }

    const parseColumns = (
      line: string
    ): string[] => {
      if (line.includes("|")) {
        return line
          .split("|")
          .map((value) => value.trim());
      }

      if (line.includes("\t")) {
        return line
          .split("\t")
          .map((value) => value.trim());
      }

      if (line.includes(";")) {
        return line
          .split(";")
          .map((value) => value.trim());
      }

      return [line];
    };

    const normalizeRisk = (
      value: string
    ): FormItem["riskLevel"] => {
      const risk = value
        .trim()
        .toLocaleUpperCase("tr-TR");

      const riskMap: Record<
        string,
        FormItem["riskLevel"]
      > = {
        LOW: "LOW",
        DÜŞÜK: "LOW",
        DUSUK: "LOW",
        MEDIUM: "MEDIUM",
        ORTA: "MEDIUM",
        HIGH: "HIGH",
        YÜKSEK: "HIGH",
        YUKSEK: "HIGH",
        CRITICAL: "CRITICAL",
        KRİTİK: "CRITICAL",
        KRITIK: "CRITICAL",
      };

      return riskMap[risk] || "MEDIUM";
    };

    const toBoolean = (
      value: string
    ): boolean =>
      [
        "EVET",
        "TRUE",
        "1",
        "YES",
        "X",
      ].includes(
        value
          .trim()
          .toLocaleUpperCase("tr-TR")
      );

    const firstColumns =
      parseColumns(rawRows[0]);

    const firstText = firstColumns
      .join(" ")
      .toLocaleLowerCase("tr-TR");

    const hasHeader =
      firstText.includes("başlık") &&
      (
        firstText.includes("soru") ||
        firstText.includes("önlem")
      );

    const dataRows = hasHeader
      ? rawRows.slice(1)
      : rawRows;

    const imported: FormItem[] =
      dataRows
        .map((line, index) => {
          const columns =
            parseColumns(line);

          const title =
            columns[0] || "";

          const question =
            columns[1] ||
            columns[0] ||
            "";

          if (
            !title.trim() &&
            !question.trim()
          ) {
            return null;
          }

          return {
            orderNo: index + 1,
            title,
            question,
            expectedCondition:
              columns[2] || "",
            requiredAction:
              columns[3] || "",
            legalReference:
              columns[4] || "",
            riskLevel:
              normalizeRisk(
                columns[5] || "MEDIUM"
              ),
            photoRequired:
              toBoolean(
                columns[6] || ""
              ),
            explanationRequired:
              toBoolean(
                columns[7] || ""
              ),
            actionRequired:
              toBoolean(
                columns[8] || ""
              ),
            score:
              Number(
                String(
                  columns[9] || "0"
                ).replace(",", ".")
              ) || 0,
            weight:
              Number(
                String(
                  columns[10] || "1"
                ).replace(",", ".")
              ) || 1,
          } satisfies FormItem;
        })
        .filter(
          (
            item
          ): item is FormItem =>
            item !== null
        );

    if (!imported.length) {
      setError(
        "Aktarılabilecek geçerli denetim maddesi bulunamadı."
      );
      return;
    }

    setEditor((current) => {
      const existing =
        current.items.filter(
          (item) =>
            item.title.trim() ||
            item.question.trim()
        );

      return {
        ...current,
        items: [
          ...existing,
          ...imported,
        ].map(
          (item, index) => ({
            ...item,
            orderNo: index + 1,
          })
        ),
      };
    });

    setError("");
    setBulkText("");
    setBulkOpen(false);
  };

  return (
    <main className="page">
      <section className="hero">
        <div>
          <small>D-SEC DENETİM ALTYAPISI</small>
          <h1>Denetim Form Merkezi</h1>
          <p>
            Denetimlerde kullanılacak formları oluşturun, tek tek veya toplu
            madde ekleyin, yayınlayın ve Denetim Modülünde kullanıma açın.
          </p>
        </div>

        <div className="heroButtons">
          <button onClick={() => void loadForms()}>
            <RefreshCw size={17} />
            Yenile
          </button>

          <button
            className="whiteButton"
            onClick={() => {
              setEditor(newEditor(companyId));
              setEditorOpen(true);
            }}
          >
            <FilePlus2 size={17} />
            Yeni Form
          </button>
        </div>

        <div className="metrics">
          <Metric title="Toplam Form" value={metrics.total} icon={<Layers3 />} />
          <Metric
            title="Yayında"
            value={metrics.published}
            icon={<CheckCircle2 />}
          />
          <Metric title="Taslak" value={metrics.draft} icon={<FileText />} />
          <Metric title="Revizyonda" value={metrics.revision} icon={<Edit3 />} />
          <Metric title="Pasif" value={metrics.passive} icon={<Archive />} />
          <Metric
            title="Toplam Madde"
            value={metrics.items}
            icon={<ClipboardCheck />}
          />
        </div>
      </section>

      {error ? (
        <section className="error">
          <AlertTriangle size={18} />
          {error}
        </section>
      ) : null}

      <section className="moduleTabs">
        <button
          className={
            activeTab === "FORMS"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("FORMS")
          }
        >
          <ClipboardCheck size={17} />
          Form Kütüphanesi
          <span>{forms.length}</span>
        </button>

        <button
          className={
            activeTab === "REPORTS"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("REPORTS")
          }
        >
          <Archive size={17} />
          Denetim Raporları
          <span>{reports.length}</span>
        </button>
      </section>

      {activeTab === "FORMS" ? (
        <>
          <section className="toolbar">
        <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tüm Durumlar</option>
          <option value="DRAFT">Taslak</option>
          <option value="PUBLISHED">Yayında</option>
          <option value="REVISION">Revizyonda</option>
          <option value="PASSIVE">Pasif</option>
        </select>

        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Tüm Türler</option>
          <option value="STANDARD">Standart</option>
          <option value="PHOTO">Fotoğraflı</option>
          <option value="SCORING">Puanlamalı</option>
          <option value="ELMERI">Elmeri</option>
        </select>

        <label className="search">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Form ara..."
          />
        </label>
      </section>

      <section className="library">
        <div className="sectionTitle">
          <div>
            <h2>Form Kütüphanesi</h2>
            <p>Yayınlanan formlar app ve denetim modülünde kullanılabilir.</p>
          </div>
          <strong>{filteredForms.length} form</strong>
        </div>

        {loading ? (
          <div className="empty">
            <Loader2 className="spin" />
            Denetim formları yükleniyor...
          </div>
        ) : null}

        {!loading && !filteredForms.length ? (
          <div className="empty">
            <ClipboardCheck size={42} />
            Henüz form bulunmuyor.
          </div>
        ) : null}

        <div className="grid">
          {filteredForms.map((form) => (
            <article className="card" key={form.id}>
              <div className="cardTop">
                <span className={`badge ${form.status.toLowerCase()}`}>
                  {statusText[form.status]}
                </span>
                <span>v{form.version_no}</span>
              </div>

              <h3>{form.title}</h3>
              <p>{form.description || "Açıklama girilmemiş."}</p>

              <div className="facts">
                <span>
                  <b>Kod</b>
                  {form.code || "-"}
                </span>
                <span>
                  <b>Tür</b>
                  {typeText[form.form_type]}
                </span>
                <span>
                  <b>Kategori</b>
                  {form.category}
                </span>
                <span>
                  <b>Madde</b>
                  {form.item_count}
                </span>
              </div>

              <div className="actions">
                <button onClick={() => setPreview(form)} title="Önizle">
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => {
                    setEditor(formToEditor(form));
                    setEditorOpen(true);
                  }}
                  title="Düzenle"
                >
                  <Edit3 size={16} />
                </button>
                <button onClick={() => void action(form.id, "COPY")} title="Kopyala">
                  <Copy size={16} />
                </button>
                {form.status !== "PUBLISHED" ? (
                  <button
                    className="publish"
                    onClick={() => void action(form.id, "PUBLISH")}
                    title="Yayınla"
                  >
                    <Send size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => void action(form.id, "PASSIVE")}
                    title="Pasife Al"
                  >
                    <Archive size={16} />
                  </button>
                )}
                <button
                  className="delete"
                  onClick={() => void deleteForm(form)}
                  title="Sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
          </section>
        </>
      ) : (
        <>
          <section className="reportToolbar">
            <label className="search">
              <Search size={16} />
              <input
                value={reportSearch}
                onChange={(event) =>
                  setReportSearch(
                    event.target.value
                  )
                }
                placeholder="Rapor, form veya denetçi ara..."
              />
            </label>

            <button
              onClick={() =>
                void loadReports()
              }
            >
              <RefreshCw size={16} />
              Raporları Yenile
            </button>
          </section>

          <section className="reportSummary">
            <MetricLight
              title="Toplam Rapor"
              value={metrics.reports}
              icon={<Archive size={18} />}
            />

            <MetricLight
              title="İmzalı Rapor"
              value={metrics.signedReports}
              icon={
                <CheckCircle2 size={18} />
              }
            />

            <MetricLight
              title="İmza Bekleyen"
              value={
                metrics.reports -
                metrics.signedReports
              }
              icon={
                <AlertTriangle size={18} />
              }
            />
          </section>

          <section className="archiveCharts">
            <ArchiveBarChart
              title="Son 6 Ayda Arşivlenen Denetimler"
              description="Tamamlanıp doküman arşivine aktarılan denetim sayısı."
              rows={archiveCharts.months}
            />

            <ArchiveBarChart
              title="Denetim Türü Dağılımı"
              description="Arşivde en fazla bulunan form türleri ve kategorileri."
              rows={archiveCharts.categories}
            />

            <ArchiveDonutChart
              title="Doküman Durumu"
              description="İmzalı, PDF bulunan ve belge bekleyen arşiv kayıtları."
              rows={
                archiveCharts.documentStatus
              }
            />

            <ArchiveBarChart
              title="En Çok Kullanılan Formlar"
              description="Tamamlanan denetimlerde en sık kullanılan form şablonları."
              rows={
                archiveCharts.mostUsedForms
              }
            />
          </section>

          <section className="reportArchive">
            <div className="sectionTitle">
              <div>
                <h2>
                  Denetim Sonuç Raporları
                </h2>

                <p>
                  Tamamlanan saha
                  denetimlerinin sonuç ve
                  PDF arşivi.
                </p>
              </div>

              <strong>
                {filteredReports.length} rapor
              </strong>
            </div>

            {reportsLoading ? (
              <div className="empty">
                <Loader2
                  className="spin"
                />
                Denetim raporları
                yükleniyor...
              </div>
            ) : null}

            {!reportsLoading &&
            !filteredReports.length ? (
              <div className="corporateEmptyArchive">
                <div className="corporateEmptyIcon">
                  <Archive size={32} />
                </div>

                <div>
                  <h3>
                    Denetim arşivi henüz boş
                  </h3>

                  <p>
                    App üzerinde tamamlanan
                    denetimler otomatik olarak
                    bu kurumsal arşive aktarılır.
                    PDF veya imzalı belge
                    eklendiğinde belge durumu da
                    burada izlenir.
                  </p>

                  <div className="emptyArchiveSteps">
                    <span>
                      1. Web formunu yayınla
                    </span>
                    <span>
                      2. App'te denetimi tamamla
                    </span>
                    <span>
                      3. Arşiv kaydını görüntüle
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="reportGrid">
              {filteredReports.map(
                (report) => (
                  <article
                    key={report.id}
                    className="reportCard"
                  >
                    <div className="reportTop">
                      <div>
                        <h3>
                          {report.form_title}
                        </h3>

                        <p>
                          {report.form?.code ||
                            "Form kodu yok"}
                        </p>
                      </div>

                      <span
                        className={
                          report.signed_pdf_url
                            ? "reportStatus signed"
                            : "reportStatus pending"
                        }
                      >
                        {report.signed_pdf_url
                          ? "İmzalı"
                          : "İmza Bekliyor"}
                      </span>
                    </div>

                    <div className="reportFacts">
                      <span>
                        <CalendarDays size={15} />
                        {report.inspection_date
                          ? new Date(
                              report.inspection_date
                            ).toLocaleDateString(
                              "tr-TR"
                            )
                          : "-"}
                      </span>

                      <span>
                        <UserRound size={15} />
                        {report.inspector_name ||
                          "Denetçi belirtilmedi"}
                      </span>

                      <span>
                        <ClipboardCheck size={15} />
                        {
                          report.total_item_count
                        }{" "}
                        madde
                      </span>

                      <span>
                        <BarChart3 size={15} />
                        {report.compliance_rate ==
                        null
                          ? "-"
                          : `%${Number(
                              report.compliance_rate
                            ).toFixed(1)}`}
                      </span>
                    </div>

                    <div className="resultNumbers">
                      <span className="ok">
                        Uygun
                        <b>
                          {
                            report.compliant_count
                          }
                        </b>
                      </span>

                      <span className="partial">
                        Kısmen
                        <b>
                          {report.partial_count}
                        </b>
                      </span>

                      <span className="bad">
                        Uygunsuz
                        <b>
                          {
                            report.non_compliant_count
                          }
                        </b>
                      </span>

                      <span className="critical">
                        Kritik
                        <b>
                          {report.critical_count}
                        </b>
                      </span>
                    </div>

                    <div className="reportActions">
                      {report.generated_pdf_url ? (
                        <a
                          href={
                            report.generated_pdf_url
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Eye size={16} />
                          Raporu Aç
                        </a>
                      ) : (
                        <span>
                          PDF henüz
                          oluşturulmadı
                        </span>
                      )}

                      {report.signed_pdf_url ? (
                        <a
                          href={
                            report.signed_pdf_url
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download size={16} />
                          İmzalı Rapor
                        </a>
                      ) : null}
                    </div>
                  </article>
                )
              )}
            </div>
          </section>
        </>
      )}

      {editorOpen ? (
        <div className="backdrop">
          <section className="modal editorModal">
            <header>
              <div>
                <h2>{editor.id ? "Formu Düzenle" : "Yeni Denetim Formu"}</h2>
                <p>Tek form altında çoklu madde oluşturun.</p>
              </div>
              <button onClick={() => setEditorOpen(false)}>
                <X size={20} />
              </button>
            </header>

            <div className="modalBody">
              <div className="identity">
                <Field
                  label="Form Adı"
                  value={editor.title}
                  onChange={(value) =>
                    setEditor((c) => ({ ...c, title: value }))
                  }
                />
                <Field
                  label="Form Kodu"
                  value={editor.code}
                  onChange={(value) => setEditor((c) => ({ ...c, code: value }))}
                />
                <Field
                  label="Kategori"
                  value={editor.category}
                  onChange={(value) =>
                    setEditor((c) => ({ ...c, category: value }))
                  }
                />
                <SelectField
                  label="Form Türü"
                  value={editor.formType}
                  options={[
                    ["STANDARD", "Standart"],
                    ["PHOTO", "Fotoğraflı"],
                    ["SCORING", "Puanlamalı"],
                    ["ELMERI", "Elmeri"],
                  ]}
                  onChange={(value) =>
                    setEditor((c) => ({
                      ...c,
                      formType: value as Editor["formType"],
                    }))
                  }
                />
                <div className="wide auditModeSelector">
                  <div className="auditModeHeader">
                    <span>
                      Kullanılacağı Denetim Çeşitleri
                    </span>
                    <small>
                      Aynı form birden fazla denetim
                      çeşidinde kullanılabilir.
                    </small>
                  </div>

                  <div className="auditModeGrid">
                    {auditModeOptions.map(
                      (auditMode) => {
                        const checked =
                          editor.auditModes.includes(
                            auditMode
                          );

                        return (
                          <label
                            className={`auditModeOption ${
                              checked
                                ? "selected"
                                : ""
                            }`}
                            key={auditMode}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setEditor(
                                  (current) => ({
                                    ...current,
                                    auditModes:
                                      checked
                                        ? current.auditModes.filter(
                                            (
                                              item
                                            ) =>
                                              item !==
                                              auditMode
                                          )
                                        : [
                                            ...current.auditModes,
                                            auditMode,
                                          ],
                                  })
                                )
                              }
                            />

                            <span>
                              {
                                auditModeText[
                                  auditMode
                                ]
                              }
                            </span>
                          </label>
                        );
                      }
                    )}
                  </div>
                </div>

                <SelectField
                  label="Görünürlük"
                  value={editor.visibility}
                  options={[
                    ["FIRM", "Seçili Firma"],
                    ["GLOBAL", "Tüm Firmalar"],
                  ]}
                  onChange={(value) =>
                    setEditor((c) => ({
                      ...c,
                      visibility: value as Editor["visibility"],
                    }))
                  }
                />
                <SelectField
                  label="Durum"
                  value={editor.status}
                  options={[
                    ["DRAFT", "Taslak"],
                    ["PUBLISHED", "Yayında"],
                    ["REVISION", "Revizyonda"],
                    ["PASSIVE", "Pasif"],
                  ]}
                  onChange={(value) =>
                    setEditor((c) => ({
                      ...c,
                      status: value as Editor["status"],
                    }))
                  }
                />
                <Field
                  label="Hazırlayan"
                  value={editor.preparedBy}
                  onChange={(value) =>
                    setEditor((c) => ({ ...c, preparedBy: value }))
                  }
                />
                <Field
                  label="Onaylayan"
                  value={editor.approvedBy}
                  onChange={(value) =>
                    setEditor((c) => ({ ...c, approvedBy: value }))
                  }
                />

                <label className="wide">
                  <span>Form Açıklaması</span>
                  <textarea
                    value={editor.description}
                    onChange={(e) =>
                      setEditor((c) => ({ ...c, description: e.target.value }))
                    }
                  />
                </label>

                {editor.id ? (
                  <label className="wide">
                    <span>Revizyon Notu</span>
                    <textarea
                      value={editor.changeNote}
                      onChange={(e) =>
                        setEditor((c) => ({ ...c, changeNote: e.target.value }))
                      }
                    />
                  </label>
                ) : null}
              </div>

              <div className="itemsHeader">
                <div>
                  <h3>Denetim Maddeleri</h3>
                  <p>Soru, mevcut/standart durum, önlem ve mevzuat.</p>
                </div>
                <div>
                  <button onClick={() => setBulkOpen(true)}>
                    <Upload size={16} />
                    Toplu Aktar
                  </button>
                  <button
                    className="dark"
                    onClick={() =>
                      setEditor((c) => ({
                        ...c,
                        items: [...c.items, newItem(c.items.length + 1)],
                      }))
                    }
                  >
                    <Plus size={16} />
                    Tek Madde Ekle
                  </button>
                </div>
              </div>

              <div className="itemList">
                {editor.items.map((item, index) => (
                  <article className="itemCard" key={index}>
                    <header>
                      <strong>Madde {index + 1}</strong>
                      <button onClick={() => removeItem(index)}>
                        <Trash2 size={15} />
                      </button>
                    </header>

                    <div className="itemGrid">
                      <Field
                        label="Madde Başlığı"
                        value={item.title}
                        onChange={(value) => updateItem(index, { title: value })}
                      />

                      <SelectField
                        label="Risk Seviyesi"
                        value={item.riskLevel}
                        options={[
                          ["LOW", "Düşük"],
                          ["MEDIUM", "Orta"],
                          ["HIGH", "Yüksek"],
                          ["CRITICAL", "Kritik"],
                        ]}
                        onChange={(value) =>
                          updateItem(index, {
                            riskLevel: value as FormItem["riskLevel"],
                          })
                        }
                      />

                      <TextArea
                        label="Denetim Sorusu"
                        value={item.question}
                        onChange={(value) =>
                          updateItem(index, { question: value })
                        }
                      />
                      <TextArea
                        label="Beklenen / Standart Durum"
                        value={item.expectedCondition}
                        onChange={(value) =>
                          updateItem(index, { expectedCondition: value })
                        }
                      />
                      <TextArea
                        label="Alınması Gereken Önlemler"
                        value={item.requiredAction}
                        onChange={(value) =>
                          updateItem(index, { requiredAction: value })
                        }
                      />
                      <TextArea
                        label="Mevzuat Dayanağı"
                        value={item.legalReference}
                        onChange={(value) =>
                          updateItem(index, { legalReference: value })
                        }
                      />

                      <NumberField
                        label="Puan"
                        value={item.score}
                        onChange={(value) => updateItem(index, { score: value })}
                      />
                      <NumberField
                        label="Ağırlık"
                        value={item.weight}
                        onChange={(value) => updateItem(index, { weight: value })}
                      />
                    </div>

                    <div className="checks">
                      <CheckField
                        label="Fotoğraf Zorunlu"
                        checked={item.photoRequired}
                        onChange={(value) =>
                          updateItem(index, { photoRequired: value })
                        }
                      />
                      <CheckField
                        label="Açıklama Zorunlu"
                        checked={item.explanationRequired}
                        onChange={(value) =>
                          updateItem(index, { explanationRequired: value })
                        }
                      />
                      <CheckField
                        label="Aksiyon Gerektirir"
                        checked={item.actionRequired}
                        onChange={(value) =>
                          updateItem(index, { actionRequired: value })
                        }
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <footer>
              <button onClick={() => setEditorOpen(false)}>Vazgeç</button>
              <button disabled={saving} onClick={() => void saveForm(false)}>
                <Save size={16} />
                Taslak Kaydet
              </button>
              <button
                className="dark"
                disabled={saving}
                onClick={() => void saveForm(true)}
              >
                {saving ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                Kaydet ve Yayınla
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {bulkOpen ? (
        <div className="backdrop">
          <section className="modal bulkModal">
            <header>
              <div>
                <h2>Toplu Madde Aktar</h2>
                <p>Her satır bir denetim maddesidir.</p>
              </div>
              <button onClick={() => setBulkOpen(false)}>
                <X size={20} />
              </button>
            </header>

            <div className="bulkBody">
              <code>
                Başlık | Soru | Beklenen Durum | Önlem | Mevzuat | Risk |
                Fotoğraf | Açıklama | Aksiyon | Puan | Ağırlık
              </code>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Yangın Tüpü | Tüplerin kontrolü güncel mi? | Erişilebilir ve kontrolü geçerli olmalıdır. | Kontrolü geçmiş tüpler yenilenmelidir. | BYKHY | HIGH | EVET | EVET | EVET | 10 | 1"
              />
            </div>

            <footer>
              <button onClick={() => setBulkOpen(false)}>Vazgeç</button>
              <button className="dark" onClick={importBulk}>
                <Upload size={16} />
                Maddeleri Aktar
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {preview ? (
        <div className="backdrop">
          <section className="modal previewModal">
            <header>
              <div>
                <h2>{preview.title}</h2>
                <p>{preview.item_count} denetim maddesi</p>
              </div>
              <button onClick={() => setPreview(null)}>
                <X size={20} />
              </button>
            </header>

            <div className="previewBody">
              {(preview.items || [])
                .sort((a, b) => a.order_no - b.order_no)
                .map((item, index) => (
                  <article key={item.id}>
                    <strong>
                      {index + 1}. {item.title || "Denetim Maddesi"}
                    </strong>
                    <h4>{item.question}</h4>
                    <p>
                      <b>Beklenen Durum:</b>{" "}
                      {item.expected_condition || "-"}
                    </p>
                    <p>
                      <b>Alınması Gereken Önlem:</b>{" "}
                      {item.required_action || "-"}
                    </p>
                    <p>
                      <b>Mevzuat:</b> {item.legal_reference || "-"}
                    </p>
                  </article>
                ))}
            </div>
          </section>
        </div>
      ) : null}

      <style jsx>{`
        * { box-sizing: border-box; }
        .page { min-height:100vh; padding:24px; background:linear-gradient(180deg,#f8fafc,#fff7ed); color:#172033; }
        .hero,.toolbar,.library { max-width:1540px; margin:0 auto 18px; }
        .hero { position:relative; border-radius:28px; padding:27px; color:#fff; background:linear-gradient(135deg,#5f0f1b,#991b1b 52%,#d97706); box-shadow:0 22px 58px rgba(127,29,29,.2); }
        .hero h1 { margin:7px 0 10px; font-size:34px; }
        .hero p { max-width:850px; color:rgba(255,255,255,.84); line-height:1.6; }
        .heroButtons { position:absolute; right:27px; top:27px; display:flex; gap:9px; }
        button { font:inherit; cursor:pointer; }
        .heroButtons button,.itemsHeader button,.modal footer button { min-height:40px; border:1px solid rgba(255,255,255,.25); border-radius:11px; padding:0 13px; display:inline-flex; align-items:center; gap:7px; font-weight:800; background:rgba(255,255,255,.12); color:#fff; }
        .heroButtons .whiteButton { background:#fff; color:#7f1d1d; }
        .metrics { margin-top:22px; display:grid; grid-template-columns:repeat(6,1fr); gap:10px; }
        .error { max-width:1540px; margin:0 auto 18px; padding:13px; border:1px solid #fecaca; border-radius:14px; display:flex; gap:8px; color:#991b1b; background:#fef2f2; font-weight:800; }
        .toolbar { padding:13px; border:1px solid #e5e7eb; border-radius:19px; display:grid; grid-template-columns:repeat(3,1fr) 1.2fr; gap:10px; background:#fff; }
        select,input,textarea { width:100%; border:1px solid #dbe3ec; border-radius:10px; padding:10px; background:#fff; outline:none; }
        textarea { min-height:82px; resize:vertical; }
        .search { display:flex; align-items:center; gap:7px; border:1px solid #dbe3ec; border-radius:10px; padding:0 10px; }
        .search input { border:0; padding-left:0; }
        .library { padding:18px; border:1px solid #e5e7eb; border-radius:21px; background:#fff; box-shadow:0 10px 30px rgba(15,23,42,.05); }
        .sectionTitle { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
        .sectionTitle h2 { margin:0; }
        .sectionTitle p { margin:5px 0 0; color:#64748b; }
        .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
        .card { padding:16px; border:1px solid #e2e8f0; border-radius:18px; background:#fff; }
        .cardTop { display:flex; justify-content:space-between; align-items:center; color:#64748b; font-size:12px; }
        .badge { padding:5px 8px; border-radius:999px; font-weight:900; }
        .badge.draft { color:#92400e; background:#fffbeb; }
        .badge.published { color:#047857; background:#ecfdf5; }
        .badge.revision { color:#1d4ed8; background:#eff6ff; }
        .badge.passive { color:#64748b; background:#f1f5f9; }
        .card h3 { margin:12px 0 7px; }
        .card p { min-height:42px; color:#64748b; font-size:13px; }
        .facts { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .facts span { padding:8px; border-radius:10px; display:grid; gap:3px; background:#f8fafc; font-size:12px; }
        .facts b { color:#64748b; font-size:10px; text-transform:uppercase; }
        .actions { margin-top:12px; display:flex; gap:7px; }
        .actions button,.modal header>button,.itemCard header button { width:37px; height:37px; border:1px solid #e2e8f0; border-radius:9px; display:grid; place-items:center; background:#f8fafc; color:#475569; }
        .actions .publish { color:#047857; background:#ecfdf5; }
        .actions .delete { color:#b91c1c; background:#fef2f2; }
        .empty { min-height:240px; display:grid; place-items:center; align-content:center; gap:9px; color:#64748b; }
        .moduleTabs {
          max-width: 1540px;
          margin: 0 auto 18px;
          display: flex;
          gap: 9px;
        }

        .moduleTabs button {
          min-height: 44px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #475569;
          background: #ffffff;
          font-weight: 850;
        }

        .moduleTabs button.active {
          border-color: #7f1d1d;
          color: #ffffff;
          background: #7f1d1d;
        }

        .moduleTabs span {
          min-width: 24px;
          border-radius: 999px;
          padding: 3px 7px;
          background: rgba(148,163,184,.18);
          text-align: center;
          font-size: 11px;
        }

        .reportToolbar,
        .reportSummary,
        .archiveCharts {
          max-width: 1540px;
          margin: 0 auto 18px;
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 14px;
        }

        .archiveChart {
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 16px;
          background: #ffffff;
        }

        .archiveChartHeader h3 {
          margin: 0;
          color: #172033;
          font-size: 16px;
        }

        .archiveChartHeader p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.5;
        }

        .barChartRows {
          margin-top: 16px;
          display: grid;
          gap: 10px;
        }

        .barChartRow {
          display: grid;
          grid-template-columns:
            minmax(110px,1.2fr)
            minmax(140px,3fr)
            38px;
          gap: 10px;
          align-items: center;
        }

        .barChartLabel {
          color: #475569;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .barChartTrack {
          height: 10px;
          border-radius: 999px;
          overflow: hidden;
          background: #f1f5f9;
        }

        .barChartFill {
          height: 100%;
          min-width: 0;
          border-radius: inherit;
          background:
            linear-gradient(
              90deg,
              #7f1d1d,
              #d97706
            );
        }

        .barChartValue {
          color: #172033;
          font-size: 12px;
          font-weight: 900;
          text-align: right;
        }

        .donutLayout {
          margin-top: 16px;
          display: grid;
          grid-template-columns:
            150px 1fr;
          gap: 18px;
          align-items: center;
        }

        .donutVisual {
          position: relative;
          width: 140px;
          height: 140px;
          margin: 0 auto;
        }

        .donutVisual svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .donutBase {
          fill: none;
          stroke: #f1f5f9;
          stroke-width: 14;
        }

        .donutSegment {
          fill: none;
          stroke-width: 14;
          stroke-linecap: butt;
          transition:
            stroke-dasharray .25s ease;
        }

        .donutCenter {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          align-content: center;
          pointer-events: none;
        }

        .donutCenter strong {
          color: #172033;
          font-size: 25px;
        }

        .donutCenter span {
          color: #64748b;
          font-size: 11px;
        }

        .donutLegend {
          display: grid;
          gap: 10px;
        }

        .donutLegendRow {
          display: grid;
          grid-template-columns:
            11px 1fr auto;
          gap: 8px;
          align-items: center;
          color: #475569;
          font-size: 12px;
        }

        .donutLegendDot {
          width: 11px;
          height: 11px;
          border-radius: 999px;
        }

        .donutLegendRow strong {
          color: #172033;
        }

        .archiveChartEmpty {
          min-height: 145px;
          display: grid;
          place-items: center;
          color: #94a3b8;
          font-size: 12px;
          text-align: center;
        }

        .corporateEmptyArchive {
          min-height: 220px;
          display: grid;
          grid-template-columns:
            72px minmax(0,1fr);
          gap: 18px;
          align-items: start;
          padding: 28px;
          border: 1px dashed #cbd5e1;
          border-radius: 18px;
          background:
            linear-gradient(
              135deg,
              #ffffff,
              #f8fafc
            );
        }

        .corporateEmptyIcon {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          color: #7f1d1d;
          background: #fff1f2;
          border: 1px solid #fecdd3;
        }

        .corporateEmptyArchive h3 {
          margin: 0;
          color: #172033;
          font-size: 18px;
        }

        .corporateEmptyArchive p {
          max-width: 760px;
          margin: 8px 0 16px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.7;
        }

        .emptyArchiveSteps {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .emptyArchiveSteps span {
          padding: 7px 10px;
          border-radius: 999px;
          color: #7f1d1d;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          font-size: 11px;
          font-weight: 800;
        }

        .auditModeSelector {
          display: grid;
          gap: 10px;
          padding: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #f8fafc;
        }

        .auditModeHeader {
          display: grid;
          gap: 4px;
        }

        .auditModeHeader > span {
          color: #172033;
          font-size: 13px;
          font-weight: 900;
        }

        .auditModeHeader small {
          color: #64748b;
          font-size: 11px;
          line-height: 1.5;
        }

        .auditModeGrid {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap: 8px;
        }

        .auditModeOption {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 44px;
          padding: 10px 12px;
          border: 1px solid #dbe2ea;
          border-radius: 12px;
          background: #ffffff;
          color: #475569;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }

        .auditModeOption.selected {
          border-color: #991b1b;
          color: #7f1d1d;
          background: #fff1f2;
        }

        .auditModeOption input {
          width: 17px;
          height: 17px;
          accent-color: #991b1b;
        }

        .reportArchive {
          max-width: 1540px;
          margin: 0 auto 18px;
        }

        .reportToolbar {
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 12px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          background: #ffffff;
        }

        .reportToolbar button {
          min-height: 42px;
          border: 1px solid #fecaca;
          border-radius: 11px;
          padding: 0 13px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #7f1d1d;
          background: #fff;
          font-weight: 850;
        }

        .reportSummary {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 12px;
        }

        .reportArchive {
          border: 1px solid #e5e7eb;
          border-radius: 21px;
          padding: 18px;
          background: #ffffff;
        }

        .reportGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill,minmax(330px,1fr));
          gap: 14px;
        }

        .reportCard {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 15px;
          background: #fff;
        }

        .reportTop {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .reportTop h3 {
          margin: 0;
        }

        .reportTop p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .reportStatus {
          border-radius: 999px;
          padding: 6px 9px;
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }

        .reportStatus.signed {
          color: #047857;
          background: #ecfdf5;
        }

        .reportStatus.pending {
          color: #92400e;
          background: #fffbeb;
        }

        .reportFacts {
          margin-top: 13px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .reportFacts span {
          border-radius: 10px;
          padding: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #475569;
          background: #f8fafc;
          font-size: 12px;
        }

        .resultNumbers {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 6px;
        }

        .resultNumbers span {
          border-radius: 9px;
          padding: 7px;
          display: grid;
          gap: 4px;
          font-size: 10px;
          text-align: center;
        }

        .resultNumbers b {
          font-size: 16px;
        }

        .resultNumbers .ok {
          color: #047857;
          background: #ecfdf5;
        }

        .resultNumbers .partial {
          color: #a16207;
          background: #fefce8;
        }

        .resultNumbers .bad {
          color: #b91c1c;
          background: #fef2f2;
        }

        .resultNumbers .critical {
          color: #7f1d1d;
          background: #fee2e2;
        }

        .reportActions {
          margin-top: 13px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .reportActions a,
        .reportActions > span {
          min-height: 37px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #7f1d1d;
          background: #fff7ed;
          font-size: 12px;
          font-weight: 850;
          text-decoration: none;
        }

        .backdrop { position:fixed; inset:0; z-index:1000; padding:20px; display:grid; place-items:center; background:rgba(15,23,42,.62); backdrop-filter:blur(5px); }
        .modal { width:min(1400px,96vw); max-height:94vh; overflow:hidden; border-radius:22px; display:grid; grid-template-rows:auto minmax(0,1fr) auto; background:#f8fafc; box-shadow:0 28px 90px rgba(15,23,42,.28); }
        .bulkModal { width:min(950px,96vw); }
        .previewModal { width:min(1000px,96vw); grid-template-rows:auto minmax(0,1fr); }
        .modal header,.modal footer { padding:15px 17px; display:flex; justify-content:space-between; align-items:center; gap:10px; background:#fff; border-bottom:1px solid #e2e8f0; }
        .modal header h2 { margin:0; }
        .modal header p { margin:4px 0 0; color:#64748b; }
        .modalBody,.previewBody { overflow-y:auto; padding:17px; }
        .identity,.itemGrid { display:grid; grid-template-columns:1fr 1fr; gap:11px; }
        .identity label,.itemGrid label { display:grid; gap:6px; color:#64748b; font-size:12px; font-weight:800; }
        .wide { grid-column:1/-1; }
        .itemsHeader { margin:22px 0 12px; display:flex; justify-content:space-between; align-items:center; }
        .itemsHeader h3 { margin:0; }
        .itemsHeader p { margin:4px 0 0; color:#64748b; }
        .itemsHeader>div:last-child { display:flex; gap:8px; }
        .itemsHeader button,.modal footer button { color:#7f1d1d; background:#fff; border-color:#fecaca; }
        .itemsHeader .dark,.modal footer .dark { color:#fff; background:#7f1d1d; }
        .itemList { display:grid; gap:12px; }
        .itemCard { border:1px solid #e2e8f0; border-radius:17px; overflow:hidden; background:#fff; }
        .itemCard header { padding:10px 13px; display:flex; justify-content:space-between; align-items:center; background:#fff7ed; border-bottom:1px solid #fed7aa; }
        .itemGrid { padding:13px; }
        .checks { padding:11px 13px; border-top:1px solid #eef2f7; display:flex; flex-wrap:wrap; gap:14px; }
        .checks label { display:flex; gap:7px; align-items:center; color:#475569; font-size:12px; font-weight:800; }
        .checks input { width:auto; }
        .modal footer { justify-content:flex-end; border-top:1px solid #e2e8f0; border-bottom:0; }
        .bulkBody { padding:17px; overflow-y:auto; }
        .bulkBody code { display:block; padding:11px; border-radius:11px; color:#1e3a8a; background:#eff6ff; line-height:1.5; }
        .bulkBody textarea { min-height:380px; margin-top:13px; font-family:monospace; }
        .previewBody { display:grid; gap:11px; }
        .previewBody article { padding:13px; border:1px solid #e2e8f0; border-radius:14px; background:#fff; }
        .previewBody h4 { margin:8px 0; }
        .previewBody p { margin:6px 0; color:#475569; font-size:13px; }
        .spin { animation:spin .9s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @media(max-width:1100px){ .metrics{grid-template-columns:repeat(3,1fr)} .toolbar{grid-template-columns:1fr 1fr} }
        @media(max-width:720px){ .page{padding:12px} .auditModeGrid{grid-template-columns:1fr} .archiveCharts,.reportSummary,.reportFacts,.resultNumbers{grid-template-columns:1fr} .donutLayout{grid-template-columns:1fr} .barChartRow{grid-template-columns:minmax(90px,1fr) minmax(90px,2fr) 32px} .reportToolbar{grid-template-columns:1fr} .heroButtons{position:static;margin-top:15px} .metrics,.toolbar,.identity,.itemGrid{grid-template-columns:1fr} .itemsHeader{align-items:stretch;flex-direction:column} .itemsHeader>div:last-child{flex-direction:column} }
      `}</style>
    </main>
  );
}

function Metric({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: 13,
        borderRadius: 15,
        background: "rgba(255,255,255,.12)",
        border: "1px solid rgba(255,255,255,.13)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "rgba(255,255,255,.78)",
          fontSize: 11,
          fontWeight: 850,
        }}
      >
        {icon}
        {title}
      </div>
      <strong style={{ display: "block", marginTop: 7, fontSize: 24 }}>
        {value}
      </strong>
    </div>
  );
}

function ArchiveBarChart({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: Array<{
    label: string;
    count: number;
  }>;
}) {
  const maximum = Math.max(
    1,
    ...rows.map(
      (row) => row.count
    )
  );

  return (
    <article className="archiveChart">
      <div className="archiveChartHeader">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      {rows.length === 0 ? (
        <div className="archiveChartEmpty">
          Grafik için henüz arşiv
          kaydı bulunmuyor.
        </div>
      ) : (
        <div className="barChartRows">
          {rows.map((row) => (
            <div
              className="barChartRow"
              key={row.label}
              title={`${row.label}: ${row.count}`}
            >
              <span className="barChartLabel">
                {row.label}
              </span>

              <div
                className="barChartTrack"
                aria-label={`${row.label}: ${row.count}`}
              >
                <div
                  className="barChartFill"
                  style={{
                    width: `${
                      (row.count /
                        maximum) *
                      100
                    }%`,
                  }}
                />
              </div>

              <strong className="barChartValue">
                {row.count}
              </strong>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function ArchiveDonutChart({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: Array<{
    label: string;
    count: number;
  }>;
}) {
  const total = rows.reduce(
    (sum, row) =>
      sum + row.count,
    0
  );

  const palette = [
    "#047857",
    "#d97706",
    "#94a3b8",
  ];

  let offset = 0;

  return (
    <article className="archiveChart">
      <div className="archiveChartHeader">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      {total === 0 ? (
        <div className="archiveChartEmpty">
          Doküman durumu için henüz
          kayıt bulunmuyor.
        </div>
      ) : (
        <div className="donutLayout">
          <div className="donutVisual">
            <svg
              viewBox="0 0 120 120"
              role="img"
              aria-label={`Toplam ${total} arşiv kaydı`}
            >
              <circle
                className="donutBase"
                cx="60"
                cy="60"
                r="46"
              />

              {rows.map(
                (row, index) => {
                  const percentage =
                    row.count / total;

                  const length =
                    percentage * 289;

                  const currentOffset =
                    offset;

                  offset += length;

                  return (
                    <circle
                      key={row.label}
                      className="donutSegment"
                      cx="60"
                      cy="60"
                      r="46"
                      stroke={
                        palette[
                          index %
                            palette.length
                        ]
                      }
                      strokeDasharray={`${length} ${
                        289 - length
                      }`}
                      strokeDashoffset={
                        -currentOffset
                      }
                    />
                  );
                }
              )}
            </svg>

            <div className="donutCenter">
              <strong>{total}</strong>
              <span>Arşiv Kaydı</span>
            </div>
          </div>

          <div className="donutLegend">
            {rows.map(
              (row, index) => (
                <div
                  className="donutLegendRow"
                  key={row.label}
                >
                  <span
                    className="donutLegendDot"
                    style={{
                      background:
                        palette[
                          index %
                            palette.length
                        ],
                    }}
                  />

                  <span>{row.label}</span>

                  <strong>
                    {row.count}
                  </strong>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function MetricLight({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        border:
          "1px solid #e2e8f0",
        borderRadius: 16,
        padding: 14,
        background: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 7,
          alignItems: "center",
          color: "#64748b",
          fontSize: 11,
          fontWeight: 850,
        }}
      >
        {icon}
        {title}
      </div>

      <strong
        style={{
          display: "block",
          marginTop: 8,
          color: "#172033",
          fontSize: 25,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="wide">
      <span>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
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
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}