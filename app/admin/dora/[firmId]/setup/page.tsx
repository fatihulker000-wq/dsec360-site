"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

type DoraFirm = {
  id: string;
  firm_name: string;
  sgk_no?: string | null;
  tax_no?: string | null;
  tax_office?: string | null;
  mersis_no?: string | null;
  nace_code?: string | null;
  sector?: string | null;
  danger_class?: string | null;
  employee_count?: number | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  authorized_person?: string | null;
  note?: string | null;
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

export default function DoraSetupPage() {
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
      } else {
        setRiskCount(0);
      }

      if (teamResponse.ok) {
        const teamJson = await teamResponse.json();
        setRiskTeamCount(
          Array.isArray(teamJson.members)
            ? teamJson.members.length
            : 0
        );
      } else {
        setRiskTeamCount(0);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "DORA kurulum bilgileri alınamadı."
      );
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    void load();
  }, [load]);

  const employeeCount = Number(
    firm?.employee_count ?? 0
  );

  const setupItems = useMemo(() => {
    if (!firm) return [];

    return [
      {
        title: "Firma ünvanı",
        detail: "DORA çalışma alanının firma kimliği.",
        complete: Boolean(value(firm.firm_name)),
      },
      {
        title: "SGK işyeri sicil numarası",
        detail: "İşyeri kayıt ve doküman çıktılarında kullanılacak.",
        complete: Boolean(value(firm.sgk_no)),
      },
      {
        title: "Vergi / kimlik bilgileri",
        detail: "Vergi numarası ve vergi dairesi bilgileri.",
        complete: Boolean(
          value(firm.tax_no) &&
          value(firm.tax_office)
        ),
      },
      {
        title: "NACE kodu ve sektör",
        detail: "Kurulum analizinin faaliyet alanı temelidir.",
        complete: Boolean(
          value(firm.nace_code) &&
          value(firm.sector)
        ),
      },
      {
        title: "Tehlike sınıfı",
        detail: "İSG gereklilikleri için temel sınıflandırma.",
        complete: Boolean(value(firm.danger_class)),
      },
      {
        title: "Çalışan sayısı",
        detail: "Kurul, ekip ve eğitim yükümlülüklerinde kullanılır.",
        complete: employeeCount > 0,
      },
      {
        title: "Firma iletişim bilgileri",
        detail: "Adres, telefon ve e-posta bilgileri.",
        complete: Boolean(
          value(firm.address) &&
          value(firm.phone) &&
          value(firm.email)
        ),
      },
      {
        title: "Firma yetkilisi",
        detail: "Kurumsal doküman ve onay süreçlerinde kullanılacak.",
        complete: Boolean(value(firm.authorized_person)),
      },
      {
        title: "DORA çalışan havuzu",
        detail: "Eğitim, kurul, risk ve destek ekipleri için çalışan kaydı.",
        complete: employeeCount > 0,
        route: `/admin/dora/${firmId}/employees`,
        button: "Çalışanları Yönet",
      },
      {
        title: "Risk değerlendirme ekibi",
        detail: "Fine Kinney risk sürecinde görev alacak ekip.",
        complete: riskTeamCount > 0,
        route: `/admin/dora/${firmId}/risk-team`,
        button: "Risk Ekibini Yönet",
      },
      {
        title: "Fine Kinney risk kayıtları",
        detail: "DORA bağımsız risk değerlendirmesi.",
        complete: riskCount > 0,
        route: `/admin/dora/${firmId}/risks`,
        button: "Risk Merkezine Gir",
      },
    ];
  }, [
    firm,
    employeeCount,
    riskTeamCount,
    riskCount,
    firmId,
  ]);

  const completed =
    setupItems.filter((x) => x.complete).length;

  const percent =
    setupItems.length > 0
      ? Math.round(
          (completed / setupItems.length) * 100
        )
      : 0;

  if (loading) {
    return <main className="page">Kurulum merkezi yükleniyor...</main>;
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
            DORA • KURULUM MERKEZİ
          </div>
          <h1>Kurulum Yol Haritası</h1>
          <p>
            {firm.firm_name} için firma, çalışan,
            risk ekibi ve temel DORA kayıtlarını
            tek merkezden yönetin.
          </p>
        </div>

        <div className="score">
          <strong>%{percent}</strong>
          <span>
            {completed}/{setupItems.length} tamam
          </span>
        </div>
      </section>

      <section className="progressCard">
        <div className="progressHead">
          <strong>Kurulum Tamamlanma Durumu</strong>
          <span>%{percent}</span>
        </div>
        <div className="track">
          <div
            className="bar"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      <section className="list">
        {setupItems.map((item) => (
          <article
            key={item.title}
            className={`item ${
              item.complete ? "done" : "pending"
            }`}
          >
            <div className="status">
              {item.complete ? "✓" : "!"}
            </div>

            <div className="body">
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </div>

            <div className="action">
              <span>
                {item.complete
                  ? "Tamamlandı"
                  : "Eksik / Kontrol Et"}
              </span>

              {item.route && (
                <button
                  className="secondary"
                  onClick={() =>
                    router.push(item.route!)
                  }
                >
                  {item.button}
                </button>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="quick">
        <button
          className="primary"
          onClick={() =>
            router.push(
              `/admin/dora/${firmId}/employees`
            )
          }
        >
          Çalışanları Yönet
        </button>

        <button
          className="primary"
          onClick={() =>
            router.push(
              `/admin/dora/${firmId}/risk-team`
            )
          }
        >
          Risk Ekibini Yönet
        </button>

        <button
          className="primary"
          onClick={() =>
            router.push(
              `/admin/dora/${firmId}/documents`
            )
          }
        >
          Doküman Merkezi
        </button>
      </section>

      <style jsx>{styles}</style>
    </main>
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
    background: #fff;
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

  .score {
    width: 170px;
    height: 170px;
    flex: 0 0 auto;
    border-radius: 50%;
    display: grid;
    place-items: center;
    align-content: center;
    background: rgba(255,255,255,.14);
    border: 1px solid rgba(255,255,255,.2);
  }

  .score strong {
    font-size: 38px;
  }

  .score span {
    font-size: 12px;
    font-weight: 800;
    color: rgba(255,255,255,.8);
  }

  .progressCard,
  .list,
  .quick {
    max-width: 1450px;
    margin: 18px auto 0;
  }

  .progressCard {
    padding: 20px;
    border: 1px solid #e4e7ec;
    border-radius: 18px;
    background: white;
  }

  .progressHead {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .track {
    height: 10px;
    border-radius: 999px;
    background: #eaecf0;
    overflow: hidden;
  }

  .bar {
    height: 100%;
    background: #7a2633;
    border-radius: inherit;
  }

  .list {
    display: grid;
    gap: 10px;
  }

  .item {
    display: grid;
    grid-template-columns: 44px minmax(0,1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 16px;
    border: 1px solid #e4e7ec;
    border-radius: 16px;
    background: white;
  }

  .item.done {
    background: #f8fffb;
    border-color: #cdebd8;
  }

  .item.pending {
    background: #fffaf8;
    border-color: #f4d4c6;
  }

  .status {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-weight: 950;
    background: #f2f4f7;
  }

  .done .status {
    background: #dcfae6;
    color: #067647;
  }

  .pending .status {
    background: #ffead5;
    color: #b54708;
  }

  .body h3 {
    margin: 0;
  }

  .body p {
    margin: 5px 0 0;
    color: #667085;
    font-size: 13px;
    line-height: 1.5;
  }

  .action {
    min-width: 190px;
    text-align: right;
  }

  .action > span {
    display: block;
    margin-bottom: 7px;
    color: #667085;
    font-size: 11px;
    font-weight: 850;
  }

  .quick {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .primary {
    border: 0;
    background: #7a2633;
    color: white;
    padding: 11px 15px;
    border-radius: 12px;
    font-weight: 850;
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

  @media (max-width: 800px) {
    .hero {
      flex-direction: column;
      align-items: flex-start;
    }

    .score {
      width: 120px;
      height: 120px;
    }

    .item {
      grid-template-columns: 40px 1fr;
    }

    .action {
      grid-column: 1 / -1;
      text-align: left;
      min-width: 0;
    }
  }
`;