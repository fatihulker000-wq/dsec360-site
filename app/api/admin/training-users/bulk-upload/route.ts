import * as XLSX from "xlsx";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function checkAdmin() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("dsec_admin_auth")?.value;
  const role = cookieStore.get("dsec_admin_role")?.value;

  return auth === "ok" && (role === "super_admin" || role === "company_admin");
}

function parseCsv(text: string) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    return row;
  });
}

function parseExcel(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet);

  return json.map((row: any) => ({
    full_name: String(row.full_name || "").trim(),
    email: String(row.email || "").trim().toLowerCase(),
    password: String(row.password || "").trim(),
    company_id: String(row.company_id || "").trim(),
    is_active: String(row.is_active || "true").toLowerCase() !== "false",
  }));
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
    }

    let rows: any[] = [];

if (file.name.endsWith(".csv")) {
  const text = await file.text();
  rows = parseCsv(text);
} else if (file.name.endsWith(".xlsx")) {
  const buffer = await file.arrayBuffer();
  rows = parseExcel(buffer);
} else {
  return NextResponse.json(
    { error: "Sadece CSV veya XLSX desteklenir." },
    { status: 400 }
  );
}

    if (!rows.length) {
      return NextResponse.json(
        { error: "CSV içinde geçerli satır bulunamadı." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    let insertedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const full_name = String(row.full_name || "").trim();
      const email = String(row.email || "").trim().toLowerCase();
      const password = String(row.password || "").trim();
      const company_id = String(row.company_id || "").trim();
      const is_active = String(row.is_active || "true").toLowerCase() !== "false";

      if (!full_name || !email || !password || !company_id) {
        skippedCount += 1;
        errors.push(`${email || "email yok"} satırı eksik bilgi nedeniyle atlandı.`);
        continue;
      }

      const { data: existingUser, error: existingError } = await supabase
        .from("users")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

      if (existingError) {
        skippedCount += 1;
        errors.push(`${email} kontrol edilemedi.`);
        continue;
      }

      if (existingUser) {
        skippedCount += 1;
        errors.push(`${email} zaten kayıtlı olduğu için atlandı.`);
        continue;
      }

      const { error: insertError } = await supabase.from("users").insert({
        full_name,
        email,
        password_hash: sha256(password),
        role: "training_user",
        company_id,
        is_active,
      });

      if (insertError) {
        skippedCount += 1;
        errors.push(`${email} eklenemedi: ${insertError.message}`);
        continue;
      }

      insertedCount += 1;
    }

    return NextResponse.json({
      success: true,
      insertedCount,
      skippedCount,
      errors,
    });
  } catch (error) {
    console.error("bulk upload error:", error);
    return NextResponse.json(
      { error: "Toplu yükleme sırasında sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}