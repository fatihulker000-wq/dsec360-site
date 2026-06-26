"use client";

import ExaminationWorkspace from "../examination/TempWorkspace";
import type { HealthEmployee } from "../types";

type Props = {
  employee: HealthEmployee;
};

export default function ExaminationTab({ employee }: Props) {
  return <ExaminationWorkspace employee={employee} />;
}