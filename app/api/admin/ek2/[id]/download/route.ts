import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function v(x: any) {
  return x === null || x === undefined || x === "" ? "-" : String(x);
}

function d(x: any) {
  if (!x || x === "-") return "-";

  const s = String(x).trim();

  if (!s || s === "gg.aa.yyyy") return "-";

  const date = new Date(s);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("tr-TR");
}

function pick(...arr: any[]) {
  for (const x of arr) if (x !== null && x !== undefined && String(x).trim() !== "") return String(x);
  return "-";
}

async function fontFile(name: string) {
  return fs.readFile(path.join(process.cwd(), "public", "fonts", name));
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("health_ek2_forms")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return new NextResponse("EK-2 bulunamadı.", { status: 404 });

    const r = data.raw_json || {};
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const font = await pdfDoc.embedFont(await fontFile("NotoSans-Regular.ttf"));
    const bold = await pdfDoc.embedFont(await fontFile("NotoSans-Bold.ttf"));

    const code = `DSEC-EK2-${String(data.id).slice(0, 8).toUpperCase()}`;
    const url = `https://dsec360.com/verify/ek2/${data.id}`;
    const qr = await pdfDoc.embedPng(await QRCode.toDataURL(url, { width: 160, margin: 1 }));

    function text(page: any, t: any, x: number, y: number, size = 8, b = false) {
      page.drawText(v(t), { x, y, size, font: b ? bold : font, color: rgb(0, 0, 0) });
    }

    function box(page: any, x: number, y: number, w: number, h: number, fill = false) {
      page.drawRectangle({
        x, y, width: w, height: h,
        borderColor: rgb(0.25, 0.25, 0.25),
        borderWidth: 0.6,
        color: fill ? rgb(0.94, 0.94, 0.94) : undefined,
      });
    }

    function drawSection(page: any, title: string, y: number) {
      box(page, 40, y, 515, 18, true);
      text(page, title, 48, y + 5, 8.5, true);
    }

    function row(page: any, y: number, a: string, bval: any, c: string, dval: any) {
      box(page, 40, y, 125, 21, true); box(page, 165, y, 150, 21);
      box(page, 315, y, 125, 21, true); box(page, 440, y, 115, 21);
      text(page, a, 46, y + 7, 7, true); text(page, bval, 171, y + 7, 7);
      text(page, c, 321, y + 7, 7, true); text(page, dval, 446, y + 7, 7);
    }

    function longRow(page: any, y: number, label: string, val: any) {
      box(page, 40, y, 125, 28, true); box(page, 165, y, 390, 28);
      text(page, label, 46, y + 15, 7, true);
      const s = v(val).slice(0, 160);
      text(page, s, 171, y + 15, 7);
    }

    const page1 = pdfDoc.addPage([595.28, 841.89]);

    box(page1, 35, 744, 525, 72);
    text(page1, "D-SEC360", 50, 790, 18, true);
    text(page1, "Sağlık • Emniyet • Çevre Yönetim Platformu", 50, 774, 8);
    text(page1, "EK-2 İŞE GİRİŞ / PERİYODİK MUAYENE FORMU", 140, 755, 12, true);
    text(page1, `Belge No: ${pick(data.file_no, code)}`, 365, 792, 7);
    text(page1, `Tarih: ${d(data.exam_date)}`, 365, 778, 7);
    page1.drawImage(qr, { x: 507, y: 762, width: 40, height: 40 });

    let y = 700;
    drawSection(page1, "1. ÇALIŞAN BİLGİLERİ", y); y -= 25;
    row(page1, y, "Adı Soyadı", pick(data.employee_name, r.employeeName), "T.C. Kimlik No", pick(data.identity_number, r.identityNumber)); y -= 21;
    row(page1, y, "Doğum Tarihi", d(pick(data.birth_date, r.birthDate)), "Cinsiyet", pick(data.gender, r.gender)); y -= 21;
    row(page1, y, "Kan Grubu", pick(data.blood_group, r.bloodGroup), "Telefon", pick(data.phone, r.phone)); y -= 42;

    drawSection(page1, "2. İŞYERİ BİLGİLERİ", y); y -= 25;
    row(page1, y, "Firma", pick(data.company_name, r.companyName), "Görev", pick(data.job_title, r.jobTitle)); y -= 21;
    row(page1, y, "Departman", pick(data.department, r.department), "İşe Giriş Tarihi", d(pick(data.start_date, r.startDate))); y -= 21;
    row(page1, y, "Tehlike Sınıfı", pick(data.danger_class, r.dangerClass), "NACE Kodu", pick(data.nace_code, r.naceCode)); y -= 21;
    row(page1, y, "Muayene Türü", pick(data.form_type, r.formType), "Muayene Tarihi", d(pick(data.exam_date, r.examDate))); y -= 42;

    drawSection(page1, "3. MESLEKİ ANAMNEZ", y); y -= 35;
    longRow(page1, y, "Önceki İşler", r.previousJobs); y -= 28;
    longRow(page1, y, "Mevcut İş Tanımı", pick(r.currentJobDescription, data.job_title)); y -= 28;
    longRow(page1, y, "Maruziyetler", r.exposures); y -= 28;
    longRow(page1, y, "KKD Kullanımı", r.ppeUsage); y -= 28;
    longRow(page1, y, "İş Kazaları", r.previousAccidents); y -= 28;
    longRow(page1, y, "Meslek Hastalığı", r.occupationalDiseaseHistory); y -= 42;

    drawSection(page1, "4. ÖZGEÇMİŞ / SOYGEÇMİŞ", y); y -= 35;
    longRow(page1, y, "Kronik Hastalıklar", r.chronicDiseases); y -= 28;
    longRow(page1, y, "Ameliyatlar", r.surgeries); y -= 28;
    longRow(page1, y, "İlaçlar", r.medicines); y -= 28;
    longRow(page1, y, "Alerjiler", r.allergies); y -= 28;
    longRow(page1, y, "Alışkanlıklar", r.habits); y -= 28;
    longRow(page1, y, "Soygeçmiş", r.familyHistory);

    const page2 = pdfDoc.addPage([595.28, 841.89]);
    box(page2, 35, 780, 525, 38);
    text(page2, "EK-2 İŞE GİRİŞ / PERİYODİK MUAYENE FORMU - DEVAM", 50, 798, 12, true);
    text(page2, `Belge No: ${pick(data.file_no, code)}`, 380, 800, 7);

    y = 740;
    drawSection(page2, "5. FİZİK MUAYENE / VİTAL BULGULAR", y); y -= 25;
    row(page2, y, "Boy", `${pick(r.height)} cm`, "Kilo", `${pick(r.weight)} kg`); y -= 21;
    row(page2, y, "BMI", pick(r.bmi), "SpO₂", pick(r.spo2)); y -= 21;
    row(page2, y, "Tansiyon", `${pick(r.systolic)} / ${pick(r.diastolic)}`, "Nabız", pick(r.pulse)); y -= 42;

    drawSection(page2, "6. SİSTEM MUAYENESİ", y); y -= 35;
    for (const [label, key] of [
      ["Baş - Boyun", "headNeck"], ["Göz", "eye"], ["KBB", "earNoseThroat"],
      ["Solunum", "respiratory"], ["Kardiyovasküler", "cardiovascular"],
      ["Sindirim", "digestive"], ["Ürogenital", "genitourinary"],
      ["Kas İskelet", "musculoskeletal"], ["Nörolojik", "neurological"],
      ["Deri", "skin"], ["Psikiyatrik", "psychological"],
    ]) { longRow(page2, y, label, r[key]); y -= 24; }

    y -= 20;
    drawSection(page2, "7. LABORATUVAR VE TETKİKLER", y); y -= 35;
    for (const [label, key] of [
      ["Hemogram", "hemogram"], ["Biyokimya", "biochemistry"], ["İdrar", "urine"],
      ["Akciğer Grafisi", "radiology"], ["EKG", "ekg"], ["Diğer", "otherTests"],
    ]) { longRow(page2, y, label, r[key]); y -= 24; }

    y -= 20;
    drawSection(page2, "8. İŞE UYGUNLUK KANAATİ", y); y -= 35;
    longRow(page2, y, "Karar", data.decision); y -= 28;
    longRow(page2, y, "Kısıtlar", r.restrictions); y -= 28;
    longRow(page2, y, "Öneriler", r.recommendations); y -= 28;
    longRow(page2, y, "Hekim Kanaati", pick(data.doctor_opinion, r.doctorOpinion)); y -= 70;

    page2.drawLine({ start: { x: 60, y }, end: { x: 200, y }, thickness: 1 });
    page2.drawLine({ start: { x: 230, y }, end: { x: 370, y }, thickness: 1 });
    page2.drawLine({ start: { x: 400, y }, end: { x: 540, y }, thickness: 1 });
    text(page2, "Çalışan İmzası", 92, y - 14, 8);
    text(page2, "İşveren / Yetkili", 260, y - 14, 8);
    text(page2, `İşyeri Hekimi: ${pick(data.doctor_name, r.doctorName)}`, 402, y - 14, 8);

    for (const [i, p] of pdfDoc.getPages().entries()) {
      text(p, `D-SEC360 doğrulama: ${url}`, 35, 18, 5.5);
      text(p, `${i + 1}/${pdfDoc.getPageCount()}`, 535, 18, 5.5);
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="EK2-${data.id}.pdf"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "EK-2 PDF oluşturulamadı." },
      { status: 500 }
    );
  }
}
