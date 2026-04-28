import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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
    const filePath = 'app/${Date.now()}-${photoFileName}';

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
  try {
    const body = await req.json();
    const { run, answers } = body;

    if (!run || !run.id) {
      return NextResponse.json(
        { error: "Run verisi eksik." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // 🔥 1) VAR MI KONTROL ET
    const { data: existingRun } = await supabase
      .from("denetim_runs")
      .select("id")
      .eq("app_run_id", run.id)
      .maybeSingle();

    // 🔥 2) VARSA ÖNCE ANSWERS SİL (DOĞRU SIRA)
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

    // 🔥 3) RUN INSERT
    const { data: runData, error: runError } = await supabase
      .from("denetim_runs")
      .insert({
        app_run_id: run.id,
        firm_id: run.firmId,
        firm_name: run.firmName,
        template_type: run.templateType,
        eval_mode: run.evalMode,
        location: run.location,
        responsible: run.responsible,
        inspector_name: run.inspectorName,
        audit_date_millis: run.auditDateMillis,
        report_no: run.reportNo,
        general_note: run.generalNote,
        status: run.status,
        created_at_millis: run.createdAt,
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

    // 🔥 4) ANSWERS INSERT + FOTO
    if (Array.isArray(answers) && answers.length > 0) {
      const rows = await Promise.all(
        answers.map(async (a: any) => {
          const photoUrl = await uploadPhotoIfExists(supabase, a);

          return {
            run_remote_id: runData.id,
            app_run_id: run.id,
            item_title: a.itemTitle,
            legal_ref: a.legalRef,
            result: a.result,
            note: a.note,
            photo_path: a.photoPath || null,
            photo_url: photoUrl || null,
            recommended_action: a.recommendedAction,
          };
        })
      );

      const { error: answersError } = await supabase
        .from("denetim_answers")
        .insert(rows);

      if (answersError) {
        console.error("ANSWERS INSERT ERROR:", answersError);
        return NextResponse.json(
          { error: answersError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      remoteRunId: runData.id,
    });

  } catch (error: any) {
    console.error("SYNC ERROR:", error);

    return NextResponse.json(
      { error: error?.message || "Denetim senkron hatası." },
      { status: 500 }
    );
  }
}