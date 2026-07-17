import type {
  PdfProDocument,
} from "./types";

export function buildProfessionalPdf(
  document: PdfProDocument
) {
  return {

    // -------------------------------------------------
    // Kapak Bilgileri
    // -------------------------------------------------

    cover: document.cover,

    // -------------------------------------------------
    // İçindekiler
    // -------------------------------------------------

    tableOfContents: [

      "Yönetici Özeti",

      "DORA Analizi",

      "Öneriler",

      "Yasal Dayanaklar",

      "Ekler",

    ],

    // -------------------------------------------------
    // Yönetici Özeti
    // -------------------------------------------------

    executiveSummary:
      document.executiveSummary,

    // -------------------------------------------------
    // DORA Analizi
    // -------------------------------------------------

    doraSummary:
      document.doraSummary,

    // -------------------------------------------------
    // Öneriler
    // -------------------------------------------------

    recommendations:
      document.recommendations,

    // -------------------------------------------------
    // Yasal Dayanaklar
    // -------------------------------------------------

    legalReferences:
      document.legalReferences,

    // -------------------------------------------------
    // Ekler
    // -------------------------------------------------

    attachments:
      document.attachments,

    // -------------------------------------------------
    // QR Kod
    // -------------------------------------------------

    qr: {

      enabled:
        Boolean(document.qrValue),

      value:
        document.qrValue || "",

    },

    // -------------------------------------------------
    // Dijital İmza Bilgileri
    // -------------------------------------------------

    signature: {

      preparedBy:
        document.cover.preparedBy || "",

      approvedBy:
        document.cover.approvedBy || "",

    },

    // -------------------------------------------------
    // Filigran
    // -------------------------------------------------

    watermark:
      document.watermark || "D-SEC",

    // -------------------------------------------------
    // Alt Bilgi
    // -------------------------------------------------

    footer:
      "D-SEC Kurumsal Rapor",

  };
}