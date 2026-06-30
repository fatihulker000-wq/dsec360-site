import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function v(value: any) {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function d(value: any) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("tr-TR");
  } catch {
    return String(value);
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
    return new NextResponse("EK-2 bulunamadı.", { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const regularFontBytes = await fs.readFile(
    path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf")
  );

  const boldFontBytes = await fs.readFile(
    path.join(process.cwd(), "public", "fonts", "NotoSans-Bold.ttf")
  );

  const font = await pdfDoc.embedFont(regularFontBytes);
  const bold = await pdfDoc.embedFont(boldFontBytes);

  const verificationCode = `DSEC-EK2-${String(data.id).slice(0, 8).toUpperCase()}`;
  const verifyUrl = `https://dsec360.com/verify/ek2/${data.id}`;

  const qrData = await QRCode.toDataURL(verifyUrl, {
    width: 180,
    margin: 1,
  });

  const qrImage = await pdfDoc.embedPng(qrData);

  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;
  const margin = 36;

  let page: PDFPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  let y = 790;
  let pageNo = 1;

  function addFooter(p: PDFPage, currentPageNo: number) {
    p.drawText("D-SEC360 Sağlık Modülü", {
      x: margin,
      y: 24,
      size: 8,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    p.drawText(`Belge No: ${verificationCode}`, {
      x: 210,
      y: 24,
      size: 8,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    p.drawText(`Sayfa ${currentPageNo}`, {
      x: 515,
      y: 24,
      size: 8,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
  }

  function newPage() {
    addFooter(page, pageNo);
    pageNo += 1;
    page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    y = 790;
  }

  function ensureSpace(height: number) {
    if (y - height < 55) {
      newPage();
    }
  }

  function drawText(
    text: string,
    x: number,
    yy: number,
    size = 9,
    isBold = false,
    color = rgb(0.08, 0.1, 0.14)
  ) {
    page.drawText(text, {
      x,
      y: yy,
      size,
      font: isBold ? bold : font,
      color,
    });
  }

  function wrapText(text: string, maxWidth: number, size = 9, isBold = false) {
    const selectedFont = isBold ? bold : font;
    const words = v(text).split(" ");
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      const width = selectedFont.widthOfTextAtSize(test, size);

      if (width <= maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
    return lines.length ? lines : ["-"];
  }

  function sectionTitle(title: string) {
    ensureSpace(34);

    page.drawRectangle({
      x: margin,
      y: y - 18,
      width: A4_WIDTH - margin * 2,
      height: 22,
      color: rgb(0.5, 0.11, 0.11),
    });

    drawText(title, margin + 8, y - 12, 10, true, rgb(1, 1, 1));
    y -= 34;
  }

  function tableRow(label: string, value: string, label2?: string, value2?: string) {
    ensureSpace(28);

    const rowHeight = 24;
    const col1 = margin;
    const col2 = 170;
    const col3 = 310;
    const col4 = 450;

    page.drawRectangle({
      x: col1,
      y: y - rowHeight,
      width: A4_WIDTH - margin * 2,
      height: rowHeight,
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 0.6,
    });

    page.drawRectangle({
      x: col1,
      y: y - rowHeight,
      width: 130,
      height: rowHeight,
      color: rgb(0.94, 0.94, 0.94),
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 0.6,
    });

    drawText(label, col1 + 6, y - 15, 8, true);
    drawText(v(value), col2, y - 15, 8);

    if (label2) {
      page.drawRectangle({
        x: col3,
        y: y - rowHeight,
        width: 130,
        height: rowHeight,
        color: rgb(0.94, 0.94, 0.94),
        borderColor: rgb(0.6, 0.6, 0.6),
        borderWidth: 0.6,
      });

      drawText(label2, col3 + 6, y - 15, 8, true);
      drawText(v(value2), col4, y - 15, 8);
    }

    y -= rowHeight;
  }

  function bigRow(label: string, value: string) {
    const lines = wrapText(value, 380, 8);
    const rowHeight = Math.max(34, lines.length * 12 + 18);

    ensureSpace(rowHeight + 4);

    page.drawRectangle({
      x: margin,
      y: y - rowHeight,
      width: A4_WIDTH - margin * 2,
      height: rowHeight,
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 0.6,
    });

    page.drawRectangle({
      x: margin,
      y: y - rowHeight,
      width: 140,
      height: rowHeight,
      color: rgb(0.94, 0.94, 0.94),
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 0.6,
    });

    drawText(label, margin + 6, y - 16, 8, true);

    let lineY = y - 16;
    for (const line of lines) {
      drawText(line, margin + 150, lineY, 8);
      lineY -= 12;
    }

    y -= rowHeight;
  }

  function header() {
    page.drawRectangle({
      x: margin,
      y: 720,
      width: A4_WIDTH - margin * 2,
      height: 100,
      borderColor: rgb(0.15, 0.15, 0.15),
      borderWidth: 1,
    });

    drawText("D-SEC360", margin + 12, 792, 20, true, rgb(0.5, 0.11, 0.11));
    drawText("Sağlık • Emniyet • Çevre Yönetim Platformu", margin + 12, 774, 9);

    drawText("EK-2 İŞE GİRİŞ / PERİYODİK MUAYENE FORMU", 148, 744, 13, true);

    drawText(`Belge No: ${verificationCode}`, 360, 792, 8, true);
    drawText(`Revizyon: ${v(data.revision_no)}`, 360, 778, 8);
    drawText(`Oluşturma: ${d(data.created_at)}`, 360, 764, 8);

    page.drawImage(qrImage, {
      x: 495,
      y: 755,
      width: 55,
      height: 55,
    });

    page.drawRectangle({
      x: margin,
      y: 690,
      width: A4_WIDTH - margin * 2,
      height: 24,
      borderColor: rgb(0.65, 0.65, 0.65),
      borderWidth: 0.8,
    });

    drawText(
      `Bu belge D-SEC360 üzerinden oluşturulmuştur. Doğrulama: ${verifyUrl}`,
      margin + 8,
      699,
      7
    );

    y = 665;
  }

  header();

  sectionTitle("1. ÇALIŞAN BİLGİLERİ");
  tableRow("Adı Soyadı", v(data.employee_name), "T.C. Kimlik No", v(data.identity_number));
  tableRow("Doğum Tarihi", d(data.birth_date), "Cinsiyet", v(data.gender));
  tableRow("Kan Grubu", v(data.blood_group), "Telefon", v(data.phone));

  y -= 12;

  sectionTitle("2. İŞYERİ BİLGİLERİ");
  tableRow("Firma", v(data.company_name), "Görev", v(data.job_title));
  tableRow("Departman", v(data.department), "İşe Giriş Tarihi", d(data.start_date));
  tableRow("Tehlike Sınıfı", v(data.danger_class), "NACE Kodu", v(data.nace_code));
  tableRow("Muayene Türü", v(data.form_type), "Muayene Tarihi", d(data.exam_date));
  tableRow("Sonraki Muayene", d(data.next_exam_date), "Durum", v(data.status));

  y -= 12;

  sectionTitle("3. MESLEKİ ANAMNEZ");
  bigRow("Önceki İşler", v(data.raw_json?.previousJobs));
  bigRow("Mevcut İş Tanımı", v(data.raw_json?.currentJobDescription));
  bigRow("Mesleki Maruziyetler", v(data.raw_json?.exposures));
  bigRow("KKD Kullanımı", v(data.raw_json?.ppeUsage));
  bigRow("İş Kazaları", v(data.raw_json?.previousAccidents));
  bigRow("Meslek Hastalığı", v(data.raw_json?.occupationalDiseaseHistory));

  y -= 12;

  sectionTitle("4. ÖZGEÇMİŞ / SOYGEÇMİŞ");
  bigRow("Kronik Hastalıklar", v(data.raw_json?.chronicDiseases));
  bigRow("Geçirilmiş Ameliyatlar", v(data.raw_json?.surgeries));
  bigRow("Sürekli Kullanılan İlaçlar", v(data.raw_json?.medicines));
  bigRow("Alerjiler", v(data.raw_json?.allergies));
  bigRow("Alışkanlıklar", v(data.raw_json?.habits));
  bigRow("Soygeçmiş", v(data.raw_json?.familyHistory));

  y -= 12;

  sectionTitle("5. FİZİK MUAYENE / VİTAL BULGULAR");
  tableRow("Boy", `${v(data.raw_json?.height)} cm`, "Kilo", `${v(data.raw_json?.weight)} kg`);
  tableRow("BMI", v(data.raw_json?.bmi), "SpO₂", v(data.raw_json?.spo2));
  tableRow(
    "Tansiyon",
    `${v(data.raw_json?.systolic)} / ${v(data.raw_json?.diastolic)}`,
    "Nabız",
    v(data.raw_json?.pulse)
  );
  tableRow("Ateş", v(data.raw_json?.temperature), "Muayene Sonucu", v(data.decision));

  y -= 12;

  sectionTitle("6. SİSTEM MUAYENESİ");
  bigRow("Baş - Boyun", v(data.raw_json?.headNeck));
  bigRow("Göz", v(data.raw_json?.eye));
  bigRow("Kulak Burun Boğaz", v(data.raw_json?.earNoseThroat));
  bigRow("Solunum Sistemi", v(data.raw_json?.respiratory));
  bigRow("Kardiyovasküler Sistem", v(data.raw_json?.cardiovascular));
  bigRow("Sindirim Sistemi", v(data.raw_json?.digestive));
  bigRow("Ürogenital Sistem", v(data.raw_json?.genitourinary));
  bigRow("Kas İskelet Sistemi", v(data.raw_json?.musculoskeletal));
  bigRow("Nörolojik Sistem", v(data.raw_json?.neurological));
  bigRow("Deri", v(data.raw_json?.skin));
  bigRow("Psikiyatrik Değerlendirme", v(data.raw_json?.psychological));

  y -= 12;

  sectionTitle("7. LABORATUVAR VE TETKİKLER");
  bigRow("Hemogram", v(data.raw_json?.hemogram));
  bigRow("Biyokimya", v(data.raw_json?.biochemistry));
  bigRow("İdrar Tetkiki", v(data.raw_json?.urine));
  bigRow("Akciğer Grafisi", v(data.raw_json?.radiology));
  bigRow("Odyometri", v(data.raw_json?.audiometry));
  bigRow("Solunum Fonksiyon Testi", v(data.raw_json?.sft));
  bigRow("Görme Testi", v(data.raw_json?.vision));
  bigRow("EKG", v(data.raw_json?.ekg));
  bigRow("Aşı Durumu", v(data.raw_json?.vaccines));
  bigRow("Diğer Tetkikler", v(data.raw_json?.otherTests));

  y -= 12;

  sectionTitle("8. İŞE UYGUNLUK KANAATİ");
  tableRow("Karar", v(data.decision), "İşyeri Hekimi", v(data.doctor_name));
  bigRow("Çalışma Kısıtları", v(data.raw_json?.restrictions));
  bigRow("Öneriler", v(data.raw_json?.recommendations));
  bigRow("Hekim Kanaati", v(data.doctor_opinion));
  bigRow("İmza / Kaşe Notu", v(data.signature_note));

  ensureSpace(120);
  y -= 36;

  page.drawLine({ start: { x: 60, y }, end: { x: 200, y }, thickness: 1 });
  page.drawLine({ start: { x: 230, y }, end: { x: 370, y }, thickness: 1 });
  page.drawLine({ start: { x: 400, y }, end: { x: 540, y }, thickness: 1 });

  y -= 15;

  drawText("Çalışan İmzası", 90, y, 9);
  drawText("İşveren / Yetkili", 260, y, 9);
  drawText("İşyeri Hekimi", 435, y, 9);

  addFooter(page, pageNo);

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="EK2-${data.id}.pdf"`,
    },
  });
}
