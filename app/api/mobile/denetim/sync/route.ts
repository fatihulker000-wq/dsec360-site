import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalizeAnswers(answers: any): any[] {
  if (Array.isArray(answers)) return answers;

  if (typeof answers === "string") {
    try {
      const parsed = JSON.parse(answers);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  if (answers && typeof answers === "object") {
    return Object.values(answers);
  }

  return [];
}

async function uploadPhotoIfExists(
  supabase: ReturnType<typeof getSupabase>,
  answer: any
) {
  const photoBase64 = String(answer?.photoBase64 || "").trim();
  const photoFileName = String(answer?.photoFileName || "").trim();
  const photoMimeType = String(answer?.photoMimeType || "image/jpeg").trim();

  if (!photoBase64 || !photoFileName) {
    return String(answer?.photoUrl || "").trim();
  }

  try {
    const fileBuffer = Buffer.from(photoBase64, "base64");
    const safeFileName =
      photoFileName.replace(/[^a-zA-Z0-9.-]/g, "") || "photo.jpg";

    const filePath = `app/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("denetim-photos")
      .upload(filePath, fileBuffer, {
        contentType: photoMimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("PHOTO UPLOAD ERROR:", uploadError);
      return "";
    }

    const { data } = supabase.storage
      .from("denetim-photos")
      .getPublicUrl(filePath);

    return data?.publicUrl || "";
  } catch (e) {
    console.error("PHOTO PROCESS ERROR:", e);
    return "";
  }
}

export async function POST(req: Request) {
  let insertedRunId: number | null = null;

  try {
    const body = await req.json();
    const { run, answers } = body;

    if (!run || !run.id) {
      return NextResponse.json(
        { error: "Run verisi eksik." },
        { status: 400 }
      );
    }

    const safeAnswers = normalizeAnswers(answers);

    console.log("DENETIM SYNC DEBUG:", {
      runId: run?.id,
      firmId: run?.firmId,
      firmName: run?.firmName,
      answersCount: safeAnswers.length,
      firstAnswer: safeAnswers[0] || null,
    });

    // KRİTİK: Bulgu yoksa web'de boş run oluşturma
    if (safeAnswers.length === 0) {
      return NextResponse.json(
        {
          error:
            "Bu denetimde web'e aktarılacak bulgu yok. App tarafında answers boş geliyor.",
          runId: run.id,
          firmName: run?.firmName,
          answersCount: 0,
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: existingRun } = await supabase
      .from("denetim_runs")
      .select("id")
      .eq("app_run_id", run.id)
      .maybeSingle();

    if (existingRun?.id) {
      await supabase
        .from("denetim_answers")
        .delete()
        .eq("run_remote_id", existingRun.id);

      await supabase
        .from("denetim_runs")
        .delete()
        .eq("id", existingRun.id);
    }

    const { data: runData, error: runError } = await supabase
      .from("denetim_runs")
      .insert({
        app_run_id: run.id,
        firm_id: run.firmId || 0,
        firm_name:
          run.firmName ||
          run.firm_name ||
          "Firma Ünvanı Belirtilmemiş",
        template_type: run.templateType || "",
        eval_mode: run.evalMode || "",
        location: run.location || "",
        responsible: run.responsible || "",
        inspector_name: run.inspectorName || "",
        audit_date_millis: run.auditDateMillis || run.createdAt || Date.now(),
        report_no: run.reportNo || "",
        general_note: run.generalNote || "",
        status: run.status || "TAMAMLANDI",
        created_at_millis: run.createdAt || Date.now(),
        source: "APP",
      })
      .select("id")
      .single();

    if (runError || !runData) {
      console.error("RUN INSERT ERROR:", runError);
      return NextResponse.json(
        { error: runError?.message || "Run insert hatası" },
        { status: 500 }
      );
    }

    insertedRunId = runData.id;

    const rows = await Promise.all(
      safeAnswers.map(async (a: any) => {
        const photoUrl = await uploadPhotoIfExists(supabase, a);

        return {
          run_remote_id: runData.id,
          app_run_id: run.id,
          item_title: a.itemTitle || a.item_title || "",
          legal_ref: a.legalRef || a.legal_ref || "",
          result: a.result || "",
          note: a.note || "",
          photo_path: a.photoPath || a.photo_path || null,
          photo_url: photoUrl || null,
          recommended_action:
            a.recommendedAction || a.recommended_action || "",
        };
      })
    );

    const { error: answersError } = await supabase
      .from("denetim_answers")
      .insert(rows);

    if (answersError) {
      console.error("ANSWERS INSERT ERROR:", answersError);

      // KRİTİK: Answer insert patlarsa boş run kaydı web'de kalmasın
      await supabase
        .from("denetim_answers")
        .delete()
        .eq("run_remote_id", runData.id);

      await supabase
        .from("denetim_runs")
        .delete()
        .eq("id", runData.id);

      return NextResponse.json(
        { error: answersError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      remoteRunId: runData.id,
      answerCount: rows.length,
      firmName: run.firmName || run.firm_name || "Firma Ünvanı Belirtilmemiş",
    });
  } catch (error: any) {
    console.error("SYNC ERROR:", error);

    return NextResponse.json(
      { error: error?.message || "Denetim senkron hatası." },
      { status: 500 }
    );
  }
}