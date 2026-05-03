import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function clean(value: any) {
  const v = String(value ?? "").trim();
  return v || null;
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

function parseBool(value: any) {
  const v = String(value ?? "").trim().toLowerCase();
  if (["false", "0", "hayır", "hayir", "pasif", "inactive"].includes(v)) return false;
  return true;
}

function parseCsv(text: string) {
  const lines = text.replace(/\r/g, "").split("\n").filter((x) => x.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: any = {};
    headers.forEach((h, i) => {
      row[h] = values[i]?.trim() || "";
    });
    return row;
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const firmId = clean(formData.get("firm_id"));

    if (!firmId) {
      return NextResponse.json({ error: "Firma seçimi zorunlu." }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "Dosya zorunlu." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: firm, error: firmError } = await supabase
      .from("companies")
      .select("id")
      .eq("id", firmId)
      .maybeSingle();

    if (firmError || !firm) {
      return NextResponse.json({ error: "Firma bulunamadı." }, { status: 400 });
    }

    let rows: any[] = [];

    if (file.name.toLowerCase().endsWith(".csv")) {
      const text = await file.text();
      rows = parseCsv(text);
    } else if (file.name.toLowerCase().endsWith(".xlsx")) {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    } else {
      return NextResponse.json(
        { error: "Sadece CSV veya XLSX dosyası yüklenebilir." },
        { status: 400 }
      );
    }

    if (!rows.length) {
      return NextResponse.json({ error: "Dosyada aktarılacak satır bulunamadı." }, { status: 400 });
    }

    const { data: existingEmployees } = await supabase
      .from("employees")
      .select("id, email, registry_no, tc_no")
      .eq("firm_id", firmId);

    const existingEmailSet = new Set(
      (existingEmployees || [])
        .map((e: any) => String(e.email || "").trim().toLowerCase())
        .filter(Boolean)
    );

    const existingRegistrySet = new Set(
      (existingEmployees || [])
        .map((e: any) => String(e.registry_no || "").trim().toLowerCase())
        .filter(Boolean)
    );

    const existingTcSet = new Set(
      (existingEmployees || [])
        .map((e: any) => String(e.tc_no || "").trim().toLowerCase())
        .filter(Boolean)
    );

    const inserts: any[] = [];
    const errors: string[] = [];
    let skippedCount = 0;

    const seenEmail = new Set<string>();
    const seenRegistry = new Set<string>();
    const seenTc = new Set<string>();

    rows.forEach((row, index) => {
      const fullName = clean(row.full_name || row["Ad Soyad"] || row.ad_soyad);
      const email = clean(row.email || row["E-posta"] || row.eposta);
      const registryNo = clean(row.registry_no || row["Sicil No"] || row.sicil_no);
      const tcNo = clean(row.tc_no || row["TC No"] || row.tc);


      if (!fullName) {
        errors.push(`${index + 2}. satır: Ad Soyad boş.`);
        skippedCount += 1;
        return;
      }

      if (email && (existingEmailSet.has(email.toLowerCase()) || seenEmail.has(email.toLowerCase()))) {
  skippedCount++;
  return;
}

if (registryNo && (existingRegistrySet.has(registryNo.toLowerCase()) || seenRegistry.has(registryNo.toLowerCase()))) {
  skippedCount++;
  return;
}

if (tcNo && (existingTcSet.has(tcNo.toLowerCase()) || seenTc.has(tcNo.toLowerCase()))) {
  skippedCount++;
  return;
}
      if (email) seenEmail.add(email.toLowerCase());
      if (registryNo) seenRegistry.add(registryNo.toLowerCase());
      if (tcNo) seenTc.add(tcNo.toLowerCase());
      if (email) existingEmailSet.add(email.toLowerCase());
      if (registryNo) existingRegistrySet.add(registryNo.toLowerCase());
      if (tcNo) existingTcSet.add(tcNo.toLowerCase());

      inserts.push({
        firm_id: firmId,
        full_name: fullName,
        job_title: clean(row.job_title || row["Ünvan"] || row.unvan),
        phone: clean(row.phone || row["Telefon"] || row.telefon),
        email,
        registry_no: registryNo,
        tc_no: tcNo,
        gender: clean(row.gender || row["Cinsiyet"] || row.cinsiyet),
        disability_status: clean(
          row.disability_status || row["Engellilik Durumu"] || row.engellilik_durumu
        ),
        active: parseBool(row.active ?? row["Aktif"] ?? true),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    if (!inserts.length) {
      return NextResponse.json({
        success: true,
        insertedCount: 0,
        skippedCount,
        errors,
        message: "Yeni çalışan eklenmedi. Tüm satırlar atlandı veya hatalı.",
      });
    }

   const chunkSize = 500;

const allInsertedEmployees: any[] = [];

for (let i = 0; i < inserts.length; i += chunkSize) {
  const chunk = inserts.slice(i, i + chunkSize);

  const { data: insertedEmployees, error } = await supabase
    .from("employees")
    .insert(chunk)
    .select("*");

  if (error) {
    return NextResponse.json(
      { error: "Toplu ekleme sırasında hata.", detail: error.message },
      { status: 500 }
    );
  }

  allInsertedEmployees.push(...(insertedEmployees || []));
}

const usersToInsert: any[] = [];
const accessToInsert: any[] = [];

for (const emp of allInsertedEmployees) {
  const email = clean(emp.email);
  const fullName = clean(emp.full_name);

  if (!email || !fullName || !emp.id) continue;

  const normalizedEmail = email.toLowerCase();

  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingUser?.id) {
    await supabase
      .from("users")
      .update({
        employee_id: emp.id,
        company_id: firmId,
        role: "training_user",
        is_active: emp.active !== false,
      })
      .eq("id", existingUser.id);

    continue;
  }

  usersToInsert.push({
    full_name: fullName,
    email: normalizedEmail,
    password_hash: sha256(generatePassword()),
    role: "training_user",
    company_id: firmId,
    employee_id: emp.id,
    is_active: emp.active !== false,
  });
}

if (usersToInsert.length > 0) {
  const { data: insertedUsers, error: userInsertError } = await supabase
    .from("users")
    .insert(usersToInsert)
    .select("id, company_id");

  if (userInsertError) {
    return NextResponse.json(
      {
        error: "Çalışanlar yüklendi ancak eğitim kullanıcıları oluşturulamadı.",
        detail: userInsertError.message,
      },
      { status: 500 }
    );
  }

  for (const user of insertedUsers || []) {
    if (!user.id || !user.company_id) continue;

    accessToInsert.push({
      user_id: user.id,
      firm_id: user.company_id,
      role: "training_user",
      is_primary: true,
    });
  }

  if (accessToInsert.length > 0) {
    await supabase.from("user_firm_access").insert(accessToInsert);
  }
}

       return NextResponse.json({
      success: true,
      insertedCount: inserts.length,
      skippedCount,
      errors,
      message: "Toplu çalışan yükleme tamamlandı.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Sunucu hatası.", detail: e?.message || null },
      { status: 500 }
    );
  }
}