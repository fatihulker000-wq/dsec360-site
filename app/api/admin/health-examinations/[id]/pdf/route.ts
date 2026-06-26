import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data: exam, error } = await supabase
    .from("health_examinations")
    .select("*")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (error || !exam) {
    return NextResponse.json(
      { error: "Muayene kaydı bulunamadı." },
      { status: 404 }
    );
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("id, full_name, firm_id, job_title, start_date")
    .eq("id", exam.employee_id)
    .single();

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", exam.company_id)
    .maybeSingle();

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<title>D-SEC Muayene Raporu</title>
<style>
body{font-family:Arial,sans-serif;padding:36px;color:#111827;background:#fff}
.header{background:#7f1d1d;color:#fff;padding:24px;border-radius:14px}
.header h1{margin:0;font-size:26px}
.header p{margin:8px 0 0;opacity:.9}
.card{margin-top:18px;border:1px solid #e5e7eb;border-radius:14px;padding:20px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.row{border-bottom:1px solid #e5e7eb;padding:8px 0}
.label{color:#64748b;font-size:12px;font-weight:bold}
.value{font-size:15px;font-weight:bold;margin-top:4px}
.badge{display:inline-block;padding:8px 12px;border-radius:999px;background:#f0fdf4;color:#15803d;font-weight:bold}
.footer{margin-top:36px;display:grid;grid-template-columns:1fr 1fr;gap:40px}
.sign{border-top:1px solid #111827;padding-top:10px;text-align:center}
button{margin-top:30px;padding:12px 18px;border:0;border-radius:10px;background:#7f1d1d;color:white;font-weight:bold;cursor:pointer}
@media print{button{display:none}body{padding:12px}.header{border-radius:0}}
</style>
</head>
<body>

<div class="header">
  <h1>D-SEC Sağlık Muayene Raporu</h1>
  <p>Dijital Sağlık • Emniyet • Çevre Yönetim Platformu</p>
</div>

<div class="card">
  <h2>Çalışan Bilgileri</h2>
  <div class="grid">
    ${row("Ad Soyad", employee?.full_name)}
    ${row("Firma", company?.name || "Örnek Firma")}
    ${row("Görev", employee?.job_title)}
    ${row("İşe Giriş", formatDate(employee?.start_date))}
  </div>
</div>

<div class="card">
  <h2>Muayene Bilgileri</h2>
  <div class="grid">
    ${row("Muayene Türü", exam.exam_type)}
    ${row("Muayene Tarihi", formatDate(exam.exam_date))}
    ${row("Sonraki Muayene", formatDate(exam.next_exam_date))}
    ${row("Karar", `<span class="badge">${escapeHtml(exam.decision || "Uygun")}</span>`)}
  </div>
</div>

<div class="card">
  <h2>Vital Bulgular</h2>
  <div class="grid">
    ${row("Boy", exam.height ? `${exam.height} cm` : "-")}
    ${row("Kilo", exam.weight ? `${exam.weight} kg` : "-")}
    ${row("BMI", exam.bmi)}
    ${row("Tansiyon", `${exam.blood_pressure_sys || "-"}/${exam.blood_pressure_dia || "-"}`)}
    ${row("Nabız", exam.pulse)}
    ${row("Ateş", exam.temperature)}
    ${row("SpO₂", exam.spo2)}
  </div>
</div>

<div class="card">
  <h2>Muayene Bulguları</h2>
  <p>${escapeHtml(exam.findings || "-")}</p>
</div>

<div class="card">
  <h2>Kısıtlama / Hekim Notu</h2>
  <p><strong>Kısıt:</strong> ${escapeHtml(exam.restriction_note || "-")}</p>
  <p><strong>Hekim Notu:</strong> ${escapeHtml(exam.doctor_note || "-")}</p>
</div>

<div class="footer">
  <div class="sign">İşyeri Hekimi</div>
  <div class="sign">Çalışan İmzası</div>
</div>

<button onclick="window.print()">Yazdır / PDF Kaydet</button>

</body>
</html>
`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function row(label: string, value: any) {
  return `
  <div class="row">
    <div class="label">${escapeHtml(label)}</div>
    <div class="value">${value || "-"}</div>
  </div>`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR");
}

function escapeHtml(value: any) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}