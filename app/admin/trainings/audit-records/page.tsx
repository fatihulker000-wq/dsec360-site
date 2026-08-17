"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileCheck2,
  Filter,
  GraduationCap,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

type AuditEvent = {
  id?: string;
  type: string;
  label: string;
  occurred_at: string | null;
  status: "success" | "info" | "warning";
  detail?: string | null;
  payload_hash?: string | null;
};

type AuditRecord = {
  assignment_id: string;
  training_id: string;
  training_title: string;
  training_type: string;

  employee_name: string;
  employee_id: string;
  email: string;
  company_name: string;

  status: string;

  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;

  watch_seconds: number;
  max_watched_seconds: number;
  click_count: number;
  watch_completed: boolean;

  pre_exam_score: number | null;
  pre_exam_passed: boolean | null;

  final_exam_score: number | null;
  final_exam_passed: boolean | null;

  certificate_no: string | null;
  certificate_issued_at: string | null;
  verification_code: string | null;

  evidence_score: number;

  events: AuditEvent[];
};

type AuditSummary = {
  total: number;
  completed: number;
  watched: number;
  passed: number;
  certificated: number;
  average_evidence_score: number;
  event_count?: number;
  hash_verified?: number;
  started?: number;
  assigned?: number;
  completion_rate?: number;
  certificate_rate?: number;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100];

function text(value: unknown) {
  return String(value ?? "").trim();
}

function formatDateTime(
  value?: string | null
) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWatchSeconds(
  value?: number | null
) {
  const total = Math.max(
    0,
    Math.floor(Number(value || 0))
  );

  const hours = Math.floor(
    total / 3600
  );

  const minutes = Math.floor(
    (total % 3600) / 60
  );

  const seconds = total % 60;

  if (hours > 0) {
    return `${hours} sa ${minutes} dk`;
  }

  if (minutes > 0) {
    return `${minutes} dk ${seconds} sn`;
  }

  return `${seconds} sn`;
}

function statusLabel(
  value?: string | null
) {
  const status = text(value).toLowerCase();

  if (status === "completed") {
    return "Tamamlandı";
  }

  if (status === "in_progress") {
    return "Devam Ediyor";
  }

  if (status === "assigned") {
    return "Atandı";
  }

  return "Başlamadı";
}

function eventStatusLabel(
  value?: string | null
) {
  const status = text(value).toLowerCase();

  if (status === "success") {
    return "Başarılı";
  }

  if (status === "warning") {
    return "Uyarı";
  }

  return "Bilgi";
}

function evidenceLabel(score: number) {
  if (score >= 90) {
    return "Çok İyi";
  }

  if (score >= 75) {
    return "İyi";
  }

  if (score >= 50) {
    return "Geliştirilmeli";
  }

  return "Eksik";
}

export default function TrainingAuditRecordsPage() {
  const router = useRouter();

  const [records, setRecords] =
    useState<AuditRecord[]>([]);

  const [summary, setSummary] =
    useState<AuditSummary>({
      total: 0,
      completed: 0,
      watched: 0,
      passed: 0,
      certificated: 0,
      average_evidence_score: 0,
    });

  const [generatedAt, setGeneratedAt] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [initialTrainingId, setInitialTrainingId] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [trainingFilter, setTrainingFilter] =
    useState("ALL");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [certificateFilter, setCertificateFilter] =
    useState("ALL");

  const [evidenceFilter, setEvidenceFilter] =
    useState("ALL");

  const [pageSize, setPageSize] =
    useState(25);

  const [page, setPage] =
    useState(1);

  const [selectedRecord, setSelectedRecord] =
    useState<AuditRecord | null>(null);

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const trainingId =
      text(
        params.get("trainingId")
      );

    setInitialTrainingId(trainingId);

    if (trainingId) {
      setTrainingFilter(trainingId);
    }
  }, []);

  const loadAudit =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams({
            limit: "500",
          });

        if (initialTrainingId) {
          params.set(
            "trainingId",
            initialTrainingId
          );
        }

        const response = await fetch(
          `/api/admin/training-audit?${params.toString()}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        if (response.status === 401) {
          window.location.href =
            "/admin/login";
          return;
        }

        const json = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            json?.detail ||
              json?.error ||
              "Çalışan kanıt kayıtları alınamadı."
          );
        }

        setRecords(
          Array.isArray(json?.data)
            ? json.data
            : []
        );

        setSummary(
          json?.summary || {
            total: 0,
            completed: 0,
            watched: 0,
            passed: 0,
            certificated: 0,
            average_evidence_score: 0,
          }
        );

        setGeneratedAt(
          text(json?.generated_at)
        );
      } catch (cause) {
        console.error(cause);

        setRecords([]);

        setError(
          cause instanceof Error
            ? cause.message
            : "Çalışan kanıt kayıtları yüklenemedi."
        );
      } finally {
        setLoading(false);
      }
    }, [initialTrainingId]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const trainingOptions =
    useMemo(() => {
      const map =
        new Map<
          string,
          string
        >();

      records.forEach((record) => {
        if (
          record.training_id &&
          record.training_title
        ) {
          map.set(
            record.training_id,
            record.training_title
          );
        }
      });

      return Array.from(
        map.entries()
      ).sort((a, b) =>
        a[1].localeCompare(
          b[1],
          "tr"
        )
      );
    }, [records]);

  const filteredRecords =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "tr-TR"
          );

      return records.filter(
        (record) => {
          const searchable = [
            record.employee_name,
            record.employee_id,
            record.email,
            record.company_name,
            record.training_title,
            record.training_type,
            record.assignment_id,
            record.certificate_no,
            record.verification_code,
          ]
            .join(" ")
            .toLocaleLowerCase(
              "tr-TR"
            );

          const searchOk =
            !query ||
            searchable.includes(query);

          const trainingOk =
            trainingFilter ===
              "ALL" ||
            record.training_id ===
              trainingFilter;

          const statusOk =
            statusFilter === "ALL" ||
            record.status ===
              statusFilter;

          const certificateOk =
            certificateFilter ===
              "ALL" ||
            (certificateFilter ===
              "YES" &&
              Boolean(
                record.certificate_no
              )) ||
            (certificateFilter ===
              "NO" &&
              !record.certificate_no);

          const evidenceOk =
            evidenceFilter ===
              "ALL" ||
            (evidenceFilter ===
              "90_PLUS" &&
              record.evidence_score >=
                90) ||
            (evidenceFilter ===
              "75_89" &&
              record.evidence_score >=
                75 &&
              record.evidence_score <
                90) ||
            (evidenceFilter ===
              "50_74" &&
              record.evidence_score >=
                50 &&
              record.evidence_score <
                75) ||
            (evidenceFilter ===
              "BELOW_50" &&
              record.evidence_score <
                50);

          return (
            searchOk &&
            trainingOk &&
            statusOk &&
            certificateOk &&
            evidenceOk
          );
        }
      );
    }, [
      records,
      search,
      trainingFilter,
      statusFilter,
      certificateFilter,
      evidenceFilter,
    ]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    trainingFilter,
    statusFilter,
    certificateFilter,
    evidenceFilter,
    pageSize,
  ]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredRecords.length /
          pageSize
      )
    );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedRecords =
    useMemo(() => {
      const start =
        (page - 1) *
        pageSize;

      return filteredRecords.slice(
        start,
        start + pageSize
      );
    }, [
      filteredRecords,
      page,
      pageSize,
    ]);

  function clearFilters() {
    setSearch("");

    setTrainingFilter(
      initialTrainingId || "ALL"
    );

    setStatusFilter("ALL");
    setCertificateFilter("ALL");
    setEvidenceFilter("ALL");
    setPage(1);
  }

  const activeFilterCount =
    [
      Boolean(search.trim()),
      trainingFilter !== "ALL",
      statusFilter !== "ALL",
      certificateFilter !== "ALL",
      evidenceFilter !== "ALL",
    ].filter(Boolean).length;

  return (
    <main className="page">
      <div className="shell">
        <header className="pageHeader">
          <div className="headerLeft">
            <button
              type="button"
              className="backButton"
              onClick={() =>
                router.back()
              }
            >
              <ArrowLeft
                size={16}
              />
              Geri
            </button>

            <div>
              <span className="eyebrow">
                Evidence & Audit Trail
              </span>

              <h1>
                Çalışan Kanıt
                Kayıtları
              </h1>

              <p>
                Çalışanların eğitim
                atama, içerik izleme,
                sınav, tamamlama ve
                sertifika kayıtlarını
                eğitim bazında
                inceleyin.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="refreshButton"
            disabled={loading}
            onClick={() =>
              void loadAudit()
            }
          >
            <RefreshCw
              size={15}
            />
            {loading
              ? "Yenileniyor..."
              : "Kayıtları Yenile"}
          </button>
        </header>

        <section className="summaryGrid">
          <SummaryCard
            icon={
              <UserRound
                size={18}
              />
            }
            label="Toplam Kayıt"
            value={summary.total}
          />

          <SummaryCard
            icon={
              <CheckCircle2
                size={18}
              />
            }
            label="Tamamlandı"
            value={summary.completed}
          />

          <SummaryCard
            icon={
              <Clock3
                size={18}
              />
            }
            label="İçerik Tamam"
            value={summary.watched}
          />

          <SummaryCard
            icon={
              <GraduationCap
                size={18}
              />
            }
            label="Final Başarılı"
            value={summary.passed}
          />

          <SummaryCard
            icon={
              <Award
                size={18}
              />
            }
            label="Sertifikalı"
            value={summary.certificated}
          />

          <SummaryCard
            icon={
              <ShieldCheck
                size={18}
              />
            }
            label="Kanıt Skoru"
            value={`${summary.average_evidence_score}%`}
          />
        </section>

        <section className="filtersPanel">
          <div className="filtersTitle">
            <div>
              <Filter
                size={16}
              />
              <strong>
                Kayıt Filtreleri
              </strong>

              {activeFilterCount >
              0 ? (
                <span className="filterCount">
                  {
                    activeFilterCount
                  }{" "}
                  aktif filtre
                </span>
              ) : null}
            </div>

            <button
              type="button"
              className="clearButton"
              onClick={
                clearFilters
              }
            >
              Filtreleri Temizle
            </button>
          </div>

          <div className="filtersGrid">
            <label className="searchField">
              <span>
                Çalışan / Eğitim Ara
              </span>

              <div className="inputWithIcon">
                <Search
                  size={15}
                />

                <input
                  value={search}
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Ad, e-posta, eğitim, belge no..."
                />
              </div>
            </label>

            <label>
              <span>Eğitim</span>

              <select
                value={
                  trainingFilter
                }
                onChange={(
                  event
                ) =>
                  setTrainingFilter(
                    event
                      .target
                      .value
                  )
                }
              >
                {!initialTrainingId ? (
                  <option value="ALL">
                    Tüm Eğitimler
                  </option>
                ) : null}

                {trainingOptions.map(
                  ([
                    id,
                    title,
                  ]) => (
                    <option
                      key={id}
                      value={id}
                    >
                      {title}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span>Durum</span>

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event
                      .target
                      .value
                  )
                }
              >
                <option value="ALL">
                  Tüm Durumlar
                </option>

                <option value="assigned">
                  Atandı
                </option>

                <option value="in_progress">
                  Devam Ediyor
                </option>

                <option value="completed">
                  Tamamlandı
                </option>
              </select>
            </label>

            <label>
              <span>
                Sertifika
              </span>

              <select
                value={
                  certificateFilter
                }
                onChange={(
                  event
                ) =>
                  setCertificateFilter(
                    event
                      .target
                      .value
                  )
                }
              >
                <option value="ALL">
                  Tümü
                </option>

                <option value="YES">
                  Sertifikalı
                </option>

                <option value="NO">
                  Sertifikasız
                </option>
              </select>
            </label>

            <label>
              <span>
                Kanıt Skoru
              </span>

              <select
                value={
                  evidenceFilter
                }
                onChange={(
                  event
                ) =>
                  setEvidenceFilter(
                    event
                      .target
                      .value
                  )
                }
              >
                <option value="ALL">
                  Tüm Skorlar
                </option>

                <option value="90_PLUS">
                  %90 - %100
                </option>

                <option value="75_89">
                  %75 - %89
                </option>

                <option value="50_74">
                  %50 - %74
                </option>

                <option value="BELOW_50">
                  %50 Altı
                </option>
              </select>
            </label>
          </div>
        </section>

        <section className="recordsPanel">
          <div className="recordsHeader">
            <div>
              <span className="eyebrow">
                Çalışan / Eğitim
              </span>

              <h2>
                Kanıt Kayıt Listesi
              </h2>

              <p>
                {
                  filteredRecords.length
                }{" "}
                kayıt gösteriliyor.
                Son üretim:{" "}
                {formatDateTime(
                  generatedAt
                )}
              </p>
            </div>

            <label className="pageSize">
              <span>
                Sayfa Boyutu
              </span>

              <select
                value={
                  pageSize
                }
                onChange={(
                  event
                ) =>
                  setPageSize(
                    Number(
                      event
                        .target
                        .value
                    )
                  )
                }
              >
                {PAGE_SIZE_OPTIONS.map(
                  (size) => (
                    <option
                      key={size}
                      value={size}
                    >
                      {size}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          {error ? (
            <div className="errorState">
              {error}
            </div>
          ) : loading ? (
            <div className="emptyState">
              Kanıt kayıtları
              yükleniyor...
            </div>
          ) : filteredRecords.length ===
            0 ? (
            <div className="emptyState">
              Seçilen filtrelere uygun
              çalışan kanıt kaydı
              bulunamadı.
            </div>
          ) : (
            <>
              <div className="tableWrap">
                <table className="recordsTable">
                  <thead>
                    <tr>
                      <th>
                        Çalışan
                      </th>
                      <th>
                        Eğitim
                      </th>
                      <th>Firma</th>
                      <th>Durum</th>
                      <th>
                        İzleme
                      </th>
                      <th>Final</th>
                      <th>
                        Sertifika
                      </th>
                      <th>Kanıt</th>
                      <th>
                        Son İşlem
                      </th>
                      <th>
                        İşlem
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagedRecords.map(
                      (
                        record
                      ) => (
                        <tr
                          key={
                            record.assignment_id
                          }
                        >
                          <td>
                            <div className="employeeCell">
                              <strong>
                                {
                                  record.employee_name
                                }
                              </strong>

                              <small>
                                {record.email ||
                                  "E-posta yok"}
                              </small>

                              <em>
                                ID:{" "}
                                {record.employee_id ||
                                  "-"}
                              </em>
                            </div>
                          </td>

                          <td>
                            <div className="trainingCell">
                              <strong>
                                {
                                  record.training_title
                                }
                              </strong>

                              <small>
                                {record.training_type ||
                                  "-"}
                              </small>
                            </div>
                          </td>

                          <td>
                            {record.company_name ||
                              "Firma bilgisi yok"}
                          </td>

                          <td>
                            <StatusBadge
                              status={
                                record.status
                              }
                            />
                          </td>

                          <td>
                            <span
                              className={
                                record.watch_completed
                                  ? "pill success"
                                  : "pill warning"
                              }
                            >
                              {record.watch_completed
                                ? "Tamam"
                                : "Eksik"}
                            </span>

                            <small className="cellNote">
                              {formatWatchSeconds(
                                Math.max(
                                  Number(
                                    record.watch_seconds ||
                                      0
                                  ),
                                  Number(
                                    record.max_watched_seconds ||
                                      0
                                  )
                                )
                              )}
                            </small>
                          </td>

                          <td>
                            <span
                              className={
                                record.final_exam_passed
                                  ? "pill success"
                                  : "pill neutral"
                              }
                            >
                              {record.final_exam_score ==
                              null
                                ? "-"
                                : `${record.final_exam_score} puan`}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                record.certificate_no
                                  ? "pill success"
                                  : "pill neutral"
                              }
                            >
                              {record.certificate_no
                                ? "Var"
                                : "Yok"}
                            </span>
                          </td>

                          <td>
                            <div className="evidenceCell">
                              <strong>
                                {
                                  record.evidence_score
                                }
                                %
                              </strong>

                              <small>
                                {evidenceLabel(
                                  record.evidence_score
                                )}
                              </small>
                            </div>
                          </td>

                          <td>
                            {formatDateTime(
                              record.completed_at ||
                                record.started_at ||
                                record.created_at
                            )}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="detailButton"
                              onClick={() =>
                                setSelectedRecord(
                                  record
                                )
                              }
                            >
                              Detay
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <span>
                  Toplam{" "}
                  {
                    filteredRecords.length
                  }{" "}
                  kayıt • Sayfa{" "}
                  {page} /{" "}
                  {totalPages}
                </span>

                <div>
                  <button
                    type="button"
                    disabled={
                      page <= 1
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.max(
                            1,
                            current -
                              1
                          )
                      )
                    }
                  >
                    <ChevronLeft
                      size={15}
                    />
                    Önceki
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >=
                      totalPages
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.min(
                            totalPages,
                            current +
                              1
                          )
                      )
                    }
                  >
                    Sonraki
                    <ChevronRight
                      size={15}
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {selectedRecord ? (
        <div
          className="drawerOverlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.currentTarget ===
              event.target
            ) {
              setSelectedRecord(
                null
              );
            }
          }}
        >
          <aside className="drawer">
            <header className="drawerHeader">
              <div>
                <span className="eyebrow">
                  Kanıt Detayı
                </span>

                <h2>
                  {
                    selectedRecord.employee_name
                  }
                </h2>

                <p>
                  {
                    selectedRecord.training_title
                  }
                </p>
              </div>

              <button
                type="button"
                className="closeButton"
                onClick={() =>
                  setSelectedRecord(
                    null
                  )
                }
              >
                <X size={18} />
              </button>
            </header>

            <div className="drawerBody">
              <div className="detailSummary">
                <DetailBox
                  label="Durum"
                  value={statusLabel(
                    selectedRecord.status
                  )}
                />

                <DetailBox
                  label="Kanıt Skoru"
                  value={`${selectedRecord.evidence_score}%`}
                />

                <DetailBox
                  label="Firma"
                  value={
                    selectedRecord.company_name ||
                    "-"
                  }
                />

                <DetailBox
                  label="Çalışan E-posta"
                  value={
                    selectedRecord.email ||
                    "-"
                  }
                />

                <DetailBox
                  label="Atama"
                  value={formatDateTime(
                    selectedRecord.created_at
                  )}
                />

                <DetailBox
                  label="Başlama"
                  value={formatDateTime(
                    selectedRecord.started_at
                  )}
                />

                <DetailBox
                  label="Tamamlama"
                  value={formatDateTime(
                    selectedRecord.completed_at
                  )}
                />

                <DetailBox
                  label="İzleme"
                  value={formatWatchSeconds(
                    Math.max(
                      Number(
                        selectedRecord.watch_seconds ||
                          0
                      ),
                      Number(
                        selectedRecord.max_watched_seconds ||
                          0
                      )
                    )
                  )}
                />

                <DetailBox
                  label="Ön Sınav"
                  value={
                    selectedRecord.pre_exam_score ==
                    null
                      ? "-"
                      : `${selectedRecord.pre_exam_score} puan`
                  }
                />

                <DetailBox
                  label="Final"
                  value={
                    selectedRecord.final_exam_score ==
                    null
                      ? "-"
                      : `${selectedRecord.final_exam_score} puan`
                  }
                />

                <DetailBox
                  label="Sertifika"
                  value={
                    selectedRecord.certificate_no ||
                    "Yok"
                  }
                />

                <DetailBox
                  label="Doğrulama Kodu"
                  value={
                    selectedRecord.verification_code ||
                    "-"
                  }
                />
              </div>

              <section className="timelineSection">
                <div className="sectionTitle">
                  <FileCheck2
                    size={17}
                  />

                  <div>
                    <strong>
                      Kanıt Zaman
                      Çizelgesi
                    </strong>

                    <span>
                      Eğitim sürecine
                      ait kayıtlı
                      hareketler
                    </span>
                  </div>
                </div>

                {selectedRecord.events
                  ?.length ? (
                  <div className="timeline">
                    {selectedRecord.events.map(
                      (
                        event,
                        index
                      ) => (
                        <div
                          key={
                            event.id ||
                            `${event.type}-${event.occurred_at}-${index}`
                          }
                          className="timelineItem"
                        >
                          <div
                            className={`timelineDot ${event.status}`}
                          />

                          <div className="timelineContent">
                            <div className="timelineTop">
                              <strong>
                                {
                                  event.label
                                }
                              </strong>

                              <span>
                                {eventStatusLabel(
                                  event.status
                                )}
                              </span>
                            </div>

                            <p>
                              {formatDateTime(
                                event.occurred_at
                              )}
                            </p>

                            {event.detail ? (
                              <em>
                                {
                                  event.detail
                                }
                              </em>
                            ) : null}

                            {event.payload_hash ? (
                              <code>
                                Hash:{" "}
                                {
                                  event.payload_hash
                                }
                              </code>
                            ) : null}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="timelineEmpty">
                    Bu kayıt için zaman
                    çizelgesi olayı
                    bulunamadı.
                  </div>
                )}
              </section>
            </div>
          </aside>
        </div>
      ) : null}

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 24px;
          background: #f6f8fb;
        }

        .shell {
          width: min(1600px, 100%);
          margin: 0 auto;
        }

        .pageHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          padding: 22px;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
        }

        .headerLeft {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          min-width: 0;
        }

        .backButton,
        .refreshButton,
        .clearButton,
        .detailButton,
        .pagination button,
        .closeButton {
          font: inherit;
          cursor: pointer;
        }

        .backButton {
          min-height: 38px;
          padding: 0 11px;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          background: #f8fafc;
          color: #334155;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }

        .eyebrow {
          display: inline-block;
          color: #7c3aed;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .pageHeader h1,
        .recordsHeader h2,
        .drawerHeader h2 {
          margin: 5px 0 0;
          color: #0f172a;
          font-weight: 950;
        }

        .pageHeader h1 {
          font-size: 24px;
        }

        .pageHeader p,
        .recordsHeader p,
        .drawerHeader p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 10px;
          line-height: 1.55;
        }

        .refreshButton {
          min-height: 40px;
          padding: 0 13px;
          border: 1px solid #dbeafe;
          border-radius: 11px;
          background: #eff6ff;
          color: #1d4ed8;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          font-weight: 950;
          white-space: nowrap;
        }

        .refreshButton:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .summaryGrid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .filtersPanel,
        .recordsPanel {
          margin-top: 14px;
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);
        }

        .filtersTitle,
        .recordsHeader,
        .pagination,
        .drawerHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .filtersTitle > div {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #334155;
        }

        .filtersTitle strong {
          font-size: 11px;
        }

        .filterCount {
          padding: 4px 7px;
          border-radius: 999px;
          background: #ede9fe;
          color: #6d28d9;
          font-size: 7px;
          font-weight: 900;
        }

        .clearButton {
          min-height: 34px;
          padding: 0 10px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: #ffffff;
          color: #475569;
          font-size: 8px;
          font-weight: 900;
        }

        .filtersGrid {
          display: grid;
          grid-template-columns:
            minmax(260px, 1.4fr)
            repeat(4, minmax(150px, 0.75fr));
          gap: 10px;
          margin-top: 12px;
        }

        .filtersGrid label,
        .pageSize {
          display: grid;
          gap: 5px;
        }

        .filtersGrid label > span,
        .pageSize > span {
          color: #94a3b8;
          font-size: 7px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .filtersGrid input,
        .filtersGrid select,
        .pageSize select {
          width: 100%;
          min-height: 40px;
          border: 1px solid #dbe2ea;
          border-radius: 10px;
          background: #ffffff;
          color: #334155;
          font: inherit;
          outline: none;
        }

        .filtersGrid input {
          border: 0;
          min-height: 38px;
          padding: 0;
        }

        .filtersGrid select,
        .pageSize select {
          padding: 0 10px;
        }

        .inputWithIcon {
          min-height: 40px;
          padding: 0 10px;
          border: 1px solid #dbe2ea;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
        }

        .recordsHeader {
          align-items: flex-end;
          padding-bottom: 12px;
          border-bottom: 1px solid #eef2f7;
        }

        .recordsHeader h2 {
          font-size: 17px;
        }

        .pageSize {
          min-width: 120px;
        }

        .tableWrap {
          width: 100%;
          margin-top: 12px;
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 13px;
        }

        .recordsTable {
          width: 100%;
          min-width: 1320px;
          border-collapse: collapse;
          background: #ffffff;
        }

        .recordsTable thead {
          background: #f8fafc;
        }

        .recordsTable th {
          padding: 10px 9px;
          border-bottom: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 7px;
          font-weight: 950;
          text-align: left;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .recordsTable td {
          padding: 11px 9px;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
          font-size: 8px;
          vertical-align: middle;
        }

        .recordsTable tbody tr:last-child td {
          border-bottom: 0;
        }

        .recordsTable tbody tr:hover {
          background: #fafcff;
        }

        .employeeCell,
        .trainingCell,
        .evidenceCell {
          display: grid;
          gap: 2px;
        }

        .employeeCell strong,
        .trainingCell strong,
        .evidenceCell strong {
          color: #111827;
          font-size: 9px;
          font-weight: 950;
        }

        .employeeCell small,
        .trainingCell small,
        .evidenceCell small,
        .cellNote {
          color: #94a3b8;
          font-size: 7px;
        }

        .employeeCell em {
          color: #cbd5e1;
          font-size: 6px;
          font-style: normal;
        }

        .cellNote {
          display: block;
          margin-top: 3px;
        }

        .pill {
          display: inline-flex;
          min-height: 23px;
          padding: 0 7px;
          border-radius: 999px;
          align-items: center;
          font-size: 7px;
          font-weight: 900;
          white-space: nowrap;
        }

        .pill.success {
          background: #dcfce7;
          color: #15803d;
        }

        .pill.warning {
          background: #fef3c7;
          color: #92400e;
        }

        .pill.neutral {
          background: #f1f5f9;
          color: #475569;
        }

        .detailButton {
          min-height: 30px;
          padding: 0 10px;
          border: 1px solid #dbeafe;
          border-radius: 9px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 8px;
          font-weight: 950;
        }

        .pagination {
          margin-top: 12px;
        }

        .pagination > span {
          color: #64748b;
          font-size: 8px;
          font-weight: 800;
        }

        .pagination > div {
          display: flex;
          gap: 7px;
        }

        .pagination button {
          min-height: 34px;
          padding: 0 10px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: #ffffff;
          color: #334155;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 8px;
          font-weight: 900;
        }

        .pagination button:disabled {
          opacity: 0.45;
          cursor: default;
        }

        .errorState,
        .emptyState {
          margin-top: 14px;
          padding: 22px;
          border-radius: 12px;
          text-align: center;
          font-size: 9px;
          font-weight: 850;
        }

        .errorState {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }

        .emptyState {
          border: 1px dashed #cbd5e1;
          background: #f8fafc;
          color: #64748b;
        }

        .drawerOverlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
          background: rgba(15, 23, 42, 0.38);
          backdrop-filter: blur(2px);
        }

        .drawer {
          width: min(680px, 94vw);
          height: 100%;
          overflow-y: auto;
          background: #ffffff;
          box-shadow: -18px 0 48px rgba(15, 23, 42, 0.18);
        }

        .drawerHeader {
          position: sticky;
          top: 0;
          z-index: 2;
          padding: 18px;
          border-bottom: 1px solid #e5e7eb;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(8px);
        }

        .drawerHeader h2 {
          font-size: 18px;
        }

        .closeButton {
          width: 36px;
          height: 36px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          color: #475569;
          display: grid;
          place-items: center;
        }

        .drawerBody {
          padding: 18px;
        }

        .detailSummary {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .timelineSection {
          margin-top: 20px;
        }

        .sectionTitle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eef2f7;
          color: #1d4ed8;
        }

        .sectionTitle strong {
          display: block;
          color: #0f172a;
          font-size: 12px;
          font-weight: 950;
        }

        .sectionTitle span {
          display: block;
          margin-top: 2px;
          color: #94a3b8;
          font-size: 7px;
        }

        .timeline {
          display: grid;
          gap: 9px;
          margin-top: 12px;
        }

        .timelineItem {
          display: grid;
          grid-template-columns: 12px minmax(0, 1fr);
          gap: 8px;
          align-items: flex-start;
        }

        .timelineDot {
          width: 9px;
          height: 9px;
          margin-top: 6px;
          border-radius: 999px;
        }

        .timelineDot.success {
          background: #22c55e;
        }

        .timelineDot.warning {
          background: #f59e0b;
        }

        .timelineDot.info {
          background: #3b82f6;
        }

        .timelineContent {
          padding: 10px 11px;
          border: 1px solid #e5e7eb;
          border-radius: 11px;
          background: #fafafa;
        }

        .timelineTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .timelineTop strong {
          color: #334155;
          font-size: 9px;
          font-weight: 950;
        }

        .timelineTop span {
          padding: 3px 6px;
          border-radius: 999px;
          background: #f1f5f9;
          color: #64748b;
          font-size: 6px;
          font-weight: 900;
        }

        .timelineContent p,
        .timelineContent em,
        .timelineContent code {
          display: block;
          margin: 4px 0 0;
        }

        .timelineContent p {
          color: #94a3b8;
          font-size: 7px;
        }

        .timelineContent em {
          color: #64748b;
          font-size: 7px;
          font-style: normal;
        }

        .timelineContent code {
          overflow-wrap: anywhere;
          color: #475569;
          font-size: 6px;
        }

        .timelineEmpty {
          margin-top: 12px;
          padding: 16px;
          border: 1px dashed #cbd5e1;
          border-radius: 11px;
          background: #f8fafc;
          color: #64748b;
          font-size: 8px;
          text-align: center;
        }

        @media (max-width: 1200px) {
          .summaryGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .filtersGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .searchField {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 760px) {
          .page {
            padding: 12px;
          }

          .pageHeader,
          .headerLeft,
          .recordsHeader,
          .pagination {
            align-items: stretch;
            flex-direction: column;
          }

          .refreshButton,
          .backButton {
            width: 100%;
            justify-content: center;
          }

          .summaryGrid,
          .filtersGrid,
          .detailSummary {
            grid-template-columns: 1fr;
          }

          .searchField {
            grid-column: auto;
          }

          .pageSize {
            width: 100%;
          }

          .pagination > div {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .pagination button {
            justify-content: center;
          }
        }
      `}</style>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="summaryCard">
      <div className="summaryIcon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <style jsx>{`
        .summaryCard {
          min-width: 0;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #ffffff;
          display: flex;
          align-items: center;
          gap: 9px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.035);
        }

        .summaryIcon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: #eff6ff;
          color: #2563eb;
          flex: 0 0 auto;
        }

        span {
          display: block;
          color: #94a3b8;
          font-size: 7px;
          font-weight: 900;
          text-transform: uppercase;
        }

        strong {
          display: block;
          margin-top: 3px;
          color: #0f172a;
          font-size: 18px;
          font-weight: 950;
        }
      `}</style>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    text(status).toLowerCase();

  const className =
    normalized === "completed"
      ? "completed"
      : normalized ===
          "in_progress"
        ? "progress"
        : "assigned";

  return (
    <>
      <span
        className={`statusBadge ${className}`}
      >
        {statusLabel(status)}
      </span>

      <style jsx>{`
        .statusBadge {
          display: inline-flex;
          min-height: 23px;
          padding: 0 7px;
          border-radius: 999px;
          align-items: center;
          font-size: 7px;
          font-weight: 950;
          white-space: nowrap;
        }

        .completed {
          background: #dcfce7;
          color: #15803d;
        }

        .progress {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .assigned {
          background: #fef3c7;
          color: #92400e;
        }
      `}</style>
    </>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="detailBox">
      <span>{label}</span>
      <strong>{value}</strong>

      <style jsx>{`
        .detailBox {
          min-width: 0;
          padding: 10px 11px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #f8fafc;
        }

        span {
          display: block;
          color: #94a3b8;
          font-size: 6px;
          font-weight: 900;
          text-transform: uppercase;
        }

        strong {
          display: block;
          margin-top: 4px;
          overflow-wrap: anywhere;
          color: #334155;
          font-size: 8px;
          font-weight: 950;
        }
      `}</style>
    </div>
  );
}
