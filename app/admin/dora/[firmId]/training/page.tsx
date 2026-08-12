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

type CertificateItem = {
  id: string;
  certificateNo: string;
  employeeName: string;
  employeeTc: string;
  trainingId: string;
  trainingTitle: string;
  trainingDate: string;
  issueDate: string;
  validUntil: string;
  trainerName: string;
  trainingHours: string;
  status: string;
  note: string;
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
  certificates?: {
    items?: unknown[];
    count?: number;
    updatedAtMillis?: number;
  };
};

function value(v: unknown) {
  return String(v ?? "").trim();
}

function createId(prefix: string) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function todayTr() {
  return new Date().toLocaleDateString("tr-TR");
}

function emptyTraining(): TrainingItem {
  return {
    id: createId("training"),
    title: "Temel İş Sağlığı ve Güvenliği Eğitimi",
    trainingType: "TEMEL_ISG",
    trainingDate: todayTr(),
    trainingHours: "8",
    startTime: "09:00",
    endTime: "17:00",
    place: "",
    trainerName: "",
    participantCount: 0,
    status: "PLANLANDI",
  };
}

function emptyCertificate(): CertificateItem {
  return {
    id: createId("certificate"),
    certificateNo: "",
    employeeName: "",
    employeeTc: "",
    trainingId: "",
    trainingTitle: "",
    trainingDate: "",
    issueDate: todayTr(),
    validUntil: "",
    trainerName: "",
    trainingHours: "",
    status: "GECERLI",
    note: "",
  };
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
    const raw = await response.text();

    throw new Error(
      `${serviceName} JSON döndürmedi. HTTP ${response.status}. Yanıt: ${
        raw.replace(/\s+/g, " ").trim().slice(0, 180) || "Boş yanıt"
      }`
    );
  }

  return (await response.json()) as T;
}

function mapTraining(
  row: any,
  index: number
): TrainingItem {
  return {
    id:
      value(row?.id) ||
      value(row?.syncKey) ||
      `training-${index}`,
    title:
      value(row?.title) ||
      value(row?.trainingName) ||
      "İSG Eğitimi",
    trainingType:
      value(row?.trainingType) ||
      value(row?.training_type) ||
      "TEMEL_ISG",
    trainingDate:
      value(row?.trainingDate) ||
      value(row?.training_date),
    trainingHours:
      value(row?.trainingHours) ||
      value(row?.training_hours) ||
      "8",
    startTime:
      value(row?.startTime) ||
      value(row?.trainingStartTime) ||
      "09:00",
    endTime:
      value(row?.endTime) ||
      value(row?.trainingEndTime) ||
      "17:00",
    place:
      value(row?.place) ||
      value(row?.trainingPlace),
    trainerName:
      value(row?.trainerName),
    participantCount:
      Number(row?.participantCount ?? 0) || 0,
    status:
      value(row?.status) ||
      "PLANLANDI",
  };
}

function mapCertificate(
  row: any,
  index: number
): CertificateItem {
  return {
    id:
      value(row?.id) ||
      `certificate-${index}`,
    certificateNo:
      value(row?.certificateNo) ||
      value(row?.certificate_no),
    employeeName:
      value(row?.employeeName) ||
      value(row?.employee_name),
    employeeTc:
      value(row?.employeeTc) ||
      value(row?.employee_tc) ||
      value(row?.tcNo),
    trainingId:
      value(row?.trainingId) ||
      value(row?.training_id),
    trainingTitle:
      value(row?.trainingTitle) ||
      value(row?.training_title),
    trainingDate:
      value(row?.trainingDate) ||
      value(row?.training_date),
    issueDate:
      value(row?.issueDate) ||
      value(row?.issue_date) ||
      todayTr(),
    validUntil:
      value(row?.validUntil) ||
      value(row?.valid_until),
    trainerName:
      value(row?.trainerName),
    trainingHours:
      value(row?.trainingHours),
    status:
      value(row?.status) ||
      "GECERLI",
    note:
      value(row?.note),
  };
}

export default function DoraTrainingPage() {
  const router = useRouter();
  const params = useParams();
  const firmId = value(params?.firmId);

  const [firm, setFirm] =
    useState<DoraFirm | null>(null);

  const [trainings, setTrainings] =
    useState<TrainingItem[]>([]);

  const [certificates, setCertificates] =
    useState<CertificateItem[]>([]);

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

  const [trainingOpen, setTrainingOpen] =
    useState(false);

  const [certificateOpen, setCertificateOpen] =
    useState(false);

  const [trainingForm, setTrainingForm] =
    useState<TrainingItem>(emptyTraining());

  const [certificateForm, setCertificateForm] =
    useState<CertificateItem>(emptyCertificate());

  const load = useCallback(async () => {
    if (!firmId) {
      setError("DORA firma ID bulunamadı.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/dora/mobile/sync?firmId=${encodeURIComponent(
          firmId
        )}`,
        {
          cache: "no-store",
          headers: {
            "x-api-key": "dsec_mobile_123",
            Accept: "application/json",
          },
        }
      );

      const json =
        await readJsonSafely<DoraSyncResponse>(
          response,
          "DORA Eğitim ve Sertifika senkron servisi"
        );

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "DORA Eğitim ve Sertifika verileri alınamadı."
        );
      }

      setFirm(json.firm ?? null);

      const trainingRows =
        Array.isArray(json.trainings?.items)
          ? json.trainings!.items!
          : [];

      const certificateRows =
        Array.isArray(json.certificates?.items)
          ? json.certificates!.items!
          : [];

      setTrainings(
        trainingRows.map(
          (row, index) =>
            mapTraining(row, index)
        )
      );

      setCertificates(
        certificateRows.map(
          (row, index) =>
            mapCertificate(row, index)
        )
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "DORA Eğitim ve Sertifika Merkezi yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function persist(
    nextTrainings: TrainingItem[],
    nextCertificates: CertificateItem[],
    message: string
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
            body: JSON.stringify({
              firmId,
              trainings: {
                items: nextTrainings,
                count: nextTrainings.length,
                updatedAtMillis: Date.now(),
              },
              certificates: {
                items: nextCertificates,
                count: nextCertificates.length,
                updatedAtMillis: Date.now(),
              },
            }),
          }
        );

      const json =
        await readJsonSafely<DoraSyncResponse>(
          response,
          "DORA Eğitim ve Sertifika kayıt servisi"
        );

      if (
        !response.ok ||
        json.success === false
      ) {
        throw new Error(
          json.error ||
            "DORA Eğitim ve Sertifika verileri kaydedilemedi."
        );
      }

      const trainingRows =
        Array.isArray(json.trainings?.items)
          ? json.trainings!.items!
          : nextTrainings;

      const certificateRows =
        Array.isArray(json.certificates?.items)
          ? json.certificates!.items!
          : nextCertificates;

      setTrainings(
        trainingRows.map(
          (row, index) =>
            mapTraining(row, index)
        )
      );

      setCertificates(
        certificateRows.map(
          (row, index) =>
            mapCertificate(row, index)
        )
      );

      setSuccess(message);
    } finally {
      setSaving(false);
    }
  }

  async function syncAll() {
    try {
      setSyncing(true);
      await persist(
        trainings,
        certificates,
        "Eğitim ve sertifika verileri Web ↔ App ortak senkron alanına kaydedildi."
      );
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Senkronizasyon başarısız."
      );
    } finally {
      setSyncing(false);
    }
  }

  async function saveTraining() {
    if (!trainingForm.title.trim()) {
      alert("Eğitim adı zorunludur.");
      return;
    }

    const normalized: TrainingItem = {
      ...trainingForm,
      id:
        trainingForm.id ||
        createId("training"),
      title:
        trainingForm.title.trim(),
      trainingType:
        trainingForm.trainingType.trim() ||
        "TEMEL_ISG",
      trainingHours:
        trainingForm.trainingHours.trim() ||
        "8",
      startTime:
        trainingForm.startTime.trim() ||
        "09:00",
      endTime:
        trainingForm.endTime.trim() ||
        "17:00",
      participantCount:
        Math.max(
          0,
          Number(
            trainingForm.participantCount
          ) || 0
        ),
      status:
        trainingForm.status ||
        "PLANLANDI",
    };

    const exists =
      trainings.some(
        (row) =>
          row.id === normalized.id
      );

    const nextTrainings =
      exists
        ? trainings.map((row) =>
            row.id === normalized.id
              ? normalized
              : row
          )
        : [...trainings, normalized];

    try {
      await persist(
        nextTrainings,
        certificates,
        "Eğitim kaydı başarıyla kaydedildi."
      );

      setTrainingOpen(false);
      setTrainingForm(
        emptyTraining()
      );
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Eğitim kaydedilemedi."
      );
    }
  }

  async function deleteTraining(
    id: string
  ) {
    if (
      !window.confirm(
        "Bu DORA eğitim kaydı silinsin mi?"
      )
    ) {
      return;
    }

    const nextTrainings =
      trainings.filter(
        (row) => row.id !== id
      );

    const nextCertificates =
      certificates.filter(
        (row) =>
          row.trainingId !== id
      );

    try {
      await persist(
        nextTrainings,
        nextCertificates,
        "Eğitim kaydı silindi."
      );
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Eğitim silinemedi."
      );
    }
  }

  function createCertificateForTraining(
    training: TrainingItem
  ) {
    const next =
      emptyCertificate();

    next.trainingId =
      training.id;

    next.trainingTitle =
      training.title;

    next.trainingDate =
      training.trainingDate;

    next.trainerName =
      training.trainerName;

    next.trainingHours =
      training.trainingHours;

    next.certificateNo =
      `DORA-${new Date()
        .getFullYear()}-${String(
        certificates.length + 1
      ).padStart(5, "0")}`;

    setCertificateForm(next);
    setCertificateOpen(true);
  }

  async function saveCertificate() {
    if (
      !certificateForm.employeeName.trim()
    ) {
      alert(
        "Sertifika için çalışan adı zorunludur."
      );
      return;
    }

    if (
      !certificateForm.trainingTitle.trim()
    ) {
      alert(
        "Sertifikanın bağlı olduğu eğitim zorunludur."
      );
      return;
    }

    const normalized: CertificateItem = {
      ...certificateForm,
      id:
        certificateForm.id ||
        createId("certificate"),
      certificateNo:
        certificateForm.certificateNo.trim() ||
        `DORA-${new Date()
          .getFullYear()}-${String(
          certificates.length + 1
        ).padStart(5, "0")}`,
      employeeName:
        certificateForm.employeeName.trim(),
      employeeTc:
        certificateForm.employeeTc.trim(),
      trainingTitle:
        certificateForm.trainingTitle.trim(),
      status:
        certificateForm.status ||
        "GECERLI",
    };

    const exists =
      certificates.some(
        (row) =>
          row.id === normalized.id
      );

    const nextCertificates =
      exists
        ? certificates.map((row) =>
            row.id === normalized.id
              ? normalized
              : row
          )
        : [
            ...certificates,
            normalized,
          ];

    try {
      await persist(
        trainings,
        nextCertificates,
        "Sertifika kaydı başarıyla kaydedildi."
      );

      setCertificateOpen(false);
      setCertificateForm(
        emptyCertificate()
      );
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Sertifika kaydedilemedi."
      );
    }
  }

  async function deleteCertificate(
    id: string
  ) {
    if (
      !window.confirm(
        "Bu DORA sertifika kaydı silinsin mi?"
      )
    ) {
      return;
    }

    try {
      await persist(
        trainings,
        certificates.filter(
          (row) =>
            row.id !== id
        ),
        "Sertifika kaydı silindi."
      );
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Sertifika silinemedi."
      );
    }
  }

  const planned =
    useMemo(
      () =>
        trainings.filter(
          (row) =>
            row.status !==
            "TAMAMLANDI"
        ).length,
      [trainings]
    );

  const completed =
    trainings.length - planned;

  const validCertificates =
    useMemo(
      () =>
        certificates.filter(
          (row) =>
            row.status ===
            "GECERLI"
        ).length,
      [certificates]
    );

  if (loading) {
    return (
      <main className="page">
        DORA Eğitim ve Sertifika Merkezi yükleniyor...
        <style jsx>{styles}</style>
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

        <div className="actions">
          <button
            className="sync"
            disabled={syncing || saving}
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
              setTrainingForm(
                emptyTraining()
              );
              setTrainingOpen(
                true
              );
            }}
          >
            + Yeni Eğitim
          </button>

          <button
            className="primary"
            onClick={() => {
              setCertificateForm(
                emptyCertificate()
              );
              setCertificateOpen(
                true
              );
            }}
          >
            + Yeni Sertifika
          </button>
        </div>
      </div>

      <section className="hero">
        <div>
          <div className="eyebrow">
            DORA • EĞİTİM VE SERTİFİKA
          </div>
          <h1>
            Eğitim ve Sertifika Merkezi
          </h1>
          <p>
            {firm?.firm_name ||
              "DORA firması"}{" "}
            için eğitim oturumlarını ve
            çalışan bazlı sertifikaları
            Web ↔ App ortak senkron alanında yönetin.
          </p>
        </div>

        <div className="heroNumbers">
          <div>
            <strong>
              {trainings.length}
            </strong>
            <span>Eğitim</span>
          </div>
          <div>
            <strong>
              {certificates.length}
            </strong>
            <span>Sertifika</span>
          </div>
        </div>
      </section>

      {error ? (
        <div className="error">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="success">
          {success}
        </div>
      ) : null}

      <section className="kpis">
        <Kpi
          title="Toplam Eğitim"
          value={trainings.length}
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
          detail="Tamamlanan eğitim"
        />
        <Kpi
          title="Geçerli Sertifika"
          value={validCertificates}
          detail={`${certificates.length} toplam sertifika`}
        />
      </section>

      <section className="panel">
        <div className="panelHead">
          <div>
            <span>DORA EĞİTİMLERİ</span>
            <h2>Eğitim Oturumları</h2>
          </div>

          <button
            className="outline"
            onClick={() => void load()}
          >
            Yenile
          </button>
        </div>

        {trainings.length === 0 ? (
          <div className="empty">
            Henüz eğitim kaydı yok.
          </div>
        ) : (
          <div className="list">
            {trainings.map(
              (training) => (
                <article
                  className="card"
                  key={training.id}
                >
                  <div>
                    <span className="badge">
                      {training.status}
                    </span>
                    <h3>
                      {training.title}
                    </h3>
                    <p>
                      {training.trainingDate ||
                        "Tarih yok"}{" "}
                      •{" "}
                      {training.trainingHours} saat
                      •{" "}
                      {training.trainerName ||
                        "Eğitmen atanmadı"}
                    </p>
                    <small>
                      {training.place ||
                        "Yer belirtilmedi"}{" "}
                      •{" "}
                      {training.participantCount} katılımcı
                    </small>
                  </div>

                  <div className="actions">
                    <button
                      className="outline"
                      onClick={() => {
                        setTrainingForm({
                          ...training,
                        });
                        setTrainingOpen(
                          true
                        );
                      }}
                    >
                      Düzenle
                    </button>

                    <button
                      className="certButton"
                      onClick={() =>
                        createCertificateForTraining(
                          training
                        )
                      }
                    >
                      Sertifika Oluştur
                    </button>

                    <button
                      className="danger"
                      onClick={() =>
                        void deleteTraining(
                          training.id
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

      <section className="panel">
        <div className="panelHead">
          <div>
            <span>DORA SERTİFİKALARI</span>
            <h2>Sertifika Merkezi</h2>
          </div>

          <button
            className="primary"
            onClick={() => {
              setCertificateForm(
                emptyCertificate()
              );
              setCertificateOpen(
                true
              );
            }}
          >
            + Yeni Sertifika
          </button>
        </div>

        {certificates.length ===
        0 ? (
          <div className="empty">
            Henüz sertifika kaydı yok.
          </div>
        ) : (
          <div className="list">
            {certificates.map(
              (certificate) => (
                <article
                  className="card"
                  key={
                    certificate.id
                  }
                >
                  <div>
                    <span className="badge">
                      {
                        certificate.status
                      }
                    </span>
                    <h3>
                      {
                        certificate.employeeName
                      }
                    </h3>
                    <p>
                      {
                        certificate.trainingTitle
                      }
                    </p>
                    <small>
                      Belge No:{" "}
                      {certificate.certificateNo ||
                        "-"}{" "}
                      • Düzenleme:{" "}
                      {certificate.issueDate ||
                        "-"}{" "}
                      • Geçerlilik:{" "}
                      {certificate.validUntil ||
                        "-"}
                    </small>
                  </div>

                  <div className="actions">
                    <button
                      className="outline"
                      onClick={() => {
                        setCertificateForm({
                          ...certificate,
                        });
                        setCertificateOpen(
                          true
                        );
                      }}
                    >
                      Düzenle
                    </button>

                    <button
                      className="danger"
                      onClick={() =>
                        void deleteCertificate(
                          certificate.id
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

      {trainingOpen ? (
        <Modal
          title="Eğitim Kaydı"
          onClose={() =>
            !saving &&
            setTrainingOpen(false)
          }
        >
          <div className="formGrid">
            <Field
              label="Eğitim Adı"
              value={trainingForm.title}
              onChange={(v) =>
                setTrainingForm({
                  ...trainingForm,
                  title: v,
                })
              }
            />
            <Field
              label="Eğitim Türü"
              value={
                trainingForm.trainingType
              }
              onChange={(v) =>
                setTrainingForm({
                  ...trainingForm,
                  trainingType: v,
                })
              }
            />
            <Field
              label="Tarih"
              value={
                trainingForm.trainingDate
              }
              onChange={(v) =>
                setTrainingForm({
                  ...trainingForm,
                  trainingDate: v,
                })
              }
            />
            <Field
              label="Süre (saat)"
              value={
                trainingForm.trainingHours
              }
              onChange={(v) =>
                setTrainingForm({
                  ...trainingForm,
                  trainingHours: v,
                })
              }
            />
            <Field
              label="Başlangıç"
              value={
                trainingForm.startTime
              }
              onChange={(v) =>
                setTrainingForm({
                  ...trainingForm,
                  startTime: v,
                })
              }
            />
            <Field
              label="Bitiş"
              value={
                trainingForm.endTime
              }
              onChange={(v) =>
                setTrainingForm({
                  ...trainingForm,
                  endTime: v,
                })
              }
            />
            <Field
              label="Yer"
              value={trainingForm.place}
              onChange={(v) =>
                setTrainingForm({
                  ...trainingForm,
                  place: v,
                })
              }
            />
            <Field
              label="Eğitmen"
              value={
                trainingForm.trainerName
              }
              onChange={(v) =>
                setTrainingForm({
                  ...trainingForm,
                  trainerName: v,
                })
              }
            />
            <Field
              label="Katılımcı Sayısı"
              value={String(
                trainingForm.participantCount
              )}
              onChange={(v) =>
                setTrainingForm({
                  ...trainingForm,
                  participantCount:
                    Number(v) || 0,
                })
              }
            />

            <label className="field">
              <span>Durum</span>
              <select
                value={
                  trainingForm.status
                }
                onChange={(event) =>
                  setTrainingForm({
                    ...trainingForm,
                    status:
                      event.target.value,
                  })
                }
              >
                <option value="PLANLANDI">
                  Planlandı
                </option>
                <option value="DEVAM_EDIYOR">
                  Devam Ediyor
                </option>
                <option value="TAMAMLANDI">
                  Tamamlandı
                </option>
              </select>
            </label>
          </div>

          <button
            className="primary full"
            disabled={saving}
            onClick={() =>
              void saveTraining()
            }
          >
            {saving
              ? "Kaydediliyor..."
              : "Eğitimi Kaydet"}
          </button>
        </Modal>
      ) : null}

      {certificateOpen ? (
        <Modal
          title="Sertifika Kaydı"
          onClose={() =>
            !saving &&
            setCertificateOpen(false)
          }
        >
          <div className="formGrid">
            <Field
              label="Sertifika No"
              value={
                certificateForm.certificateNo
              }
              onChange={(v) =>
                setCertificateForm({
                  ...certificateForm,
                  certificateNo: v,
                })
              }
            />

            <Field
              label="Çalışan Adı"
              value={
                certificateForm.employeeName
              }
              onChange={(v) =>
                setCertificateForm({
                  ...certificateForm,
                  employeeName: v,
                })
              }
            />

            <Field
              label="TC / Çalışan Kimliği"
              value={
                certificateForm.employeeTc
              }
              onChange={(v) =>
                setCertificateForm({
                  ...certificateForm,
                  employeeTc: v,
                })
              }
            />

            <label className="field">
              <span>Bağlı Eğitim</span>
              <select
                value={
                  certificateForm.trainingId
                }
                onChange={(event) => {
                  const training =
                    trainings.find(
                      (row) =>
                        row.id ===
                        event.target.value
                    );

                  setCertificateForm({
                    ...certificateForm,
                    trainingId:
                      training?.id || "",
                    trainingTitle:
                      training?.title || "",
                    trainingDate:
                      training?.trainingDate ||
                      "",
                    trainerName:
                      training?.trainerName ||
                      "",
                    trainingHours:
                      training?.trainingHours ||
                      "",
                  });
                }}
              >
                <option value="">
                  Eğitim seçin
                </option>

                {trainings.map(
                  (training) => (
                    <option
                      key={
                        training.id
                      }
                      value={
                        training.id
                      }
                    >
                      {
                        training.title
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <Field
              label="Eğitim Tarihi"
              value={
                certificateForm.trainingDate
              }
              onChange={(v) =>
                setCertificateForm({
                  ...certificateForm,
                  trainingDate: v,
                })
              }
            />

            <Field
              label="Belge Düzenleme Tarihi"
              value={
                certificateForm.issueDate
              }
              onChange={(v) =>
                setCertificateForm({
                  ...certificateForm,
                  issueDate: v,
                })
              }
            />

            <Field
              label="Geçerlilik Tarihi"
              value={
                certificateForm.validUntil
              }
              onChange={(v) =>
                setCertificateForm({
                  ...certificateForm,
                  validUntil: v,
                })
              }
            />

            <Field
              label="Eğitmen"
              value={
                certificateForm.trainerName
              }
              onChange={(v) =>
                setCertificateForm({
                  ...certificateForm,
                  trainerName: v,
                })
              }
            />

            <Field
              label="Eğitim Süresi"
              value={
                certificateForm.trainingHours
              }
              onChange={(v) =>
                setCertificateForm({
                  ...certificateForm,
                  trainingHours: v,
                })
              }
            />

            <label className="field">
              <span>Sertifika Durumu</span>
              <select
                value={
                  certificateForm.status
                }
                onChange={(event) =>
                  setCertificateForm({
                    ...certificateForm,
                    status:
                      event.target.value,
                  })
                }
              >
                <option value="GECERLI">
                  Geçerli
                </option>
                <option value="YAKLASIYOR">
                  Süresi Yaklaşıyor
                </option>
                <option value="SURESI_DOLDU">
                  Süresi Doldu
                </option>
                <option value="IPTAL">
                  İptal
                </option>
              </select>
            </label>

            <label className="field wide">
              <span>Açıklama</span>
              <textarea
                value={
                  certificateForm.note
                }
                onChange={(event) =>
                  setCertificateForm({
                    ...certificateForm,
                    note:
                      event.target.value,
                  })
                }
              />
            </label>
          </div>

          <button
            className="primary full"
            disabled={saving}
            onClick={() =>
              void saveCertificate()
            }
          >
            {saving
              ? "Kaydediliyor..."
              : "Sertifikayı Kaydet"}
          </button>
        </Modal>
      ) : null}

      <style jsx>{styles}</style>
    </main>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <div
      className="backdrop"
      onMouseDown={onClose}
    >
      <div
        className="modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="panelHead">
          <div>
            <span>
              DORA EĞİTİM VE SERTİFİKA
            </span>
            <h2>{title}</h2>
          </div>
          <button
            className="outline"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
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

function Field({
  label,
  value,
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
        value={value}
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
:global(*){box-sizing:border-box}
.page{min-height:100vh;padding:24px;color:#172033;background:linear-gradient(180deg,#f7f8fb,#fff 430px)}
button{font:inherit;cursor:pointer}button:disabled{opacity:.6;cursor:not-allowed}
.topbar,.hero,.kpis,.panel{max-width:1450px;margin-left:auto;margin-right:auto}
.topbar{display:flex;justify-content:space-between;gap:12px;margin-bottom:14px}.actions{display:flex;gap:8px;flex-wrap:wrap}
.hero{padding:32px;border-radius:28px;display:flex;justify-content:space-between;gap:24px;align-items:center;color:#fff;background:linear-gradient(120deg,#50141f,#7a2633 48%,#d0602c);box-shadow:0 22px 50px rgba(73,20,31,.17)}
.eyebrow,.panelHead span{font-size:11px;font-weight:900;letter-spacing:.13em}.hero h1{margin:8px 0 10px;font-size:clamp(32px,5vw,52px)}.hero p{margin:0;max-width:780px;line-height:1.6;color:rgba(255,255,255,.86)}
.heroNumbers{display:flex;gap:12px}.heroNumbers>div{min-width:125px;padding:18px;border:1px solid rgba(255,255,255,.2);border-radius:18px;text-align:center;background:rgba(255,255,255,.12)}.heroNumbers strong,.heroNumbers span{display:block}.heroNumbers strong{font-size:38px}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px}.kpi,.panel,.card{border:1px solid #e4e7ec;background:#fff}.kpi{padding:18px;border-radius:18px}.kpi span,.kpi small{display:block;color:#667085}.kpi strong{display:block;font-size:30px;margin:8px 0}
.panel{margin-top:18px;padding:22px;border-radius:22px}.panelHead{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.panelHead span{color:#8c3543}.panelHead h2{margin:5px 0 0}.list{display:grid;gap:12px;margin-top:18px}
.card{padding:18px;border-radius:17px;display:flex;justify-content:space-between;gap:20px;align-items:center}.card h3{margin:8px 0}.card p,.card small{color:#667085}.badge{padding:5px 9px;border-radius:999px;background:#fff0f2;color:#8c3543;font-size:11px;font-weight:850}
.primary,.outline,.danger,.sync,.certButton{padding:10px 14px;border-radius:12px;font-weight:850}.primary{border:0;background:#7a2633;color:#fff}.outline{border:1px solid #d0d5dd;background:#fff;color:#344054}.danger{border:1px solid #f1b4b4;background:#fff2f2;color:#b42318}.sync{border:1px solid #b8cdfa;background:#eff6ff;color:#1d4ed8}.certButton{border:1px solid #f5c77a;background:#fff7e8;color:#9a4c00}
.empty,.error,.success{max-width:1450px;margin:16px auto 0;padding:18px;border-radius:14px}.empty{background:#f8fafc;color:#667085}.error{background:#fff2f2;color:#b42318;border:1px solid #f1b4b4}.success{background:#ecfdf3;color:#067647;border:1px solid #abefc6;font-weight:800}
.backdrop{position:fixed;inset:0;background:rgba(16,24,40,.48);display:grid;place-items:center;padding:18px;z-index:50}.modal{width:min(900px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:24px;padding:24px}
.formGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:18px 0}.field{display:grid;gap:6px}.field span{font-size:12px;font-weight:800;color:#475467}.field input,.field select,.field textarea{width:100%;padding:11px 12px;border:1px solid #d0d5dd;border-radius:11px;background:#fff}.field textarea{min-height:90px;resize:vertical}.wide{grid-column:1/-1}.full{width:100%}
@media(max-width:900px){.topbar,.hero{flex-direction:column;align-items:flex-start}.heroNumbers,.actions{width:100%}.kpis,.formGrid{grid-template-columns:1fr}.card{flex-direction:column;align-items:flex-start}}
`;