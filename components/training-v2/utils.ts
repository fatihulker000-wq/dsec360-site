export function calculateComplianceScore(
  completed: number,
  total: number
) {
  if (total <= 0) return 100;

  return Math.round(
    (completed / total) * 100
  );
}

export function calculateCompletionRate(
  completed: number,
  active: number
) {
  const total = completed + active;

  if (!total) return 0;

  return Math.round(
    (completed / total) * 100
  );
}

export function formatPercent(value: number) {
  return `${value}%`;
}

export function trainingStatusColor(score: number) {

  if (score >= 90)
    return "#16A34A";

  if (score >= 75)
    return "#F59E0B";

  return "#DC2626";

}

export function trainingStatusLabel(score: number) {

  if (score >= 90)
    return "Mükemmel";

  if (score >= 75)
    return "İyi";

  return "Geliştirilmeli";

}