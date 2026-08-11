"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

type AuditTemplate = {
  id: string;
  firm_id: string;
  title: string;
  code?: string | null;
  category?: string | null;
  description?: string | null;
  audit_type: string;
  status: string;
  version_no?: number | null;
  is_active?: boolean | null;
  created_at_millis?: number | null;
  updated_at_millis?: number | null;
};

type AuditQuestion = {
  id: string;
  firm_id: string;
  template_id: string;
  section_title?: string | null;
  title: string;
  question: string;
  expected_condition?: string | null;
  precaution?: string | null;
  legal_basis?: string | null;
  risk_level?: string | null;
  photo_required?: boolean | null;
  score?: number | null;
  weight?: number | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  note?: string | null;
};

type TemplateForm = {
  id: string;
  title: string;
  code: string;
  category: string;
  description: string;
  auditType: string;
  status: string;
  versionNo: string;
  isActive: boolean;
};

type QuestionForm = {
  id: string;
  templateId: string;
  sectionTitle: string;
  title: string;
  question: string;
  expectedCondition: string;
  precaution: string;
  legalBasis: string;
  riskLevel: string;
  photoRequired: boolean;
  score: string;
  weight: string;
  sortOrder: string;
  note: string;
  isActive: boolean;
};

type AuditRun = {
  id: string;
  firm_id: string;
  template_id: string;
  audit_no?: string | null;
  title: string;
  audit_date_millis?: number | null;
  auditor_name?: string | null;
  auditor_title?: string | null;
  department?: string | null;
  location?: string | null;
  scope?: string | null;
  note?: string | null;
  status: string;
  total_questions?: number | null;
  answered_questions?: number | null;
  compliant_count?: number | null;
  partial_count?: number | null;
  non_compliant_count?: number | null;
  not_applicable_count?: number | null;
  compliance_percent?: number | null;
  template?: { id: string; title: string; code?: string | null } | null;
};

type DoraFinding = {
  id: string; firm_id: string; audit_id: string; answer_id?: string | null; question_id?: string | null;
  title: string; description?: string | null; finding_type?: string | null; risk_level?: string | null; legal_basis?: string | null;
  recommendation?: string | null; status: string; detected_by?: string | null; detected_at_millis?: number | null;
  audit?: { id: string; audit_no?: string | null; title?: string | null } | null;
  question?: { id: string; section_title?: string | null; title?: string | null; question?: string | null } | null;
};

type DoraCapa = {
  id: string; firm_id: string; audit_id: string; finding_id: string; title: string; description?: string | null;
  root_cause?: string | null; corrective_action?: string | null; preventive_action?: string | null; responsible_person?: string | null;
  responsible_department?: string | null; priority?: string | null; due_date_millis?: number | null; status: string;
  effectiveness_result?: string | null; closure_note?: string | null;
  finding?: { id: string; title?: string | null; risk_level?: string | null; status?: string | null } | null;
  audit?: { id: string; audit_no?: string | null; title?: string | null } | null;
};

type AuditRunForm = {
  templateId: string;
  title: string;
  auditDate: string;
  auditorName: string;
  auditorTitle: string;
  department: string;
  location: string;
  scope: string;
  note: string;
};

function emptyAuditRunForm(): AuditRunForm {
  return { templateId: "", title: "", auditDate: new Date().toISOString().slice(0, 10), auditorName: "", auditorTitle: "", department: "", location: "", scope: "", note: "" };
}

const AUDIT_TYPES = [
  {
    value: "STANDART",
    label: "Standart",
  },
  {
    value: "PUANLAMALI",
    label: "Puanlamalı",
  },
  {
    value: "FOTOGRAFLI",
    label: "Fotoğraflı",
  },
  {
    value: "ELMERI",
    label: "Elmeri",
  },
];

const TEMPLATE_STATUSES = [
  {
    value: "TASLAK",
    label: "Taslak",
  },
  {
    value: "YAYINLANDI",
    label: "Yayınlandı",
  },
  {
    value: "PASIF",
    label: "Pasif",
  },
];

const RISK_LEVELS = [
  {
    value: "DUSUK",
    label: "Düşük",
  },
  {
    value: "ORTA",
    label: "Orta",
  },
  {
    value: "YUKSEK",
    label: "Yüksek",
  },
  {
    value: "KRITIK",
    label: "Kritik",
  },
];

function emptyTemplateForm(): TemplateForm {
  return {
    id: "",
    title: "",
    code: "",
    category: "GENEL",
    description: "",
    auditType: "STANDART",
    status: "TASLAK",
    versionNo: "1",
    isActive: true,
  };
}

function emptyQuestionForm(): QuestionForm {
  return {
    id: "",
    templateId: "",
    sectionTitle: "",
    title: "",
    question: "",
    expectedCondition: "",
    precaution: "",
    legalBasis: "",
    riskLevel: "ORTA",
    photoRequired: false,
    score: "0",
    weight: "1",
    sortOrder: "0",
    note: "",
    isActive: true,
  };
}

function templateStatusLabel(
  value?: string | null
): string {


  return (
    TEMPLATE_STATUSES.find(
      (item) =>
        item.value === value
    )?.label ||
    value ||
    "-"
  );
}

function auditTypeLabel(
  value?: string | null
): string {
  return (
    AUDIT_TYPES.find(
      (item) =>
        item.value === value
    )?.label ||
    value ||
    "-"
  );
}

function riskLabel(
  value?: string | null
): string {
  return (
    RISK_LEVELS.find(
      (item) =>
        item.value === value
    )?.label ||
    value ||
    "-"
  );
}

function riskClass(
  value?: string | null
): string {
  switch (value) {
    case "DUSUK":
      return "riskGreen";

    case "ORTA":
      return "riskAmber";

    case "YUKSEK":
      return "riskOrange";

    case "KRITIK":
      return "riskRed";

    default:
      return "riskGray";
  }
}

export default function DoraAuditsPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const firmId =
    String(
      params.firmId ?? ""
    );

  const [
    templates,
    setTemplates,
  ] =
    useState<
      AuditTemplate[]
    >([]);

  const [
    questions,
    setQuestions,
  ] =
    useState<
      AuditQuestion[]
    >([]);

  const [
    selectedTemplateId,
    setSelectedTemplateId,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    questionLoading,
    setQuestionLoading,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    questionSaving,
    setQuestionSaving,
  ] =
    useState(false);

  const [
    bulkUploading,
    setBulkUploading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("ALL");

  const [
    templateModalOpen,
    setTemplateModalOpen,
  ] =
    useState(false);

  const [
    questionModalOpen,
    setQuestionModalOpen,
  ] =
    useState(false);

  const [
    templateForm,
    setTemplateForm,
  ] =
    useState<TemplateForm>(
      emptyTemplateForm()
    );

  const [
    questionForm,
    setQuestionForm,
  ] =
    useState<QuestionForm>(
      emptyQuestionForm()
    );

  const [activeTab, setActiveTab] = useState<"TEMPLATES" | "AUDITS" | "FINDINGS" | "CAPA">("TEMPLATES");
  const [audits, setAudits] = useState<AuditRun[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSaving, setAuditSaving] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditForm, setAuditForm] = useState<AuditRunForm>(emptyAuditRunForm());
  const [resultAuditId, setResultAuditId] = useState("");
  const [resultUploading, setResultUploading] = useState(false);
  const resultFileInputRef = useRef<HTMLInputElement | null>(null);

  const loadAudits = useCallback(async () => {
    if (!firmId) return;
    try {
      setAuditLoading(true);
      const response = await fetch(`/api/dora/audits?firmId=${encodeURIComponent(firmId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "DORA denetimleri alınamadı.");
      setAudits(Array.isArray(data.audits) ? data.audits : []);
    } catch (err) {
      alert(err instanceof Error ? err.message : "DORA denetimleri alınamadı.");
    } finally {
      setAuditLoading(false);
    }
  }, [firmId]);

  useEffect(() => { void loadAudits(); }, [loadAudits]);

  const publishedTemplates = useMemo(() => templates.filter((item) => item.status === "YAYINLANDI" && item.is_active !== false), [templates]);
  const auditStats = useMemo(() => ({
    total: audits.length,
    planned: audits.filter((a) => a.status === "PLANLANDI").length,
    active: audits.filter((a) => a.status === "DEVAM_EDIYOR").length,
    completed: audits.filter((a) => a.status === "TAMAMLANDI").length,
    nonCompliant: audits.reduce((sum, a) => sum + Number(a.non_compliant_count || 0), 0),
  }), [audits]);

  function openNewAudit() {
    const first = publishedTemplates[0];
    setAuditForm({ ...emptyAuditRunForm(), templateId: first?.id || "", title: first?.title ? `${first.title} Denetimi` : "" });
    setAuditModalOpen(true);
  }

  async function createAudit() {
    if (!auditForm.templateId || !auditForm.title.trim() || !auditForm.auditDate) { alert("Şablon, denetim başlığı ve tarih zorunludur."); return; }
    try {
      setAuditSaving(true);
      const response = await fetch("/api/dora/audits", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firmId, templateId: auditForm.templateId, title: auditForm.title, auditDateMillis: new Date(`${auditForm.auditDate}T12:00:00`).getTime(), auditorName: auditForm.auditorName, auditorTitle: auditForm.auditorTitle, department: auditForm.department, location: auditForm.location, scope: auditForm.scope, note: auditForm.note }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Denetim başlatılamadı.");
      setAuditModalOpen(false);
      await loadAudits();
      if (data.audit?.id) router.push(`/admin/dora/${firmId}/audits/${data.audit.id}`);
    } catch (err) { alert(err instanceof Error ? err.message : "Denetim başlatılamadı."); }
    finally { setAuditSaving(false); }
  }

  async function deleteAudit(audit: AuditRun) {
    if (!window.confirm(`"${audit.title}" denetimi silinsin mi?`)) return;
    const response = await fetch("/api/dora/audits", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: audit.id, firmId }) });
    const data = await response.json();
    if (!response.ok || !data.success) { alert(data.error || "Denetim silinemedi."); return; }
    await loadAudits();
  }

  const [findings, setFindings] = useState<DoraFinding[]>([]);
  const [capas, setCapas] = useState<DoraCapa[]>([]);
  const [findingLoading, setFindingLoading] = useState(false);
  const [capaLoading, setCapaLoading] = useState(false);

  const loadFindings = useCallback(async () => {
    if (!firmId) return;
    try {
      setFindingLoading(true);
      const response = await fetch(`/api/dora/audits/findings?firmId=${encodeURIComponent(firmId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "DORA bulguları alınamadı.");
      setFindings(Array.isArray(data.findings) ? data.findings : []);
    } catch (err) { alert(err instanceof Error ? err.message : "DORA bulguları alınamadı."); }
    finally { setFindingLoading(false); }
  }, [firmId]);

  const loadCapas = useCallback(async () => {
    if (!firmId) return;
    try {
      setCapaLoading(true);
      const response = await fetch(`/api/dora/audits/capa?firmId=${encodeURIComponent(firmId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "DORA DÖF kayıtları alınamadı.");
      setCapas(Array.isArray(data.capas) ? data.capas : []);
    } catch (err) { alert(err instanceof Error ? err.message : "DORA DÖF kayıtları alınamadı."); }
    finally { setCapaLoading(false); }
  }, [firmId]);

  useEffect(() => {
    if (activeTab === "FINDINGS") {
      void loadFindings();
    }

    if (activeTab === "CAPA") {
      void loadFindings();
      void loadCapas();
    }
  }, [activeTab, loadFindings, loadCapas]);

  const findingStats = useMemo(() => ({
    total: findings.length, open: findings.filter(x => x.status === "ACIK").length,
    tracking: findings.filter(x => x.status === "TAKIPTE").length, closed: findings.filter(x => x.status === "KAPALI").length,
    critical: findings.filter(x => x.risk_level === "KRITIK").length,
  }), [findings]);

  const capaStats = useMemo(() => ({
    total: capas.length, open: capas.filter(x => x.status === "ACIK").length,
    active: capas.filter(x => x.status === "DEVAM_EDIYOR").length, completed: capas.filter(x => x.status === "TAMAMLANDI").length,
    closed: capas.filter(x => x.status === "KAPALI").length,
  }), [capas]);

  async function createCapaFromFinding(finding: DoraFinding) {
    const title = window.prompt("DÖF başlığı", `${finding.title} - DÖF`);
    if (!title?.trim()) return;
    const responsiblePerson = window.prompt("Sorumlu kişi", "") ?? "";
    const correctiveAction = window.prompt("Düzeltici faaliyet", finding.recommendation || "") ?? "";
    const response = await fetch("/api/dora/audits/capa", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firmId, auditId: finding.audit_id, findingId: finding.id, title: title.trim(), responsiblePerson, correctiveAction, priority: finding.risk_level || "ORTA" }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) { alert(data.error || "DÖF oluşturulamadı."); return; }
    await Promise.all([loadFindings(), loadCapas()]);
    setActiveTab("CAPA");
  }

  async function changeCapaStatus(capa: DoraCapa, status: string) {
    const payload: Record<string, unknown> = { id: capa.id, firmId, status };
    if (status === "TAMAMLANDI") {
      payload.completedBy = window.prompt("Tamamlayan", "") ?? "";
      payload.completionNote = window.prompt("Tamamlama notu", "") ?? "";
    }
    if (status === "KAPALI") {
      const effectivenessResult = window.prompt("Etkinlik sonucu (örn. ETKILI)", capa.effectiveness_result || "ETKILI");
      if (!effectivenessResult?.trim()) return;
      payload.effectivenessResult = effectivenessResult.trim();
      payload.effectivenessNote = window.prompt("Etkinlik kontrol notu", "") ?? "";
      payload.effectivenessCheckedBy = window.prompt("Etkinlik kontrolünü yapan", "") ?? "";
      payload.closedBy = window.prompt("Kapatan", "") ?? "";
      payload.closureNote = window.prompt("Kapanış notu", "") ?? "";
    }
    const response = await fetch("/api/dora/audits/capa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok || !data.success) { alert(data.error || "DÖF güncellenemedi."); return; }
    await Promise.all([loadCapas(), loadFindings()]);
  }

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const loadTemplates =
    useCallback(
      async () => {
        if (!firmId) {
          return;
        }

        try {
          setLoading(true);
          setError("");

          const response =
            await fetch(
              `/api/dora/audits/templates?firmId=${encodeURIComponent(
                firmId
              )}`,
              {
                cache: "no-store",
              }
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.error ||
                "DORA denetim şablonları alınamadı."
            );
          }

          const list =
            Array.isArray(
              data.templates
            )
              ? data.templates
              : [];

          setTemplates(
            list
          );

          setSelectedTemplateId(
            (
              current
            ) =>
              current &&
              list.some(
                (
                  item: AuditTemplate
                ) =>
                  item.id ===
                  current
              )
                ? current
                : list[0]
                    ?.id ||
                  ""
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "DORA denetim şablonları alınamadı."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [firmId]
    );

  const loadQuestions =
    useCallback(
      async () => {
        if (
          !firmId ||
          !selectedTemplateId
        ) {
          setQuestions(
            []
          );

          return;
        }

        try {
          setQuestionLoading(
            true
          );

          const response =
            await fetch(
              `/api/dora/audits/questions?firmId=${encodeURIComponent(
                firmId
              )}&templateId=${encodeURIComponent(
                selectedTemplateId
              )}`,
              {
                cache: "no-store",
              }
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.error ||
                "Denetim maddeleri alınamadı."
            );
          }

          setQuestions(
            Array.isArray(
              data.questions
            )
              ? data.questions
              : []
          );
        } catch (err) {
          alert(
            err instanceof Error
              ? err.message
              : "Denetim maddeleri alınamadı."
          );
        } finally {
          setQuestionLoading(
            false
          );
        }
      },
      [
        firmId,
        selectedTemplateId,
      ]
    );

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const selectedTemplate =
    useMemo(
      () =>
        templates.find(
          (item) =>
            item.id ===
            selectedTemplateId
        ) || null,
      [
        templates,
        selectedTemplateId,
      ]
    );

  const filteredTemplates =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      return templates.filter(
        (template) => {
          if (
            statusFilter !==
              "ALL" &&
            template.status !==
              statusFilter
          ) {
            return false;
          }

          if (!q) {
            return true;
          }

          const haystack =
            [
              template.title,
              template.code,
              template.category,
              template.description,
              template.audit_type,
            ]
              .filter(
                Boolean
              )
              .join(" ")
              .toLocaleLowerCase(
                "tr-TR"
              );

          return haystack.includes(
            q
          );
        }
      );
    }, [
      templates,
      search,
      statusFilter,
    ]);

  const stats =
    useMemo(() => {
      return {
        total:
          templates.length,

        published:
          templates.filter(
            (item) =>
              item.status ===
              "YAYINLANDI"
          ).length,

        draft:
          templates.filter(
            (item) =>
              item.status ===
              "TASLAK"
          ).length,

        passive:
          templates.filter(
            (item) =>
              item.status ===
              "PASIF"
          ).length,

        question:
          questions.length,
      };
    }, [
      templates,
      questions,
    ]);

  function openNewTemplate() {
    setTemplateForm(
      emptyTemplateForm()
    );

    setTemplateModalOpen(
      true
    );
  }

  function openEditTemplate(
    template: AuditTemplate
  ) {
    setTemplateForm({
      id:
        template.id,

      title:
        template.title ||
        "",

      code:
        template.code ||
        "",

      category:
        template.category ||
        "GENEL",

      description:
        template.description ||
        "",

      auditType:
        template.audit_type ||
        "STANDART",

      status:
        template.status ||
        "TASLAK",

      versionNo:
        String(
          template.version_no ??
            1
        ),

      isActive:
        template.is_active !==
        false,
    });

    setTemplateModalOpen(
      true
    );
  }

  async function saveTemplate() {
    if (
      !templateForm.title.trim()
    ) {
      alert(
        "Şablon adı zorunludur."
      );
      return;
    }

    try {
      setSaving(
        true
      );

      const response =
        await fetch(
          "/api/dora/audits/templates",
          {
            method:
              templateForm.id
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  templateForm.id ||
                  undefined,

                firmId,

                title:
                  templateForm.title,

                code:
                  templateForm.code,

                category:
                  templateForm.category,

                description:
                  templateForm.description,

                auditType:
                  templateForm.auditType,

                status:
                  templateForm.status,

                versionNo:
                  Number(
                    templateForm.versionNo ||
                      1
                  ),

                isActive:
                  templateForm.isActive,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Şablon kaydedilemedi."
        );
      }

      setTemplateModalOpen(
        false
      );

      setTemplateForm(
        emptyTemplateForm()
      );

      await loadTemplates();

      if (
        data.template?.id
      ) {
        setSelectedTemplateId(
          data.template.id
        );
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Şablon kaydedilemedi."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  async function deleteTemplate(
    template: AuditTemplate
  ) {
    const ok =
      window.confirm(
        `"${template.title}" şablonu silinsin mi?`
      );

    if (!ok) {
      return;
    }

    try {
      const response =
        await fetch(
          "/api/dora/audits/templates",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  template.id,

                firmId,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Şablon silinemedi."
        );
      }

      await loadTemplates();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Şablon silinemedi."
      );
    }
  }

  function openNewQuestion() {
    if (
      !selectedTemplateId
    ) {
      alert(
        "Önce bir denetim şablonu seç."
      );
      return;
    }

    setQuestionForm({
      ...emptyQuestionForm(),

      templateId:
        selectedTemplateId,

      sortOrder:
        String(
          questions.length +
            1
        ),
    });

    setQuestionModalOpen(
      true
    );
  }

  function openEditQuestion(
    question: AuditQuestion
  ) {
    setQuestionForm({
      id:
        question.id,

      templateId:
        question.template_id,

      sectionTitle:
        question.section_title ||
        "",

      title:
        question.title ||
        "",

      question:
        question.question ||
        "",

      expectedCondition:
        question.expected_condition ||
        "",

      precaution:
        question.precaution ||
        "",

      legalBasis:
        question.legal_basis ||
        "",

      riskLevel:
        question.risk_level ||
        "ORTA",

      photoRequired:
        Boolean(
          question.photo_required
        ),

      score:
        String(
          question.score ??
            0
        ),

      weight:
        String(
          question.weight ??
            1
        ),

      sortOrder:
        String(
          question.sort_order ??
            0
        ),

      note:
        question.note ||
        "",

      isActive:
        question.is_active !==
        false,
    });

    setQuestionModalOpen(
      true
    );
  }

  async function saveQuestion() {
    if (
      !questionForm.title.trim()
    ) {
      alert(
        "Madde başlığı zorunludur."
      );
      return;
    }

    if (
      !questionForm.question.trim()
    ) {
      alert(
        "Denetim sorusu zorunludur."
      );
      return;
    }

    try {
      setQuestionSaving(
        true
      );

      const response =
        await fetch(
          "/api/dora/audits/questions",
          {
            method:
              questionForm.id
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  questionForm.id ||
                  undefined,

                firmId,

                templateId:
                  questionForm.templateId,

                sectionTitle:
                  questionForm.sectionTitle,

                title:
                  questionForm.title,

                question:
                  questionForm.question,

                expectedCondition:
                  questionForm.expectedCondition,

                precaution:
                  questionForm.precaution,

                legalBasis:
                  questionForm.legalBasis,

                riskLevel:
                  questionForm.riskLevel,

                photoRequired:
                  questionForm.photoRequired,

                score:
                  Number(
                    questionForm.score ||
                      0
                  ),

                weight:
                  Number(
                    questionForm.weight ||
                      1
                  ),

                sortOrder:
                  Number(
                    questionForm.sortOrder ||
                      0
                  ),

                note:
                  questionForm.note,

                isActive:
                  questionForm.isActive,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Madde kaydedilemedi."
        );
      }

      setQuestionModalOpen(
        false
      );

      setQuestionForm(
        emptyQuestionForm()
      );

      await loadQuestions();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Madde kaydedilemedi."
      );
    } finally {
      setQuestionSaving(
        false
      );
    }
  }

  async function deleteQuestion(
    question: AuditQuestion
  ) {
    const ok =
      window.confirm(
        `"${question.title}" maddesi silinsin mi?`
      );

    if (!ok) {
      return;
    }

    try {
      const response =
        await fetch(
          "/api/dora/audits/questions",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  question.id,

                firmId,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Madde silinemedi."
        );
      }

      await loadQuestions();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Madde silinemedi."
      );
    }
  }

  function downloadExcelTemplate() {
    const rows = [
      [
        "Bölüm",
        "Başlık",
        "Soru",
        "Beklenen Durum",
        "Önlem",
        "Mevzuat",
        "Risk",
        "Fotoğraf",
        "Puan",
        "Ağırlık",
        "Sıra",
        "Açıklama",
      ],

      [
        "Yangın Güvenliği",
        "Yangın Söndürücü",
        "Taşınabilir yangın söndürücülerin periyodik kontrolleri yapılmış mı?",
        "Cihazlar erişilebilir, uygun tipte ve kontrol süresi geçmemiş olmalıdır.",
        "Eksik veya süresi geçmiş cihazların kontrol ve yenilemesi yapılmalıdır.",
        "Binaların Yangından Korunması Hakkında Yönetmelik",
        "YUKSEK",
        "EVET",
        10,
        1,
        1,
        "Örnek madde",
      ],
    ];

    import("xlsx").then(
      (XLSX) => {
        const sheet =
          XLSX.utils.aoa_to_sheet(
            rows
          );

        const book =
          XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          book,
          sheet,
          "DORA Denetim Maddeleri"
        );

        XLSX.writeFile(
          book,
          "DORA_Denetim_Maddeleri_Sablonu.xlsx"
        );
      }
    );
  }

  function openBulkUpload() {
    if (
      !selectedTemplateId
    ) {
      alert(
        "Önce aktarım yapılacak şablonu seç."
      );
      return;
    }

    fileInputRef.current?.click();
  }

  async function handleBulkFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setBulkUploading(
        true
      );

      const formData =
        new FormData();

      formData.append(
        "firmId",
        firmId
      );

      formData.append(
        "templateId",
        selectedTemplateId
      );

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/dora/audits/questions/bulk",
          {
            method:
              "POST",

            body:
              formData,
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Excel aktarımı yapılamadı."
        );
      }

      alert(
        `Excel aktarımı tamamlandı.\n\nEklenen: ${
          data.inserted ??
          0
        }\nAtlanan: ${
          data.skipped ??
          0
        }`
      );

      await loadQuestions();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Excel aktarımı yapılamadı."
      );
    } finally {
      setBulkUploading(
        false
      );

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    }
  }


  function normalizeExcelResult(value: unknown): string {
    return String(value ?? "")
      .trim()
      .toLocaleUpperCase("tr-TR")
      .replaceAll("İ", "I")
      .replaceAll("Ş", "S")
      .replaceAll("Ğ", "G")
      .replaceAll("Ü", "U")
      .replaceAll("Ö", "O")
      .replaceAll("Ç", "C")
      .replace(/\s+/g, "_");
  }

  function excelYes(value: unknown): boolean {
    const normalized = normalizeExcelResult(value);
    return ["EVET", "E", "YES", "TRUE", "1"].includes(normalized);
  }

  async function fetchAuditAnswersForExcel(auditId: string) {
    const response = await fetch(
      `/api/dora/audits/answers?firmId=${encodeURIComponent(firmId)}&auditId=${encodeURIComponent(auditId)}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Denetim maddeleri alınamadı.");
    }

    return Array.isArray(data.answers) ? data.answers : [];
  }

  async function downloadResultExcelTemplate() {
    if (!resultAuditId) {
      alert("Önce sonuç Excel'i hazırlanacak denetimi seç.");
      return;
    }

    try {
      const audit = audits.find((item) => item.id === resultAuditId);
      const answers = await fetchAuditAnswersForExcel(resultAuditId);
      const XLSX = await import("xlsx");

      const rows: unknown[][] = [
        [
          "Cevap ID",
          "Madde ID",
          "Sıra",
          "Bölüm",
          "Başlık",
          "Denetim Sorusu",
          "Sonuç",
          "Açıklama",
          "Aksiyon Gerekli",
          "Önerilen Aksiyon",
          "Cevaplayan",
          "Not",
          "Bulgu Oluştur",
          "Bulgu Risk Seviyesi",
          "Bulgu Açıklaması",
          "Bulgu Önerisi",
        ],
      ];

      answers.forEach((answer: any, index: number) => {
        const question = Array.isArray(answer.question)
          ? answer.question[0]
          : answer.question;

        rows.push([
          answer.id || "",
          answer.question_id || question?.id || "",
          question?.sort_order ?? index + 1,
          question?.section_title || "",
          question?.title || "",
          question?.question || "",
          answer.answered_at_millis ? answer.answer_status || "" : "",
          answer.explanation || "",
          answer.action_required ? "EVET" : "HAYIR",
          answer.action_text || "",
          answer.answered_by || audit?.auditor_name || "",
          answer.note || "",
          "HAYIR",
          question?.risk_level || "ORTA",
          "",
          "",
        ]);
      });

      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet["!cols"] = [
        { wch: 38 }, { wch: 38 }, { wch: 8 }, { wch: 22 },
        { wch: 30 }, { wch: 48 }, { wch: 20 }, { wch: 38 },
        { wch: 18 }, { wch: 38 }, { wch: 22 }, { wch: 28 },
        { wch: 18 }, { wch: 22 }, { wch: 38 }, { wch: 38 },
      ];

      const info = XLSX.utils.aoa_to_sheet([
        ["DORA DENETİM SONUÇ AKTARIMI"],
        ["Denetim", audit?.title || ""],
        ["Denetim No", audit?.audit_no || ""],
        ["Kural", "Cevap ID ve Madde ID sütunlarını değiştirmeyin."],
        ["Sonuç değerleri", "UYGUN / KISMEN_UYGUN / UYGUNSUZ / UYGULANAMAZ"],
        ["Bulgu", "Yalnız UYGUNSUZ veya KISMEN_UYGUN satırında Bulgu Oluştur=EVET kullanılabilir."],
        ["DÖF", "Excel aktarımı DÖF oluşturmaz. DÖF, DORA Bulgular sekmesinden kontrollü açılır."],
      ]);

      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Denetim Sonuclari");
      XLSX.utils.book_append_sheet(book, info, "Kullanim");
      XLSX.writeFile(
        book,
        `DORA_Denetim_Sonuc_${(audit?.audit_no || audit?.title || "Sablon").replace(/[^a-zA-Z0-9_-]+/g, "_")}.xlsx`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Sonuç Excel şablonu hazırlanamadı.");
    }
  }

  function openResultExcelUpload() {
    if (!resultAuditId) {
      alert("Önce sonuçların aktarılacağı denetimi seç.");
      return;
    }

    resultFileInputRef.current?.click();
  }

  async function handleResultExcelFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setResultUploading(true);

      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets["Denetim Sonuclari"] || workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        throw new Error("Excel dosyasında Denetim Sonuclari sayfası bulunamadı.");
      }

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: false,
      });

      if (rows.length === 0) {
        throw new Error("Excel dosyasında aktarılacak denetim sonucu bulunamadı.");
      }

      const allowedStatuses = new Set([
        "UYGUN",
        "KISMEN_UYGUN",
        "UYGUNSUZ",
        "UYGULANAMAZ",
      ]);

      const answersPayload: Array<Record<string, unknown>> = [];
      const findingRows: Array<Record<string, unknown>> = [];
      const errors: string[] = [];

      rows.forEach((row, index) => {
        const excelRow = index + 2;
        const id = String(row["Cevap ID"] ?? "").trim();
        const questionId = String(row["Madde ID"] ?? "").trim();
        const status = normalizeExcelResult(row["Sonuç"]);

        // Sonuç boş bırakılmış satır aktarılmaz; böylece kısmi Excel yüklemesi yapılabilir.
        if (!status) return;

        if (!id) {
          errors.push(`${excelRow}. satır: Cevap ID boş.`);
          return;
        }

        if (!allowedStatuses.has(status)) {
          errors.push(
            `${excelRow}. satır: Sonuç geçersiz (${String(row["Sonuç"] ?? "")}).`
          );
          return;
        }

        const actionRequired =
          excelYes(row["Aksiyon Gerekli"]) ||
          status === "UYGUNSUZ" ||
          status === "KISMEN_UYGUN";

        answersPayload.push({
          id,
          answerStatus: status,
          explanation: String(row["Açıklama"] ?? "").trim(),
          actionRequired,
          actionText: String(row["Önerilen Aksiyon"] ?? "").trim(),
          answeredBy: String(row["Cevaplayan"] ?? "").trim(),
          note: String(row["Not"] ?? "").trim(),
        });

        if (excelYes(row["Bulgu Oluştur"])) {
          if (status !== "UYGUNSUZ" && status !== "KISMEN_UYGUN") {
            errors.push(
              `${excelRow}. satır: Bulgu yalnız UYGUNSUZ veya KISMEN_UYGUN sonuçtan oluşturulabilir.`
            );
            return;
          }

          findingRows.push({
            answerId: id,
            questionId,
            title:
              String(row["Başlık"] ?? "").trim() ||
              String(row["Denetim Sorusu"] ?? "").trim() ||
              `Denetim Bulgusu ${excelRow}`,
            description:
              String(row["Bulgu Açıklaması"] ?? "").trim() ||
              String(row["Açıklama"] ?? "").trim(),
            riskLevel:
              normalizeExcelResult(row["Bulgu Risk Seviyesi"]) || "ORTA",
            legalBasis: "",
            recommendation:
              String(row["Bulgu Önerisi"] ?? "").trim() ||
              String(row["Önerilen Aksiyon"] ?? "").trim(),
            detectedBy: String(row["Cevaplayan"] ?? "").trim(),
          });
        }
      });

      if (errors.length > 0) {
        throw new Error(
          `Excel doğrulamasında ${errors.length} hata bulundu:\n\n${errors.slice(0, 12).join("\n")}${
            errors.length > 12 ? `\n... ve ${errors.length - 12} hata daha.` : ""
          }`
        );
      }

      if (answersPayload.length === 0) {
        throw new Error("Excel'de Sonuç alanı doldurulmuş hiçbir satır bulunamadı.");
      }

      const answerResponse = await fetch("/api/dora/audits/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmId,
          auditId: resultAuditId,
          answers: answersPayload,
        }),
      });

      const answerData = await answerResponse.json();

      if (!answerResponse.ok || !answerData.success) {
        throw new Error(answerData.error || "Denetim sonuçları toplu kaydedilemedi.");
      }

      let findingsCreated = 0;
      let findingsSkipped = 0;

      for (const finding of findingRows) {
        const existingResponse = await fetch(
          `/api/dora/audits/findings?firmId=${encodeURIComponent(firmId)}&auditId=${encodeURIComponent(resultAuditId)}&answerId=${encodeURIComponent(String(finding.answerId))}`,
          { cache: "no-store" }
        );
        const existingData = await existingResponse.json();

        if (
          existingResponse.ok &&
          existingData.success &&
          Array.isArray(existingData.findings) &&
          existingData.findings.length > 0
        ) {
          findingsSkipped += 1;
          continue;
        }

        const findingResponse = await fetch("/api/dora/audits/findings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firmId,
            auditId: resultAuditId,
            ...finding,
            findingType: "UYGUNSUZLUK",
          }),
        });

        const findingData = await findingResponse.json();

        if (!findingResponse.ok || !findingData.success) {
          throw new Error(
            findingData.error ||
              `Denetim cevapları kaydedildi ancak "${String(finding.title)}" bulgusu oluşturulamadı.`
          );
        }

        findingsCreated += 1;
      }

      await loadAudits();

      alert(
        `Denetim sonuçları aktarıldı.\n\n` +
          `İşlenen cevap: ${answersPayload.length}\n` +
          `Oluşturulan bulgu: ${findingsCreated}\n` +
          `Mevcut olduğu için atlanan bulgu: ${findingsSkipped}\n\n` +
          `DÖF otomatik oluşturulmadı. Gerekli DÖF'leri Bulgular sekmesinden açabilirsin.`
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Denetim sonuçları Excel'den aktarılamadı."
      );
    } finally {
      setResultUploading(false);

      if (resultFileInputRef.current) {
        resultFileInputRef.current.value = "";
      }
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <button
            className="backBtn"
            onClick={() =>
              router.push(
                `/admin/dora/${firmId}`
              )
            }
          >
            ← DORA Firmasına Dön
          </button>

          <div className="eyebrow">
            DORA • BAĞIMSIZ DENETİM MERKEZİ
          </div>

          <h1>
            DORA Denetim Merkezi
          </h1>

          <p>
            DORA'nın kendi şablonlarını,
            denetim maddelerini ve saha
            denetim altyapısını bağımsız
            olarak yönetin.
          </p>
        </div>

        <div className="heroActions">
          <button
            className="outlineBtn"
            onClick={
              downloadExcelTemplate
            }
          >
            Excel Şablonu
          </button>

          <input
            ref={
              fileInputRef
            }
            type="file"
            hidden
            accept=".xlsx,.xls"
            onChange={(
              event
            ) =>
              void handleBulkFile(
                event
              )
            }
          />

          <button
            className="outlineBtn"
            disabled={
              bulkUploading
            }
            onClick={
              openBulkUpload
            }
          >
            {bulkUploading
              ? "Aktarılıyor..."
              : "Excel'den Toplu Aktar"}
          </button>

          <button
            className="outlineBtn"
            onClick={() => {
              void loadTemplates();
              void loadQuestions();
            }}
          >
            Yenile
          </button>

          <button
            className="primaryBtn"
            onClick={
              openNewTemplate
            }
          >
            + Yeni Şablon
          </button>
        </div>
      </section>

      <section className="auditTabs">
        <button className={activeTab === "TEMPLATES" ? "tabBtn activeTab" : "tabBtn"} onClick={() => setActiveTab("TEMPLATES")}>Şablonlar ve Maddeler</button>
        <button className={activeTab === "AUDITS" ? "tabBtn activeTab" : "tabBtn"} onClick={() => setActiveTab("AUDITS")}>Denetimler</button>
        <button className={activeTab === "FINDINGS" ? "tabBtn activeTab" : "tabBtn"} onClick={() => setActiveTab("FINDINGS")}>Bulgular</button>
        <button className={activeTab === "CAPA" ? "tabBtn activeTab" : "tabBtn"} onClick={() => setActiveTab("CAPA")}>DÖF Takibi</button>
      </section>

      {activeTab === "AUDITS" ? (
        <>
          <section className="kpiGrid">
            <Kpi title="Toplam Denetim" value={auditStats.total} />
            <Kpi title="Planlanan" value={auditStats.planned} />
            <Kpi title="Devam Eden" value={auditStats.active} />
            <Kpi title="Tamamlanan" value={auditStats.completed} />
            <Kpi title="Uygunsuzluk" value={auditStats.nonCompliant} />
          </section>
          <section className="auditRunPanel">
            <div className="panelHeader">
              <div>
                <div className="eyebrow">SAHA DENETİMLERİ</div>
                <h2>Denetim Kayıtları</h2>
              </div>
              <div className="rowActions">
                <select
                  className="auditResultSelect"
                  value={resultAuditId}
                  onChange={(event) => setResultAuditId(event.target.value)}
                >
                  <option value="">Sonuç aktarılacak denetimi seç...</option>
                  {audits.map((audit) => (
                    <option key={audit.id} value={audit.id}>
                      {audit.audit_no || "DORA"} • {audit.title}
                    </option>
                  ))}
                </select>

                <button
                  className="outlineBtn"
                  disabled={!resultAuditId}
                  onClick={() => void downloadResultExcelTemplate()}
                >
                  Sonuç Excel Şablonu
                </button>

                <input
                  ref={resultFileInputRef}
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={(event) => void handleResultExcelFile(event)}
                />

                <button
                  className="outlineBtn"
                  disabled={!resultAuditId || resultUploading}
                  onClick={openResultExcelUpload}
                >
                  {resultUploading ? "Sonuçlar Aktarılıyor..." : "Denetim Sonuçlarını Excel'den Aktar"}
                </button>

                <button
                  className="primaryBtn"
                  onClick={openNewAudit}
                  disabled={publishedTemplates.length === 0}
                >
                  + Yeni Denetim Başlat
                </button>
              </div>
            </div>
            <div className="infoBox">
              <strong>Toplu sonuç girişi:</strong> Denetimi seç → Sonuç Excel Şablonu'nu indir → sonuçları Excel'de doldur → aynı dosyayı toplu aktar.
              UYGUNSUZ/KISMEN UYGUN satırlarda “Bulgu Oluştur = EVET” seçilebilir. DÖF otomatik açılmaz.
            </div>
            {publishedTemplates.length === 0 && <div className="errorBox">Yeni denetim başlatmak için en az bir yayınlanmış ve aktif şablon bulunmalıdır.</div>}
            {auditLoading ? <div className="empty">Denetimler yükleniyor...</div> : audits.length === 0 ? <div className="empty">Henüz başlatılmış DORA denetimi yok.</div> : (
              <div className="auditTableWrap"><table className="auditTable"><thead><tr><th>Denetim No</th><th>Denetim</th><th>Şablon</th><th>Tarih</th><th>Denetçi</th><th>İlerleme</th><th>Uygunsuz</th><th>Uyum</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>
                {audits.map((audit) => <tr key={audit.id}><td><strong>{audit.audit_no || "-"}</strong></td><td>{audit.title}</td><td>{audit.template?.title || templates.find(t => t.id === audit.template_id)?.title || "-"}</td><td>{audit.audit_date_millis ? new Date(audit.audit_date_millis).toLocaleDateString("tr-TR") : "-"}</td><td>{audit.auditor_name || "-"}</td><td>{Number(audit.answered_questions || 0)} / {Number(audit.total_questions || 0)}</td><td>{Number(audit.non_compliant_count || 0)}</td><td>%{Number(audit.compliance_percent || 0).toFixed(1)}</td><td><span className={`status status-${audit.status}`}>{audit.status.replaceAll("_", " ")}</span></td><td><div className="rowActions"><button className="primaryBtn small" onClick={() => router.push(`/admin/dora/${firmId}/audits/${audit.id}`)}>Denetimi Aç</button><button className="deleteBtn small" onClick={() => void deleteAudit(audit)}>Sil</button></div></td></tr>)}
              </tbody></table></div>
            )}
          </section>
        </>
      ) : activeTab === "FINDINGS" ? (
        <>
          <section className="kpiGrid">
            <Kpi title="Toplam Bulgu" value={findingStats.total} />
            <Kpi title="Açık" value={findingStats.open} />
            <Kpi title="Takipte" value={findingStats.tracking} />
            <Kpi title="Kapalı" value={findingStats.closed} />
            <Kpi title="Kritik" value={findingStats.critical} />
          </section>
          <section className="auditRunPanel">
            <div className="panelHeader"><div><div className="eyebrow">DORA • BULGU YÖNETİMİ</div><h2>Denetim Bulguları</h2></div><button className="outlineBtn" onClick={() => void loadFindings()}>Yenile</button></div>
            {findingLoading ? <div className="empty">Bulgular yükleniyor...</div> : findings.length === 0 ? <div className="empty">Henüz DORA bulgusu yok. Uygunsuz veya kısmen uygun saha maddesinden bulgu oluşturabilirsiniz.</div> : (
              <div className="auditTableWrap"><table className="auditTable"><thead><tr><th>Denetim</th><th>Bulgu</th><th>Tip</th><th>Risk</th><th>Tespit Tarihi</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>
                {findings.map((f) => <tr key={f.id}><td>{f.audit?.audit_no || f.audit?.title || "-"}</td><td><strong>{f.title}</strong><div className="cellSub">{f.description || f.question?.question || ""}</div></td><td>{(f.finding_type || "-").replaceAll("_", " ")}</td><td><span className={`riskBadge ${riskClass(f.risk_level)}`}>{riskLabel(f.risk_level)}</span></td><td>{f.detected_at_millis ? new Date(f.detected_at_millis).toLocaleDateString("tr-TR") : "-"}</td><td><span className={`status status-${f.status}`}>{f.status.replaceAll("_", " ")}</span></td><td>{f.status !== "KAPALI" && <button className="primaryBtn small" onClick={() => void createCapaFromFinding(f)}>DÖF Aç</button>}</td></tr>)}
              </tbody></table></div>
            )}
          </section>
        </>
      ) : activeTab === "CAPA" ? (
        <>
          <section className="kpiGrid">
            <Kpi title="Toplam DÖF" value={capaStats.total} />
            <Kpi title="Açık" value={capaStats.open} />
            <Kpi title="Devam Eden" value={capaStats.active} />
            <Kpi title="Tamamlanan" value={capaStats.completed} />
            <Kpi title="Kapalı" value={capaStats.closed} />
          </section>
          <section className="auditRunPanel">
            <div className="panelHeader"><div><div className="eyebrow">DORA • BAĞIMSIZ DÖF</div><h2>DÖF Takip Tablosu</h2></div><button className="outlineBtn" onClick={() => void loadCapas()}>Yenile</button></div>
            <div className="infoBox">Bu DÖF kayıtları yalnızca DORA içinde yönetilir; ana D-SEC DÖF, Risk, Ajanda veya diğer modüllere aktarılmaz.</div>
            {capaLoading ? <div className="empty">DÖF kayıtları yükleniyor...</div> : capas.length === 0 ? <div className="empty">Henüz DORA DÖF kaydı yok.</div> : (
              <div className="auditTableWrap"><table className="auditTable"><thead><tr><th>Denetim</th><th>DÖF</th><th>Bulgu</th><th>Öncelik</th><th>Sorumlu</th><th>Termin</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>
                {capas.map((c) => <tr key={c.id}><td>{c.audit?.audit_no || c.audit?.title || "-"}</td><td><strong>{c.title}</strong><div className="cellSub">{c.corrective_action || c.description || ""}</div></td><td>{c.finding?.title || "-"}</td><td><span className={`riskBadge ${riskClass(c.priority)}`}>{riskLabel(c.priority)}</span></td><td>{c.responsible_person || "-"}</td><td>{c.due_date_millis ? new Date(c.due_date_millis).toLocaleDateString("tr-TR") : "-"}</td><td><span className={`status status-${c.status}`}>{c.status.replaceAll("_", " ")}</span></td><td><div className="rowActions">{c.status === "ACIK" && <button className="outlineBtn small" onClick={() => void changeCapaStatus(c, "DEVAM_EDIYOR")}>Başlat</button>}{c.status === "DEVAM_EDIYOR" && <button className="outlineBtn small" onClick={() => void changeCapaStatus(c, "TAMAMLANDI")}>Tamamla</button>}{c.status === "TAMAMLANDI" && <button className="primaryBtn small" onClick={() => void changeCapaStatus(c, "KAPALI")}>Etkinlik / Kapat</button>}</div></td></tr>)}
              </tbody></table></div>
            )}
          </section>
        </>
      ) : (
        <>
      <section className="kpiGrid">
        <Kpi
          title="Toplam Şablon"
          value={
            stats.total
          }
        />

        <Kpi
          title="Yayınlanan"
          value={
            stats.published
          }
        />

        <Kpi
          title="Taslak"
          value={
            stats.draft
          }
        />

        <Kpi
          title="Pasif"
          value={
            stats.passive
          }
        />

        <Kpi
          title="Seçili Şablon Maddesi"
          value={
            stats.question
          }
        />
      </section>

      <section className="toolbar">
        <input
          value={
            search
          }
          onChange={(
            event
          ) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Şablon adı, kodu veya kategori ara..."
        />

        <select
          value={
            statusFilter
          }
          onChange={(
            event
          ) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="ALL">
            Tüm Durumlar
          </option>

          {TEMPLATE_STATUSES.map(
            (
              item
            ) => (
              <option
                key={
                  item.value
                }
                value={
                  item.value
                }
              >
                {
                  item.label
                }
              </option>
            )
          )}
        </select>
      </section>

      {error && (
        <div className="errorBox">
          {error}
        </div>
      )}

      <section className="layout">
        <aside className="templatePanel">
          <div className="panelHeader">
            <div>
              <div className="eyebrow">
                ŞABLONLAR
              </div>

              <h2>
                Denetim Şablonları
              </h2>
            </div>

            <strong>
              {
                filteredTemplates.length
              }
            </strong>
          </div>

          {loading ? (
            <div className="empty">
              Şablonlar
              yükleniyor...
            </div>
          ) : filteredTemplates.length ===
            0 ? (
            <div className="empty">
              Henüz şablon
              bulunmuyor.
            </div>
          ) : (
            <div className="templateList">
              {filteredTemplates.map(
                (
                  template
                ) => (
                  <article
                    key={
                      template.id
                    }
                    className={`templateCard ${
                      selectedTemplateId ===
                      template.id
                        ? "selectedTemplate"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedTemplateId(
                        template.id
                      )
                    }
                  >
                    <div className="templateTop">
                      <div>
                        <span className="templateCode">
                          {template.code ||
                            "DORA"}
                        </span>

                        <h3>
                          {
                            template.title
                          }
                        </h3>
                      </div>

                      <span className={`status status-${template.status}`}>
                        {templateStatusLabel(
                          template.status
                        )}
                      </span>
                    </div>

                    <p>
                      {template.description ||
                        "Açıklama bulunmuyor."}
                    </p>

                    <div className="templateMeta">
                      <span>
                        {auditTypeLabel(
                          template.audit_type
                        )}
                      </span>

                      <span>
                        {
                          template.category
                        }
                      </span>

                      <span>
                        v
                        {
                          template.version_no ??
                          1
                        }
                      </span>
                    </div>

                    <div className="templateActions">
                      <button
                        className="outlineBtn small"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          openEditTemplate(
                            template
                          );
                        }}
                      >
                        Düzenle
                      </button>

                      <button
                        className="deleteBtn small"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();

                          void deleteTemplate(
                            template
                          );
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </aside>

        <section className="questionPanel">
          <div className="panelHeader">
            <div>
              <div className="eyebrow">
                DENETİM MADDELERİ
              </div>

              <h2>
                {selectedTemplate
                  ? selectedTemplate.title
                  : "Şablon Seçilmedi"}
              </h2>
            </div>

            <button
              className="primaryBtn"
              onClick={
                openNewQuestion
              }
              disabled={
                !selectedTemplateId
              }
            >
              + Madde Ekle
            </button>
          </div>

          {!selectedTemplateId ? (
            <div className="empty">
              Soldan bir denetim
              şablonu seç.
            </div>
          ) : questionLoading ? (
            <div className="empty">
              Maddeler
              yükleniyor...
            </div>
          ) : questions.length ===
            0 ? (
            <div className="empty">
              Bu şablonda henüz
              denetim maddesi yok.
            </div>
          ) : (
            <div className="questionList">
              {questions.map(
                (
                  question,
                  index
                ) => (
                  <article
                    className="questionCard"
                    key={
                      question.id
                    }
                  >
                    <div className="questionNumber">
                      {index +
                        1}
                    </div>

                    <div className="questionMain">
                      <div className="questionTop">
                        <div>
                          {question.section_title && (
                            <div className="sectionTag">
                              {
                                question.section_title
                              }
                            </div>
                          )}

                          <h3>
                            {
                              question.title
                            }
                          </h3>

                          <p className="questionText">
                            {
                              question.question
                            }
                          </p>
                        </div>

                        <span className={`riskBadge ${riskClass(
                          question.risk_level
                        )}`}>
                          {riskLabel(
                            question.risk_level
                          )}
                        </span>
                      </div>

                      <div className="detailGrid">
                        <Detail
                          label="Beklenen Durum"
                          value={
                            question.expected_condition
                          }
                        />

                        <Detail
                          label="Önlem"
                          value={
                            question.precaution
                          }
                        />

                        <Detail
                          label="Mevzuat"
                          value={
                            question.legal_basis
                          }
                        />

                        <Detail
                          label="Fotoğraf"
                          value={
                            question.photo_required
                              ? "Zorunlu"
                              : "Opsiyonel"
                          }
                        />

                        <Detail
                          label="Puan"
                          value={String(
                            question.score ??
                              0
                          )}
                        />

                        <Detail
                          label="Ağırlık"
                          value={String(
                            question.weight ??
                              1
                          )}
                        />
                      </div>

                      {question.note && (
                        <div className="noteBox">
                          {
                            question.note
                          }
                        </div>
                      )}

                      <div className="questionActions">
                        <button
                          className="outlineBtn small"
                          onClick={() =>
                            openEditQuestion(
                              question
                            )
                          }
                        >
                          Düzenle
                        </button>

                        <button
                          className="deleteBtn small"
                          onClick={() =>
                            void deleteQuestion(
                              question
                            )
                          }
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </section>

        </>
      )}

      {auditModalOpen && (
        <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuditModalOpen(false); }}>
          <div className="modal"><div className="modalHeader"><div><div className="eyebrow">DORA • YENİ SAHA DENETİMİ</div><h2>Yeni Denetim Başlat</h2></div><button className="closeBtn" onClick={() => setAuditModalOpen(false)}>×</button></div>
            <div className="modalBody"><div className="grid2">
              <label className="field"><span>Yayınlanmış Şablon *</span><select value={auditForm.templateId} onChange={(e) => { const t = publishedTemplates.find(x => x.id === e.target.value); setAuditForm({ ...auditForm, templateId: e.target.value, title: auditForm.title || (t ? `${t.title} Denetimi` : "") }); }}><option value="">Şablon seçin</option>{publishedTemplates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
              <Field label="Denetim Başlığı *" value={auditForm.title} onChange={(value) => setAuditForm({ ...auditForm, title: value })} />
              <label className="field"><span>Denetim Tarihi *</span><input type="date" value={auditForm.auditDate} onChange={(e) => setAuditForm({ ...auditForm, auditDate: e.target.value })} /></label>
              <Field label="Denetçi" value={auditForm.auditorName} onChange={(value) => setAuditForm({ ...auditForm, auditorName: value })} />
              <Field label="Denetçi Unvanı" value={auditForm.auditorTitle} onChange={(value) => setAuditForm({ ...auditForm, auditorTitle: value })} />
              <Field label="Bölüm" value={auditForm.department} onChange={(value) => setAuditForm({ ...auditForm, department: value })} />
              <Field label="Lokasyon" value={auditForm.location} onChange={(value) => setAuditForm({ ...auditForm, location: value })} />
            </div><TextArea label="Denetim Kapsamı" value={auditForm.scope} onChange={(value) => setAuditForm({ ...auditForm, scope: value })} /><TextArea label="Not" value={auditForm.note} onChange={(value) => setAuditForm({ ...auditForm, note: value })} /></div>
            <div className="modalFooter"><button className="outlineBtn" onClick={() => setAuditModalOpen(false)}>Vazgeç</button><button className="primaryBtn" disabled={auditSaving} onClick={() => void createAudit()}>{auditSaving ? "Başlatılıyor..." : "Denetimi Başlat"}</button></div>
          </div>
        </div>
      )}

      {templateModalOpen && (
        <div
          className="overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setTemplateModalOpen(
                false
              );
            }
          }}
        >
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">
                  DORA • DENETİM ŞABLONU
                </div>

                <h2>
                  {templateForm.id
                    ? "Şablonu Düzenle"
                    : "Yeni Denetim Şablonu"}
                </h2>
              </div>

              <button
                className="closeBtn"
                onClick={() =>
                  setTemplateModalOpen(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="modalBody">
              <div className="grid2">
                <Field
                  label="Şablon Adı *"
                  value={
                    templateForm.title
                  }
                  onChange={(
                    value
                  ) =>
                    setTemplateForm({
                      ...templateForm,
                      title:
                        value,
                    })
                  }
                />

                <Field
                  label="Kod"
                  value={
                    templateForm.code
                  }
                  onChange={(
                    value
                  ) =>
                    setTemplateForm({
                      ...templateForm,
                      code:
                        value,
                    })
                  }
                />

                <Field
                  label="Kategori"
                  value={
                    templateForm.category
                  }
                  onChange={(
                    value
                  ) =>
                    setTemplateForm({
                      ...templateForm,
                      category:
                        value,
                    })
                  }
                />

                <label className="field">
                  <span>
                    Denetim Tipi
                  </span>

                  <select
                    value={
                      templateForm.auditType
                    }
                    onChange={(
                      event
                    ) =>
                      setTemplateForm({
                        ...templateForm,
                        auditType:
                          event.target.value,
                      })
                    }
                  >
                    {AUDIT_TYPES.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="field">
                  <span>
                    Durum
                  </span>

                  <select
                    value={
                      templateForm.status
                    }
                    onChange={(
                      event
                    ) =>
                      setTemplateForm({
                        ...templateForm,
                        status:
                          event.target.value,
                      })
                    }
                  >
                    {TEMPLATE_STATUSES.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <Field
                  label="Versiyon"
                  value={
                    templateForm.versionNo
                  }
                  onChange={(
                    value
                  ) =>
                    setTemplateForm({
                      ...templateForm,
                      versionNo:
                        value,
                    })
                  }
                />
              </div>

              <label className="field">
                <span>
                  Açıklama
                </span>

                <textarea
                  rows={
                    5
                  }
                  value={
                    templateForm.description
                  }
                  onChange={(
                    event
                  ) =>
                    setTemplateForm({
                      ...templateForm,
                      description:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label className="check">
                <input
                  type="checkbox"
                  checked={
                    templateForm.isActive
                  }
                  onChange={(
                    event
                  ) =>
                    setTemplateForm({
                      ...templateForm,
                      isActive:
                        event.target.checked,
                    })
                  }
                />

                Aktif şablon
              </label>
            </div>

            <div className="modalFooter">
              <button
                className="outlineBtn"
                onClick={() =>
                  setTemplateModalOpen(
                    false
                  )
                }
              >
                Vazgeç
              </button>

              <button
                className="primaryBtn"
                disabled={
                  saving
                }
                onClick={() =>
                  void saveTemplate()
                }
              >
                {saving
                  ? "Kaydediliyor..."
                  : templateForm.id
                    ? "Değişiklikleri Kaydet"
                    : "Şablonu Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}

      {questionModalOpen && (
        <div
          className="overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setQuestionModalOpen(
                false
              );
            }
          }}
        >
          <div className="modal questionModal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">
                  DORA • DENETİM MADDESİ
                </div>

                <h2>
                  {questionForm.id
                    ? "Denetim Maddesini Düzenle"
                    : "Yeni Denetim Maddesi"}
                </h2>
              </div>

              <button
                className="closeBtn"
                onClick={() =>
                  setQuestionModalOpen(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="modalBody">
              <div className="grid2">
                <Field
                  label="Bölüm Başlığı"
                  value={
                    questionForm.sectionTitle
                  }
                  onChange={(
                    value
                  ) =>
                    setQuestionForm({
                      ...questionForm,
                      sectionTitle:
                        value,
                    })
                  }
                />

                <Field
                  label="Madde Başlığı *"
                  value={
                    questionForm.title
                  }
                  onChange={(
                    value
                  ) =>
                    setQuestionForm({
                      ...questionForm,
                      title:
                        value,
                    })
                  }
                />
              </div>

              <TextArea
                label="Denetim Sorusu *"
                value={
                  questionForm.question
                }
                onChange={(
                  value
                ) =>
                  setQuestionForm({
                    ...questionForm,
                    question:
                      value,
                  })
                }
              />

              <TextArea
                label="Beklenen Durum"
                value={
                  questionForm.expectedCondition
                }
                onChange={(
                  value
                ) =>
                  setQuestionForm({
                    ...questionForm,
                    expectedCondition:
                      value,
                  })
                }
              />

              <TextArea
                label="Önlem / Tedbir"
                value={
                  questionForm.precaution
                }
                onChange={(
                  value
                ) =>
                  setQuestionForm({
                    ...questionForm,
                    precaution:
                      value,
                  })
                }
              />

              <TextArea
                label="Mevzuat"
                value={
                  questionForm.legalBasis
                }
                onChange={(
                  value
                ) =>
                  setQuestionForm({
                    ...questionForm,
                    legalBasis:
                      value,
                  })
                }
              />

              <div className="grid3">
                <label className="field">
                  <span>
                    Risk Seviyesi
                  </span>

                  <select
                    value={
                      questionForm.riskLevel
                    }
                    onChange={(
                      event
                    ) =>
                      setQuestionForm({
                        ...questionForm,
                        riskLevel:
                          event.target.value,
                      })
                    }
                  >
                    {RISK_LEVELS.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <Field
                  label="Puan"
                  value={
                    questionForm.score
                  }
                  onChange={(
                    value
                  ) =>
                    setQuestionForm({
                      ...questionForm,
                      score:
                        value,
                    })
                  }
                />

                <Field
                  label="Ağırlık"
                  value={
                    questionForm.weight
                  }
                  onChange={(
                    value
                  ) =>
                    setQuestionForm({
                      ...questionForm,
                      weight:
                        value,
                    })
                  }
                />
              </div>

              <div className="grid2">
                <Field
                  label="Sıra"
                  value={
                    questionForm.sortOrder
                  }
                  onChange={(
                    value
                  ) =>
                    setQuestionForm({
                      ...questionForm,
                      sortOrder:
                        value,
                    })
                  }
                />

                <div className="checkGroup">
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={
                        questionForm.photoRequired
                      }
                      onChange={(
                        event
                      ) =>
                        setQuestionForm({
                          ...questionForm,
                          photoRequired:
                            event.target.checked,
                        })
                      }
                    />

                    Fotoğraf zorunlu
                  </label>

                  <label className="check">
                    <input
                      type="checkbox"
                      checked={
                        questionForm.isActive
                      }
                      onChange={(
                        event
                      ) =>
                        setQuestionForm({
                          ...questionForm,
                          isActive:
                            event.target.checked,
                        })
                      }
                    />

                    Aktif madde
                  </label>
                </div>
              </div>

              <TextArea
                label="Açıklama / Not"
                value={
                  questionForm.note
                }
                onChange={(
                  value
                ) =>
                  setQuestionForm({
                    ...questionForm,
                    note:
                      value,
                  })
                }
              />
            </div>

            <div className="modalFooter">
              <button
                className="outlineBtn"
                onClick={() =>
                  setQuestionModalOpen(
                    false
                  )
                }
              >
                Vazgeç
              </button>

              <button
                className="primaryBtn"
                disabled={
                  questionSaving
                }
                onClick={() =>
                  void saveQuestion()
                }
              >
                {questionSaving
                  ? "Kaydediliyor..."
                  : questionForm.id
                    ? "Değişiklikleri Kaydet"
                    : "Maddeyi Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 28px;
          background: #f6f7f9;
          color: #172033;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          padding: 28px;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          background: #fff;
          box-shadow: 0 8px 28px rgba(15,23,42,.05);
        }

        .hero h1 {
          margin: 8px 0;
          font-size: 32px;
        }

        .hero p {
          max-width: 700px;
          margin: 0;
          color: #667085;
          line-height: 1.6;
        }

        .heroActions {
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .eyebrow {
          color: #7a2633;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .08em;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .backBtn,
        .outlineBtn,
        .primaryBtn,
        .deleteBtn {
          border-radius: 10px;
          padding: 10px 14px;
          font-weight: 750;
        }

        .backBtn {
          padding-left: 0;
          border: 0;
          background: transparent;
          color: #667085;
        }

        .outlineBtn {
          border: 1px solid #d0d5dd;
          background: #fff;
          color: #344054;
        }

        .primaryBtn {
          border: 1px solid #7a2633;
          background: #7a2633;
          color: #fff;
        }

        .deleteBtn {
          border: 1px solid #fecdca;
          background: #fff5f5;
          color: #b42318;
        }

        .small {
          padding: 7px 10px;
          font-size: 12px;
        }

        .auditTabs { display:flex; gap:8px; margin-top:18px; padding:6px; width:max-content; border:1px solid #e5e7eb; border-radius:14px; background:#fff; }
        .tabBtn { border:0; border-radius:10px; padding:10px 16px; background:transparent; color:#667085; font-weight:800; }
        .activeTab { background:#7a2633; color:#fff; }
        .auditResultSelect {
          min-width: 260px;
          max-width: 360px;
          border: 1px solid #d0d5dd;
          border-radius: 10px;
          background: #fff;
          padding: 10px 12px;
          color: #344054;
          font: inherit;
        }
        .auditRunPanel { margin-top:18px; padding:18px; border:1px solid #e5e7eb; border-radius:18px; background:#fff; }
        .auditTableWrap { overflow:auto; }
        .auditTable { width:100%; border-collapse:collapse; min-width:1150px; }
        .auditTable th,.auditTable td { padding:12px 10px; border-bottom:1px solid #eaecf0; text-align:left; vertical-align:middle; font-size:12px; }
        .auditTable th { color:#667085; font-size:11px; text-transform:uppercase; letter-spacing:.03em; background:#f9fafb; }
        .rowActions { display:flex; gap:6px; white-space:nowrap; }
        .status-PLANLANDI { background:#eff8ff; color:#175cd3; }
        .status-DEVAM_EDIYOR { background:#fffaeb; color:#b54708; }
        .status-TAMAMLANDI { background:#ecfdf3; color:#027a48; }
        .status-IPTAL { background:#f2f4f7; color:#667085; }
        .status-ACIK { background:#fef3f2; color:#b42318; }
        .status-TAKIPTE, .status-DEVAM_EDIYOR { background:#fffaeb; color:#b54708; }
        .status-KAPALI, .status-TAMAMLANDI { background:#ecfdf3; color:#027a48; }
        .cellSub { margin-top:4px; max-width:420px; color:#667085; font-size:11px; line-height:1.4; }
        .infoBox { margin:0 0 14px; padding:11px 13px; border:1px solid #d0d5dd; border-radius:10px; background:#f8fafc; color:#475467; font-size:12px; }

        .kpiGrid {
          display: grid;
          grid-template-columns:
            repeat(5,minmax(0,1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .toolbar {
          display: grid;
          grid-template-columns:
            minmax(320px,1fr)
            220px;
          gap: 10px;
          margin-top: 18px;
        }

        .toolbar input,
        .toolbar select,
        .field input,
        .field select,
        .field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d0d5dd;
          border-radius: 10px;
          background: #fff;
          padding: 11px 12px;
          color: #172033;
          outline: none;
        }

        .layout {
          display: grid;
          grid-template-columns:
            350px minmax(0,1fr);
          gap: 16px;
          margin-top: 18px;
        }

        .templatePanel,
        .questionPanel {
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #fff;
        }

        .panelHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .panelHeader h2 {
          margin: 5px 0 0;
          font-size: 19px;
        }

        .templateList,
        .questionList {
          display: grid;
          gap: 10px;
        }

        .templateCard {
          padding: 14px;
          border: 1px solid #eaecf0;
          border-radius: 13px;
          background: #fff;
          cursor: pointer;
          transition: .15s ease;
        }

        .templateCard:hover {
          border-color: #c9a5ac;
        }

        .selectedTemplate {
          border-color: #7a2633;
          box-shadow: 0 0 0 2px rgba(122,38,51,.08);
        }

        .templateTop {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .templateCode {
          display: block;
          color: #98a2b3;
          font-size: 10px;
          font-weight: 850;
        }

        .templateTop h3 {
          margin: 4px 0 0;
          font-size: 15px;
        }

        .templateCard p {
          margin: 9px 0;
          color: #667085;
          font-size: 12px;
          line-height: 1.45;
        }

        .templateMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .templateMeta span {
          padding: 4px 7px;
          border-radius: 999px;
          background: #f2f4f7;
          color: #475467;
          font-size: 10px;
          font-weight: 750;
        }

        .templateActions {
          display: flex;
          gap: 7px;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #f0f1f3;
        }

        .status {
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 850;
          white-space: nowrap;
        }

        .status-YAYINLANDI {
          background: #ecfdf3;
          color: #027a48;
        }

        .status-TASLAK {
          background: #fffaeb;
          color: #b54708;
        }

        .status-PASIF {
          background: #f2f4f7;
          color: #667085;
        }

        .questionCard {
          display: grid;
          grid-template-columns: 36px 1fr;
          gap: 12px;
          padding: 15px;
          border: 1px solid #eaecf0;
          border-radius: 13px;
          background: #fff;
        }

        .questionNumber {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #f2f4f7;
          color: #475467;
          font-weight: 900;
          font-size: 12px;
        }

        .questionTop {
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .sectionTag {
          color: #7a2633;
          font-size: 10px;
          font-weight: 900;
        }

        .questionTop h3 {
          margin: 4px 0;
          font-size: 15px;
        }

        .questionText {
          margin: 0;
          color: #475467;
          line-height: 1.5;
          font-size: 13px;
        }

        .riskBadge {
          height: fit-content;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
        }

        .riskGreen {
          background: #ecfdf3;
          color: #027a48;
        }

        .riskAmber {
          background: #fffaeb;
          color: #b54708;
        }

        .riskOrange {
          background: #fff4ed;
          color: #c4320a;
        }

        .riskRed {
          background: #fef3f2;
          color: #b42318;
        }

        .riskGray {
          background: #f2f4f7;
          color: #667085;
        }

        .detailGrid {
          display: grid;
          grid-template-columns:
            repeat(3,minmax(0,1fr));
          gap: 8px;
          margin-top: 12px;
        }

        .noteBox {
          margin-top: 10px;
          padding: 9px 10px;
          border-radius: 9px;
          background: #f8fafc;
          color: #667085;
          font-size: 12px;
        }

        .questionActions {
          display: flex;
          justify-content: flex-end;
          gap: 7px;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #f0f1f3;
        }

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: rgba(15,23,42,.55);
        }

        .modal {
          width: min(850px,100%);
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 20px;
          background: #fff;
        }

        .questionModal {
          width: min(980px,100%);
        }

        .modalHeader,
        .modalFooter {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 18px 22px;
          border-bottom: 1px solid #eaecf0;
        }

        .modalFooter {
          justify-content: flex-end;
          border-top: 1px solid #eaecf0;
          border-bottom: 0;
        }

        .modalHeader h2 {
          margin: 5px 0 0;
        }

        .modalBody {
          overflow-y: auto;
          padding: 22px;
        }

        .closeBtn {
          width: 38px;
          height: 38px;
          border: 0;
          border-radius: 10px;
          background: #f2f4f7;
          font-size: 24px;
          color: #475467;
        }

        .grid2,
        .grid3 {
          display: grid;
          gap: 12px;
        }

        .grid2 {
          grid-template-columns:
            repeat(2,minmax(0,1fr));
        }

        .grid3 {
          grid-template-columns:
            repeat(3,minmax(0,1fr));
        }

        .field {
          display: grid;
          gap: 6px;
          margin-bottom: 12px;
        }

        .field span {
          color: #475467;
          font-size: 12px;
          font-weight: 800;
        }

        .check,
        .checkGroup {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .checkGroup {
          align-items: flex-start;
          flex-direction: column;
          justify-content: center;
        }

        .empty {
          padding: 34px;
          text-align: center;
          color: #667085;
        }

        .errorBox {
          margin-top: 18px;
          padding: 12px 14px;
          border: 1px solid #fecdca;
          border-radius: 10px;
          background: #fef3f2;
          color: #b42318;
        }

        @media (max-width: 1150px) {
          .kpiGrid {
            grid-template-columns:
              repeat(3,1fr);
          }

          .layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .page {
            padding: 14px;
          }

          .hero {
            flex-direction: column;
          }

          .toolbar,
          .grid2,
          .grid3,
          .detailGrid {
            grid-template-columns: 1fr;
          }

          .kpiGrid {
            grid-template-columns:
              repeat(2,1fr);
          }

          .questionTop {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}

function Kpi({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <article className="kpi">
      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <style jsx>{`
        .kpi {
          padding: 16px;
          min-height: 90px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
        }

        .kpi span {
          display: block;
          color: #667085;
          font-size: 12px;
          font-weight: 700;
        }

        .kpi strong {
          display: block;
          margin-top: 8px;
          color: #531823;
          font-size: 28px;
        }
      `}</style>
    </article>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="detail">
      <span>
        {label}
      </span>

      <p>
        {value || "-"}
      </p>

      <style jsx>{`
        .detail {
          padding: 9px;
          border-radius: 9px;
          background: #f8fafc;
        }

        .detail span {
          display: block;
          color: #98a2b3;
          font-size: 10px;
          font-weight: 850;
        }

        .detail p {
          margin: 4px 0 0;
          color: #344054;
          font-size: 12px;
          line-height: 1.4;
        }
      `}</style>
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
  onChange:
    (
      value: string
    ) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <input
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
      />
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
  onChange:
    (
      value: string
    ) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <textarea
        rows={
          4
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
      />
    </label>
  );
}