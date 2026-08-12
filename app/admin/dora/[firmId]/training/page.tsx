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
  employee_count?: number | null;
};

type TrainingItem = {
  id: string;
  title: string;
  trainingType: string;
  trainingDate: string;
  trainingHours: string;
  startTime: string;
  endTime: string;
  place: string;
  trainerName: string;
  participantCount: number;
  status: string;
};

type DoraSyncResponse = {
  success?: boolean;
  error?: string;
  firm?: DoraFirm | null;

  trainings?: {
    items?: unknown[];
    count?: number;
    updatedAtMillis?: number;
  };

  training?: {
    items?: unknown[];
    count?: number;
    updatedAtMillis?: number;
  };

  modules?: {
    TRAINING?: {
      payload?: {
        items?: unknown[];
      };
    };
  };
};

type ModuleStateResponse = {
  success?: boolean;
  error?: string;
  payload?: {
    items?: unknown[];
    count?: number;
    updatedAtMillis?: number;
  };
};

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `training-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function todayTr() {
  return new Date().toLocaleDateString(
    "tr-TR"
  );
}

const EMPTY = (): TrainingItem => ({
  id: createId(),
  title:
    "Temel İş Sağlığı ve Güvenliği Eğitimi",
  trainingType: "TEMEL_ISG",
  trainingDate: todayTr(),
  trainingHours: "8",
  startTime: "09:00",
  endTime: "17:00",
  place: "",
  trainerName: "",
  participantCount: 0,
  status: "PLANLANDI",
});

function value(v: unknown) {
  return String(v ?? "").trim();
}

async function readJsonSafely<T>(
  response: Response,
  serviceName: string
): Promise<T> {
  const contentType =
    response.headers.get("content-type") || "";

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    const raw =
      await response.text();

    const preview =
      raw
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 180) ||
      "Boş yanıt";

    throw new Error(
      `${serviceName} JSON döndürmedi. HTTP ${response.status}. Yanıt: ${preview}`
    );
  }

  return (await response.json()) as T;
}

function mapTrainingItem(
  x: any,
  index: number
): TrainingItem {
  return {
    id:
      value(x?.id) ||
      value(x?.syncKey) ||
      value(x?.sync_key) ||
      `training-${index}`,

    title:
      value(x?.title) ||
      value(x?.trainingName) ||
      value(x?.training_name) ||
      "İSG Eğitimi",

    trainingType:
      value(x?.trainingType) ||
      value(x?.training_type) ||
      "TEMEL_ISG",

    trainingDate:
      value(x?.trainingDate) ||
      value(x?.training_date),

    trainingHours:
      value(x?.trainingHours) ||
      value(x?.training_hours) ||
      "8",

    startTime:
      value(x?.startTime) ||
      value(x?.trainingStartTime) ||
      value(x?.start_time) ||
      value(x?.training_start_time) ||
      "09:00",

    endTime:
      value(x?.endTime) ||
      value(x?.trainingEndTime) ||
      value(x?.end_time) ||
      value(x?.training_end_time) ||
      "17:00",

    place:
      value(x?.place) ||
      value(x?.trainingPlace) ||
      value(x?.training_place),

    trainerName:
      value(x?.trainerName) ||
      value(x?.trainer_name),

    participantCount:
      Number(
        x?.participantCount ??
          x?.participant_count ??
          0
      ) || 0,

    status:
      value(x?.status) ||
      "PLANLANDI",
  };
}

export default function DoraTrainingPage() {
  const router = useRouter();
  const params = useParams();

  const firmId =
    value(params?.firmId);

  const [firm, setFirm] =
    useState<DoraFirm | null>(null);

  const [items, setItems] =
    useState<TrainingItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [syncing, setSyncing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [formOpen, setFormOpen] =
    useState(false);

  const [form, setForm] =
    useState<TrainingItem>(
      EMPTY()
    );

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
        setSuccess("");

        const syncRes =
          await fetch(
            `/api/dora/mobile/sync?firmId=${encodeURIComponent(
              firmId
            )}`,
            {
              cache: "no-store",
              headers: {
                "x-api-key":
                  "dsec_mobile_123",
                Accept:
                  "application/json",
              },
            }
          );

        const syncJson =
          await readJsonSafely<DoraSyncResponse>(
            syncRes,
            "DORA tam senkron servisi"
          );

        if (
          !syncRes.ok ||
          syncJson.success === false
        ) {
          throw new Error(
            syncJson.error ||
              "DORA eğitim verileri alınamadı."
          );
        }

        setFirm(
          syncJson.firm ?? null
        );

        const incoming =
          Array.isArray(
            syncJson.trainings?.items
          )
            ? syncJson.trainings
                ?.items
            : Array.isArray(
                syncJson.training
                  ?.items
              )
            ? syncJson.training
                ?.items
            : Array.isArray(
                syncJson.modules
                  ?.TRAINING?.payload
                  ?.items
              )
            ? syncJson.modules
                ?.TRAINING?.payload
                ?.items
            : [];

        setItems(
          incoming.map(
            (
              x: any,
              index: number
            ) =>
              mapTrainingItem(
                x,
                index
              )
          )
        );
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Eğitim merkezi yüklenemedi."
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

  useEffect(() => {
    if (!success) return;

    const timer =
      window.setTimeout(
        () => {
          setSuccess("");
        },
        3500
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [success]);

  async function persist(
    next: TrainingItem[]
  ) {
    if (!firmId) {
      throw new Error(
        "DORA firma ID bulunamadı."
      );
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/dora/module-state",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },

            body:
              JSON.stringify({
                firmId,
                moduleKey:
                  "TRAINING",

                payload: {
                  items: next,
                  count:
                    next.length,
                  updatedAtMillis:
                    Date.now(),
                },
              }),
          }
        );

      const json =
        await readJsonSafely<ModuleStateResponse>(
          response,
          "DORA eğitim kayıt servisi"
        );

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "Eğitim kaydedilemedi."
        );
      }

      setItems(next);

      setSuccess(
        "Eğitim verileri kaydedildi."
      );

      return json;
    } finally {
      setSaving(false);
    }
  }

  async function syncAll() {
    if (!firmId) {
      return;
    }

    try {
      setSyncing(true);
      setError("");
      setSuccess("");

      const response =
        await fetch(
          "/api/dora/mobile/sync",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              "x-api-key":
                "dsec_mobile_123",
              Accept:
                "application/json",
            },

            body:
              JSON.stringify({
                firmId,

                trainings: {
                  items,
                  count:
                    items.length,
                  updatedAtMillis:
                    Date.now(),
                },

                modules: {
                  TRAINING: {
                    payload: {
                      items,
                      count:
                        items.length,
                      updatedAtMillis:
                        Date.now(),
                    },
                  },
                },
              }),
          }
        );

      const json =
        await readJsonSafely<DoraSyncResponse>(
          response,
          "DORA eğitim senkron servisi"
        );

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "DORA eğitim senkronizasyonu başarısız."
        );
      }

      setSuccess(
        "DORA Eğitim Merkezi Web ve App ile senkronize edildi."
      );

      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "DORA eğitim senkronizasyonu başarısız."
      );
    } finally {
      setSyncing(false);
    }
  }

  async function saveForm() {
    if (
      !form.title.trim()
    ) {
      alert(
        "Eğitim adı zorunludur."
      );
      return;
    }

    const normalized: TrainingItem =
      {
        ...form,

        id:
          form.id ||
          createId(),

        title:
          form.title.trim(),

        trainingType:
          form.trainingType.trim() ||
          "TEMEL_ISG",

        trainingDate:
          form.trainingDate.trim(),

        trainingHours:
          form.trainingHours.trim() ||
          "8",

        startTime:
          form.startTime.trim() ||
          "09:00",

        endTime:
          form.endTime.trim() ||
          "17:00",

        place:
          form.place.trim(),

        trainerName:
          form.trainerName.trim(),

        participantCount:
          Math.max(
            0,
            Number(
              form.participantCount
            ) || 0
          ),

        status:
          form.status.trim() ||
          "PLANLANDI",
      };

    const exists =
      items.some(
        (x) =>
          x.id ===
          normalized.id
      );

    const next =
      exists
        ? items.map(
            (x) =>
              x.id ===
              normalized.id
                ? normalized
                : x
          )
        : [
            ...items,
            normalized,
          ];

    try {
      await persist(next);

      setFormOpen(false);
      setForm(EMPTY());
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Eğitim kaydedilemedi."
      );
    }
  }

  async function remove(
    id: string
  ) {
    if (
      !window.confirm(
        "Bu DORA eğitim kaydı silinsin mi?"
      )
    ) {
      return;
    }

    try {
      await persist(
        items.filter(
          (x) =>
            x.id !== id
        )
      );
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Eğitim silinemedi."
      );
    }
  }

  const planned =
    useMemo(
      () =>
        items.filter(
          (x) =>
            x.status !==
            "TAMAMLANDI"
        ).length,
      [items]
    );

  const completed =
    items.length -
    planned;

  const totalParticipants =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.participantCount ||
                0
            ),
          0
        ),
      [items]
    );

  if (loading) {
    return (
      <main className="page">
        <div className="loading">
          DORA Eğitim Merkezi
          yükleniyor...
        </div>

        <style jsx>
          {styles}
        </style>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="topbar">
        <button
          className="outline"
          onClick={() =>
            router.push(
              `/admin/dora/${firmId}`
            )
          }
        >
          ← Firma Merkezine Dön
        </button>

        <div className="topActions">
          <button
            className="outline"
            disabled={syncing}
            onClick={() =>
              void load()
            }
          >
            Yenile
          </button>

          <button
            className="syncBtn"
            disabled={
              syncing ||
              saving
            }
            onClick={() =>
              void syncAll()
            }
          >
            {syncing
              ? "Senkronize Ediliyor..."
              : "Web ile Senkronize Et"}
          </button>

          <button
            className="primary"
            onClick={() => {
              setForm(
                EMPTY()
              );
              setFormOpen(
                true
              );
            }}
          >
            + Yeni Eğitim
          </button>
        </div>
      </div>

      <section className="hero">
        <div>
          <div className="eyebrow">
            DORA • EĞİTİM VE
            SERTİFİKA
          </div>

          <h1>
            Eğitim ve Sertifika
            Merkezi
          </h1>

          <p>
            {firm?.firm_name ||
              "DORA firması"}{" "}
            için eğitim
            oturumlarını,
            katılımı,
            sınav/sertifika
            hazırlığını ve App
            ile ortak eğitim
            durumunu yönetin.
          </p>
        </div>

        <div className="heroCount">
          <strong>
            {items.length}
          </strong>

          <span>
            eğitim
          </span>
        </div>
      </section>

      {error ? (
        <div className="error">
          <strong>
            İşlem Hatası
          </strong>

          <div>
            {error}
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="success">
          {success}
        </div>
      ) : null}

      <section className="syncInfo">
        <div>
          <span>
            APP ↔ WEB
          </span>

          <strong>
            DORA Eğitim
            Senkronizasyonu
          </strong>

          <p>
            Eğitim verileri
            DORA ortak mobil
            senkron servisi
            üzerinden
            eşitlenir.
          </p>
        </div>

        <button
          className="syncBtn"
          disabled={
            syncing ||
            saving
          }
          onClick={() =>
            void syncAll()
          }
        >
          {syncing
            ? "Senkronize Ediliyor..."
            : "Şimdi Senkronize Et"}
        </button>
      </section>

      <section className="kpis">
        <Kpi
          title="Toplam Eğitim"
          value={
            items.length
          }
          detail="DORA eğitim oturumları"
        />

        <Kpi
          title="Planlanan"
          value={planned}
          detail="Bekleyen eğitim"
        />

        <Kpi
          title="Tamamlanan"
          value={completed}
          detail="Tamamlandı durumu"
        />

        <Kpi
          title="Çalışan"
          value={
            firm?.employee_count ??
            0
          }
          detail="DORA çalışan havuzu"
        />
      </section>

      <section className="panel">
        <div className="panelHead">
          <div>
            <span>
              DORA EĞİTİMLERİ
            </span>

            <h2>
              Eğitim Oturumları
            </h2>

            <p>
              Toplam katılımcı
              kaydı:{" "}
              <b>
                {totalParticipants}
              </b>
            </p>
          </div>

          <div className="panelActions">
            <button
              className="outline"
              onClick={() =>
                void load()
              }
            >
              Yenile
            </button>

            <button
              className="primary"
              onClick={() => {
                setForm(
                  EMPTY()
                );

                setFormOpen(
                  true
                );
              }}
            >
              Yeni Eğitim
            </button>
          </div>
        </div>

        {items.length ===
        0 ? (
          <div className="empty">
            <strong>
              Henüz DORA eğitim
              kaydı yok.
            </strong>

            <p>
              App veya Web
              üzerinden oluşturulan
              eğitimler
              senkronizasyonla
              burada
              ortaklaşacaktır.
            </p>

            <button
              className="syncBtn"
              disabled={
                syncing
              }
              onClick={() =>
                void syncAll()
              }
            >
              Web ile
              Senkronize Et
            </button>
          </div>
        ) : (
          <div className="list">
            {items.map(
              (item) => (
                <article
                  className="card"
                  key={
                    item.id
                  }
                >
                  <div className="cardMain">
                    <div className="cardTop">
                      <span className="badge">
                        {
                          item.status
                        }
                      </span>

                      <span className="typeBadge">
                        {
                          item.trainingType
                        }
                      </span>
                    </div>

                    <h3>
                      {item.title}
                    </h3>

                    <p>
                      {item.trainingDate ||
                        "Tarih yok"}{" "}
                      •{" "}
                      {
                        item.trainingHours
                      }{" "}
                      saat •{" "}
                      {item.startTime ||
                        "-"}{" "}
                      -{" "}
                      {item.endTime ||
                        "-"}
                    </p>

                    <small>
                      Eğitmen:{" "}
                      {item.trainerName ||
                        "Atanmadı"}{" "}
                      • Yer:{" "}
                      {item.place ||
                        "Belirtilmedi"}{" "}
                      •{" "}
                      {
                        item.participantCount
                      }{" "}
                      katılımcı
                    </small>
                  </div>

                  <div className="actions">
                    <button
                      className="outline"
                      onClick={() => {
                        setForm({
                          ...item,
                        });

                        setFormOpen(
                          true
                        );
                      }}
                    >
                      Düzenle
                    </button>

                    <button
                      className="danger"
                      disabled={
                        saving
                      }
                      onClick={() =>
                        void remove(
                          item.id
                        )
                      }
                    >
                      Sil
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {formOpen ? (
        <div
          className="backdrop"
          onMouseDown={() => {
            if (!saving) {
              setFormOpen(
                false
              );
            }
          }}
        >
          <div
            className="modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div className="panelHead">
              <div>
                <span>
                  DORA EĞİTİM
                  FORMU
                </span>

                <h2>
                  Eğitim Kaydı
                </h2>
              </div>

              <button
                className="closeBtn"
                disabled={
                  saving
                }
                onClick={() =>
                  setFormOpen(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="formGrid">
              <Field
                label="Eğitim Adı"
                value={
                  form.title
                }
                onChange={(
                  v
                ) =>
                  setForm({
                    ...form,
                    title: v,
                  })
                }
              />

              <Field
                label="Eğitim Türü"
                value={
                  form.trainingType
                }
                onChange={(
                  v
                ) =>
                  setForm({
                    ...form,
                    trainingType:
                      v,
                  })
                }
              />

              <Field
                label="Tarih"
                value={
                  form.trainingDate
                }
                onChange={(
                  v
                ) =>
                  setForm({
                    ...form,
                    trainingDate:
                      v,
                  })
                }
              />

              <Field
                label="Süre (saat)"
                value={
                  form.trainingHours
                }
                onChange={(
                  v
                ) =>
                  setForm({
                    ...form,
                    trainingHours:
                      v,
                  })
                }
              />

              <Field
                label="Başlangıç"
                value={
                  form.startTime
                }
                onChange={(
                  v
                ) =>
                  setForm({
                    ...form,
                    startTime: v,
                  })
                }
              />

              <Field
                label="Bitiş"
                value={
                  form.endTime
                }
                onChange={(
                  v
                ) =>
                  setForm({
                    ...form,
                    endTime: v,
                  })
                }
              />

              <Field
                label="Yer"
                value={
                  form.place
                }
                onChange={(
                  v
                ) =>
                  setForm({
                    ...form,
                    place: v,
                  })
                }
              />

              <Field
                label="Eğitmen"
                value={
                  form.trainerName
                }
                onChange={(
                  v
                ) =>
                  setForm({
                    ...form,
                    trainerName:
                      v,
                  })
                }
              />

              <Field
                label="Katılımcı Sayısı"
                value={String(
                  form.participantCount
                )}
                onChange={(
                  v
                ) =>
                  setForm({
                    ...form,
                    participantCount:
                      Number(
                        v
                      ) || 0,
                  })
                }
              />

              <label className="field">
                <span>
                  Durum
                </span>

                <select
                  value={
                    form.status
                  }
                  onChange={(
                    event
                  ) =>
                    setForm({
                      ...form,
                      status:
                        event
                          .target
                          .value,
                    })
                  }
                >
                  <option value="PLANLANDI">
                    Planlandı
                  </option>

                  <option value="DEVAM_EDIYOR">
                    Devam
                    Ediyor
                  </option>

                  <option value="TAMAMLANDI">
                    Tamamlandı
                  </option>
                </select>
              </label>
            </div>

            <div className="modalActions">
              <button
                className="outline"
                disabled={
                  saving
                }
                onClick={() =>
                  setFormOpen(
                    false
                  )
                }
              >
                Vazgeç
              </button>

              <button
                className="primary saveBtn"
                disabled={
                  saving
                }
                onClick={() =>
                  void saveForm()
                }
              >
                {saving
                  ? "Kaydediliyor..."
                  : "Eğitimi Kaydet"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>
        {styles}
      </style>
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

      <strong>
        {value}
      </strong>

      <small>
        {detail}
      </small>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    v: string
  ) => void;
}) {
  return (
    <label className="field">
      <span>
        {label}
      </span>

      <input
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
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
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: .6;
}

.topbar,
.hero,
.kpis,
.panel,
.syncInfo {
  max-width: 1450px;
  margin-left: auto;
  margin-right: auto;
}

.topbar {
  display: flex;
  justify-content:
    space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.topActions,
.panelActions,
.modalActions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero {
  padding: 32px;
  border-radius: 28px;
  display: flex;
  justify-content:
    space-between;
  gap: 24px;
  align-items: center;
  color: #ffffff;
  background:
    linear-gradient(
      120deg,
      #50141f 0%,
      #7a2633 48%,
      #d0602c 100%
    );
  box-shadow:
    0 22px 50px
    rgba(73,20,31,.17);
}

.eyebrow,
.panelHead span {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .13em;
}

.hero h1 {
  margin: 8px 0 10px;
  font-size:
    clamp(
      32px,
      5vw,
      52px
    );
}

.hero p {
  margin: 0;
  max-width: 760px;
  line-height: 1.6;
  color:
    rgba(
      255,
      255,
      255,
      .86
    );
}

.heroCount {
  min-width: 150px;
  padding: 20px;
  border:
    1px solid
    rgba(
      255,
      255,
      255,
      .2
    );
  border-radius: 20px;
  text-align: center;
  background:
    rgba(
      255,
      255,
      255,
      .13
    );
}

.heroCount strong {
  display: block;
  font-size: 42px;
}

.heroCount span {
  font-weight: 800;
}

.syncInfo {
  margin-top: 18px;
  padding: 18px 20px;
  display: flex;
  justify-content:
    space-between;
  align-items: center;
  gap: 18px;
  border:
    1px solid
    #dbe4ef;
  border-radius: 18px;
  background: #f8fbff;
}

.syncInfo span {
  display: block;
  margin-bottom: 4px;
  color: #2563eb;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .12em;
}

.syncInfo strong {
  display: block;
  font-size: 16px;
}

.syncInfo p {
  margin: 5px 0 0;
  color: #667085;
  font-size: 13px;
}

.kpis {
  display: grid;
  grid-template-columns:
    repeat(
      4,
      minmax(0,1fr)
    );
  gap: 12px;
  margin-top: 18px;
}

.kpi,
.panel,
.card {
  border:
    1px solid
    #e4e7ec;
  background: #ffffff;
}

.kpi {
  padding: 18px;
  border-radius: 18px;
}

.kpi span,
.kpi small {
  display: block;
  color: #667085;
}

.kpi strong {
  display: block;
  font-size: 30px;
  margin: 8px 0;
}

.panel {
  margin-top: 18px;
  padding: 22px;
  border-radius: 22px;
}

.panelHead {
  display: flex;
  justify-content:
    space-between;
  gap: 16px;
  align-items:
    flex-start;
}

.panelHead span {
  color: #8c3543;
}

.panelHead h2 {
  margin: 5px 0 0;
}

.panelHead p {
  margin: 6px 0 0;
  color: #667085;
  font-size: 13px;
}

.list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.card {
  padding: 18px;
  border-radius: 17px;
  display: flex;
  justify-content:
    space-between;
  gap: 20px;
  align-items: center;
}

.cardMain {
  min-width: 0;
}

.cardTop {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.card h3 {
  margin: 8px 0;
}

.card p,
.card small {
  color: #667085;
}

.badge,
.typeBadge {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 850;
}

.badge {
  background: #fff0f2;
  color: #8c3543;
}

.typeBadge {
  background: #f2f4f7;
  color: #475467;
}

.actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.primary,
.outline,
.danger,
.syncBtn {
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 850;
}

.primary {
  border: 0;
  background: #7a2633;
  color: #ffffff;
}

.outline {
  border:
    1px solid
    #d0d5dd;
  background: #ffffff;
  color: #344054;
}

.danger {
  border:
    1px solid
    #f1b4b4;
  background: #fff2f2;
  color: #b42318;
}

.syncBtn {
  border:
    1px solid
    #bfd4ff;
  background: #eff6ff;
  color: #1d4ed8;
}

.empty,
.error,
.success {
  margin-top: 16px;
  padding: 18px;
  border-radius: 14px;
}

.empty {
  background: #f8fafc;
  color: #667085;
  text-align: center;
}

.empty strong {
  display: block;
  margin-bottom: 6px;
  color: #344054;
}

.empty p {
  margin: 0 0 14px;
}

.error {
  max-width: 1450px;
  margin-left: auto;
  margin-right: auto;
  background: #fff2f2;
  color: #b42318;
  border:
    1px solid
    #f1b4b4;
}

.error strong {
  display: block;
  margin-bottom: 5px;
}

.success {
  max-width: 1450px;
  margin-left: auto;
  margin-right: auto;
  background: #ecfdf3;
  color: #067647;
  border:
    1px solid
    #abefc6;
  font-weight: 800;
}

.loading {
  max-width: 1450px;
  margin: 100px auto;
  padding: 30px;
  text-align: center;
  color: #667085;
  font-weight: 800;
}

.backdrop {
  position: fixed;
  inset: 0;
  background:
    rgba(
      16,
      24,
      40,
      .48
    );
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 50;
}

.modal {
  width:
    min(
      850px,
      100%
    );
  max-height: 90vh;
  overflow: auto;
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  box-shadow:
    0 25px 70px
    rgba(
      16,
      24,
      40,
      .22
    );
}

.closeBtn {
  width: 38px;
  height: 38px;
  border:
    1px solid
    #d0d5dd;
  border-radius: 12px;
  background: #ffffff;
  color: #344054;
  font-size: 22px;
}

.formGrid {
  display: grid;
  grid-template-columns:
    repeat(
      2,
      minmax(0,1fr)
    );
  gap: 12px;
  margin: 18px 0;
}

.field {
  display: grid;
  gap: 6px;
}

.field span {
  font-size: 12px;
  font-weight: 800;
  color: #475467;
}

.field input,
.field select {
  width: 100%;
  padding: 11px 12px;
  border:
    1px solid
    #d0d5dd;
  border-radius: 11px;
  background: #ffffff;
  color: #101828;
  outline: none;
}

.field input:focus,
.field select:focus {
  border-color: #7a2633;
  box-shadow:
    0 0 0 3px
    rgba(
      122,
      38,
      51,
      .08
    );
}

.modalActions {
  justify-content:
    flex-end;
}

.saveBtn {
  min-width: 160px;
}

@media (
  max-width: 900px
) {
  .hero,
  .syncInfo {
    flex-direction: column;
    align-items: flex-start;
  }

  .topbar {
    align-items: stretch;
    flex-direction: column;
  }

  .topActions {
    width: 100%;
  }

  .kpis,
  .formGrid {
    grid-template-columns:
      1fr;
  }

  .card {
    flex-direction: column;
    align-items:
      flex-start;
  }

  .actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
`;