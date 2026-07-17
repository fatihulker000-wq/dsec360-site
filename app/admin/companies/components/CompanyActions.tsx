"use client";

import { BRAND } from "../constants";

interface Props {
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CompanyActions({
  onDetail,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <ActionButton
        title="Detay"
        color="#1565C0"
        onClick={onDetail}
      />

      <ActionButton
        title="Düzenle"
        color="#EF6C00"
        onClick={onEdit}
      />

      <ActionButton
        title="Pasife Al"
        color={BRAND.red}
        onClick={onDelete}
      />
    </div>
  );
}

function ActionButton({
  title,
  color,
  onClick,
}: {
  title: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 10,
        padding: "8px 14px",
        cursor: "pointer",
        background: color,
        color: "#fff",
        fontWeight: 800,
      }}
    >
      {title}
    </button>
  );
}