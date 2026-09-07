import type { HsePerformanceResult, ScoreComponent, ScoreInput } from "./executive-dashboard-types";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function ratio(part: number, total: number): number | null {
  if (!Number.isFinite(total) || total <= 0) return null;
  return clamp((Math.max(0, part) / total) * 100);
}

function riskScore(x: ScoreInput["risk"]): number | null {
  if (!x || x.total <= 0) return null;
  const penalty = ((x.critical * 1) + (x.high * 0.55)) / x.total;
  return clamp((1 - Math.min(1, penalty)) * 100);
}

function inspectionScore(x: ScoreInput["inspection"]): number | null {
  if (!x || x.total <= 0) return null;
  return ratio(x.compliant + x.partial * 0.5, x.total);
}

function trainingScore(x: ScoreInput["training"]): number | null {
  if (!x || x.totalEmployees <= 0) return null;
  return ratio(x.compliantEmployees, x.totalEmployees);
}

function dofScore(x: ScoreInput["dof"]): number | null {
  if (!x || x.total <= 0) return null;
  const closure = ratio(x.closed, x.total) ?? 0;
  const overduePenalty = Math.min(35, (x.overdue / x.total) * 100);
  return clamp(closure - overduePenalty);
}

function incidentScore(x: ScoreInput["incident"]): number | null {
  if (!x || x.total <= 0) return null;
  const penalty = Math.min(100, x.lostTime * 20 + x.openInvestigations * 8);
  return clamp(100 - penalty);
}

function healthScore(x: ScoreInput["health"]): number | null {
  if (!x || x.totalEmployees <= 0) return null;
  // Geçerli sağlık gözetimi oranı. Geciken ve tarih/veri eksiği zaten paydada kaldığı
  // için ayrıca ikinci kez ceza uygulanmaz.
  return ratio(x.valid, x.totalEmployees);
}

function complianceScore(x?: { total: number; valid: number; overdue: number }): number | null {
  if (!x || x.total <= 0) return null;
  const base = ratio(x.valid, x.total) ?? 0;
  const overduePenalty = Math.min(30, (x.overdue / x.total) * 100);
  return clamp(base - overduePenalty);
}

export function calculateHsePerformance(input: ScoreInput): HsePerformanceResult {
  const definitions = [
    ["risk", "Risk Yönetimi", 22, riskScore(input.risk)],
    ["inspection", "Denetim", 16, inspectionScore(input.inspection)],
    ["training", "Yasal Eğitim", 14, trainingScore(input.training)],
    ["dof", "DÖF", 12, dofScore(input.dof)],
    ["incident", "Kaza / Olay", 12, incidentScore(input.incident)],
    ["health", "Sağlık Gözetimi", 10, healthScore(input.health)],
    ["periodic", "Periyodik Kontrol", 8, complianceScore(input.periodic)],
    ["environment", "Ortam Ölçümleri", 6, complianceScore(input.environment)],
  ] as const;

  const baseComponents = definitions.map(([key, label, weight, score]) => ({
    key,
    label,
    weight,
    score,
    weightedScore: score == null ? null : (score * weight) / 100,
    available: score != null,
  }));

  const availableWeight = baseComponents
    .filter((x) => x.available)
    .reduce((sum, x) => sum + x.weight, 0);

  const components: ScoreComponent[] = baseComponents.map((component) => ({
    ...component,
    normalizedContribution:
      component.available && availableWeight > 0
        ? Math.round((((component.score ?? 0) * component.weight) / availableWeight) * 10) / 10
        : null,
  }));

  const available = components.filter((x) => x.available);
  const coverage = Math.round(availableWeight);
  const score = availableWeight === 0
    ? null
    : clamp(available.reduce((sum, x) => sum + ((x.score ?? 0) * x.weight), 0) / availableWeight);

  const grade: HsePerformanceResult["grade"] =
    score == null ? "NO_DATA" :
    score >= 90 ? "A" :
    score >= 80 ? "B" :
    score >= 70 ? "C" :
    score >= 60 ? "D" : "E";

  return {
    score,
    coverage,
    grade,
    components,
    availableWeight,
    availableComponents: available.length,
    totalComponents: components.length,
    formula: "AVAILABLE_WEIGHT_NORMALIZED",
  };
}
