import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    page.drawText("D-SEC E-REÇETE", {
      x: 50,
      y,
      size: 20,
      font: bold,
      color: rgb(0.55, 0, 0),
    });

    y -= 40;

    page.drawText(
      `Tanı: ${data.diagnosis_code || "-"} ${data.diagnosis_name || ""}`,
      {
        x: 50,
        y,
        size: 11,
        font,
      }
    );

    y -= 25;

    page.drawText(`Durum: ${data.status || "-"}`, {
      x: 50,
      y,
      size: 11,
      font,
    });

    y -= 35;

    page.drawText("İlaçlar", {
      x: 50,
      y,
      size: 14,
      font: bold,
    });

    y -= 25;

    for (const item of data.health_prescription_items || []) {
      page.drawText(
        `• ${item.medicine_name}   ${item.dosage || ""}`,
        {
          x: 60,
          y,
          size: 11,
          font,
        }
      );

      y -= 18;

      page.drawText(
        `${item.active_ingredient || ""}   ${item.duration || ""}`,
        {
          x: 75,
          y,
          size: 9,
          font,
        }
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
        error: e.message,
      },
      { status: 500 }
    );
  }
}
export {};