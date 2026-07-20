"use client";

import type { EmployeeItem } from "../types";

type Props = {
  employees: EmployeeItem[];
  loading: boolean;
  value: string;
  disabled?: boolean;
  onChange: (employee: EmployeeItem | null) => void;
};

export default function EmployeeSelect({
  employees,
  loading,
  value,
  disabled = false,
  onChange,
}: Props) {
  return (
    <label style={{ display: "grid", gap: 7 }}>
      <span style={{ fontSize: 13, fontWeight: 850, color: "#334155" }}>
        Sorumlu çalışan
      </span>

      <select
        value={value}
        disabled={disabled || loading}
        onChange={(event) => {
          const employee =
            employees.find(
              (item) => item.id === event.target.value
            ) ?? null;

          onChange(employee);
        }}
        style={inputStyle}
      >
        <option value="">Sorumlu seçilmedi</option>

        {loading ? (
          <option value="" disabled>
            Çalışanlar yükleniyor...
          </option>
        ) : (
          employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.full_name}
              {employee.job_title
                ? ` • ${employee.job_title}`
                : ""}
            </option>
          ))
        )}
      </select>
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  boxSizing: "border-box",
  borderRadius: 14,
  border: "1px solid #dbe2ea",
  background: "#ffffff",
  color: "#172033",
  padding: "11px 13px",
  outline: "none",
  fontSize: 14,
};
