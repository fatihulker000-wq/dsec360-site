export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

/**
 * Bu eski endpoint devre dışı bırakılmıştır.
 *
 * Eğitim tamamlanması yalnızca:
 * - ön sınav,
 * - zorunlu videoların %100 izlenmesi,
 * - ekran başı doğrulamaları,
 * - final sınavı,
 * - en az 60 başarı puanı
 *
 * kontrollerinden sonra güvenli sınav servisi tarafından yapılabilir.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Eski eğitim tamamlama servisi güvenlik nedeniyle kapatıldı.",
      code: "LEGACY_COMPLETION_DISABLED",
    },
    {
      status: 410,
    }
  );
}