import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

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
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const width = page.getWidth();
  let y = 800;

  function text(t: string, x: number, size = 10, isBold = false) {
    page.drawText(t, {
      x,
      y,
      size,
      font: isBold ? bold : font,
      color: rgb(0, 0, 0),
    });
  }

  function line(yPos: number) {
    page.drawLine({
      start: { x: 40, y: yPos },
      end: { x: width - 40, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  }

  function row(label: string, value: string) {
    text(label, 50, 9, true);
    text(value, 210, 9);
    y -= 20;
  }

  page.drawRectangle({
    x: 35,
    y: 760,
    width: width - 70,
    height: 55,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  text("D-SEC360", 50, 18, true);
  y -= 22;
  text("EK-2 İŞE GİRİŞ / PERİYODİK MUAYENE FORMU", 150, 14, true);
  y -= 35;

  line(y);
  y -= 22;

  text("1. ÇALIŞAN BİLGİLERİ", 50, 12, true);
  y -= 22;

  row("Adı Soyadı", v(data.employee_name));
  row("T.C. Kimlik No", v(data.identity_number));
  row("Doğum Tarihi", d(data.birth_date));
  row("Cinsiyet", v(data.gender));
  row("Kan Grubu", v(data.blood_group));
  row("Telefon", v(data.phone));

  y -= 8;
  line(y);
  y -= 22;

  text("2. İŞYERİ BİLGİLERİ", 50, 12, true);
  y -= 22;

  row("Firma", v(data.company_name));
  row("Görev", v(data.job_title));
  row("Departman", v(data.department));
  row("İşe Giriş Tarihi", d(data.start_date));
  row("Tehlike Sınıfı", v(data.danger_class));
  row("NACE Kodu", v(data.nace_code));
  row("Muayene Türü", v(data.form_type));
  row("Muayene Tarihi", d(data.exam_date));
  row("Sonraki Muayene", d(data.next_exam_date));

  y -= 8;
  line(y);
  y -= 22;

  text("3. İŞE UYGUNLUK KANAATİ", 50, 12, true);
  y -= 22;

  row("Karar", v(data.decision));
  row("İşyeri Hekimi", v(data.doctor_name));
  row("Hekim Kanaati", v(data.doctor_opinion));

  y -= 40;

  page.drawLine({
    start: { x: 60, y },
    end: { x: 200, y },
    thickness: 1,
  });

  page.drawLine({
    start: { x: 230, y },
    end: { x: 370, y },
    thickness: 1,
  });

  page.drawLine({
    start: { x: 400, y },
    end: { x: 540, y },
    thickness: 1,
  });

  y -= 15;
  page.drawText("Çalışan İmzası", { x: 90, y, size: 9, font });
  page.drawText("İşveren / Yetkili", { x: 260, y, size: 9, font });
  page.drawText("İşyeri Hekimi", { x: 435, y, size: 9, font });

  const pdfBytes = await pdfDoc.save();
const pdfBuffer = Buffer.from(pdfBytes);

return new NextResponse(pdfBuffer,{
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="EK2-${data.id}.pdf"`,
    },
  });
}