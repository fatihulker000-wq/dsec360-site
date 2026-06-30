import { createClient } from "@supabase/supabase-js";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const PAGE_W = 596;
const PAGE_H = 842;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function v(value: any) {
  return value === null || value === undefined || value === "" ? "" : String(value);
}

function d(value: any) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("tr-TR");
  } catch {
    return String(value);
  }
}

function firstNonEmpty(...values: any[]) {
  for (const item of values) {
    if (item !== null && item !== undefined && String(item).trim() !== "") {
      return String(item).trim();
    }
  }
  return "";
}

function boolValue(value: any) {
  const s = String(value ?? "").toLowerCase().trim();
  return ["true", "1", "evet", "yes", "var", "uygun"].includes(s);
}

function wrapText(font: PDFFont, text: any, maxWidth: number, size: number) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function drawText(
  page: PDFPage,
  text: any,
  x: number,
  y: number,
  font: PDFFont,
  size = 7.2,
  maxWidth?: number,
  maxLines = 1
) {
  const value = v(text);
  if (!value) return;

  if (!maxWidth) {
    page.drawText(value, {
      x,
      y,
      size,
      font,
      color: rgb(0, 0, 0),
    });
    return;
  }

  const lines = wrapText(font, value, maxWidth, size).slice(0, maxLines);
  let yy = y;

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: yy,
      size,
      font,
      color: rgb(0, 0, 0),
    });
    yy -= size + 2;
  }
}

function drawCheck(page: PDFPage, checked: boolean, x: number, y: number, bold: PDFFont) {
  if (!checked) return;

  page.drawText("X", {
    x,
    y,
    size: 8,
    font: bold,
    color: rgb(0, 0, 0),
  });
}

function drawDigitalNote(page: PDFPage, font: PDFFont, bold: PDFFont, code: string, url: string) {
  page.drawRectangle({
    x: 46,
    y: 10,
    width: 505,
    height: 13,
    color: rgb(1, 1, 1),
    opacity: 0.93,
  });

  drawText(page, `D-SEC360 doğrulama: ${url}`, 50, 14, font, 5.2, 345, 1);
  drawText(page, code, 424, 14, bold, 5.2, 125, 1);
}

function decisionText(data: any) {
  const decision = String(data.decision || "").toLowerCase();
  const job = firstNonEmpty(data.job_title, data.raw_json?.jobTitle, data.raw_json?.job_title, "................");

  if (decision.includes("şart") || decision.includes("sart") || decision.includes("kısıt") || decision.includes("kisit")) {
    return {
      first: "",
      second: `${job} şartı ile çalışmaya elverişlidir.`,
    };
  }

  if (decision.includes("çalışamaz") || decision.includes("calisamaz") || decision.includes("uygun değil") || decision.includes("uygun degil")) {
    return {
      first: `${job} işinde bedenen ve ruhen çalışmaya elverişli değildir.`,
      second: "",
    };
  }

  return {
    first: `${job} işinde bedenen ve ruhen çalışmaya elverişlidir.`,
    second: "",
  };
}

async function loadRequiredFile(filePath: string, label: string) {
  try {
    return await fs.readFile(filePath);
  } catch (error: any) {
    throw new Error(`${label} bulunamadı: ${filePath}`);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const templateBytes = await loadRequiredFile(
      path.join(process.cwd(), "public", "templates", "ek2-template.pdf"),
      "EK-2 şablonu"
    );

    const regularFontBytes = await loadRequiredFile(
      path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf"),
      "NotoSans-Regular.ttf"
    );

    const boldFontBytes = await loadRequiredFile(
      path.join(process.cwd(), "public", "fonts", "NotoSans-Bold.ttf"),
      "NotoSans-Bold.ttf"
    );

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const font = await pdfDoc.embedFont(regularFontBytes);
    const bold = await pdfDoc.embedFont(boldFontBytes);

    const templatePages = await pdfDoc.embedPdf(templateBytes, [0, 1, 2]);

    const page1 = pdfDoc.addPage([PAGE_W, PAGE_H]);
    const page2 = pdfDoc.addPage([PAGE_W, PAGE_H]);
    const page3 = pdfDoc.addPage([PAGE_W, PAGE_H]);

    page1.drawPage(templatePages[0], { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
    page2.drawPage(templatePages[1], { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
    page3.drawPage(templatePages[2], { x: 0, y: 0, width: PAGE_W, height: PAGE_H });

    const verificationCode = `DSEC-EK2-${String(data.id).slice(0, 8).toUpperCase()}`;
    const verifyUrl = `https://dsec360.com/verify/ek2/${data.id}`;

    const qrData = await QRCode.toDataURL(verifyUrl, { width: 180, margin: 1 });
    const qrImage = await pdfDoc.embedPng(qrData);

    const r = data.raw_json || {};

    const employeeName = firstNonEmpty(data.employee_name, r.employeeName, r.employee_name);
    const identityNumber = firstNonEmpty(data.identity_number, r.identityNumber, r.identity_number);
    const companyName = firstNonEmpty(data.company_name, r.companyName, r.company_name);
    const workplaceAddress = firstNonEmpty(data.workplace_address, r.workplaceAddress, r.workplace_address);
    const jobTitle = firstNonEmpty(data.job_title, r.jobTitle, r.job_title);
    const department = firstNonEmpty(data.department, r.department);
    const phoneOrEmail = firstNonEmpty(data.phone, r.phone, data.email, r.email);

    // =========================================================
    // SAYFA 1 - Resmi EK-2 şablonu alanları
    // =========================================================

    // İşyerinin
    drawText(page1, companyName, 166, 726, font, 7.4, 295, 1);
    drawText(page1, firstNonEmpty(r.sgkSicilNo, r.sgkNo), 166, 707, font, 7.4, 295, 1);
    drawText(page1, workplaceAddress, 166, 689, font, 7.4, 295, 2);
    drawText(page1, firstNonEmpty(r.workplacePhone, r.companyPhone, r.phone), 166, 671, font, 7.4, 295, 1);
    drawText(page1, firstNonEmpty(r.companyEmail, r.workplaceEmail, r.email), 166, 653, font, 7.4, 295, 1);

    // Beyan
    drawText(page1, employeeName, 66, 585, font, 7.2, 150, 1);

    // Fotoğraf kutusuna fotoğraf yoksa küçük doğrulama QR kodu
    page1.drawImage(qrImage, { x: 492, y: 523, width: 42, height: 42 });
    drawText(page1, verificationCode, 452, 511, font, 4.8, 116, 1);

    // Çalışanın
    drawText(page1, employeeName, 168, 510, font, 7.4, 360, 1);
    drawText(page1, identityNumber, 168, 492, font, 7.4, 360, 1);
    drawText(
      page1,
      firstNonEmpty(
        r.birthPlaceAndDate,
        `${v(r.birthPlace)} ${d(data.birth_date)}`.trim(),
        d(data.birth_date)
      ),
      168,
      474,
      font,
      7.4,
      360,
      1
    );
    drawText(page1, firstNonEmpty(data.gender, r.gender), 168, 456, font, 7.4, 360, 1);
    drawText(page1, firstNonEmpty(r.educationStatus, r.education), 168, 438, font, 7.4, 190, 1);
    drawText(page1, firstNonEmpty(r.maritalStatus), 168, 420, font, 7.4, 85, 1);
    drawText(page1, firstNonEmpty(r.childCount), 362, 420, font, 7.4, 60, 1);
    drawText(page1, firstNonEmpty(r.homeAddress, r.address), 168, 402, font, 7.0, 360, 2);
    drawText(page1, phoneOrEmail, 168, 384, font, 7.4, 360, 1);
    drawText(page1, jobTitle, 168, 366, font, 7.4, 360, 1);
    drawText(page1, firstNonEmpty(r.currentJobDescription, r.current_job_description, jobTitle), 168, 348, font, 7.0, 360, 2);
    drawText(page1, department, 168, 330, font, 7.4, 360, 1);

    // Daha önce çalıştığı yerler
    drawText(page1, firstNonEmpty(r.prevWork1Industry), 229, 293, font, 6.8, 78, 1);
    drawText(page1, firstNonEmpty(r.prevWork1Job), 327, 293, font, 6.8, 138, 1);
    drawText(page1, firstNonEmpty(r.prevWork1Dates), 482, 293, font, 6.8, 70, 1);

    drawText(page1, firstNonEmpty(r.prevWork2Industry), 229, 275, font, 6.8, 78, 1);
    drawText(page1, firstNonEmpty(r.prevWork2Job), 327, 275, font, 6.8, 138, 1);
    drawText(page1, firstNonEmpty(r.prevWork2Dates), 482, 275, font, 6.8, 70, 1);

    drawText(page1, firstNonEmpty(r.prevWork3Industry), 229, 257, font, 6.8, 78, 1);
    drawText(page1, firstNonEmpty(r.prevWork3Job), 327, 257, font, 6.8, 138, 1);
    drawText(page1, firstNonEmpty(r.prevWork3Dates), 482, 257, font, 6.8, 70, 1);

    // Özgeçmiş
    drawText(page1, firstNonEmpty(data.blood_group, r.bloodGroup, r.blood_group), 168, 224, font, 7.4, 360, 1);
    drawText(page1, firstNonEmpty(r.chronicDiseases, r.chronic_diseases), 168, 206, font, 7.0, 360, 2);
    drawText(page1, firstNonEmpty(r.tetanusVaccine, r.tetanus, r.vaccines), 168, 170, font, 7.0, 360, 1);
    drawText(page1, firstNonEmpty(r.hepatitisVaccine, r.hepatitis, r.vaccines), 168, 152, font, 7.0, 360, 1);
    drawText(page1, firstNonEmpty(r.otherVaccines, r.other_vaccines, r.vaccines), 168, 134, font, 7.0, 360, 1);

    // Soygeçmiş
    drawText(page1, firstNonEmpty(r.familyMother, r.motherHistory), 152, 99, font, 6.7, 80, 1);
    drawText(page1, firstNonEmpty(r.familyFather, r.fatherHistory), 282, 99, font, 6.7, 90, 1);
    drawText(page1, firstNonEmpty(r.familySibling, r.siblingHistory), 410, 99, font, 6.7, 90, 1);
    drawText(page1, firstNonEmpty(r.familyChild, r.childHistory), 520, 99, font, 6.7, 40, 1);

    // Tıbbi anamnez ilk sayfa notları / işaretleri
    drawCheck(page1, boolValue(r.cough), 495, 55, bold);
    drawCheck(page1, boolValue(r.dyspnea), 495, 38, bold);
    drawCheck(page1, boolValue(r.chestPain), 495, 21, bold);

    drawDigitalNote(page1, font, bold, verificationCode, verifyUrl);

    // =========================================================
    // SAYFA 2 - Resmi EK-2 şablonu alanları
    // =========================================================

    // Devam eden tıbbi anamnez notları
    drawText(page2, firstNonEmpty(r.ulcerNote), 432, 747, font, 6.8, 120, 1);
    drawText(page2, firstNonEmpty(r.hearingLossNote), 432, 729, font, 6.8, 120, 1);
    drawText(page2, firstNonEmpty(r.visionLossNote), 432, 711, font, 6.8, 120, 1);
    drawText(page2, firstNonEmpty(r.neurologicalDiseaseNote), 432, 693, font, 6.8, 120, 1);
    drawText(page2, firstNonEmpty(r.skinDiseaseNote), 432, 675, font, 6.8, 120, 1);
    drawText(page2, firstNonEmpty(r.foodPoisoningNote), 432, 641, font, 6.8, 120, 1);

    drawText(page2, firstNonEmpty(r.hospitalizationNote), 430, 608, font, 6.8, 120, 2);
    drawText(page2, firstNonEmpty(r.surgeries), 430, 575, font, 6.8, 120, 2);
    drawText(page2, firstNonEmpty(r.previousAccidents), 430, 543, font, 6.8, 120, 2);
    drawText(page2, firstNonEmpty(r.occupationalDiseaseHistory), 430, 509, font, 6.8, 120, 2);
    drawText(page2, firstNonEmpty(r.disabilityNote), 430, 474, font, 6.8, 120, 2);
    drawText(page2, firstNonEmpty(r.medicines), 430, 438, font, 6.8, 120, 2);

    // Sigara / alkol
    drawText(page2, firstNonEmpty(r.smokingStatus, r.smoking, r.habits), 168, 412, font, 6.8, 90, 1);
    drawText(page2, firstNonEmpty(r.smokingQuitBefore), 315, 394, font, 6.8, 60, 1);
    drawText(page2, firstNonEmpty(r.smokingDuration), 405, 394, font, 6.8, 60, 1);
    drawText(page2, firstNonEmpty(r.smokingAmount), 500, 394, font, 6.8, 60, 1);

    drawText(page2, firstNonEmpty(r.alcoholStatus, r.alcohol, r.habits), 168, 345, font, 6.8, 90, 1);
    drawText(page2, firstNonEmpty(r.alcoholQuitBefore), 315, 327, font, 6.8, 60, 1);
    drawText(page2, firstNonEmpty(r.alcoholDuration), 405, 327, font, 6.8, 60, 1);
    drawText(page2, firstNonEmpty(r.alcoholFrequency), 500, 327, font, 6.8, 60, 1);

    // Fizik muayene sonuçları
    drawText(page2, firstNonEmpty(r.eye), 198, 275, font, 6.8, 350, 1);
    drawText(page2, firstNonEmpty(r.earNoseThroat), 198, 258, font, 6.8, 350, 1);
    drawText(page2, firstNonEmpty(r.skin), 198, 241, font, 6.8, 350, 1);
    drawText(page2, firstNonEmpty(r.cardiovascular), 198, 224, font, 6.8, 350, 1);
    drawText(page2, firstNonEmpty(r.respiratory), 198, 207, font, 6.8, 350, 1);
    drawText(page2, firstNonEmpty(r.digestive), 198, 190, font, 6.8, 350, 1);
    drawText(page2, firstNonEmpty(r.genitourinary), 198, 173, font, 6.8, 350, 1);
    drawText(page2, firstNonEmpty(r.musculoskeletal), 198, 156, font, 6.8, 350, 1);
    drawText(page2, firstNonEmpty(r.neurological), 198, 139, font, 6.8, 350, 1);
    drawText(page2, firstNonEmpty(r.psychological), 198, 122, font, 6.8, 350, 1);
    drawText(page2, firstNonEmpty(r.otherPhysical), 198, 105, font, 6.8, 350, 1);

    drawText(page2, firstNonEmpty(r.systolic), 110, 87, font, 7.0, 35, 1);
    drawText(page2, firstNonEmpty(r.diastolic), 172, 87, font, 7.0, 35, 1);
    drawText(page2, firstNonEmpty(r.pulse), 110, 70, font, 7.0, 35, 1);
    drawText(page2, firstNonEmpty(r.height), 105, 53, font, 7.0, 35, 1);
    drawText(page2, firstNonEmpty(r.weight), 246, 53, font, 7.0, 35, 1);
    drawText(page2, firstNonEmpty(r.bmi), 425, 53, font, 7.0, 45, 1);

    drawDigitalNote(page2, font, bold, verificationCode, verifyUrl);

    // =========================================================
    // SAYFA 3 - Laboratuvar + Kanaat + Hekim bilgisi devamı
    // Şablon 3. sayfada hekim diploma bilgisi devam ettiği için
    // kanaat ve hekim kimlik alanlarını burada güvenli biçimde tamamlıyoruz.
    // =========================================================

    const result = decisionText(data);

    drawText(page3, firstNonEmpty(r.hemogram, r.biochemistry), 205, 785, font, 6.8, 340, 2);
    drawText(page3, firstNonEmpty(r.urine), 205, 765, font, 6.8, 340, 2);
    drawText(page3, firstNonEmpty(r.radiology), 205, 745, font, 6.8, 340, 2);
    drawText(page3, firstNonEmpty(r.audiometry), 205, 725, font, 6.8, 340, 2);
    drawText(page3, firstNonEmpty(r.sft), 205, 705, font, 6.8, 340, 2);
    drawText(page3, firstNonEmpty(r.psychologicalTests), 205, 685, font, 6.8, 340, 2);
    drawText(page3, firstNonEmpty(r.otherTests), 205, 665, font, 6.8, 340, 2);

    drawText(page3, result.first, 72, 615, bold, 8.2, 445, 2);
    drawText(page3, result.second, 72, 585, bold, 8.2, 445, 2);

    drawCheck(page3, boolValue(r.nightWorkSuitable), 150, 548, bold);
    drawCheck(page3, boolValue(r.nightWorkNotSuitable), 340, 548, bold);

    drawText(page3, d(data.exam_date), 435, 510, font, 8, 100, 1);
    drawText(page3, firstNonEmpty(data.doctor_name, r.doctorName, r.doctor_name), 105, 470, font, 8, 240, 1);
    drawText(page3, firstNonEmpty(r.doctorDiplomaNo), 170, 452, font, 7, 250, 1);
    drawText(page3, firstNonEmpty(r.doctorRegistryNo), 190, 434, font, 7, 250, 1);
    drawText(page3, firstNonEmpty(r.doctorCertificateNo), 235, 416, font, 7, 250, 1);

    page3.drawImage(qrImage, { x: 505, y: 40, width: 40, height: 40 });
    drawDigitalNote(page3, font, bold, verificationCode, verifyUrl);

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="EK2-${data.id}.pdf"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e?.message || "EK-2 PDF oluşturulamadı.",
      },
      { status: 500 }
    );
  }
}
