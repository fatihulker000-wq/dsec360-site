"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

type DoraFirm = {
  id: string;
  firm_name: string;
  employee_count?: number | null;
  setup_score?: number | null;
  setup_status?: string | null;
};

type ApiResponse = {
  success?: boolean;
  error?: string;
  firm?: DoraFirm;
};

function value(v: unknown) {
  return String(v ?? "").trim();
}

export default function DoraReportsPage() {
  const router = useRouter();
  const params = useParams();
  const firmId = value(params.firmId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [firm, setFirm] = useState<DoraFirm | null>(null);
  const [riskCount, setRiskCount] = useState(0);
  const [riskTeamCount, setRiskTeamCount] = useState(0);

  const load = useCallback(async () => {
    if (!firmId) {
      setError("DORA firma ID bulunamadı.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [firmResponse, riskResponse, teamResponse] =
        await Promise.all([
          fetch(`/api/dora/firms?id=${encodeURIComponent(firmId)}`, {
            cache: "no-store",
          }),
          fetch(`/api/dora/risks?firmId=${encodeURIComponent(firmId)}`, {
            cache: "no-store",
          }),
          fetch(`/api/dora/risk-team?firmId=${encodeURIComponent(firmId)}`, {
            cache: "no-store",
          }),
        ]);

      const json = (await firmResponse.json()) as ApiResponse;

      if (!firmResponse.ok || json.success === false) {
        throw new Error(
          json.error || "DORA firma bilgileri alınamadı."
        );
      }

      setFirm(json.firm ?? null);

      if (riskResponse.ok) {
        const riskJson = await riskResponse.json();
        setRiskCount(
          Array.isArray(riskJson.risks)
            ? riskJson.risks.length
            : 0
        );
      }

      if (teamResponse.ok) {
        const teamJson = await teamResponse.json();
        setRiskTeamCount(
          Array.isArray(teamJson.members)
            ? teamJson.members.length
            : 0
        );
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "DORA rapor verileri alınamadı."
      );
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <main className="page">Rapor merkezi yükleniyor...</main>;
  }

  if (error || !firm) {
    return (
      <main className="page">
        <button
          className="back"
          onClick={() =>
            router.push(`/admin/dora/${firmId}`)
          }
        >
          ← DORA Firma
        </button>
        <div className="error">
          {error || "Firma bulunamadı."}
        </div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  const employeeCount =
    Number(firm.employee_count ?? 0);

  const setupScore =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Number(firm.setup_score ?? 0)
        )
      )
    );

  return (
    <main className="page">
      <div className="topbar">
        <button
          className="back"
          onClick={() =>
            router.push(`/admin/dora/${firmId}`)
          }
        >
          ← Firma Merkezine Dön
        </button>

        <button
          className="refresh"
          onClick={() => void load()}
        >
          Yenile
        </button>
      </div>

      <section className="hero">
        <div>
          <div className="eyebrow">
            DORA • RAPOR MERKEZİ
          </div>
          <h1>Rapor ve Çıktı Merkezi</h1>
          <p>
            {firm.firm_name} için kurulum,
            çalışan, Fine Kinney risk,
            denetim ve doküman raporlarını
            tek merkezden yönetin.
          </p>
        </div>

        <button
          className="pdf"
          onClick={() => window.print()}
        >
          Firma Özetini Yazdır / PDF
        </button>
      </section>

      <section className="kpis">
        <Kpi
          title="Kurulum"
          value={`%${setupScore}`}
          detail="DORA kurulum skoru"
        />
        <Kpi
          title="Çalışan"
          value={employeeCount}
          detail="DORA çalışan havuzu"
        />
        <Kpi
          title="Risk"
          value={riskCount}
          detail="Fine Kinney kayıtları"
        />
        <Kpi
          title="Risk Ekibi"
          value={riskTeamCount}
          detail="Görevlendirilmiş ekip üyeleri"
        />
      </section>

      <section className="grid">
        <ReportCard
          eyebrow="KURULUM RAPORU"
          title="Kurulum Durum Özeti"
          description="Kurulum skoru, eksik ve tamamlanan adımlar ile firma kurulum durumunu görüntüleyin."
          button="Kurulum Raporunu Aç"
          onClick={() =>
            router.push(
              `/admin/dora/${firmId}/setup`
            )
          }
        />

        <ReportCard
          eyebrow="RİSK RAPORU"
          title="Fine Kinney Risk Raporları"
          description="Risk kayıtları, skorlar, aksiyonlar ve mevcut risk raporlama araçlarına erişin."
          button="Risk Raporlarını Aç"
          onClick={() =>
            router.push(
              `/admin/dora/${firmId}/risks`
            )
          }
        />

        <ReportCard
          eyebrow="DENETİM RAPORU"
          title="DORA Denetim Raporları"
          description="Denetimler, cevaplar, bulgular, DÖF kayıtları ve denetim raporlarına ulaşın."
          button="Denetim Raporlarını Aç"
          onClick={() =>
            router.push(
              `/admin/dora/${firmId}/audits`
            )
          }
        />

        <ReportCard
          eyebrow="DOKÜMAN RAPORU"
          title="Doküman ve Evrak Çıktıları"
          description="DORA tarafından üretilen kurumsal dokümanlara ve hazır evrak paketlerine erişin."
          button="Dokümanları Aç"
          onClick={() =>
            router.push(
              `/admin/dora/${firmId}/documents`
            )
          }
        />
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

function Kpi({
  title,
  value,
  detail,
}: {
  title: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="kpi">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function ReportCard({
  eyebrow,
  title,
  description,
  button,
  onClick,
}: {
  eyebrow: string;
  title: string;
  description: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <article className="card">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <button
        className="secondary"
        onClick={onClick}
      >
        {button}
      </button>
    </article>
  );
}

const styles = `
  :global(*) { box-sizing: border-box; }

  .page {
    min-height: 100vh;
    padding: 24px;
    color: #172033;
    background: linear-gradient(180deg,#f7f8fb 0%,#fff 430px);
  }

  button { font: inherit; cursor: pointer; }

  .topbar {
    max-width: 1450px;
    margin: 0 auto 14px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .back, .refresh, .secondary {
    border: 1px solid #d0d5dd;
    background: white;
    color: #344054;
    padding: 10px 14px;
    border-radius: 12px;
    font-weight: 800;
  }

  .hero {
    max-width: 1450px;
    margin: 0 auto;
    padding: 32px;
    border-radius: 28px;
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: center;
    color: white;
    background: linear-gradient(120deg,#50141f 0%,#7a2633 48%,#d0602c 100%);
    box-shadow: 0 22px 50px rgba(73,20,31,.17);
  }

  .eyebrow {
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .14em;
    color: rgba(255,255,255,.75);
  }

  .hero h1 {
    margin: 8px 0 10px;
    font-size: clamp(32px,5vw,52px);
  }

  .hero p {
    margin: 0;
    max-width: 760px;
    line-height: 1.6;
    color: rgba(255,255,255,.86);
  }

  .pdf {
    border: 1px solid rgba(255,255,255,.22);
    background: rgba(255,255,255,.14);
    color: white;
    padding: 12px 16px;
    border-radius: 13px;
    font-weight: 850;
  }

  .kpis,
  .grid {
    max-width: 1450px;
    margin: 18px auto 0;
    display: grid;
    gap: 14px;
  }

  .kpis {
    grid-template-columns: repeat(4,minmax(0,1fr));
  }

  .kpi {
    padding: 18px;
    border: 1px solid #e4e7ec;
    border-radius: 18px;
    background: white;
  }

  .kpi span,
  .kpi small {
    display: block;
    color: #667085;
  }

  .kpi strong {
    display: block;
    margin: 8px 0;
    font-size: 30px;
  }

  .grid {
    grid-template-columns: repeat(2,minmax(0,1fr));
  }

  .card {
    min-height: 230px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border: 1px solid #e4e7ec;
    border-radius: 20px;
    background: white;
  }

  .card span {
    color: #8c3543;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .12em;
  }

  .card h2 {
    margin: 9px 0 8px;
    font-size: 22px;
  }

  .card p {
    margin: 0 0 20px;
    color: #667085;
    line-height: 1.6;
  }

  .secondary {
    align-self: flex-start;
  }

  .error {
    max-width: 1450px;
    margin: 20px auto;
    padding: 18px;
    border: 1px solid #f1b4b4;
    border-radius: 14px;
    background: #fff2f2;
    color: #b42318;
  }

  @media (max-width: 900px) {
    .hero {
      flex-direction: column;
      align-items: flex-start;
    }

    .kpis,
    .grid {
      grid-template-columns: 1fr;
    }
  }

  @media print {
    .topbar,
    button {
      display: none !important;
    }

    .page {
      padding: 0;
      background: white;
    }

    .hero,
    .kpi,
    .card {
      box-shadow: none !important;
      break-inside: avoid;
    }
  }
`;
