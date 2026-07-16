"use client";

export default function EmployeeStatusBadge({
  active,
  incomplete = false,
}: {
  active: boolean;
  incomplete?: boolean;
}) {
  if (incomplete) {
    return (
      <span style={badge("#fef3c7", "#92400e")}>
        Eksik Bilgi
      </span>
    );
  }

  return (
    <span
      style={
        active
          ? badge("#dcfce7", "#166534")
          : badge("#fee2e2", "#b91c1c")
      }
    >
      {active ? "Aktif" : "Pasif"}
    </span>
  );
}

function badge(
  background: string,
  color: string
): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "6px 10px",
    background,
    color,
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: "nowrap",
  };
}
