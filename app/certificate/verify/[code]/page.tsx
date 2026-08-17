export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    code: string;
  }>;
};

function formatDuration(
  seconds?: number | null,
  minutes?: number | null
) {
  const safeSeconds = Number(seconds || 0);

  if (
    Number.isFinite(safeSeconds) &&
    safeSeconds > 0
  ) {
    const hours = Math.floor(
      safeSeconds / 3600
    );

    const remainingMinutes = Math.floor(
      (safeSeconds % 3600) / 60
    );

    const remainingSeconds = Math.floor(
      safeSeconds % 60
    );

    if (hours > 0) {
      if (
        remainingMinutes > 0 &&
        remainingSeconds > 0
      ) {
        return `${hours} sa ${remainingMinutes} dk ${remainingSeconds} sn`;
      }

      if (remainingMinutes > 0) {
        return `${hours} sa ${remainingMinutes} dk`;
      }

      return `${hours} sa`;
    }

    if (remainingMinutes > 0) {
      if (remainingSeconds > 0) {
        return `${remainingMinutes} dk ${remainingSeconds} sn`;
      }

      return `${remainingMinutes} dk`;
    }

    return `${remainingSeconds} sn`;
  }

  const safeMinutes = Number(
    minutes || 0
  );

  if (
    Number.isFinite(safeMinutes) &&
    safeMinutes > 0
  ) {
    const hours = Math.floor(
      safeMinutes / 60
    );

    const remainingMinutes =
      safeMinutes % 60;

    if (hours > 0) {
      return remainingMinutes > 0
        ? `${hours} sa ${remainingMinutes} dk`
        : `${hours} sa`;
    }

    return `${safeMinutes} dk`;
  }

  return "-";
}

export default async function CertificateVerifyPage({
  params,
}: Props) {
  const { code } = await params;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const response = await fetch(
    `${baseUrl.replace(
      /\/$/,
      ""
    )}/api/training-certificates/verify?code=${encodeURIComponent(
      code
    )}`,
    {
      cache: "no-store",
    }
  );

  const result = await response
    .json()
    .catch(() => ({
      valid: false,
      error:
        "Doğrulama yapılamadı.",
    }));

  const certificate =
    result?.data;

  const durationText = certificate
    ? formatDuration(
        certificate.duration_seconds,
        certificate.duration_minutes
      )
    : "-";

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(145deg,#f8fafc,#eef2ff)",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width:
            "min(720px,100%)",
          padding: 28,
          borderRadius: 24,
          background: "#fff",
          border:
            "1px solid #e5e7eb",
          boxShadow:
            "0 24px 70px rgba(15,23,42,.12)",
        }}
      >
        <div
          style={{
            display:
              "inline-flex",
            padding: "7px 11px",
            borderRadius: 999,
            color: result.valid
              ? "#166534"
              : "#991b1b",
            background:
              result.valid
                ? "#dcfce7"
                : "#fee2e2",
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          {result.valid
            ? "SERTİFİKA GEÇERLİ"
            : "SERTİFİKA GEÇERSİZ"}
        </div>

        <h1
          style={{
            margin:
              "18px 0 0",
            fontSize: 30,
            color: "#111827",
          }}
        >
          D-SEC Sertifika
          Doğrulama
        </h1>

        {!certificate ? (
          <p
            style={{
              color: "#64748b",
            }}
          >
            {result.error ||
              "Kayıt bulunamadı."}
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 12,
              marginTop: 20,
            }}
          >
            {[
              [
                "Belge No",
                certificate.certificate_no,
              ],

              [
                "Çalışan",
                certificate.employee_name,
              ],

              [
                "Eğitim",
                certificate.training_title,
              ],

              [
                "Firma",
                certificate.company_name ||
                  "-",
              ],

              [
                "Eğitim Süresi",
                durationText,
              ],

              [
                "Final Puanı",
                certificate.final_score ??
                  "-",
              ],

              [
                "Düzenlenme",
                certificate.issued_at
                  ? new Date(
                      certificate.issued_at
                    ).toLocaleString(
                      "tr-TR"
                    )
                  : "-",
              ],

              [
                "Geçerlilik",
                certificate.valid_until ||
                  "Süresiz",
              ],

              [
                "Revizyon",
                certificate.revision_no,
              ],

              [
                "Durum",
                certificate.effective_status,
              ],

              [
                "Belge Hash",
                certificate.document_hash,
              ],
            ].map(
              ([label, value]) => (
                <div
                  key={String(
                    label
                  )}
                  style={{
                    padding: 13,
                    borderRadius: 13,
                    background:
                      "#f8fafc",
                  }}
                >
                  <span
                    style={{
                      display:
                        "block",
                      color:
                        "#94a3b8",
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    {label}
                  </span>

                  <strong
                    style={{
                      display:
                        "block",
                      marginTop: 5,
                      color:
                        "#111827",
                      overflowWrap:
                        "anywhere",
                    }}
                  >
                    {String(
                      value ?? "-"
                    )}
                  </strong>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}