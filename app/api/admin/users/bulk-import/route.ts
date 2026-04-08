import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkAdmin() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;

  return (
    adminAuth === "ok" &&
    (adminRole === "admin" || adminRole === "super_admin")
  );
}

type ImportRow = {
  full_name?: string;
  email?: string;
  role?: string;
  password?: string;
  is_active?: boolean;
};

type ExistingUserRow = {
  email: string | null;
};

type InsertUserRow = {
  full_name: string;
  email: string;
  role: string;
  password: string;
  company_id: string | null;
  is_active: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const companyId = String(body?.companyId || "").trim() || null;
    const defaultRole = String(body?.defaultRole || "training_user").trim();
    const defaultPassword = String(body?.defaultPassword || "123456").trim();
    const rows: ImportRow[] = Array.isArray(body?.rows) ? body.rows : [];

    if (!rows.length) {
      return NextResponse.json(
        { error: "İçe aktarılacak veri bulunamadı." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const validRows: ImportRow[] = rows
      .map((row: ImportRow) => ({
        full_name: String(row?.full_name || "").trim(),
        email: String(row?.email || "").trim().toLowerCase(),
        role: String(row?.role || defaultRole).trim(),
        password: String(row?.password || defaultPassword).trim(),
        is_active:
          typeof row?.is_active === "boolean" ? row.is_active : true,
      }))
      .filter((row: ImportRow) => row.full_name && row.email);

    if (!validRows.length) {
      return NextResponse.json(
        { error: "Geçerli satır bulunamadı." },
        { status: 400 }
      );
    }

    const emails = validRows.map((r: ImportRow) => String(r.email || ""));

    const { data: existingUsers, error: existingError } = await supabase
      .from("users")
      .select("email")
      .in("email", emails);

    if (existingError) {
      return NextResponse.json(
        { error: "Mevcut kullanıcılar kontrol edilemedi." },
        { status: 500 }
      );
    }

    const existingEmailSet = new Set(
      ((existingUsers || []) as ExistingUserRow[]).map((u: ExistingUserRow) =>
        String(u.email || "").trim().toLowerCase()
      )
    );

    const toInsert: InsertUserRow[] = validRows
      .filter((row: ImportRow) => !existingEmailSet.has(String(row.email || "")))
      .map((row: ImportRow) => ({
        full_name: String(row.full_name || "").trim(),
        email: String(row.email || "").trim().toLowerCase(),
        role: String(row.role || defaultRole).trim(),
        password: String(row.password || defaultPassword).trim(),
        company_id: companyId,
        is_active: typeof row.is_active === "boolean" ? row.is_active : true,
      }));

    let insertedCount = 0;

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("users")
        .insert(toInsert);

      if (insertError) {
        console.error("bulk import insert error:", insertError);
        return NextResponse.json(
          { error: insertError.message || "Toplu içe aktarma başarısız." },
          { status: 500 }
        );
      }

      insertedCount = toInsert.length;
    }

    return NextResponse.json({
      success: true,
      insertedCount,
      skippedCount: validRows.length - insertedCount,
      totalRows: rows.length,
      validRows: validRows.length,
    });
  } catch (error) {
    console.error("bulk import general error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}