export type InspectionKpiTone =
  | "slate"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple";

export type InspectionKpiItem = {
  title: string;
  value: number | string;
  description: string;
  href: string;
  tone?: InspectionKpiTone;
  badge?: string;
};

export type InspectionFirmOption = {
  id: string;
  name: string;
};