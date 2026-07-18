"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import EmployeeBulkActions from "./EmployeeBulkActions";
import EmployeeTable from "./EmployeeTable";
import EmployeeToolbar from "./EmployeeToolbar";

import { exportEmployeesCsv } from "./EmployeeExport";

import type {
  EmployeeListCompany,
  EmployeeListFilters,
  EmployeeListRow,
  EmployeeTableSort,
  EmployeeTableSortKey,
} from "./types";

const initialFilters: EmployeeListFilters = {
  search: "",
  status: "all",
  companyId: "all",
  department: "all",
  jobTitle: "all",
};

export default function EmployeeListCenter({
  employees,
  companies,
  loading = false,
  actionLoading = false,
  readOnly = false,
  onRefresh,
  onAdd,
  onOpen,
  onEdit,
  onActivate,
  onPassive,
  onDelete,
  onBulkActivate,
  onBulkPassive,
  onBulkDelete,
}: {
  employees: EmployeeListRow[];
  companies: EmployeeListCompany[];
  loading?: boolean;
  actionLoading?: boolean;
  readOnly?: boolean;
  onRefresh(): void;
  onAdd(): void;
  onOpen(employee: EmployeeListRow): void;
  onEdit(employee: EmployeeListRow): void;
  onActivate(employee: EmployeeListRow): void;
  onPassive(employee: EmployeeListRow): void;
  onDelete(employee: EmployeeListRow): void;
  onBulkActivate?(ids: string[]): void;
  onBulkPassive?(ids: string[]): void;
  onBulkDelete?(ids: string[]): void;
}) {
  const [filters, setFilters] =
    useState<EmployeeListFilters>(initialFilters);

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  const [sort, setSort] =
    useState<EmployeeTableSort>({
      key: "full_name",
      direction: "asc",
    });

  /*
   * Kullanıcı salt-okunur duruma geçtiğinde
   * daha önce seçilmiş çalışanları temizle.
   */
  useEffect(() => {
    if (readOnly) {
      setSelectedIds([]);
    }
  }, [readOnly]);

  const departments = useMemo(
    () =>
      uniqueSorted(
        employees
          .map(
            (employee) =>
              employee.department
          )
          .filter(Boolean) as string[]
      ),
    [employees]
  );

  const jobTitles = useMemo(
    () =>
      uniqueSorted(
        employees
          .map(
            (employee) =>
              employee.job_title
          )
          .filter(Boolean) as string[]
      ),
    [employees]
  );

  const filteredRows = useMemo(() => {
    const query = filters.search
      .trim()
      .toLocaleLowerCase("tr-TR");

    return [...employees]
      .filter((employee) => {
        if (
          filters.companyId !== "all" &&
          String(employee.firm_id) !==
            filters.companyId
        ) {
          return false;
        }

        if (
          filters.department !== "all" &&
          String(
            employee.department || ""
          ) !== filters.department
        ) {
          return false;
        }

        if (
          filters.jobTitle !== "all" &&
          String(
            employee.job_title || ""
          ) !== filters.jobTitle
        ) {
          return false;
        }

        if (
          filters.status === "active" &&
          !employee.active
        ) {
          return false;
        }

        if (
          filters.status === "passive" &&
          employee.active
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          employee.full_name,
          employee.job_title,
          employee.department,
          employee.phone,
          employee.email,
          employee.registry_no,
          employee.tc_no,
          employee.firm_name,
        ]
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(query);
      })
      .sort((first, second) =>
        compareRows(first, second, sort)
      );
  }, [employees, filters, sort]);

  function handleSort(
    key: EmployeeTableSortKey
  ) {
    setSort((current) => ({
      key,
      direction:
        current.key === key &&
        current.direction === "asc"
          ? "desc"
          : "asc",
    }));
  }

  function toggleOne(id: string) {
    if (readOnly) {
      return;
    }

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter(
            (value) => value !== id
          )
        : [...current, id]
    );
  }

  function toggleAll() {
    if (readOnly) {
      return;
    }

    const visibleIds = filteredRows.map(
      (row) => row.id
    );

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) =>
        selectedIds.includes(id)
      );

    setSelectedIds((current) =>
      allSelected
        ? current.filter(
            (id) =>
              !visibleIds.includes(id)
          )
        : Array.from(
            new Set([
              ...current,
              ...visibleIds,
            ])
          )
    );
  }

  const selectedRows = useMemo(
    () =>
      employees.filter((employee) =>
        selectedIds.includes(employee.id)
      ),
    [employees, selectedIds]
  );

  return (
    <div
      style={{
        display: "grid",
        gap: 14,
      }}
    >
      <EmployeeToolbar
        filters={filters}
        companies={companies}
        departments={departments}
        jobTitles={jobTitles}
        readOnly={readOnly}
        onChange={setFilters}
        onRefresh={onRefresh}
        onAdd={() => {
          if (!readOnly) {
            onAdd();
          }
        }}
      />

      {!readOnly ? (
        <EmployeeBulkActions
          selectedCount={
            selectedIds.length
          }
          loading={actionLoading}
          onActivate={() =>
            onBulkActivate?.(
              selectedIds
            )
          }
          onPassive={() =>
            onBulkPassive?.(
              selectedIds
            )
          }
          onDelete={() =>
            onBulkDelete?.(
              selectedIds
            )
          }
          onExportCsv={() =>
            exportEmployeesCsv(
              selectedRows.length > 0
                ? selectedRows
                : filteredRows
            )
          }
          onClear={() =>
            setSelectedIds([])
          }
        />
      ) : null}

      <EmployeeTable
        rows={filteredRows}
        selectedIds={
          readOnly ? [] : selectedIds
        }
        sort={sort}
        loading={loading}
        readOnly={readOnly}
        onSort={handleSort}
        onToggleAll={toggleAll}
        onToggleOne={toggleOne}
        onOpen={onOpen}
        onEdit={(employee) => {
          if (!readOnly) {
            onEdit(employee);
          }
        }}
        onPassive={(employee) => {
          if (!readOnly) {
            onPassive(employee);
          }
        }}
        onActivate={(employee) => {
          if (!readOnly) {
            onActivate(employee);
          }
        }}
        onDelete={(employee) => {
          if (!readOnly) {
            onDelete(employee);
          }
        }}
      />
    </div>
  );
}

function uniqueSorted(
  values: string[]
) {
  return Array.from(
    new Set(values)
  )
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((first, second) =>
      first.localeCompare(
        second,
        "tr"
      )
    );
}

function compareRows(
  first: EmployeeListRow,
  second: EmployeeListRow,
  sort: EmployeeTableSort
) {
  const firstValue =
    sort.key === "active"
      ? Number(first.active)
      : String(
          first[sort.key] || ""
        );

  const secondValue =
    sort.key === "active"
      ? Number(second.active)
      : String(
          second[sort.key] || ""
        );

  const comparison =
    typeof firstValue ===
      "number" &&
    typeof secondValue ===
      "number"
      ? firstValue - secondValue
      : String(
          firstValue
        ).localeCompare(
          String(secondValue),
          "tr",
          {
            numeric: true,
            sensitivity: "base",
          }
        );

  return sort.direction === "asc"
    ? comparison
    : -comparison;
}