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

      if (email && existingEmailSet.has(email.toLowerCase())) {
        skippedCount += 1;
        return;
      }

      if (registryNo && existingRegistrySet.has(registryNo.toLowerCase())) {
        skippedCount += 1;
        return;
      }

      if (tcNo && existingTcSet.has(tcNo.toLowerCase())) {
        skippedCount += 1;
        return;
      }

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

    const { error: insertError } = await supabase.from("employees").insert(inserts);

    if (insertError) {
      return NextResponse.json(
        { error: "Toplu çalışan yükleme başarısız.", detail: insertError.message },
        { status: 500 }
      );
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