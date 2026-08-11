import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  PDFDocument,
  PDFFont,
  PDFPage,
  rgb,
} from "pdf-lib";

import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const A4_PORTRAIT: [number, number] = [595.28, 841.89];
const A4_LANDSCAPE: [number, number] = [841.89, 595.28];

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function formatDate(value?: number | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR");
}

function dangerLabel(value?: string | null): string {
  switch (text(value).toUpperCase()) {
    case "AZ_TEHLIKELI":
      return "Az Tehlikeli";
    case "TEHLIKELI":
      return "Tehlikeli";
    case "COK_TEHLIKELI":
      return "Çok Tehlikeli";
    default:
      return text(value) || "-";
  }
}

function renewalYears(value?: string | null): number | null {
  switch (text(value).toUpperCase()) {
    case "AZ_TEHLIKELI":
      return 6;
    case "TEHLIKELI":
      return 4;
    case "COK_TEHLIKELI":
      return 2;
    default:
      return null;
  }
}

function addYears(base: Date, years: number): Date {
  const result = new Date(base);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

function levelLabel(level?: string | null): string {
  switch (level) {
    case "KABUL_EDILEBILIR":
      return "Kabul Edilebilir";
    case "KESIN_RISK":
      return "Kesin Risk";
    case "ONEMLI_RISK":
      return "Önemli Risk";
    case "YUKSEK_RISK":
      return "Yüksek Risk";
    case "COK_YUKSEK_RISK":
      return "Çok Yüksek Risk";
    default:
      return "-";
  }
}

function safeFileName(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function wrapText(
  input: string,
  maxWidth: number,
  font: PDFFont,
  fontSize: number
): string[] {
  const output: string[] = [];

  for (const paragraph of String(input || "").replace(/\r/g, "").split("\n")) {
    if (!paragraph.trim()) {
      output.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        line = candidate;
      } else {
        if (line) output.push(line);
        line = word;
      }
    }

    if (line) output.push(line);
  }

  return output;
}

function drawWrapped(
  page: PDFPage,
  value: string,
  x: number,
  y: number,
  width: number,
  font: PDFFont,
  size: number,
  lineHeight = size + 3,
  color = rgb(0.18, 0.2, 0.24)
): number {
  const lines = wrapText(value, width, font, size);
  let currentY = y;

  for (const line of lines) {
    page.drawText(line || " ", {
      x,
      y: currentY,
      size,
      font,
      color,
    });
    currentY -= lineHeight;
  }

  return currentY;
}

function drawSectionTitle(
  page: PDFPage,
  title: string,
  y: number,
  bold: PDFFont
): number {
  page.drawRectangle({
    x: 42,
    y: y - 5,
    width: 511,
    height: 25,
    color: rgb(0.96, 0.94, 0.945),
  });

  page.drawText(title, {
    x: 50,
    y: y + 3,
    size: 11,
    font: bold,
    color: rgb(0.36, 0.09, 0.14),
  });

  return y - 34;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firmId = text(searchParams.get("firmId"));

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "DORA firma ID zorunludur.",
        },
        { status: 400 }
      );
    }

    const { data: firm, error: firmError } = await supabase
      .from("dora_firms")
      .select("*")
      .eq("id", firmId)
      .eq("is_deleted", false)
      .maybeSingle();

    if (firmError) throw firmError;

    if (!firm) {
      return NextResponse.json(
        {
          success: false,
          error: "DORA firması bulunamadı.",
        },
        { status: 404 }
      );
    }

    const { data: risks, error: riskError } = await supabase
      .from("dora_risks")
      .select("*")
      .eq("firm_id", firmId)
      .eq("is_deleted", false)
      .order("fk_score", { ascending: false });

    if (riskError) throw riskError;

    const allRisks = Array.isArray(risks) ? risks : [];

    const regularPath = path.join(
      process.cwd(),
      "public",
      "fonts",
      "NotoSans-Regular.ttf"
    );

    const boldPath = path.join(
      process.cwd(),
      "public",
      "fonts",
      "NotoSans-Bold.ttf"
    );

    if (!fs.existsSync(regularPath)) {
      return NextResponse.json(
        {
          success: false,
          error: "NotoSans-Regular.ttf bulunamadı.",
        },
        { status: 500 }
      );
    }

    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);

    const regularBytes = fs.readFileSync(regularPath);
    const boldBytes = fs.existsSync(boldPath)
      ? fs.readFileSync(boldPath)
      : regularBytes;

    // Türkçe karakterlerde subset sorunu yaşamamak için tam font gömülür.
    const regular = await pdf.embedFont(regularBytes, { subset: false });
    const bold = await pdf.embedFont(boldBytes, { subset: false });

    const generatedAt = new Date();
    const years = renewalYears(firm.danger_class);
    const periodicRenewal = years ? addYears(generatedAt, years) : null;

    let pageNo = 0;

    function addPortraitPage(title?: string): PDFPage {
      pageNo += 1;
      const page = pdf.addPage(A4_PORTRAIT);
      drawHeaderFooter(page, title || "RİSK DEĞERLENDİRMESİ", false, pageNo);
      return page;
    }

    function addLandscapePage(title?: string): PDFPage {
      pageNo += 1;
      const page = pdf.addPage(A4_LANDSCAPE);
      drawHeaderFooter(page, title || "RİSK DEĞERLENDİRME TABLOSU", true, pageNo);
      return page;
    }

    function drawHeaderFooter(
      page: PDFPage,
      title: string,
      landscape: boolean,
      number: number
    ) {
      const width = landscape ? A4_LANDSCAPE[0] : A4_PORTRAIT[0];
      const height = landscape ? A4_LANDSCAPE[1] : A4_PORTRAIT[1];

      page.drawText(text(firm.firm_name) || "DORA Firma", {
        x: 34,
        y: height - 28,
        size: 9,
        font: bold,
        color: rgb(0.35, 0.09, 0.14),
      });

      const titleWidth = bold.widthOfTextAtSize(title, 8);
      page.drawText(title, {
        x: Math.max(160, (width - titleWidth) / 2),
        y: height - 28,
        size: 8,
        font: bold,
        color: rgb(0.24, 0.26, 0.3),
      });

      page.drawLine({
        start: { x: 34, y: height - 38 },
        end: { x: width - 34, y: height - 38 },
        thickness: 1,
        color: rgb(0.48, 0.15, 0.2),
      });

      page.drawLine({
        start: { x: 34, y: 27 },
        end: { x: width - 34, y: 27 },
        thickness: 0.5,
        color: rgb(0.83, 0.84, 0.86),
      });

      page.drawText("Paraf: __________________", {
        x: 34,
        y: 13,
        size: 6.5,
        font: regular,
        color: rgb(0.42, 0.44, 0.48),
      });

      page.drawText(`Sayfa ${number}`, {
        x: width - 72,
        y: 13,
        size: 6.5,
        font: regular,
        color: rgb(0.42, 0.44, 0.48),
      });
    }

    /* =====================================================
       1. KAPAK
    ===================================================== */

    let page = addPortraitPage("DORA • KURUMSAL RİSK DEĞERLENDİRMESİ");

    page.drawText("İŞ SAĞLIĞI VE GÜVENLİĞİ", {
      x: 70,
      y: 690,
      size: 14,
      font: bold,
      color: rgb(0.48, 0.15, 0.2),
    });

    page.drawText("RİSK DEĞERLENDİRMESİ", {
      x: 70,
      y: 650,
      size: 26,
      font: bold,
      color: rgb(0.1, 0.13, 0.2),
    });

    page.drawText("Fine Kinney Metodu", {
      x: 70,
      y: 620,
      size: 13,
      font: regular,
      color: rgb(0.36, 0.39, 0.45),
    });

    page.drawRectangle({
      x: 70,
      y: 390,
      width: 455,
      height: 170,
      borderWidth: 1,
      borderColor: rgb(0.82, 0.83, 0.85),
      color: rgb(0.99, 0.99, 0.995),
    });

    const coverRows = [
      ["İşyeri Ünvanı", text(firm.firm_name) || "-"],
      ["Adres", text(firm.address) || "-"],
      ["NACE", text(firm.nace_code) || "-"],
      ["Sektör", text(firm.sector) || "-"],
      ["Tehlike Sınıfı", dangerLabel(firm.danger_class)],
      ["Çalışan Sayısı", String(firm.employee_count ?? 0)],
    ];

    let coverY = 535;
    for (const [label, value] of coverRows) {
      page.drawText(label, {
        x: 86,
        y: coverY,
        size: 8.5,
        font: bold,
        color: rgb(0.34, 0.36, 0.4),
      });
      drawWrapped(page, value, 205, coverY, 305, regular, 8.5, 11);
      coverY -= 24;
    }

    page.drawText(`Değerlendirme / Rapor Tarihi: ${generatedAt.toLocaleDateString("tr-TR")}`, {
      x: 70,
      y: 340,
      size: 9,
      font: bold,
      color: rgb(0.24, 0.26, 0.3),
    });

    page.drawText(
      periodicRenewal
        ? `Periyodik azami yenileme tarihi: ${periodicRenewal.toLocaleDateString("tr-TR")}`
        : "Periyodik yenileme tarihi: Tehlike sınıfı bilgisine göre belirlenmelidir.",
      {
        x: 70,
        y: 320,
        size: 8.5,
        font: regular,
        color: rgb(0.34, 0.36, 0.4),
      }
    );

    drawWrapped(
      page,
      "Not: İş kazası, meslek hastalığı, ramak kala, teknoloji/ekipman/üretim yöntemi değişikliği, mevzuat veya çalışma ortamı şartlarındaki değişiklikler gibi Yönetmelikte sayılan hallerde periyodik süre beklenmeden risk değerlendirmesinin tamamen veya kısmen yenilenmesi gerekir.",
      70,
      285,
      455,
      regular,
      8,
      11,
      rgb(0.44, 0.34, 0.18)
    );

    page.drawText("DORA Bağımsız Risk Merkezi", {
      x: 70,
      y: 120,
      size: 10,
      font: bold,
      color: rgb(0.48, 0.15, 0.2),
    });

    drawWrapped(
      page,
      "Bu çıktı yalnızca DORA çalışma alanındaki firma ve Fine Kinney risk kayıtlarından oluşturulmuştur; diğer D-SEC modüllerine veri aktarımı yapmaz.",
      70,
      98,
      455,
      regular,
      8,
      11
    );

    /* =====================================================
       2. AMAÇ, KAPSAM, MEVZUAT, YÖNTEM
    ===================================================== */

    page = addPortraitPage("RİSK DEĞERLENDİRMESİ • YÖNTEM VE DAYANAK");
    let y = 770;

    y = drawSectionTitle(page, "1. AMAÇ VE KAPSAM", y, bold);
    y = drawWrapped(
      page,
      "Bu çalışma; işyerinde mevcut veya dışarıdan gelebilecek tehlikelerin belirlenmesi, bu tehlikelerden kaynaklanan risklerin analiz edilip önceliklendirilmesi, uygun kontrol tedbirlerinin planlanması ve tedbirlerden sonra kalan risk seviyesinin değerlendirilmesi amacıyla hazırlanmıştır.",
      50,
      y,
      495,
      regular,
      8.5,
      12
    ) - 14;

    y = drawSectionTitle(page, "2. MEVZUAT DAYANAĞI", y, bold);
    y = drawWrapped(
      page,
      "6331 sayılı İş Sağlığı ve Güvenliği Kanunu m.10 ve 29.12.2012 tarihli, 28512 sayılı Resmî Gazete'de yayımlanan İş Sağlığı ve Güvenliği Risk Değerlendirmesi Yönetmeliği esas alınmıştır. Dokümantasyon yapısı Yönetmeliğin 11 inci maddesindeki asgari unsurlar dikkate alınarak düzenlenmiştir.",
      50,
      y,
      495,
      regular,
      8.5,
      12
    ) - 14;

    y = drawSectionTitle(page, "3. KULLANILAN YÖNTEM: FINE KINNEY", y, bold);
    y = drawWrapped(
      page,
      "Fine Kinney yönteminde risk skoru Olasılık (O) × Frekans (F) × Şiddet (Ş) çarpımıyla hesaplanır. DORA kayıtlarında ilk risk ve kontrol tedbirlerinden sonraki kalan risk ayrı ayrı değerlendirilir.",
      50,
      y,
      495,
      regular,
      8.5,
      12
    ) - 10;

    const methodRows = [
      ["Olasılık", "0,1 • 0,2 • 0,5 • 1 • 3 • 6 • 10"],
      ["Frekans", "0,5 • 1 • 2 • 3 • 6 • 10"],
      ["Şiddet", "1 • 3 • 7 • 15 • 40 • 100"],
      ["< 20", "Kabul Edilebilir"],
      ["20 – 69", "Kesin Risk"],
      ["70 – 199", "Önemli Risk"],
      ["200 – 399", "Yüksek Risk"],
      ["≥ 400", "Çok Yüksek Risk"],
    ];

    for (const [left, right] of methodRows) {
      page.drawRectangle({
        x: 50,
        y: y - 3,
        width: 495,
        height: 20,
        borderWidth: 0.5,
        borderColor: rgb(0.88, 0.89, 0.91),
      });
      page.drawText(left, {
        x: 58,
        y: y + 3,
        size: 8,
        font: bold,
      });
      page.drawText(right, {
        x: 160,
        y: y + 3,
        size: 8,
        font: regular,
      });
      y -= 20;
    }

    y -= 18;
    y = drawSectionTitle(page, "4. RİSK KONTROL PRENSİBİ", y, bold);
    drawWrapped(
      page,
      "Kontrol tedbirlerinde tehlikenin ortadan kaldırılması, riskle kaynağında mücadele edilmesi ve toplu korunma önlemlerine kişisel korunmaya göre öncelik verilmesi esastır. Kontrol tedbirleri uygulandıktan sonra risk seviyesi yeniden belirlenir; kabul edilebilir seviyenin üzerinde kalan riskler için süreç tekrarlanır.",
      50,
      y,
      495,
      regular,
      8.5,
      12
    );

    /* =====================================================
       3. RİSK DEĞERLENDİRME EKİBİ
    ===================================================== */

    page = addPortraitPage("RİSK DEĞERLENDİRMESİ • EKİP VE ONAY");
    y = 770;
    y = drawSectionTitle(page, "5. RİSK DEĞERLENDİRME EKİBİ", y, bold);

    drawWrapped(
      page,
      "Yönetmelik uyarınca risk değerlendirmesi ekip tarafından gerçekleştirilir. Aşağıdaki alanlar nihai doküman kullanılmadan önce gerçek isim, unvan ve gerekli belge bilgileriyle tamamlanmalıdır.",
      50,
      y,
      495,
      regular,
      8.5,
      12
    );
    y -= 52;

    const team = [
      ["İşveren / İşveren Vekili", text(firm.authorized_person) || "................................................"],
      ["İş Güvenliği Uzmanı", "................................................  Belge No: ........................"],
      ["İşyeri Hekimi", "................................................  Belge No: ........................"],
      ["Çalışan Temsilcisi", "................................................"],
      ["Destek Elemanı", "................................................"],
      ["Birimleri Temsil Eden Çalışan", "................................................"],
    ];

    for (const [role, member] of team) {
      page.drawRectangle({
        x: 50,
        y: y - 8,
        width: 495,
        height: 44,
        borderWidth: 0.6,
        borderColor: rgb(0.83, 0.84, 0.86),
      });
      page.drawText(role, {
        x: 58,
        y: y + 18,
        size: 8,
        font: bold,
      });
      page.drawText(member, {
        x: 190,
        y: y + 18,
        size: 7.5,
        font: regular,
      });
      page.drawText("İmza / Paraf: ____________________", {
        x: 190,
        y: y + 3,
        size: 7,
        font: regular,
        color: rgb(0.42, 0.44, 0.48),
      });
      y -= 44;
    }

    y -= 15;
    y = drawSectionTitle(page, "6. İŞYERİ VE DEĞERLENDİRME BİLGİLERİ", y, bold);
    const info = [
      `İşyeri: ${text(firm.firm_name) || "-"}`,
      `Adres: ${text(firm.address) || "-"}`,
      `Tehlike Sınıfı: ${dangerLabel(firm.danger_class)}`,
      `Değerlendirme Tarihi: ${generatedAt.toLocaleDateString("tr-TR")}`,
      periodicRenewal
        ? `Periyodik azami yenileme tarihi: ${periodicRenewal.toLocaleDateString("tr-TR")}`
        : "Periyodik yenileme tarihi: Tehlike sınıfı bilgisi tamamlanmalıdır.",
      `Değerlendirilen risk kaydı sayısı: ${allRisks.length}`,
    ];

    for (const item of info) {
      y = drawWrapped(page, item, 50, y, 495, regular, 8, 11) - 3;
    }

    /* =====================================================
       4. RİSK TABLOSU
    ===================================================== */

    const columns = [
      { key: "no", label: "No", width: 24 },
      { key: "dept", label: "Bölüm / Faaliyet", width: 76 },
      { key: "hazard", label: "Tehlike / Risk", width: 125 },
      { key: "existing", label: "Mevcut Önlemler", width: 105 },
      { key: "initial", label: "İlk Risk\nO/F/Ş - Skor", width: 72 },
      { key: "action", label: "Alınacak Tedbir", width: 120 },
      { key: "owner", label: "Sorumlu / Termin", width: 83 },
      { key: "residual", label: "Kalan Risk", width: 76 },
      { key: "basis", label: "Mevzuat", width: 80 },
    ];

    const tableX = 23;
    const tableTop = 535;
    const tableBottom = 42;
    const headerHeight = 34;

    function drawTableHeader(target: PDFPage, yTop: number) {
      let x = tableX;
      for (const column of columns) {
        target.drawRectangle({
          x,
          y: yTop - headerHeight,
          width: column.width,
          height: headerHeight,
          borderWidth: 0.6,
          borderColor: rgb(0.76, 0.77, 0.8),
          color: rgb(0.94, 0.91, 0.92),
        });

        const headerLines = column.label.split("\n");
        let headerY = yTop - 14;
        for (const line of headerLines) {
          target.drawText(line, {
            x: x + 3,
            y: headerY,
            size: 6.3,
            font: bold,
            color: rgb(0.28, 0.09, 0.13),
          });
          headerY -= 8;
        }
        x += column.width;
      }
    }

    function cellLines(value: string, width: number, font = regular, size = 6.2) {
      return wrapText(value || "-", width - 6, font, size);
    }

    page = addLandscapePage("KURUMSAL FINE KINNEY RİSK DEĞERLENDİRME TABLOSU");
    drawTableHeader(page, tableTop);
    let tableY = tableTop - headerHeight;

    if (allRisks.length === 0) {
      page.drawText("Kayıtlı risk bulunmamaktadır.", {
        x: tableX,
        y: tableY - 24,
        size: 9,
        font: regular,
      });
    }

    for (let index = 0; index < allRisks.length; index += 1) {
      const risk = allRisks[index];

      const values = {
        no: String(index + 1),
        dept: [risk.department, risk.activity, risk.location].filter(Boolean).join(" / ") || "-",
        hazard: [risk.hazard, risk.risk_description, risk.consequence].filter(Boolean).join(" — ") || "-",
        existing: text(risk.existing_controls) || "-",
        initial: `${risk.fk_probability}/${risk.fk_frequency}/${risk.fk_severity} - ${risk.fk_score}\n${levelLabel(risk.fk_level)}`,
        action: text(risk.corrective_action) || "-",
        owner: `${text(risk.responsible_person) || "-"}\n${formatDate(risk.due_date_millis)}`,
        residual:
          risk.residual_score != null
            ? `${risk.residual_probability ?? "-"}/${risk.residual_frequency ?? "-"}/${risk.residual_severity ?? "-"} - ${risk.residual_score}\n${levelLabel(risk.residual_level)}`
            : "Henüz değerlendirilmedi",
        basis: text(risk.legal_basis) || "-",
      };

      const prepared = columns.map((column) => {
        const value = values[column.key as keyof typeof values];
        return cellLines(value, column.width);
      });

      const maxLines = Math.max(...prepared.map((lines) => lines.length));
      const rowHeight = Math.max(28, maxLines * 8 + 8);

      if (tableY - rowHeight < tableBottom) {
        page = addLandscapePage("KURUMSAL FINE KINNEY RİSK DEĞERLENDİRME TABLOSU");
        drawTableHeader(page, tableTop);
        tableY = tableTop - headerHeight;
      }

      let x = tableX;
      columns.forEach((column, columnIndex) => {
        page.drawRectangle({
          x,
          y: tableY - rowHeight,
          width: column.width,
          height: rowHeight,
          borderWidth: 0.5,
          borderColor: rgb(0.83, 0.84, 0.86),
          color: index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.985, 0.987, 0.99),
        });

        let lineY = tableY - 10;
        for (const line of prepared[columnIndex]) {
          page.drawText(line || " ", {
            x: x + 3,
            y: lineY,
            size: 6.2,
            font: regular,
            color: rgb(0.18, 0.2, 0.24),
          });
          lineY -= 8;
        }

        x += column.width;
      });

      tableY -= rowHeight;
    }

    /* =====================================================
       5. SONUÇ / İMZA
    ===================================================== */

    page = addPortraitPage("RİSK DEĞERLENDİRMESİ • SONUÇ VE İMZA");
    y = 770;

    y = drawSectionTitle(page, "7. GENEL SONUÇ VE İZLEME", y, bold);

    const counts = {
      acceptable: allRisks.filter((r) => r.fk_level === "KABUL_EDILEBILIR").length,
      definite: allRisks.filter((r) => r.fk_level === "KESIN_RISK").length,
      important: allRisks.filter((r) => r.fk_level === "ONEMLI_RISK").length,
      high: allRisks.filter((r) => r.fk_level === "YUKSEK_RISK").length,
      veryHigh: allRisks.filter((r) => r.fk_level === "COK_YUKSEK_RISK").length,
    };

    y = drawWrapped(
      page,
      `Toplam ${allRisks.length} risk kaydı değerlendirilmiştir. Dağılım: Kabul Edilebilir ${counts.acceptable}, Kesin Risk ${counts.definite}, Önemli Risk ${counts.important}, Yüksek Risk ${counts.high}, Çok Yüksek Risk ${counts.veryHigh}. Kontrol tedbirlerinin uygulanması, terminlerin izlenmesi ve kontrol sonrasında kalan riskin yeniden değerlendirilmesi gereklidir.`,
      50,
      y,
      495,
      regular,
      8.5,
      12
    ) - 16;

    y = drawSectionTitle(page, "8. DOKÜMANTASYON VE SAKLAMA", y, bold);
    y = drawWrapped(
      page,
      "Risk değerlendirmesi dokümanı elektronik ortamda hazırlanıp arşivlenebilir. Nihai kullanımda dokümanın sayfaları numaralandırılmalı, değerlendirmeyi gerçekleştiren kişilerce her sayfa paraflanmalı ve son sayfa imzalanmalıdır. Ekip isim/unvan ve uzman/hekim belge bilgilerinin eksiksiz olması gerekir.",
      50,
      y,
      495,
      regular,
      8.5,
      12
    ) - 20;

    y = drawSectionTitle(page, "9. SON SAYFA İMZALARI", y, bold);

    const signRows = [
      ["İşveren / İşveren Vekili", text(firm.authorized_person) || "................................"],
      ["İş Güvenliği Uzmanı", "................................"],
      ["İşyeri Hekimi", "................................"],
      ["Çalışan Temsilcisi", "................................"],
      ["Destek Elemanı / Diğer Ekip Üyesi", "................................"],
    ];

    for (const [role, name] of signRows) {
      page.drawRectangle({
        x: 50,
        y: y - 5,
        width: 495,
        height: 48,
        borderWidth: 0.6,
        borderColor: rgb(0.83, 0.84, 0.86),
      });
      page.drawText(role, {
        x: 58,
        y: y + 22,
        size: 8,
        font: bold,
      });
      page.drawText(name, {
        x: 205,
        y: y + 22,
        size: 8,
        font: regular,
      });
      page.drawText("İmza: __________________________", {
        x: 340,
        y: y + 22,
        size: 7.5,
        font: regular,
      });
      y -= 48;
    }

    const bytes = await pdf.save();
    const fileName = safeFileName(text(firm.firm_name) || "dora-firma");

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName || "dora"}-kurumsal-risk-degerlendirmesi.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("DORA ASSESSMENT REPORT ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Kurumsal DORA risk değerlendirme raporu oluşturulamadı.",
      },
      { status: 500 }
    );
  }
}