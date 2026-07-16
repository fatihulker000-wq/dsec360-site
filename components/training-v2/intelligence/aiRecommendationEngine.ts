import {
  TrainingAiScoreResult,
  TrainingIntelligenceMetrics,
} from "./aiScoreEngine";

export type RecommendationPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type RecommendationCategory =
  | "TRAINING"
  | "CERTIFICATE"
  | "EXAM"
  | "AUDIT"
  | "COMPLIANCE"
  | "CONTENT";

export interface TrainingRecommendation {
  id: string;

  priority: RecommendationPriority;

  category: RecommendationCategory;

  title: string;

  description: string;

  action: string;

  impact: string;
}

function createRecommendation(
  id: string,
  priority: RecommendationPriority,
  category: RecommendationCategory,
  title: string,
  description: string,
  action: string,
  impact: string
): TrainingRecommendation {
  return {
    id,
    priority,
    category,
    title,
    description,
    action,
    impact,
  };
}

export function generateTrainingRecommendations(
  metrics: TrainingIntelligenceMetrics,
  score: TrainingAiScoreResult
): TrainingRecommendation[] {

  const recommendations: TrainingRecommendation[] = [];

  /*
   Eğitim tamamlama
  */

  const completionRate =
    metrics.totalAssignments === 0
      ? 0
      : (metrics.completedAssignments /
          metrics.totalAssignments) *
        100;

  if (completionRate < 70) {

    recommendations.push(
      createRecommendation(

        "completion",

        "CRITICAL",

        "TRAINING",

        "Eğitim Tamamlama Oranı Düşük",

        `Tamamlama oranı %${completionRate.toFixed(
          0
        )}.`,

        "Eksik eğitimleri otomatik planlayın.",

        "Denetime hazırlık önemli ölçüde artacaktır."

      )
    );

  }

  /*
   Eğitime başlamayanlar
  */

  if (metrics.notStartedAssignments > 0) {

    recommendations.push(
      createRecommendation(

        "not-started",

        metrics.notStartedAssignments > 20
          ? "HIGH"
          : "MEDIUM",

        "TRAINING",

        "Başlamayan Eğitimler",

        `${metrics.notStartedAssignments} çalışan henüz eğitime başlamadı.`,

        "Hatırlatma bildirimi gönderin.",

        "Katılım oranı artacaktır."

      )
    );

  }

  /*
   Final sınavı
  */

  if (metrics.failedFinalExams > 0) {

    recommendations.push(
      createRecommendation(

        "failed-exams",

        "HIGH",

        "EXAM",

        "Başarısız Final Sınavları",

        `${metrics.failedFinalExams} çalışan final sınavını geçemedi.`,

        "Tekrar eğitim planlayın.",

        "Başarı oranı yükselecektir."

      )
    );

  }

  /*
   Sertifika
  */

  if (metrics.certificatesExpired > 0) {

    recommendations.push(
      createRecommendation(

        "expired-certificates",

        "CRITICAL",

        "CERTIFICATE",

        "Süresi Dolmuş Sertifikalar",

        `${metrics.certificatesExpired} sertifika süresini doldurmuş.`,

        "Yenileme eğitimlerini başlatın.",

        "Mevzuat uyumu korunacaktır."

      )
    );

  }

  if (metrics.certificatesRevoked > 0) {

    recommendations.push(
      createRecommendation(

        "revoked-certificates",

        "HIGH",

        "CERTIFICATE",

        "İptal Edilmiş Sertifikalar",

        `${metrics.certificatesRevoked} sertifika iptal edilmiş durumda.`,

        "İptal nedenlerini analiz edin.",

        "Risk seviyesi düşecektir."

      )
    );

  }

  /*
   Kanıt
  */

  if (metrics.averageEvidenceScore < 70) {

    recommendations.push(
      createRecommendation(

        "audit",

        "HIGH",

        "AUDIT",

        "Kanıt Kalitesi Düşük",

        `Ortalama kanıt skoru %${metrics.averageEvidenceScore.toFixed(
          0
        )}.`,

        "Fotoğraf ve video kanıtlarını artırın.",

        "Denetim güvenilirliği artacaktır."

      )
    );

  }

  /*
   İçerik
  */

  if (
    metrics.trainingsWithVideo <
    metrics.totalTrainings
  ) {

    recommendations.push(
      createRecommendation(

        "video",

        "LOW",

        "CONTENT",

        "Video İçeriği Eksik",

        "Bazı eğitimlerde video bulunmuyor.",

        "Video eğitimleri ekleyin.",

        "Katılım ve başarı artacaktır."

      )
    );

  }

  if (
    metrics.trainingsWithFinalExam <
    metrics.totalTrainings
  ) {

    recommendations.push(
      createRecommendation(

        "exam",

        "LOW",

        "CONTENT",

        "Final Sınavı Eksik",

        "Bazı eğitimlerde final sınavı tanımlı değil.",

        "Final sınavı oluşturun.",

        "Ölçülebilir eğitim kalitesi sağlanacaktır."

      )
    );

  }

  /*
   AI skoruna göre öneri
  */

  if (score.score < 60) {

    recommendations.push(
      createRecommendation(

        "ai-health",

        "CRITICAL",

        "COMPLIANCE",

        "Genel Eğitim Sağlığı Zayıf",

        `AI Eğitim Skoru ${score.score}/100.`,

        "Yönetim seviyesinde aksiyon planı oluşturun.",

        "Kurumsal uyum artacaktır."

      )
    );

  }
  else if (score.score < 80) {

    recommendations.push(
      createRecommendation(

        "ai-improve",

        "MEDIUM",

        "COMPLIANCE",

        "Performans İyileştirilebilir",

        `AI Eğitim Skoru ${score.score}/100.`,

        "Eksik eğitimleri tamamlayın.",

        "Denetime hazırlık artacaktır."

      )
    );

  }

  /*
   Hiç öneri oluşmazsa
  */

  if (recommendations.length === 0) {

    recommendations.push(
      createRecommendation(

        "perfect",

        "LOW",

        "COMPLIANCE",

        "Eğitim Sistemi Sağlıklı",

        "AI herhangi bir kritik risk tespit etmedi.",

        "Mevcut planı sürdürün.",

        "Kurumsal eğitim performansı korunacaktır."

      )
    );

  }

  /*
   Önceliğe göre sırala
  */

  const priorityOrder = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  recommendations.sort(
    (a, b) =>
      priorityOrder[b.priority] -
      priorityOrder[a.priority]
  );

  return recommendations;
}