import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function value(v: any) {
  return v ?? "";
}

function formatDate(v: any) {
  if (!v) return "";

  try {
    return new Date(v).toLocaleDateString("tr-TR");
  } catch {
    return v;
  }
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
    });
  }

  const verificationCode = `DSEC-EK2-${String(data.id).slice(0, 8).toUpperCase()}`;
   const verifyUrl = `https://dsec360.com/verify/ek2/${data.id}`;
  

  const html = `
<!DOCTYPE html>

<html lang="tr">

<head>

<meta charset="utf-8"/>

<title>D-SEC EK-2</title>

<style>

@page{
    size:A4;
    margin:12mm;
}

*{
    box-sizing:border-box;
}

body{
    margin:0;
    font-family:Arial,Helvetica,sans-serif;
    color:#111827;
    background:white;
}

.page{
    width:100%;
}

.header{
    border:2px solid #222;
    padding:12px;
    margin-bottom:12px;
}

.logo{
    font-size:26px;
    font-weight:900;
    color:#7f1d1d;
}

.subtitle{
    margin-top:4px;
    font-size:13px;
}

.title{
    margin-top:18px;
    text-align:center;
    font-size:24px;
    font-weight:900;
}

.info{
    margin-top:18px;
    width:100%;
    border-collapse:collapse;
}

.info td{
    border:1px solid #444;
    padding:7px;
    font-size:12px;
}

.section{
    margin-top:18px;
}

.section-title{
    background:#7f1d1d;
    color:white;
    padding:8px;
    font-weight:900;
    font-size:14px;
}

.table{
    width:100%;
    border-collapse:collapse;
}

.table td{
    border:1px solid #555;
    padding:7px;
    font-size:12px;
}

.label{
    width:28%;
    background:#f4f4f4;
    font-weight:bold;
}

.footer{
    margin-top:30px;
    display:flex;
    justify-content:space-between;
}

.sign{
    width:32%;
    text-align:center;
}

.sign-line{
    margin-top:70px;
    border-top:1px solid #000;
    padding-top:8px;
}

@media print{

button{
display:none;
}

body{
margin:0;
}

}

</style>

</head>

<body>

<button
style="
position:fixed;
top:15px;
right:15px;
padding:10px 18px;
background:#7f1d1d;
color:white;
border:none;
border-radius:8px;
cursor:pointer;
font-weight:bold;
"
onclick="window.print()">

YAZDIR

</button>

<div class="page">

<div class="header">

<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">

<div>
<div class="logo">D-SEC360</div>
<div class="subtitle">Sağlık • Emniyet • Çevre Yönetim Platformu</div>
</div>

<div style="text-align:right;font-size:11px;line-height:1.6;">
<b>Belge No:</b> ${value(data.file_no) || verificationCode}<br/>
<b>Doğrulama Kodu:</b> ${verificationCode}<br/>
<b>Oluşturma:</b> ${formatDate(data.created_at)}
</div>

</div>

<div class="title">
EK-2 İŞE GİRİŞ / PERİYODİK MUAYENE FORMU
</div>

<div style="
margin-top:10px;
border:1px solid #999;
padding:8px;
font-size:11px;
display:flex;
justify-content:space-between;
gap:12px;
align-items:center;
">

<div>
Bu belge D-SEC360 Sağlık Modülü üzerinden dijital olarak oluşturulmuştur.
<br/>
Doğrulama adresi: ${verifyUrl}
</div>

<div style="
width:72px;
height:72px;
border:2px solid #111;
display:grid;
place-items:center;
font-size:9px;
text-align:center;
font-weight:900;
">
QR<br/>DOĞRULAMA
</div>

</div>

</div>

<div class="section">

<div class="section-title">
1. ÇALIŞAN BİLGİLERİ
</div>

<table class="table">

<tr>
<td class="label">Adı Soyadı</td>
<td>${value(data.employee_name)}</td>

<td class="label">T.C. Kimlik No</td>
<td>${value(data.identity_number)}</td>
</tr>

<tr>
<td class="label">Doğum Tarihi</td>
<td>${formatDate(data.birth_date)}</td>

<td class="label">Cinsiyet</td>
<td>${value(data.gender)}</td>
</tr>

<tr>
<td class="label">Kan Grubu</td>
<td>${value(data.blood_group)}</td>

<td class="label">Telefon</td>
<td>${value(data.phone)}</td>
</tr>

</table>

</div>

<div class="section">

<div class="section-title">
2. İŞYERİ BİLGİLERİ
</div>

<table class="table">

<tr>
<td class="label">Firma</td>
<td colspan="3">
${value(data.company_name)}
</td>
</tr>

<tr>
<td class="label">Görev</td>
<td>
${value(data.job_title)}
</td>

<td class="label">Departman</td>
<td>
${value(data.department)}
</td>
</tr>

<tr>
<td class="label">İşe Giriş Tarihi</td>
<td>
${formatDate(data.start_date)}
</td>

<td class="label">Tehlike Sınıfı</td>
<td>
${value(data.danger_class)}
</td>
</tr>

<tr>
<td class="label">NACE Kodu</td>
<td>
${value(data.nace_code)}
</td>

<td class="label">Muayene Türü</td>
<td>
${value(data.form_type)}
</td>
</tr>

<tr>
<td class="label">Muayene Tarihi</td>
<td>
${formatDate(data.exam_date)}
</td>

<td class="label">Sonraki Muayene</td>
<td>
${formatDate(data.next_exam_date)}
</td>
</tr>

</table>

</div>


<div class="section">

<div class="section-title">
3. MESLEKİ ANAMNEZ
</div>

<table class="table">

<tr>
<td class="label">Önceki İşler</td>
<td colspan="3">${value(data.raw_json?.previousJobs)}</td>
</tr>

<tr>
<td class="label">Mevcut İş Tanımı</td>
<td colspan="3">${value(data.raw_json?.currentJobDescription)}</td>
</tr>

<tr>
<td class="label">Mesleki Maruziyetler</td>
<td colspan="3">${value(data.raw_json?.exposures)}</td>
</tr>

<tr>
<td class="label">KKD Kullanımı</td>
<td colspan="3">${value(data.raw_json?.ppeUsage)}</td>
</tr>

<tr>
<td class="label">İş Kazaları</td>
<td colspan="3">${value(data.raw_json?.previousAccidents)}</td>
</tr>

<tr>
<td class="label">Meslek Hastalığı</td>
<td colspan="3">${value(data.raw_json?.occupationalDiseaseHistory)}</td>
</tr>

</table>

</div>

<div class="section">

<div class="section-title">
4. ÖZGEÇMİŞ / SOYGEÇMİŞ
</div>

<table class="table">

<tr>
<td class="label">Kronik Hastalıklar</td>
<td colspan="3">${value(data.raw_json?.chronicDiseases)}</td>
</tr>

<tr>
<td class="label">Geçirilmiş Ameliyatlar</td>
<td colspan="3">${value(data.raw_json?.surgeries)}</td>
</tr>

<tr>
<td class="label">Sürekli Kullanılan İlaçlar</td>
<td colspan="3">${value(data.raw_json?.medicines)}</td>
</tr>

<tr>
<td class="label">Alerjiler</td>
<td colspan="3">${value(data.raw_json?.allergies)}</td>
</tr>

<tr>
<td class="label">Alışkanlıklar</td>
<td colspan="3">${value(data.raw_json?.habits)}</td>
</tr>

<tr>
<td class="label">Soygeçmiş</td>
<td colspan="3">${value(data.raw_json?.familyHistory)}</td>
</tr>

</table>

</div>

<div class="section">

<div class="section-title">
5. FİZİK MUAYENE ve VİTAL BULGULAR
</div>

<table class="table">

<tr>
<td class="label">Boy</td>
<td>${value(data.raw_json?.height)} cm</td>

<td class="label">Kilo</td>
<td>${value(data.raw_json?.weight)} kg</td>
</tr>

<tr>
<td class="label">BMI</td>
<td>${value(data.raw_json?.bmi)}</td>

<td class="label">SpO₂</td>
<td>${value(data.raw_json?.spo2)}</td>
</tr>

<tr>
<td class="label">Tansiyon</td>
<td>
${value(data.raw_json?.systolic)}
/
${value(data.raw_json?.diastolic)}
</td>

<td class="label">Nabız</td>
<td>${value(data.raw_json?.pulse)}</td>
</tr>

<tr>
<td class="label">Ateş</td>
<td>${value(data.raw_json?.temperature)}</td>

<td class="label">Muayene Sonucu</td>
<td>${value(data.decision)}</td>
</tr>

</table>

</div>

<div class="section">

<div class="section-title">
FİZİK MUAYENE SİSTEM DEĞERLENDİRMESİ
</div>

<table class="table">

<tr>
<td class="label">Baş - Boyun</td>
<td>${value(data.raw_json?.headNeck)}</td>
</tr>

<tr>
<td class="label">Göz</td>
<td>${value(data.raw_json?.eye)}</td>
</tr>

<tr>
<td class="label">Kulak Burun Boğaz</td>
<td>${value(data.raw_json?.earNoseThroat)}</td>
</tr>

<tr>
<td class="label">Solunum Sistemi</td>
<td>${value(data.raw_json?.respiratory)}</td>
</tr>

<tr>
<td class="label">Kardiyovasküler Sistem</td>
<td>${value(data.raw_json?.cardiovascular)}</td>
</tr>

<tr>
<td class="label">Sindirim Sistemi</td>
<td>${value(data.raw_json?.digestive)}</td>
</tr>

<tr>
<td class="label">Ürogenital Sistem</td>
<td>${value(data.raw_json?.genitourinary)}</td>
</tr>

<tr>
<td class="label">Kas İskelet Sistemi</td>
<td>${value(data.raw_json?.musculoskeletal)}</td>
</tr>

<tr>
<td class="label">Nörolojik Sistem</td>
<td>${value(data.raw_json?.neurological)}</td>
</tr>

<tr>
<td class="label">Deri</td>
<td>${value(data.raw_json?.skin)}</td>
</tr>

<tr>
<td class="label">Psikiyatrik Değerlendirme</td>
<td>${value(data.raw_json?.psychological)}</td>
</tr>

</table>

</div>

<div class="section">

<div class="section-title">
6. LABORATUVAR ve TETKİKLER
</div>

<table class="table">

<tr>
<td class="label">Hemogram</td>
<td colspan="3">${value(data.raw_json?.hemogram)}</td>
</tr>

<tr>
<td class="label">Biyokimya</td>
<td colspan="3">${value(data.raw_json?.biochemistry)}</td>
</tr>

<tr>
<td class="label">İdrar Tetkiki</td>
<td colspan="3">${value(data.raw_json?.urine)}</td>
</tr>

<tr>
<td class="label">Akciğer Grafisi</td>
<td colspan="3">${value(data.raw_json?.radiology)}</td>
</tr>

<tr>
<td class="label">Odyometri</td>
<td colspan="3">${value(data.raw_json?.audiometry)}</td>
</tr>

<tr>
<td class="label">Solunum Fonksiyon Testi</td>
<td colspan="3">${value(data.raw_json?.sft)}</td>
</tr>

<tr>
<td class="label">Görme Testi</td>
<td colspan="3">${value(data.raw_json?.vision)}</td>
</tr>

<tr>
<td class="label">EKG</td>
<td colspan="3">${value(data.raw_json?.ekg)}</td>
</tr>

<tr>
<td class="label">Aşı Durumu</td>
<td colspan="3">${value(data.raw_json?.vaccines)}</td>
</tr>

<tr>
<td class="label">Diğer Tetkikler</td>
<td colspan="3">${value(data.raw_json?.otherTests)}</td>
</tr>

</table>

</div>

<div class="section">

<div class="section-title">
7. İŞE UYGUNLUK KANAATİ
</div>

<table class="table">

<tr>
<td class="label">Karar</td>
<td colspan="3">
<b>${value(data.decision)}</b>
</td>
</tr>

<tr>
<td class="label">Çalışma Kısıtları</td>
<td colspan="3">
${value(data.raw_json?.restrictions)}
</td>
</tr>

<tr>
<td class="label">Öneriler</td>
<td colspan="3">
${value(data.raw_json?.recommendations)}
</td>
</tr>

<tr>
<td class="label">Hekim Kanaati</td>
<td colspan="3">
${value(data.doctor_opinion)}
</td>
</tr>

</table>

</div>

<div class="footer">

<div class="sign">

<div class="sign-line">
Çalışan İmzası
</div>

</div>

<div class="sign">

<div class="sign-line">
İşveren / Yetkili
</div>

</div>

<div class="sign">

<div class="sign-line">
İşyeri Hekimi<br>
${value(data.doctor_name)}
</div>

</div>

</div>

<hr style="margin-top:40px">

<div style="
display:flex;
justify-content:space-between;
font-size:11px;
color:#666;
">

<div>
D-SEC360 Sağlık Modülü
</div>

<div>
Belge No :
${value(data.file_no) || verificationCode}
</div>

<div>
Revizyon :
${value(data.revision_no)}
</div>

</div>

</div>

</body>

</html>
`;

return new NextResponse(html,{
headers:{
"Content-Type":"text/html;charset=utf-8",
},
});

}
