import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_KEY = "dsec_mobile_123";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(req: Request) {
  try {
    const apiKey = clean(
      req.headers.get("x-api-key")
    );

    if (apiKey !== API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Yetkisiz istek.",
        },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const firmId = clean(
      url.searchParams.get("firmId")
    );

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "firmId zorunlu.",
        },
        { status: 400 }
      );
    }

    const scope = clean(
      url.searchParams.get("scope")
    ).toLowerCase();

    const includeAllStatuses =
      scope === "library" ||
      scope === "documentation";

    const supabase = getSupabase();

    let query = supabase
      .from("inspection_forms")
      .select(
        `
        id,
        firm_id,
        visibility,
        title,
        code,
        category,
        form_type,
        audit_modes,
        description,
        version_no,
        status,
        prepared_by,
        approved_by,
        item_count,
        published_at,
        updated_at,
        items:inspection_form_items(
          id,
          order_no,
          title,
          question,
          expected_condition,
          required_action,
          legal_reference,
          risk_level,
          photo_required,
          explanation_required,
          action_required,
          score,
          weight,
          answer_options
        )
        `
      )
      .eq("deleted", false)
      .or(
        `firm_id.eq.${firmId},visibility.eq.GLOBAL`
      );

    if (!includeAllStatuses) {
      query = query.eq(
        "status",
        "PUBLISHED"
      );
    }

    const { data, error } =
      await query.order(
        "updated_at",
        {
          ascending: false,
        }
      );

    if (error) {
      throw new Error(error.message);
    }

    const forms = (data ?? []).map((form) => ({
      id: clean(form.id),
      firmId: clean(form.firm_id),
      visibility: clean(form.visibility),
      title: clean(form.title),
      code: clean(form.code),
      category: clean(form.category),
      formType: clean(form.form_type),
      auditModes:
        Array.isArray(
          form.audit_modes
        ) &&
        form.audit_modes.length
          ? form.audit_modes
              .map((item: unknown) =>
                clean(item).toUpperCase()
              )
          : [
              "CLASSIC",
              "PHOTO",
              "SCORING",
              "ELMERI",
            ],
      description: clean(form.description),
      versionNo: Number(form.version_no || 1),
      status: clean(form.status),
      preparedBy: clean(form.prepared_by),
      approvedBy: clean(form.approved_by),
      itemCount: Number(form.item_count || 0),
      publishedAt: clean(form.published_at),
      updatedAt: clean(form.updated_at),

      items: (
        Array.isArray(form.items)
          ? form.items
          : []
      )
        .sort(
          (
            first: { order_no?: number },
            second: { order_no?: number }
          ) =>
            Number(first.order_no || 0) -
            Number(second.order_no || 0)
        )
        .map((item: any) => ({
          id: clean(item.id),
          orderNo: Number(item.order_no || 0),
          title: clean(item.title),
          question: clean(item.question),
          expectedCondition: clean(
            item.expected_condition
          ),
          requiredAction: clean(
            item.required_action
          ),
          legalReference: clean(
            item.legal_reference
          ),
          riskLevel: clean(item.risk_level),
          photoRequired:
            Boolean(item.photo_required),
          explanationRequired:
            Boolean(item.explanation_required),
          actionRequired:
            Boolean(item.action_required),
          score: Number(item.score || 0),
          weight: Number(item.weight || 1),
          answerOptions:
            Array.isArray(item.answer_options)
              ? item.answer_options
              : [
                  "COMPLIANT",
                  "PARTIAL",
                  "NON_COMPLIANT",
                  "NOT_APPLICABLE",
                ],
        })),
    }));

    return NextResponse.json({
      success: true,
      firmId,
      scope:
        includeAllStatuses
          ? "LIBRARY"
          : "PUBLISHED",
      count: forms.length,
      forms,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Yayınlanmış denetim formları alınamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}