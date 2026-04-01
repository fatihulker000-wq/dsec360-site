import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type VerifyPageProps = {
  params: Promise<{ code: string }>;
};

function formatDateTr(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("tr-TR");
}

export default async function VerifyCertificatePage({
  params,
}: VerifyPageProps) {
  const { code } = await params;
  const supabase = getSupabase();

  const { data: assignment } = await supabase
    .from("training_assignments")
    .select(
      "id, status, completed_at, certificate_no, verification_code, training_id"
    )
    .eq("verification_code", code)
    .single();

  let trainingTitle = "-";

  if (assignment?.training_id) {
    const { data: training } = await supabase
      .from("trainings")
      .select("title")
      .eq("id", assignment.training_id)
      .single();

    trainingTitle = training?.title || "-";
  }

  const isValid = Boolean(assignment && assignment.status === "completed");

  return (
    <main
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        padding: "32px",
      }}
    >
      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "24px",
          padding: "32px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 14px",
            borderRadius: "999px",
            background: isValid ? "#dcfce7" : "#fee2e2",
            color: isValid ? "#166534" : "#b91c1c",
            fontWeight: 800,
            marginBottom: "16px",
          }}
        >
          {isValid ? "Geçerli Belge" : "Geçersiz / Bulunamadı"}
        </div>

        <h1 style={{ margin: 0, fontSize: "34px", fontWeight: 900 }}>
          Sertifika Doğrulama
        </h1>

        <p style={{ color: "#6b7280", marginTop: "12px", lineHeight: 1.7 }}>
          Bu sayfa, D-SEC tarafından üretilen eğitim belgelerinin doğrulama ekranıdır.
        </p>

        <div
          style={{
            marginTop: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              background: "#f9fafb",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 700 }}>
              Doğrulama Kodu
            </div>
            <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "8px" }}>
              {code}
            </div>
          </div>

          <div
            style={{
              background: "#f9fafb",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 700 }}>
              Belge No
            </div>
            <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "8px" }}>
              {assignment?.certificate_no || "-"}
            </div>
          </div>

          <div
            style={{
              background: "#f9fafb",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 700 }}>
              Eğitim
            </div>
            <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "8px" }}>
              {trainingTitle}
            </div>
          </div>

          <div
            style={{
              background: "#f9fafb",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 700 }}>
              Tamamlanma Tarihi
            </div>
            <div style={{ fontSize: "16px", fontWeight: 800, marginTop: "8px" }}>
              {formatDateTr(assignment?.completed_at)}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "24px",
            padding: "18px",
            borderRadius: "16px",
            background: isValid ? "#f0fdf4" : "#fef2f2",
            color: isValid ? "#166534" : "#991b1b",
            lineHeight: 1.7,
          }}
        >
          {isValid
            ? "Bu belgeye ait sertifika kaydı doğrulanmıştır. Belge geçerli görünmektedir."
            : "Bu doğrulama kodu ile eşleşen geçerli bir tamamlanmış eğitim belgesi bulunamadı."}
        </div>
      </div>
    </main>
  );
}
