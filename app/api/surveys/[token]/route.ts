import {
  createHash,
} from "crypto";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  NextResponse,
} from "next/server";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export const runtime =
  "nodejs";

type Context = {
  params: Promise<{
    token: string;
  }>;
};

type AnswerInput = {
  questionId?: unknown;
  optionIds?: unknown;
  textValue?: unknown;
  numberValue?: unknown;
  dateValue?: unknown;
};

type CalculatedAnswer = {
  question: any;
  answer:
    | AnswerInput
    | undefined;
  selectedOptionIds: string[];
  riskPoints: number;
  riskLevel: string;
};

function text(
  value: unknown
) {
  return String(value ?? "").trim();
}

function sha256(
  value: string
) {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

function getSupabase() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Sunucu yapılandırması eksik."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

function errorMessage(
  cause: unknown,
  fallback: string
) {
  if (cause instanceof Error) {
    return cause.message;
  }

  if (
    cause &&
    typeof cause === "object" &&
    "message" in cause
  ) {
    return text(
      (
        cause as {
          message?: unknown;
        }
      ).message
    );
  }

  return fallback;
}

function riskRank(
  value: unknown
) {
  switch (
    text(value).toUpperCase()
  ) {
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

function highestRiskLevel(
  values: unknown[]
) {
  let highest = "NONE";

  for (const value of values) {
    const normalized =
      text(value).toUpperCase();

    if (
      riskRank(normalized) >
      riskRank(highest)
    ) {
      highest = normalized;
    }
  }

  return highest;
}

async function resolveAccess(
  token: string
) {
  if (
    !/^[a-f0-9]{64}$/i.test(
      token
    )
  ) {
    return {
      error:
        "Geçersiz anket bağlantısı.",
      status: 400,
    } as const;
  }

  const supabase =
    getSupabase();

  const {
    data: dispatch,
    error: dispatchError,
  } = await supabase
    .from(
      "employee_survey_dispatches"
    )
    .select(
      `
      id,
      survey_id,
      firm_id,
      employee_id,
      target_snapshot,
      expires_at,
      opened_at,
      completed_at,
      revoked_at
      `
    )
    .eq(
      "token_hash",
      sha256(token)
    )
    .maybeSingle();

  if (
    dispatchError ||
    !dispatch
  ) {
    return {
      error:
        "Anket bağlantısı bulunamadı.",
      status: 404,
    } as const;
  }

  if (dispatch.revoked_at) {
    return {
      error:
        "Bu anket bağlantısı iptal edilmiştir.",
      status: 410,
    } as const;
  }

  if (
    new Date(
      dispatch.expires_at
    ).getTime() < Date.now()
  ) {
    return {
      error:
        "Anket bağlantısının süresi dolmuştur.",
      status: 410,
    } as const;
  }

  const {
    data: survey,
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
      starts_at,
      ends_at,
      allow_multiple
      `
    )
    .eq(
      "id",
      dispatch.survey_id
    )
    .is("deleted_at", null)
    .maybeSingle();

  if (
    surveyError ||
    !survey
  ) {
    return {
      error:
        "Anket bulunamadı.",
      status: 404,
    } as const;
  }

  if (
    survey.status !== "ACTIVE"
  ) {
    return {
      error:
        "Anket şu anda yanıt kabul etmiyor.",
      status: 409,
    } as const;
  }

  if (
    survey.starts_at &&
    new Date(
      survey.starts_at
    ).getTime() > Date.now()
  ) {
    return {
      error:
        "Anket henüz başlamadı.",
      status: 409,
    } as const;
  }

  if (
    survey.ends_at &&
    new Date(
      survey.ends_at
    ).getTime() < Date.now()
  ) {
    return {
      error:
        "Anketin katılım süresi sona erdi.",
      status: 410,
    } as const;
  }

  if (
    dispatch.completed_at &&
    !survey.allow_multiple
  ) {
    return {
      error:
        "Bu anket daha önce tamamlanmıştır.",
      status: 409,
      completed: true,
    } as const;
  }

  return {
    supabase,
    dispatch,
    survey,
  } as const;
}

export async function GET(
  _request: Request,
  context: Context
) {
  try {
    const {
      token,
    } = await context.params;

    const result =
      await resolveAccess(token);

    if ("error" in result) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          completed:
            "completed" in result
              ? result.completed
              : false,
        },
        {
          status: result.status,
        }
      );
    }

    const {
      supabase,
      dispatch,
      survey,
    } = result;

    const {
      data: questions,
      error: questionError,
    } = await supabase
      .from(
        "employee_survey_questions"
      )
      .select(
        `
        id,
        position,
        question_text,
        question_type,
        is_required,
        weight,
        help_text,
        employee_survey_options(
          id,
          label,
          value,
          position
        )
        `
      )
      .eq(
        "survey_id",
        survey.id
      )
      .order(
        "position",
        {
          ascending: true,
        }
      );

    if (questionError) {
      throw questionError;
    }

    if (!dispatch.opened_at) {
      await supabase
        .from(
          "employee_survey_dispatches"
        )
        .update({
          opened_at:
            new Date().toISOString(),
        })
        .eq("id", dispatch.id);
    }

    return NextResponse.json({
      success: true,

      survey: {
        id: survey.id,
        title: survey.title,
        description:
          survey.description,
        category:
          survey.category,
        anonymous:
          survey.is_anonymous,
        endsAt: survey.ends_at,
      },

      participant: {
        displayName:
          survey.is_anonymous
            ? null
            : dispatch
                .target_snapshot
                ?.fullName ||
              null,
      },

      questions: (
        questions || []
      ).map((question: any) => ({
        id: question.id,
        position:
          question.position,
        text:
          question.question_text,
        type:
          question.question_type,
        required:
          question.is_required,
        helpText:
          question.help_text,

        options: (
          question
            .employee_survey_options ||
          []
        )
          .sort(
            (
              first: any,
              second: any
            ) =>
              Number(
                first.position
              ) -
              Number(
                second.position
              )
          )
          .map(
            (option: any) => ({
              id: option.id,
              label:
                option.label,
              value:
                option.value,
            })
          ),
      })),
    });
  } catch (cause) {
    console.error(
      "SURVEY GET ERROR:",
      cause
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage(
          cause,
          "Anket açılamadı."
        ),
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request,
  context: Context
) {
  try {
    const {
      token,
    } = await context.params;

    const result =
      await resolveAccess(token);

    if ("error" in result) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          completed:
            "completed" in result
              ? result.completed
              : false,
        },
        {
          status: result.status,
        }
      );
    }

    const {
      supabase,
      dispatch,
      survey,
    } = result;

    const body =
      await request
        .json()
        .catch(() => ({}));

    const submitted: AnswerInput[] =
      Array.isArray(body.answers)
        ? body.answers
        : [];

    const {
      data: questions,
      error: questionError,
    } = await supabase
      .from(
        "employee_survey_questions"
      )
      .select(
        `
        id,
        question_text,
        question_type,
        is_required,
        weight,
        employee_survey_options(
          id,
          risk_level,
          risk_points
        )
        `
      )
      .eq(
        "survey_id",
        survey.id
      );

    if (questionError) {
      throw questionError;
    }

    if (
      !questions ||
      questions.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ankette yanıtlanacak soru bulunmuyor.",
        },
        {
          status: 409,
        }
      );
    }

    const answerByQuestion =
      new Map<
        string,
        AnswerInput
      >(
        submitted.map(
          (answer) => [
            text(
              answer.questionId
            ),
            answer,
          ]
        )
      );

    /*
     * Zorunlu soru kontrolü.
     */
    for (
      const question of questions
    ) {
      const answer =
        answerByQuestion.get(
          String(question.id)
        );

      const optionIds =
        Array.isArray(
          answer?.optionIds
        )
          ? answer.optionIds
              .map(text)
              .filter(Boolean)
          : [];

      const hasNumber =
        answer?.numberValue !==
          null &&
        answer?.numberValue !==
          undefined &&
        answer?.numberValue !== "";

      const hasValue =
        optionIds.length > 0 ||
        Boolean(
          text(
            answer?.textValue
          )
        ) ||
        hasNumber ||
        Boolean(
          text(
            answer?.dateValue
          )
        );

      if (
        question.is_required &&
        !hasValue
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              `“${question.question_text}” sorusu zorunludur.`,
          },
          {
            status: 400,
          }
        );
      }
    }

    let weightedRisk = 0;
    let maximumWeightedRisk = 0;
    let negativeCount = 0;
    let flagged = false;

    const calculated: CalculatedAnswer[] =
      questions.map(
        (question: any) => {
          const answer =
            answerByQuestion.get(
              String(question.id)
            );

          const selectedOptionIds =
            Array.isArray(
              answer?.optionIds
            )
              ? answer.optionIds
                  .map(text)
                  .filter(Boolean)
              : [];

          const options =
            Array.isArray(
              question
                .employee_survey_options
            )
              ? question
                  .employee_survey_options
              : [];

          const chosenOptions =
            options.filter(
              (option: any) =>
                selectedOptionIds.includes(
                  String(option.id)
                )
            );

          const riskPoints =
            chosenOptions.length > 0
              ? Math.max(
                  ...chosenOptions.map(
                    (option: any) =>
                      Number(
                        option.risk_points ||
                          0
                      )
                  )
                )
              : 0;

          const riskLevel =
            highestRiskLevel(
              chosenOptions.map(
                (option: any) =>
                  option.risk_level
              )
            );

          const weight =
            Math.max(
              1,
              Number(
                question.weight || 1
              )
            );

          weightedRisk +=
            riskPoints * weight;

          maximumWeightedRisk +=
            100 * weight;

          if (
            riskRank(riskLevel) >=
            riskRank("MEDIUM")
          ) {
            negativeCount += 1;
          }

          if (
            riskLevel === "HIGH" ||
            riskLevel ===
              "CRITICAL"
          ) {
            flagged = true;
          }

          return {
            question,
            answer,
            selectedOptionIds,
            riskPoints,
            riskLevel,
          };
        }
      );

    const riskScore =
      maximumWeightedRisk > 0
        ? (weightedRisk * 100) /
          maximumWeightedRisk
        : 0;

    /*
     * Önce response kaydı oluşturulur.
     * Anonim ankette çalışan kimliği
     * kesinlikle response tablosuna
     * yazılmaz.
     */
    const {
      data: responseRow,
      error: responseError,
    } = await supabase
      .from(
        "employee_survey_responses"
      )
      .insert({
        survey_id: survey.id,
        firm_id: survey.firm_id,
        dispatch_id: dispatch.id,

        employee_id:
          survey.is_anonymous
            ? null
            : dispatch.employee_id,

        segment_snapshot: {
          jobTitle:
            dispatch.target_snapshot
              ?.jobTitle ||
            null,
        },

        submitted_at:
          new Date().toISOString(),

        risk_score:
          Math.min(
            100,
            Math.max(
              0,
              riskScore
            )
          ),

        negative_answer_count:
          negativeCount,

        is_flagged: flagged,
      })
      .select("id")
      .single();

    if (
      responseError ||
      !responseRow?.id
    ) {
      throw (
        responseError ||
        new Error(
          "Yanıt kaydı oluşturulamadı."
        )
      );
    }

    const answerRows =
      calculated.map(
        ({
          question,
          answer,
          selectedOptionIds,
          riskPoints,
          riskLevel,
        }) => ({
          response_id:
            responseRow.id,

          question_id:
            question.id,

          option_ids:
            selectedOptionIds,

          text_value:
            text(
              answer?.textValue
            ) || null,

          number_value:
            answer?.numberValue ===
              "" ||
            answer?.numberValue ===
              undefined ||
            answer?.numberValue ===
              null
              ? null
              : Number(
                  answer.numberValue
                ),

          date_value:
            text(
              answer?.dateValue
            ) || null,

          risk_level:
            riskLevel,

          risk_points:
            riskPoints,
        })
      );

    const {
      error: answerError,
    } = await supabase
      .from(
        "employee_survey_answers"
      )
      .insert(answerRows);

    if (answerError) {
      /*
       * Cevaplar eklenemezse yarım
       * response kaydını temizleriz.
       */
      await supabase
        .from(
          "employee_survey_responses"
        )
        .delete()
        .eq(
          "id",
          responseRow.id
        );

      throw answerError;
    }

    await supabase
      .from(
        "employee_survey_dispatches"
      )
      .update({
        completed_at:
          new Date().toISOString(),
      })
      .eq("id", dispatch.id);

    /*
     * MEDIUM, HIGH ve CRITICAL
     * cevapları soru bazında toplu
     * bulguya dönüştürür.
     */
    const riskyAnswers =
      calculated.filter(
        (item) =>
          [
            "MEDIUM",
            "HIGH",
            "CRITICAL",
          ].includes(
            item.riskLevel
          )
      );

    for (
      const riskyAnswer of riskyAnswers
    ) {
      const questionId =
        String(
          riskyAnswer.question.id
        );

      const {
        data: questionAnswers,
        error:
          questionAnswersError,
      } = await supabase
        .from(
          "employee_survey_answers"
        )
        .select(
          `
          risk_level,
          risk_points,
          employee_survey_responses!inner(
            survey_id,
            submitted_at
          )
          `
        )
        .eq(
          "question_id",
          questionId
        )
        .eq(
          "employee_survey_responses.survey_id",
          survey.id
        )
        .not(
          "employee_survey_responses.submitted_at",
          "is",
          null
        );

      if (
        questionAnswersError
      ) {
        console.error(
          "SURVEY FINDING ANALYSIS ERROR:",
          questionAnswersError
        );

        continue;
      }

      const allQuestionAnswers =
        questionAnswers || [];

      const riskyQuestionAnswers =
        allQuestionAnswers.filter(
          (answer: any) =>
            riskRank(
              answer.risk_level
            ) >=
            riskRank("MEDIUM")
        );

      const severity =
        highestRiskLevel(
          riskyQuestionAnswers.map(
            (answer: any) =>
              answer.risk_level
          )
        );

      const responseCount =
        allQuestionAnswers.length;

      const negativeCountForQuestion =
        riskyQuestionAnswers.length;

      const negativeRate =
        responseCount > 0
          ? (negativeCountForQuestion *
              100) /
            responseCount
          : 0;

      const {
        data: existingFinding,
        error:
          existingFindingError,
      } = await supabase
        .from(
          "employee_survey_findings"
        )
        .select(
          "id,status,severity"
        )
        .eq(
          "firm_id",
          survey.firm_id
        )
        .eq(
          "survey_id",
          survey.id
        )
        .eq(
          "question_id",
          questionId
        )
        .in(
          "status",
          [
            "OPEN",
            "REVIEWING",
            "ACTIONED",
          ]
        )
        .order(
          "detected_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

      if (
        existingFindingError
      ) {
        console.error(
          "SURVEY FINDING CHECK ERROR:",
          existingFindingError
        );

        continue;
      }

      const findingPayload = {
        severity:
          severity === "NONE"
            ? riskyAnswer.riskLevel
            : severity,

        title:
          riskyAnswer.question
            .question_text,

        description:
          `${responseCount} yanıt içinde ` +
          `${negativeCountForQuestion} adet ` +
          `MEDIUM/HIGH/CRITICAL seviyesinde riskli cevap tespit edilmiştir.`,

        segment: {
          jobTitle:
            dispatch.target_snapshot
              ?.jobTitle ||
            null,
        },

        negative_rate:
          negativeRate,

        response_count:
          responseCount,
      };

      if (
        existingFinding?.id
      ) {
        await supabase
          .from(
            "employee_survey_findings"
          )
          .update({
            ...findingPayload,

            status:
              existingFinding.status ||
              "OPEN",
          })
          .eq(
            "id",
            existingFinding.id
          );
      } else {
        await supabase
          .from(
            "employee_survey_findings"
          )
          .insert({
            firm_id:
              survey.firm_id,

            survey_id:
              survey.id,

            question_id:
              questionId,

            ...findingPayload,

            status: "OPEN",
          });
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Yanıtlarınız güvenli şekilde kaydedildi.",
    });
  } catch (cause) {
    console.error(
      "SURVEY POST ERROR:",
      cause
    );

    return NextResponse.json(
      {
        success: false,
        error: errorMessage(
          cause,
          "Yanıtlar kaydedilemedi."
        ),
      },
      {
        status: 500,
      }
    );
  }
}