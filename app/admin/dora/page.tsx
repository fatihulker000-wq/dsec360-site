"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type DoraFirm = {
  id: string;
  sync_key?: string | null;
  app_local_id?: number | null;
  owner_user_id?: string | null;

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

  is_deleted?: boolean | null;
  source?: string | null;
  created_at_millis?: number | null;
  updated_at_millis?: number | null;
};

type DoraFirmForm = {
  id: string;
  firmName: string;
  sgkNo: string;
  taxNo: string;
  taxOffice: string;
  mersisNo: string;
  naceCode: string;
  sector: string;
  dangerClass: string;
  employeeCount: string;
  address: string;
  phone: string;
  email: string;
  authorizedPerson: string;
  note: string;
  isActive: boolean;
};

type DoraFirmApiResponse = {
  success?: boolean;
  error?: string;
  firms?: DoraFirm[];
  firm?: DoraFirm;
};

const EMPTY_FORM: DoraFirmForm = {
  id: "",
  firmName: "",
  sgkNo: "",
  taxNo: "",
  taxOffice: "",
  mersisNo: "",
  naceCode: "",
  sector: "",
  dangerClass: "",
  employeeCount: "0",
  address: "",
  phone: "",
  email: "",
  authorizedPerson: "",
  note: "",
  isActive: true,
};

function value(input: unknown): string {
  return String(input ?? "").trim();
}

function statusLabel(input?: string | null): string {
  const normalized = value(input);

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
): string {
  const normalized =
    value(input).toUpperCase();

  if (normalized === "COK_TEHLIKELI") {
    return "Çok Tehlikeli";
  }

  if (normalized === "TEHLIKELI") {
    return "Tehlikeli";
  }

  if (normalized === "AZ_TEHLIKELI") {
    return "Az Tehlikeli";
  }

  return normalized
    ? statusLabel(normalized)
    : "Tehlike sınıfı girilmemiş";
}

function dangerClassTone(
  input?: string | null
): "danger" | "warning" | "safe" | "neutral" {
  const normalized =
    value(input).toUpperCase();

  if (normalized === "COK_TEHLIKELI") {
    return "danger";
  }

  if (normalized === "TEHLIKELI") {
    return "warning";
  }

  if (normalized === "AZ_TEHLIKELI") {
    return "safe";
  }

  return "neutral";
}

function normalizedSetupScore(
  score?: number | null
): number {
  const parsed = Number(score ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(parsed))
  );
}

export default function DoraPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [firms, setFirms] =
    useState<DoraFirm[]>([]);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [form, setForm] =
    useState<DoraFirmForm>(
      EMPTY_FORM
    );

  const load = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/dora/firms",
          {
            cache: "no-store",
          }
        );

        const json =
          (await response.json()) as DoraFirmApiResponse;

        if (
          !response.ok ||
          json.success === false
        ) {
          throw new Error(
            json.error ||
              "DORA firmaları alınamadı."
          );
        }

        setFirms(
          Array.isArray(json.firms)
            ? json.firms
            : []
        );
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "DORA verileri alınamadı."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load();
  }, [load]);

  const activeFirms =
    useMemo(
      () =>
        firms.filter(
          (firm) =>
            firm.is_active !== false
        ),
      [firms]
    );

  const totalEmployeeCount =
    useMemo(
      () =>
        firms.reduce(
          (sum, firm) =>
            sum +
            Math.max(
              0,
              Number(
                firm.employee_count ?? 0
              )
            ),
          0
        ),
      [firms]
    );

  const averageSetupScore =
    useMemo(() => {
      if (firms.length === 0) {
        return 0;
      }

      const total =
        firms.reduce(
          (sum, firm) =>
            sum +
            normalizedSetupScore(
              firm.setup_score
            ),
          0
        );

      return Math.round(
        total / firms.length
      );
    }, [firms]);

  /*
   * Risk sayısı henüz dora_risks endpoint'i
   * eklenmediği için bu ilk Web paketinde 0.
   * Sonraki pakette canlı değere bağlanacak.
   */
  const totalRiskCount = 0;

  function newFirm() {
    setForm({
      ...EMPTY_FORM,
    });

    setModalOpen(true);
  }

  function editFirm(
    firm: DoraFirm
  ) {
    setForm({
      id: firm.id,
      firmName:
        value(firm.firm_name),
      sgkNo:
        value(firm.sgk_no),
      taxNo:
        value(firm.tax_no),
      taxOffice:
        value(firm.tax_office),
      mersisNo:
        value(firm.mersis_no),
      naceCode:
        value(firm.nace_code),
      sector:
        value(firm.sector),
      dangerClass:
        value(
          firm.danger_class
        ).toUpperCase(),
      employeeCount:
        String(
          Math.max(
            0,
            Number(
              firm.employee_count ??
                0
            )
          )
        ),
      address:
        value(firm.address),
      phone:
        value(firm.phone),
      email:
        value(firm.email),
      authorizedPerson:
        value(
          firm.authorized_person
        ),
      note:
        value(firm.note),
      isActive:
        firm.is_active !== false,
    });

    setModalOpen(true);
  }

  async function saveFirm() {
    if (!form.firmName.trim()) {
      alert(
        "Firma ünvanı zorunludur."
      );
      return;
    }

    const employeeCount =
      Number(
        form.employeeCount
      );

    if (
      !Number.isFinite(
        employeeCount
      ) ||
      employeeCount < 0
    ) {
      alert(
        "Çalışan sayısı geçerli bir sayı olmalıdır."
      );
      return;
    }

    try {
      setSaving(true);

      const editing =
        Boolean(form.id);

      const response =
        await fetch(
          "/api/dora/firms",
          {
            method:
              editing
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              id:
                form.id ||
                undefined,

              firmName:
                form.firmName,

              sgkNo:
                form.sgkNo,

              taxNo:
                form.taxNo,

              taxOffice:
                form.taxOffice,

              mersisNo:
                form.mersisNo,

              naceCode:
                form.naceCode,

              sector:
                form.sector,

              dangerClass:
                form.dangerClass,

              employeeCount:
                Math.floor(
                  employeeCount
                ),

              address:
                form.address,

              phone:
                form.phone,

              email:
                form.email,

              authorizedPerson:
                form.authorizedPerson,

              note:
                form.note,

              isActive:
                form.isActive,
            }),
          }
        );

      const json =
        (await response.json()) as DoraFirmApiResponse;

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "DORA firması kaydedilemedi."
        );
      }

      setModalOpen(false);

      setForm({
        ...EMPTY_FORM,
      });

      await load();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "DORA firması kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteFirm(
    firm: DoraFirm
  ) {
    const ok =
      window.confirm(
        `${firm.firm_name} DORA firması silinsin mi?\n\nBu işlem sadece DORA kayıtlarını etkiler.`
      );

    if (!ok) {
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/dora/firms",
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id: firm.id,
              }),
          }
        );

      const json =
        (await response.json()) as DoraFirmApiResponse;

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "DORA firması silinemedi."
        );
      }

      await load();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "DORA firması silinemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  function openFirm(
    firm: DoraFirm
  ) {
    router.push(
  `/admin/dora/${encodeURIComponent(
    firm.id
  )}`
);
  }

  return (
    <main className="page">
      <div className="topbar">
        <button
          className="back"
          onClick={() =>
            router.push("/admin/dashboard")
          }
        >
          ← Panel
        </button>

        <button
          className="refresh"
          disabled={loading}
          onClick={() =>
            void load()
          }
        >
          {loading
            ? "Yükleniyor..."
            : "Yenile"}
        </button>
      </div>

      <section className="hero">
        <div className="heroContent">
          <div className="eyebrow">
            D-SEC • BAĞIMSIZ İSG KURULUM ROBOTU
          </div>

          <h1>
            DORA AI İSG Asistanı
          </h1>

          <p>
            Firma kurulumu,
            doküman üretimi, hızlı
            risk analizi, denetim ve
            raporlamayı bağımsız bir
            çalışma alanında yönetin.
          </p>

          <div className="heroActions">
            <button
              className="heroPrimary"
              onClick={newFirm}
            >
              + Yeni DORA Firması
            </button>

            <div className="independence">
              <span className="shield">
                ◆
              </span>

              Diğer D-SEC modüllerinden
              bağımsız çalışır
            </div>
          </div>
        </div>

        <div className="heroLogo">
          <div className="doraOrb">
            DORA
          </div>

          <div className="heroLogoText">
            Hızlı İSG
            <span>
              Kurulum Merkezi
            </span>
          </div>
        </div>
      </section>

      <section className="kpis">
        <Kpi
          title="Firma"
          value={firms.length}
          detail={`${activeFirms.length} aktif DORA firması`}
        />

        <Kpi
          title="Çalışan"
          value={totalEmployeeCount}
          detail="DORA firma profillerindeki toplam"
        />

        <Kpi
          title="Risk"
          value={totalRiskCount}
          detail="DORA 5×5 merkezi"
          muted
        />

        <Kpi
          title="Kurulum"
          value={`%${averageSetupScore}`}
          detail="Ortalama DORA kurulum skoru"
        />
      </section>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <section className="workspaceIntro">
        <div>
          <div className="sectionEyebrow">
            DORA ÇALIŞMA ALANI
          </div>

          <h2>
            Hızlandırılmış bağımsız
            İSG kurulumu
          </h2>

          <p>
            Her DORA firması kendi
            çalışanlarını, dokümanlarını,
            risklerini, denetimlerini ve
            raporlarını kendi içinde
            tutar.
          </p>
        </div>

        <div className="flow">
          <FlowStep
            number="01"
            title="Firma"
            detail="Kurulum profilini oluştur"
          />

          <FlowArrow />

          <FlowStep
            number="02"
            title="Analiz"
            detail="DORA eksikleri çıkarsın"
          />

          <FlowArrow />

          <FlowStep
            number="03"
            title="Üret"
            detail="Doküman ve riskleri hazırla"
          />

          <FlowArrow />

          <FlowStep
            number="04"
            title="Raporla"
            detail="Kurulumu tamamla"
          />
        </div>
      </section>

      <section className="section">
        <div className="sectionTitle">
          <div>
            <div className="sectionEyebrow">
              DORA FİRMALARI
            </div>

            <h2>
              Bağımsız firma çalışma
              alanları
            </h2>

            <p>
              Ana D-SEC firma veya
              modül kayıtlarından
              bağımsızdır.
            </p>
          </div>

          <button
            className="primary"
            onClick={newFirm}
          >
            + Yeni Firma
          </button>
        </div>

        {loading ? (
          <div className="empty">
            DORA firmaları
            yükleniyor...
          </div>
        ) : firms.length === 0 ? (
          <div className="emptyState">
            <div className="emptyIcon">
              D
            </div>

            <h3>
              Henüz DORA firması yok
            </h3>

            <p>
              İlk bağımsız DORA
              çalışma alanınızı
              oluşturun.
            </p>

            <button
              className="primary"
              onClick={newFirm}
            >
              İlk DORA Firmasını Oluştur
            </button>
          </div>
        ) : (
          <div className="firmGrid">
            {firms.map(
              (firm) => {
                const score =
                  normalizedSetupScore(
                    firm.setup_score
                  );

                const tone =
                  dangerClassTone(
                    firm.danger_class
                  );

                return (
                  <article
                    className="firmCard"
                    key={firm.id}
                  >
                    <div className="firmCardTop">
                      <div
                        className={`firmMark ${tone}`}
                      >
                        D
                      </div>

                      <div className="firmIdentity">
                        <h3>
                          {firm.firm_name}
                        </h3>

                        <p>
                          {firm.sector ||
                            "Sektör belirtilmemiş"}
                        </p>
                      </div>

                      <span
                        className={
                          firm.is_active !==
                          false
                            ? "state active"
                            : "state passive"
                        }
                      >
                        {firm.is_active !==
                        false
                          ? "Aktif"
                          : "Pasif"}
                      </span>
                    </div>

                    <div className="metaGrid">
                      <Meta
                        label="Tehlike Sınıfı"
                        value={dangerClassLabel(
                          firm.danger_class
                        )}
                      />

                      <Meta
                        label="Çalışan"
                        value={String(
                          Number(
                            firm.employee_count ??
                              0
                          )
                        )}
                      />

                      <Meta
                        label="NACE"
                        value={
                          firm.nace_code ||
                          "-"
                        }
                      />

                      <Meta
                        label="Kurulum"
                        value={`%${score}`}
                      />
                    </div>

                    <div className="progressBlock">
                      <div className="progressHead">
                        <span>
                          DORA Kurulum
                        </span>

                        <strong>
                          %{score}
                        </strong>
                      </div>

                      <div className="progressTrack">
                        <div
                          className="progressValue"
                          style={{
                            width: `${score}%`,
                          }}
                        />
                      </div>

                      <div className="setupStatus">
                        {statusLabel(
                          firm.setup_status
                        )}
                      </div>
                    </div>

                    <div className="firmFooter">
                      <button
                        className="outline"
                        onClick={() =>
                          editFirm(firm)
                        }
                      >
                        Düzenle
                      </button>

                      <button
                        className="dangerBtn"
                        disabled={saving}
                        onClick={() =>
                          void deleteFirm(
                            firm
                          )
                        }
                      >
                        Sil
                      </button>

                      <button
                        className="open"
                        onClick={() =>
                          openFirm(firm)
                        }
                      >
                        DORA&apos;ya Gir →
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      <section className="section">
        <div className="sectionTitle">
          <div>
            <div className="sectionEyebrow">
              HIZLI İŞLEMLER
            </div>

            <h2>
              DORA içindeki çalışma
              merkezleri
            </h2>

            <p>
              Bu kartların tamamı
              sadece DORA verilerini
              kullanacaktır.
            </p>
          </div>
        </div>

        <div className="quickGrid">
          <QuickCard
            icon="01"
            title="Kurulum Yol Haritası"
            description="Firma profilinden eksikleri, kritik adımları ve tamamlanma oranını çıkar."
            status="Firma seçildikten sonra"
          />

          <QuickCard
            icon="02"
            title="Hızlı Dokümanlar"
            description="İSG politikası, acil durum planı, eğitim planı ve temel kurulum dokümanlarını üret."
            status="DORA doküman merkezi"
          />

          <QuickCard
  icon="03"
  title="DORA Fine Kinney Risk"
  description="Ana Risk modülüne dokunmadan bağımsız Fine Kinney risk değerlendirmeleri, DÖF takibi, Excel aktarımı ve raporlama yap."
  status="Aktif"
/>

          <QuickCard
            icon="04"
            title="DORA Denetim"
            description="DORA'nın kendi denetim şablonları, bulguları ve raporlarıyla saha kontrolü yap."
            status="Bağımsız merkez"
          />

          <QuickCard
            icon="05"
            title="DORA Çalışanları"
            description="Kurul ve ekip dokümanlarında kullanılacak hafif çalışan havuzunu yönet."
            status="Ana Çalışanlar'a bağlı değil"
          />

          <QuickCard
            icon="06"
            title="Rapor Merkezi"
            description="Kurulum, doküman, risk ve denetim çıktılarını DORA içinde raporla."
            status="DORA raporları"
          />
        </div>
      </section>

      <section className="architectureNote">
        <div className="architectureIcon">
          D
        </div>

        <div>
          <strong>
            DORA Bağımsızlık Kuralı
          </strong>

          <p>
            DORA içerisinde oluşturulan
            firma, çalışan, doküman,
            risk, denetim ve rapor
            kayıtları yalnızca DORA
            veri alanında kalır. Diğer
            D-SEC modüllerine otomatik
            kayıt veya veri aktarımı
            yapılmaz.
          </p>
        </div>
      </section>

      {modalOpen && (
        <div
          className="modalBackdrop"
          onMouseDown={() =>
            !saving &&
            setModalOpen(false)
          }
        >
          <div
            className="modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modalHeader">
              <div>
                <div className="sectionEyebrow">
                  DORA FİRMA PROFİLİ
                </div>

                <h2>
                  {form.id
                    ? "DORA Firmasını Düzenle"
                    : "Yeni DORA Firması"}
                </h2>

                <p>
                  Bu kayıt yalnızca
                  DORA çalışma alanında
                  kullanılacaktır.
                </p>
              </div>

              <button
                className="close"
                disabled={saving}
                onClick={() =>
                  setModalOpen(false)
                }
              >
                ×
              </button>
            </div>

            <div className="formGrid">
              <Field
                label="Firma Ünvanı *"
                value={form.firmName}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      firmName: v,
                    })
                  )
                }
              />

              <Field
                label="SGK İşyeri Sicil No"
                value={form.sgkNo}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      sgkNo: v,
                    })
                  )
                }
              />

              <Field
                label="Vergi No"
                value={form.taxNo}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      taxNo: v,
                    })
                  )
                }
              />

              <Field
                label="Vergi Dairesi"
                value={form.taxOffice}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      taxOffice: v,
                    })
                  )
                }
              />

              <Field
                label="MERSİS No"
                value={form.mersisNo}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      mersisNo: v,
                    })
                  )
                }
              />

              <Field
                label="NACE Kodu"
                value={form.naceCode}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      naceCode: v,
                    })
                  )
                }
              />

              <Field
                label="Sektör / Faaliyet"
                value={form.sector}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      sector: v,
                    })
                  )
                }
              />

              <label className="field">
                <span>
                  Tehlike Sınıfı
                </span>

                <select
                  value={
                    form.dangerClass
                  }
                  onChange={(event) =>
                    setForm(
                      (old) => ({
                        ...old,
                        dangerClass:
                          event.target
                            .value,
                      })
                    )
                  }
                >
                  <option value="">
                    Seçiniz
                  </option>

                  <option value="AZ_TEHLIKELI">
                    Az Tehlikeli
                  </option>

                  <option value="TEHLIKELI">
                    Tehlikeli
                  </option>

                  <option value="COK_TEHLIKELI">
                    Çok Tehlikeli
                  </option>
                </select>
              </label>

              <label className="field">
                <span>
                  Çalışan Sayısı
                </span>

                <input
                  type="number"
                  min={0}
                  value={
                    form.employeeCount
                  }
                  onChange={(event) =>
                    setForm(
                      (old) => ({
                        ...old,
                        employeeCount:
                          event.target
                            .value,
                      })
                    )
                  }
                />
              </label>

              <Field
                label="Yetkili Kişi"
                value={
                  form.authorizedPerson
                }
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      authorizedPerson:
                        v,
                    })
                  )
                }
              />

              <Field
                label="Telefon"
                value={form.phone}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      phone: v,
                    })
                  )
                }
              />

              <Field
                label="E-posta"
                value={form.email}
                onChange={(v) =>
                  setForm(
                    (old) => ({
                      ...old,
                      email: v,
                    })
                  )
                }
              />
            </div>

            <div className="formSection">
              <label className="field">
                <span>Adres</span>

                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(event) =>
                    setForm(
                      (old) => ({
                        ...old,
                        address:
                          event.target.value,
                      })
                    )
                  }
                />
              </label>

              <label className="field">
                <span>Not</span>

                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(event) =>
                    setForm(
                      (old) => ({
                        ...old,
                        note:
                          event.target.value,
                      })
                    )
                  }
                />
              </label>

              <label className="checkRow">
                <input
                  type="checkbox"
                  checked={
                    form.isActive
                  }
                  onChange={(event) =>
                    setForm(
                      (old) => ({
                        ...old,
                        isActive:
                          event.target
                            .checked,
                      })
                    )
                  }
                />

                <span>
                  DORA firması aktif
                </span>
              </label>
            </div>

            <div className="modalActions">
              <button
                className="outline"
                disabled={saving}
                onClick={() =>
                  setModalOpen(false)
                }
              >
                Vazgeç
              </button>

              <button
                className="primary"
                disabled={saving}
                onClick={() =>
                  void saveFirm()
                }
              >
                {saving
                  ? "Kaydediliyor..."
                  : form.id
                    ? "Değişiklikleri Kaydet"
                    : "DORA Firmasını Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{styles}</style>
    </main>
  );
}

function Kpi({
  title,
  value,
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
      className={`kpi ${muted ? "muted" : ""}`}
    >
      <span>{title}</span>

      <strong>{value}</strong>

      <small>{detail}</small>
    </article>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="meta">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

function QuickCard({
  icon,
  title,
  description,
  status,
}: {
  icon: string;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <article className="quickCard">
      <div className="quickIcon">
        {icon}
      </div>

      <div>
        <h3>{title}</h3>

        <p>{description}</p>

        <span className="quickStatus">
          {status}
        </span>
      </div>
    </article>
  );
}

function FlowStep({
  number,
  title,
  detail,
}: {
  number: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="flowStep">
      <span>{number}</span>

      <strong>{title}</strong>

      <small>{detail}</small>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flowArrow">
      →
    </div>
  );
}

function Field({
  label,
  value: fieldValue,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>

      <input
        value={fieldValue}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />
    </label>
  );
}

const styles = `
  :global(*) {
    box-sizing: border-box;
  }

  .page {
    min-height: 100vh;
    background:
      linear-gradient(
        180deg,
        #f7f8fb 0%,
        #ffffff 440px
      );
    color: #172033;
    padding: 24px;
  }

  .topbar {
    max-width: 1500px;
    margin: 0 auto 14px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  button {
    font: inherit;
  }

  .back,
  .refresh,
  .outline,
  .dangerBtn {
    border: 1px solid #d0d5dd;
    background: #ffffff;
    color: #344054;
    border-radius: 12px;
    padding: 10px 14px;
    font-weight: 750;
    cursor: pointer;
  }

  .back:hover,
  .refresh:hover,
  .outline:hover {
    border-color: #98a2b3;
    background: #f9fafb;
  }

  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .hero {
    max-width: 1500px;
    margin: 0 auto;
    min-height: 290px;
    border-radius: 30px;
    padding: 34px;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 28px;
    background:
      radial-gradient(
        circle at 87% 18%,
        rgba(255, 255, 255, 0.22),
        transparent 27%
      ),
      radial-gradient(
        circle at 72% 78%,
        rgba(255, 183, 77, 0.25),
        transparent 32%
      ),
      linear-gradient(
        120deg,
        #50141f 0%,
        #7a2633 48%,
        #d0602c 100%
      );
    box-shadow:
      0 24px 55px
      rgba(73, 20, 31, 0.18);
    color: white;
  }

  .heroContent {
    max-width: 780px;
    position: relative;
    z-index: 2;
  }

  .eyebrow,
  .sectionEyebrow {
    font-size: 12px;
    letter-spacing: 0.15em;
    font-weight: 900;
  }

  .eyebrow {
    color: rgba(255,255,255,0.78);
    margin-bottom: 12px;
  }

  .sectionEyebrow {
    color: #8c3543;
    margin-bottom: 8px;
  }

  .hero h1 {
    margin: 0;
    font-size: clamp(34px, 5vw, 62px);
    line-height: 1.02;
    letter-spacing: -0.045em;
  }

  .hero p {
    max-width: 720px;
    margin: 16px 0 0;
    color: rgba(255,255,255,0.86);
    font-size: 17px;
    line-height: 1.65;
  }

  .heroActions {
    margin-top: 25px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .heroPrimary,
  .primary,
  .open {
    border: 0;
    cursor: pointer;
    font-weight: 850;
    border-radius: 13px;
  }

  .heroPrimary {
    padding: 13px 18px;
    background: #ffffff;
    color: #681d2a;
    box-shadow:
      0 12px 26px
      rgba(38, 8, 15, 0.15);
  }

  .primary {
    background: #7a2633;
    color: #ffffff;
    padding: 11px 15px;
  }

  .open {
    background: #7a2633;
    color: #ffffff;
    padding: 11px 15px;
    margin-left: auto;
  }

  .independence {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: rgba(255,255,255,0.9);
    font-size: 13px;
    font-weight: 700;
  }

  .shield {
    width: 29px;
    height: 29px;
    border-radius: 9px;
    display: grid;
    place-items: center;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.2);
  }

  .heroLogo {
    min-width: 245px;
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
  }

  .doraOrb {
    width: 145px;
    height: 145px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 27px;
    font-weight: 950;
    letter-spacing: 0.08em;
    color: #70202d;
    background:
      radial-gradient(
        circle at 32% 28%,
        #ffffff,
        #f8e7e2 46%,
        #efc4b7
      );
    border: 9px solid
      rgba(255,255,255,0.16);
    box-shadow:
      inset 0 0 0 1px
      rgba(255,255,255,0.45),
      0 22px 50px
      rgba(49, 7, 14, 0.25);
  }

  .heroLogoText {
    margin-top: 12px;
    font-weight: 850;
    text-align: right;
    font-size: 14px;
  }

  .heroLogoText span {
    display: block;
    color: rgba(255,255,255,0.68);
    font-weight: 650;
  }

  .kpis {
    max-width: 1450px;
    margin: -30px auto 0;
    position: relative;
    z-index: 4;
    display: grid;
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .kpi {
    min-height: 125px;
    background: #ffffff;
    border: 1px solid #eaecf0;
    border-radius: 20px;
    padding: 18px;
    box-shadow:
      0 15px 38px
      rgba(16,24,40,0.08);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .kpi span {
    color: #667085;
    font-size: 13px;
    font-weight: 800;
  }

  .kpi strong {
    font-size: 35px;
    line-height: 1;
    margin: 9px 0 8px;
    color: #531823;
  }

  .kpi small {
    color: #98a2b3;
  }

  .kpi.muted strong {
    color: #98a2b3;
  }

  .error {
    max-width: 1450px;
    margin: 18px auto 0;
    padding: 14px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    border-radius: 14px;
    font-weight: 700;
  }

  .workspaceIntro,
  .section,
  .architectureNote {
    max-width: 1450px;
    margin-left: auto;
    margin-right: auto;
  }

  .workspaceIntro {
    margin-top: 28px;
    background: #ffffff;
    border: 1px solid #eaecf0;
    border-radius: 22px;
    padding: 23px;
    display: grid;
    grid-template-columns:
      minmax(260px, 0.8fr)
      minmax(480px, 1.5fr);
    gap: 24px;
    align-items: center;
  }

  .workspaceIntro h2,
  .sectionTitle h2 {
    margin: 0;
    color: #172033;
    letter-spacing: -0.025em;
  }

  .workspaceIntro p,
  .sectionTitle p {
    margin: 8px 0 0;
    color: #667085;
    line-height: 1.6;
  }

  .flow {
    display: flex;
    align-items: stretch;
    gap: 8px;
  }

  .flowStep {
    flex: 1;
    min-width: 0;
    padding: 13px;
    background: #f9fafb;
    border: 1px solid #eaecf0;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .flowStep span {
    color: #a44636;
    font-weight: 900;
    font-size: 12px;
  }

  .flowStep strong {
    color: #344054;
  }

  .flowStep small {
    color: #98a2b3;
    line-height: 1.35;
  }

  .flowArrow {
    display: grid;
    place-items: center;
    color: #b0b7c3;
    font-weight: 900;
  }

  .section {
    margin-top: 24px;
    background: #ffffff;
    border: 1px solid #eaecf0;
    border-radius: 24px;
    padding: 23px;
  }

  .sectionTitle {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 19px;
  }

  .firmGrid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .firmCard {
    border: 1px solid #e4e7ec;
    border-radius: 21px;
    padding: 18px;
    background:
      linear-gradient(
        180deg,
        #ffffff 0%,
        #fcfcfd 100%
      );
    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease,
      border-color 0.18s ease;
  }

  .firmCard:hover {
    transform: translateY(-2px);
    border-color: #d0d5dd;
    box-shadow:
      0 15px 36px
      rgba(16,24,40,0.07);
  }

  .firmCardTop {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .firmMark {
    width: 48px;
    height: 48px;
    border-radius: 15px;
    display: grid;
    place-items: center;
    font-weight: 950;
    background: #f2f4f7;
    color: #475467;
  }

  .firmMark.danger {
    background: #fee4e2;
    color: #b42318;
  }

  .firmMark.warning {
    background: #fff3e0;
    color: #b54708;
  }

  .firmMark.safe {
    background: #ecfdf3;
    color: #027a48;
  }

  .firmIdentity {
    flex: 1;
    min-width: 0;
  }

  .firmIdentity h3 {
    margin: 0;
    color: #101828;
    font-size: 18px;
  }

  .firmIdentity p {
    margin: 4px 0 0;
    color: #667085;
    font-size: 13px;
  }

  .state {
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 850;
  }

  .state.active {
    background: #ecfdf3;
    color: #027a48;
  }

  .state.passive {
    background: #f2f4f7;
    color: #667085;
  }

  .metaGrid {
    margin-top: 16px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .meta {
    padding: 10px 11px;
    background: #f9fafb;
    border: 1px solid #f0f1f3;
    border-radius: 13px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .meta span {
    color: #98a2b3;
    font-size: 11px;
    font-weight: 700;
  }

  .meta strong {
    color: #344054;
    font-size: 13px;
  }

  .progressBlock {
    margin-top: 15px;
  }

  .progressHead {
    display: flex;
    justify-content: space-between;
    color: #475467;
    font-size: 12px;
    font-weight: 750;
  }

  .progressTrack {
    height: 9px;
    margin-top: 8px;
    border-radius: 999px;
    overflow: hidden;
    background: #f2f4f7;
  }

  .progressValue {
    height: 100%;
    min-width: 0;
    border-radius: inherit;
    background:
      linear-gradient(
        90deg,
        #7a2633,
        #d0602c
      );
  }

  .setupStatus {
    margin-top: 6px;
    color: #98a2b3;
    font-size: 11px;
  }

  .firmFooter {
    margin-top: 16px;
    padding-top: 15px;
    border-top: 1px solid #f0f1f3;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .dangerBtn {
    color: #b42318;
    border-color: #fecdca;
    background: #fffafa;
  }

  .quickGrid {
    display: grid;
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
    gap: 14px;
  }

  .quickCard {
    min-height: 165px;
    border: 1px solid #eaecf0;
    background: #fcfcfd;
    border-radius: 19px;
    padding: 17px;
    display: flex;
    align-items: flex-start;
    gap: 13px;
  }

  .quickIcon {
    width: 42px;
    height: 42px;
    border-radius: 13px;
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    background: #f5e9eb;
    color: #7a2633;
    font-size: 12px;
    font-weight: 950;
  }

  .quickCard h3 {
    margin: 1px 0 7px;
    color: #344054;
  }

  .quickCard p {
    margin: 0;
    color: #667085;
    line-height: 1.55;
    font-size: 13px;
  }

  .quickStatus {
    display: inline-block;
    margin-top: 11px;
    color: #8c3543;
    font-size: 11px;
    font-weight: 850;
  }

  .architectureNote {
    margin-top: 24px;
    margin-bottom: 34px;
    padding: 20px;
    background: #fff8f5;
    border: 1px solid #f8d9ce;
    border-radius: 20px;
    display: flex;
    gap: 14px;
  }

  .architectureIcon {
    width: 44px;
    height: 44px;
    flex: 0 0 auto;
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: #ffffff;
    background: #7a2633;
    font-weight: 950;
  }

  .architectureNote strong {
    color: #6e1f2c;
  }

  .architectureNote p {
    margin: 5px 0 0;
    color: #80545c;
    line-height: 1.55;
    font-size: 13px;
  }

  .empty {
    padding: 22px;
    background: #f9fafb;
    border-radius: 16px;
    color: #667085;
    text-align: center;
  }

  .emptyState {
    padding: 45px 20px;
    text-align: center;
    background: #fcfcfd;
    border: 1px dashed #d0d5dd;
    border-radius: 20px;
  }

  .emptyIcon {
    width: 62px;
    height: 62px;
    margin: 0 auto 12px;
    border-radius: 20px;
    display: grid;
    place-items: center;
    background: #f5e9eb;
    color: #7a2633;
    font-size: 22px;
    font-weight: 950;
  }

  .emptyState h3 {
    margin: 0;
  }

  .emptyState p {
    color: #667085;
    margin: 7px 0 17px;
  }

  .modalBackdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    padding: 24px;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(6px);
    display: grid;
    place-items: center;
    overflow-y: auto;
  }

  .modal {
    width: min(900px, 100%);
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    background: #ffffff;
    border-radius: 24px;
    box-shadow:
      0 30px 80px
      rgba(15, 23, 42, 0.28);
  }

  .modalHeader {
    padding: 22px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid #eaecf0;
  }

  .modalHeader h2 {
    margin: 0;
  }

  .modalHeader p {
    margin: 6px 0 0;
    color: #667085;
  }

  .close {
    width: 38px;
    height: 38px;
    border: 1px solid #eaecf0;
    border-radius: 12px;
    background: #ffffff;
    font-size: 25px;
    line-height: 1;
    cursor: pointer;
    color: #667085;
  }

  .formGrid {
    padding: 22px;
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .field span {
    color: #475467;
    font-size: 12px;
    font-weight: 800;
  }

  .field input,
  .field select,
  .field textarea {
    width: 100%;
    border: 1px solid #d0d5dd;
    background: #ffffff;
    border-radius: 12px;
    padding: 11px 12px;
    color: #172033;
    outline: none;
    font: inherit;
  }

  .field input:focus,
  .field select:focus,
  .field textarea:focus {
    border-color: #9b5360;
    box-shadow:
      0 0 0 3px
      rgba(122, 38, 51, 0.08);
  }

  .field textarea {
    resize: vertical;
  }

  .formSection {
    padding: 0 22px 22px;
    display: grid;
    gap: 14px;
  }

  .checkRow {
    display: flex;
    align-items: center;
    gap: 9px;
    font-weight: 700;
    color: #475467;
  }

  .checkRow input {
    width: 18px;
    height: 18px;
  }

  .modalActions {
    padding: 18px 22px 22px;
    border-top: 1px solid #eaecf0;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  @media (
    max-width: 1050px
  ) {
    .kpis {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .workspaceIntro {
      grid-template-columns: 1fr;
    }

    .quickGrid {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .heroLogo {
      display: none;
    }
  }

  @media (
    max-width: 760px
  ) {
    .page {
      padding: 14px;
    }

    .hero {
      min-height: auto;
      padding: 24px 20px;
      border-radius: 23px;
    }

    .hero h1 {
      font-size: 39px;
    }

    .kpis {
      margin-top: 14px;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .kpi {
      min-height: 110px;
    }

    .firmGrid,
    .quickGrid,
    .formGrid {
      grid-template-columns: 1fr;
    }

    .sectionTitle {
      flex-direction: column;
    }

    .flow {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .flowArrow {
      display: none;
    }

    .firmFooter {
      flex-wrap: wrap;
    }

    .open {
      margin-left: 0;
      width: 100%;
    }
  }
`;