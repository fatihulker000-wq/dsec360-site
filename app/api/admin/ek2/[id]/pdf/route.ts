import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

  const { data, error } = await supabase
    .from("health_ek2_forms")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return new NextResponse("EK-2 bulunamadı.", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8"/>
<title>EK-2</title>

<style>
body{
font-family:Arial,Helvetica,sans-serif;
margin:30px;
color:#111;
}

table{
width:100%;
border-collapse:collapse;
margin-top:15px;
}

td,th{
border:1px solid #222;
padding:8px;
font-size:13px;
}

h1{
text-align:center;
margin-bottom:20px;
}

.section{
background:#efefef;
font-weight:bold;
}

@media print{
button{
display:none;
}
}
</style>

</head>

<body>

<button onclick="window.print()">
Yazdır
</button>

<h1>
EK-2 İŞE GİRİŞ / PERİYODİK MUAYENE FORMU
</h1>

<table>

<tr class="section">
<td colspan="2">Çalışan Bilgileri</td>
</tr>

<tr>
<td>Ad Soyad</td>
<td>${data.employee_name ?? ""}</td>
</tr>

<tr>
<td>T.C.</td>
<td>${data.identity_number ?? ""}</td>
</tr>

<tr>
<td>Firma</td>
<td>${data.company_name ?? ""}</td>
</tr>

<tr>
<td>Görev</td>
<td>${data.job_title ?? ""}</td>
</tr>

<tr>
<td>Muayene Tarihi</td>
<td>${data.exam_date ?? ""}</td>
</tr>

<tr>
<td>Sonraki Muayene</td>
<td>${data.next_exam_date ?? ""}</td>
</tr>

<tr>
<td>Karar</td>
<td><strong>${data.decision ?? ""}</strong></td>
</tr>

<tr>
<td>İşyeri Hekimi</td>
<td>${data.doctor_name ?? ""}</td>
</tr>

</table>

</body>
</html>
`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}