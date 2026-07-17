import type {
  ReportDocument,
} from "./types";

export function buildPdfDocument(
  document: ReportDocument
) {
  return {

    // --------------------------------------------------
    // Kapak
    // --------------------------------------------------

    cover: {

      title:
        document.reportTitle,

      company:
        document.companyName,

      generatedAt:
        document.generatedAt,

      score:
        document.score,

    },

    // --------------------------------------------------
    // Yönetici Özeti
    // --------------------------------------------------

    executiveSummary:
      document.executiveSummary,

    // --------------------------------------------------
    // DORA Analizi
    // --------------------------------------------------

    doraSummary:
      document.doraSummary,

    // --------------------------------------------------
    // İçerik Bölümleri
    // --------------------------------------------------

    sections:
      document.sections,

    // --------------------------------------------------
    // Alt Bilgi
    // --------------------------------------------------

    footer:
      "D-SEC Dijital Sağlık • Emniyet • Çevre Yönetimi",

  };
}