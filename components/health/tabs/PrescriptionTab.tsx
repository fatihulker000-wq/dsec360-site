"use client";

import PrescriptionWorkspace from "../prescription/PrescriptionWorkspace";
import type { HealthEmployee } from "../types";

type Props = {
  employee: HealthEmployee;
};

export default function PrescriptionTab({ employee }: Props) {
  return <PrescriptionWorkspace employee={employee} />;
}