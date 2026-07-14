export function modeLabel(mode?: string | null) {
  const m = String(mode || "").toUpperCase();

  if (m.includes("FOTO") || m.includes("PHOTO"))
    return "Fotoğraflı";

  if (
    m.includes("PUAN") ||
    m.includes("SKOR") ||
    m.includes("SCORE")
  )
    return "Puanlamalı";

  if (m.includes("ELMERI"))
    return "ELMERI";

  return "Klasik";
}

export function modeColor(mode?: string | null) {
  switch (modeLabel(mode)) {
    case "Fotoğraflı":
      return {
        bg: "#DBEAFE",
        color: "#2563EB",
      };

    case "Puanlamalı":
      return {
        bg: "#FFEDD5",
        color: "#EA580C",
      };

    case "ELMERI":
      return {
        bg: "#DCFCE7",
        color: "#16A34A",
      };

    default:
      return {
        bg: "#F1F5F9",
        color: "#475569",
      };
  }
}

export function formatDate(value?: string | number | null) {
  if (!value) return "-";

  const date =
    typeof value === "number"
      ? new Date(value)
      : new Date(value);

  if (Number.isNaN(date.getTime()))
    return "-";

  return date.toLocaleDateString("tr-TR");
}

export function cleanFirmName(name?: string | null) {
  const value = String(name ?? "").trim();

  if (!value)
    return "Firma Yok";

  return value;
}

export function normalizeFirmKey(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

export function normalizeText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

export function calculateInspectionScore(
  suitable: number,
  partial: number,
  unsuitable: number
) {
  const total =
    suitable + partial + unsuitable;

  if (!total)
    return 100;

  return Math.round(
    ((suitable + partial * 0.5) /
      total) *
      100
  );
}

export function calculateDofRate(
  open: number,
  closed: number
) {
  const total = open + closed;

  if (!total)
    return 100;

  return Math.round(
    (closed / total) * 100
  );
}

export function makeQuery(
  type: string,
  firm: string
) {
  const params = new URLSearchParams();

  if (type !== "ALL")
    params.set("type", type);

  if (firm !== "ALL")
    params.set("firm", firm);

  const query = params.toString();

  return query
    ? `/admin/denetimler?${query}`
    : "/admin/denetimler";
}

export function makePagedQuery(
  type: string,
  firm: string,
  dofPage: number,
  runPage: number,
  tab = "",
  status = "",
  priority = ""
) {
  const params = new URLSearchParams();

  if (type !== "ALL")
    params.set("type", type);

  if (firm !== "ALL")
    params.set("firm", firm);

  if (dofPage > 1)
    params.set(
      "dofPage",
      String(dofPage)
    );

  if (runPage > 1)
    params.set(
      "runPage",
      String(runPage)
    );

  if (tab)
    params.set("tab", tab);

  if (status)
    params.set("status", status);

  if (priority)
    params.set("priority", priority);

  return `/admin/denetimler?${params.toString()}`;
}

export function makeDofQuery(
  type: string,
  firm: string,
  status = "",
  priority = ""
) {
  const params = new URLSearchParams();

  if (type !== "ALL")
    params.set("type", type);

  if (firm !== "ALL")
    params.set("firm", firm);

  params.set("tab", "dof");

  if (status)
    params.set("status", status);

  if (priority)
    params.set("priority", priority);

  return `/admin/denetimler?${params.toString()}#dof`;
}