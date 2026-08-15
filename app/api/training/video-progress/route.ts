import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// HTML5/HLS timeupdate tam saniyede gelmez. İstemci saniyeyi aşağı
// yuvarlarken sunucu duvar saatini de aşağı yuvarladığı için iki normal
// heartbeat arasında yapay olarak 1 saniyelik fark oluşabilir.
const HEARTBEAT_GRACE_SECONDS = 2;
const HEARTBEAT_MAX_GAP_SECONDS = 45;
const COMPLETION_TOLERANCE_SECONDS = 2;
const PRESENCE_INTERVAL_SECONDS = 360;

type ProgressAction = "heartbeat" | "presence" | "complete";

type ProgressRow = {
  id: string;
  watch_seconds: number;
  max_watched_seconds: number;
  last_position_seconds: number;
  locked_duration_seconds: number;
  presence_clicks: number;
  required_presence_clicks: number;
  last_presence_check_at: string | null;
  watch_completed: boolean;
  watch_completed_at: string | null;
  completed_at: string | null;
  playback_session_id: string | null;
  playback_session_started_at: string | null;
  last_heartbeat_at: string | null;
  last_client_position_seconds: number;
  last_presence_checkpoint: number;
  rejected_heartbeat_count: number;
};

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function requiredPresenceClicks(durationSeconds: number) {
  if (durationSeconds <= 0) return 0;
  return Math.max(0, Math.floor((durationSeconds - 1) / PRESENCE_INTERVAL_SECONDS));
}

function safeInteger(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function secondsBetween(earlier: string | null, later: Date) {
  if (!earlier) return null;
  const parsed = new Date(earlier).getTime();
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.floor((later.getTime() - parsed) / 1000));
}

function jsonError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("dsec_user_id")?.value?.trim();

    if (!userId) return jsonError("Kullanıcı yok.", 401, "NO_USER");

    const body = await request.json();
    const assignmentId = String(body?.assignmentId || "").trim();
    const videoId = String(body?.videoId || "").trim();
    const action = String(body?.action || "").trim() as ProgressAction;
    const requestedSessionId = String(body?.playbackSessionId || "").trim();
    const requestedPosition = safeInteger(body?.currentSecond);

    if (!assignmentId || !videoId) {
      return jsonError("Eksik veri.", 400, "MISSING_DATA");
    }

    if (!["heartbeat", "presence", "complete"].includes(action)) {
      return jsonError("Geçersiz video işlemi.", 400, "INVALID_ACTION");
    }

    const supabase = getSupabase();
    const now = new Date();
    const nowIso = now.toISOString();

    const { data: assignment, error: assignmentError } = await supabase
      .from("training_assignments")
      .select("id, user_id, training_id, pre_exam_completed, final_exam_passed, training_reset_required")
      .eq("id", assignmentId)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return jsonError("Eğitim ataması bulunamadı.", 404, "ASSIGNMENT_NOT_FOUND");
    }

    if (String(assignment.user_id).trim() !== userId) {
      return jsonError("Bu eğitim bu kullanıcıya ait değil.", 403, "ASSIGNMENT_FORBIDDEN");
    }

    if (assignment.pre_exam_completed !== true) {
      return jsonError("Ön sınav tamamlanmadan video ilerlemesi kaydedilemez.", 409, "PRE_EXAM_REQUIRED");
    }

    if (assignment.training_reset_required === true) {
      return jsonError("Eğitim yeniden başlatılmalıdır.", 409, "TRAINING_RESET_REQUIRED");
    }

    if (assignment.final_exam_passed === true) {
      return jsonError("Tamamlanmış eğitim değiştirilemez.", 409, "TRAINING_ALREADY_COMPLETED");
    }

    const { data: video, error: videoError } = await supabase
      .from("training_videos")
      .select("id, training_id, duration_seconds, is_active, is_required, required_watch_percent, allow_skip, allow_speed, certificate_blocking")
      .eq("id", videoId)
      .maybeSingle();

    if (videoError || !video) {
      return jsonError("Video bulunamadı.", 404, "VIDEO_NOT_FOUND");
    }

    if (String(video.training_id) !== String(assignment.training_id)) {
      return jsonError("Video bu eğitime ait değil.", 400, "VIDEO_TRAINING_MISMATCH");
    }

    if (video.is_active !== true) {
      return jsonError("Pasif video için ilerleme kaydedilemez.", 409, "VIDEO_INACTIVE");
    }

    const duration = safeInteger(video.duration_seconds);
    if (duration <= 0) {
      return jsonError("Video süresi tanımlı değil.", 409, "VIDEO_DURATION_REQUIRED");
    }

    const position = Math.min(requestedPosition, duration);
    const requiredClicks = requiredPresenceClicks(duration);

    const { data: existing, error: existingError } = await supabase
      .from("training_video_progress")
      .select("*")
      .eq("assignment_id", assignmentId)
      .eq("video_id", videoId)
      .maybeSingle<ProgressRow>();

    if (existingError) {
      return jsonError("Video ilerleme kaydı okunamadı.", 500, "PROGRESS_READ_FAILED");
    }

    const sessionId = existing?.playback_session_id || crypto.randomUUID();

    if (
      requestedSessionId &&
      existing?.playback_session_id &&
      requestedSessionId !== existing.playback_session_id
    ) {
      return jsonError("Video başka bir oturumda açık.", 409, "PLAYBACK_SESSION_MISMATCH");
    }

    const oldWatch = safeInteger(existing?.watch_seconds);
    const oldMax = safeInteger(existing?.max_watched_seconds);
    const oldClientPosition = safeInteger(existing?.last_client_position_seconds);
    const oldRejected = safeInteger(existing?.rejected_heartbeat_count);
    const elapsed = secondsBetween(existing?.last_heartbeat_at || null, now);

    let watchSeconds = oldWatch;
    let maxWatchedSeconds = oldMax;
    let presenceClicks = safeInteger(existing?.presence_clicks);
    let lastPresenceCheckpoint = safeInteger(existing?.last_presence_checkpoint);
    let rejectedHeartbeatCount = oldRejected;
    let watchCompleted = existing?.watch_completed === true;
    let watchCompletedAt = existing?.watch_completed_at || null;
    let completedAt = existing?.completed_at || null;
    let lastHeartbeatAt = existing?.last_heartbeat_at || null;
    let lastClientPosition = oldClientPosition;

    if (action === "heartbeat") {
      const firstHeartbeat = elapsed === null;
      // Yeni oturumun ilk heartbeat kaydı yalnızca HLS başlangıcındaki
      // küçük doğal zaman farkını kabul eder. İlk istekte 20 saniyeye
      // kadar ilerlemeye izin vermek ileri sarma korumasını zayıflatırdı.
      const allowedAdvance = firstHeartbeat
        ? Math.min(3, position)
        : Math.min(HEARTBEAT_MAX_GAP_SECONDS, elapsed + HEARTBEAT_GRACE_SECONDS);
      const positionDelta = position - oldClientPosition;

      const invalidJump = positionDelta > allowedAdvance || position > oldMax + allowedAdvance;

      if (invalidJump) {
        rejectedHeartbeatCount += 1;

        if (existing?.id) {
          await supabase
            .from("training_video_progress")
            .update({ rejected_heartbeat_count: rejectedHeartbeatCount, updated_at: nowIso })
            .eq("id", existing.id);
        }

        return NextResponse.json(
          {
            error: "İleri sarma veya geçersiz zaman sıçraması engellendi.",
            code: "SEEK_BLOCKED",
            allowedPosition: oldMax,
            playbackSessionId: sessionId,
          },
          { status: 409 }
        );
      }

      if (!firstHeartbeat && elapsed < 1) {
        return NextResponse.json({
          success: true,
          ignored: true,
          reason: "HEARTBEAT_TOO_FREQUENT",
          playbackSessionId: sessionId,
          progress: existing,
        });
      }

      const verifiedAddition = firstHeartbeat
        ? allowedAdvance
        : Math.max(0, Math.min(elapsed, Math.max(0, positionDelta)));

      watchSeconds = Math.min(duration, oldWatch + verifiedAddition);
      maxWatchedSeconds = Math.max(oldMax, position);
      lastClientPosition = position;
      lastHeartbeatAt = nowIso;
    }

    if (action === "presence") {
      const heartbeatAge = secondsBetween(existing?.last_heartbeat_at || null, now);
      if (heartbeatAge === null || heartbeatAge > 30) {
        return jsonError("Ekran onayı için aktif video oturumu bulunamadı.", 409, "PRESENCE_SESSION_INACTIVE");
      }

      const checkpoint = Math.floor(position / PRESENCE_INTERVAL_SECONDS);
      const expectedCheckpoint = lastPresenceCheckpoint + 1;

      if (
        checkpoint !== expectedCheckpoint ||
        checkpoint <= 0 ||
        checkpoint > requiredClicks ||
        position < checkpoint * PRESENCE_INTERVAL_SECONDS
      ) {
        return jsonError("Geçersiz veya tekrarlanan ekran onayı.", 409, "INVALID_PRESENCE_CHECKPOINT");
      }

      presenceClicks = checkpoint;
      lastPresenceCheckpoint = checkpoint;
    }

    if (action === "complete") {
      const heartbeatAge = secondsBetween(existing?.last_heartbeat_at || null, now);
      const requiredWatchSeconds = Math.max(1, duration - COMPLETION_TOLERANCE_SECONDS);

      if (heartbeatAge === null || heartbeatAge > 30) {
        return jsonError("Aktif izleme doğrulanamadı.", 409, "COMPLETION_SESSION_INACTIVE");
      }

      const finalPositionDelta = Math.max(0, position - oldClientPosition);
      const finalAllowedAdvance = heartbeatAge + HEARTBEAT_GRACE_SECONDS;

      if (finalPositionDelta > finalAllowedAdvance) {
        return jsonError("İleri sarma veya geçersiz bitiş konumu engellendi.", 409, "SEEK_BLOCKED");
      }

      const finalVerifiedAddition = Math.min(heartbeatAge, finalPositionDelta);
      const projectedWatch = Math.min(duration, oldWatch + finalVerifiedAddition);
      const projectedMax = Math.max(oldMax, position);

      if (projectedWatch < requiredWatchSeconds || projectedMax < requiredWatchSeconds) {
        return jsonError("Video yüzde 100 izlenmeden tamamlanamaz.", 409, "WATCH_INCOMPLETE");
      }

      if (safeInteger(existing?.presence_clicks) < requiredClicks) {
        return jsonError("Ekran başı doğrulamaları tamamlanmadı.", 409, "PRESENCE_INCOMPLETE");
      }

      watchSeconds = duration;
      maxWatchedSeconds = duration;
      lastClientPosition = duration;
      watchCompleted = true;
      watchCompletedAt = existing?.watch_completed_at || nowIso;
      completedAt = existing?.completed_at || nowIso;
    }

    const payload = {
      assignment_id: assignmentId,
      video_id: videoId,
      watch_seconds: watchSeconds,
      max_watched_seconds: maxWatchedSeconds,
      last_position_seconds: lastClientPosition,
      locked_duration_seconds: duration,
      presence_clicks: presenceClicks,
      required_presence_clicks: requiredClicks,
      presence_check_count: presenceClicks,
      last_presence_check_at: action === "presence" ? nowIso : existing?.last_presence_check_at || null,
      watch_completed: watchCompleted,
      watch_completed_at: watchCompletedAt,
      completed_at: completedAt,
      playback_session_id: sessionId,
      playback_session_started_at: existing?.playback_session_started_at || nowIso,
      last_heartbeat_at: lastHeartbeatAt,
      last_client_position_seconds: lastClientPosition,
      last_presence_checkpoint: lastPresenceCheckpoint,
      rejected_heartbeat_count: rejectedHeartbeatCount,
      updated_at: nowIso,
    };

    const saveQuery = existing?.id
      ? supabase.from("training_video_progress").update(payload).eq("id", existing.id)
      : supabase.from("training_video_progress").insert(payload);

    const { data: savedProgress, error: saveError } = await saveQuery.select().maybeSingle();
    if (saveError) {
      return NextResponse.json(
        { error: "Video ilerleme kaydedilemedi.", detail: saveError.message },
        { status: 500 }
      );
    }

    const { data: requiredVideos, error: requiredVideosError } = await supabase
      .from("training_videos")
      .select("id, duration_seconds")
      .eq("training_id", assignment.training_id)
      .eq("is_active", true)
      .eq("is_required", true)
      .eq("certificate_blocking", true);

    if (requiredVideosError) {
      return jsonError("Zorunlu video zinciri okunamadı.", 500, "VIDEO_CHAIN_READ_FAILED");
    }

    const requiredVideoIds = (requiredVideos || []).map((item) => item.id);
    const { data: allProgress } = requiredVideoIds.length
      ? await supabase
          .from("training_video_progress")
          .select("video_id, watch_seconds, locked_duration_seconds, presence_clicks, watch_completed")
          .eq("assignment_id", assignmentId)
          .in("video_id", requiredVideoIds)
      : { data: [] };

    const progressMap = new Map((allProgress || []).map((item) => [item.video_id, item]));
    const completedVideos = requiredVideoIds.filter(
      (id) => progressMap.get(id)?.watch_completed === true
    ).length;
    const totalVideos = requiredVideoIds.length;
    const chainCompleted = totalVideos > 0 && completedVideos === totalVideos;
    const totalWatchSeconds = (allProgress || []).reduce(
      (sum, item) => sum + safeInteger(item.watch_seconds),
      0
    );
    const totalLockedDuration = (requiredVideos || []).reduce(
      (sum, item) => sum + safeInteger(item.duration_seconds),
      0
    );
    const totalPresenceClicks = (allProgress || []).reduce(
      (sum, item) => sum + safeInteger(item.presence_clicks),
      0
    );

    const { error: assignmentUpdateError } = await supabase
      .from("training_assignments")
      .update({
        status: "in_progress",
        watch_completed: chainCompleted,
        watch_completed_at: chainCompleted ? nowIso : null,
        video_chain_completed: chainCompleted,
        total_videos: totalVideos,
        completed_videos: completedVideos,
        watch_seconds: totalWatchSeconds,
        locked_duration_seconds: totalLockedDuration,
        click_count: totalPresenceClicks,
        last_position_seconds: lastClientPosition,
        max_watched_seconds: maxWatchedSeconds,
        last_opened_at: nowIso,
      })
      .eq("id", assignmentId)
      .eq("user_id", userId);

    if (assignmentUpdateError) {
      return NextResponse.json(
        { error: "Eğitim toplam ilerlemesi güncellenemedi.", detail: assignmentUpdateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      playbackSessionId: sessionId,
      progress: savedProgress,
      totalVideos,
      completedVideos,
      videoChainCompleted: chainCompleted,
      verifiedWatchSeconds: totalWatchSeconds,
      lockedDurationSeconds: totalLockedDuration,
    });
  } catch (error) {
    console.error("training video progress error:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}