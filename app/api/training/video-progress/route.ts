import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function requiredPresenceClicks(durationSeconds: number) {
  if (durationSeconds <= 0) return 0;

  let count = 0;

  // V2 kuralı: 6 dakikada bir ekran başı doğrulama
  for (let sec = 360; sec < durationSeconds; sec += 360) {
    count += 1;
  }

  return count;
}

type ActionType = "heartbeat" | "presence" | "complete";

type AssignmentRow = {
  id: string;
  user_id: string;
  training_id: string | null;
};

type VideoRow = {
  id: string;
  training_id: string;
  duration_seconds: number | null;
};

type ProgressRow = {
  id: string;
  watch_seconds: number | null;
  max_watched_seconds: number | null;
  last_position_seconds: number | null;
  locked_duration_seconds: number | null;
  presence_clicks: number | null;
  presence_check_count: number | null;
  required_presence_clicks: number | null;
  watch_completed: boolean | null;
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("dsec_user_id")?.value?.trim();

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı yok." }, { status: 401 });
    }

    const body = await request.json();

    const assignmentId = String(body?.assignmentId || "").trim();
    const videoId = String(body?.videoId || "").trim();
    const action = String(body?.action || "").trim() as ActionType;

    const currentSecond = Math.max(
      0,
      Math.floor(Number(body?.currentSecond || 0))
    );

    const duration = Math.max(
      0,
      Math.floor(Number(body?.duration || 0))
    );

    if (!assignmentId || !videoId || !action) {
      return NextResponse.json(
        { error: "assignmentId, videoId ve action gerekli." },
        { status: 400 }
      );
    }

    if (!["heartbeat", "presence", "complete"].includes(action)) {
      return NextResponse.json(
        { error: "Geçersiz işlem." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    let assignmentQuery = supabase
      .from("training_assignments")
      .select("id, user_id, training_id")
      .eq("id", assignmentId);

    if (userId !== "admin-1") {
      assignmentQuery = assignmentQuery.eq("user_id", userId);
    }

    const { data: assignment, error: assignmentError } =
      await assignmentQuery.maybeSingle<AssignmentRow>();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Eğitim ataması bulunamadı." },
        { status: 404 }
      );
    }

    const { data: video, error: videoError } = await supabase
      .from("training_videos")
      .select("id, training_id, duration_seconds")
      .eq("id", videoId)
      .maybeSingle<VideoRow>();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video bulunamadı." },
        { status: 404 }
      );
    }

    if (String(video.training_id) !== String(assignment.training_id)) {
      return NextResponse.json(
        { error: "Video bu eğitim atamasına ait değil." },
        { status: 403 }
      );
    }

    const lockedDuration =
      duration > 0
        ? duration
        : Math.max(0, Number(video.duration_seconds || 0));

    const requiredClicks = requiredPresenceClicks(lockedDuration);

    const { data: existing, error: existingError } = await supabase
      .from("training_video_progress")
      .select(
        "id, watch_seconds, max_watched_seconds, last_position_seconds, locked_duration_seconds, presence_clicks, presence_check_count, required_presence_clicks, watch_completed"
      )
      .eq("assignment_id", assignmentId)
      .eq("video_id", videoId)
      .maybeSingle<ProgressRow>();

    if (existingError) {
      return NextResponse.json(
        { error: "İlerleme kaydı okunamadı." },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();

    if (!existing) {
      const { error: insertError } = await supabase
        .from("training_video_progress")
        .insert({
          assignment_id: assignmentId,
          video_id: videoId,
          watch_seconds: currentSecond,
          max_watched_seconds: currentSecond,
          last_position_seconds: currentSecond,
          locked_duration_seconds: lockedDuration,
          presence_clicks: action === "presence" ? 1 : 0,
          presence_check_count: action === "presence" ? 1 : 0,
          required_presence_clicks: requiredClicks,
          watch_completed: false,
          last_presence_check_at: action === "presence" ? now : null,
        });

      if (insertError) {
        return NextResponse.json(
          { error: "İlerleme kaydı oluşturulamadı." },
          { status: 500 }
        );
      }
    } else {
      const currentWatch = Math.max(0, Number(existing.watch_seconds || 0));
      const currentMax = Math.max(0, Number(existing.max_watched_seconds || 0));
      const currentPresence = Math.max(0, Number(existing.presence_clicks || 0));
      const currentPresenceCheck = Math.max(
        0,
        Number(existing.presence_check_count || 0)
      );

      const newPresence =
        action === "presence" ? currentPresence + 1 : currentPresence;

      const newPresenceCheck =
        action === "presence" ? currentPresenceCheck + 1 : currentPresenceCheck;

      const payload: Record<string, unknown> = {
        watch_seconds: Math.max(currentWatch, currentSecond),
        max_watched_seconds: Math.max(currentMax, currentSecond),
        last_position_seconds: Math.max(
          Number(existing.last_position_seconds || 0),
          currentSecond
        ),
        locked_duration_seconds:
          Number(existing.locked_duration_seconds || 0) > 0
            ? Number(existing.locked_duration_seconds || 0)
            : lockedDuration,
        presence_clicks: newPresence,
        presence_check_count: newPresenceCheck,
        required_presence_clicks: requiredClicks,
      };

      if (action === "presence") {
        payload.last_presence_check_at = now;
      }

      if (action === "complete") {
        const finalWatch = Math.max(currentWatch, currentMax, currentSecond);
        const finalLocked =
          Number(existing.locked_duration_seconds || 0) > 0
            ? Number(existing.locked_duration_seconds || 0)
            : lockedDuration;

        const finalRequiredClicks = requiredPresenceClicks(finalLocked);

        if (finalLocked <= 0) {
          return NextResponse.json(
            { error: "Video süresi doğrulanamadı." },
            { status: 400 }
          );
        }

        if (finalWatch < finalLocked) {
          return NextResponse.json(
            { error: "Video süresi tamamlanmadı." },
            { status: 400 }
          );
        }

        if (newPresence < finalRequiredClicks) {
          return NextResponse.json(
            { error: "Ekran başı doğrulama sayısı yetersiz." },
            { status: 400 }
          );
        }

        payload.watch_seconds = finalWatch;
        payload.max_watched_seconds = finalWatch;
        payload.last_position_seconds = finalWatch;
        payload.required_presence_clicks = finalRequiredClicks;
        payload.watch_completed = true;
        payload.watch_completed_at = now;
        payload.completed_at = now;
      }

      const { error: updateError } = await supabase
        .from("training_video_progress")
        .update(payload)
        .eq("id", existing.id);

      if (updateError) {
        return NextResponse.json(
          { error: "İlerleme kaydı güncellenemedi." },
          { status: 500 }
        );
      }
    }

    const { data: allVideos } = await supabase
      .from("training_videos")
      .select("id")
      .eq("training_id", assignment.training_id)
      .eq("is_active", true);

    const videoIds = (allVideos || []).map((v) => v.id);

    const { data: completedRows } = await supabase
      .from("training_video_progress")
      .select("video_id")
      .eq("assignment_id", assignmentId)
      .eq("watch_completed", true)
      .in("video_id", videoIds);

    const totalVideos = videoIds.length;
    const completedVideos = completedRows?.length || 0;
    const chainCompleted = totalVideos > 0 && completedVideos >= totalVideos;

    await supabase
      .from("training_assignments")
      .update({
        total_videos: totalVideos,
        completed_videos: completedVideos,
        video_chain_completed: chainCompleted,
        watch_completed: chainCompleted,
        status: chainCompleted ? "in_progress" : "in_progress",
      })
      .eq("id", assignmentId);

    return NextResponse.json({
      success: true,
      totalVideos,
      completedVideos,
      video_chain_completed: chainCompleted,
    });
  } catch (err) {
    console.error("video progress route error:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}