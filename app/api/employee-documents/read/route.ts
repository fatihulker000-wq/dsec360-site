import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

async function getIdentity() {
  const cookieStore = await cookies();
  const auth = clean(cookieStore.get("dsec_user_auth")?.value);
  const role = clean(cookieStore.get("dsec_user_role")?.value);
  const userId = clean(cookieStore.get("dsec_user_id")?.value);

  if (auth !== "ok" || role !== "training_user" || !userId) {
    return null;
  }

  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("id,employee_id")
    .eq("id", userId)
    .maybeSingle();

  const employeeId = clean(user?.employee_id);

  if (!employeeId) return null;

  return { userId, employeeId };
}

async function loadAssignment(
  assignmentId: string,
  employeeId: string
) {
  const supabase = getSupabase();

  const { data: assignment, error } = await supabase
    .from("employee_document_assignments")
    .select(
      "id,document_id,firm_id,employee_id,status,first_opened_at,last_opened_at,opened_count,total_open_seconds,active_read_seconds,last_page_viewed,pages_viewed,reading_completed_at,acknowledgement_at,acknowledgement_code,is_cancelled"
    )
    .eq("id", assignmentId)
    .eq("employee_id", employeeId)
    .eq("is_cancelled", false)
    .maybeSingle();

  if (error || !assignment) {
    return {
      assignment: null,
      document: null,
      error: error?.message || "Belge ataması bulunamadı.",
    };
  }

  const { data: document, error: docError } = await supabase
    .from("employee_documents")
    .select(
      "id,title,reading_policy,min_active_read_seconds,require_last_page,require_all_pages,page_count,requires_acknowledgement"
    )
    .eq("id", assignment.document_id)
    .eq("is_deleted", false)
    .maybeSingle();

  return {
    assignment,
    document,
    error: docError?.message || null,
  };
}

function requirementMet(params: {
  activeReadSeconds: number;
  minActiveReadSeconds: number;
  requireLastPage: boolean;
  requireAllPages: boolean;
  pageCount: number | null;
  pagesViewed: number[];
  lastPageViewed: number | null;
}) {
  if (
    params.activeReadSeconds <
    params.minActiveReadSeconds
  ) {
    return false;
  }

  if (
    params.requireLastPage &&
    params.pageCount &&
    (params.lastPageViewed || 0) <
      params.pageCount
  ) {
    return false;
  }

  if (
    params.requireAllPages &&
    params.pageCount
  ) {
    const seen = new Set(
      params.pagesViewed.filter(
        (page) =>
          page >= 1 &&
          page <= Number(params.pageCount)
      )
    );

    if (seen.size < params.pageCount) {
      return false;
    }
  }

  return true;
}

export async function POST(request: Request) {
  const identity = await getIdentity();

  if (!identity) {
    return NextResponse.json(
      { error: "Oturum bulunamadı." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const assignmentId = clean(body.assignmentId);
  const action = clean(body.action).toUpperCase();

  if (!assignmentId || !action) {
    return NextResponse.json(
      { error: "assignmentId ve action zorunludur." },
      { status: 400 }
    );
  }

  const loaded = await loadAssignment(
    assignmentId,
    identity.employeeId
  );

  if (!loaded.assignment || !loaded.document) {
    return NextResponse.json(
      {
        error:
          loaded.error ||
          "Belge erişimi doğrulanamadı.",
      },
      { status: 404 }
    );
  }

  const assignment = loaded.assignment;
  const document = loaded.document;
  const supabase = getSupabase();
  const now = new Date().toISOString();

  if (action === "START") {
    const sessionId = randomUUID();

    const { error: sessionError } = await supabase
      .from("employee_document_read_sessions")
      .insert({
        id: sessionId,
        assignment_id: assignment.id,
        employee_id: identity.employeeId,
        started_at: now,
        last_heartbeat_at: now,
        total_open_seconds: 0,
        active_read_seconds: 0,
        focus_count: 1,
        blur_count: 0,
        page_count: document.page_count,
        last_page: assignment.last_page_viewed,
        pages_viewed: assignment.pages_viewed || [],
        reading_requirement_met: Boolean(
          assignment.reading_completed_at
        ),
        user_agent:
          request.headers.get("user-agent") || null,
      });

    if (sessionError) {
      return NextResponse.json(
        {
          error: "Okuma oturumu başlatılamadı.",
          detail: sessionError.message,
        },
        { status: 500 }
      );
    }

    await supabase
      .from("employee_document_assignments")
      .update({
        status: assignment.reading_completed_at
          ? "READ"
          : "OPENED",
        first_opened_at:
          assignment.first_opened_at || now,
        last_opened_at: now,
        opened_count:
          Number(assignment.opened_count || 0) + 1,
      })
      .eq("id", assignment.id);

    await supabase
      .from("employee_document_events")
      .insert([
        {
          assignment_id: assignment.id,
          session_id: sessionId,
          document_id: assignment.document_id,
          firm_id: assignment.firm_id,
          employee_id: identity.employeeId,
          event_type: "DOCUMENT_OPENED",
          metadata: {},
          occurred_at: now,
        },
        {
          assignment_id: assignment.id,
          session_id: sessionId,
          document_id: assignment.document_id,
          firm_id: assignment.firm_id,
          employee_id: identity.employeeId,
          event_type: "READING_STARTED",
          metadata: {},
          occurred_at: now,
        },
      ]);

    return NextResponse.json({
      success: true,
      sessionId,
      activeReadSeconds:
        Number(assignment.active_read_seconds || 0),
      totalOpenSeconds:
        Number(assignment.total_open_seconds || 0),
      pagesViewed:
        assignment.pages_viewed || [],
      lastPageViewed:
        assignment.last_page_viewed || null,
      pageCount:
        document.page_count || null,
      requirementMet: Boolean(
        assignment.reading_completed_at
      ),
    });
  }

  const sessionId = clean(body.sessionId);

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId zorunludur." },
      { status: 400 }
    );
  }

  const { data: session, error: sessionError } =
    await supabase
      .from("employee_document_read_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("assignment_id", assignment.id)
      .eq("employee_id", identity.employeeId)
      .maybeSingle();

  if (sessionError || !session) {
    return NextResponse.json(
      {
        error: "Okuma oturumu bulunamadı.",
        detail: sessionError?.message,
      },
      { status: sessionError ? 500 : 404 }
    );
  }

  if (action === "PDF_READY") {
    const detectedPageCount = Math.max(
      1,
      Math.min(10000, Number(body.pageCount || 1))
    );

    if (
      !document.page_count ||
      Number(document.page_count) !== detectedPageCount
    ) {
      await supabase
        .from("employee_documents")
        .update({
          page_count: detectedPageCount,
        })
        .eq("id", document.id);
    }

    await supabase
      .from("employee_document_read_sessions")
      .update({
        page_count: detectedPageCount,
      })
      .eq("id", sessionId);

    return NextResponse.json({
      success: true,
      pageCount: detectedPageCount,
    });
  }

  if (action === "HEARTBEAT") {
    const active = body.active === true;

    const deltaSeconds = Math.max(
      0,
      Math.min(15, Number(body.deltaSeconds || 0))
    );

    const pageNo = Math.max(
      1,
      Number(body.pageNo || 1)
    );

    const detectedPageCount = Math.max(
      1,
      Number(
        body.pageCount ||
          document.page_count ||
          session.page_count ||
          1
      )
    );

    const nextSessionOpen =
      Number(session.total_open_seconds || 0) +
      deltaSeconds;

    const nextSessionActive =
      Number(session.active_read_seconds || 0) +
      (active ? deltaSeconds : 0);

    const nextTotalOpen =
      Number(assignment.total_open_seconds || 0) +
      deltaSeconds;

    const nextActiveRead =
      Number(assignment.active_read_seconds || 0) +
      (active ? deltaSeconds : 0);

    const previousPages = Array.isArray(
      assignment.pages_viewed
    )
      ? assignment.pages_viewed.map(Number)
      : [];

    const pages = new Set<number>(previousPages);
    pages.add(pageNo);

    const pagesViewed = Array.from(pages)
      .filter(
        (page) =>
          page >= 1 &&
          page <= detectedPageCount
      )
      .sort((a, b) => a - b);

    const previousLast = Number(
      assignment.last_page_viewed || 0
    );

    const lastPageViewed = Math.max(
      previousLast,
      pageNo
    );

    const met = requirementMet({
      activeReadSeconds: nextActiveRead,
      minActiveReadSeconds: Number(
        document.min_active_read_seconds || 0
      ),
      requireLastPage:
        document.require_last_page !== false,
      requireAllPages:
        document.require_all_pages === true,
      pageCount: detectedPageCount,
      pagesViewed,
      lastPageViewed,
    });

    const firstTimeCompleted =
      met && !assignment.reading_completed_at;

    await supabase
      .from("employee_document_read_sessions")
      .update({
        total_open_seconds: nextSessionOpen,
        active_read_seconds: nextSessionActive,
        last_heartbeat_at: now,
        page_count: detectedPageCount,
        last_page: lastPageViewed,
        pages_viewed: pagesViewed,
        reading_requirement_met: met,
      })
      .eq("id", sessionId);

    await supabase
      .from("employee_document_assignments")
      .update({
        status: met ? "READ" : "READING",
        total_open_seconds: nextTotalOpen,
        active_read_seconds: nextActiveRead,
        last_page_viewed: lastPageViewed,
        pages_viewed: pagesViewed,
        reading_completed_at: met
          ? assignment.reading_completed_at || now
          : assignment.reading_completed_at,
      })
      .eq("id", assignment.id);

    const events: Array<Record<string, unknown>> = [
      {
        assignment_id: assignment.id,
        session_id: sessionId,
        document_id: assignment.document_id,
        firm_id: assignment.firm_id,
        employee_id: identity.employeeId,
        event_type: "READING_HEARTBEAT",
        page_no: pageNo,
        active_seconds_delta:
          active ? deltaSeconds : 0,
        total_open_seconds_delta: deltaSeconds,
        metadata: {
          active,
          pageCount: detectedPageCount,
        },
        occurred_at: now,
      },
    ];

    if (!previousPages.includes(pageNo)) {
      events.push({
        assignment_id: assignment.id,
        session_id: sessionId,
        document_id: assignment.document_id,
        firm_id: assignment.firm_id,
        employee_id: identity.employeeId,
        event_type: "PAGE_VIEWED",
        page_no: pageNo,
        metadata: {
          pageCount: detectedPageCount,
        },
        occurred_at: now,
      });
    }

    if (
      pageNo >= detectedPageCount &&
      previousLast < detectedPageCount
    ) {
      events.push({
        assignment_id: assignment.id,
        session_id: sessionId,
        document_id: assignment.document_id,
        firm_id: assignment.firm_id,
        employee_id: identity.employeeId,
        event_type: "LAST_PAGE_REACHED",
        page_no: pageNo,
        metadata: {
          pageCount: detectedPageCount,
        },
        occurred_at: now,
      });
    }

    if (firstTimeCompleted) {
      events.push({
        assignment_id: assignment.id,
        session_id: sessionId,
        document_id: assignment.document_id,
        firm_id: assignment.firm_id,
        employee_id: identity.employeeId,
        event_type: "READING_COMPLETED",
        metadata: {
          activeReadSeconds: nextActiveRead,
          pagesViewed,
          pageCount: detectedPageCount,
        },
        occurred_at: now,
      });
    }

    await supabase
      .from("employee_document_events")
      .insert(events);

    return NextResponse.json({
      success: true,
      activeReadSeconds: nextActiveRead,
      totalOpenSeconds: nextTotalOpen,
      pagesViewed,
      lastPageViewed,
      pageCount: detectedPageCount,
      requirementMet: met,
      status: met ? "READ" : "READING",
    });
  }

  if (action === "FOCUS" || action === "BLUR") {
    await supabase
      .from("employee_document_read_sessions")
      .update({
        focus_count:
          action === "FOCUS"
            ? Number(session.focus_count || 0) + 1
            : Number(session.focus_count || 0),
        blur_count:
          action === "BLUR"
            ? Number(session.blur_count || 0) + 1
            : Number(session.blur_count || 0),
      })
      .eq("id", sessionId);

    await supabase
      .from("employee_document_events")
      .insert({
        assignment_id: assignment.id,
        session_id: sessionId,
        document_id: assignment.document_id,
        firm_id: assignment.firm_id,
        employee_id: identity.employeeId,
        event_type:
          action === "FOCUS"
            ? "WINDOW_FOCUSED"
            : "WINDOW_BLURRED",
        metadata: {},
        occurred_at: now,
      });

    return NextResponse.json({ success: true });
  }

  if (action === "CLOSE") {
    await supabase
      .from("employee_document_read_sessions")
      .update({ ended_at: now })
      .eq("id", sessionId);

    await supabase
      .from("employee_document_events")
      .insert({
        assignment_id: assignment.id,
        session_id: sessionId,
        document_id: assignment.document_id,
        firm_id: assignment.firm_id,
        employee_id: identity.employeeId,
        event_type: "DOCUMENT_CLOSED",
        metadata: {},
        occurred_at: now,
      });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "Geçersiz action." },
    { status: 400 }
  );
}