"use client";

import {
  Activity,
  Archive,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CalendarClock,
  ClipboardList,
  Copy,
  Download,
  Edit3,
  FileDown,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  Users,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
  ReactNode,
} from "react";

type Tab =
  | "OVERVIEW"
  | "SURVEYS"
  | "CREATE"
  | "RESPONSES"
  | "ANALYSIS"
  | "FINDINGS"
  | "ACTIONS"
  | "REPORTS";

type Company = {
  id: string;
  name: string;
};

type Survey = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  anonymous: boolean;
  anonymousThreshold: number;
  anonymousUnlocked: boolean;
  remainingForAnalysis: number;
  questionCount: number;
  targetCount: number;
  responseCount: number;
  participationRate: number;
  negativeAnswerCount: number;
  negativeRate: number;
  riskScore: number;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string | null;
};

type ResponseAnswer = {
  id: string;
  questionId: string;
  position: number;
  question: string;
  questionType: string;
  answer: string;
  riskLevel: string;
  riskPoints: number;
  comment?: string;
};

type SurveyResponse = {
  id: string;
  surveyId: string;
  surveyTitle: string;
  anonymous: boolean;
  locked: boolean;
  participantName: string;
  participantEmail: string;
  jobTitle: string;
  submittedAt: string;
  riskScore: number;
  negativeAnswerCount: number;
  flagged: boolean;
  answers: ResponseAnswer[];
};

type SurveyParticipant = {
  id: string;
  surveyId: string;
  surveyTitle: string;
  anonymous: boolean;
  employeeId: string;
  fullName: string;
  email: string;
  jobTitle: string;
  registryNo: string;
  status: string;
  sentAt?: string | null;
  openedAt?: string | null;
  completedAt?: string | null;
  expiresAt?: string | null;
};

type OptionDistribution = {
  optionId: string;
  label: string;
  count: number;
  percentage: number;
  riskLevel: string;
  riskPoints: number;
};

type QuestionAnalysis = {
  questionId: string;
  position: number;
  question: string;
  questionType: string;
  weight: number;
  responseCount: number;
  negativeCount: number;
  negativeRate: number;
  averageRisk: number;
  highestRiskLevel: string;
  optionDistribution: OptionDistribution[];
  textResponses: string[];
};

type SurveyAnalysis = {
  surveyId: string;
  surveyTitle: string;
  anonymous: boolean;
  locked: boolean;
  anonymousThreshold: number;
  responseCount: number;
  remainingForAnalysis: number;
  participationRate: number;
  riskScore: number;
  negativeRate: number;
  questions: QuestionAnalysis[];
};

type Finding = {
  id: string;
  source: string;
  surveyId: string;
  surveyTitle: string;
  questionId?: string | null;
  question: string;
  description: string;
  negativeRate: number;
  responseCount: number;
  severity: string;
  status: string;
  segment: string;
  detectedAt?: string | null;
};

type ActionItem = {
  id: string;
  findingId?: string | null;
  title: string;
  description: string;
  owner: string;
  dueDate: string;
  priority: string;
  status: string;
};

type ReportSummary = {
  surveyCount: number;
  activeSurveyCount: number;
  targetCount: number;
  responseCount: number;
  participationRate: number;
  averageRiskScore: number;
  negativeAnswerCount: number;
  criticalFindingCount: number;
  openActionCount: number;
};

type DashboardResponse = {
  success?: boolean;
  surveys?: Survey[];
  responses?: SurveyResponse[];
  analytics?: SurveyAnalysis[];
  findings?: Finding[];
  actions?: ActionItem[];
  reportSummary?: ReportSummary;
  error?: string;
};

const EMPTY_REPORT: ReportSummary = {
  surveyCount: 0,
  activeSurveyCount: 0,
  targetCount: 0,
  responseCount: 0,
  participationRate: 0,
  averageRiskScore: 0,
  negativeAnswerCount: 0,
  criticalFindingCount: 0,
  openActionCount: 0,
};

const EMPTY_DRAFT = {
  title: "",
  category: "İSG Algı Anketi",
  anonymous: true,
  description: "",
  endDate: "",
};

const TABS: Array<{
  value: Tab;
  label: string;
  icon: ReactNode;
}> = [
  {
    value: "OVERVIEW",
    label: "Genel Bakış",
    icon: <LayoutDashboard size={17} />,
  },
  {
    value: "SURVEYS",
    label: "Anketler",
    icon: <ClipboardList size={17} />,
  },
  {
    value: "CREATE",
    label: "Yeni Anket",
    icon: <Plus size={17} />,
  },
  {
    value: "RESPONSES",
    label: "Yanıtlar",
    icon: <MessageSquareText size={17} />,
  },
  {
    value: "ANALYSIS",
    label: "Analiz",
    icon: <BarChart3 size={17} />,
  },
  {
    value: "FINDINGS",
    label: "Kritik Bulgular",
    icon: <ShieldAlert size={17} />,
  },
  {
    value: "ACTIONS",
    label: "Aksiyonlar",
    icon: <Target size={17} />,
  },
  {
    value: "REPORTS",
    label: "Raporlar",
    icon: <FileDown size={17} />,
  },
];

const CATEGORIES = [
  "İSG Algı Anketi",
  "Güvenlik Kültürü",
  "Psikososyal Risk",
  "Ergonomi",
  "KKD Kullanımı",
  "Acil Durum Farkındalığı",
  "Eğitim Değerlendirme",
  "Ramak Kala / Tehlike Algısı",
  "Özel / Serbest Anket",
];

function percent(value: number) {
  return `%${new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1,
  }).format(Number(value || 0))}`;
}

function number(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function riskColor(value: number) {
  if (value >= 81) return "#991b1b";
  if (value >= 61) return "#dc2626";
  if (value >= 41) return "#ea580c";
  if (value >= 21) return "#ca8a04";
  return "#059669";
}

function severityStyle(value: string) {
  switch (value) {
    case "CRITICAL":
      return {
        color: "#991b1b",
        background: "#fee2e2",
      };

    case "HIGH":
      return {
        color: "#b91c1c",
        background: "#fef2f2",
      };

    case "MEDIUM":
      return {
        color: "#c2410c",
        background: "#fff7ed",
      };

    case "LOW":
      return {
        color: "#a16207",
        background: "#fefce8",
      };

    default:
      return {
        color: "#475569",
        background: "#f1f5f9",
      };
  }
}

function statusLabel(value: string) {
  switch (value) {
    case "ACTIVE":
      return "Aktif";
    case "CLOSED":
      return "Kapandı";
    case "ARCHIVED":
      return "Arşiv";
    default:
      return "Taslak";
  }
}

function participantStatusLabel(value: string) {
  const labels: Record<string, string> = {
    COMPLETED: "Yanıtladı",
    OPENED: "Açtı / Bitirmedi",
    SENT: "Gönderildi / Açmadı",
    EXPIRED: "Süresi Doldu",
    REVOKED: "Bağlantı İptal",
    NOT_SENT: "Gönderilemedi",
  };
  return labels[value] || value;
}

function isExpired(survey: Survey) {
  return survey.status === "ACTIVE" && Boolean(survey.endsAt) &&
    new Date(String(survey.endsAt)).getTime() < Date.now();
}

export default function EmployeeSurveysPage() {
  const [tab, setTab] =
    useState<Tab>("OVERVIEW");

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [companyId, setCompanyId] =
    useState("");

  const [surveys, setSurveys] =
    useState<Survey[]>([]);

  const [responses, setResponses] =
    useState<SurveyResponse[]>([]);

  const [participants, setParticipants] =
    useState<SurveyParticipant[]>([]);

  const [analytics, setAnalytics] =
    useState<SurveyAnalysis[]>([]);

  const [findings, setFindings] =
    useState<Finding[]>([]);

  const [actions, setActions] =
    useState<ActionItem[]>([]);

  const [report, setReport] =
    useState<ReportSummary>(EMPTY_REPORT);

  const [selectedSurveyId, setSelectedSurveyId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [actionBusyId, setActionBusyId] =
    useState("");

  const [error, setError] =
    useState("");

  const [draft, setDraft] =
    useState(EMPTY_DRAFT);

  const request = useCallback(
    async (
      url: string,
      init?: RequestInit
    ) => {
      const response = await fetch(url, {
        cache: "no-store",
        credentials: "include",
        ...init,
      });

      const json = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            json.message ||
            "İşlem tamamlanamadı."
        );
      }

      return json;
    },
    []
  );

  const loadCompanies =
    useCallback(async () => {
      const json = await request(
        "/api/admin/companies"
      );

      const rows = (
        Array.isArray(json.data)
          ? json.data
          : []
      )
        .map(
          (
            item: Record<string, unknown>
          ): Company => ({
            id: String(
              item.id || ""
            ),
            name: String(
              item.name ||
                item.title ||
                item.company_name ||
                ""
            ),
          })
        )
        .filter(
          (item: Company) =>
            item.id && item.name
        );

      setCompanies(rows);

      setCompanyId(
        (current) =>
          current ||
          rows[0]?.id ||
          ""
      );
    }, [request]);

  const loadDashboard =
    useCallback(async () => {
      if (!companyId) return;

      const [json, participantJson]: [DashboardResponse, { participants?: SurveyParticipant[]; comments?: Array<{ answerId: string; comment: string }> }] =
        await Promise.all([request(
          `/api/admin/documentation/employee-surveys/dashboard?firmId=${encodeURIComponent(
            companyId
          )}`
        ), request(`/api/admin/documentation/employee-surveys/participants?firmId=${encodeURIComponent(companyId)}`)]);

      const nextSurveys =
        Array.isArray(json.surveys)
          ? json.surveys
          : [];

      setSurveys(nextSurveys);

      const commentMap = new Map((participantJson.comments || []).map((item) => [item.answerId, item.comment]));
      setResponses((Array.isArray(json.responses) ? json.responses : []).map((response) => ({ ...response, answers: response.answers.map((answer) => ({ ...answer, comment: commentMap.get(answer.id) || "" })) })));

      setParticipants(Array.isArray(participantJson.participants) ? participantJson.participants : []);

      setAnalytics(
        Array.isArray(json.analytics)
          ? json.analytics
          : []
      );

      setFindings(
        Array.isArray(json.findings)
          ? json.findings
          : []
      );

      setActions(
        Array.isArray(json.actions)
          ? json.actions
          : []
      );

      setReport(
        json.reportSummary ||
          EMPTY_REPORT
      );

      setSelectedSurveyId(
        (current) =>
          nextSurveys.some(
            (survey) =>
              survey.id === current
          )
            ? current
            : nextSurveys[0]?.id ||
              ""
      );
    }, [companyId, request]);

  useEffect(() => {
    void loadCompanies()
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error
            ? cause.message
            : "Firmalar alınamadı."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loadCompanies]);

  useEffect(() => {
    if (!companyId) return;

    void loadDashboard().catch(
      (cause: unknown) => {
        setError(
          cause instanceof Error
            ? cause.message
            : "Anket merkezi yüklenemedi."
        );
      }
    );
  }, [companyId, loadDashboard]);

  const refresh = async () => {
    try {
      setRefreshing(true);
      setError("");
      await loadDashboard();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Veriler yenilenemedi."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const selectedSurvey =
    useMemo(
      () =>
        surveys.find(
          (survey) =>
            survey.id ===
            selectedSurveyId
        ) || null,
      [selectedSurveyId, surveys]
    );

  const selectedResponses =
    useMemo(
      () =>
        responses.filter(
          (response) =>
            response.surveyId ===
            selectedSurveyId
        ),
      [responses, selectedSurveyId]
    );

  const selectedAnalysis =
    useMemo(
      () =>
        analytics.find(
          (analysis) =>
            analysis.surveyId ===
            selectedSurveyId
        ) || null,
      [analytics, selectedSurveyId]
    );

  const filteredSurveys =
    useMemo(() => {
      const normalized =
        search
          .trim()
          .toLocaleLowerCase("tr");

      if (!normalized) {
        return surveys;
      }

      return surveys.filter(
        (survey) =>
          `${survey.title} ${survey.category}`
            .toLocaleLowerCase("tr")
            .includes(normalized)
      );
    }, [search, surveys]);

  async function createSurvey(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!companyId) {
      setError(
        "Firma seçimi zorunludur."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const json = await request(
        "/api/admin/documentation/employee-surveys",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            firmId: companyId,
            ...draft,
            title: draft.title.trim(),
          }),
        }
      );

      if (json.survey?.id) {
        window.location.href =
          `/admin/documentation/employee-surveys/${json.survey.id}`;
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Anket oluşturulamadı."
      );
    } finally {
      setSaving(false);
    }
  }

  async function surveyAction(
    survey: Survey,
    action: "EXTEND" | "CLOSE" | "REOPEN" | "ARCHIVE" | "RESTORE" | "DUPLICATE" | "REMIND_NON_RESPONDERS" | "DELETE"
  ) {
    let endsAt: string | undefined;
    if (action === "EXTEND" || action === "REOPEN") {
      const defaultDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16);
      const value = window.prompt("Yeni bitiş tarihini girin (YYYY-AA-GG SS:DD):", defaultDate);
      if (!value) return;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        setError("Yeni bitiş tarihi gelecekte olmalıdır.");
        return;
      }
      endsAt = parsed.toISOString();
    }

    const confirmations: Partial<Record<typeof action, string>> = {
      CLOSE: "Anket kapatılacak ve açık katılım bağlantıları iptal edilecek. Devam edilsin mi?",
      ARCHIVE: "Anket arşive taşınacak. Sonuçlar korunacaktır. Devam edilsin mi?",
      DELETE: "Bu anket güvenli şekilde silinecek. Bu işlem geri alınamaz. Devam edilsin mi?",
      DUPLICATE: "Anket, soruları ve risk ayarlarıyla yeni taslak olarak kopyalansın mı?",
      REMIND_NON_RESPONDERS: "Yanıtlamayanların eski bağlantıları iptal edilip yeni bağlantı e-postası gönderilsin mi?",
    };
    if (confirmations[action] && !window.confirm(confirmations[action])) return;

    try {
      setActionBusyId(survey.id);
      setError("");
      const json = await request(`/api/admin/documentation/employee-surveys/${survey.id}`, {
        method: action === "DELETE" ? "DELETE" : ["DUPLICATE", "REMIND_NON_RESPONDERS"].includes(action) ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: action === "DELETE" ? undefined : JSON.stringify({ action, endsAt }),
      });
      await loadDashboard();
      if (action === "DUPLICATE" && json.surveyId) {
        window.location.href = `/admin/documentation/employee-surveys/${json.surveyId}`;
      } else if (action === "REMIND_NON_RESPONDERS") {
        window.alert(`${json.targeted} kişi hedeflendi; ${json.sent} hatırlatma gönderildi, ${json.failed} gönderilemedi.`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Anket işlemi tamamlanamadı.");
    } finally {
      setActionBusyId("");
    }
  }

  function exportCsv() {
    const rows: string[][] = [
      [
        "Anket",
        "Soru",
        "Yanıt Sayısı",
        "Olumsuz Sayısı",
        "Olumsuz Oranı",
        "Ortalama Risk",
        "En Yüksek Risk",
      ],
    ];

    for (const analysis of analytics) {
      if (analysis.locked) continue;

      for (const question of analysis.questions) {
        rows.push([
          analysis.surveyTitle,
          question.question,
          String(question.responseCount),
          String(question.negativeCount),
          percent(
            question.negativeRate
          ),
          number(
            question.averageRisk
          ),
          question.highestRiskLevel,
        ]);
      }
    }

    const csv = rows
      .map((row) =>
        row
          .map(
            (cell) =>
              `"${String(cell).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(";")
      )
      .join("\n");

    const blob = new Blob(
      [`\uFEFF${csv}`],
      {
        type:
          "text/csv;charset=utf-8",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `DSEC_Anket_Analizi_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    link.click();
    URL.revokeObjectURL(url);
  }

  function exportParticipantCsv() {
    const rows: string[][] = [["Anket", "Sicil No", "Çalışan", "E-posta", "Görev/Kadro", "Katılım Durumu", "Gönderim", "Açılma", "Tamamlama", "Soru", "Yanıt", "Risk Seviyesi", "Risk Puanı"]];
    for (const participant of participants) {
      const matching = participant.anonymous ? null : responses.find((response) => response.surveyId === participant.surveyId && ((participant.email && response.participantEmail.toLowerCase() === participant.email.toLowerCase()) || response.participantName === participant.fullName));
      const base = [participant.surveyTitle, participant.registryNo, participant.fullName, participant.email, participant.jobTitle, participantStatusLabel(participant.status), formatDate(participant.sentAt), formatDate(participant.openedAt), formatDate(participant.completedAt)];
      if (matching?.answers.length) {
        for (const answer of matching.answers) rows.push([...base, answer.question, `${answer.answer}${answer.comment ? ` | Açıklama: ${answer.comment}` : ""}`, answer.riskLevel, String(answer.riskPoints)]);
      } else {
        rows.push([...base, participant.anonymous && participant.status === "COMPLETED" ? "Anonim anket" : "", participant.anonymous && participant.status === "COMPLETED" ? "Cevaplar çalışanla eşleştirilmez" : "", "", ""]);
      }
    }
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `DSEC_Anket_Katilimci_Raporu_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={centerStyle}>
          <Loader2 size={34} />
          <b>Anket merkezi yükleniyor…</b>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={heroStyle}>
          <button
            type="button"
            onClick={() => {
              window.location.href =
                "/admin/documentation";
            }}
            style={ghostButton}
          >
            <ArrowLeft size={16} />
            Dokümantasyona Dön
          </button>

          <h1
            style={{
              margin: "18px 0 7px",
              fontSize: 29,
            }}
          >
            Çalışan Anket & Geri Bildirim Merkezi
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.86,
            }}
          >
            Çalışan görüşlerini ölçün, riskli yanıtları
            erken tespit edin ve sonuçları izlenebilir
            aksiyonlara dönüştürün.
          </p>

          <div style={heroActionsStyle}>
            <select
              value={companyId}
              onChange={(event) =>
                setCompanyId(
                  event.target.value
                )
              }
              style={heroSelectStyle}
            >
              <option value="">
                Firma seçin
              </option>

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

            <button
              type="button"
              onClick={() =>
                void refresh()
              }
              style={ghostButton}
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Yenile
            </button>

            <button
              type="button"
              onClick={() =>
                setTab("CREATE")
              }
              style={whiteButton}
            >
              <Plus size={17} />
              Yeni Anket
            </button>
          </div>
        </header>

        {error ? (
          <div style={errorStyle}>
            <AlertTriangle size={19} />
            {error}
          </div>
        ) : null}

        <nav style={navStyle}>
          {TABS.map((item) => {
            const active =
              tab === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  setTab(item.value)
                }
                style={{
                  ...tabButton,
                  ...(active
                    ? activeTab
                    : {}),
                }}
              >
                {item.icon}
                {item.label}

                {item.value ===
                  "FINDINGS" &&
                findings.length > 0 ? (
                  <b style={countBadge}>
                    {findings.length}
                  </b>
                ) : null}
              </button>
            );
          })}
        </nav>

        {tab === "OVERVIEW" ? (
          <>
            <section style={kpiGrid}>
              <Kpi
                label="Aktif Anket"
                value={
                  surveys.filter((survey) => survey.status === "ACTIVE" && !isExpired(survey)).length
                }
                icon={
                  <Activity size={20} />
                }
              />

              <Kpi
                label="Gönderilen"
                value={
                  report.targetCount
                }
                icon={<Send size={20} />}
              />

              <Kpi
                label="Yanıtlanan"
                value={
                  report.responseCount
                }
                icon={
                  <MessageSquareText
                    size={20}
                  />
                }
              />

              <Kpi
                label="Katılım"
                value={percent(
                  report.participationRate
                )}
                icon={<Users size={20} />}
              />

              <Kpi
                label="Kritik Bulgu"
                value={
                  report.criticalFindingCount
                }
                icon={
                  <ShieldAlert size={20} />
                }
              />

              <Kpi
                label="Açık Aksiyon"
                value={
                  report.openActionCount
                }
                icon={<Target size={20} />}
              />
            </section>

            <section style={twoColumn}>
              <div style={panelStyle}>
                <SectionTitle
                  icon={
                    <ShieldAlert size={21} />
                  }
                  title="Öncelikli Bulgular"
                />

                {findings.length > 0 ? (
                  findings
                    .slice(0, 5)
                    .map((finding) => (
                      <FindingRow
                        key={finding.id}
                        finding={finding}
                      />
                    ))
                ) : (
                  <Empty text="Henüz riskli veya kritik bulgu bulunmuyor." />
                )}
              </div>

              <div style={panelStyle}>
                <SectionTitle
                  icon={
                    <Sparkles size={21} />
                  }
                  title="DORA Yönetici Özeti"
                />

                <p style={paragraphStyle}>
                  {report.responseCount ===
                  0
                    ? "Henüz analiz edilecek çalışan yanıtı bulunmuyor."
                    : `${report.responseCount} yanıt incelendi. Genel katılım ${percent(
                        report.participationRate
                      )}, ortalama risk skoru ${number(
                        report.averageRiskScore
                      )}/100 ve toplam ${report.negativeAnswerCount} riskli cevap tespit edildi.`}
                </p>

                <button
                  type="button"
                  style={primaryButton}
                  onClick={() =>
                    setTab("ANALYSIS")
                  }
                >
                  <Sparkles size={17} />
                  Sonuçları İncele
                </button>
              </div>
            </section>
          </>
        ) : null}

        {tab === "SURVEYS" ? (
          <section style={panelStyle}>
            <div style={sectionHeader}>
              <SectionTitle
                icon={
                  <ClipboardList size={21} />
                }
                title="Anketler"
              />

              <label style={searchStyle}>
                <Search size={17} />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Anket ara"
                  style={plainInput}
                />
              </label>
            </div>

            <div style={tableWrap}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>
                      Anket
                    </th>
                    <th style={thStyle}>
                      Durum
                    </th>
                    <th style={thStyle}>
                      Gizlilik
                    </th>
                    <th style={thStyle}>
                      Katılım
                    </th>
                    <th style={thStyle}>
                      Olumsuz
                    </th>
                    <th style={thStyle}>
                      Risk
                    </th>
                    <th style={thStyle}>
                      Bitiş
                    </th>
                    <th style={thStyle}>
                      İşlemler
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSurveys.map(
                    (survey) => (
                      <tr key={survey.id}>
                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href =
                                `/admin/documentation/employee-surveys/${survey.id}`;
                            }}
                            style={linkButton}
                          >
                            {survey.title}
                          </button>

                          <small
                            style={smallStyle}
                          >
                            {survey.category} ·{" "}
                            {survey.questionCount} soru
                          </small>
                        </td>

                        <td style={tdStyle}>
                          <span style={pill}>
                            {isExpired(survey) ? "Süresi Doldu" : statusLabel(survey.status)}
                          </span>
                        </td>

                        <td style={tdStyle}>
                          {survey.anonymous
                            ? "Anonim"
                            : "Kimlikli"}
                        </td>

                        <td style={tdStyle}>
                          {survey.responseCount}/
                          {survey.targetCount}
                          {" "}
                          (
                          {percent(
                            survey.participationRate
                          )}
                          )
                        </td>

                        <td style={tdStyle}>
                          {percent(
                            survey.negativeRate
                          )}
                        </td>

                        <td style={tdStyle}>
                          <b
                            style={{
                              color: riskColor(
                                survey.riskScore
                              ),
                            }}
                          >
                            {number(
                              survey.riskScore
                            )}
                            /100
                          </b>
                        </td>

                        <td style={tdStyle}>
                          {formatDate(
                            survey.endsAt
                          )}
                        </td>

                        <td style={{ ...tdStyle, minWidth: 330 }}>
                          <div style={rowActionsStyle}>
                            <button type="button" style={miniButton} disabled={actionBusyId === survey.id} onClick={() => { window.location.href = `/admin/documentation/employee-surveys/${survey.id}`; }}><Edit3 size={14} /> Düzenle</button>
                            <button type="button" style={miniButton} disabled={actionBusyId === survey.id} onClick={() => void surveyAction(survey, "DUPLICATE")}><Copy size={14} /> Kopyala</button>
                            {survey.status === "ACTIVE" ? <button type="button" style={miniButton} disabled={actionBusyId === survey.id} onClick={() => void surveyAction(survey, "EXTEND")}><CalendarClock size={14} /> Süre Uzat</button> : null}
                            {survey.status === "ACTIVE" && !isExpired(survey) && survey.responseCount < survey.targetCount ? <button type="button" style={miniButton} disabled={actionBusyId === survey.id} onClick={() => void surveyAction(survey, "REMIND_NON_RESPONDERS")}><Send size={14} /> Hatırlat</button> : null}
                            {survey.status === "ACTIVE" ? <button type="button" style={miniButton} disabled={actionBusyId === survey.id} onClick={() => void surveyAction(survey, "CLOSE")}>Kapat</button> : null}
                            {survey.status === "CLOSED" ? <button type="button" style={miniButton} disabled={actionBusyId === survey.id} onClick={() => void surveyAction(survey, "REOPEN")}>Yeniden Aç</button> : null}
                            {survey.status !== "ARCHIVED" ? <button type="button" style={miniButton} disabled={actionBusyId === survey.id} onClick={() => void surveyAction(survey, "ARCHIVE")}><Archive size={14} /> Arşivle</button> : <button type="button" style={miniButton} disabled={actionBusyId === survey.id} onClick={() => void surveyAction(survey, "RESTORE")}>Arşivden Çıkar</button>}
                            {survey.responseCount === 0 ? <button type="button" style={miniDangerButton} disabled={actionBusyId === survey.id} onClick={() => void surveyAction(survey, "DELETE")}><Trash2 size={14} /> Sil</button> : null}
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {filteredSurveys.length ===
            0 ? (
              <Empty text="Bu firmaya ait anket bulunmuyor." />
            ) : null}
          </section>
        ) : null}

        {tab === "CREATE" ? (
          <section style={twoColumn}>
            <form
              onSubmit={createSurvey}
              style={panelStyle}
            >
              <SectionTitle
                icon={<Plus size={21} />}
                title="Yeni Anket Oluştur"
              />

              <div style={formGrid}>
                <Field label="Anket adı *">
                  <input
                    required
                    value={draft.title}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        title:
                          event.target.value,
                      })
                    }
                    style={inputStyle}
                    placeholder="Örn. 2026 İSG Güvenlik Kültürü Anketi"
                  />
                </Field>

                <Field label="Anket türü">
                  <select
                    value={
                      draft.category
                    }
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        category:
                          event.target.value,
                      })
                    }
                    style={inputStyle}
                  >
                    {CATEGORIES.map(
                      (category) => (
                        <option
                          key={category}
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Bitiş tarihi">
                  <input
                    type="date"
                    value={draft.endDate}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        endDate:
                          event.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </Field>

                <Field label="Yanıt gizliliği">
                  <select
                    value={
                      draft.anonymous
                        ? "anonymous"
                        : "identified"
                    }
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        anonymous:
                          event.target.value ===
                          "anonymous",
                      })
                    }
                    style={inputStyle}
                  >
                    <option value="anonymous">
                      Anonim
                    </option>
                    <option value="identified">
                      Kimlikli
                    </option>
                  </select>
                </Field>
              </div>

              <Field label="Açıklama">
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      description:
                        event.target.value,
                    })
                  }
                  style={{
                    ...inputStyle,
                    minHeight: 110,
                  }}
                />
              </Field>

              <div style={privacyInfo}>
                <LockKeyhole size={19} />

                <span>
                  Anonim anketlerde ayrıntılı
                  sonuçlar en az 5 yanıt
                  alındıktan sonra açılır.
                </span>
              </div>

              <button
                disabled={saving}
                style={primaryButton}
              >
                {saving ? (
                  <Loader2 size={17} />
                ) : (
                  <CheckCircle2
                    size={17}
                  />
                )}

                Taslağı Kaydet ve Sorulara Geç
              </button>
            </form>

            <aside style={panelStyle}>
              <SectionTitle
                icon={
                  <ListChecks size={21} />
                }
                title="Anket Akışı"
              />

              <ol style={flowList}>
                <li>Anket bilgilerini oluşturun.</li>
                <li>Soruları ve riskli cevapları tanımlayın.</li>
                <li>Çalışan veya görev grubunu seçin.</li>
                <li>E-posta bağlantısını gönderin.</li>
                <li>Yanıtları analiz ve aksiyona dönüştürün.</li>
              </ol>
            </aside>
          </section>
        ) : null}

        {tab === "RESPONSES" ? (
          <section style={panelStyle}>
            <SectionTitle
              icon={
                <MessageSquareText
                  size={21}
                />
              }
              title="Yanıt Havuzu"
            />

            <SurveySelector
              surveys={surveys}
              value={selectedSurveyId}
              onChange={
                setSelectedSurveyId
              }
            />

            {!selectedSurvey ? (
              <Empty text="Yanıtlarını görüntülemek için bir anket seçin." />
            ) : selectedSurvey.anonymous &&
              !selectedSurvey.anonymousUnlocked ? (
              <PrivacyLock
                survey={selectedSurvey}
              />
            ) : selectedResponses.length ===
              0 ? (
              <Empty text="Seçilen ankete henüz yanıt verilmemiş." />
            ) : (
              <div style={responseGrid}>
                {selectedResponses.map(
                  (response, index) => (
                    <article
                      key={response.id}
                      style={responseCard}
                    >
                      <div style={sectionHeader}>
                        <div>
                          <b>
                            {response.anonymous
                              ? `Anonim Yanıt ${
                                  index + 1
                                }`
                              : response.participantName}
                          </b>

                          <small
                            style={smallStyle}
                          >
                            {response.jobTitle ||
                              "Görev bilgisi yok"}{" "}
                            ·{" "}
                            {formatDate(
                              response.submittedAt
                            )}
                          </small>
                        </div>

                        <RiskBadge
                          value={
                            response.riskScore
                          }
                        />
                      </div>

                      <div style={answerList}>
                        {response.answers.map(
                          (answer) => (
                            <div
                              key={answer.id}
                              style={answerRow}
                            >
                              <div>
                                <b
                                  style={{
                                    fontSize: 13,
                                  }}
                                >
                                  {
                                    answer.position
                                  }
                                  .{" "}
                                  {
                                    answer.question
                                  }
                                </b>

                                <div
                                  style={{
                                    marginTop: 5,
                                    color:
                                      "#334155",
                                  }}
                                >
                                  {
                                    answer.answer
                                  }
                                </div>
                                {answer.comment ? <div style={{ marginTop: 7, padding: "8px 10px", borderRadius: 8, background: "#f8fafc", color: "#475569", fontSize: 13 }}><b>Açıklama:</b> {answer.comment}</div> : null}
                              </div>

                              {answer.riskLevel !==
                              "NONE" ? (
                                <SeverityBadge
                                  value={
                                    answer.riskLevel
                                  }
                                />
                              ) : null}
                            </div>
                          )
                        )}
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        ) : null}

        {tab === "ANALYSIS" ? (
          <section style={panelStyle}>
            <SectionTitle
              icon={
                <BarChart3 size={21} />
              }
              title="Analiz Merkezi"
            />

            <SurveySelector
              surveys={surveys}
              value={selectedSurveyId}
              onChange={
                setSelectedSurveyId
              }
            />

            {!selectedAnalysis ? (
              <Empty text="Analiz için bir anket seçin." />
            ) : selectedAnalysis.locked ? (
              <PrivacyLock
                survey={
                  selectedSurvey!
                }
              />
            ) : (
              <>
                <div style={analysisKpis}>
                  <MiniKpi
                    label="Yanıt"
                    value={
                      selectedAnalysis.responseCount
                    }
                  />
                  <MiniKpi
                    label="Katılım"
                    value={percent(
                      selectedAnalysis.participationRate
                    )}
                  />
                  <MiniKpi
                    label="Risk Skoru"
                    value={`${number(
                      selectedAnalysis.riskScore
                    )}/100`}
                  />
                  <MiniKpi
                    label="Olumsuz"
                    value={percent(
                      selectedAnalysis.negativeRate
                    )}
                  />
                </div>

                <div style={questionGrid}>
                  {selectedAnalysis.questions.map(
                    (question) => (
                      <article
                        key={
                          question.questionId
                        }
                        style={questionCard}
                      >
                        <div style={sectionHeader}>
                          <div>
                            <small
                              style={smallStyle}
                            >
                              Soru{" "}
                              {
                                question.position
                              }
                            </small>

                            <h3
                              style={{
                                margin:
                                  "5px 0 0",
                                fontSize: 16,
                              }}
                            >
                              {
                                question.question
                              }
                            </h3>
                          </div>

                          {question.highestRiskLevel !==
                          "NONE" ? (
                            <SeverityBadge
                              value={
                                question.highestRiskLevel
                              }
                            />
                          ) : null}
                        </div>

                        <div
                          style={{
                            marginTop: 13,
                          }}
                        >
                          {question.optionDistribution.map(
                            (option) => (
                              <div
                                key={
                                  option.optionId
                                }
                                style={{
                                  marginBottom: 11,
                                }}
                              >
                                <div
                                  style={barHeader}
                                >
                                  <span>
                                    {
                                      option.label
                                    }
                                  </span>
                                  <b>
                                    {
                                      option.count
                                    }{" "}
                                    (
                                    {percent(
                                      option.percentage
                                    )}
                                    )
                                  </b>
                                </div>

                                <div
                                  style={barTrack}
                                >
                                  <div
                                    style={{
                                      ...barFill,
                                      width: `${Math.min(
                                        100,
                                        option.percentage
                                      )}%`,
                                      background:
                                        option.riskPoints >
                                        0
                                          ? "#dc2626"
                                          : "#0f766e",
                                    }}
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </div>

                        {question.textResponses.length >
                        0 ? (
                          <div style={textAnswers}>
                            <b>
                              Açık Uçlu Yanıtlar
                            </b>

                            {question.textResponses.map(
                              (
                                response,
                                index
                              ) => (
                                <p
                                  key={index}
                                  style={
                                    textAnswer
                                  }
                                >
                                  {response}
                                </p>
                              )
                            )}
                          </div>
                        ) : null}
                      </article>
                    )
                  )}
                </div>
              </>
            )}
          </section>
        ) : null}

        {tab === "FINDINGS" ? (
          <section style={panelStyle}>
            <SectionTitle
              icon={
                <ShieldAlert size={21} />
              }
              title="Kritik ve Negatif Bulgular"
            />

            {findings.length > 0 ? (
              findings.map((finding) => (
                <FindingRow
                  key={finding.id}
                  finding={finding}
                  detailed
                />
              ))
            ) : (
              <Empty text="MEDIUM, HIGH veya CRITICAL seviyede bulgu bulunmuyor." />
            )}
          </section>
        ) : null}

        {tab === "ACTIONS" ? (
          <section style={panelStyle}>
            <SectionTitle
              icon={<Target size={21} />}
              title="Anket Aksiyonları"
            />

            <div style={tableWrap}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>
                      Aksiyon
                    </th>
                    <th style={thStyle}>
                      Sorumlu
                    </th>
                    <th style={thStyle}>
                      Termin
                    </th>
                    <th style={thStyle}>
                      Öncelik
                    </th>
                    <th style={thStyle}>
                      Durum
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {actions.map((action) => (
                    <tr key={action.id}>
                      <td style={tdStyle}>
                        <b>{action.title}</b>
                        <small
                          style={smallStyle}
                        >
                          {action.description}
                        </small>
                      </td>

                      <td style={tdStyle}>
                        {action.owner ||
                          "Atanmadı"}
                      </td>

                      <td style={tdStyle}>
                        {formatDate(
                          action.dueDate
                        )}
                      </td>

                      <td style={tdStyle}>
                        {action.priority}
                      </td>

                      <td style={tdStyle}>
                        <span style={pill}>
                          {action.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {actions.length === 0 ? (
              <Empty text="Henüz anket bulgusundan oluşturulmuş aksiyon yok." />
            ) : null}
          </section>
        ) : null}

        {tab === "REPORTS" ? (
          <section style={panelStyle}>
            <SectionTitle
              icon={
                <FileDown size={21} />
              }
              title="Rapor Merkezi"
            />

            <div style={analysisKpis}>
              <MiniKpi
                label="Anket"
                value={report.surveyCount}
              />
              <MiniKpi
                label="Gönderilen"
                value={report.targetCount}
              />
              <MiniKpi
                label="Yanıt"
                value={report.responseCount}
              />
              <MiniKpi
                label="Katılım"
                value={percent(
                  report.participationRate
                )}
              />
              <MiniKpi
                label="Ortalama Risk"
                value={`${number(
                  report.averageRiskScore
                )}/100`}
              />
              <MiniKpi
                label="Riskli Cevap"
                value={
                  report.negativeAnswerCount
                }
              />
            </div>

            <div style={reportActions}>
              <button
                type="button"
                onClick={exportCsv}
                style={primaryButton}
              >
                <Download size={17} />
                Analiz CSV İndir
              </button>

              <button type="button" onClick={exportParticipantCsv} style={primaryButton}>
                <Users size={17} /> Kişi Bazlı CSV İndir
              </button>

              <button
                type="button"
                onClick={() =>
                  window.print()
                }
                style={secondaryButton}
              >
                <Printer size={17} />
                Yazdır / PDF Kaydet
              </button>
            </div>

            <div style={privacyInfo}>
              <LockKeyhole size={19} />
              Anonimlik eşiği dolmayan anketlerin cevap
              ayrıntıları rapora dahil edilmez.
            </div>

            <SectionTitle icon={<Users size={21} />} title="Katılımcı ve Eksik Yanıt Listesi" />
            <div style={tableWrap}>
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Anket</th><th style={thStyle}>Çalışan</th><th style={thStyle}>Sicil / Görev</th><th style={thStyle}>Durum</th><th style={thStyle}>Tamamlama</th></tr></thead>
                <tbody>{participants.map((participant) => <tr key={participant.id}><td style={tdStyle}>{participant.surveyTitle}{participant.anonymous ? <small style={smallStyle}>Anonim — cevaplarla eşleştirilmez</small> : null}</td><td style={tdStyle}><b>{participant.fullName}</b><small style={smallStyle}>{participant.email || "E-posta yok"}</small></td><td style={tdStyle}>{participant.registryNo || "—"}<small style={smallStyle}>{participant.jobTitle || "Görev yok"}</small></td><td style={tdStyle}><span style={pill}>{participantStatusLabel(participant.status)}</span></td><td style={tdStyle}>{formatDate(participant.completedAt)}</td></tr>)}</tbody>
              </table>
            </div>
            {participants.length === 0 ? <Empty text="Henüz katılımcı kaydı bulunmuyor." /> : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Kpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div style={kpiCard}>
      <div style={{ color: "#0f766e" }}>
        {icon}
      </div>
      <span style={mutedStyle}>
        {label}
      </span>
      <strong style={{ fontSize: 27 }}>
        {value}
      </strong>
    </div>
  );
}

function MiniKpi({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div style={miniKpi}>
      <span style={mutedStyle}>
        {label}
      </span>
      <strong style={{ fontSize: 21 }}>
        {value}
      </strong>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div style={titleStyle}>
      <span style={{ color: "#0f766e" }}>
        {icon}
      </span>
      <h2 style={titleText}>
        {title}
      </h2>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label style={fieldStyle}>
      {label}
      {children}
    </label>
  );
}

function SurveySelector({
  surveys,
  value,
  onChange,
}: {
  surveys: Survey[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(event.target.value)
      }
      style={{
        ...inputStyle,
        maxWidth: 480,
        marginBottom: 17,
      }}
    >
      <option value="">
        Anket seçin
      </option>

      {surveys.map((survey) => (
        <option
          key={survey.id}
          value={survey.id}
        >
          {survey.title} — {survey.responseCount} yanıt
        </option>
      ))}
    </select>
  );
}

function PrivacyLock({
  survey,
}: {
  survey: Survey;
}) {
  return (
    <div style={privacyLock}>
      <LockKeyhole
        size={42}
        color="#0f766e"
      />

      <h3 style={{ margin: 0 }}>
        Anonimlik koruması aktif
      </h3>

      <p
        style={{
          margin: 0,
          color: "#475569",
          lineHeight: 1.65,
        }}
      >
        Bu anket anonimdir. Ayrıntılı cevapların ve
        analizlerin açılması için en az{" "}
        <b>{survey.anonymousThreshold} yanıt</b>{" "}
        gereklidir.
      </p>

      <b style={{ color: "#0f766e" }}>
        {survey.responseCount} yanıt alındı ·{" "}
        {survey.remainingForAnalysis} yanıt daha gerekli
      </b>
    </div>
  );
}

function FindingRow({
  finding,
  detailed = false,
}: {
  finding: Finding;
  detailed?: boolean;
}) {
  return (
    <div style={findingRow}>
      <div>
        <div style={findingTitle}>
          <SeverityBadge
            value={finding.severity}
          />

          <b>{finding.question}</b>
        </div>

        <small style={smallStyle}>
          {finding.surveyTitle}
          {finding.segment
            ? ` · ${finding.segment}`
            : ""}
        </small>

        {detailed ? (
          <p style={paragraphStyle}>
            {finding.description}
          </p>
        ) : null}
      </div>

      <div style={{ textAlign: "right" }}>
        <b
          style={{
            color: "#b91c1c",
            fontSize: 17,
          }}
        >
          {percent(
            finding.negativeRate
          )}{" "}
          olumsuz
        </b>

        <small style={smallStyle}>
          {finding.responseCount} yanıt
        </small>
      </div>
    </div>
  );
}

function SeverityBadge({
  value,
}: {
  value: string;
}) {
  const style =
    severityStyle(value);

  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: 999,
        padding: "5px 8px",
        fontSize: 11,
        fontWeight: 900,
        ...style,
      }}
    >
      {value}
    </span>
  );
}

function RiskBadge({
  value,
}: {
  value: number;
}) {
  return (
    <span
      style={{
        borderRadius: 999,
        padding: "6px 10px",
        color: "white",
        background: riskColor(value),
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      Risk {number(value)}/100
    </span>
  );
}

function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <div style={emptyStyle}>
      {text}
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: 24,
  background: "#f4f7f6",
  color: "#172033",
} as const;

const containerStyle = {
  maxWidth: 1500,
  margin: "0 auto",
  display: "grid",
  gap: 18,
} as const;

const panelStyle = {
  padding: 19,
  borderRadius: 18,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  boxShadow:
    "0 8px 25px rgba(15,23,42,.04)",
} as const;

const heroStyle = {
  ...panelStyle,
  padding: 25,
  color: "#ffffff",
  background:
    "linear-gradient(135deg,#064e3b 0%,#0f766e 58%,#0e7490 100%)",
} as const;

const heroActionsStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 19,
} as const;

const heroSelectStyle = {
  minWidth: 300,
  minHeight: 44,
  padding: "0 12px",
  border: 0,
  borderRadius: 11,
  color: "#172033",
  background: "#ffffff",
  fontWeight: 800,
} as const;

const primaryButton = {
  minHeight: 43,
  padding: "0 15px",
  border: 0,
  borderRadius: 11,
  color: "#ffffff",
  background: "#0f766e",
  fontWeight: 850,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
} as const;

const secondaryButton = {
  ...primaryButton,
  color: "#0f766e",
  background: "#ecfdf5",
  border: "1px solid #a7f3d0",
} as const;

const ghostButton = {
  ...primaryButton,
  background:
    "rgba(255,255,255,.13)",
  border:
    "1px solid rgba(255,255,255,.23)",
} as const;

const whiteButton = {
  ...primaryButton,
  color: "#0f766e",
  background: "#ffffff",
} as const;

const navStyle = {
  ...panelStyle,
  padding: 9,
  display: "flex",
  gap: 7,
  overflowX: "auto",
} as const;

const tabButton = {
  minHeight: 41,
  padding: "0 13px",
  border: 0,
  borderRadius: 11,
  color: "#475569",
  background: "#f8fafc",
  fontWeight: 800,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  whiteSpace: "nowrap",
} as const;

const activeTab = {
  color: "#ffffff",
  background: "#0f766e",
} as const;

const countBadge = {
  minWidth: 20,
  height: 20,
  padding: "0 5px",
  borderRadius: 10,
  color: "#b91c1c",
  background: "#fee2e2",
  display: "inline-grid",
  placeItems: "center",
  fontSize: 11,
} as const;

const kpiGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(170px,1fr))",
  gap: 12,
} as const;

const kpiCard = {
  ...panelStyle,
  display: "grid",
  gap: 5,
} as const;

const twoColumn = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0,1.4fr) minmax(300px,.6fr)",
  gap: 18,
} as const;

const analysisKpis = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(145px,1fr))",
  gap: 10,
  marginBottom: 17,
} as const;

const miniKpi = {
  padding: 14,
  borderRadius: 13,
  border: "1px solid #dbe6e3",
  background: "#f8fffd",
  display: "grid",
  gap: 5,
} as const;

const titleStyle = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  marginBottom: 15,
} as const;

const titleText = {
  margin: 0,
  color: "#172033",
  fontSize: 19,
} as const;

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 12,
} as const;

const searchStyle = {
  minWidth: 250,
  minHeight: 41,
  padding: "0 10px",
  borderRadius: 11,
  border: "1px solid #cbd5e1",
  display: "flex",
  alignItems: "center",
  gap: 8,
} as const;

const plainInput = {
  width: "100%",
  minHeight: 39,
  border: 0,
  outline: 0,
  background: "transparent",
} as const;

const inputStyle = {
  width: "100%",
  minHeight: 43,
  boxSizing: "border-box",
  padding: "9px 11px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  color: "#172033",
  background: "#ffffff",
  font: "inherit",
} as const;

const formGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(230px,1fr))",
  gap: 13,
  marginBottom: 14,
} as const;

const fieldStyle = {
  display: "grid",
  gap: 7,
  color: "#475569",
  fontSize: 13,
  fontWeight: 800,
} as const;

const privacyInfo = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  margin: "15px 0",
  padding: 14,
  borderRadius: 12,
  color: "#115e59",
  background: "#f0fdfa",
  border: "1px solid #99f6e4",
} as const;

const privacyLock = {
  minHeight: 230,
  padding: 25,
  borderRadius: 15,
  border: "1px dashed #5eead4",
  background: "#f0fdfa",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: 11,
} as const;

const tableWrap = {
  overflowX: "auto",
} as const;

const tableStyle = {
  width: "100%",
  minWidth: 850,
  borderCollapse: "collapse",
  fontSize: 14,
} as const;

const thStyle = {
  padding: "12px 10px",
  borderBottom: "1px solid #cbd5e1",
  color: "#475569",
  textAlign: "left",
  fontSize: 12,
} as const;

const tdStyle = {
  padding: "13px 10px",
  borderBottom: "1px solid #edf1f5",
  verticalAlign: "top",
} as const;

const linkButton = {
  padding: 0,
  border: 0,
  color: "#0f766e",
  background: "transparent",
  fontWeight: 900,
  cursor: "pointer",
  textAlign: "left",
} as const;

const pill = {
  display: "inline-block",
  padding: "5px 9px",
  borderRadius: 999,
  color: "#047857",
  background: "#ecfdf5",
  fontSize: 12,
  fontWeight: 850,
} as const;

const smallStyle = {
  display: "block",
  marginTop: 5,
  color: "#64748b",
  fontSize: 12,
} as const;

const mutedStyle = {
  color: "#64748b",
  fontSize: 13,
} as const;

const paragraphStyle = {
  color: "#475569",
  lineHeight: 1.65,
} as const;

const flowList = {
  display: "grid",
  gap: 13,
  paddingLeft: 21,
  color: "#475569",
  lineHeight: 1.55,
} as const;

const responseGrid = {
  display: "grid",
  gap: 14,
} as const;

const responseCard = {
  padding: 16,
  borderRadius: 14,
  border: "1px solid #dbe5e2",
  background: "#fbfefd",
} as const;

const answerList = {
  display: "grid",
  gap: 8,
  marginTop: 14,
} as const;

const answerRow = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0,1fr) auto",
  gap: 12,
  padding: 12,
  borderRadius: 11,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
} as const;

const questionGrid = {
  display: "grid",
  gap: 14,
} as const;

const questionCard = {
  padding: 16,
  borderRadius: 14,
  border: "1px solid #dbe5e2",
  background: "#ffffff",
} as const;

const barHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  color: "#475569",
  fontSize: 13,
} as const;

const barTrack = {
  height: 9,
  marginTop: 6,
  borderRadius: 999,
  overflow: "hidden",
  background: "#e2e8f0",
} as const;

const barFill = {
  height: "100%",
  borderRadius: 999,
} as const;

const textAnswers = {
  marginTop: 15,
  padding: 13,
  borderRadius: 12,
  background: "#f8fafc",
} as const;

const textAnswer = {
  margin: "8px 0 0",
  padding: 10,
  borderRadius: 9,
  color: "#334155",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
} as const;

const findingRow = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0,1fr) auto",
  gap: 15,
  padding: "14px 0",
  borderBottom: "1px solid #edf1f5",
} as const;

const findingTitle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
} as const;

const reportActions = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 15,
} as const;

const emptyStyle = {
  padding: "38px 18px",
  borderRadius: 14,
  border: "1px dashed #cbd5e1",
  color: "#64748b",
  background: "#f8fafc",
  textAlign: "center",
} as const;

const errorStyle = {
  ...panelStyle,
  display: "flex",
  alignItems: "center",
  gap: 9,
  color: "#b91c1c",
  background: "#fef2f2",
  borderColor: "#fecaca",
  fontWeight: 800,
} as const;

const centerStyle = {
  ...panelStyle,
  maxWidth: 600,
  minHeight: 260,
  margin: "50px auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 11,
} as const;

const rowActionsStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
} as const;

const miniButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "7px 9px",
  background: "#fff",
  color: "#334155",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
} as const;

const miniDangerButton = {
  ...miniButton,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
} as const;
