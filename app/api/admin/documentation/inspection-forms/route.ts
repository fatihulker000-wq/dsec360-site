import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ItemInput = {
  orderNo?: number;
  title?: string;
  question?: string;
  expectedCondition?: string;
  requiredAction?: string;
  legalReference?: string;
  riskLevel?: string;
  photoRequired?: boolean;
  explanationRequired?: boolean;
  actionRequired?: boolean;
  score?: number;
  weight?: number;
};

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase ortam değişkenleri eksik.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const clean = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const bool = (v: unknown) =>
  typeof v === "boolean"
    ? v
    : ["1", "true", "evet"].includes(clean(v).toLocaleLowerCase("tr-TR"));

function normalizeItem(item: ItemInput, index: number) {
  const risk = clean(item.riskLevel).toUpperCase();
  return {
    order_no: num(item.orderNo, index + 1) || index + 1,
    title: clean(item.title),
    question: clean(item.question) || "Denetim maddesi",
    expected_condition: clean(item.expectedCondition),
    required_action: clean(item.requiredAction),
    legal_reference: clean(item.legalReference),
    risk_level: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(risk)
      ? risk
      : "MEDIUM",
    photo_required: bool(item.photoRequired),
    explanation_required: bool(item.explanationRequired),
    action_required: bool(item.actionRequired),
    score: num(item.score),
    weight: num(item.weight, 1),
  };
}

async function snapshot(formId: string, note: string, by: string) {
  const db = supabase();
  const [formResult, itemResult] = await Promise.all([
    db.from("inspection_forms").select("*").eq("id", formId).single(),
    db.from("inspection_form_items")
      .select("*")
      .eq("form_id", formId)
      .order("order_no"),
  ]);
  if (formResult.error) throw new Error(formResult.error.message);
  if (itemResult.error) throw new Error(itemResult.error.message);

  const { error } = await db.from("inspection_form_revisions").insert({
    form_id: formId,
    version_no: formResult.data.version_no,
    change_note: note,
    created_by: by,
    snapshot: { form: formResult.data, items: itemResult.data ?? [] },
  });
  if (error) throw new Error(error.message);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const firmId = clean(url.searchParams.get("firmId"));
    const db = supabase();

    let query = db
      .from("inspection_forms")
      .select(`
        *,
        items:inspection_form_items(
          id,order_no,title,question,expected_condition,
          required_action,legal_reference,risk_level,
          photo_required,explanation_required,action_required,
          score,weight
        )
      `)
      .eq("deleted", false)
      .order("updated_at", { ascending: false });

    if (firmId) {
      query = query.or(`firm_id.eq.${firmId},visibility.eq.GLOBAL`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, forms: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Denetim formları alınamadı.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = clean(body.title);
    if (!title) {
      return NextResponse.json(
        { success: false, error: "Form adı zorunlu." },
        { status: 400 }
      );
    }

    const visibility = clean(body.visibility).toUpperCase() === "GLOBAL"
      ? "GLOBAL"
      : "FIRM";
    const status = clean(body.status).toUpperCase();
    const formType = clean(body.formType).toUpperCase();
    const db = supabase();

    const { data: form, error: formError } = await db
      .from("inspection_forms")
      .insert({
        firm_id: visibility === "GLOBAL" ? null : clean(body.firmId) || null,
        visibility,
        title,
        code: clean(body.code),
        category: clean(body.category) || "GENEL",
        form_type: ["STANDARD", "PHOTO", "SCORING", "ELMERI"].includes(formType)
          ? formType
          : "STANDARD",
        description: clean(body.description),
        status: ["DRAFT", "PUBLISHED", "REVISION", "PASSIVE"].includes(status)
          ? status
          : "DRAFT",
        prepared_by: clean(body.preparedBy),
        approved_by: clean(body.approvedBy),
        published_at: status === "PUBLISHED" ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (formError) throw new Error(formError.message);

    const items = Array.isArray(body.items)
      ? body.items.map((item: ItemInput, index: number) => ({
          form_id: form.id,
          ...normalizeItem(item, index),
        }))
      : [];

    if (items.length) {
      const { data: insertedItems, error } =
        await db
          .from("inspection_form_items")
          .insert(items)
          .select("id");

      if (error) {
        await db
          .from("inspection_forms")
          .delete()
          .eq("id", form.id);

        throw new Error(error.message);
      }

      if (
        !Array.isArray(insertedItems) ||
        insertedItems.length !== items.length
      ) {
        await db
          .from("inspection_forms")
          .delete()
          .eq("id", form.id);

        throw new Error(
          `Toplu madde kaydı doğrulanamadı. Beklenen: ${items.length}, kaydedilen: ${
            Array.isArray(insertedItems)
              ? insertedItems.length
              : 0
          }`
        );
      }
    }

    const { count: savedItemCount, error: countError } =
      await db
        .from("inspection_form_items")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("form_id", form.id);

    if (countError) {
      throw new Error(countError.message);
    }

    await db
      .from("inspection_forms")
      .update({
        item_count: savedItemCount ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", form.id);

    await snapshot(
      form.id,
      "Form oluşturuldu.",
      clean(body.preparedBy)
    );

    return NextResponse.json({
      success: true,
      formId: form.id,
      itemCount: savedItemCount ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Denetim formu oluşturulamadı.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = clean(body.id);
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Form ID zorunlu." },
        { status: 400 }
      );
    }

    const db = supabase();
    const { data: current, error: currentError } = await db
      .from("inspection_forms")
      .select("*")
      .eq("id", id)
      .single();
    if (currentError) throw new Error(currentError.message);

    const visibility = clean(body.visibility).toUpperCase() === "GLOBAL"
      ? "GLOBAL"
      : "FIRM";
    const status = clean(body.status).toUpperCase();
    const formType = clean(body.formType).toUpperCase();

    const { error: updateError } = await db
      .from("inspection_forms")
      .update({
        firm_id: visibility === "GLOBAL" ? null : clean(body.firmId) || null,
        visibility,
        title: clean(body.title) || current.title,
        code: clean(body.code),
        category: clean(body.category) || "GENEL",
        form_type: ["STANDARD", "PHOTO", "SCORING", "ELMERI"].includes(formType)
          ? formType
          : current.form_type,
        description: clean(body.description),
        status: ["DRAFT", "PUBLISHED", "REVISION", "PASSIVE"].includes(status)
          ? status
          : current.status,
        version_no: Number(current.version_no || 1) + 1,
        prepared_by: clean(body.preparedBy),
        approved_by: clean(body.approvedBy),
        published_at:
          status === "PUBLISHED"
            ? current.published_at || new Date().toISOString()
            : current.published_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw new Error(updateError.message);

    if (Array.isArray(body.items)) {
      const { error: deleteError } = await db
        .from("inspection_form_items")
        .delete()
        .eq("form_id", id);
      if (deleteError) throw new Error(deleteError.message);

      const items = body.items.map((item: ItemInput, index: number) => ({
        form_id: id,
        ...normalizeItem(item, index),
      }));

      if (items.length) {
        const {
          data: insertedItems,
          error: insertError,
        } = await db
          .from("inspection_form_items")
          .insert(items)
          .select("id");

        if (insertError) {
          throw new Error(
            insertError.message
          );
        }

        if (
          !Array.isArray(insertedItems) ||
          insertedItems.length !==
            items.length
        ) {
          throw new Error(
            `Toplu madde güncellemesi doğrulanamadı. Beklenen: ${items.length}, kaydedilen: ${
              Array.isArray(
                insertedItems
              )
                ? insertedItems.length
                : 0
            }`
          );
        }
      }

      const {
        count: savedItemCount,
        error: countError,
      } = await db
        .from("inspection_form_items")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("form_id", id);

      if (countError) {
        throw new Error(
          countError.message
        );
      }

      await db
        .from("inspection_forms")
        .update({
          item_count:
            savedItemCount ?? 0,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id);
    }

    await snapshot(
      id,
      clean(body.changeNote) || "Form güncellendi.",
      clean(body.preparedBy)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Denetim formu güncellenemedi.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = clean(body.id);
    const action = clean(body.action).toUpperCase();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Form ID zorunlu." },
        { status: 400 }
      );
    }

    const db = supabase();

    if (action === "COPY") {
      const { data: source, error } = await db
        .from("inspection_forms")
        .select("*,items:inspection_form_items(*)")
        .eq("id", id)
        .single();
      if (error) throw new Error(error.message);

      const { data: copy, error: copyError } = await db
        .from("inspection_forms")
        .insert({
          firm_id: source.firm_id,
          visibility: source.visibility,
          title: `${source.title} - Kopya`,
          category: source.category,
          form_type: source.form_type,
          description: source.description,
          status: "DRAFT",
          prepared_by: clean(body.preparedBy),
        })
        .select("*")
        .single();
      if (copyError) throw new Error(copyError.message);

      const copiedItems = Array.isArray(source.items)
        ? source.items.map((item: any, index: number) => ({
            form_id: copy.id,
            order_no: index + 1,
            title: item.title,
            question: item.question,
            expected_condition: item.expected_condition,
            required_action: item.required_action,
            legal_reference: item.legal_reference,
            risk_level: item.risk_level,
            photo_required: item.photo_required,
            explanation_required: item.explanation_required,
            action_required: item.action_required,
            score: item.score,
            weight: item.weight,
          }))
        : [];

      if (copiedItems.length) {
        const { error: itemError } = await db
          .from("inspection_form_items")
          .insert(copiedItems);
        if (itemError) throw new Error(itemError.message);
      }

      return NextResponse.json({ success: true, formId: copy.id });
    }

    const statusMap: Record<string, string> = {
      PUBLISH: "PUBLISHED",
      DRAFT: "DRAFT",
      REVISION: "REVISION",
      PASSIVE: "PASSIVE",
    };

    const nextStatus = statusMap[action];
    if (!nextStatus) {
      return NextResponse.json(
        { success: false, error: "Geçersiz işlem." },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("inspection_forms")
      .update({
        status: nextStatus,
        published_at:
          nextStatus === "PUBLISHED" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Denetim formu işlemi başarısız.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const id = clean(new URL(req.url).searchParams.get("id"));
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Form ID zorunlu." },
        { status: 400 }
      );
    }

    const { error } = await supabase()
      .from("inspection_forms")
      .update({
        deleted: true,
        deleted_at: new Date().toISOString(),
        status: "PASSIVE",
      })
      .eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Denetim formu silinemedi.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}