import { NextResponse } from "next/server";
import {
  deny,
  getAccess,
  getSupabase,
  resolveFirmId,
} from "../_shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type UnknownRow = Record<string, any>;

const ANONYMOUS_THRESHOLD = 5;

function safeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function safeText(value: unknown) {
  return String(value ?? "").trim();
}

function errorMessage(cause: unknown) {
  if (cause instanceof Error) {
    return cause.message;
  }

  if (
    cause &&
    typeof cause === "object" &&
    "message" in cause
  ) {
    return safeText(
      (cause as { message?: unknown }).message
    );
  }

  return "Anket merkezi yüklenemedi.";
}

function severityRank(value: unknown) {
  switch (safeText(value).toUpperCase()) {
    case "CRITICAL":
      return 4;
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 1;
    default:
      return 0;
  }
}

function highestSeverity(
  current: string,
  incoming: string
) {
  return severityRank(incoming) >
    severityRank(current)
    ? incoming
    : current;
}

function formatAnswerValue(params: {
  answer: UnknownRow;
  optionMap: Map<string, UnknownRow>;
}) {
  const { answer, optionMap } = params;

  const optionIds = Array.isArray(
    answer.option_ids
  )
    ? answer.option_ids.map(String)
    : [];

  const selectedLabels = optionIds
    .map((id) => optionMap.get(id)?.label)
    .filter(Boolean)
    .map(String);

  if (selectedLabels.length > 0) {
    return selectedLabels.join(", ");
  }

  if (safeText(answer.text_value)) {
    return safeText(answer.text_value);
  }

  if (
    answer.number_value !== null &&
    answer.number_value !== undefined
  ) {
    return String(answer.number_value);
  }

  if (safeText(answer.date_value)) {
    return safeText(answer.date_value);
  }

  return "Yanıt verilmedi";
}

export async function GET(request: Request) {
  try {
    const access = await getAccess();

    if (!access.allowed) {
      return deny();
    }

    const url = new URL(request.url);

    const firmId = resolveFirmId(
      url.searchParams.get("firmId") ||
        access.companyId,
      access
    );

    if (!firmId) {
      return deny(
        403,
        "Firma erişimi doğrulanamadı."
      );
    }

    const supabase = getSupabase();

    /*
     * Önce yalnızca erişilen firmaya ait
     * anketleri alıyoruz. Sonraki bütün
     * sorgular bu anket kimlikleriyle
     * sınırlandırılır.
     */
    const {
      data: surveyRows,
      error: surveyError,
    } = await supabase
      .from("employee_surveys")
      .select(
        `
        id,
        firm_id,
        title,
        description,
        category,
        status,
        is_anonymous,
        minimum_anonymous_group_size,
        starts_at,
        ends_at,
        created_at
        `
      )
      .eq("firm_id", firmId)
      .is("deleted_at", null)
      .order("created_at", {
        ascending: false,
      });

    if (surveyError) {
      throw surveyError;
    }

    const rawSurveys =
      Array.isArray(surveyRows)
        ? surveyRows
        : [];

    const surveyIds = rawSurveys.map(
      (survey) => String(survey.id)
    );

    if (surveyIds.length === 0) {
      return NextResponse.json({
        success: true,
        anonymousThreshold:
          ANONYMOUS_THRESHOLD,
        surveys: [],
        responses: [],
        analytics: [],
        findings: [],
        actions: [],
        reportSummary: {
          surveyCount: 0,
          activeSurveyCount: 0,
          targetCount: 0,
          responseCount: 0,
          participationRate: 0,
          averageRiskScore: 0,
          negativeAnswerCount: 0,
          criticalFindingCount: 0,
          openActionCount: 0,
        },
      });
    }

    const [
      questionsResult,
      optionsResult,
      dispatchesResult,
      responsesResult,
      findingsResult,
      actionsResult,
    ] = await Promise.all([
      supabase
        .from("employee_survey_questions")
        .select(
          `
          id,
          survey_id,
          position,
          question_text,
          question_type,
          is_required,
          weight,
          help_text
          `
        )
        .in("survey_id", surveyIds)
        .order("position", {
          ascending: true,
        }),

      supabase
        .from("employee_survey_options")
        .select(
          `
          id,
          question_id,
          label,
          value,
          position,
          risk_level,
          risk_points
          `
        )
        .order("position", {
          ascending: true,
        }),

      supabase
        .from("employee_survey_dispatches")
        .select(
          `
          id,
          survey_id,
          employee_id,
          channel,
          target_snapshot,
          sent_at,
          opened_at,
          completed_at,
          revoked_at
          `
        )
        .eq("firm_id", firmId)
        .in("survey_id", surveyIds),

      supabase
        .from("employee_survey_responses")
        .select(
          `
          id,
          survey_id,
          dispatch_id,
          employee_id,
          segment_snapshot,
          started_at,
          submitted_at,
          risk_score,
          negative_answer_count,
          is_flagged
          `
        )
        .eq("firm_id", firmId)
        .in("survey_id", surveyIds)
        .not("submitted_at", "is", null)
        .order("submitted_at", {
          ascending: false,
        }),

      supabase
        .from("employee_survey_findings")
        .select(
          `
          id,
          survey_id,
          question_id,
          severity,
          title,
          description,
          segment,
          negative_rate,
          response_count,
          status,
          detected_at
          `
        )
        .eq("firm_id", firmId)
        .in("survey_id", surveyIds)
        .neq("status", "CLOSED")
        .order("detected_at", {
          ascending: false,
        }),

      supabase
        .from("employee_survey_actions")
        .select(
          `
          id,
          finding_id,
          title,
          description,
          owner_user_id,
          due_date,
          priority,
          status,
          created_at,
          completed_at,
          verified_at
          `
        )
        .eq("firm_id", firmId)
        .order("created_at", {
          ascending: false,
        }),
    ]);

    const firstError = [
      questionsResult,
      optionsResult,
      dispatchesResult,
      responsesResult,
      findingsResult,
      actionsResult,
    ].find((result) => result.error)?.error;

    if (firstError) {
      throw firstError;
    }

    const questions =
      questionsResult.data || [];

    const questionIds = questions.map(
      (question) => String(question.id)
    );

    /*
     * Seçenekler bütün tablo üzerinden gelmiş
     * olabilir. Yalnızca bu firmaya ait
     * soruların seçeneklerini tutuyoruz.
     */
    const questionIdSet = new Set(
      questionIds
    );

    const options = (
      optionsResult.data || []
    ).filter((option) =>
      questionIdSet.has(
        String(option.question_id)
      )
    );

    const dispatches =
      dispatchesResult.data || [];

    const responses =
      responsesResult.data || [];

    const responseIds = responses.map(
      (response) => String(response.id)
    );

    let answers: UnknownRow[] = [];

    if (responseIds.length > 0) {
      const {
        data: answerRows,
        error: answerError,
      } = await supabase
        .from("employee_survey_answers")
        .select(
          `
          id,
          response_id,
          question_id,
          option_ids,
          text_value,
          number_value,
          date_value,
          risk_level,
          risk_points
          `
        )
        .in("response_id", responseIds);

      if (answerError) {
        throw answerError;
      }

      answers = answerRows || [];
    }

    const surveyMap = new Map(
      rawSurveys.map((survey) => [
        String(survey.id),
        survey,
      ])
    );

    const questionMap = new Map(
      questions.map((question) => [
        String(question.id),
        question,
      ])
    );

    const optionMap = new Map(
      options.map((option) => [
        String(option.id),
        option,
      ])
    );

    const dispatchMap = new Map(
      dispatches.map((dispatch) => [
        String(dispatch.id),
        dispatch,
      ])
    );

    const answersByResponse = new Map<
      string,
      UnknownRow[]
    >();

    for (const answer of answers) {
      const responseId = String(
        answer.response_id
      );

      const current =
        answersByResponse.get(responseId) ||
        [];

      current.push(answer);

      answersByResponse.set(
        responseId,
        current
      );
    }

    const surveys = rawSurveys.map(
      (survey) => {
        const surveyId = String(
          survey.id
        );

        const ownQuestions =
          questions.filter(
            (question) =>
              String(question.survey_id) ===
              surveyId
          );

        const ownDispatches =
          dispatches.filter(
            (dispatch) =>
              String(dispatch.survey_id) ===
              surveyId &&
              !dispatch.revoked_at
          );

        const ownResponses =
          responses.filter(
            (response) =>
              String(response.survey_id) ===
              surveyId
          );

        const questionCount =
          ownQuestions.length;

        const targetCount =
          ownDispatches.length;

        const responseCount =
          ownResponses.length;

        const riskScore =
          responseCount > 0
            ? ownResponses.reduce(
                (total, response) =>
                  total +
                  safeNumber(
                    response.risk_score
                  ),
                0
              ) / responseCount
            : 0;

        const negativeAnswerCount =
          ownResponses.reduce(
            (total, response) =>
              total +
              safeNumber(
                response.negative_answer_count
              ),
            0
          );

        const negativeRate =
          questionCount > 0 &&
          responseCount > 0
            ? (negativeAnswerCount * 100) /
              (questionCount *
                responseCount)
            : 0;

        const participationRate =
          targetCount > 0
            ? (responseCount * 100) /
              targetCount
            : 0;

        const threshold = Math.max(
          ANONYMOUS_THRESHOLD,
          safeNumber(
            survey.minimum_anonymous_group_size
          )
        );

        return {
          id: surveyId,
          title: survey.title,
          description:
            survey.description || "",
          category: survey.category,
          status: survey.status,
          anonymous:
            survey.is_anonymous === true,
          anonymousThreshold:
            threshold,
          anonymousUnlocked:
            survey.is_anonymous !== true ||
            responseCount >= threshold,
          remainingForAnalysis:
            survey.is_anonymous === true
              ? Math.max(
                  0,
                  threshold - responseCount
                )
              : 0,
          questionCount,
          targetCount,
          responseCount,
          participationRate,
          negativeAnswerCount,
          negativeRate,
          riskScore,
          startsAt: survey.starts_at,
          endsAt: survey.ends_at,
          createdAt: survey.created_at,
        };
      }
    );

    /*
     * YANIT HAVUZU
     *
     * Anonim ankette eşik dolmadan cevap
     * içeriği gönderilmez. Böylece frontend
     * kaynak kodundan veya Network ekranından
     * tek kişinin cevabı görülemez.
     */
    const responseDetails = responses.map(
      (response) => {
        const survey = surveyMap.get(
          String(response.survey_id)
        );

        const surveySummary =
          surveys.find(
            (item) =>
              item.id ===
              String(response.survey_id)
          );

        const anonymous =
          survey?.is_anonymous === true;

        const unlocked =
          !anonymous ||
          surveySummary?.anonymousUnlocked ===
            true;

        const dispatch = response.dispatch_id
          ? dispatchMap.get(
              String(response.dispatch_id)
            )
          : null;

        const responseAnswers =
          answersByResponse.get(
            String(response.id)
          ) || [];

        return {
          id: String(response.id),
          surveyId: String(
            response.survey_id
          ),
          surveyTitle:
            survey?.title || "Anket",
          anonymous,
          locked: !unlocked,
          participantName: anonymous
            ? "Anonim Katılımcı"
            : safeText(
                dispatch?.target_snapshot
                  ?.fullName
              ) || "Çalışan",
          participantEmail: anonymous
            ? ""
            : safeText(
                dispatch?.target_snapshot?.email
              ),
          jobTitle: safeText(
            response.segment_snapshot
              ?.jobTitle ||
              dispatch?.target_snapshot
                ?.jobTitle
          ),
          submittedAt:
            response.submitted_at,
          riskScore: safeNumber(
            response.risk_score
          ),
          negativeAnswerCount:
            safeNumber(
              response.negative_answer_count
            ),
          flagged:
            response.is_flagged === true,
          answers: unlocked
            ? responseAnswers
                .map((answer) => {
                  const question =
                    questionMap.get(
                      String(
                        answer.question_id
                      )
                    );

                  return {
                    id: String(answer.id),
                    questionId: String(
                      answer.question_id
                    ),
                    position: safeNumber(
                      question?.position
                    ),
                    question:
                      question?.question_text ||
                      "Soru",
                    questionType:
                      question?.question_type ||
                      "",
                    answer:
                      formatAnswerValue({
                        answer,
                        optionMap,
                      }),
                    optionIds:
                      Array.isArray(
                        answer.option_ids
                      )
                        ? answer.option_ids.map(
                            String
                          )
                        : [],
                    textValue:
                      answer.text_value,
                    numberValue:
                      answer.number_value,
                    dateValue:
                      answer.date_value,
                    riskLevel:
                      answer.risk_level ||
                      "NONE",
                    riskPoints:
                      safeNumber(
                        answer.risk_points
                      ),
                  };
                })
                .sort(
                  (a, b) =>
                    a.position -
                    b.position
                )
            : [],
        };
      }
    );

    /*
     * SORU BAZLI ANALİZ
     */
    const analytics = surveys.map(
      (survey) => {
        const surveyQuestions =
          questions.filter(
            (question) =>
              String(question.survey_id) ===
              survey.id
          );

        const surveyResponses =
          responses.filter(
            (response) =>
              String(response.survey_id) ===
              survey.id
          );

        const surveyResponseIds =
          new Set(
            surveyResponses.map(
              (response) =>
                String(response.id)
            )
          );

        const locked =
          survey.anonymous &&
          !survey.anonymousUnlocked;

        const questionAnalytics =
          surveyQuestions.map(
            (question) => {
              const questionId = String(
                question.id
              );

              const questionOptions =
                options.filter(
                  (option) =>
                    String(
                      option.question_id
                    ) === questionId
                );

              const questionAnswers =
                answers.filter(
                  (answer) =>
                    String(
                      answer.question_id
                    ) === questionId &&
                    surveyResponseIds.has(
                      String(
                        answer.response_id
                      )
                    )
                );

              let negativeCount = 0;
              let totalRisk = 0;
              let highest = "NONE";

              for (const answer of questionAnswers) {
                const riskPoints =
                  safeNumber(
                    answer.risk_points
                  );

                totalRisk += riskPoints;

                if (riskPoints > 0) {
                  negativeCount += 1;
                }

                highest = highestSeverity(
                  highest,
                  safeText(
                    answer.risk_level
                  ).toUpperCase()
                );
              }

              const optionDistribution =
                questionOptions.map(
                  (option) => {
                    const count =
                      questionAnswers.filter(
                        (answer) =>
                          Array.isArray(
                            answer.option_ids
                          ) &&
                          answer.option_ids
                            .map(String)
                            .includes(
                              String(option.id)
                            )
                      ).length;

                    return {
                      optionId: String(
                        option.id
                      ),
                      label: option.label,
                      count,
                      percentage:
                        questionAnswers.length >
                        0
                          ? (count * 100) /
                            questionAnswers.length
                          : 0,
                      riskLevel:
                        option.risk_level ||
                        "NONE",
                      riskPoints:
                        safeNumber(
                          option.risk_points
                        ),
                    };
                  }
                );

              const textResponses =
                locked
                  ? []
                  : questionAnswers
                      .map((answer) =>
                        safeText(
                          answer.text_value
                        )
                      )
                      .filter(Boolean);

              return {
                questionId,
                position:
                  safeNumber(
                    question.position
                  ),
                question:
                  question.question_text,
                questionType:
                  question.question_type,
                weight:
                  safeNumber(
                    question.weight
                  ),
                responseCount:
                  questionAnswers.length,
                negativeCount,
                negativeRate:
                  questionAnswers.length > 0
                    ? (negativeCount * 100) /
                      questionAnswers.length
                    : 0,
                averageRisk:
                  questionAnswers.length > 0
                    ? totalRisk /
                      questionAnswers.length
                    : 0,
                highestRiskLevel: highest,
                optionDistribution:
                  locked
                    ? []
                    : optionDistribution,
                textResponses,
              };
            }
          );

        return {
          surveyId: survey.id,
          surveyTitle: survey.title,
          anonymous:
            survey.anonymous,
          locked,
          anonymousThreshold:
            survey.anonymousThreshold,
          responseCount:
            survey.responseCount,
          remainingForAnalysis:
            survey.remainingForAnalysis,
          participationRate:
            survey.participationRate,
          riskScore:
            survey.riskScore,
          negativeRate:
            survey.negativeRate,
          questions:
            questionAnalytics.sort(
              (a, b) =>
                a.position - b.position
            ),
        };
      }
    );

    /*
     * KAYITLI BULGULAR
     */
    const storedFindings = (
      findingsResult.data || []
    ).map((finding) => {
      const survey = surveyMap.get(
        String(finding.survey_id)
      );

      return {
        id: String(finding.id),
        source: "STORED",
        surveyId: String(
          finding.survey_id
        ),
        surveyTitle:
          survey?.title || "Anket",
        questionId: finding.question_id
          ? String(finding.question_id)
          : null,
        question: finding.title,
        description:
          finding.description || "",
        negativeRate: safeNumber(
          finding.negative_rate
        ),
        responseCount: safeNumber(
          finding.response_count
        ),
        severity:
          finding.severity || "MEDIUM",
        status: finding.status || "OPEN",
        segment:
          finding.segment &&
          Object.keys(
            finding.segment
          ).length > 0
            ? Object.values(
                finding.segment
              )
                .filter(Boolean)
                .join(" / ")
            : "",
        detectedAt:
          finding.detected_at,
      };
    });

    /*
     * Henüz finding tablosuna yazılmamış
     * MEDIUM/HIGH/CRITICAL cevapları da
     * analizden türetiyoruz.
     */
    const storedFindingKeys = new Set(
      storedFindings.map(
        (finding) =>
          `${finding.surveyId}:${finding.questionId}:${finding.severity}`
      )
    );

    const derivedFindings: UnknownRow[] =
      [];

    for (const surveyAnalysis of analytics) {
      for (const question of surveyAnalysis.questions) {
        if (
          ![
            "MEDIUM",
            "HIGH",
            "CRITICAL",
          ].includes(
            question.highestRiskLevel
          )
        ) {
          continue;
        }

        const key =
          `${surveyAnalysis.surveyId}:` +
          `${question.questionId}:` +
          `${question.highestRiskLevel}`;

        if (storedFindingKeys.has(key)) {
          continue;
        }

        derivedFindings.push({
          id: `DERIVED-${key}`,
          source: "DERIVED",
          surveyId:
            surveyAnalysis.surveyId,
          surveyTitle:
            surveyAnalysis.surveyTitle,
          questionId:
            question.questionId,
          question:
            question.question,
          description:
            `${question.responseCount} yanıt içinde ` +
            `${question.negativeCount} riskli cevap tespit edildi.`,
          negativeRate:
            question.negativeRate,
          responseCount:
            question.responseCount,
          severity:
            question.highestRiskLevel,
          status: "OPEN",
          segment: "",
          detectedAt: null,
        });
      }
    }

    const findings = [
      ...storedFindings,
      ...derivedFindings,
    ].sort((a, b) => {
      const severityDifference =
        severityRank(b.severity) -
        severityRank(a.severity);

      if (severityDifference !== 0) {
        return severityDifference;
      }

      return (
        safeNumber(b.negativeRate) -
        safeNumber(a.negativeRate)
      );
    });

    const actions = (
      actionsResult.data || []
    ).map((action) => ({
      id: String(action.id),
      findingId: action.finding_id
        ? String(action.finding_id)
        : null,
      title: action.title,
      description:
        action.description || "",
      owner:
        action.owner_user_id || "",
      dueDate: action.due_date || "",
      priority:
        action.priority || "MEDIUM",
      status: action.status || "OPEN",
      createdAt: action.created_at,
      completedAt:
        action.completed_at,
      verifiedAt: action.verified_at,
    }));

    const targetCount = surveys.reduce(
      (total, survey) =>
        total + survey.targetCount,
      0
    );

    const responseCount =
      surveys.reduce(
        (total, survey) =>
          total + survey.responseCount,
        0
      );

    const totalRisk = responses.reduce(
      (total, response) =>
        total +
        safeNumber(response.risk_score),
      0
    );

    const reportSummary = {
      surveyCount: surveys.length,
      activeSurveyCount:
        surveys.filter(
          (survey) =>
            survey.status === "ACTIVE"
        ).length,
      targetCount,
      responseCount,
      participationRate:
        targetCount > 0
          ? (responseCount * 100) /
            targetCount
          : 0,
      averageRiskScore:
        responses.length > 0
          ? totalRisk / responses.length
          : 0,
      negativeAnswerCount:
        responses.reduce(
          (total, response) =>
            total +
            safeNumber(
              response.negative_answer_count
            ),
          0
        ),
      criticalFindingCount:
        findings.filter(
          (finding) =>
            finding.severity ===
            "CRITICAL"
        ).length,
      openActionCount:
        actions.filter(
          (action) =>
            ![
              "COMPLETED",
              "VERIFIED",
              "CANCELLED",
            ].includes(action.status)
        ).length,
    };

    return NextResponse.json({
      success: true,
      anonymousThreshold:
        ANONYMOUS_THRESHOLD,
      surveys,
      responses: responseDetails,
      analytics,
      findings,
      actions,
      reportSummary,
    });
  } catch (cause) {
    console.error(
      "EMPLOYEE SURVEY DASHBOARD ERROR:",
      cause
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage(cause),
      },
      { status: 500 }
    );
  }
}