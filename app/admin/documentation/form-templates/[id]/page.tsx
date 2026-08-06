"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import Ek2OfficialTemplate from "../components/Ek2OfficialTemplate";
import MedicalRequestTemplate from "../components/MedicalRequestTemplate";
import NearMissTemplate from "../components/NearMissTemplate";
import PpeDeliveryTemplate from "../components/PpeDeliveryTemplate";
import ReturnToWorkTemplate from "../components/ReturnToWorkTemplate";
import UnknownTemplate from "../components/UnknownTemplate";
import type { FormTemplateRecord } from "../components/types";

type ApiResponse = {
  success?: boolean;
  record?: FormTemplateRecord | null;
  error?: string;
  detail?: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

export default function FormTemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const id = clean(params?.id);
  const mode = clean(searchParams.get("mode"));

  const [record, setRecord] =
    useState<FormTemplateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Form şablonu kimliği bulunamadı.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/admin/documentation/form-templates?id=${encodeURIComponent(id)}`,
          {
            cache: "no-store",
            headers: { Accept: "application/json" },
          }
        );

        const json =
          (await response.json().catch(() => ({}))) as ApiResponse;

        if (!response.ok || !json.success || !json.record) {
          throw new Error(
            json.detail ||
              json.error ||
              "Form şablonu alınamadı."
          );
        }

        setRecord(json.record);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Form şablonu alınamadı."
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  if (loading) {
    return (
      <main className="statePage">
        <Loader2 size={32} className="spin" />
        <strong>Form şablonu hazırlanıyor...</strong>
        <style jsx>{`
          .statePage {
            min-height: 100vh;
            display: grid;
            place-items: center;
            align-content: center;
            gap: 12px;
            background: #f8fafc;
            color: #64748b;
          }
          .spin { animation: spin .9s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </main>
    );
  }

  if (error || !record) {
    return (
      <main className="statePage">
        <strong>Form şablonu açılamadı</strong>
        <p>{error}</p>
        <style jsx>{`
          .statePage {
            min-height: 100vh;
            display: grid;
            place-items: center;
            align-content: center;
            gap: 10px;
            padding: 24px;
            background: #f8fafc;
            color: #64748b;
            text-align: center;
          }
        `}</style>
      </main>
    );
  }

  switch (record.template_code) {
    case "EK2_ISE_GIRIS_PERIYODIK":
      return <Ek2OfficialTemplate />;

    case "ISE_DONUS_MUAYENE":
      return <ReturnToWorkTemplate record={record} mode={mode} />;

    case "TETKIK_ISTEK":
      return <MedicalRequestTemplate record={record} mode={mode} />;

    case "KKD_ZIMMET":
      return <PpeDeliveryTemplate record={record} mode={mode} />;

    case "RAMAK_KALA_BILDIRIM":
      return <NearMissTemplate record={record} mode={mode} />;

    default:
      return <UnknownTemplate record={record} mode={mode} />;
  }
}
