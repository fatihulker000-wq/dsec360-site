"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";

type TemplateInfo = {
  id: string;
  title?: string | null;
  code?: string | null;
  category?: string | null;
  audit_type?: string | null;
};

type Audit = {
  id: string;
  firm_id: string;
  template_id: string;
  audit_no?: string | null;
  title?: string | null;
  audit_date_millis?: number | null;
  auditor_name?: string | null;
  auditor_title?: string | null;
  department?: string | null;
  location?: string | null;
  scope?: string | null;
  note?: string | null;
  status?: string | null;
  total_questions?: number | null;
  answered_questions?: number | null;
  compliant_count?: number | null;
  partial_count?: number | null;
  non_compliant_count?: number | null;
  not_applicable_count?: number | null;
  total_score?: number | null;
  max_score?: number | null;
  compliance_percent?: number | null;
  template?: TemplateInfo | TemplateInfo[] | null;
};

type Question = {
  id: string;
  section_title?: string | null;
  title?: string | null;
  question?: string | null;
  expected_condition?: string | null;
  precaution?: string | null;
  legal_basis?: string | null;
  risk_level?: string | null;
  photo_required?: boolean | null;
  score?: number | null;
  weight?: number | null;
  sort_order?: number | null;
};

type Answer = {
  id: string;
  firm_id: string;
  audit_id: string;
  question_id: string;
  answer_status?: string | null;
  explanation?: string | null;
  action_required?: boolean | null;
  action_text?: string | null;
  score?: number | null;
  answered_by?: string | null;
  answered_at_millis?: number | null;
  note?: string | null;
  question?: Question | Question[] | null;
};

type Finding = {
  id: string;
  answer_id?: string | null;
  question_id?: string | null;
  title?: string | null;
  status?: string | null;
};

type Draft = {
  status: string;
  explanation: string;
  actionRequired: boolean;
  actionText: string;
  answeredBy: string;
  note: string;
};

const ANSWER_OPTIONS = [
  { value: "UYGUN", label: "Uygun" },
  { value: "KISMEN_UYGUN", label: "Kısmen Uygun" },
  { value: "UYGUNSUZ", label: "Uygunsuz" },
  { value: "UYGULANAMAZ", label: "Uygulanamaz" },
];

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function formatDate(millis?: number | null): string {
  if (!millis) return "-";
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR");
}

function templateOf(audit: Audit | null): TemplateInfo | null {
  if (!audit?.template) return null;
  return Array.isArray(audit.template)
    ? audit.template[0] ?? null
    : audit.template;
}

function questionOf(answer: Answer): Question | null {
  if (!answer.question) return null;
  return Array.isArray(answer.question)
    ? answer.question[0] ?? null
    : answer.question;
}

function statusLabel(value?: string | null): string {
  switch (value) {
    case "PLANLANDI":
      return "Planlandı";
    case "DEVAM_EDIYOR":
      return "Devam Ediyor";
    case "TAMAMLANDI":
      return "Tamamlandı";
    case "IPTAL":
      return "İptal";
    default:
      return value || "-";
  }
}

function answerLabel(value?: string | null): string {
  return (
    ANSWER_OPTIONS.find((item) => item.value === value)?.label ||
    "Cevaplanmadı"
  );
}

function riskLabel(value?: string | null): string {
  switch (value) {
    case "DUSUK":
      return "Düşük";
    case "ORTA":
      return "Orta";
    case "YUKSEK":
      return "Yüksek";
    case "KRITIK":
      return "Kritik";
    default:
      return value || "-";
  }
}

export default function DoraAuditExecutionPage() {
  const params = useParams();
  const router = useRouter();

  const firmId = String(params.firmId ?? "");
  const auditId = String(params.auditId ?? "");

  const [audit, setAudit] = useState<Audit | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingAnswer, setFindingAnswer] = useState<Answer | null>(null);
  const [findingTitle, setFindingTitle] = useState("");
  const [findingDescription, setFindingDescription] = useState("");
  const [findingRecommendation, setFindingRecommendation] = useState("");
  const [findingRiskLevel, setFindingRiskLevel] = useState("ORTA");
  const [findingDetectedBy, setFindingDetectedBy] = useState("");
  const [creatingFinding, setCreatingFinding] = useState(false);

  const loadAudit = useCallback(async () => {
    if (!firmId || !auditId) return;

    const response = await fetch(
      `/api/dora/audits?id=${encodeURIComponent(
        auditId
      )}&firmId=${encodeURIComponent(firmId)}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "DORA denetimi alınamadı.");
    }

    setAudit(data.audit);
  }, [firmId, auditId]);

  const loadAnswers = useCallback(async () => {
    if (!firmId || !auditId) return;

    const response = await fetch(
      `/api/dora/audits/answers?firmId=${encodeURIComponent(
        firmId
      )}&auditId=${encodeURIComponent(auditId)}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Denetim maddeleri alınamadı.");
    }

    const list: Answer[] = Array.isArray(data.answers)
      ? data.answers
      : [];

    setAnswers(list);

    const nextDrafts: Record<string, Draft> = {};

    for (const answer of list) {
      /*
       * audits/route.ts ilk cevap satırlarını UYGULANAMAZ olarak oluşturuyor.
       * answered_at_millis boşsa bu gerçek bir kullanıcı cevabı değildir.
       * Bu nedenle ekranda "Cevaplanmadı" olarak gösteriyoruz.
       */
      const genuinelyAnswered = Boolean(answer.answered_at_millis);

      nextDrafts[answer.id] = {
        status: genuinelyAnswered ? text(answer.answer_status) : "",
        explanation: text(answer.explanation),
        actionRequired: Boolean(answer.action_required),
        actionText: text(answer.action_text),
        answeredBy: text(answer.answered_by),
        note: text(answer.note),
      };
    }

    setDrafts(nextDrafts);
  }, [firmId, auditId]);

  const loadFindings = useCallback(async () => {
    if (!firmId || !auditId) return;

    const response = await fetch(
      `/api/dora/audits/findings?firmId=${encodeURIComponent(firmId)}&auditId=${encodeURIComponent(auditId)}`,
      { cache: "no-store" }
    );
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "DORA bulguları alınamadı.");
    }
    setFindings(Array.isArray(data.findings) ? data.findings : []);
  }, [firmId, auditId]);

  const reloadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      await Promise.all([loadAudit(), loadAnswers(), loadFindings()]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "DORA denetimi yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }, [loadAudit, loadAnswers, loadFindings]);

  useEffect(() => {
    void reloadAll();
  }, [reloadAll]);

  const localStats = useMemo(() => {
    let answered = 0;
    let compliant = 0;
    let partial = 0;
    let nonCompliant = 0;
    let notApplicable = 0;

    for (const answer of answers) {
      if (!answer.answered_at_millis) continue;

      answered += 1;

      switch (answer.answer_status) {
        case "UYGUN":
          compliant += 1;
          break;
        case "KISMEN_UYGUN":
          partial += 1;
          break;
        case "UYGUNSUZ":
          nonCompliant += 1;
          break;
        case "UYGULANAMAZ":
          notApplicable += 1;
          break;
      }
    }

    const applicable = compliant + partial + nonCompliant;
    const compliance =
      applicable > 0
        ? Math.round(((compliant + partial * 0.5) / applicable) * 100)
        : 0;

    return {
      total: answers.length,
      answered,
      compliant,
      partial,
      nonCompliant,
      notApplicable,
      compliance,
      progress:
        answers.length > 0
          ? Math.round((answered / answers.length) * 100)
          : 0,
    };
  }, [answers]);

  const filteredAnswers = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");

    return answers.filter((answer) => {
      const question = questionOf(answer);
      const answered = Boolean(answer.answered_at_millis);
      const status = answered ? text(answer.answer_status) : "";

      if (filter === "UNANSWERED" && answered) return false;
      if (filter === "UYGUNSUZ" && status !== "UYGUNSUZ") return false;
      if (filter === "KISMEN_UYGUN" && status !== "KISMEN_UYGUN") return false;
      if (filter === "UYGUN" && status !== "UYGUN") return false;

      if (!q) return true;

      const haystack = [
        question?.section_title,
        question?.title,
        question?.question,
        question?.expected_condition,
        question?.legal_basis,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return haystack.includes(q);
    });
  }, [answers, search, filter]);

  function updateDraft(answerId: string, patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [answerId]: {
        ...(current[answerId] ?? {
          status: "",
          explanation: "",
          actionRequired: false,
          actionText: "",
          answeredBy: "",
          note: "",
        }),
        ...patch,
      },
    }));
  }

  async function saveAnswer(answer: Answer) {
    const draft = drafts[answer.id];

    if (!draft?.status) {
      alert("Önce Uygun / Kısmen Uygun / Uygunsuz / Uygulanamaz seç.");
      return;
    }

    try {
      setSavingId(answer.id);

      const response = await fetch("/api/dora/audits/answers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: answer.id,
          firmId,
          auditId,
          answerStatus: draft.status,
          explanation: draft.explanation,
          actionRequired: draft.actionRequired,
          actionText: draft.actionText,
          answeredBy: draft.answeredBy,
          note: draft.note,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Denetim cevabı kaydedilemedi.");
      }

      await Promise.all([loadAudit(), loadAnswers()]);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Denetim cevabı kaydedilemedi."
      );
    } finally {
      setSavingId("");
    }
  }

  function findingForAnswer(answerId: string): Finding | undefined {
    return findings.find((item) => item.answer_id === answerId);
  }

  function openFinding(answer: Answer) {
    const question = questionOf(answer);
    const draft = drafts[answer.id];
    setFindingAnswer(answer);
    setFindingTitle(question?.title || "Denetim Bulgusu");
    setFindingDescription(draft?.explanation || text(answer.explanation));
    setFindingRecommendation(draft?.actionText || text(answer.action_text));
    setFindingRiskLevel(question?.risk_level || "ORTA");
    setFindingDetectedBy(draft?.answeredBy || text(answer.answered_by) || text(audit?.auditor_name));
  }

  async function createFinding() {
    if (!findingAnswer) return;
    const question = questionOf(findingAnswer);
    if (!findingTitle.trim()) {
      alert("Bulgu başlığı zorunludur.");
      return;
    }
    try {
      setCreatingFinding(true);
      const response = await fetch("/api/dora/audits/findings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmId,
          auditId,
          answerId: findingAnswer.id,
          questionId: findingAnswer.question_id,
          title: findingTitle,
          description: findingDescription,
          findingType: "UYGUNSUZLUK",
          riskLevel: findingRiskLevel,
          legalBasis: question?.legal_basis || "",
          recommendation: findingRecommendation,
          detectedBy: findingDetectedBy,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "DORA bulgusu oluşturulamadı.");
      }
      await loadFindings();
      setFindingAnswer(null);
      alert("DORA bulgusu oluşturuldu.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "DORA bulgusu oluşturulamadı.");
    } finally {
      setCreatingFinding(false);
    }
  }

  async function finishAudit() {
    if (localStats.answered < localStats.total) {
      alert(
        `Denetim tamamlanamaz. ${localStats.total - localStats.answered} madde henüz cevaplanmadı.`
      );
      return;
    }

    if (
      !window.confirm(
        "Tüm maddeler cevaplandı. Denetim tamamlandı olarak kapatılsın mı?"
      )
    ) {
      return;
    }

    try {
      setFinishing(true);

      const response = await fetch("/api/dora/audits", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: auditId,
          firmId,
          status: "TAMAMLANDI",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Denetim tamamlanamadı.");
      }

      await loadAudit();
      alert("DORA denetimi tamamlandı.");
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Denetim tamamlanamadı."
      );
    } finally {
      setFinishing(false);
    }
  }

  const template = templateOf(audit);

  if (loading) {
    return (
      <main className="page">
        <div className="loadingCard">DORA denetimi yükleniyor...</div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (error || !audit) {
    return (
      <main className="page">
        <div className="errorBox">{error || "Denetim bulunamadı."}</div>
        <button
          className="outlineBtn"
          onClick={() => router.push(`/admin/dora/${firmId}/audits`)}
        >
          ← Denetim Merkezine Dön
        </button>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <button
            className="backBtn"
            onClick={() => router.push(`/admin/dora/${firmId}/audits`)}
          >
            ← Denetim Merkezine Dön
          </button>

          <div className="eyebrow">DORA • SAHA DENETİMİ</div>

          <h1>{audit.title || "DORA Denetimi"}</h1>

          <p>
            {audit.audit_no || "DORA"} • {template?.title || "Şablon"}
          </p>
        </div>

        <div className="heroActions">
          <span className={`auditStatus status-${audit.status || ""}`}>
            {statusLabel(audit.status)}
          </span>

          <button className="outlineBtn" onClick={() => void reloadAll()}>
            Yenile
          </button>

          <button
            className="primaryBtn"
            disabled={
              finishing ||
              localStats.total === 0 ||
              localStats.answered < localStats.total ||
              audit.status === "TAMAMLANDI"
            }
            onClick={() => void finishAudit()}
          >
            {audit.status === "TAMAMLANDI"
              ? "Denetim Tamamlandı"
              : finishing
                ? "Tamamlanıyor..."
                : "Denetimi Tamamla"}
          </button>
        </div>
      </section>

      <section className="infoGrid">
        <Info label="Denetçi" value={audit.auditor_name || "-"} />
        <Info label="Unvan" value={audit.auditor_title || "-"} />
        <Info label="Tarih" value={formatDate(audit.audit_date_millis)} />
        <Info label="Bölüm" value={audit.department || "-"} />
        <Info label="Lokasyon" value={audit.location || "-"} />
        <Info label="Denetim Tipi" value={template?.audit_type || "-"} />
      </section>

      {(audit.scope || audit.note) && (
        <section className="contextCard">
          {audit.scope && (
            <div>
              <strong>Kapsam</strong>
              <p>{audit.scope}</p>
            </div>
          )}

          {audit.note && (
            <div>
              <strong>Denetim Notu</strong>
              <p>{audit.note}</p>
            </div>
          )}
        </section>
      )}

      <section className="kpiGrid">
        <Kpi title="Toplam Madde" value={localStats.total} />
        <Kpi title="Cevaplanan" value={localStats.answered} />
        <Kpi title="Uygun" value={localStats.compliant} />
        <Kpi title="Kısmen Uygun" value={localStats.partial} />
        <Kpi title="Uygunsuz" value={localStats.nonCompliant} />
        <Kpi title="Uygulanamaz" value={localStats.notApplicable} />
        <Kpi title="Uyum" value={`%${localStats.compliance}`} />
      </section>

      <section className="progressCard">
        <div className="progressHeader">
          <div>
            <strong>Denetim İlerlemesi</strong>
            <span>
              {localStats.answered} / {localStats.total} madde cevaplandı
            </span>
          </div>

          <b>%{localStats.progress}</b>
        </div>

        <div className="progressTrack">
          <div
            className="progressBar"
            style={{ width: `${localStats.progress}%` }}
          />
        </div>
      </section>

      <section className="toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Madde, bölüm, mevzuat veya soru ara..."
        />

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="ALL">Tüm Maddeler</option>
          <option value="UNANSWERED">Cevaplanmayanlar</option>
          <option value="UYGUN">Uygun</option>
          <option value="KISMEN_UYGUN">Kısmen Uygun</option>
          <option value="UYGUNSUZ">Uygunsuz</option>
        </select>
      </section>

      <section className="questionList">
        {filteredAnswers.length === 0 ? (
          <div className="empty">Gösterilecek denetim maddesi bulunamadı.</div>
        ) : (
          filteredAnswers.map((answer, index) => {
            const question = questionOf(answer);
            const draft = drafts[answer.id];
            const isAnswered = Boolean(answer.answered_at_millis);
            const locked =
              audit.status === "TAMAMLANDI" || audit.status === "IPTAL";

            return (
              <article className="questionCard" key={answer.id}>
                <div className="questionHeader">
                  <div className="number">{index + 1}</div>

                  <div className="questionTitle">
                    {question?.section_title && (
                      <div className="sectionName">
                        {question.section_title}
                      </div>
                    )}

                    <h2>{question?.title || "Denetim Maddesi"}</h2>

                    <p>{question?.question || "-"}</p>
                  </div>

                  <div className="badges">
                    <span className={`risk risk-${question?.risk_level || ""}`}>
                      {riskLabel(question?.risk_level)}
                    </span>

                    <span
                      className={`answerState ${
                        isAnswered ? `answer-${answer.answer_status}` : ""
                      }`}
                    >
                      {isAnswered
                        ? answerLabel(answer.answer_status)
                        : "Cevaplanmadı"}
                    </span>
                  </div>
                </div>

                <div className="detailGrid">
                  <Detail
                    label="Beklenen Durum"
                    value={question?.expected_condition}
                  />
                  <Detail label="Önlem" value={question?.precaution} />
                  <Detail label="Mevzuat" value={question?.legal_basis} />
                  <Detail
                    label="Fotoğraf"
                    value={
                      question?.photo_required
                        ? "Fotoğraf zorunlu"
                        : "Fotoğraf opsiyonel"
                    }
                  />
                  <Detail
                    label="Puan / Ağırlık"
                    value={`${question?.score ?? 0} / ${question?.weight ?? 1}`}
                  />
                </div>

                <div className="answerButtons">
                  {ANSWER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      disabled={locked}
                      className={`answerBtn option-${option.value} ${
                        draft?.status === option.value ? "selectedAnswer" : ""
                      }`}
                      onClick={() =>
                        updateDraft(answer.id, {
                          status: option.value,
                          actionRequired:
                            option.value === "UYGUNSUZ" ||
                            option.value === "KISMEN_UYGUN",
                        })
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="formGrid">
                  <label className="field full">
                    <span>Açıklama / Denetim Notu</span>
                    <textarea
                      rows={3}
                      disabled={locked}
                      value={draft?.explanation || ""}
                      onChange={(event) =>
                        updateDraft(answer.id, {
                          explanation: event.target.value,
                        })
                      }
                      placeholder="Sahada görülen durumu açıklayın..."
                    />
                  </label>

                  <label className="field">
                    <span>Cevaplayan / Denetçi</span>
                    <input
                      disabled={locked}
                      value={draft?.answeredBy || ""}
                      onChange={(event) =>
                        updateDraft(answer.id, {
                          answeredBy: event.target.value,
                        })
                      }
                      placeholder={audit.auditor_name || "Ad Soyad"}
                    />
                  </label>

                  <label className="field">
                    <span>Ek Not</span>
                    <input
                      disabled={locked}
                      value={draft?.note || ""}
                      onChange={(event) =>
                        updateDraft(answer.id, {
                          note: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                {(draft?.status === "UYGUNSUZ" ||
                  draft?.status === "KISMEN_UYGUN" ||
                  draft?.actionRequired) && (
                  <div className="actionBox">
                    <label className="check">
                      <input
                        type="checkbox"
                        disabled={locked}
                        checked={Boolean(draft?.actionRequired)}
                        onChange={(event) =>
                          updateDraft(answer.id, {
                            actionRequired: event.target.checked,
                          })
                        }
                      />
                      Düzeltici faaliyet / aksiyon gerekli
                    </label>

                    <label className="field">
                      <span>Önerilen Aksiyon</span>
                      <textarea
                        rows={3}
                        disabled={locked}
                        value={draft?.actionText || ""}
                        onChange={(event) =>
                          updateDraft(answer.id, {
                            actionText: event.target.value,
                          })
                        }
                        placeholder="Uygunsuzluğun giderilmesi için yapılması gereken işlemi yazın..."
                      />
                    </label>

                    {isAnswered &&
                      (answer.answer_status === "UYGUNSUZ" ||
                        answer.answer_status === "KISMEN_UYGUN") && (
                        <div className="findingHint">
                          {findingForAnswer(answer.id) ? (
                            <>
                              <strong>✓ DORA Bulgusu Oluşturuldu</strong>
                              <button
                                className="outlineBtn"
                                onClick={() => router.push(`/admin/dora/${firmId}/audits?tab=findings`)}
                              >
                                Bulgulara Git
                              </button>
                            </>
                          ) : (
                            <>
                              <span>Bu uygunsuzluk için DORA içinde bağımsız bulgu oluşturabilirsiniz.</span>
                              <button
                                className="findingBtn"
                                disabled={locked}
                                onClick={() => openFinding(answer)}
                              >
                                + Bulgu Oluştur
                              </button>
                            </>
                          )}
                        </div>
                      )}
                  </div>
                )}

                <div className="cardFooter">
                  <span>
                    {isAnswered
                      ? `Son kayıt: ${formatDate(answer.answered_at_millis)}`
                      : "Henüz kaydedilmedi"}
                  </span>

                  <button
                    className="primaryBtn"
                    disabled={locked || savingId === answer.id}
                    onClick={() => void saveAnswer(answer)}
                  >
                    {savingId === answer.id
                      ? "Kaydediliyor..."
                      : isAnswered
                        ? "Cevabı Güncelle"
                        : "Cevabı Kaydet"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      {findingAnswer && (
        <div className="modalBackdrop" onMouseDown={() => !creatingFinding && setFindingAnswer(null)}>
          <section className="findingModal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <div className="eyebrow">DORA • DENETİM BULGUSU</div>
                <h2>Bulgu Oluştur</h2>
              </div>
              <button className="outlineBtn" disabled={creatingFinding} onClick={() => setFindingAnswer(null)}>Kapat</button>
            </div>
            <div className="modalGrid">
              <label className="field full"><span>Bulgu Başlığı *</span><input value={findingTitle} onChange={(e) => setFindingTitle(e.target.value)} /></label>
              <label className="field full"><span>Bulgu Açıklaması</span><textarea rows={4} value={findingDescription} onChange={(e) => setFindingDescription(e.target.value)} /></label>
              <label className="field"><span>Risk Seviyesi</span><select value={findingRiskLevel} onChange={(e) => setFindingRiskLevel(e.target.value)}><option value="DUSUK">Düşük</option><option value="ORTA">Orta</option><option value="YUKSEK">Yüksek</option><option value="KRITIK">Kritik</option></select></label>
              <label className="field"><span>Tespit Eden</span><input value={findingDetectedBy} onChange={(e) => setFindingDetectedBy(e.target.value)} /></label>
              <label className="field full"><span>Önerilen Düzeltme / Aksiyon</span><textarea rows={3} value={findingRecommendation} onChange={(e) => setFindingRecommendation(e.target.value)} /></label>
            </div>
            <div className="modalFooter"><button className="outlineBtn" disabled={creatingFinding} onClick={() => setFindingAnswer(null)}>Vazgeç</button><button className="primaryBtn" disabled={creatingFinding} onClick={() => void createFinding()}>{creatingFinding ? "Oluşturuluyor..." : "Bulguyu Oluştur"}</button></div>
          </section>
        </div>
      )}

      <style jsx>{styles}</style>
    </main>
  );
}

function Kpi({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <article className="kpi">
      <span>{title}</span>
      <strong>{value}</strong>

      <style jsx>{`
        .kpi {
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
        }
        .kpi span {
          display: block;
          color: #667085;
          font-size: 11px;
          font-weight: 800;
        }
        .kpi strong {
          display: block;
          margin-top: 7px;
          color: #531823;
          font-size: 25px;
        }
      `}</style>
    </article>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>{value}</strong>

      <style jsx>{`
        .info {
          padding: 13px;
          border: 1px solid #eaecf0;
          border-radius: 12px;
          background: #fff;
        }
        .info span {
          display: block;
          color: #98a2b3;
          font-size: 10px;
          font-weight: 850;
        }
        .info strong {
          display: block;
          margin-top: 5px;
          color: #344054;
          font-size: 13px;
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
      <span>{label}</span>
      <p>{value || "-"}</p>

      <style jsx>{`
        .detail {
          padding: 10px;
          border-radius: 10px;
          background: #f8fafc;
        }
        .detail span {
          display: block;
          color: #98a2b3;
          font-size: 10px;
          font-weight: 850;
        }
        .detail p {
          margin: 5px 0 0;
          color: #344054;
          font-size: 12px;
          line-height: 1.45;
        }
      `}</style>
    </div>
  );
}

const styles = `
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
    padding: 25px;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 8px 28px rgba(15,23,42,.05);
  }

  .hero h1 {
    margin: 7px 0;
    font-size: 30px;
  }

  .hero p {
    margin: 0;
    color: #667085;
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
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .08em;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: .5;
  }

  .backBtn,
  .outlineBtn,
  .primaryBtn {
    border-radius: 10px;
    padding: 10px 14px;
    font-weight: 800;
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

  .auditStatus {
    padding: 8px 11px;
    border-radius: 999px;
    background: #f2f4f7;
    color: #475467;
    font-size: 11px;
    font-weight: 900;
  }

  .status-PLANLANDI {
    background: #eff8ff;
    color: #175cd3;
  }

  .status-DEVAM_EDIYOR {
    background: #fffaeb;
    color: #b54708;
  }

  .status-TAMAMLANDI {
    background: #ecfdf3;
    color: #027a48;
  }

  .status-IPTAL {
    background: #fef3f2;
    color: #b42318;
  }

  .infoGrid {
    display: grid;
    grid-template-columns: repeat(6,minmax(0,1fr));
    gap: 10px;
    margin-top: 15px;
  }

  .contextCard {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 18px;
    margin-top: 15px;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    background: #fff;
  }

  .contextCard strong {
    font-size: 11px;
    color: #475467;
  }

  .contextCard p {
    margin: 5px 0 0;
    color: #667085;
    font-size: 12px;
    line-height: 1.5;
  }

  .kpiGrid {
    display: grid;
    grid-template-columns: repeat(7,minmax(0,1fr));
    gap: 10px;
    margin-top: 15px;
  }

  .progressCard {
    margin-top: 15px;
    padding: 15px;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    background: #fff;
  }

  .progressHeader {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .progressHeader strong {
    display: block;
    font-size: 13px;
  }

  .progressHeader span {
    display: block;
    margin-top: 3px;
    color: #667085;
    font-size: 11px;
  }

  .progressHeader b {
    color: #531823;
    font-size: 20px;
  }

  .progressTrack {
    height: 8px;
    margin-top: 11px;
    overflow: hidden;
    border-radius: 999px;
    background: #eaecf0;
  }

  .progressBar {
    height: 100%;
    border-radius: inherit;
    background: #7a2633;
    transition: width .2s ease;
  }

  .toolbar {
    display: grid;
    grid-template-columns: minmax(300px,1fr) 220px;
    gap: 10px;
    margin-top: 15px;
  }

  .toolbar input,
  .toolbar select,
  .field input,
  .field textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #d0d5dd;
    border-radius: 10px;
    background: #fff;
    padding: 10px 11px;
    color: #172033;
    outline: none;
  }

  .questionList {
    display: grid;
    gap: 13px;
    margin-top: 15px;
  }

  .questionCard {
    padding: 18px;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    background: #fff;
  }

  .questionHeader {
    display: grid;
    grid-template-columns: 38px minmax(0,1fr) auto;
    gap: 12px;
    align-items: flex-start;
  }

  .number {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: #f2f4f7;
    color: #475467;
    font-size: 12px;
    font-weight: 900;
  }

  .sectionName {
    color: #7a2633;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .04em;
  }

  .questionTitle h2 {
    margin: 4px 0;
    font-size: 16px;
  }

  .questionTitle p {
    margin: 0;
    color: #475467;
    font-size: 13px;
    line-height: 1.55;
  }

  .badges {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .risk,
  .answerState {
    padding: 5px 8px;
    border-radius: 999px;
    background: #f2f4f7;
    color: #667085;
    font-size: 10px;
    font-weight: 900;
  }

  .risk-DUSUK,
  .answer-UYGUN {
    background: #ecfdf3;
    color: #027a48;
  }

  .risk-ORTA,
  .answer-KISMEN_UYGUN {
    background: #fffaeb;
    color: #b54708;
  }

  .risk-YUKSEK {
    background: #fff4ed;
    color: #c4320a;
  }

  .risk-KRITIK,
  .answer-UYGUNSUZ {
    background: #fef3f2;
    color: #b42318;
  }

  .answer-UYGULANAMAZ {
    background: #f2f4f7;
    color: #475467;
  }

  .detailGrid {
    display: grid;
    grid-template-columns: repeat(5,minmax(0,1fr));
    gap: 8px;
    margin-top: 14px;
  }

  .answerButtons {
    display: grid;
    grid-template-columns: repeat(4,minmax(0,1fr));
    gap: 8px;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eaecf0;
  }

  .answerBtn {
    min-height: 42px;
    border: 1px solid #d0d5dd;
    border-radius: 10px;
    background: #fff;
    color: #475467;
    font-weight: 850;
  }

  .selectedAnswer.option-UYGUN {
    border-color: #12b76a;
    background: #ecfdf3;
    color: #027a48;
  }

  .selectedAnswer.option-KISMEN_UYGUN {
    border-color: #f79009;
    background: #fffaeb;
    color: #b54708;
  }

  .selectedAnswer.option-UYGUNSUZ {
    border-color: #f04438;
    background: #fef3f2;
    color: #b42318;
  }

  .selectedAnswer.option-UYGULANAMAZ {
    border-color: #98a2b3;
    background: #f2f4f7;
    color: #344054;
  }

  .formGrid {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 10px;
    margin-top: 14px;
  }

  .field {
    display: grid;
    gap: 6px;
  }

  .field.full {
    grid-column: 1 / -1;
  }

  .field span {
    color: #475467;
    font-size: 11px;
    font-weight: 850;
  }

  .actionBox {
    display: grid;
    gap: 10px;
    margin-top: 14px;
    padding: 14px;
    border: 1px solid #fedf89;
    border-radius: 12px;
    background: #fffcf5;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #7a2e0e;
    font-size: 12px;
    font-weight: 800;
  }

  .findingHint {
    padding: 9px 10px;
    border-radius: 8px;
    background: #fff;
    color: #667085;
    font-size: 11px;
  }

  .cardFooter {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 15px;
    padding-top: 13px;
    border-top: 1px solid #eaecf0;
  }

  .cardFooter span {
    color: #98a2b3;
    font-size: 10px;
  }

  .empty,
  .loadingCard,
  .errorBox {
    padding: 30px;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    background: #fff;
    text-align: center;
    color: #667085;
  }

  .errorBox {
    margin-bottom: 12px;
    border-color: #fecdca;
    background: #fef3f2;
    color: #b42318;
  }

  .findingHint { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
  .findingHint strong { color:#027a48; }
  .findingBtn { border:1px solid #b42318; border-radius:9px; padding:9px 12px; background:#fff; color:#b42318; font-weight:850; }
  .modalBackdrop { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:20px; background:rgba(15,23,42,.55); }
  .findingModal { width:min(720px,100%); max-height:90vh; overflow:auto; padding:20px; border-radius:18px; background:#fff; box-shadow:0 24px 70px rgba(15,23,42,.25); }
  .modalHeader,.modalFooter { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .modalHeader h2 { margin:5px 0 0; }
  .modalGrid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:18px; }
  .modalGrid select { width:100%; box-sizing:border-box; border:1px solid #d0d5dd; border-radius:10px; background:#fff; padding:10px 11px; }
  .modalFooter { margin-top:18px; padding-top:14px; border-top:1px solid #eaecf0; justify-content:flex-end; }

  @media (max-width: 1200px) {
    .infoGrid {
      grid-template-columns: repeat(3,1fr);
    }

    .kpiGrid {
      grid-template-columns: repeat(4,1fr);
    }

    .detailGrid {
      grid-template-columns: repeat(2,1fr);
    }
  }

  @media (max-width: 760px) {
    .page {
      padding: 13px;
    }

    .hero {
      flex-direction: column;
    }

    .infoGrid,
    .kpiGrid,
    .contextCard,
    .toolbar,
    .formGrid,
    .detailGrid,
    .answerButtons {
      grid-template-columns: 1fr;
    }

    .questionHeader {
      grid-template-columns: 36px 1fr;
    }

    .badges {
      grid-column: 1 / -1;
      justify-content: flex-start;
    }

    .cardFooter {
      align-items: stretch;
      flex-direction: column;
    }
  }
`;