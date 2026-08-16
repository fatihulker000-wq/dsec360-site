import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function sha256(value: string) {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = clean(
      url.searchParams.get("token")
    );

    if (!token || token.length < 32) {
      return NextResponse.redirect(
        new URL(
          "/portal/training?documentAccess=invalid",
          request.url
        )
      );
    }

    const tokenHash = sha256(token);
    const supabase = getSupabase();

    const {
      data: assignment,
      error: assignmentError,
    } = await supabase
      .from("employee_document_assignments")
      .select(
        "id,firm_id,employee_id,portal_user_id,employee_email,is_cancelled,portal_access_token_expires_at"
      )
      .eq(
        "portal_access_token_hash",
        tokenHash
      )
      .eq("is_cancelled", false)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return NextResponse.redirect(
        new URL(
          "/portal/training?documentAccess=invalid",
          request.url
        )
      );
    }

    const expiresAt =
      assignment.portal_access_token_expires_at
        ? new Date(
            assignment.portal_access_token_expires_at
          ).getTime()
        : 0;

    if (
      expiresAt > 0 &&
      expiresAt < Date.now()
    ) {
      return NextResponse.redirect(
        new URL(
          "/portal/training?documentAccess=expired",
          request.url
        )
      );
    }

    let userId = clean(
      assignment.portal_user_id
    );

    if (!userId && assignment.employee_id) {
      const { data: byEmployee } =
        await supabase
          .from("users")
          .select(
            "id,email,company_id,role,is_active"
          )
          .eq(
            "employee_id",
            String(
              assignment.employee_id
            )
          )
          .eq(
            "role",
            "training_user"
          )
          .maybeSingle();

      if (byEmployee?.id) {
        userId = String(
          byEmployee.id
        );
      }
    }

    if (
      !userId &&
      clean(
        assignment.employee_email
      )
    ) {
      const { data: byEmail } =
        await supabase
          .from("users")
          .select(
            "id,email,company_id,role,is_active"
          )
          .ilike(
            "email",
            clean(
              assignment.employee_email
            )
          )
          .eq(
            "role",
            "training_user"
          )
          .maybeSingle();

      if (byEmail?.id) {
        userId = String(
          byEmail.id
        );
      }
    }

    if (!userId) {
      return NextResponse.redirect(
        new URL(
          "/portal/training?documentAccess=user_not_found",
          request.url
        )
      );
    }

    const { data: user, error: userError } =
      await supabase
        .from("users")
        .select(
          "id,email,company_id,role,is_active"
        )
        .eq("id", userId)
        .maybeSingle();

    if (
      userError ||
      !user ||
      user.role !== "training_user" ||
      user.is_active === false
    ) {
      return NextResponse.redirect(
        new URL(
          "/portal/training?documentAccess=user_inactive",
          request.url
        )
      );
    }

    if (
      clean(
        assignment.portal_user_id
      ) !== userId
    ) {
      await supabase
        .from("employee_document_assignments")
        .update({
          portal_user_id: userId,
        })
        .eq(
          "id",
          assignment.id
        );
    }

    await supabase
      .from("employee_document_assignments")
      .update({
        portal_access_last_used_at:
          new Date().toISOString(),
      })
      .eq("id", assignment.id);

    const secure =
      process.env.NODE_ENV ===
      "production";

    const cookieBase = {
      httpOnly: true,
      sameSite:
        "lax" as const,
      secure,
      path: "/",
      maxAge: 60 * 60 * 12,
    };

    const destination = new URL(
      `/portal/documents/${assignment.id}`,
      request.url
    );

    const response =
      NextResponse.redirect(
        destination
      );

    response.cookies.set(
      "dsec_user_auth",
      "ok",
      cookieBase
    );
    response.cookies.set(
      "dsec_user_role",
      "training_user",
      cookieBase
    );
    response.cookies.set(
      "dsec_user_id",
      userId,
      cookieBase
    );
    response.cookies.set(
      "dsec_user_email",
      clean(user.email),
      cookieBase
    );
    response.cookies.set(
      "dsec_company_id",
      clean(
        user.company_id
      ) ||
        clean(
          assignment.firm_id
        ),
      cookieBase
    );

    return response;
  } catch (cause) {
    console.error(
      "Employee document magic access error:",
      cause
    );

    return NextResponse.redirect(
      new URL(
        "/portal/training?documentAccess=error",
        request.url
      )
    );
  }
}