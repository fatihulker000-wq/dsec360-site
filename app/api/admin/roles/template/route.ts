import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function checkAdmin() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("dsec_admin_auth")?.value;
  const role = cookieStore.get("dsec_admin_role")?.value;

  return auth === "ok" && role === "super_admin";
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { role } = await req.json();

    if (!role) {
      return NextResponse.json({ error: "role gerekli" }, { status: 400 });
    }

    let permissions: string[] = [];

    if (role === "operator") {
      permissions = [
        "DENETIM",
        "EGITIM",
        "CALISANLAR",
      ];
    }

    if (role === "company_admin") {
      permissions = [
        "DENETIM",
        "EGITIM",
        "SAGLIK",
        "RAPORLAMA",
        "CBS",
        "CALISANLAR",
        "DOKUMANTASYON",
        "MEVZUAT",
        "AJANDA",
      ];
    }

    if (role === "super_admin") {
      permissions = [
        "DENETIM",
        "EGITIM",
        "SAGLIK",
        "RAPORLAMA",
        "CBS",
        "CALISANLAR",
        "DOKUMANTASYON",
        "MEVZUAT",
        "AJANDA",
        "RISK_YONETIMI",
        "KAZA_OLAY_YONETIMI",
        "ADMIN",
        "FIRMA_YONETIM",
        "KULLANICI_YONETIMI",
      ];
    }

    return NextResponse.json({
      success: true,
      permissions: Array.from(new Set(permissions)),
    });
  } catch (error) {
    console.error("roles template error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}