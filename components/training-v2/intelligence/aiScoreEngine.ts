export type TrainingHealthLevel =
  | "EXCELLENT"
  | "GOOD"
  | "DEVELOPING"
  | "RISKY"
  | "CRITICAL";

export type TrainingIntelligenceMetrics = {
  totalTrainings: number;
  totalAssignments: number;

  completedAssignments: number;
  inProgressAssignments: number;
  notStartedAssignments: number;

  successfulFinalExams: number;
  failedFinalExams: number;
  finalExamCount: number;
  averageFinalScore: number;

  certificatesIssued: number;
  certificatesRevoked: number;
  certificatesExpired: number;

  averageEvidenceScore: number;

  contentReadyTrainings: number;
  trainingsWithVideo: number;
  trainingsWithFinalExam: number;

  overdueAssignments?: number;
  expiringCertificates?: number;
  renewalRequiredCount?: number;
};

export type TrainingScoreBreakdown = {
  completionScore: number;
  participationScore: number;
  examScore: number;
  certificateScore: number;
  evidenceScore: number;
  contentReadinessScore: number;
  riskPenalty: number;
};

export type TrainingAiScoreResult = {
  score: number;
  level: TrainingHealthLevel;
  label: string;
  description: string;
  breakdown: TrainingScoreBreakdown;
};

function clamp(
  value: number,
  minimum = 0,
  maximum = 100
) {
  return Math.min(
    maximum,
    Math.max(minimum, Math.round(value))
  );
}

function percentage(
  part: number,
  total: number
) {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  if (!Number.isFinite(part) || part <= 0) {
    return 0;
  }

  return clamp((part / total) * 100);
}

function calculateCompletionScore(
  metrics: TrainingIntelligenceMetrics
) {
  return percentage(
    metrics.completedAssignments,
    metrics.totalAssignments
  );
}

function calculateParticipationScore(
  metrics: TrainingIntelligenceMetrics
) {
  const activeAssignments =
    metrics.completedAssignments +
    metrics.inProgressAssignments;

  return percentage(
    activeAssignments,
    metrics.totalAssignments
  );
}

function calculateExamScore(
  metrics: TrainingIntelligenceMetrics
) {
  if (metrics.finalExamCount <= 0) {
    return 0;
  }

  const successRate = percentage(
    metrics.successfulFinalExams,
    metrics.finalExamCount
  );

  const averageScore = clamp(
    metrics.averageFinalScore
  );

  return clamp(
    successRate * 0.6 +
      averageScore * 0.4
  );
}

function calculateCertificateScore(
  metrics: TrainingIntelligenceMetrics
) {
  if (metrics.completedAssignments <= 0) {
    return 0;
  }

  const activeCertificates = Math.max(
    0,
    metrics.certificatesIssued -
      metrics.certificatesRevoked -
      metrics.certificatesExpired
  );

  return percentage(
    activeCertificates,
    metrics.completedAssignments
  );
}

function calculateEvidenceScore(
  metrics: TrainingIntelligenceMetrics
) {
  return clamp(
    metrics.averageEvidenceScore
  );
}

function calculateContentReadinessScore(
  metrics: TrainingIntelligenceMetrics
) {
  if (metrics.totalTrainings <= 0) {
    return 0;
  }

  const readyByDefinition = percentage(
    metrics.contentReadyTrainings,
    metrics.totalTrainings
  );

  const videoCoverage = percentage(
    metrics.trainingsWithVideo,
    metrics.totalTrainings
  );

  const finalExamCoverage = percentage(
    metrics.trainingsWithFinalExam,
    metrics.totalTrainings
  );

  return clamp(
    readyByDefinition * 0.5 +
      videoCoverage * 0.25 +
      finalExamCoverage * 0.25
  );
}

function calculateRiskPenalty(
  metrics: TrainingIntelligenceMetrics
) {
  let penalty = 0;

  const overdueAssignments =
    metrics.overdueAssignments || 0;

  const expiringCertificates =
    metrics.expiringCertificates || 0;

  const renewalRequiredCount =
    metrics.renewalRequiredCount || 0;

  if (metrics.totalAssignments > 0) {
    penalty +=
      percentage(
        overdueAssignments,
        metrics.totalAssignments
      ) * 0.12;

    penalty +=
      percentage(
        metrics.notStartedAssignments,
        metrics.totalAssignments
      ) * 0.08;
  }

  if (metrics.certificatesIssued > 0) {
    penalty +=
      percentage(
        expiringCertificates,
        metrics.certificatesIssued
      ) * 0.05;
  }

  if (metrics.totalTrainings > 0) {
    penalty +=
      percentage(
        renewalRequiredCount,
        metrics.totalTrainings
      ) * 0.05;
  }

  if (metrics.finalExamCount > 0) {
    penalty +=
      percentage(
        metrics.failedFinalExams,
        metrics.finalExamCount
      ) * 0.1;
  }

  return clamp(penalty, 0, 30);
}

export function getTrainingHealthLevel(
  score: number
): TrainingHealthLevel {
  const safeScore = clamp(score);

  if (safeScore >= 90) {
    return "EXCELLENT";
  }

  if (safeScore >= 75) {
    return "GOOD";
  }

  if (safeScore >= 60) {
    return "DEVELOPING";
  }

  if (safeScore >= 40) {
    return "RISKY";
  }

  return "CRITICAL";
}

export function getTrainingHealthLabel(
  level: TrainingHealthLevel
) {
  switch (level) {
    case "EXCELLENT":
      return "Mükemmel";

    case "GOOD":
      return "İyi";

    case "DEVELOPING":
      return "Geliştirilmeli";

    case "RISKY":
      return "Riskli";

    case "CRITICAL":
      return "Kritik";

    default:
      return "Bilinmiyor";
  }
}

export function getTrainingHealthDescription(
  level: TrainingHealthLevel
) {
  switch (level) {
    case "EXCELLENT":
      return (
        "Eğitim, sınav, sertifika ve kanıt kayıtları " +
        "kurumsal açıdan güçlü görünmektedir."
      );

    case "GOOD":
      return (
        "Genel performans iyi seviyededir. " +
        "Bazı eğitim ve sertifika kayıtları iyileştirilebilir."
      );

    case "DEVELOPING":
      return (
        "Eğitim sistemi çalışmaktadır ancak tamamlama, " +
        "başarı veya kanıt süreçlerinde geliştirme ihtiyacı vardır."
      );

    case "RISKY":
      return (
        "Eğitim performansında önemli eksiklikler bulunmaktadır. " +
        "Yönetici aksiyonu gereklidir."
      );

    case "CRITICAL":
      return (
        "Tamamlama, sınav, sertifika veya kanıt süreçlerinde " +
        "kritik uyumsuzluk riski bulunmaktadır."
      );

    default:
      return "Eğitim sağlık durumu hesaplanamadı.";
  }
}

export function calculateTrainingAiScore(
  metrics: TrainingIntelligenceMetrics
): TrainingAiScoreResult {
  const completionScore =
    calculateCompletionScore(metrics);

  const participationScore =
    calculateParticipationScore(metrics);

  const examScore =
    calculateExamScore(metrics);

  const certificateScore =
    calculateCertificateScore(metrics);

  const evidenceScore =
    calculateEvidenceScore(metrics);

  const contentReadinessScore =
    calculateContentReadinessScore(metrics);

  const riskPenalty =
    calculateRiskPenalty(metrics);

  const weightedScore =
    completionScore * 0.25 +
    participationScore * 0.1 +
    examScore * 0.2 +
    certificateScore * 0.15 +
    evidenceScore * 0.2 +
    contentReadinessScore * 0.1;

  const score = clamp(
    weightedScore - riskPenalty
  );

  const level =
    getTrainingHealthLevel(score);

  return {
    score,
    level,
    label: getTrainingHealthLabel(level),
    description:
      getTrainingHealthDescription(level),

    breakdown: {
      completionScore,
      participationScore,
      examScore,
      certificateScore,
      evidenceScore,
      contentReadinessScore,
      riskPenalty,
    },
  };
}