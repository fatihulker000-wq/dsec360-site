import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safeText(value: any) {
  return String(value || "-")
    .replace(/Ç/g, "C")
    .replace(/ç/g, "c")
    .replace(/Ğ/g, "G")
    .replace(/ğ/g, "g")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .replace(/Ö/g, "O")
    .replace(/ö/g, "o")
    .replace(/Ş/g, "S")
    .replace(/ş/g, "s")
    .replace(/Ü/g, "U")
    .replace(/ü/g, "u")
    .replace(/•/g, "-");
}

function formatDate(value: any) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("tr-TR");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("health_prescriptions")
      .select(`
        *,
        health_prescription_items(*)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Reçete bulunamadı." },
        { status: 404 }
      );
    }

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    let y = 805;

    page.drawRectangle({
      x: 0,
      y: 770,
      width: 595,
      height: 72,
      color: rgb(0.5, 0.05, 0.05),
    });

    page.drawText("D-SEC360", {
      x: 40,
      y: 808,
      size: 18,
      font: bold,
      color: rgb(1, 1, 1),
    });

    page.drawText("ISG Saglik - Emniyet - Cevre Yonetim Platformu", {
      x: 40,
      y: 790,
      size: 9,
      font,
      color: rgb(1, 1, 1),
    });

    page.drawText("E-RECETE RAPORU", {
      x: 370,
      y: 800,
      size: 16,
      font: bold,
      color: rgb(1, 1, 1),
    });

    y = 735;

    page.drawText("Recete Bilgileri", {
      x: 40,
      y,
      size: 14,
      font: bold,
      color: rgb(0.5, 0.05, 0.05),
    });

    y -= 24;

    page.drawText(safeText(`Recete Tarihi: ${formatDate(data.created_at)}`), {
      x: 40,
      y,
      size: 10,
      font,
    });

    page.drawText(safeText(`Recete No: ${data.e_prescription_no || data.prescription_no || "-"}`), {
      x: 320,
      y,
      size: 10,
      font,
    });

    y -= 20;

    page.drawText(safeText(`Tani: ${data.diagnosis_code || "-"} ${data.diagnosis_name || ""}`), {
      x: 40,
      y,
      size: 10,
      font,
    });

    y -= 20;

    page.drawText(safeText(`MEDULA Durumu: ${data.medula_status || "-"}`), {
      x: 40,
      y,
      size: 10,
      font,
    });

    page.drawText(safeText(`MEDULA Takip No: ${data.medula_tracking_no || "-"}`), {
      x: 320,
      y,
      size: 10,
      font,
    });

    y -= 32;

    page.drawText("Hekim Bilgileri", {
      x: 40,
      y,
      size: 14,
      font: bold,
      color: rgb(0.5, 0.05, 0.05),
    });

    y -= 22;

    page.drawText(safeText(`Hekim T.C.: ${data.doctor_identity_number || "-"}`), {
      x: 40,
      y,
      size: 10,
      font,
    });

    page.drawText(safeText(`Diploma No: ${data.doctor_diploma_no || "-"}`), {
      x: 320,
      y,
      size: 10,
      font,
    });

    y -= 34;

    page.drawText("Ilac Listesi", {
      x: 40,
      y,
      size: 14,
      font: bold,
      color: rgb(0.5, 0.05, 0.05),
    });

    y -= 20;

    page.drawRectangle({
      x: 40,
      y: y - 6,
      width: 515,
      height: 22,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText("Ilac Adi", { x: 48, y, size: 9, font: bold });
    page.drawText("Etkin Madde", { x: 200, y, size: 9, font: bold });
    page.drawText("Doz", { x: 335, y, size: 9, font: bold });
    page.drawText("Kullanim", { x: 420, y, size: 9, font: bold });

    y -= 24;

    for (const item of data.health_prescription_items || []) {
      if (y < 90) break;

      page.drawText(safeText(item.medicine_name || "-").slice(0, 28), {
        x: 48,
        y,
        size: 9,
        font,
      });

      page.drawText(safeText(item.active_ingredient || "-").slice(0, 26), {
        x: 200,
        y,
        size: 9,
        font,
      });

      page.drawText(safeText(item.dosage || "-").slice(0, 14), {
        x: 335,
        y,
        size: 9,
        font,
      });

      page.drawText(safeText(`${item.usage_type || "-"} / ${item.duration || "-"}`).slice(0, 24), {
        x: 420,
        y,
        size: 9,
        font,
      });

      y -= 18;

      const usageParts = [
        item.morning ? "Sabah" : "",
        item.noon ? "Ogle" : "",
        item.evening ? "Aksam" : "",
        item.night ? "Gece" : "",
        item.before_meal ? "Ac" : "",
        item.after_meal ? "Tok" : "",
      ].filter(Boolean);

      if (usageParts.length || item.notes) {
        page.drawText(
          safeText(`Kullanim detayi: ${usageParts.join(", ") || "-"} | Not: ${item.notes || "-"}`).slice(0, 95),
          { x: 58, y, size: 8, font, color: rgb(0.35, 0.35, 0.35) }
        );
        y -= 18;
      }

      page.drawLine({
        start: { x: 40, y: y + 8 },
        end: { x: 555, y: y + 8 },
        thickness: 0.5,
        color: rgb(0.88, 0.88, 0.88),
      });
    }

    y -= 18;

    page.drawText("Hekim Notu / Aciklama", {
      x: 40,
      y,
      size: 13,
      font: bold,
      color: rgb(0.5, 0.05, 0.05),
    });

    y -= 18;

    page.drawText(safeText(data.notes || "-").slice(0, 110), {
      x: 40,
      y,
      size: 9,
      font,
    });

    page.drawText("Bu belge D-SEC360 sistemi uzerinden olusturulmustur.", {
      x: 40,
      y: 42,
      size: 8,
      font,
      color: rgb(0.45, 0.45, 0.45),
    });

    page.drawText("D-SEC360 | Dijital Saglik - Emniyet - Cevre", {
      x: 350,
      y: 42,
      size: 8,
      font: bold,
      color: rgb(0.5, 0.05, 0.05),
    });

    const bytes = await pdf.save();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="DSEC-Recete-${id}.pdf"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e.message || "PDF oluşturulamadı.",
      },
      { status: 500 }
    );
  }
}