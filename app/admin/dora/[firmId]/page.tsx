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
  sync_key?: string | null;
  app_local_id?: number | null;

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
  is_active?: boolean | null;

  created_at_millis?: number | null;
  updated_at_millis?: number | null;
};

type DoraFirmApiResponse = {
  success?: boolean;
  error?: string;
  firm?: DoraFirm;
};

function value(v: unknown) {
  return String(v ?? "").trim();
}

function statusLabel(
  input?: string | null
) {
  const normalized =
    value(input);

  if (!normalized) {
    return "Başlangıç";
  }

  return normalized
    .replaceAll("_", " ")
    .toLocaleLowerCase("tr-TR")
    .replace(
      /(^|\s)\S/g,
      (char) =>
        char.toLocaleUpperCase("tr-TR")
    );
}

function dangerClassLabel(
  input?: string | null
) {
  const normalized =
    value(input).toUpperCase();

  if (normalized === "AZ_TEHLIKELI") {
    return "Az Tehlikeli";
  }

  if (normalized === "TEHLIKELI") {
    return "Tehlikeli";
  }

  if (normalized === "COK_TEHLIKELI") {
    return "Çok Tehlikeli";
  }

  return normalized
    ? statusLabel(normalized)
    : "-";
}

function scoreValue(
  input?: number | null
) {
  const number =
    Number(input ?? 0);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(number))
  );
}

export default function DoraFirmWorkspacePage() {
  const router = useRouter();
  const params = useParams();

  const firmId =
    value(params.firmId);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [firm, setFirm] =
    useState<DoraFirm | null>(
      null
    );

  const [riskCount, setRiskCount] =
    useState(0);

  const [riskTeamCount, setRiskTeamCount] =
    useState(0);

  const [activeCenter, setActiveCenter] =
    useState<"SETUP" | "REPORT" | null>(null);

  const load = useCallback(
    async () => {
      if (!firmId) {
        setError(
          "DORA firma ID bulunamadı."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          firmResponse,
          riskResponse,
          riskTeamResponse,
        ] =
          await Promise.all([
            fetch(
              `/api/dora/firms?id=${encodeURIComponent(
                firmId
              )}`,
              {
                cache: "no-store",
              }
            ),

            fetch(
              `/api/dora/risks?firmId=${encodeURIComponent(
                firmId
              )}`,
              {
                cache: "no-store",
              }
            ),

            fetch(
              `/api/dora/risk-team?firmId=${encodeURIComponent(
                firmId
              )}`,
              {
                cache: "no-store",
              }
            ),
          ]);

        const json =
          (await firmResponse.json()) as DoraFirmApiResponse;

        if (
          !firmResponse.ok ||
          json.success === false
        ) {
          throw new Error(
            json.error ||
              "DORA firma bilgileri alınamadı."
          );
        }

        setFirm(
          json.firm ?? null
        );

        if (riskResponse.ok) {
          const riskJson =
            await riskResponse.json();

          setRiskCount(
            Array.isArray(riskJson.risks)
              ? riskJson.risks.length
              : 0
          );
        } else {
          setRiskCount(0);
        }

        if (riskTeamResponse.ok) {
          const riskTeamJson =
            await riskTeamResponse.json();

          setRiskTeamCount(
            Array.isArray(
              riskTeamJson.members
            )
              ? riskTeamJson.members.length
              : 0
          );
        } else {
          setRiskTeamCount(0);
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "DORA firma bilgileri alınamadı."
        );
      } finally {
        setLoading(false);
      }
    },
    [firmId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const setupScore =
    useMemo(
      () =>
        scoreValue(
          firm?.setup_score
        ),
      [firm]
    );

  const employeeCount =
    Number(
      firm?.employee_count ?? 0
    );

  const setupItems = useMemo(() => {
    if (!firm) return [];

    return [
      {
        title: "Firma ünvanı",
        detail: "DORA çalışma alanının firma kimliği.",
        complete: Boolean(value(firm.firm_name)),
        action: "Firma profilinde tamamla",
      },
      {
        title: "SGK işyeri sicil numarası",
        detail: "İşyeri kayıt ve doküman çıktılarında kullanılacak.",
        complete: Boolean(value(firm.sgk_no)),
        action: "Firma profilinde tamamla",
      },
      {
        title: "Vergi / kimlik bilgileri",
        detail: "Vergi numarası ve vergi dairesi bilgileri.",
        complete: Boolean(value(firm.tax_no) && value(firm.tax_office)),
        action: "Firma profilinde tamamla",
      },
      {
        title: "NACE kodu ve sektör",
        detail: "Kurulum analizinin faaliyet alanı temelidir.",
        complete: Boolean(value(firm.nace_code) && value(firm.sector)),
        action: "Firma profilinde tamamla",
      },
      {
        title: "Tehlike sınıfı",
        detail: "İSG gereklilikleri için temel sınıflandırma.",
        complete: Boolean(value(firm.danger_class)),
        action: "Firma profilinde tamamla",
      },
      {
        title: "Çalışan sayısı",
        detail: "Kurul, ekip ve eğitim yükümlülüklerinde kullanılır.",
        complete: Number(firm.employee_count ?? 0) > 0,
        action: "Çalışan bilgilerini tamamla",
      },
      {
        title: "Firma iletişim bilgileri",
        detail: "Adres, telefon ve e-posta bilgilerinin bulunması önerilir.",
        complete: Boolean(value(firm.address) && value(firm.phone) && value(firm.email)),
        action: "Firma profilinde tamamla",
      },
      {
        title: "Firma yetkilisi",
        detail: "Kurumsal doküman ve onay süreçlerinde kullanılacak.",
        complete: Boolean(value(firm.authorized_person)),
        action: "Yetkili bilgisini tamamla",
      },
      {
        title: "DORA çalışan havuzu",
        detail: "Eğitim, kurul, risk ekibi ve destek ekipleri için çalışan kaydı.",
        complete: employeeCount > 0,
        action: "Çalışanları yönet",
        route: `/admin/dora/${firmId}/employees`,
      },
      {
        title: "Risk değerlendirme ekibi",
        detail: "Fine Kinney risk sürecinde görev alacak ekip.",
        complete: riskTeamCount > 0,
        action: "Risk ekibini yönet",
        route: `/admin/dora/${firmId}/risk-team`,
      },
      {
        title: "Fine Kinney risk kayıtları",
        detail: "DORA'nın bağımsız risk değerlendirmesi.",
        complete: riskCount > 0,
        action: "Risk merkezine gir",
        route: `/admin/dora/${firmId}/risks`,
      },
    ];
  }, [firm, employeeCount, riskTeamCount, riskCount, firmId]);

  const completedSetupItems =
    setupItems.filter((item) => item.complete).length;

  const calculatedSetupPercent =
    setupItems.length > 0
      ? Math.round(
          (completedSetupItems / setupItems.length) * 100
        )
      : 0;

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          DORA çalışma alanı
          yükleniyor...
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (error || !firm) {
    return (
      <main className="page">
        <div className="topbar">
          <button
            className="back"
            onClick={() =>
              router.push(
                "/admin/dora"
              )
            }
          >
            ← DORA
          </button>
        </div>

        <div className="error">
          {error ||
            "DORA firması bulunamadı."}
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
            router.push(
              "/admin/dora"
            )
          }
        >
          ← DORA Firmaları
        </button>

        <button
          className="refresh"
          onClick={() =>
            void load()
          }
        >
          Yenile
        </button>
      </div>

      <section className="hero">
        <div className="heroText">
          <div className="eyebrow">
            DORA • BAĞIMSIZ İSG
            ÇALIŞMA ALANI
          </div>

          <h1>
            {firm.firm_name}
          </h1>

          <p>
            Hızlı İSG kurulumu,
            bağımsız çalışan havuzu,
            doküman üretimi, Fine Kinney
            risk, DORA denetimleri
            ve raporlar.
          </p>

          <div className="heroMeta">
            <span>
              {dangerClassLabel(
                firm.danger_class
              )}
            </span>

            <span>
              {firm.sector ||
                "Sektör belirtilmemiş"}
            </span>

            <span>
              NACE:{" "}
              {firm.nace_code || "-"}
            </span>
          </div>
        </div>

        <div className="heroScore">
          <div className="score">
            %{setupScore}
          </div>

          <strong>
            Kurulum
          </strong>

          <span>
            {statusLabel(
              firm.setup_status
            )}
          </span>
        </div>
      </section>

      <section className="kpis">
        <Kpi
          title="Firma"
          value="1"
          detail="Aktif DORA çalışma alanı"
        />

        <Kpi
          title="Çalışan"
          value={
            Number.isFinite(
              employeeCount
            )
              ? employeeCount
              : 0
          }
          detail="DORA firma profilindeki sayı"
        />

        <Kpi
          title="Risk"
          value={riskCount}
          detail="DORA Fine Kinney kayıtları"
        />

        <Kpi
          title="Kurulum"
          value={`%${setupScore}`}
          detail="DORA kurulum skoru"
        />
      </section>

      <section className="grid">
        <article className="card">
          <div className="cardHead">
            <div>
              <div className="sectionEyebrow">
                KURULUM
              </div>

              <h2>
                DORA Kurulum Yol Haritası
              </h2>
            </div>

            <span className="badge">
              %{setupScore}
            </span>
          </div>

          <p>
            Firma bilgilerini analiz
            ederek eksik, kritik ve
            tamamlanan kurulum
            adımlarını yönetecek.
          </p>

          <Progress
            value={setupScore}
          />

          <button
            className="primary"
            onClick={() =>
              setActiveCenter(
                activeCenter === "SETUP"
                  ? null
                  : "SETUP"
              )
            }
          >
            {activeCenter === "SETUP"
              ? "Kurulumu Kapat"
              : "Kurulumu Yönet"}
          </button>
        </article>

        <article className="card">
          <div className="cardHead">
            <div>
              <div className="sectionEyebrow">
                DOKÜMAN
              </div>

              <h2>
                Hızlı Doküman Merkezi
              </h2>
            </div>

            <span className="badge neutral">
              DORA
            </span>
          </div>

          <p>
            İSG politikası, acil
            durum planı, yıllık
            eğitim planı, destek
            ekipleri ve diğer DORA
            belgeleri.
          </p>

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
        </article>

        <article className="card">
          <div className="cardHead">
            <div>
              <div className="sectionEyebrow">
                ÇALIŞAN
              </div>

              <h2>
                DORA Çalışanları
              </h2>
            </div>

            <span className="badge neutral">
              {employeeCount || 0}
            </span>
          </div>

          <p>
            Kurul, destek ekibi,
            eğitim, KKD ve diğer
            DORA belgelerinde
            kullanılacak bağımsız
            çalışan havuzu.
          </p>

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
        </article>

        <article className="card">
          <div className="cardHead">
            <div>
              <div className="sectionEyebrow">
                RİSK
              </div>

              <h2>
                DORA Fine Kinney Risk Merkezi
              </h2>
            </div>

            <span className="badge neutral">
              {riskCount}
            </span>
          </div>

          <p>
            Ana D-SEC Risk
            modülünden tamamen
            bağımsız Fine Kinney risk
            değerlendirmesi.
          </p>

          <button
            className="primary"
            onClick={() =>
              router.push(
                `/admin/dora/${firmId}/risks`
              )
            }
          >
            Risk Merkezine Gir
          </button>
        </article>

        <article className="card">
          <div className="cardHead">
            <div>
              <div className="sectionEyebrow">
                RİSK EKİBİ
              </div>

              <h2>
                Risk Değerlendirme Ekibi
              </h2>
            </div>

            <span className="badge neutral">
              {riskTeamCount}
            </span>
          </div>

          <p>
            DORA Fine Kinney risk
            değerlendirmesinde görev alan
            işveren/vekili, İSG uzmanı,
            işyeri hekimi, çalışan
            temsilcisi ve diğer ekip
            üyelerini bağımsız olarak yönet.
          </p>

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
        </article>

        <article className="card">
          <div className="cardHead">
            <div>
              <div className="sectionEyebrow">
                DENETİM
              </div>

              <h2>
                DORA Denetim Merkezi
              </h2>
            </div>

            <span className="badge neutral">
              DORA
            </span>
          </div>

          <p>
            DORA&apos;nın kendi
            şablonları, soruları,
            bulguları, fotoğrafları
            ve raporları.
          </p>

          <button
            className="primary"
            onClick={() =>
              router.push(
                `/admin/dora/${firmId}/audits`
              )
            }
          >
            Denetim Merkezi
          </button>
        </article>

        <article className="card">
          <div className="cardHead">
            <div>
              <div className="sectionEyebrow">
                RAPOR
              </div>

              <h2>
                DORA Rapor Merkezi
              </h2>
            </div>

            <span className="badge neutral">
              PDF
            </span>
          </div>

          <p>
            Kurulum, risk, denetim
            ve doküman çıktılarının
            bağımsız rapor merkezi.
          </p>

          <button
            className="primary"
            onClick={() =>
              setActiveCenter(
                activeCenter === "REPORT"
                  ? null
                  : "REPORT"
              )
            }
          >
            {activeCenter === "REPORT"
              ? "Raporları Kapat"
              : "Raporları Aç"}
          </button>
        </article>
      </section>

      {activeCenter === "SETUP" && (
        <section className="centerPanel">
          <div className="centerHeader">
            <div>
              <div className="sectionEyebrow">
                DORA KURULUM MERKEZİ
              </div>
              <h2>Kurulum Yol Haritası</h2>
              <p>
                Firma profilini, çalışan havuzunu, risk ekibini ve
                temel DORA kayıtlarını tek ekrandan kontrol edin.
              </p>
            </div>

            <div className="centerScore">
              <strong>%{calculatedSetupPercent}</strong>
              <span>
                {completedSetupItems}/{setupItems.length} adım tamam
              </span>
            </div>
          </div>

          <Progress value={calculatedSetupPercent} />

          <div className="setupList">
            {setupItems.map((item) => (
              <article
                key={item.title}
                className={`setupItem ${
                  item.complete ? "done" : "pending"
                }`}
              >
                <div className="setupStatus">
                  {item.complete ? "✓" : "!"}
                </div>

                <div className="setupBody">
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>

                <div className="setupAction">
                  <span>
                    {item.complete
                      ? "Tamamlandı"
                      : "Eksik / Kontrol Et"}
                  </span>

                  {item.route ? (
                    <button
                      className="secondary"
                      onClick={() =>
                        router.push(item.route!)
                      }
                    >
                      {item.action}
                    </button>
                  ) : (
                    <button
                      className="secondary"
                      onClick={() => {
                        const profile =
                          document.getElementById(
                            "dora-firma-profili"
                          );
                        profile?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      {item.action}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="centerQuickActions">
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
              Doküman Merkezini Aç
            </button>
          </div>
        </section>
      )}

      {activeCenter === "REPORT" && (
        <section className="centerPanel reportCenter">
          <div className="centerHeader">
            <div>
              <div className="sectionEyebrow">
                DORA RAPOR MERKEZİ
              </div>
              <h2>Firma Rapor ve Çıktı Merkezi</h2>
              <p>
                Kurulum, çalışan, risk, denetim ve doküman süreçlerini
                firma bazında tek merkezden görüntüleyin.
              </p>
            </div>

            <span className="reportBadge">
              {firm.firm_name}
            </span>
          </div>

          <div className="reportKpis">
            <Kpi
              title="Kurulum"
              value={`%${calculatedSetupPercent}`}
              detail={`${completedSetupItems}/${setupItems.length} kurulum adımı`}
            />
            <Kpi
              title="Çalışan"
              value={employeeCount || 0}
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
          </div>

          <div className="reportGrid">
            <article className="reportCard">
              <div>
                <span>KURULUM RAPORU</span>
                <h3>Kurulum Durum Özeti</h3>
                <p>
                  Tamamlanan ve eksik kurulum adımlarını,
                  firma kimlik bilgilerini ve kurulum skorunu gösterir.
                </p>
              </div>
              <button
                className="secondary"
                onClick={() =>
                  setActiveCenter("SETUP")
                }
              >
                Kurulum Raporunu Aç
              </button>
            </article>

            <article className="reportCard">
              <div>
                <span>RİSK RAPORU</span>
                <h3>Fine Kinney Risk Raporları</h3>
                <p>
                  Risk kayıtları, skorlar, aksiyonlar ve mevcut
                  risk merkezi raporlama araçlarına erişin.
                </p>
              </div>
              <button
                className="secondary"
                onClick={() =>
                  router.push(
                    `/admin/dora/${firmId}/risks`
                  )
                }
              >
                Risk Raporlarını Aç
              </button>
            </article>

            <article className="reportCard">
              <div>
                <span>DENETİM RAPORU</span>
                <h3>DORA Denetim Raporları</h3>
                <p>
                  Denetimler, cevaplar, bulgular, DÖF kayıtları ve
                  denetim raporlarına ulaşın.
                </p>
              </div>
              <button
                className="secondary"
                onClick={() =>
                  router.push(
                    `/admin/dora/${firmId}/audits`
                  )
                }
              >
                Denetim Raporlarını Aç
              </button>
            </article>

            <article className="reportCard">
              <div>
                <span>DOKÜMAN RAPORU</span>
                <h3>Doküman ve Evrak Çıktıları</h3>
                <p>
                  DORA tarafından üretilen kurumsal dokümanlara ve
                  hazır evrak paketlerine erişin.
                </p>
              </div>
              <button
                className="secondary"
                onClick={() =>
                  router.push(
                    `/admin/dora/${firmId}/documents`
                  )
                }
              >
                Dokümanları Aç
              </button>
            </article>
          </div>

          <div className="reportActions">
            <button
              className="primary"
              onClick={() => window.print()}
            >
              Firma Özetini Yazdır / PDF
            </button>

            <button
              className="secondary"
              onClick={() => void load()}
            >
              Rapor Verilerini Yenile
            </button>
          </div>
        </section>
      )}

      <section
        id="dora-firma-profili"
        className="firmCard"
      >
        <div className="sectionTitle">
          <div>
            <div className="sectionEyebrow">
              FİRMA PROFİLİ
            </div>

            <h2>
              Firma Kurulum Bilgileri
            </h2>

            <p>
              Yalnızca bu DORA
              çalışma alanında
              kullanılan bilgiler.
            </p>
          </div>
        </div>

        <div className="infoGrid">
          <Info
            label="Firma Ünvanı"
            value={firm.firm_name}
          />

          <Info
            label="SGK Sicil No"
            value={firm.sgk_no || "-"}
          />

          <Info
            label="Vergi No"
            value={firm.tax_no || "-"}
          />

          <Info
            label="Vergi Dairesi"
            value={firm.tax_office || "-"}
          />

          <Info
            label="MERSİS"
            value={firm.mersis_no || "-"}
          />

          <Info
            label="NACE"
            value={firm.nace_code || "-"}
          />

          <Info
            label="Sektör"
            value={firm.sector || "-"}
          />

          <Info
            label="Tehlike Sınıfı"
            value={dangerClassLabel(
              firm.danger_class
            )}
          />

          <Info
            label="Çalışan Sayısı"
            value={String(
              firm.employee_count ?? 0
            )}
          />

          <Info
            label="Yetkili"
            value={
              firm.authorized_person ||
              "-"
            }
          />

          <Info
            label="Telefon"
            value={firm.phone || "-"}
          />

          <Info
            label="E-posta"
            value={firm.email || "-"}
          />
        </div>

        {firm.address && (
          <div className="wideInfo">
            <span>Adres</span>
            <strong>
              {firm.address}
            </strong>
          </div>
        )}

        {firm.note && (
          <div className="wideInfo">
            <span>Not</span>
            <strong>
              {firm.note}
            </strong>
          </div>
        )}
      </section>

      <section className="independence">
        <div className="independenceMark">
          D
        </div>

        <div>
          <strong>
            DORA bağımsız çalışma
            alanıdır.
          </strong>

          <p>
            Bu firma içindeki çalışan,
            doküman, risk, denetim ve
            rapor kayıtları yalnızca
            DORA tablolarında tutulur.
            D-SEC&apos;in diğer
            modüllerine otomatik kayıt
            veya veri aktarımı yapılmaz.
          </p>
        </div>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

function Kpi({
  title,
  value: kpiValue,
  detail,
  muted = false,
}: {
  title: string;
  value: string | number;
  detail: string;
  muted?: boolean;
}) {
  return (
    <article
      className={`kpi ${
        muted ? "muted" : ""
      }`}
    >
      <span>{title}</span>
      <strong>{kpiValue}</strong>
      <small>{detail}</small>
    </article>
  );
}

function Info({
  label,
  value: infoValue,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>{infoValue}</strong>
    </div>
  );
}

function Progress({
  value: progressValue,
}: {
  value: number;
}) {
  return (
    <div className="progressWrap">
      <div className="progressHead">
        <span>
          Tamamlanma
        </span>

        <strong>
          %{progressValue}
        </strong>
      </div>

      <div className="progressTrack">
        <div
          className="progressValue"
          style={{
            width: `${progressValue}%`,
          }}
        />
      </div>
    </div>
  );
}

const styles = `
  :global(*) {
    box-sizing: border-box;
  }

  .page {
    min-height: 100vh;
    padding: 24px;
    color: #172033;
    background:
      linear-gradient(
        180deg,
        #f7f8fb 0%,
        #ffffff 430px
      );
  }

  button {
    font: inherit;
  }

  .topbar {
    max-width: 1450px;
    margin: 0 auto 14px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .back,
  .refresh {
    border: 1px solid #d0d5dd;
    background: #ffffff;
    color: #344054;
    padding: 10px 14px;
    border-radius: 12px;
    font-weight: 750;
    cursor: pointer;
  }

  .hero {
    max-width: 1450px;
    margin: 0 auto;
    min-height: 270px;
    padding: 32px;
    border-radius: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    color: #ffffff;
    background:
      radial-gradient(
        circle at 82% 20%,
        rgba(255,255,255,0.18),
        transparent 28%
      ),
      linear-gradient(
        120deg,
        #50141f 0%,
        #7a2633 48%,
        #d0602c 100%
      );
    box-shadow:
      0 22px 50px
      rgba(73,20,31,0.17);
  }

  .heroText {
    max-width: 900px;
  }

  .eyebrow,
  .sectionEyebrow {
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0.14em;
  }

  .eyebrow {
    color: rgba(255,255,255,0.75);
    margin-bottom: 10px;
  }

  .sectionEyebrow {
    color: #8c3543;
    margin-bottom: 7px;
  }

  .hero h1 {
    margin: 0;
    font-size: clamp(34px, 5vw, 58px);
    letter-spacing: -0.04em;
    line-height: 1.02;
  }

  .hero p {
    margin: 15px 0 0;
    max-width: 760px;
    color: rgba(255,255,255,0.86);
    line-height: 1.6;
    font-size: 16px;
  }

  .heroMeta {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
    margin-top: 19px;
  }

  .heroMeta span {
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.11);
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 750;
  }

  .heroScore {
    width: 180px;
    height: 180px;
    flex: 0 0 auto;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.94);
    color: #70202d;
    box-shadow:
      0 20px 45px
      rgba(41,5,12,0.22);
  }

  .score {
    font-size: 38px;
    font-weight: 950;
  }

  .heroScore strong {
    margin-top: 2px;
  }

  .heroScore span {
    margin-top: 3px;
    font-size: 11px;
    color: #8f6670;
  }

  .kpis {
    max-width: 1400px;
    margin: -28px auto 0;
    position: relative;
    z-index: 3;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 13px;
  }

  .kpi {
    min-height: 120px;
    padding: 17px;
    border-radius: 19px;
    background: #ffffff;
    border: 1px solid #eaecf0;
    box-shadow:
      0 14px 34px
      rgba(16,24,40,0.07);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .kpi span {
    color: #667085;
    font-size: 12px;
    font-weight: 800;
  }

  .kpi strong {
    color: #531823;
    font-size: 32px;
    margin: 7px 0;
  }

  .kpi small {
    color: #98a2b3;
  }

  .kpi.muted strong {
    color: #98a2b3;
  }

  .grid {
    max-width: 1450px;
    margin: 27px auto 0;
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 15px;
  }

  .card,
  .firmCard {
    background: #ffffff;
    border: 1px solid #eaecf0;
    border-radius: 21px;
    padding: 19px;
  }

  .card {
    min-height: 245px;
    display: flex;
    flex-direction: column;
  }

  .cardHead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .card h2,
  .firmCard h2 {
    margin: 0;
    font-size: 19px;
    color: #172033;
  }

  .card p {
    color: #667085;
    line-height: 1.55;
    font-size: 13px;
    flex: 1;
  }

  .badge {
    padding: 6px 9px;
    border-radius: 999px;
    background: #fce7ea;
    color: #7a2633;
    font-size: 11px;
    font-weight: 900;
  }

  .badge.neutral {
    background: #f2f4f7;
    color: #667085;
  }

  .primary {
    margin-top: 14px;
    border: 0;
    background: #7a2633;
    color: #ffffff;
    border-radius: 12px;
    padding: 11px 14px;
    font-weight: 850;
    cursor: pointer;
  }

  .progressWrap {
    margin-top: 10px;
  }

  .progressHead {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #667085;
    font-weight: 750;
  }

  .progressTrack {
    margin-top: 7px;
    height: 9px;
    border-radius: 999px;
    overflow: hidden;
    background: #f2f4f7;
  }

  .progressValue {
    height: 100%;
    border-radius: inherit;
    background:
      linear-gradient(
        90deg,
        #7a2633,
        #d0602c
      );
  }

  .firmCard {
    max-width: 1450px;
    margin: 22px auto 0;
  }

  .sectionTitle {
    margin-bottom: 16px;
  }

  .sectionTitle p {
    margin: 7px 0 0;
    color: #667085;
  }

  .infoGrid {
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .info,
  .wideInfo {
    background: #f9fafb;
    border: 1px solid #f0f1f3;
    border-radius: 13px;
    padding: 11px;
  }

  .info {
    min-height: 72px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .info span,
  .wideInfo span {
    color: #98a2b3;
    font-size: 11px;
    font-weight: 800;
  }

  .info strong,
  .wideInfo strong {
    color: #344054;
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .wideInfo {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .independence {
    max-width: 1450px;
    margin: 22px auto 34px;
    border-radius: 19px;
    padding: 18px;
    display: flex;
    gap: 13px;
    background: #fff8f5;
    border: 1px solid #f8d9ce;
  }

  .independenceMark {
    width: 43px;
    height: 43px;
    border-radius: 13px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    background: #7a2633;
    color: #ffffff;
    font-weight: 950;
  }

  .independence strong {
    color: #6e1f2c;
  }

  .independence p {
    margin: 5px 0 0;
    color: #80545c;
    font-size: 13px;
    line-height: 1.55;
  }

  .loading,
  .error {
    max-width: 900px;
    margin: 60px auto;
    padding: 20px;
    border-radius: 16px;
  }

  .loading {
    background: #ffffff;
    border: 1px solid #eaecf0;
    color: #667085;
    text-align: center;
  }

  .error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    font-weight: 700;
  }

  @media (
    max-width: 1100px
  ) {
    .grid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .infoGrid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (
    max-width: 800px
  ) {
    .page {
      padding: 14px;
    }

    .hero {
      min-height: auto;
      padding: 23px 19px;
      border-radius: 22px;
    }

    .heroScore {
      display: none;
    }

    .kpis {
      margin-top: 14px;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .grid,
    .infoGrid {
      grid-template-columns: 1fr;
    }
  }
  .centerPanel {
    max-width: 1450px;
    margin: 18px auto 0;
    padding: 24px;
    border: 1px solid #e4e7ec;
    border-radius: 24px;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(16,24,40,0.07);
  }

  .centerHeader {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    align-items: flex-start;
    margin-bottom: 18px;
  }

  .centerHeader h2 {
    margin: 4px 0 8px;
    font-size: 28px;
    letter-spacing: -0.025em;
  }

  .centerHeader p {
    margin: 0;
    color: #667085;
    line-height: 1.6;
    max-width: 760px;
  }

  .centerScore {
    min-width: 150px;
    padding: 16px 18px;
    border-radius: 18px;
    background: #fff6f2;
    border: 1px solid #f4d7c9;
    text-align: center;
  }

  .centerScore strong {
    display: block;
    color: #7a2633;
    font-size: 32px;
    line-height: 1;
  }

  .centerScore span {
    display: block;
    margin-top: 7px;
    color: #667085;
    font-size: 12px;
    font-weight: 800;
  }

  .setupList {
    display: grid;
    gap: 10px;
    margin-top: 20px;
  }

  .setupItem {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    padding: 14px;
    border: 1px solid #e4e7ec;
    border-radius: 16px;
    background: #ffffff;
  }

  .setupItem.done {
    background: #f8fffb;
    border-color: #cdebd8;
  }

  .setupItem.pending {
    background: #fffaf8;
    border-color: #f4d4c6;
  }

  .setupStatus {
    width: 36px;
    height: 36px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-weight: 950;
    background: #f2f4f7;
    color: #667085;
  }

  .setupItem.done .setupStatus {
    background: #dcfae6;
    color: #067647;
  }

  .setupItem.pending .setupStatus {
    background: #ffead5;
    color: #b54708;
  }

  .setupBody strong {
    display: block;
    color: #101828;
  }

  .setupBody p {
    margin: 4px 0 0;
    color: #667085;
    font-size: 13px;
    line-height: 1.5;
  }

  .setupAction {
    min-width: 190px;
    text-align: right;
  }

  .setupAction > span {
    display: block;
    margin-bottom: 7px;
    color: #667085;
    font-size: 11px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: .04em;
  }

  .secondary {
    border: 1px solid #d0d5dd;
    background: #ffffff;
    color: #344054;
    padding: 9px 12px;
    border-radius: 11px;
    font-weight: 800;
    cursor: pointer;
  }

  .secondary:hover {
    background: #f9fafb;
  }

  .centerQuickActions,
  .reportActions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 18px;
  }

  .reportBadge {
    max-width: 320px;
    padding: 9px 12px;
    border-radius: 999px;
    background: #f2f4f7;
    color: #475467;
    font-size: 12px;
    font-weight: 850;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .reportKpis {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-top: 18px;
  }

  .reportGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-top: 18px;
  }

  .reportCard {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 210px;
    padding: 20px;
    border: 1px solid #e4e7ec;
    border-radius: 18px;
    background: #fcfcfd;
  }

  .reportCard span {
    color: #8c3543;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: .12em;
  }

  .reportCard h3 {
    margin: 8px 0;
    font-size: 20px;
  }

  .reportCard p {
    margin: 0 0 18px;
    color: #667085;
    line-height: 1.55;
  }

  @media (max-width: 900px) {
    .centerHeader {
      flex-direction: column;
    }

    .centerScore {
      width: 100%;
    }

    .setupItem {
      grid-template-columns: 40px 1fr;
    }

    .setupAction {
      grid-column: 1 / -1;
      text-align: left;
      min-width: 0;
    }

    .reportKpis,
    .reportGrid {
      grid-template-columns: 1fr;
    }
  }

  @media print {
    .topbar,
    .grid,
    .independence,
    .centerQuickActions,
    .reportActions,
    button {
      display: none !important;
    }

    .page {
      padding: 0;
      background: #ffffff;
    }

    .hero,
    .centerPanel,
    .firmCard {
      box-shadow: none !important;
      break-inside: avoid;
    }

    .centerPanel {
      display: block !important;
    }
  }

`;