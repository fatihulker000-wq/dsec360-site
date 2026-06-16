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

  for (let sec = 360; sec < durationSeconds; sec += 360) {
    count += 1;
  }

  return count;
}

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
    const action = String(body?.action || "").trim();
    const currentSecond = Math.max(0, Math.floor(Number(body?.currentSecond || 0)));
    const duration = Math.max(0, Math.floor(Number(body?.duration || 0)));

    if (!assignmentId || !videoId || !action) {
      return NextResponse.json({ error: "Eksik veri." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: assignment, error: assignmentError } = await supabase
      .from("training_assignments")
      .select("id, user_id, training_id")
      .eq("id", assignmentId)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Eğitim ataması bulunamadı." },
        { status: 404 }
      );
    }

    if (String(assignment.user_id).trim() !== userId) {
      return NextResponse.json(
        { error: "Bu eğitim bu kullanıcıya ait değil." },
        { status: 403 }
      );
    }

    const { data: video, error: videoError } = await supabase
      .from("training_videos")
      .select("id, training_id, duration_seconds, is_active")
      .eq("id", videoId)
      .maybeSingle();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video bulunamadı." }, { status: 404 });
    }

    if (String(video.training_id) !== String(assignment.training_id)) {
      return NextResponse.json(
        { error: "Video bu eğitime ait değil." },
        { status: 400 }
      );
    }

    const lockedDuration = Math.max(
      duration,
      Math.floor(Number(video.duration_seconds || 0))
    );

    const requiredClicks = requiredPresenceClicks(lockedDuration);

    const { data: existing } = await supabase
      .from("training_video_progress")
      .select("*")
      .eq("assignment_id", assignmentId)
      .eq("video_id", videoId)
      .maybeSingle();

    const currentPresenceClicks = Math.max(
      0,
      Number(existing?.presence_clicks || 0)
    );

    const nextPresenceClicks =
      action === "presence" ? currentPresenceClicks + 1 : currentPresenceClicks;

    const shouldComplete =
      action === "complete" ||
      (lockedDuration > 0 && currentSecond >= Math.max(0, lockedDuration - 1));

    const progressPayload = {
      assignment_id: assignmentId,
      video_id: videoId,
      watch_seconds: shouldComplete ? lockedDuration : currentSecond,
      max_watched_seconds: Math.max(
        Number(existing?.max_watched_seconds || 0),
        shouldComplete ? lockedDuration : currentSecond
      ),
      last_position_seconds: shouldComplete ? lockedDuration : currentSecond,
      locked_duration_seconds: lockedDuration,
      presence_clicks: nextPresenceClicks,
      required_presence_clicks: requiredClicks,
      presence_check_count: nextPresenceClicks,
      watch_completed: shouldComplete ? true : existing?.watch_completed === true,
      watch_completed_at:
        shouldComplete && !existing?.watch_completed_at
          ? new Date().toISOString()
          : existing?.watch_completed_at || null,
      completed_at:
        shouldComplete && !existing?.completed_at
          ? new Date().toISOString()
          : existing?.completed_at || null,
    };

    let savedProgress;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("training_video_progress")
        .update(progressPayload)
        .eq("id", existing.id)
        .select()
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { error: "Video ilerleme güncellenemedi.", detail: error.message },
          { status: 500 }
        );
      }

      savedProgress = data;
    } else {
      const { data, error } = await supabase
        .from("training_video_progress")
        .insert(progressPayload)
        .select()
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { error: "Video ilerleme kaydedilemedi.", detail: error.message },
          { status: 500 }
        );
      }

      savedProgress = data;
    }

    const { data: allVideos } = await supabase
      .from("training_videos")
      .select("id")
      .eq("training_id", assignment.training_id)
      .eq("is_active", true);

    const videoIds = (allVideos || []).map((v) => v.id);
    const totalVideos = videoIds.length;

    let completedVideos = 0;

    if (totalVideos > 0) {
      const { data: completedRows } = await supabase
        .from("training_video_progress")
        .select("video_id")
        .eq("assignment_id", assignmentId)
        .eq("watch_completed", true)
        .in("video_id", videoIds);

      completedVideos = completedRows?.length || 0;
    }

    const chainCompleted = totalVideos > 0 && completedVideos >= totalVideos;

    await supabase
      .from("training_assignments")
      .update({
        status: chainCompleted ? "in_progress" : "in_progress",
        watch_completed: chainCompleted,
        video_chain_completed: chainCompleted,
        total_videos: totalVideos,
        completed_videos: completedVideos,
        watch_seconds: chainCompleted ? lockedDuration : currentSecond,
        click_count: nextPresenceClicks,
      })
      .eq("id", assignmentId);

    return NextResponse.json({
      success: true,
      progress: savedProgress,
      totalVideos,
      completedVideos,
      videoChainCompleted: chainCompleted,
    });
  } catch (err) {
    console.error("video progress error:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}