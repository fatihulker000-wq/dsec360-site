import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { IncidentDashboardService } from "@/lib/incident/IncidentDashboardService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function uuid(value: unknown) {
  const valueText = clean(value);
  return UUID_RE.test(valueText) ? valueText : "";
}

async function getActiveFirm() {
  const cookieStore = await cookies();

  const auth = clean(
    cookieStore.get("dsec_admin_auth")?.value ||
      cookieStore.get("dsec_user_auth")?.value
  );

  const role = clean(
    cookieStore.get("dsec_admin_role")?.value ||
      cookieStore.get("dsec_user_role")?.value
  );

  const firmId = uuid(
    cookieStore.get("dsec_company_id")?.value
  );

  const allowedRoles = new Set([
    "super_admin",
    "company_admin",
    "demo_user",
  ]);

  if (
    auth !== "ok" ||
    !allowedRoles.has(role) ||
    !firmId
  ) {
    return "";
  }

  return firmId;
}

export async function GET() {
  try {
    const firmId = await getActiveFirm();

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Aktif firma oturumu bulunamadı veya yetkisiz erişim.",
        },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    // Query-string companyId artık kabul edilmez.
    // Tenant yalnız sunucu tarafındaki aktif firma UUID'sinden gelir.
    const dashboard =
      await IncidentDashboardService.getDashboard(firmId);

    return NextResponse.json(
      {
        success: true,
        firmId,
        data: dashboard,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error(
      "Incident dashboard genel hata:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Kaza/olay dashboard verisi alınamadı.",
      },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
