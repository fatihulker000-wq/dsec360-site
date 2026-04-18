import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();

    if (!role) {
      return NextResponse.json({ error: "role gerekli" }, { status: 400 });
    }

    let permissions: string[] = [];

    if (role === "operator") {
      permissions = [
        "DENETIM",
        "EGITIM"
      ];
    }

    if (role === "company_admin") {
      permissions = [
        "DENETIM",
        "EGITIM",
        "SAGLIK",
        "RAPORLAMA",
        "CBS",
        "CALISANLAR"
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
        "ADMIN",
        "FIRMA_YONETIM"
      ];
    }

    return NextResponse.json({ permissions });

  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}