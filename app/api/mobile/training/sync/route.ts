import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MOBILE_API_KEY = "dsec_mobile_123";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function authorized(req: Request) {
  return String(req.headers.get("x-api-key") || "").trim() === MOBILE_API_KEY;
}

function unauthorized() {
  return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
}

function clean(value: any) {
  const v = String(value ?? "").trim();
  return v || null;
}

function toIsoFromMillis(value: any) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n).toISOString();
}

export async function GET(req: Request) {
  try {
    if (!authorized(req)) return unauthorized();

    const url = new URL(req.url);
    const firmId = String(url.searchParams.get("firmId") || "").trim();

    if (!firmId) {
      return NextResponse.json({ error: "firmId zorunlu." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, firm_id, full_name, active")
      .eq("firm_id", firmId)
      .eq("active", true);

    if (empError) {
      return NextResponse.json(
        { error: "Çalışanlar alınamadı.", detail: empError.message },
        { status: 500 }
      );
    }

    const employeeIds = (employees || []).map((e: any) => e.id);

    if (employeeIds.length === 0) {
      return NextResponse.json({ success: true, count: 0, data: [] });
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, employee_id, company_id")
      .in("employee_id", employeeIds);

    if (usersError) {
      return NextResponse.json(
        { error: "Kullanıcılar alınamadı.", detail: usersError.message },
        { status: 500 }
      );
    }

    const safeUsers = users || [];
    const userIds = safeUsers.map((u: any) => u.id);

    if (userIds.length === 0) {
      return NextResponse.json({ success: true, count: 0, data: [] });
    }

    const { data: assignments, error: assignmentError } = await supabase
      .from("training_assignments")
      .select(
        "id, user_id, training_id, status, started_at, completed_at, created_at, watch_completed, final_exam_passed"
      )
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    if (assignmentError) {
      return NextResponse.json(
        { error: "Eğitim atamaları alınamadı.", detail: assignmentError.message },
        { status: 500 }
      );
    }

    const trainingIds = Array.from(
      new Set((assignments || []).map((a: any) => a.training_id).filter(Boolean))
    );

    let trainings: any[] = [];

    if (trainingIds.length > 0) {
      const { data, error } = await supabase
        .from("trainings")
        .select("id, title, description, type, content_url, duration_minutes")
        .in("id", trainingIds);

      if (error) {
        return NextResponse.json(
          { error: "Eğitimler alınamadı.", detail: error.message },
          { status: 500 }
        );
      }

      trainings = data || [];
    }

    const userMap = Object.fromEntries(safeUsers.map((u: any) => [u.id, u]));
    const trainingMap = Object.fromEntries(trainings.map((t: any) => [t.id, t]));

    const result = (assignments || [])
  .filter((a: any) => {
    const training = trainingMap[a.training_id];
    const typeRaw = String(training?.type || "").toLowerCase();

    const isOnlineTraining =
      typeRaw.includes("online") || typeRaw.includes("asenkron");

    if (!isOnlineTraining) return true;

    return (
      a.status === "completed" &&
      Boolean(a.watch_completed) === true &&
      Boolean(a.final_exam_passed) === true
    );
  })
  .map((a: any) => {
        const user = userMap[a.user_id];
        const training = trainingMap[a.training_id];

        if (!user || !training) return null;

        return {
          assignment_id: a.id,
          employee_remote_id: user.employee_id,
          user_id: a.user_id,
          training_id: a.training_id,
          title: training.title || "Eğitim",
          description: training.description || "",
          type: training.type || "asenkron",
          content_url: training.content_url || "",
          duration_minutes: training.duration_minutes || 0,
          status: a.status || "not_started",
          started_at: a.started_at,
          completed_at: a.completed_at,
          created_at: a.created_at,
          watch_completed: Boolean(a.watch_completed),
          final_exam_passed: Boolean(a.final_exam_passed),
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Sunucu hatası.", detail: e?.message || null },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!authorized(req)) return unauthorized();

    const body = await req.json();
    const records = Array.isArray(body?.records) ? body.records : [];
    const firstRecordFirmId =
    records.length > 0 ? String(records[0]?.firm_id || records[0]?.firmId || "").trim() : "";

   const firmId = String(body?.firmId || body?.firm_id || firstRecordFirmId || "").trim();

    if (!firmId) {
      return NextResponse.json({ error: "firmId zorunlu." }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        results: [],
      });
    }

    const supabase = getSupabase();
    const results: any[] = [];

    for (const item of records) {
    const localId = String(item?.local_id ?? item?.localId ?? "").trim();
const remoteId = String(item?.remote_id ?? item?.remoteId ?? "").trim();

const employeeRemoteId = String(
  item?.employee_remote_id ?? item?.employeeRemoteId ?? ""
).trim();

const title = String(
  item?.training_title ?? item?.trainingTitle ?? item?.title ?? ""
).trim();

      if (!employeeRemoteId || !title) {
        results.push({
          localId,
          remoteId: remoteId || null,
          success: false,
          error: "employeeRemoteId veya trainingTitle eksik.",
        });
        continue;
      }

      const typeRaw = String(item?.trainingType || item?.type || "ORGUN")
        .trim()
        .toUpperCase();

      const webType =
        typeRaw === "ONLINE"
          ? "online"
          : typeRaw === "OZEL"
          ? "ozel"
          : "orgun";

      const status = item?.completed === true ? "completed" : "not_started";

      const trainingPayload = {
        firm_id: firmId,
        title,
        description: clean(item?.description) || "App üzerinden gelen eğitim kaydı.",
        type: webType,
        content_url: clean(item?.onlineUrl),
        duration_minutes: Number(item?.durationMinutes || 0),
        updated_at: new Date().toISOString(),
      };

      let trainingId = "";
const assignmentRemoteId = remoteId;

if (false as boolean) {
        const { error: updateTrainingError } = await supabase
          .from("trainings")
          .update(trainingPayload)
          .eq("id", trainingId);

        if (updateTrainingError) {
          results.push({
            localId,
            remoteId: trainingId,
            success: false,
            error: updateTrainingError.message,
          });
          continue;
        }
      } else {
        const { data: existingTraining } = await supabase
          .from("trainings")
          .select("id")
          .eq("firm_id", firmId)
          .eq("title", title)
          .maybeSingle();

        if (existingTraining?.id) {
          trainingId = existingTraining.id;

          await supabase
            .from("trainings")
            .update(trainingPayload)
            .eq("id", trainingId);
        } else {
          const { data: newTraining, error: insertTrainingError } = await supabase
            .from("trainings")
            .insert([
              {
                ...trainingPayload,
                created_at: new Date().toISOString(),
              },
            ])
            .select("id")
            .single();

          if (insertTrainingError || !newTraining?.id) {
            results.push({
              localId,
              remoteId: null,
              success: false,
              error: insertTrainingError?.message || "Eğitim oluşturulamadı.",
            });
            continue;
          }

          trainingId = newTraining.id;
        }
      }

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id, employee_id")
        .eq("employee_id", employeeRemoteId)
        .maybeSingle();

      if (userError || !userRow?.id) {
        results.push({
          localId,
          remoteId: trainingId,
          success: false,
          error: "Bu çalışan için eğitim kullanıcısı bulunamadı.",
        });
        continue;
      }

      const assignmentPayload = {
        user_id: userRow.id,
        training_id: trainingId,
        status,
        started_at: toIsoFromMillis(item?.startedAt),
        completed_at: toIsoFromMillis(item?.completedAt),
      };

      let existingAssignment: any = null;
      let insertedAssignment: any = null;

if (assignmentRemoteId) {
  const { data } = await supabase
    .from("training_assignments")
    .select("id")
    .eq("id", assignmentRemoteId)
    .maybeSingle();

  existingAssignment = data;
}

if (!existingAssignment?.id) {
  const { data } = await supabase
    .from("training_assignments")
    .select("id")
    .eq("user_id", userRow.id)
    .eq("training_id", trainingId)
    .maybeSingle();

  existingAssignment = data;
}

      if (existingAssignment?.id) {
        const { error: updateAssignmentError } = await supabase
          .from("training_assignments")
          .update(assignmentPayload)
          .eq("id", existingAssignment.id);

        if (updateAssignmentError) {
          results.push({
            localId,
            remoteId: trainingId,
            success: false,
            error: updateAssignmentError.message,
          });
          continue;
        }
      } else {
const {
  data,
  error: insertAssignmentError,
} = await supabase
  .from("training_assignments")
  .insert([
    {
      ...assignmentPayload,
      created_at: new Date().toISOString(),
    },
  ])
  .select("id")
  .single();

insertedAssignment = data;
  
        if (insertAssignmentError) {
          results.push({
            localId,
            remoteId: trainingId,
            success: false,
            error: insertAssignmentError.message,
          });
          continue;
        }
      }

     results.push({
  localId,
  remoteId:
    existingAssignment?.id ||
    insertedAssignment?.id ||
    assignmentRemoteId ||
    trainingId,
  trainingId,
  success: true,
  error: null,
});
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Sunucu hatası.", detail: e?.message || null },
      { status: 500 }
    );
  }
}