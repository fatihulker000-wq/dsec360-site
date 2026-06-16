import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type AssignmentRow = {
  id: string;
  user_id: string;
  training_id: string | null;
};

type TrainingVideoRow = {
  id: string;
  training_id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_seconds: number | null;
  sort_order: number | null;
  is_required: boolean | null;
  is_active: boolean | null;
};

type ProgressRow = {
  id: string;
  assignment_id: string;
  video_id: string;
  watch_seconds: number | null;
  max_watched_seconds: number | null;
  last_position_seconds: number | null;
  locked_duration_seconds: number | null;
  presence_clicks: number | null;
  required_presence_clicks: number | null;
  presence_check_count: number | null;
  watch_completed: boolean | null;
  watch_completed_at: string | null;
  completed_at: string | null;
};

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("dsec_user_id")?.value?.trim();

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı yok." }, { status: 401 });
    }

    const url = new URL(request.url);
    const assignmentId = String(url.searchParams.get("assignmentId") || "").trim();

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignmentId gerekli." },
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

    if (!assignment.training_id) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data: videos, error: videosError } = await supabase
      .from("training_videos")
      .select(
        "id, training_id, title, description, video_url, duration_seconds, sort_order, is_required, is_active"
      )
      .eq("training_id", assignment.training_id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .returns<TrainingVideoRow[]>();

    if (videosError) {
      return NextResponse.json(
        { error: "Videolar alınamadı." },
        { status: 500 }
      );
    }

    const safeVideos = videos || [];

    if (safeVideos.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const videoIds = safeVideos.map((v) => v.id);

    const { data: progressRows, error: progressError } = await supabase
      .from("training_video_progress")
      .select(
        "id, assignment_id, video_id, watch_seconds, max_watched_seconds, last_position_seconds, locked_duration_seconds, presence_clicks, required_presence_clicks, presence_check_count, watch_completed, watch_completed_at, completed_at"
      )
      .eq("assignment_id", assignmentId)
      .in("video_id", videoIds)
      .returns<ProgressRow[]>();

    if (progressError) {
      return NextResponse.json(
        { error: "Video ilerleme kayıtları alınamadı." },
        { status: 500 }
      );
    }

    const progressMap = new Map(
      (progressRows || []).map((p) => [p.video_id, p])
    );

    const result = safeVideos.map((video, index) => {
      const progress = progressMap.get(video.id) || null;

      const previousVideos = safeVideos.slice(0, index);
      const previousCompleted = previousVideos.every((prev) => {
        const prevProgress = progressMap.get(prev.id);
        return prevProgress?.watch_completed === true;
      });

      return {
        ...video,
        progress,
        unlocked: index === 0 || previousCompleted,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("training videos route error:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}