import type { EmployeeListRow } from "./types";

export function exportEmployeesCsv(
  employees: EmployeeListRow[],
  filename = "dsec-calisan-listesi.csv"
) {
  const header = [
    "Ad Soyad",
    "Sicil No",
    "T.C.",
    "Firma",
    "Departman",
    "Ünvan",
    "Telefon",
    "E-posta",
    "İşe Giriş",
    "Durum",
  ];

  const body = employees.map((employee) => [
    employee.full_name || "",
    employee.registry_no || "",
    employee.tc_no || "",
    employee.firm_name || employee.firm_id || "",
    employee.department || "",
    employee.job_title || "",
    employee.phone || "",
    employee.email || "",
    employee.start_date || "",
    employee.active ? "Aktif" : "Pasif",
  ]);

  const csv = [header, ...body]
    .map((row) =>
      row
        .map((cell) =>
          `"${String(cell).replace(/"/g, '""')}"`
        )
        .join(";")
    )
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}