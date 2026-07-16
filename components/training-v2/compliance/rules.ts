"use client";

export type DangerClass =
  | "LOW"
  | "DANGEROUS"
  | "VERY_DANGEROUS";

export type ComplianceRule = {
  dangerClass: DangerClass;
  label: string;

  // İlk temel eğitim süresi (dakika)
  initialMinimumMinutes: number;

  // Tekrar eğitiminde asgari süre (dakika)
  repeatMinimumMinutes: number;

  // Tekrar periyodu (ay)
  repeatIntervalMonths: number;

  // İşe / işyerine özgü eğitim süresi (dakika)
  workplaceSpecificMinimumMinutes: number;
};

export const COMPLIANCE_RULES: Record<
  DangerClass,
  ComplianceRule
> = {
  LOW: {
    dangerClass: "LOW",
    label: "Az Tehlikeli",

    initialMinimumMinutes: 8 * 60,
    repeatMinimumMinutes: 8 * 60,

    repeatIntervalMonths: 36,

    workplaceSpecificMinimumMinutes: 2 * 60,
  },

  DANGEROUS: {
    dangerClass: "DANGEROUS",
    label: "Tehlikeli",

    initialMinimumMinutes: 12 * 60,
    repeatMinimumMinutes: 8 * 60,

    repeatIntervalMonths: 24,

    workplaceSpecificMinimumMinutes: 3 * 60,
  },

  VERY_DANGEROUS: {
    dangerClass: "VERY_DANGEROUS",
    label: "Çok Tehlikeli",

    initialMinimumMinutes: 16 * 60,
    repeatMinimumMinutes: 8 * 60,

    repeatIntervalMonths: 12,

    workplaceSpecificMinimumMinutes: 4 * 60,
  },
};

export function getComplianceRule(
  dangerClass: DangerClass
) {
  return COMPLIANCE_RULES[dangerClass];
}

export function percentage(
  part: number,
  total: number
) {
  if (total <= 0) return 0;

  return Math.min(
    100,
    Math.max(
      0,
      Math.round((part / total) * 100)
    )
  );
}

export function formatMinutes(
  totalMinutes: number
) {
  const minutes = Math.max(
    0,
    Math.round(totalMinutes)
  );

  const hours = Math.floor(minutes / 60);

  const remain = minutes % 60;

  if (hours <= 0) {
    return `${remain} dk`;
  }

  if (remain === 0) {
    return `${hours} saat`;
  }

  return `${hours} saat ${remain} dk`;
}