import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * D-SEC ÇBS
 * LEGACY CREATE ENDPOINT
 *
 * Bu route kasıtlı olarak devre dışıdır.
 *
 * Eski endpoint:
 *   POST /api/cbs/create
 *
 * Güncel ve güvenli endpoint:
 *   POST /api/cbs?firm=<REMOTE_COMPANY_UUID>
 *
 * NEDEN KAPALI?
 * -------------
 * Eski yapı:
 * - firm_id için geçerli UUID zorunluluğu uygulamıyordu,
 * - firm_id null kabul edebiliyordu,
 * - firma kaydını companies tablosundan doğrulamıyordu,
 * - privacy_mode desteği yoktu,
 * - anonymous/confidential ayrımı yoktu,
 * - tracking code/hash üretmiyordu,
 * - reference_no yeni akışıyla tam uyumlu değildi,
 * - public rate-limit uygulamıyordu,
 * - yeni SLA / application_type / category_code yapısını kullanmıyordu,
 * - admin mailinde isim/e-posta gibi kimlik bilgilerini taşıyabiliyordu.
 *
 * Bu nedenle eski endpoint'i "uyumlu görünmesi için"
 * açık bırakmak yeni güvenlik katmanlarını bypass ettirirdi.
 *
 * Uygulamadaki tüm yeni başvurular /api/cbs üzerinden yapılmalıdır.
 */

function noStoreHeaders(
  extra: Record<string, string> = {}
) {
  return {
    "Cache-Control":
      "no-store, max-age=0",
    ...extra,
  };
}

function goneResponse() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Bu eski ÇBS kayıt endpoint'i devre dışı bırakıldı.",
      code:
        "CBS_LEGACY_ENDPOINT_DISABLED",
      current_endpoint:
        "/api/cbs",
    },
    {
      status: 410,
      headers:
        noStoreHeaders(),
    }
  );
}

export async function POST() {
  return goneResponse();
}

export async function GET() {
  return goneResponse();
}

export async function PUT() {
  return goneResponse();
}

export async function PATCH() {
  return goneResponse();
}

export async function DELETE() {
  return goneResponse();
}

export async function OPTIONS() {
  return new NextResponse(
    null,
    {
      status: 204,
      headers:
        noStoreHeaders({
          Allow:
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        }),
    }
  );
}
