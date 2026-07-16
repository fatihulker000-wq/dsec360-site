"use client";

import DoraEmployeeAnalysisPanel from "./DoraEmployeeAnalysisPanel";

import type {
  EmployeeIntegrationData,
} from "../integration";

import type {
  EmployeeProfileEmployee,
} from "../profile";

export default function DoraEmployeeProfileBridge({
  employee,
  integration,
}: {
  employee: EmployeeProfileEmployee;
  integration?: EmployeeIntegrationData | null;
}) {
  const missingFields =
    getMissingProfileFields(employee);

  return (
    <DoraEmployeeAnalysisPanel
      input={{
        employeeId: employee.id,
        employeeName:
          employee.full_name,
        jobTitle:
          employee.job_title,
        department:
          employee.department,
        active:
          employee.active,
        integration,
        missingProfileFields:
          missingFields,
      }}
    />
  );
}

function getMissingProfileFields(
  employee: EmployeeProfileEmployee
) {
  const missing: string[] = [];

  if (!employee.full_name?.trim()) {
    missing.push("Ad Soyad");
  }

  if (!employee.job_title?.trim()) {
    missing.push("Ünvan");
  }

  if (!employee.department?.trim()) {
    missing.push("Departman");
  }

  if (!employee.phone?.trim()) {
    missing.push("Telefon");
  }

  if (!employee.email?.trim()) {
    missing.push("E-posta");
  }

  if (!employee.registry_no?.trim()) {
    missing.push("Sicil");
  }

  if (!employee.tc_no?.trim()) {
    missing.push("T.C.");
  }

  if (!employee.start_date?.trim()) {
    missing.push("İşe giriş");
  }

  if (!employee.birth_date?.trim()) {
    missing.push("Doğum tarihi");
  }

  return missing;
}
