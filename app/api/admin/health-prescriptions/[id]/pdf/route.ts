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

    let y = 800;

    page.drawText(safeText("D-SEC E-REÇETE"), {
      x: 50,
      y,
      size: 20,
      font: bold,
      color: rgb(0.55, 0, 0),
    });

    y -= 40;

    page.drawText(
      safeText(`Tanı: ${data.diagnosis_code || "-"} ${data.diagnosis_name || ""}`),
      { x: 50, y, size: 11, font }
    );

    y -= 25;

    page.drawText(safeText(`Durum: ${data.status || "-"}`), {
      x: 50,
      y,
      size: 11,
      font,
    });

    y -= 35;

    page.drawText(safeText("İlaçlar"), {
      x: 50,
      y,
      size: 14,
      font: bold,
    });

    y -= 25;

    for (const item of data.health_prescription_items || []) {
      page.drawText(
        safeText(`- ${item.medicine_name || "-"}   ${item.dosage || ""}`),
        { x: 60, y, size: 11, font }
      );

      y -= 18;

      page.drawText(
        safeText(`${item.active_ingredient || ""}   ${item.duration || ""}`),
        { x: 75, y, size: 9, font }
      );

      y -= 25;
    }

    const bytes = await pdf.save();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Recete-${id}.pdf"`,
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