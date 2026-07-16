"use client";

import EmployeeModuleBadge from "./EmployeeModuleBadge";
import EmployeeStatusBadge from "./EmployeeStatusBadge";

import type {
  EmployeeListRow,
  EmployeeTableSort,
  EmployeeTableSortKey,
} from "./types";

export default function EmployeeTable({
  rows,
  selectedIds,
  sort,
  loading = false,
  onSort,
  onToggleAll,
  onToggleOne,
  onOpen,
  onEdit,
  onPassive,
  onActivate,
  onDelete,
}: {
  rows: EmployeeListRow[];
  selectedIds: string[];
  sort: EmployeeTableSort;
  loading?: boolean;
  onSort(key: EmployeeTableSortKey): void;
  onToggleAll(): void;
  onToggleOne(id: string): void;
  onOpen(employee: EmployeeListRow): void;
  onEdit(employee: EmployeeListRow): void;
  onPassive(employee: EmployeeListRow): void;
  onActivate(employee: EmployeeListRow): void;
  onDelete(employee: EmployeeListRow): void;
}) {
  const allSelected =
    rows.length > 0 &&
    rows.every((row) => selectedIds.includes(row.id));

  return (
    <section
      style={{
        overflow: "hidden",
        borderRadius: 20,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            minWidth: 1540,
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <Th>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                />
              </Th>
              <SortableTh
                label="Ad Soyad"
                sortKey="full_name"
                sort={sort}
                onSort={onSort}
              />
              <SortableTh
                label="Sicil"
                sortKey="registry_no"
                sort={sort}
                onSort={onSort}
              />
              <SortableTh
                label="Firma"
                sortKey="firm_name"
                sort={sort}
                onSort={onSort}
              />
              <SortableTh
                label="Departman"
                sortKey="department"
                sort={sort}
                onSort={onSort}
              />
              <SortableTh
                label="Ünvan"
                sortKey="job_title"
                sort={sort}
                onSort={onSort}
              />
              <Th>İletişim</Th>
              <SortableTh
                label="İşe Giriş"
                sortKey="start_date"
                sort={sort}
                onSort={onSort}
              />
              <SortableTh
                label="Durum"
                sortKey="active"
                sort={sort}
                onSort={onSort}
              />
              <Th>Eğitim</Th>
              <Th>Sağlık</Th>
              <Th>KKD</Th>
              <Th>Evrak</Th>
              <Th>Risk</Th>
              <Th>Kaza</Th>
              <Th>İşlemler</Th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={16}
                  style={{
                    padding: 28,
                    textAlign: "center",
                    color: "#64748b",
                    fontWeight: 800,
                  }}
                >
                  Çalışan kayıtları yükleniyor...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={16}
                  style={{
                    padding: 28,
                    textAlign: "center",
                    color: "#64748b",
                    fontWeight: 800,
                  }}
                >
                  Filtrelere uygun çalışan bulunamadı.
                </td>
              </tr>
            ) : (
              rows.map((employee) => {
                const incomplete =
                  !employee.full_name ||
                  !employee.job_title ||
                  !employee.phone ||
                  !employee.email ||
                  !employee.registry_no ||
                  !employee.tc_no;

                return (
                  <tr
                    key={employee.id}
                    style={{
                      borderTop: "1px solid #f1f5f9",
                      background: selectedIds.includes(employee.id)
                        ? "#eff6ff"
                        : "#fff",
                    }}
                  >
                    <Td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(employee.id)}
                        onChange={() => onToggleOne(employee.id)}
                      />
                    </Td>

                    <Td>
                      <button
                        type="button"
                        onClick={() => onOpen(employee)}
                        style={{
                          border: "none",
                          padding: 0,
                          background: "transparent",
                          color: "#111827",
                          fontWeight: 950,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {employee.full_name || "Adsız çalışan"}
                      </button>
                    </Td>

                    <Td>{employee.registry_no || "-"}</Td>
                    <Td>{employee.firm_name || employee.firm_id || "-"}</Td>
                    <Td>{employee.department || "-"}</Td>
                    <Td>{employee.job_title || "-"}</Td>

                    <Td>
                      <div style={{ display: "grid", gap: 4 }}>
                        <span>{employee.phone || "-"}</span>
                        <span style={{ color: "#64748b", fontSize: 11 }}>
                          {employee.email || "-"}
                        </span>
                      </div>
                    </Td>

                    <Td>{formatDate(employee.start_date)}</Td>

                    <Td>
                      <EmployeeStatusBadge
                        active={employee.active}
                        incomplete={incomplete}
                      />
                    </Td>

                    <Td>
                      <EmployeeModuleBadge
                        label="Eğitim"
                        status={employee.training_status || "UNKNOWN"}
                      />
                    </Td>

                    <Td>
                      <EmployeeModuleBadge
                        label="Sağlık"
                        status={employee.health_status || "UNKNOWN"}
                      />
                    </Td>

                    <Td>
                      <EmployeeModuleBadge
                        label="KKD"
                        status={employee.ppe_status || "UNKNOWN"}
                      />
                    </Td>

                    <Td>
                      <EmployeeModuleBadge
                        label="Evrak"
                        status={employee.document_status || "UNKNOWN"}
                      />
                    </Td>

                    <Td>
                      <EmployeeModuleBadge
                        label="Risk"
                        status={employee.risk_status || "UNKNOWN"}
                      />
                    </Td>

                    <Td>
                      <span
                        style={{
                          display: "inline-flex",
                          minWidth: 30,
                          justifyContent: "center",
                          borderRadius: 999,
                          padding: "6px 9px",
                          background:
                            Number(employee.accident_count || 0) > 0
                              ? "#fee2e2"
                              : "#f1f5f9",
                          color:
                            Number(employee.accident_count || 0) > 0
                              ? "#b91c1c"
                              : "#64748b",
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        {Number(employee.accident_count || 0)}
                      </span>
                    </Td>

                    <Td>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <SmallButton
                          title="Detay"
                          background="#111827"
                          onClick={() => onOpen(employee)}
                        />

                        <SmallButton
                          title="Düzenle"
                          background="#2563eb"
                          onClick={() => onEdit(employee)}
                        />

                        {employee.active ? (
                          <SmallButton
                            title="Pasife Al"
                            background="#b45309"
                            onClick={() => onPassive(employee)}
                          />
                        ) : (
                          <SmallButton
                            title="Aktif Yap"
                            background="#166534"
                            onClick={() => onActivate(employee)}
                          />
                        )}

                        <SmallButton
                          title="Sil"
                          background="#b91c1c"
                          onClick={() => onDelete(employee)}
                        />
                      </div>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SortableTh({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: EmployeeTableSortKey;
  sort: EmployeeTableSort;
  onSort(key: EmployeeTableSortKey): void;
}) {
  const active = sort.key === sortKey;

  return (
    <th
      style={{
        padding: 13,
        textAlign: "left",
        position: "sticky",
        top: 0,
        background: "#f8fafc",
        zIndex: 2,
      }}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        style={{
          border: "none",
          background: "transparent",
          padding: 0,
          color: "#334155",
          fontSize: 12,
          fontWeight: 950,
          cursor: "pointer",
        }}
      >
        {label}
        {active
          ? sort.direction === "asc"
            ? " ↑"
            : " ↓"
          : ""}
      </button>
    </th>
  );
}

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      style={{
        padding: 13,
        textAlign: "left",
        position: "sticky",
        top: 0,
        background: "#f8fafc",
        color: "#334155",
        fontSize: 12,
        fontWeight: 950,
        zIndex: 2,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td
      style={{
        padding: 13,
        color: "#111827",
        fontSize: 12,
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

function SmallButton({
  title,
  background,
  onClick,
}: {
  title: string;
  background: string;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 9,
        padding: "7px 9px",
        background,
        color: "#fff",
        fontSize: 10,
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {title}
    </button>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("tr-TR");
}
