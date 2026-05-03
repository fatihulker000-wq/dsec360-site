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

function clean(v: any) {
  const s = String(v ?? "").trim();
  return s || null;
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

function parseBool(v: any) {
  const x = String(v ?? "").trim().toLowerCase();
  if (["false","0","hayır","hayir","pasif","inactive"].includes(x)) return false;
  return true;
}

function parseCsv(text: string) {
  const lines = text.replace(/\r/g, "").split("\n").filter(x => x.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: any = {};
    headers.forEach((h, i) => row[h] = values[i]?.trim() || "");
    return row;
  });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const firmId = clean(form.get("firm_id"));

    if (!firmId) return NextResponse.json({ error: "Firma seçimi zorunlu." }, { status: 400 });
    if (!file) return NextResponse.json({ error: "Dosya zorunlu." }, { status: 400 });

    const supabase = getSupabase();

    const { data: firm } = await supabase
      .from("companies")
      .select("id")
      .eq("id", firmId)
      .maybeSingle();

    if (!firm) {
      return NextResponse.json({ error: "Firma bulunamadı." }, { status: 400 });
    }

    let rows: any[] = [];

    if (file.name.toLowerCase().endsWith(".csv")) {
      rows = parseCsv(await file.text());
    } else if (file.name.toLowerCase().endsWith(".xlsx")) {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sh = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sh);
    } else {
      return NextResponse.json({ error: "CSV veya XLSX yükleyin." }, { status: 400 });
    }

    if (!rows.length) {
      return NextResponse.json({ error: "Dosyada satır yok." }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("employees")
      .select("email, registry_no, tc_no")
      .eq("firm_id", firmId);

    const dbEmail = new Set((existing||[]).map((e:any)=>String(e.email||"").toLowerCase()).filter(Boolean));
    const dbReg   = new Set((existing||[]).map((e:any)=>String(e.registry_no||"").toLowerCase()).filter(Boolean));
    const dbTc    = new Set((existing||[]).map((e:any)=>String(e.tc_no||"").toLowerCase()).filter(Boolean));

    const seenEmail = new Set<string>();
    const seenReg   = new Set<string>();
    const seenTc    = new Set<string>();

    const preview = rows.map((row, i) => {
      const full_name = clean(row.full_name || row["Ad Soyad"] || row.ad_soyad);
      const email     = clean(row.email || row["E-posta"] || row.eposta);
      const registry  = clean(row.registry_no || row["Sicil No"] || row.sicil_no);
      const tc        = clean(row.tc_no || row["TC No"] || row.tc);

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!full_name) errors.push("Ad Soyad boş");

      if (email) {
        const e = email.toLowerCase();
        if (dbEmail.has(e)) warnings.push("Email DB’de var");
        if (seenEmail.has(e)) warnings.push("Email dosyada tekrar");
      }
      if (registry) {
        const r = registry.toLowerCase();
        if (dbReg.has(r)) warnings.push("Sicil DB’de var");
        if (seenReg.has(r)) warnings.push("Sicil dosyada tekrar");
      }
      if (tc) {
        const t = tc.toLowerCase();
        if (dbTc.has(t)) warnings.push("TC DB’de var");
        if (seenTc.has(t)) warnings.push("TC dosyada tekrar");
      }

      // setlere EKLE (kontrolden sonra)
      if (email) seenEmail.add(email.toLowerCase());
      if (registry) seenReg.add(registry.toLowerCase());
      if (tc) seenTc.add(tc.toLowerCase());

      return {
        rowNumber: i + 2,
        full_name,
        job_title: clean(row.job_title || row["Ünvan"] || row.unvan),
        phone: clean(row.phone || row["Telefon"] || row.telefon),
        email,
        registry_no: registry,
        tc_no: tc,
        gender: clean(row.gender || row["Cinsiyet"] || row.cinsiyet),
        disability_status: clean(row.disability_status || row["Engellilik Durumu"] || row.engellilik_durumu),
        active: parseBool(row.active ?? row["Aktif"] ?? true),
        errors,
        warnings,
        canInsert: errors.length === 0 && warnings.length === 0,
      };
    });

    const summary = {
      total: preview.length,
      errorCount: preview.filter(p => p.errors.length > 0).length,
      warningCount: preview.filter(p => p.warnings.length > 0).length,
      readyCount: preview.filter(p => p.canInsert).length,
    };

    return NextResponse.json({ preview, summary });

  } catch (e: any) {
    return NextResponse.json({ error: "Preview hatası", detail: e?.message }, { status: 500 });
  }
}