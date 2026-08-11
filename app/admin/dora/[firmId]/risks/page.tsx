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

/* =========================================================
TYPES
========================================================= */

type DoraRisk = {
  id: string;
  firm_id: string;

  title?: string | null;
  activity?: string | null;
  department?: string | null;
  location?: string | null;

  hazard: string;
  risk_source?: string | null;
  risk_description?: string | null;
  consequence?: string | null;
  affected_persons?: string | null;

  existing_controls?: string | null;
  legal_basis?: string | null;

  fk_probability: number;
  fk_frequency: number;
  fk_severity: number;
  fk_score: number;
  fk_level: string;

  corrective_action?: string | null;
  responsible_person?: string | null;
  due_date_millis?: number | null;

  action_status?: string | null;
  action_completed_at_millis?: number | null;
  action_closed_by?: string | null;

  residual_probability?: number | null;
  residual_frequency?: number | null;
  residual_severity?: number | null;
  residual_score?: number | null;
  residual_level?: string | null;

  status?: string | null;
  note?: string | null;

  created_at_millis?: number | null;
  updated_at_millis?: number | null;
};

type RiskForm = {
  id: string;

  title: string;
  activity: string;
  department: string;
  location: string;

  hazard: string;
  riskSource: string;
  riskDescription: string;
  consequence: string;
  affectedPersons: string;

  existingControls: string;
  legalBasis: string;

  fkProbability: number;
  fkFrequency: number;
  fkSeverity: number;

  correctiveAction: string;
  responsiblePerson: string;
  dueDate: string;
  actionStatus: string;

  residualProbability: string;
  residualFrequency: string;
  residualSeverity: string;

  note: string;
};

type DoraRiskDof = {
  id: string;
  firm_id: string;
  risk_id: string;
  title: string;
  finding?: string | null;
  root_cause?: string | null;
  corrective_action?: string | null;
  preventive_action?: string | null;
  responsible_person?: string | null;
  opened_by?: string | null;
  opened_at_millis?: number | null;
  target_date_millis?: number | null;
  status: string;
  closure_note?: string | null;
  closed_by?: string | null;
  closed_at_millis?: number | null;
  effectiveness_status?: string | null;
  effectiveness_note?: string | null;
  verified_by?: string | null;
  verified_at_millis?: number | null;
  note?: string | null;
  created_at_millis?: number | null;
  updated_at_millis?: number | null;
};

type DofForm = {
  id: string;
  riskId: string;
  title: string;
  finding: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  responsiblePerson: string;
  openedBy: string;
  targetDate: string;
  status: string;
  closureNote: string;
  closedBy: string;
  effectivenessStatus: string;
  effectivenessNote: string;
  verifiedBy: string;
  note: string;
};

/* =========================================================
FINE KINNEY OPTIONS
========================================================= */

const probabilityOptions = [
  {
    value: 0.1,
    label: "0,1 — Pratik olarak imkânsız",
  },
  {
    value: 0.2,
    label: "0,2 — İmkânsız",
  },
  {
    value: 0.5,
    label: "0,5 — Çok düşük ihtimal",
  },
  {
    value: 1,
    label: "1 — Düşük ihtimal",
  },
  {
    value: 3,
    label: "3 — Olası",
  },
  {
    value: 6,
    label: "6 — Yüksek ihtimal",
  },
  {
    value: 10,
    label: "10 — Beklenir / kesin",
  },
];

const frequencyOptions = [
  {
    value: 0.5,
    label: "0,5 — Çok seyrek",
  },
  {
    value: 1,
    label: "1 — Seyrek",
  },
  {
    value: 2,
    label: "2 — Bazen",
  },
  {
    value: 3,
    label: "3 — Ara sıra",
  },
  {
    value: 6,
    label: "6 — Sık",
  },
  {
    value: 10,
    label: "10 — Sürekli",
  },
];

const severityOptions = [
  {
    value: 1,
    label: "1 — Hafif",
  },
  {
    value: 3,
    label: "3 — Küçük zarar",
  },
  {
    value: 7,
    label: "7 — Önemli zarar",
  },
  {
    value: 15,
    label: "15 — Ciddi",
  },
  {
    value: 40,
    label: "40 — Çok ciddi / ölüm",
  },
  {
    value: 100,
    label: "100 — Felaket",
  },
];

/* =========================================================
HELPERS
========================================================= */

function emptyForm(): RiskForm {
  return {
    id: "",

    title: "",
    activity: "",
    department: "",
    location: "",

    hazard: "",
    riskSource: "",
    riskDescription: "",
    consequence: "",
    affectedPersons: "",

    existingControls: "",
    legalBasis: "",

    fkProbability: 1,
    fkFrequency: 1,
    fkSeverity: 1,

    correctiveAction: "",
    responsiblePerson: "",
    dueDate: "",
    actionStatus: "ACIK",

    residualProbability: "",
    residualFrequency: "",
    residualSeverity: "",

    note: "",
  };
}

function emptyDofForm(): DofForm {
  return {
    id: "",
    riskId: "",
    title: "",
    finding: "",
    rootCause: "",
    correctiveAction: "",
    preventiveAction: "",
    responsiblePerson: "",
    openedBy: "",
    targetDate: "",
    status: "ACIK",
    closureNote: "",
    closedBy: "",
    effectivenessStatus: "BEKLIYOR",
    effectivenessNote: "",
    verifiedBy: "",
    note: "",
  };
}

function dofStatusLabel(value?: string | null): string {
  switch (value) {
    case "ACIK":
      return "Açık";
    case "DEVAM_EDIYOR":
      return "Devam Ediyor";
    case "KAPALI":
      return "Kapalı";
    case "IPTAL":
      return "İptal";
    default:
      return value || "-";
  }
}

function effectivenessLabel(value?: string | null): string {
  switch (value) {
    case "BEKLIYOR":
      return "Bekliyor";
    case "ETKILI":
      return "Etkili";
    case "ETKISIZ":
      return "Etkisiz";
    default:
      return value || "-";
  }
}

function isDofOverdue(dof: DoraRiskDof): boolean {
  return Boolean(
    dof.target_date_millis &&
      dof.status !== "KAPALI" &&
      dof.status !== "IPTAL" &&
      Number(dof.target_date_millis) < Date.now()
  );
}

function levelFromScore(
  score: number
): string {
  if (score < 20) {
    return "KABUL_EDILEBILIR";
  }

  if (score < 70) {
    return "KESIN_RISK";
  }

  if (score < 200) {
    return "ONEMLI_RISK";
  }

  if (score < 400) {
    return "YUKSEK_RISK";
  }

  return "COK_YUKSEK_RISK";
}

function levelLabel(
  level?: string | null
): string {
  switch (level) {
    case "KABUL_EDILEBILIR":
      return "Kabul Edilebilir";

    case "KESIN_RISK":
      return "Kesin Risk";

    case "ONEMLI_RISK":
      return "Önemli Risk";

    case "YUKSEK_RISK":
      return "Yüksek Risk";

    case "COK_YUKSEK_RISK":
      return "Çok Yüksek Risk";

    default:
      return "-";
  }
}

function levelClass(
  level?: string | null
): string {
  switch (level) {
    case "KABUL_EDILEBILIR":
      return "levelGreen";

    case "KESIN_RISK":
      return "levelBlue";

    case "ONEMLI_RISK":
      return "levelAmber";

    case "YUKSEK_RISK":
      return "levelOrange";

    case "COK_YUKSEK_RISK":
      return "levelRed";

    default:
      return "levelGray";
  }
}

function dateInputFromMillis(
  millis?: number | null
): string {
  if (!millis) {
    return "";
  }

  const date =
    new Date(millis);

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
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function millisFromDateInput(
  value: string
): number | null {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      `${value}T12:00:00`
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date.getTime();
}

function formatDate(
  millis?: number | null
): string {
  if (!millis) {
    return "-";
  }

  const date =
    new Date(millis);

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

/* =========================================================
PAGE
========================================================= */

export default function DoraRisksPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const firmId =
    String(
      params.firmId ?? ""
    );

  const [risks, setRisks] =
    useState<DoraRisk[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [levelFilter, setLevelFilter] =
    useState("ALL");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [form, setForm] =
    useState<RiskForm>(
      emptyForm()
    );

  const [activeTab, setActiveTab] =
    useState<"RISKS" | "DOFS">("RISKS");

  const [dofs, setDofs] =
    useState<DoraRiskDof[]>([]);

  const [dofLoading, setDofLoading] =
    useState(true);

  const [dofModalOpen, setDofModalOpen] =
    useState(false);

  const [dofSaving, setDofSaving] =
    useState(false);

  const [dofForm, setDofForm] =
    useState<DofForm>(
      emptyDofForm()
    );

  const [dofSearch, setDofSearch] =
    useState("");

  const [dofStatusFilter, setDofStatusFilter] =
    useState("ALL");

  const [bulkUploading, setBulkUploading] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  /* =======================================================
  LOAD
  ======================================================= */

  const loadRisks =
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
              `/api/dora/risks?firmId=${encodeURIComponent(
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
                "Risk kayıtları alınamadı."
            );
          }

          setRisks(
            Array.isArray(
              data.risks
            )
              ? data.risks
              : []
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Risk kayıtları alınamadı."
          );
        } finally {
          setLoading(false);
        }
      },
      [firmId]
    );

  useEffect(() => {
    void loadRisks();
  }, [loadRisks]);

  const loadDofs =
    useCallback(
      async () => {
        if (!firmId) {
          return;
        }

        try {
          setDofLoading(true);

          const response =
            await fetch(
              `/api/dora/risk-dofs?firmId=${encodeURIComponent(
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
                "DÖF kayıtları alınamadı."
            );
          }

          setDofs(
            Array.isArray(data.dofs)
              ? data.dofs
              : []
          );
        } catch (err) {
          console.error(
            "DORA DÖF LOAD ERROR:",
            err
          );
        } finally {
          setDofLoading(false);
        }
      },
      [firmId]
    );

  useEffect(() => {
    void loadDofs();
  }, [loadDofs]);

  /* =======================================================
  KPI
  ======================================================= */

  const stats =
    useMemo(() => {
      const count = (
        level: string
      ) =>
        risks.filter(
          (risk) =>
            risk.fk_level ===
            level
        ).length;

      return {
        total:
          risks.length,

        acceptable:
          count(
            "KABUL_EDILEBILIR"
          ),

        definite:
          count(
            "KESIN_RISK"
          ),

        important:
          count(
            "ONEMLI_RISK"
          ),

        high:
          count(
            "YUKSEK_RISK"
          ),

        veryHigh:
          count(
            "COK_YUKSEK_RISK"
          ),
      };
    }, [risks]);

  const riskMap =
    useMemo(
      () =>
        new Map(
          risks.map((risk) => [
            risk.id,
            risk,
          ])
        ),
      [risks]
    );

  const dofStats =
    useMemo(() => {
      return {
        total: dofs.length,
        open: dofs.filter(
          (dof) =>
            dof.status === "ACIK"
        ).length,
        progress: dofs.filter(
          (dof) =>
            dof.status === "DEVAM_EDIYOR"
        ).length,
        overdue: dofs.filter(
          isDofOverdue
        ).length,
        closed: dofs.filter(
          (dof) =>
            dof.status === "KAPALI"
        ).length,
        ineffective: dofs.filter(
          (dof) =>
            dof.effectiveness_status === "ETKISIZ"
        ).length,
      };
    }, [dofs]);

  const filteredDofs =
    useMemo(() => {
      const q =
        dofSearch
          .trim()
          .toLocaleLowerCase("tr-TR");

      return dofs.filter((dof) => {
        if (
          dofStatusFilter !== "ALL" &&
          dof.status !== dofStatusFilter
        ) {
          return false;
        }

        if (!q) {
          return true;
        }

        const risk =
          riskMap.get(dof.risk_id);

        const haystack = [
          dof.title,
          dof.finding,
          dof.root_cause,
          dof.corrective_action,
          dof.preventive_action,
          dof.responsible_person,
          risk?.hazard,
          risk?.department,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr-TR");

        return haystack.includes(q);
      });
    }, [
      dofs,
      dofSearch,
      dofStatusFilter,
      riskMap,
    ]);

  /* =======================================================
  FILTER
  ======================================================= */

  const filteredRisks =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      return risks.filter(
        (risk) => {
          if (
            levelFilter !==
              "ALL" &&
            risk.fk_level !==
              levelFilter
          ) {
            return false;
          }

          if (
            statusFilter !==
              "ALL" &&
            (
              risk.action_status ||
              "ACIK"
            ) !== statusFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const haystack = [
            risk.title,
            risk.activity,
            risk.department,
            risk.location,
            risk.hazard,
            risk.risk_description,
            risk.consequence,
            risk.responsible_person,
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase(
              "tr-TR"
            );

          return haystack.includes(
            query
          );
        }
      );
    }, [
      risks,
      search,
      levelFilter,
      statusFilter,
    ]);

  /* =======================================================
  LIVE CALCULATION
  ======================================================= */

  const currentScore =
    form.fkProbability *
    form.fkFrequency *
    form.fkSeverity;

  const currentLevel =
    levelFromScore(
      currentScore
    );

  const hasResidual =
    form.residualProbability !==
      "" &&
    form.residualFrequency !==
      "" &&
    form.residualSeverity !==
      "";

  const residualScore =
    hasResidual
      ? Number(
          form.residualProbability
        ) *
        Number(
          form.residualFrequency
        ) *
        Number(
          form.residualSeverity
        )
      : null;

  const residualLevel =
    residualScore !== null
      ? levelFromScore(
          residualScore
        )
      : "";

  /* =======================================================
  NEW / EDIT
  ======================================================= */

  function openNew() {
    setForm(
      emptyForm()
    );

    setModalOpen(
      true
    );
  }

  function openEdit(
    risk: DoraRisk
  ) {
    setForm({
      id:
        risk.id,

      title:
        risk.title || "",

      activity:
        risk.activity || "",

      department:
        risk.department || "",

      location:
        risk.location || "",

      hazard:
        risk.hazard || "",

      riskSource:
        risk.risk_source ||
        "",

      riskDescription:
        risk.risk_description ||
        "",

      consequence:
        risk.consequence ||
        "",

      affectedPersons:
        risk.affected_persons ||
        "",

      existingControls:
        risk.existing_controls ||
        "",

      legalBasis:
        risk.legal_basis ||
        "",

      fkProbability:
        Number(
          risk.fk_probability ||
            1
        ),

      fkFrequency:
        Number(
          risk.fk_frequency ||
            1
        ),

      fkSeverity:
        Number(
          risk.fk_severity ||
            1
        ),

      correctiveAction:
        risk.corrective_action ||
        "",

      responsiblePerson:
        risk.responsible_person ||
        "",

      dueDate:
        dateInputFromMillis(
          risk.due_date_millis
        ),

      actionStatus:
        risk.action_status ||
        "ACIK",

      residualProbability:
        risk.residual_probability ==
        null
          ? ""
          : String(
              risk.residual_probability
            ),

      residualFrequency:
        risk.residual_frequency ==
        null
          ? ""
          : String(
              risk.residual_frequency
            ),

      residualSeverity:
        risk.residual_severity ==
        null
          ? ""
          : String(
              risk.residual_severity
            ),

      note:
        risk.note || "",
    });

    setModalOpen(
      true
    );
  }

  /* =======================================================
  SAVE
  ======================================================= */

  async function saveRisk() {
    if (
      !form.hazard.trim()
    ) {
      alert(
        "Tehlike alanını gir."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        id:
          form.id ||
          undefined,

        firmId,

        title:
          form.title,

        activity:
          form.activity,

        department:
          form.department,

        location:
          form.location,

        hazard:
          form.hazard,

        riskSource:
          form.riskSource,

        riskDescription:
          form.riskDescription,

        consequence:
          form.consequence,

        affectedPersons:
          form.affectedPersons,

        existingControls:
          form.existingControls,

        legalBasis:
          form.legalBasis,

        fkProbability:
          form.fkProbability,

        fkFrequency:
          form.fkFrequency,

        fkSeverity:
          form.fkSeverity,

        correctiveAction:
          form.correctiveAction,

        responsiblePerson:
          form.responsiblePerson,

        dueDateMillis:
          millisFromDateInput(
            form.dueDate
          ),

        actionStatus:
          form.actionStatus,

        residualProbability:
          form.residualProbability ===
          ""
            ? null
            : Number(
                form.residualProbability
              ),

        residualFrequency:
          form.residualFrequency ===
          ""
            ? null
            : Number(
                form.residualFrequency
              ),

        residualSeverity:
          form.residualSeverity ===
          ""
            ? null
            : Number(
                form.residualSeverity
              ),

        note:
          form.note,
      };

      const response =
        await fetch(
          "/api/dora/risks",
          {
            method:
              form.id
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
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
            "Risk kaydedilemedi."
        );
      }

      setModalOpen(
        false
      );

      setForm(
        emptyForm()
      );

      await loadRisks();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Risk kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
  DELETE
  ======================================================= */

  async function deleteRisk(
    risk: DoraRisk
  ) {
    const confirmed =
      window.confirm(
        `"${risk.hazard}" risk kaydı silinsin mi?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          "/api/dora/risks",
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
                  risk.id,

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
            "Risk silinemedi."
        );
      }

      await loadRisks();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Risk silinemedi."
      );
    }
  }

  /* =======================================================
  EXCEL / PDF
  ======================================================= */

  function downloadExcelTemplate() {
    window.location.href =
      "/templates/DORA_Fine_Kinney_Toplu_Aktarim_Sablonu.xlsx";
  }

  function openBulkPicker() {
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
      setBulkUploading(true);

      const formData =
        new FormData();

      formData.append(
        "firmId",
        firmId
      );

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/dora/risks/bulk",
          {
            method: "POST",
            body: formData,
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
          data.inserted ?? 0
        }\nAtlanan: ${
          data.skipped ?? 0
        }`
      );

      await loadRisks();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Excel aktarımı yapılamadı."
      );
    } finally {
      setBulkUploading(false);

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    }
  }

  function downloadPdfReport() {
    window.open(
      `/api/dora/risks/pdf?firmId=${encodeURIComponent(
        firmId
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* =======================================================
  DÖF
  ======================================================= */

  function openNewDof(
    risk?: DoraRisk
  ) {
    setDofForm({
      ...emptyDofForm(),
      riskId:
        risk?.id || "",
      title:
        risk
          ? `${risk.hazard} - DÖF`
          : "",
      finding:
        risk?.risk_description ||
        risk?.hazard ||
        "",
      correctiveAction:
        risk?.corrective_action ||
        "",
      responsiblePerson:
        risk?.responsible_person ||
        "",
      targetDate:
        dateInputFromMillis(
          risk?.due_date_millis
        ),
    });

    setDofModalOpen(true);
  }

  function openEditDof(
    dof: DoraRiskDof
  ) {
    setDofForm({
      id: dof.id,
      riskId: dof.risk_id,
      title: dof.title || "",
      finding: dof.finding || "",
      rootCause: dof.root_cause || "",
      correctiveAction:
        dof.corrective_action || "",
      preventiveAction:
        dof.preventive_action || "",
      responsiblePerson:
        dof.responsible_person || "",
      openedBy:
        dof.opened_by || "",
      targetDate:
        dateInputFromMillis(
          dof.target_date_millis
        ),
      status:
        dof.status || "ACIK",
      closureNote:
        dof.closure_note || "",
      closedBy:
        dof.closed_by || "",
      effectivenessStatus:
        dof.effectiveness_status ||
        "BEKLIYOR",
      effectivenessNote:
        dof.effectiveness_note || "",
      verifiedBy:
        dof.verified_by || "",
      note:
        dof.note || "",
    });

    setDofModalOpen(true);
  }

  async function saveDof() {
    if (!dofForm.riskId) {
      alert(
        "DÖF için bağlı risk seçilmelidir."
      );
      return;
    }

    if (!dofForm.title.trim()) {
      alert(
        "DÖF başlığı zorunludur."
      );
      return;
    }

    try {
      setDofSaving(true);

      const response =
        await fetch(
          "/api/dora/risk-dofs",
          {
            method:
              dofForm.id
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  dofForm.id ||
                  undefined,
                firmId,
                riskId:
                  dofForm.riskId,
                title:
                  dofForm.title,
                finding:
                  dofForm.finding,
                rootCause:
                  dofForm.rootCause,
                correctiveAction:
                  dofForm.correctiveAction,
                preventiveAction:
                  dofForm.preventiveAction,
                responsiblePerson:
                  dofForm.responsiblePerson,
                openedBy:
                  dofForm.openedBy,
                targetDateMillis:
                  millisFromDateInput(
                    dofForm.targetDate
                  ),
                status:
                  dofForm.status,
                closureNote:
                  dofForm.closureNote,
                closedBy:
                  dofForm.closedBy,
                effectivenessStatus:
                  dofForm.effectivenessStatus,
                effectivenessNote:
                  dofForm.effectivenessNote,
                verifiedBy:
                  dofForm.verifiedBy,
                verifiedAtMillis:
                  dofForm.effectivenessStatus !==
                  "BEKLIYOR"
                    ? Date.now()
                    : null,
                note:
                  dofForm.note,
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
            "DÖF kaydedilemedi."
        );
      }

      setDofModalOpen(false);
      setDofForm(
        emptyDofForm()
      );

      await loadDofs();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "DÖF kaydedilemedi."
      );
    } finally {
      setDofSaving(false);
    }
  }

  async function deleteDof(
    dof: DoraRiskDof
  ) {
    const ok =
      window.confirm(
        `"${dof.title}" DÖF kaydı silinsin mi?`
      );

    if (!ok) {
      return;
    }

    try {
      const response =
        await fetch(
          "/api/dora/risk-dofs",
          {
            method: "DELETE",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                id: dof.id,
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
            "DÖF silinemedi."
        );
      }

      await loadDofs();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "DÖF silinemedi."
      );
    }
  }

  /* =======================================================
  RENDER
  ======================================================= */

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
            DORA • BAĞIMSIZ RİSK MERKEZİ
          </div>

          <h1>
            Fine Kinney Risk Merkezi
          </h1>

          <p>
            Tehlikeleri değerlendir,
            Fine Kinney skorunu
            hesapla, aksiyonları ve
            kalan riski tek ekrandan
            yönet.
          </p>
        </div>

        <div className="heroActions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={(event) =>
              void handleBulkFile(event)
            }
          />

          <button
            className="outlineBtn"
            onClick={downloadExcelTemplate}
          >
            Excel Şablonu
          </button>

          <button
            className="outlineBtn"
            disabled={bulkUploading}
            onClick={openBulkPicker}
          >
            {bulkUploading
              ? "Aktarılıyor..."
              : "Excel'den Toplu Aktar"}
          </button>

          <button
            className="outlineBtn"
            onClick={downloadPdfReport}
          >
            PDF Rapor
          </button>

          <button
            className="refreshBtn"
            onClick={() => {
              void loadRisks();
              void loadDofs();
            }}
          >
            Yenile
          </button>

          <button
            className="primaryBtn"
            onClick={openNew}
          >
            + Yeni Risk
          </button>
        </div>
      </section>

      <section className="tabs">
        <button
          className={
            activeTab === "RISKS"
              ? "tab activeTab"
              : "tab"
          }
          onClick={() =>
            setActiveTab("RISKS")
          }
        >
          Riskler
          <span>{risks.length}</span>
        </button>

        <button
          className={
            activeTab === "DOFS"
              ? "tab activeTab"
              : "tab"
          }
          onClick={() =>
            setActiveTab("DOFS")
          }
        >
          DÖF Takibi
          <span>{dofs.length}</span>
        </button>
      </section>

      {activeTab === "RISKS" ? (
      <section className="kpiGrid">
        <Kpi
          title="Toplam Risk"
          value={stats.total}
          tone="neutral"
        />

        <Kpi
          title="Kabul Edilebilir"
          value={
            stats.acceptable
          }
          tone="green"
        />

        <Kpi
          title="Kesin Risk"
          value={
            stats.definite
          }
          tone="blue"
        />

        <Kpi
          title="Önemli Risk"
          value={
            stats.important
          }
          tone="amber"
        />

        <Kpi
          title="Yüksek Risk"
          value={stats.high}
          tone="orange"
        />

        <Kpi
          title="Çok Yüksek"
          value={
            stats.veryHigh
          }
          tone="red"
        />
      </section>
      ) : (
        <section className="kpiGrid">
          <Kpi
            title="Toplam DÖF"
            value={dofStats.total}
            tone="neutral"
          />

          <Kpi
            title="Açık"
            value={dofStats.open}
            tone="blue"
          />

          <Kpi
            title="Devam Ediyor"
            value={dofStats.progress}
            tone="amber"
          />

          <Kpi
            title="Geciken"
            value={dofStats.overdue}
            tone="red"
          />

          <Kpi
            title="Kapalı"
            value={dofStats.closed}
            tone="green"
          />

          <Kpi
            title="Etkisiz"
            value={dofStats.ineffective}
            tone="orange"
          />
        </section>
      )}

      {activeTab === "RISKS" ? (
      <section className="toolbar">
        <input
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Tehlike, faaliyet, bölüm, lokasyon veya sorumlu ara..."
        />

        <select
          value={levelFilter}
          onChange={(event) =>
            setLevelFilter(
              event.target.value
            )
          }
        >
          <option value="ALL">
            Tüm Risk Seviyeleri
          </option>

          <option value="KABUL_EDILEBILIR">
            Kabul Edilebilir
          </option>

          <option value="KESIN_RISK">
            Kesin Risk
          </option>

          <option value="ONEMLI_RISK">
            Önemli Risk
          </option>

          <option value="YUKSEK_RISK">
            Yüksek Risk
          </option>

          <option value="COK_YUKSEK_RISK">
            Çok Yüksek Risk
          </option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="ALL">
            Tüm Aksiyonlar
          </option>

          <option value="ACIK">
            Açık
          </option>

          <option value="DEVAM_EDIYOR">
            Devam Ediyor
          </option>

          <option value="TAMAMLANDI">
            Tamamlandı
          </option>
        </select>
      </section>
      ) : (
        <section className="toolbar dofToolbar">
          <input
            value={dofSearch}
            onChange={(event) =>
              setDofSearch(
                event.target.value
              )
            }
            placeholder="DÖF, risk, sorumlu veya bulgu ara..."
          />

          <select
            value={dofStatusFilter}
            onChange={(event) =>
              setDofStatusFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              Tüm DÖF Durumları
            </option>

            <option value="ACIK">
              Açık
            </option>

            <option value="DEVAM_EDIYOR">
              Devam Ediyor
            </option>

            <option value="KAPALI">
              Kapalı
            </option>

            <option value="IPTAL">
              İptal
            </option>
          </select>

          <button
            className="primaryBtn"
            onClick={() =>
              openNewDof()
            }
          >
            + Yeni DÖF
          </button>
        </section>
      )}

      {error && (
        <div className="errorBox">
          {error}
        </div>
      )}

      {activeTab === "RISKS" && (
      <section className="panel">
        <div className="panelHeader">
          <div>
            <div className="eyebrow">
              RİSK ENVANTERİ
            </div>

            <h2>
              Fine Kinney
              Değerlendirmeleri
            </h2>
          </div>

          <strong>
            {
              filteredRisks.length
            }{" "}
            kayıt
          </strong>
        </div>

        {loading ? (
          <div className="empty">
            Risk kayıtları
            yükleniyor...
          </div>
        ) : filteredRisks.length ===
          0 ? (
          <div className="empty">
            Henüz uygun risk
            kaydı bulunmuyor.
          </div>
        ) : (
          <div className="riskList">
            {filteredRisks.map(
              (risk) => (
                <article
                  className="riskCard"
                  key={risk.id}
                >
                  <div className="riskMain">
                    <div className="riskTop">
                      <div>
                        <div className="riskMeta">
                          {risk.department ||
                            "Bölüm belirtilmedi"}

                          {risk.location
                            ? ` • ${risk.location}`
                            : ""}
                        </div>

                        <h3>
                          {
                            risk.hazard
                          }
                        </h3>

                        {risk.risk_description && (
                          <p>
                            {
                              risk.risk_description
                            }
                          </p>
                        )}
                      </div>

                      <div className="scoreArea">
                        <div className="score">
                          {Number(
                            risk.fk_score
                          ).toLocaleString(
                            "tr-TR"
                          )}
                        </div>

                        <span
                          className={`level ${levelClass(
                            risk.fk_level
                          )}`}
                        >
                          {levelLabel(
                            risk.fk_level
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="factors">
                      <span>
                        Olasılık{" "}
                        <b>
                          {
                            risk.fk_probability
                          }
                        </b>
                      </span>

                      <span>
                        Frekans{" "}
                        <b>
                          {
                            risk.fk_frequency
                          }
                        </b>
                      </span>

                      <span>
                        Şiddet{" "}
                        <b>
                          {
                            risk.fk_severity
                          }
                        </b>
                      </span>
                    </div>

                    <div className="detailGrid">
                      <Detail
                        label="Faaliyet"
                        value={
                          risk.activity
                        }
                      />

                      <Detail
                        label="Sonuç"
                        value={
                          risk.consequence
                        }
                      />

                      <Detail
                        label="Mevcut Önlem"
                        value={
                          risk.existing_controls
                        }
                      />

                      <Detail
                        label="Düzeltici Faaliyet"
                        value={
                          risk.corrective_action
                        }
                      />

                      <Detail
                        label="Sorumlu"
                        value={
                          risk.responsible_person
                        }
                      />

                      <Detail
                        label="Termin"
                        value={formatDate(
                          risk.due_date_millis
                        )}
                      />
                    </div>

                    {risk.residual_score !=
                      null && (
                      <div className="residual">
                        <span>
                          Önlem Sonrası
                          Kalan Risk
                        </span>

                        <strong>
                          {Number(
                            risk.residual_score
                          ).toLocaleString(
                            "tr-TR"
                          )}
                        </strong>

                        <span
                          className={`level ${levelClass(
                            risk.residual_level
                          )}`}
                        >
                          {levelLabel(
                            risk.residual_level
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="cardActions">
                    <span className="statusBadge">
                      {(
                        risk.action_status ||
                        "ACIK"
                      ).replaceAll(
                        "_",
                        " "
                      )}
                    </span>

                    <button
                      className="dofBtn"
                      onClick={() =>
                        openNewDof(
                          risk
                        )
                      }
                    >
                      + DÖF Aç
                    </button>

                    <button
                      className="outlineBtn"
                      onClick={() =>
                        openEdit(
                          risk
                        )
                      }
                    >
                      Düzenle
                    </button>

                    <button
                      className="deleteBtn"
                      onClick={() =>
                        void deleteRisk(
                          risk
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
      )}

      {activeTab === "DOFS" && (
        <section className="panel">
          <div className="panelHeader">
            <div>
              <div className="eyebrow">
                DÖF TAKİP MERKEZİ
              </div>

              <h2>
                Düzeltici / Önleyici Faaliyetler
              </h2>
            </div>

            <strong>
              {filteredDofs.length} kayıt
            </strong>
          </div>

          {dofLoading ? (
            <div className="empty">
              DÖF kayıtları yükleniyor...
            </div>
          ) : filteredDofs.length === 0 ? (
            <div className="empty">
              Uygun DÖF kaydı bulunmuyor.
            </div>
          ) : (
            <div className="dofList">
              {filteredDofs.map((dof) => {
                const risk =
                  riskMap.get(
                    dof.risk_id
                  );

                const overdue =
                  isDofOverdue(dof);

                return (
                  <article
                    className={`dofCard ${
                      overdue
                        ? "dofOverdue"
                        : ""
                    }`}
                    key={dof.id}
                  >
                    <div className="dofTop">
                      <div>
                        <div className="dofMeta">
                          {risk?.department ||
                            "Bölüm belirtilmedi"}

                          {risk?.hazard
                            ? ` • ${risk.hazard}`
                            : ""}
                        </div>

                        <h3>
                          {dof.title}
                        </h3>

                        {dof.finding && (
                          <p>
                            {dof.finding}
                          </p>
                        )}
                      </div>

                      <div className="dofBadges">
                        {overdue && (
                          <span className="overdueBadge">
                            Geciken
                          </span>
                        )}

                        <span
                          className={`dofStatus dof-${dof.status}`}
                        >
                          {dofStatusLabel(
                            dof.status
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="detailGrid">
                      <Detail
                        label="Kök Neden"
                        value={
                          dof.root_cause
                        }
                      />

                      <Detail
                        label="Düzeltici Faaliyet"
                        value={
                          dof.corrective_action
                        }
                      />

                      <Detail
                        label="Önleyici Faaliyet"
                        value={
                          dof.preventive_action
                        }
                      />

                      <Detail
                        label="Sorumlu"
                        value={
                          dof.responsible_person
                        }
                      />

                      <Detail
                        label="Termin"
                        value={formatDate(
                          dof.target_date_millis
                        )}
                      />

                      <Detail
                        label="Etkinlik"
                        value={effectivenessLabel(
                          dof.effectiveness_status
                        )}
                      />
                    </div>

                    {dof.status ===
                      "KAPALI" && (
                      <div className="closureBox">
                        <strong>
                          Kapanış
                        </strong>

                        <span>
                          {formatDate(
                            dof.closed_at_millis
                          )}
                        </span>

                        <p>
                          {dof.closure_note ||
                            "Kapanış notu girilmemiş."}
                        </p>
                      </div>
                    )}

                    <div className="dofActions">
                      <button
                        className="outlineBtn"
                        onClick={() =>
                          openEditDof(
                            dof
                          )
                        }
                      >
                        Düzenle
                      </button>

                      <button
                        className="deleteBtn"
                        onClick={() =>
                          void deleteDof(
                            dof
                          )
                        }
                      >
                        Sil
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {modalOpen && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setModalOpen(
                false
              );
            }
          }}
        >
          <div className="modal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">
                  DORA • FINE KINNEY
                </div>

                <h2>
                  {form.id
                    ? "Risk Kaydını Düzenle"
                    : "Yeni Risk Değerlendirmesi"}
                </h2>
              </div>

              <button
                className="closeBtn"
                onClick={() =>
                  setModalOpen(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="modalBody">
              <FormSection
                title="1. Tehlike Tanımlama"
              >
                <div className="grid2">
                  <Field
                    label="Risk / Başlık"
                    value={
                      form.title
                    }
                    onChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        title:
                          value,
                      })
                    }
                  />

                  <Field
                    label="Faaliyet"
                    value={
                      form.activity
                    }
                    onChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        activity:
                          value,
                      })
                    }
                  />

                  <Field
                    label="Bölüm"
                    value={
                      form.department
                    }
                    onChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        department:
                          value,
                      })
                    }
                  />

                  <Field
                    label="Lokasyon"
                    value={
                      form.location
                    }
                    onChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        location:
                          value,
                      })
                    }
                  />
                </div>

                <Field
                  label="Tehlike *"
                  value={
                    form.hazard
                  }
                  onChange={(
                    value
                  ) =>
                    setForm({
                      ...form,
                      hazard:
                        value,
                    })
                  }
                />

                <TextArea
                  label="Risk Tanımı"
                  value={
                    form.riskDescription
                  }
                  onChange={(
                    value
                  ) =>
                    setForm({
                      ...form,
                      riskDescription:
                        value,
                    })
                  }
                />

                <div className="grid2">
                  <TextArea
                    label="Olası Sonuç"
                    value={
                      form.consequence
                    }
                    onChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        consequence:
                          value,
                      })
                    }
                  />

                  <TextArea
                    label="Etkilenebilecek Kişiler"
                    value={
                      form.affectedPersons
                    }
                    onChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        affectedPersons:
                          value,
                      })
                    }
                  />
                </div>

                <TextArea
                  label="Mevcut Kontroller / Önlemler"
                  value={
                    form.existingControls
                  }
                  onChange={(
                    value
                  ) =>
                    setForm({
                      ...form,
                      existingControls:
                        value,
                    })
                  }
                />

                <TextArea
                  label="Mevzuat / Dayanak"
                  value={
                    form.legalBasis
                  }
                  onChange={(
                    value
                  ) =>
                    setForm({
                      ...form,
                      legalBasis:
                        value,
                    })
                  }
                />
              </FormSection>

              <FormSection
                title="2. Fine Kinney Değerlendirmesi"
              >
                <div className="grid3">
                  <SelectField
                    label="Olasılık (O)"
                    value={String(
                      form.fkProbability
                    )}
                    options={
                      probabilityOptions
                    }
                    onChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        fkProbability:
                          Number(
                            value
                          ),
                      })
                    }
                  />

                  <SelectField
                    label="Frekans (F)"
                    value={String(
                      form.fkFrequency
                    )}
                    options={
                      frequencyOptions
                    }
                    onChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        fkFrequency:
                          Number(
                            value
                          ),
                      })
                    }
                  />

                  <SelectField
                    label="Şiddet (Ş)"
                    value={String(
                      form.fkSeverity
                    )}
                    options={
                      severityOptions
                    }
                    onChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        fkSeverity:
                          Number(
                            value
                          ),
                      })
                    }
                  />
                </div>

                <div className="liveScore">
                  <div>
                    <span>
                      O × F × Ş
                    </span>

                    <strong>
                      {currentScore.toLocaleString(
                        "tr-TR"
                      )}
                    </strong>
                  </div>

                  <span
                    className={`level ${levelClass(
                      currentLevel
                    )}`}
                  >
                    {levelLabel(
                      currentLevel
                    )}
                  </span>
                </div>
              </FormSection>

              <FormSection
                title="3. Aksiyon Planı"
              >
                <TextArea
                  label="Düzeltici / Önleyici Faaliyet"
                  value={
                    form.correctiveAction
                  }
                  onChange={(
                    value
                  ) =>
                    setForm({
                      ...form,
                      correctiveAction:
                        value,
                    })
                  }
                />

                <div className="grid3">
                  <Field
                    label="Sorumlu"
                    value={
                      form.responsiblePerson
                    }
                    onChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        responsiblePerson:
                          value,
                      })
                    }
                  />

                  <label className="field">
                    <span>
                      Termin Tarihi
                    </span>

                    <input
                      type="date"
                      value={
                        form.dueDate
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,
                          dueDate:
                            event
                              .target
                              .value,
                        })
                      }
                    />
                  </label>

                  <label className="field">
                    <span>
                      Aksiyon Durumu
                    </span>

                    <select
                      value={
                        form.actionStatus
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,
                          actionStatus:
                            event
                              .target
                              .value,
                        })
                      }
                    >
                      <option value="ACIK">
                        Açık
                      </option>

                      <option value="DEVAM_EDIYOR">
                        Devam Ediyor
                      </option>

                      <option value="TAMAMLANDI">
                        Tamamlandı
                      </option>
                    </select>
                  </label>
                </div>
              </FormSection>

              <FormSection
                title="4. Önlem Sonrası Kalan Risk"
              >
                <p className="hint">
                  Aksiyon sonrası
                  değerleri girersen
                  kalan Fine Kinney
                  skoru otomatik
                  hesaplanır.
                </p>

                <div className="grid3">
                  <OptionalSelect
                    label="Yeni Olasılık"
                    value={
                      form.residualProbability
                    }
                    options={
                      probabilityOptions
                    }
                    onChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        residualProbability:
                          value,
                      })
                    }
                  />

                  <OptionalSelect
                    label="Yeni Frekans"
                    value={
                      form.residualFrequency
                    }
                    options={
                      frequencyOptions
                    }
                    onChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        residualFrequency:
                          value,
                      })
                    }
                  />

                  <OptionalSelect
                    label="Yeni Şiddet"
                    value={
                      form.residualSeverity
                    }
                    options={
                      severityOptions
                    }
                    onChange={(
                      value
                    ) =>
                      setForm({
                        ...form,
                        residualSeverity:
                          value,
                      })
                    }
                  />
                </div>

                {residualScore !==
                  null && (
                  <div className="liveScore residualScore">
                    <div>
                      <span>
                        Kalan Risk
                      </span>

                      <strong>
                        {residualScore.toLocaleString(
                          "tr-TR"
                        )}
                      </strong>
                    </div>

                    <span
                      className={`level ${levelClass(
                        residualLevel
                      )}`}
                    >
                      {levelLabel(
                        residualLevel
                      )}
                    </span>
                  </div>
                )}
              </FormSection>

              <FormSection
                title="5. Not"
              >
                <TextArea
                  label="Açıklama / Not"
                  value={
                    form.note
                  }
                  onChange={(
                    value
                  ) =>
                    setForm({
                      ...form,
                      note:
                        value,
                    })
                  }
                />
              </FormSection>
            </div>

            <div className="modalFooter">
              <button
                className="outlineBtn"
                onClick={() =>
                  setModalOpen(
                    false
                  )
                }
              >
                Vazgeç
              </button>

              <button
                className="primaryBtn"
                disabled={saving}
                onClick={() =>
                  void saveRisk()
                }
              >
                {saving
                  ? "Kaydediliyor..."
                  : form.id
                    ? "Değişiklikleri Kaydet"
                    : "Risk Kaydını Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}

      {dofModalOpen && (
        <div
          className="overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setDofModalOpen(false);
            }
          }}
        >
          <div className="modal dofModal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">
                  DORA • BAĞIMSIZ DÖF
                </div>

                <h2>
                  {dofForm.id
                    ? "DÖF Kaydını Düzenle"
                    : "Yeni DÖF Oluştur"}
                </h2>
              </div>

              <button
                className="closeBtn"
                onClick={() =>
                  setDofModalOpen(false)
                }
              >
                ×
              </button>
            </div>

            <div className="modalBody">
              <FormSection title="1. Risk Bağlantısı">
                <label className="field">
                  <span>
                    Bağlı Fine Kinney Riski *
                  </span>

                  <select
                    value={dofForm.riskId}
                    disabled={Boolean(
                      dofForm.id
                    )}
                    onChange={(event) =>
                      setDofForm({
                        ...dofForm,
                        riskId:
                          event.target.value,
                      })
                    }
                  >
                    <option value="">
                      Risk seçiniz
                    </option>

                    {risks.map((risk) => (
                      <option
                        key={risk.id}
                        value={risk.id}
                      >
                        {risk.hazard}
                        {risk.department
                          ? ` - ${risk.department}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <Field
                  label="DÖF Başlığı *"
                  value={dofForm.title}
                  onChange={(value) =>
                    setDofForm({
                      ...dofForm,
                      title: value,
                    })
                  }
                />

                <TextArea
                  label="Bulgu / Uygunsuzluk"
                  value={dofForm.finding}
                  onChange={(value) =>
                    setDofForm({
                      ...dofForm,
                      finding: value,
                    })
                  }
                />

                <TextArea
                  label="Kök Neden"
                  value={dofForm.rootCause}
                  onChange={(value) =>
                    setDofForm({
                      ...dofForm,
                      rootCause: value,
                    })
                  }
                />
              </FormSection>

              <FormSection title="2. Faaliyet Planı">
                <TextArea
                  label="Düzeltici Faaliyet"
                  value={
                    dofForm.correctiveAction
                  }
                  onChange={(value) =>
                    setDofForm({
                      ...dofForm,
                      correctiveAction:
                        value,
                    })
                  }
                />

                <TextArea
                  label="Önleyici Faaliyet"
                  value={
                    dofForm.preventiveAction
                  }
                  onChange={(value) =>
                    setDofForm({
                      ...dofForm,
                      preventiveAction:
                        value,
                    })
                  }
                />

                <div className="grid3">
                  <Field
                    label="Sorumlu"
                    value={
                      dofForm.responsiblePerson
                    }
                    onChange={(value) =>
                      setDofForm({
                        ...dofForm,
                        responsiblePerson:
                          value,
                      })
                    }
                  />

                  <label className="field">
                    <span>
                      Termin Tarihi
                    </span>

                    <input
                      type="date"
                      value={
                        dofForm.targetDate
                      }
                      onChange={(event) =>
                        setDofForm({
                          ...dofForm,
                          targetDate:
                            event.target.value,
                        })
                      }
                    />
                  </label>

                  <label className="field">
                    <span>
                      DÖF Durumu
                    </span>

                    <select
                      value={dofForm.status}
                      onChange={(event) =>
                        setDofForm({
                          ...dofForm,
                          status:
                            event.target.value,
                        })
                      }
                    >
                      <option value="ACIK">
                        Açık
                      </option>

                      <option value="DEVAM_EDIYOR">
                        Devam Ediyor
                      </option>

                      <option value="KAPALI">
                        Kapalı
                      </option>

                      <option value="IPTAL">
                        İptal
                      </option>
                    </select>
                  </label>
                </div>
              </FormSection>

              <FormSection title="3. Kapanış ve Etkinlik">
                <div className="grid2">
                  <Field
                    label="Kapatan"
                    value={dofForm.closedBy}
                    onChange={(value) =>
                      setDofForm({
                        ...dofForm,
                        closedBy: value,
                      })
                    }
                  />

                  <label className="field">
                    <span>
                      Etkinlik Durumu
                    </span>

                    <select
                      value={
                        dofForm.effectivenessStatus
                      }
                      onChange={(event) =>
                        setDofForm({
                          ...dofForm,
                          effectivenessStatus:
                            event.target.value,
                        })
                      }
                    >
                      <option value="BEKLIYOR">
                        Bekliyor
                      </option>

                      <option value="ETKILI">
                        Etkili
                      </option>

                      <option value="ETKISIZ">
                        Etkisiz
                      </option>
                    </select>
                  </label>
                </div>

                <TextArea
                  label="Kapanış Notu"
                  value={
                    dofForm.closureNote
                  }
                  onChange={(value) =>
                    setDofForm({
                      ...dofForm,
                      closureNote: value,
                    })
                  }
                />

                <TextArea
                  label="Etkinlik Değerlendirmesi"
                  value={
                    dofForm.effectivenessNote
                  }
                  onChange={(value) =>
                    setDofForm({
                      ...dofForm,
                      effectivenessNote:
                        value,
                    })
                  }
                />

                <Field
                  label="Etkinlik Kontrolünü Yapan"
                  value={
                    dofForm.verifiedBy
                  }
                  onChange={(value) =>
                    setDofForm({
                      ...dofForm,
                      verifiedBy: value,
                    })
                  }
                />

                <TextArea
                  label="Not"
                  value={dofForm.note}
                  onChange={(value) =>
                    setDofForm({
                      ...dofForm,
                      note: value,
                    })
                  }
                />
              </FormSection>
            </div>

            <div className="modalFooter">
              <button
                className="outlineBtn"
                onClick={() =>
                  setDofModalOpen(false)
                }
              >
                Vazgeç
              </button>

              <button
                className="primaryBtn"
                disabled={dofSaving}
                onClick={() =>
                  void saveDof()
                }
              >
                {dofSaving
                  ? "Kaydediliyor..."
                  : dofForm.id
                    ? "DÖF Değişikliklerini Kaydet"
                    : "DÖF Oluştur"}
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
          background: #ffffff;
          box-shadow: 0 8px 28px rgba(15, 23, 42, 0.05);
        }

        .hero h1 {
          margin: 8px 0 8px;
          font-size: 32px;
          letter-spacing: -0.8px;
        }

        .hero p {
          max-width: 720px;
          margin: 0;
          color: #667085;
          line-height: 1.6;
        }

        .eyebrow {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #7a2633;
        }

        .heroActions {
          display: flex;
          align-items: flex-start;
          gap: 10px;
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

        .backBtn,
        .refreshBtn,
        .outlineBtn,
        .deleteBtn,
        .primaryBtn {
          border-radius: 10px;
          padding: 10px 14px;
          font-weight: 700;
        }

        .backBtn {
          padding-left: 0;
          border: 0;
          background: transparent;
          color: #667085;
        }

        .refreshBtn,
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

        .primaryBtn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .deleteBtn {
          border: 1px solid #fecdca;
          background: #fff5f5;
          color: #b42318;
        }

        .kpiGrid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .toolbar {
          display: grid;
          grid-template-columns: minmax(300px, 1fr) 220px 190px;
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

        .toolbar input:focus,
        .toolbar select:focus,
        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #9b6570;
          box-shadow: 0 0 0 3px rgba(122, 38, 51, 0.08);
        }

        .panel {
          margin-top: 18px;
          padding: 22px;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #fff;
        }

        .panelHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 16px;
        }

        .panelHeader h2 {
          margin: 5px 0 0;
        }

        .panelHeader strong {
          color: #667085;
        }

        .riskList {
          display: grid;
          gap: 12px;
        }

        .riskCard {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 18px;
          padding: 18px;
          border: 1px solid #eaecf0;
          border-radius: 14px;
          background: #fff;
        }

        .riskTop {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .riskMeta {
          font-size: 12px;
          font-weight: 700;
          color: #667085;
        }

        .riskTop h3 {
          margin: 5px 0;
          font-size: 18px;
        }

        .riskTop p {
          margin: 5px 0 0;
          color: #667085;
          line-height: 1.5;
        }

        .scoreArea {
          min-width: 150px;
          text-align: right;
        }

        .score {
          font-size: 30px;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 8px;
        }

        .level {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
        }

        .levelGreen {
          background: #ecfdf3;
          color: #027a48;
        }

        .levelBlue {
          background: #eff8ff;
          color: #175cd3;
        }

        .levelAmber {
          background: #fffaeb;
          color: #b54708;
        }

        .levelOrange {
          background: #fff4ed;
          color: #c4320a;
        }

        .levelRed {
          background: #fef3f2;
          color: #b42318;
        }

        .levelGray {
          background: #f2f4f7;
          color: #475467;
        }

        .factors {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .factors span {
          padding: 6px 9px;
          border-radius: 8px;
          background: #f2f4f7;
          color: #475467;
          font-size: 12px;
        }

        .detailGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }

        .residual {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 14px;
          padding: 10px 12px;
          border-radius: 10px;
          background: #f8fafc;
          color: #475467;
        }

        .residual strong {
          font-size: 18px;
          color: #172033;
        }

        .cardActions {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: flex-start;
          gap: 8px;
          min-width: 120px;
        }

        .statusBadge {
          text-align: center;
          padding: 7px 9px;
          border-radius: 8px;
          background: #f2f4f7;
          color: #475467;
          font-size: 11px;
          font-weight: 800;
        }

        .empty {
          padding: 42px;
          text-align: center;
          color: #667085;
        }

        .errorBox {
          margin-top: 18px;
          padding: 13px 15px;
          border: 1px solid #fecdca;
          border-radius: 10px;
          background: #fef3f2;
          color: #b42318;
        }

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.52);
        }

        .modal {
          width: min(1050px, 100%);
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.25);
        }

        .modalHeader,
        .modalFooter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 22px;
          border-bottom: 1px solid #eaecf0;
        }

        .modalHeader h2 {
          margin: 5px 0 0;
        }

        .modalFooter {
          justify-content: flex-end;
          border-top: 1px solid #eaecf0;
          border-bottom: 0;
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

        .modalBody {
          overflow-y: auto;
          padding: 22px;
        }

        .formSection {
          margin-bottom: 18px;
          padding: 18px;
          border: 1px solid #eaecf0;
          border-radius: 14px;
          background: #fff;
        }

        .formSection h3 {
          margin: 0 0 14px;
          font-size: 16px;
        }

        .grid2,
        .grid3 {
          display: grid;
          gap: 12px;
          margin-bottom: 12px;
        }

        .grid2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .grid3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .field {
          display: grid;
          gap: 6px;
          margin-bottom: 12px;
        }

        .field span {
          font-size: 12px;
          font-weight: 800;
          color: #475467;
        }

        .field textarea {
          min-height: 92px;
          resize: vertical;
        }

        .liveScore {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-top: 8px;
          padding: 16px;
          border: 1px solid #e4e7ec;
          border-radius: 12px;
          background: #f8fafc;
        }

        .liveScore div {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .liveScore div span {
          color: #667085;
          font-weight: 700;
        }

        .liveScore strong {
          font-size: 28px;
        }

        .residualScore {
          background: #f9fafb;
        }

        .hint {
          margin: -4px 0 14px;
          color: #667085;
          font-size: 13px;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-top: 18px;
          padding: 6px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
        }

        .tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 0;
          border-radius: 10px;
          padding: 10px 15px;
          background: transparent;
          color: #667085;
          font-weight: 800;
        }

        .tab span {
          min-width: 24px;
          padding: 3px 7px;
          border-radius: 999px;
          background: #f2f4f7;
          font-size: 11px;
          text-align: center;
        }

        .activeTab {
          background: #7a2633;
          color: #fff;
        }

        .activeTab span {
          background: rgba(255,255,255,0.18);
          color: #fff;
        }

        .dofBtn {
          border: 1px solid #abefc6;
          border-radius: 10px;
          padding: 10px 14px;
          background: #ecfdf3;
          color: #027a48;
          font-weight: 800;
        }

        .dofToolbar {
          grid-template-columns:
            minmax(300px, 1fr)
            220px
            auto;
        }

        .dofList {
          display: grid;
          gap: 12px;
        }

        .dofCard {
          padding: 18px;
          border: 1px solid #eaecf0;
          border-radius: 14px;
          background: #fff;
        }

        .dofOverdue {
          border-color: #fda29b;
          box-shadow: inset 4px 0 0 #d92d20;
        }

        .dofTop {
          display: flex;
          justify-content: space-between;
          gap: 18px;
        }

        .dofMeta {
          color: #667085;
          font-size: 12px;
          font-weight: 700;
        }

        .dofTop h3 {
          margin: 5px 0;
          font-size: 18px;
        }

        .dofTop p {
          margin: 5px 0 0;
          color: #667085;
          line-height: 1.5;
        }

        .dofBadges {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .dofStatus,
        .overdueBadge {
          display: inline-flex;
          padding: 6px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 850;
        }

        .dof-ACIK {
          background: #eff8ff;
          color: #175cd3;
        }

        .dof-DEVAM_EDIYOR {
          background: #fffaeb;
          color: #b54708;
        }

        .dof-KAPALI {
          background: #ecfdf3;
          color: #027a48;
        }

        .dof-IPTAL {
          background: #f2f4f7;
          color: #667085;
        }

        .overdueBadge {
          background: #fef3f2;
          color: #b42318;
        }

        .closureBox {
          margin-top: 14px;
          padding: 12px;
          border: 1px solid #abefc6;
          border-radius: 10px;
          background: #f6fef9;
          color: #475467;
        }

        .closureBox strong,
        .closureBox span {
          margin-right: 10px;
        }

        .closureBox p {
          margin: 7px 0 0;
        }

        .dofActions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #f0f1f3;
        }

        .heroActions {
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .dofModal {
          width: min(980px, 100%);
        }

        @media (max-width: 1150px) {
          .kpiGrid {
            grid-template-columns: repeat(3, 1fr);
          }

          .detailGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 760px) {
          .page {
            padding: 14px;
          }

          .hero,
          .riskTop {
            flex-direction: column;
          }

          .heroActions {
            width: 100%;
          }

          .toolbar,
          .dofToolbar,
          .grid2,
          .grid3,
          .detailGrid {
            grid-template-columns: 1fr;
          }

          .tabs {
            flex-direction: column;
          }

          .dofTop {
            flex-direction: column;
          }

          .dofBadges {
            justify-content: flex-start;
          }

          .kpiGrid {
            grid-template-columns: repeat(2, 1fr);
          }

          .riskCard {
            grid-template-columns: 1fr;
          }

          .scoreArea {
            text-align: left;
          }

          .cardActions {
            flex-direction: row;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
SMALL COMPONENTS
========================================================= */

function Kpi({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone:
    | "neutral"
    | "green"
    | "blue"
    | "amber"
    | "orange"
    | "red";
}) {
  return (
    <div
      className={`kpi kpi-${tone}`}
    >
      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <style jsx>{`
        .kpi {
          min-height: 92px;
          padding: 16px;
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
          font-size: 28px;
        }

        .kpi-green {
          border-top: 3px solid #12b76a;
        }

        .kpi-blue {
          border-top: 3px solid #2e90fa;
        }

        .kpi-amber {
          border-top: 3px solid #f79009;
        }

        .kpi-orange {
          border-top: 3px solid #f04438;
        }

        .kpi-red {
          border-top: 3px solid #b42318;
        }

        .kpi-neutral {
          border-top: 3px solid #667085;
        }
      `}</style>
    </div>
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
          padding: 10px;
          border-radius: 9px;
          background: #f8fafc;
        }

        .detail span {
          font-size: 11px;
          font-weight: 800;
          color: #667085;
        }

        .detail p {
          margin: 4px 0 0;
          color: #344054;
          font-size: 13px;
          line-height: 1.45;
        }
      `}</style>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children:
    React.ReactNode;
}) {
  return (
    <section className="formSection">
      <h3>
        {title}
      </h3>

      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
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
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
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
  options: {
    value: number;
    label: string;
  }[];
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}
      </select>
    </label>
  );
}

function OptionalSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: {
    value: number;
    label: string;
  }[];
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >
        <option value="">
          Hesaplanmasın
        </option>

        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}
      </select>
    </label>
  );
}