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
      return String(item);
    }
  }
  return "";
}

function wrapText(font: PDFFont, text: string, maxWidth: number, size: number) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
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
  size = 8,
  maxWidth?: number,
  maxLines = 3
) {
  const value = v(text);
  if (!value) return;

  if (!maxWidth) {
    page.drawText(value, { x, y, size, font, color: rgb(0, 0, 0) });
    return;
  }

  const lines = wrapText(font, value, maxWidth, size).slice(0, maxLines);
  let yy = y;

  for (const line of lines) {
    page.drawText(line, { x, y: yy, size, font, color: rgb(0, 0, 0) });
    yy -= size + 2;
  }
}

function drawDigitalNote(page: PDFPage, font: PDFFont, bold: PDFFont, code: string, url: string) {
  page.drawRectangle({
    x: 28,
    y: 8,
    width: 540,
    height: 18,
    color: rgb(1, 1, 1),
    opacity: 0.92,
  });

  drawText(page, `D-SEC360 doğrulama: ${url}`, 32, 14, font, 6, 360, 1);
  drawText(page, code, 430, 14, bold, 6, 130, 1);
}

function decisionText(data: any) {
  const decision = String(data.decision || "").toLowerCase();
  const job = v(data.job_title);

  if (decision.includes("şart") || decision.includes("sart")) {
    return {
      first: "",
      second: `${job} şartı ile çalışmaya elverişlidir.`,
    };
  }

  if (decision.includes("çalışamaz") || decision.includes("calisamaz")) {
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

    const templateBytes = await fs.readFile(
      path.join(process.cwd(), "public", "templates", "ek2-template.pdf")
    );

    const regularFontBytes = await fs.readFile(
      path.join(process.cwd(), "public", "fonts", "NotoSans-Regular.ttf")
    );

    const boldFontBytes = await fs.readFile(
      path.join(process.cwd(), "public", "fonts", "NotoSans-Bold.ttf")
    );

    const sourcePdf = await PDFDocument.load(templateBytes);
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const font = await pdfDoc.embedFont(regularFontBytes);
    const bold = await pdfDoc.embedFont(boldFontBytes);

    const copiedPages = await pdfDoc.copyPages(sourcePdf, [0, 1]);
    const page1 = copiedPages[0];
    const page2 = copiedPages[1];

    pdfDoc.addPage(page1);
    pdfDoc.addPage(page2);

    const verificationCode = `DSEC-EK2-${String(data.id).slice(0, 8).toUpperCase()}`;
    const verifyUrl = `https://dsec360.com/verify/ek2/${data.id}`;

    const qrData = await QRCode.toDataURL(verifyUrl, { width: 180, margin: 1 });
    const qrImage = await pdfDoc.embedPng(qrData);

    const r = data.raw_json || {};

    // =========================================================
    // SAYFA 1 - RESMİ EK-2 ŞABLON ALANLARI
    // Koordinatlar A4 şablon üzerinde ayarlanmıştır.
    // Gerekirse sadece x/y değerleri küçük küçük oynatılmalıdır.
    // =========================================================

    drawText(page1, data.company_name, 125, 747, font, 8, 322, 1);
    drawText(page1, firstNonEmpty(r.sgkSicilNo, r.sgkNo), 125, 730, font, 8, 322, 1);
    drawText(page1, firstNonEmpty(data.workplace_address, r.workplaceAddress), 125, 713, font, 8, 322, 2);
    drawText(page1, firstNonEmpty(r.workplacePhone, r.companyPhone), 125, 696, font, 8, 322, 1);
    drawText(page1, firstNonEmpty(r.companyEmail, r.workplaceEmail), 125, 679, font, 8, 322, 1);

    drawText(page1, data.employee_name, 272, 620, font, 8, 150, 1);

    drawText(page1, data.employee_name, 198, 554, font, 8, 350, 1);
    drawText(page1, data.identity_number, 198, 537, font, 8, 350, 1);
    drawText(page1, firstNonEmpty(r.birthPlaceAndDate, `${v(r.birthPlace)} ${d(data.birth_date)}`.trim(), d(data.birth_date)), 198, 520, font, 8, 350, 1);
    drawText(page1, data.gender, 198, 503, font, 8, 350, 1);
    drawText(page1, firstNonEmpty(r.educationStatus, r.education), 198, 486, font, 8, 170, 1);
    drawText(page1, firstNonEmpty(r.maritalStatus), 198, 469, font, 8, 70, 1);
    drawText(page1, firstNonEmpty(r.childCount), 315, 469, font, 8, 60, 1);
    drawText(page1, firstNonEmpty(r.homeAddress, r.address), 198, 452, font, 8, 350, 2);
    drawText(page1, data.phone, 198, 435, font, 8, 350, 1);
    drawText(page1, data.job_title, 198, 418, font, 8, 350, 1);
    drawText(page1, firstNonEmpty(r.currentJobDescription, data.job_title), 198, 401, font, 8, 350, 2);
    drawText(page1, data.department, 198, 384, font, 8, 350, 1);

    drawText(page1, firstNonEmpty(r.prevWork1Industry), 177, 350, font, 7, 95, 1);
    drawText(page1, firstNonEmpty(r.prevWork1Job), 302, 350, font, 7, 155, 1);
    drawText(page1, firstNonEmpty(r.prevWork1Dates), 468, 350, font, 7, 90, 1);
    drawText(page1, firstNonEmpty(r.prevWork2Industry), 177, 333, font, 7, 95, 1);
    drawText(page1, firstNonEmpty(r.prevWork2Job), 302, 333, font, 7, 155, 1);
    drawText(page1, firstNonEmpty(r.prevWork2Dates), 468, 333, font, 7, 90, 1);
    drawText(page1, firstNonEmpty(r.prevWork3Industry), 177, 316, font, 7, 95, 1);
    drawText(page1, firstNonEmpty(r.prevWork3Job), 302, 316, font, 7, 155, 1);
    drawText(page1, firstNonEmpty(r.prevWork3Dates), 468, 316, font, 7, 90, 1);

    drawText(page1, data.blood_group, 145, 282, font, 8, 405, 1);
    drawText(page1, r.chronicDiseases, 145, 264, font, 8, 405, 2);
    drawText(page1, firstNonEmpty(r.tetanusVaccine, r.vaccines), 145, 228, font, 8, 405, 1);
    drawText(page1, firstNonEmpty(r.hepatitisVaccine, r.vaccines), 145, 211, font, 8, 405, 1);
    drawText(page1, firstNonEmpty(r.otherVaccines, r.vaccines), 145, 194, font, 8, 405, 1);

    drawText(page1, firstNonEmpty(r.familyMother), 150, 157, font, 7, 100, 1);
    drawText(page1, firstNonEmpty(r.familyFather), 285, 157, font, 7, 100, 1);
    drawText(page1, firstNonEmpty(r.familySibling), 420, 157, font, 7, 100, 1);
    drawText(page1, firstNonEmpty(r.familyChild), 535, 157, font, 7, 40, 1);

    // QR kod fotoğraf alanına değil, fotoğraf kutusunun altına küçük doğrulama olarak eklenir.
    page1.drawImage(qrImage, { x: 500, y: 600, width: 48, height: 48 });
    drawText(page1, verificationCode, 456, 588, font, 5.5, 115, 1);
    drawDigitalNote(page1, font, bold, verificationCode, verifyUrl);

    // =========================================================
    // SAYFA 2 - RESMİ EK-2 ŞABLON ALANLARI
    // =========================================================

    drawText(page2, firstNonEmpty(r.hospitalizationNote), 438, 620, font, 7, 125, 2);
    drawText(page2, r.surgeries, 438, 589, font, 7, 125, 2);
    drawText(page2, r.previousAccidents, 438, 559, font, 7, 125, 2);
    drawText(page2, r.occupationalDiseaseHistory, 438, 524, font, 7, 125, 2);
    drawText(page2, firstNonEmpty(r.disabilityNote), 438, 489, font, 7, 125, 2);
    drawText(page2, r.medicines, 438, 454, font, 7, 125, 2);

    drawText(page2, firstNonEmpty(r.smokingStatus, r.habits), 148, 426, font, 7, 120, 1);
    drawText(page2, firstNonEmpty(r.alcoholStatus, r.habits), 148, 370, font, 7, 120, 1);

    drawText(page2, r.eye, 205, 310, font, 7, 350, 1);
    drawText(page2, r.earNoseThroat, 205, 293, font, 7, 350, 1);
    drawText(page2, r.skin, 205, 276, font, 7, 350, 1);
    drawText(page2, r.cardiovascular, 205, 259, font, 7, 350, 1);
    drawText(page2, r.respiratory, 205, 242, font, 7, 350, 1);
    drawText(page2, r.digestive, 205, 225, font, 7, 350, 1);
    drawText(page2, r.genitourinary, 205, 208, font, 7, 350, 1);
    drawText(page2, r.musculoskeletal, 205, 191, font, 7, 350, 1);
    drawText(page2, r.neurological, 205, 174, font, 7, 350, 1);
    drawText(page2, r.psychological, 205, 157, font, 7, 350, 1);
    drawText(page2, firstNonEmpty(r.otherPhysical), 205, 140, font, 7, 350, 1);

    drawText(page2, r.systolic, 118, 123, font, 8, 35, 1);
    drawText(page2, r.diastolic, 176, 123, font, 8, 35, 1);
    drawText(page2, r.pulse, 118, 106, font, 8, 35, 1);
    drawText(page2, r.height, 105, 89, font, 8, 35, 1);
    drawText(page2, r.weight, 237, 89, font, 8, 35, 1);
    drawText(page2, r.bmi, 390, 89, font, 8, 45, 1);

    drawText(page2, firstNonEmpty(r.hemogram, r.biochemistry), 205, 48, font, 7, 350, 1);
    drawText(page2, r.urine, 205, 31, font, 7, 350, 1);

    const result = decisionText(data);
    drawText(page2, result.first, 78, 112, font, 8, 415, 1);
    drawText(page2, result.second, 78, 87, font, 8, 415, 1);

    // İmza alanı
    drawText(page2, d(data.exam_date), 470, 52, font, 8, 80, 1);
    drawText(page2, data.doctor_name, 95, 35, font, 8, 240, 1);
    drawText(page2, firstNonEmpty(r.doctorDiplomaNo), 150, 22, font, 6.5, 240, 1);
    drawDigitalNote(page2, font, bold, verificationCode, verifyUrl);

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
