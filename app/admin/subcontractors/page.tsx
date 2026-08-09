"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  FileWarning,
  HardHat,
  KeyRound,
  Plus,
  RefreshCw,
  ShieldAlert,
  UserRoundCheck,
  Users,
} from "lucide-react";

type CompanyItem = {
  id: string;
  name: string;
};

type SubCompany = {
  id: string;
  company_name: string;
  authorized_person: string;
  phone: string;
  email: string;
  tax_no: string;
  work_scope: string;
  application_status: string;
  approval_status: string;
  is_active: boolean;
};

type ApiData = {
  success: boolean;
  summary: {
    subcontractors: number;
    activeSubcontractors: number;
    passiveSubcontractors: number;
    employees: number;
    inside: number;
    blocked: number;
    missingCompanyDocs: number;
    expiredCompanyDocs: number;
    activePermits: number;
    expiredPermits: number;
  };
  companies: SubCompany[];
  error?: string;
};

const emptySummary = {
  subcontractors: 0,
  activeSubcontractors: 0,
  passiveSubcontractors: 0,
  employees: 0,
  inside: 0,
  blocked: 0,
  missingCompanyDocs: 0,
  expiredCompanyDocs: 0,
  activePermits: 0,
  expiredPermits: 0,
};

export default function SubcontractorsPage() {
    const router = useRouter();
  const [companies, setCompanies] =
    useState<CompanyItem[]>([]);

  const [firmId, setFirmId] =
    useState("");

  const [data, setData] =
    useState<ApiData>({
      success: true,
      summary: emptySummary,
      companies: [],
    });

  const [loading, setLoading] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [name, setName] =
    useState("");

  const [authorized, setAuthorized] =
    useState("");

  const [scope, setScope] =
    useState("");

  const [error, setError] =
    useState("");

  const selectedFirm =
    useMemo(
      () =>
        companies.find(
          (c) => c.id === firmId
        ) || null,
      [companies, firmId]
    );

  useEffect(() => {
    (async () => {
      try {
        const res =
          await fetch(
            "/api/admin/companies",
            {
              cache: "no-store",
            }
          );

        const json =
          await res.json();

        const list =
          (json?.data || [])
            .map((c: any) => ({
              id: String(
                c.id ?? ""
              ),

              name: String(
                c.name ??
                  c.title ??
                  c.company_name ??
                  "Firma"
              ),
            }))
            .filter(
              (c: CompanyItem) =>
                c.id
            );

        setCompanies(list);

        if (list.length > 0) {
          setFirmId(
            (old) =>
              old ||
              list[0].id
          );
        }
      } catch {
        setError(
          "Firma listesi alınamadı."
        );
      }
    })();
  }, []);

  const load =
    useCallback(
      async () => {
        if (!firmId) return;

        setLoading(true);
        setError("");

        try {
          const res =
            await fetch(
              `/api/admin/subcontractors?firmId=${encodeURIComponent(
                firmId
              )}`,
              {
                cache:
                  "no-store",
              }
            );

          const json =
            await res.json();

          if (
            !res.ok ||
            !json.success
          ) {
            throw new Error(
              json.error ||
                "Taşeron verisi alınamadı."
            );
          }

          setData(json);
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : "Taşeron verisi alınamadı."
          );
        } finally {
          setLoading(false);
        }
      },
      [firmId]
    );

  useEffect(() => {
    load();
  }, [load]);

  async function createCompany() {
    if (
      !firmId ||
      !name.trim()
    ) {
      return;
    }

    const res =
      await fetch(
        "/api/admin/subcontractors",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              firmId,

              companyName:
                name,

              authorizedPerson:
                authorized,

              workScope:
                scope,
            }),
        }
      );

    const json =
      await res.json();

    if (
      !res.ok ||
      !json.success
    ) {
      setError(
        json.error ||
          "Taşeron firma eklenemedi."
      );

      return;
    }

    setName("");
    setAuthorized("");
    setScope("");
    setShowForm(false);

    await load();
  }

  const s =
    data.summary ||
    emptySummary;

  const metrics = [
    [
      "Taşeron",
      s.subcontractors,
      Building2,
    ],

    [
      "Çalışan",
      s.employees,
      Users,
    ],

    [
      "Sahada",
      s.inside,
      UserRoundCheck,
    ],

    [
      "Yasaklı",
      s.blocked,
      ShieldAlert,
    ],

    [
      "Eksik Evrak",
      s.missingCompanyDocs,
      FileWarning,
    ],

    [
      "Süresi Dolan",
      s.expiredCompanyDocs,
      FileWarning,
    ],

    [
      "Aktif İzin",
      s.activePermits,
      BadgeCheck,
    ],

    [
      "Dolan İzin",
      s.expiredPermits,
      KeyRound,
    ],
  ] as const;

  return (
    <main className="page">

      <section className="toolbar">

        <div>
          <small>
            Panel
          </small>

          <h1>
            Taşeron Yönetimi
          </h1>

          <p>
            Çalışan, evrak,
            izin ve QR saha
            kontrol merkezi
          </p>
        </div>

        <div className="actions">

          <select
            value={firmId}
            onChange={(e) =>
              setFirmId(
                e.target.value
              )
            }
          >
            {companies.map(
              (c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}
                </option>
              )
            )}
          </select>

          <button
            className="light"
            onClick={load}
          >
            <RefreshCw
              size={17}
            />

            {loading
              ? "Yükleniyor"
              : "Yenile"}
          </button>
        </div>
      </section>

      <section className="hero">

        <span className="badge">
          <HardHat
            size={17}
          />

          D-SEC Taşeron Yönetimi
        </span>

        <h2>
          Taşeron Firma ve
          Saha Uygunluk Merkezi
        </h2>

        <p>
          {selectedFirm?.name ||
            "Seçili firma"}{" "}
          için taşeron firma,
          çalışan, evrak, iş
          izni ve saha
          girişlerini tek
          merkezden yönetin.
        </p>

        <div className="heroKpis">

          <div>
            <span>
              Firma
            </span>

            <strong>
              {selectedFirm?.name ||
                "-"}
            </strong>
          </div>

          <div>
            <span>
              Taşeron
            </span>

            <strong>
              {s.subcontractors}
            </strong>
          </div>

          <div>
            <span>
              Çalışan
            </span>

            <strong>
              {s.employees}
            </strong>
          </div>

          <div>
            <span>
              Sahada
            </span>

            <strong>
              {s.inside}
            </strong>
          </div>
        </div>
      </section>

      {error ? (
        <div className="error">
          {error}
        </div>
      ) : null}

      <section className="sectionCard">

        <div className="sectionHead">

          <div>
            <h3>
              Kontrol Özeti
            </h3>

            <p>
              App ekranıyla aynı
              ana göstergeler
            </p>
          </div>

          <button
            className="primary"
            onClick={() =>
              setShowForm(true)
            }
          >
            <Plus
              size={18}
            />

            Yeni Taşeron Firma
          </button>
        </div>

        <div className="metricGrid">

          {metrics.map(
            ([
              label,
              value,
              Icon,
            ]) => (
              <div
                className="metric"
                key={label}
              >
                <Icon
                  size={23}
                />

                <span>
                  {label}
                </span>

                <strong>
                  {value}
                </strong>
              </div>
            )
          )}
        </div>
      </section>

      <section className="sectionCard">

        <div className="sectionHead">

          <div>
            <h3>
              Taşeron Firmalar
            </h3>

            <p>
              Aktif{" "}
              {
                s.activeSubcontractors
              }{" "}
              • Pasif{" "}
              {
                s.passiveSubcontractors
              }
            </p>
          </div>
        </div>

        {data.companies.length ===
        0 ? (
          <div className="empty">
            Henüz taşeron firma
            yok.
          </div>
        ) : (
          <div className="companyGrid">

            {data.companies.map(
              (c) => (
                <article
                  className="company"
                  key={c.id}
                >

                  <div className="companyTop">

                    <div className="companyIcon">
                      <Building2
                        size={22}
                      />
                    </div>

                    <span
                      className={
                        c.is_active
                          ? "active"
                          : "passive"
                      }
                    >
                      {c.is_active
                        ? "Aktif"
                        : "Pasif"}
                    </span>
                  </div>

                  <h4>
                    {
                      c.company_name
                    }
                  </h4>

                  <p>
                    {c.work_scope ||
                      "Faaliyet bilgisi girilmedi"}
                  </p>

                  <div className="meta">

                    <span>
                      Yetkili:{" "}
                      {c.authorized_person ||
                        "-"}
                    </span>

                    <span>
                      Onay:{" "}
                      {
                        c.approval_status
                      }
                    </span>

                    <span>
                      Başvuru:{" "}
                      {
                        c.application_status
                      }
                    </span>
                  </div>

                  <button
  className="outline"
  onClick={() =>
    router.push(
      `/panel/subcontractors/${c.id}?firmId=${encodeURIComponent(
        firmId
      )}`
    )
  }
>
  Firmaya Gir →
</button>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {showForm ? (
        <div
          className="modalBackdrop"
          onMouseDown={() =>
            setShowForm(false)
          }
        >
          <div
            className="modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <h3>
              Yeni Taşeron Firma
            </h3>

            <label>
              Taşeron Firma Adı *

              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Yetkili Kişi

              <input
                value={authorized}
                onChange={(e) =>
                  setAuthorized(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              Faaliyet / İş Kapsamı

              <textarea
                value={scope}
                onChange={(e) =>
                  setScope(
                    e.target.value
                  )
                }
              />
            </label>

            <div className="modalActions">

              <button
                className="light"
                onClick={() =>
                  setShowForm(false)
                }
              >
                Vazgeç
              </button>

              <button
                className="primary"
                onClick={
                  createCompany
                }
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          padding: 24px;
          background: linear-gradient(
            180deg,
            #fff 0,
            #fff8f6 100%
          );
          color: #111827;
          font-family: Arial,
            Helvetica,
            sans-serif;
        }

        .toolbar {
          display: flex;
          justify-content:
            space-between;
          gap: 18px;
          align-items:
            flex-end;
          max-width: 1500px;
          margin:
            0 auto 18px;
        }

        .toolbar small {
          color: #94a3b8;
        }

        .toolbar h1 {
          font-size: 32px;
          margin: 4px 0;
        }

        .toolbar p,
        .sectionHead p {
          margin: 0;
          color: #64748b;
        }

        .actions {
          display: flex;
          gap: 10px;
        }

        .actions select,
        .light,
        .primary,
        .outline {
          min-height: 42px;
          border-radius: 12px;
          padding: 0 14px;
          font-weight: 800;
        }

        .actions select {
          border: 1px solid
            #e2e8f0;
          background: #fff;
          min-width: 260px;
        }

        .light,
        .outline {
          border: 1px solid
            #e2e8f0;
          background: #fff;
          color: #475569;
        }

        .primary {
          border: 0;
          background: #8f1630;
          color: #fff;
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .hero {
          max-width: 1500px;
          margin: auto;
          border-radius: 28px;
          padding: 34px;
          color: #fff;
          background:
            linear-gradient(
              125deg,
              #701323,
              #c72425 55%,
              #ef7d00
            );
          box-shadow:
            0 18px 50px
            rgba(
              127,
              29,
              29,
              0.16
            );
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px;
          border-radius: 999px;
          background:
            rgba(
              255,
              255,
              255,
              0.14
            );
          font-weight: 800;
        }

        .hero h2 {
          font-size: 42px;
          margin:
            20px 0 10px;
        }

        .hero p {
          font-size: 18px;
          max-width: 900px;
          line-height: 1.55;
          color:
            rgba(
              255,
              255,
              255,
              0.9
            );
        }

        .heroKpis {
          display: grid;
          grid-template-columns:
            2fr 1fr 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
        }

        .heroKpis > div {
          padding: 18px;
          border-radius: 18px;
          background:
            rgba(
              255,
              255,
              255,
              0.13
            );
        }

        .heroKpis span {
          display: block;
          font-size: 13px;
        }

        .heroKpis strong {
          display: block;
          font-size: 24px;
          margin-top: 7px;
        }

        .sectionCard {
          max-width: 1500px;
          margin:
            18px auto 0;
          padding: 22px;
          border:
            1px solid
            #eee4e4;
          border-radius: 24px;
          background: #fff;
          box-shadow:
            0 8px 26px
            rgba(
              15,
              23,
              42,
              0.04
            );
        }

        .sectionHead {
          display: flex;
          justify-content:
            space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .sectionHead h3 {
          font-size: 25px;
          margin:
            0 0 4px;
        }

        .metricGrid {
          display: grid;
          grid-template-columns:
            repeat(
              4,
              minmax(
                0,
                1fr
              )
            );
          gap: 12px;
        }

        .metric {
          min-height: 130px;
          padding: 18px;
          border-radius: 20px;
          background: #fff6f6;
          border:
            1px solid
            #f5e3e4;
        }

        .metric svg {
          color: #9f1239;
        }

        .metric span {
          display: block;
          color: #6b7280;
          margin:
            12px 0 7px;
        }

        .metric strong {
          font-size: 31px;
          color: #8f1d30;
        }

        .companyGrid {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              minmax(
                0,
                1fr
              )
            );
          gap: 14px;
        }

        .company {
          border:
            1px solid
            #ece7e7;
          border-radius: 20px;
          padding: 18px;
          background: #fff;
        }

        .companyTop {
          display: flex;
          justify-content:
            space-between;
        }

        .companyIcon {
          width: 45px;
          height: 45px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: #fff1f2;
          color: #9f1239;
        }

        .active,
        .passive {
          height: 30px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
        }

        .active {
          color: #047857;
          background: #ecfdf5;
        }

        .passive {
          color: #b91c1c;
          background: #fef2f2;
        }

        .company h4 {
          font-size: 20px;
          margin:
            15px 0 5px;
        }

        .company p {
          color: #64748b;
          min-height: 42px;
        }

        .meta {
          display: grid;
          gap: 5px;
          color: #64748b;
          font-size: 13px;
          margin:
            12px 0;
        }

        .outline {
          width: 100%;
          cursor: pointer;
        }

        .empty {
          padding: 28px;
          text-align: center;
          color: #64748b;
        }

        .error {
          max-width: 1500px;
          margin:
            15px auto 0;
          padding: 12px 15px;
          border-radius: 14px;
          background: #fef2f2;
          color: #b91c1c;
        }

        .modalBackdrop {
          position: fixed;
          inset: 0;
          background:
            rgba(
              15,
              23,
              42,
              0.5
            );
          display: grid;
          place-items: center;
          padding: 20px;
          z-index: 100;
        }

        .modal {
          width:
            min(
              560px,
              100%
            );
          background: #fff;
          border-radius: 24px;
          padding: 24px;
        }

        .modal h3 {
          margin-top: 0;
        }

        .modal label {
          display: grid;
          gap: 6px;
          font-weight: 800;
          margin-top: 13px;
        }

        .modal input,
        .modal textarea {
          width: 100%;
          border:
            1px solid
            #dbe3ec;
          border-radius: 12px;
          padding: 12px;
          font: inherit;
        }

        .modal textarea {
          min-height: 90px;
          resize: vertical;
        }

        .modalActions {
          display: flex;
          justify-content:
            flex-end;
          gap: 9px;
          margin-top: 18px;
        }

        @media (
          max-width: 900px
        ) {
          .toolbar {
            align-items:
              stretch;
            flex-direction:
              column;
          }

          .actions {
            flex-direction:
              column;
          }

          .actions select {
            min-width: 0;
          }

          .heroKpis,
          .metricGrid {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );
          }

          .companyGrid {
            grid-template-columns:
              1fr;
          }

          .hero h2 {
            font-size: 30px;
          }
        }
      `}</style>
    </main>
  );
}