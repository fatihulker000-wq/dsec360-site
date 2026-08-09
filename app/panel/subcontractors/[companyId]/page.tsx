"use client";

import { useParams, useSearchParams } from "next/navigation";

export default function SubcontractorDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const companyId = String(params.companyId ?? "");
  const firmId = searchParams.get("firmId") ?? "";

  return (
    <main style={{ padding: 24 }}>
      <h1>Taşeron Firma Detayı</h1>

      <p>
        <strong>Company ID:</strong> {companyId}
      </p>

      <p>
        <strong>Firm ID:</strong> {firmId}
      </p>
    </main>
  );
}