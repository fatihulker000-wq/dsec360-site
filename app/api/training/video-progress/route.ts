import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// HTML5/HLS timeupdate tam saniyede gelmez. İstemci saniyeyi aşağı
// yuvarlarken sunucu duvar saatini de aşağı yuvarladığı için iki normal
// heartbeat arasında yapay olarak 1 saniyelik fark oluşabilir.
const HEARTBEAT_GRACE_SECONDS = 2;
const HEARTBEAT_MAX_GAP_SECONDS = 45;
// Doğrulama penceresi videoyu bilerek durdurur. Kullanıcı pencereyi hemen
// onaylamayabilir; bu nedenle normal oynatma heartbeat süresi burada
// kullanılamaz. Onay yine aynı sayfa oturum kimliği ve kesin kontrol noktası
// ile doğrulanır.
const PRESENCE_RESPONSE_WINDOW_SECONDS = 15 * 60;
// HLS, özellikle kısa/az segmentli videolarda timeupdate olayını her saniye
// üretmeyebilir. Bu pencere yalnızca ardışık ve sunucuda doğrulanan konumlar
// içindir; daha büyük ileri sıçramalar hâlâ reddedilir.
const MAX_VERIFIED_MEDIA_STEP_SECONDS = 6;
const COMPLETION_TOLERANCE_SECONDS = 2;
// İstemciyle aynı kurumsal ekran başı doğrulama aralığı (3,5 dakika).
const PRESENCE_INTERVAL_SECONDS = 210;

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
  updated_at: string | null;
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

    // Mevcut production tablosunda playback_session_id alanı bulunmuyor.
    // İstemcinin aynı sayfa yaşam döngüsünde kullanabilmesi için kimlik yine
    // döndürülür; ancak şemada olmayan bir kolona yazılmaz.
    const sessionId = requestedSessionId || crypto.randomUUID();

    const oldWatch = safeInteger(existing?.watch_seconds);
    const oldMax = safeInteger(existing?.max_watched_seconds);
    const oldClientPosition = safeInteger(existing?.last_position_seconds);
    const elapsed = secondsBetween(existing?.updated_at || null, now);

    let watchSeconds = oldWatch;
    let maxWatchedSeconds = oldMax;
    let presenceClicks = safeInteger(existing?.presence_clicks);
    let lastPresenceCheckpoint = safeInteger(existing?.presence_clicks);
    let watchCompleted = existing?.watch_completed === true;
    let watchCompletedAt = existing?.watch_completed_at || null;
    let completedAt = existing?.completed_at || null;
    let lastClientPosition = oldClientPosition;

    if (action === "heartbeat") {
      const firstHeartbeat = elapsed === null;
      // Yeni oturumun ilk heartbeat kaydı yalnızca HLS başlangıcındaki
      // küçük doğal zaman farkını kabul eder. İlk istekte 20 saniyeye
      // kadar ilerlemeye izin vermek ileri sarma korumasını zayıflatırdı.
      const allowedAdvance = firstHeartbeat
        ? MAX_VERIFIED_MEDIA_STEP_SECONDS
        : Math.min(
            HEARTBEAT_MAX_GAP_SECONDS,
            Math.max(
              MAX_VERIFIED_MEDIA_STEP_SECONDS,
              elapsed + HEARTBEAT_GRACE_SECONDS
            )
          );
      const positionDelta = position - oldClientPosition;

      const invalidJump = positionDelta > allowedAdvance || position > oldMax + allowedAdvance;

      if (invalidJump) {
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

      // Konum artışı yukarıdaki sıçrama kontrolünden geçti. Duvar saatini tam
      // saniyeye yuvarlamak kısa videolarda 5/5 izlendiği hâlde 0/1 görünmesine
      // neden oluyordu. Doğrulanmış monoton konumu izleme süresi kabul ediyoruz.
      watchSeconds = Math.min(duration, Math.max(oldWatch, position));
      maxWatchedSeconds = Math.max(oldMax, position);
      lastClientPosition = position;
    }

    if (action === "presence") {
      // Presence isteğinin kendisi oturum açmış kullanıcının canlı onayıdır.
      // playbackSessionId veritabanında tutulmadığı için istemci belleğindeki
      // kimliği burada zorunlu kılmak güvenlik sağlamıyor ve HLS yenilemesinde
      // geçerli onayı reddediyordu. Aşağıdaki sıralı checkpoint ve sunucuda
      // doğrulanmış izleme konumu kontrolleri korunmaktadır.
      const checkpoint = Math.floor(position / PRESENCE_INTERVAL_SECONDS);
      const expectedCheckpoint = lastPresenceCheckpoint + 1;
      const checkpointSecond = checkpoint * PRESENCE_INTERVAL_SECONDS;
      const verifiedPosition = Math.max(oldMax, oldClientPosition);

      if (
        checkpoint !== expectedCheckpoint ||
        checkpoint <= 0 ||
        checkpoint > requiredClicks ||
        position !== checkpointSecond
      ) {
        return jsonError("Geçersiz veya tekrarlanan ekran onayı.", 409, "INVALID_PRESENCE_CHECKPOINT");
      }

      // Onay yalnızca sunucunun daha önce doğruladığı oynatma konumu ilgili
      // kontrol noktasına gerçekten ulaşmışsa kabul edilir. HLS timeupdate
      // olaylarının birkaç saniye seyrek gelmesine sınırlı tolerans tanınır;
      // kullanıcı ileri sararak bu kontrolü geçemez.
      if (verifiedPosition < checkpointSecond - MAX_VERIFIED_MEDIA_STEP_SECONDS) {
        return NextResponse.json(
          {
            error: "Ekran onayı için kontrol noktasına henüz ulaşılmadı.",
            code: "PRESENCE_POSITION_NOT_REACHED",
            allowedPosition: verifiedPosition,
            playbackSessionId: sessionId,
          },
          { status: 409 }
        );
      }

      presenceClicks = checkpoint;
      lastPresenceCheckpoint = checkpoint;
      watchSeconds = Math.min(duration, Math.max(oldWatch, checkpointSecond));
      maxWatchedSeconds = Math.max(oldMax, checkpointSecond);
      lastClientPosition = Math.max(oldClientPosition, checkpointSecond);
    }

    if (action === "complete") {
      const heartbeatAge = secondsBetween(existing?.updated_at || null, now);
      const requiredWatchSeconds = Math.max(1, duration - COMPLETION_TOLERANCE_SECONDS);

      if (heartbeatAge === null || heartbeatAge > 30) {
        return jsonError("Aktif izleme doğrulanamadı.", 409, "COMPLETION_SESSION_INACTIVE");
      }

      const finalPositionDelta = Math.max(0, position - oldClientPosition);
      const finalAllowedAdvance = Math.max(
        MAX_VERIFIED_MEDIA_STEP_SECONDS,
        heartbeatAge + HEARTBEAT_GRACE_SECONDS
      );

      if (finalPositionDelta > finalAllowedAdvance) {
        return jsonError("İleri sarma veya geçersiz bitiş konumu engellendi.", 409, "SEEK_BLOCKED");
      }

      // Bitiş farkı üstteki güvenli adım sınırını geçtiyse zaten reddedildi.
      // Bu nedenle doğrulanmış son konum doğrudan izleme süresine eklenebilir.
      const finalVerifiedAddition = finalPositionDelta;
      // Heartbeat süreleri güvenlik amacıyla tam saniyeye indirilir. Özellikle
      // kısa videolarda bu yuvarlama, normal izleme tamamlandığı halde
      // watch_seconds değerini 1-2 saniye geride bırakabilir. oldMax yalnızca
      // daha önce sunucu tarafından sıçrama kontrolünden geçmiş konumdur;
      // bu nedenle doğrulanmış izleme süresinin güvenli alt sınırıdır.
      const projectedWatch = Math.min(
        duration,
        Math.max(oldWatch + finalVerifiedAddition, oldMax, position)
      );
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
      watch_completed: watchCompleted,
      watch_completed_at: watchCompletedAt,
      updated_at: nowIso,
    };

    const saveQuery = existing?.id
      ? supabase.from("training_video_progress").update(payload).eq("id", existing.id)
      : supabase.from("training_video_progress").insert(payload);

    const { data: savedProgress, error: saveError } = await saveQuery.select().maybeSingle();
    // Complete isteğinde esas kayıt eğitim atamasıdır. Ara ilerleme tablosunda
    // eski bir constraint/şema problemi bulunsa bile yüzde 100 izlenmiş video
    // final sınavını sonsuza kadar kilitlememelidir. Heartbeat/presence hataları
    // ise güvenlik nedeniyle normal şekilde reddedilmeye devam eder.
    if (saveError && action !== "complete") {
      return NextResponse.json(
        {
          error: `Video ilerleme kaydedilemedi: ${saveError.message}`,
          detail: saveError.message,
          code: "PROGRESS_SAVE_FAILED",
        },
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
      (id) =>
        progressMap.get(id)?.watch_completed === true ||
        (action === "complete" && String(id) === String(videoId))
    ).length;
    const totalVideos = requiredVideoIds.length;
    const chainCompleted = totalVideos > 0 && completedVideos === totalVideos;
    const totalWatchSeconds = (requiredVideos || []).reduce((sum, item) => {
      if (action === "complete" && String(item.id) === String(videoId)) {
        return sum + safeInteger(item.duration_seconds);
      }
      return sum + safeInteger(progressMap.get(item.id)?.watch_seconds);
    }, 0);
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
      progress:
        savedProgress ||
        (action === "complete"
          ? { ...payload, id: existing?.id || null }
          : null),
      totalVideos,
      completedVideos,
      videoChainCompleted: chainCompleted,
      verifiedWatchSeconds: totalWatchSeconds,
      lockedDurationSeconds: totalLockedDuration,
      progressSaveWarning: saveError?.message || null,
    });
  } catch (error) {
    console.error("training video progress error:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}