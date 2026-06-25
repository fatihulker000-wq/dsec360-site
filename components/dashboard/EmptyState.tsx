"use client";

import { BRAND } from "./styles";

type EmptyStateProps = {
  text: string;
};

export default function EmptyState({
  text,
}: EmptyStateProps) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 16,
        border: `1px dashed ${BRAND.border}`,
        background: "#fafafa",
        color: BRAND.muted,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}