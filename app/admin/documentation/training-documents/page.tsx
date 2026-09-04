"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Download,
  ExternalLink,
  Share2,
  GraduationCap,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Upload,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Company = {
  id: string;
  name: string;
};

type Employee = {
  id: string;
  fullName: string;
  registryNo: string;
  jobTitle: string;
};

type TrainingRecord = {
  id: string;
  sessionKey?: string;
  trainingId?: string;
  assignmentStatus?: string;
  finalScore?: number | null;
  employeeRemoteId: string;
  employeeName: string;
  employeeRegistryNo: string;
  employeeJobTitle?: string;
  trainingTitle: string;
  trainingType: string;
  deliveryMode: string;
  trainingDate: number | null;
  validUntil: number | null;
  trainingTimeText: string;
  durationMinutes: number;
  trainerName: string;
  trainerRole: string;
  trainerOrg: string;
  trainingPlace: string;
  onlineUrl: string;
  completionNote: string;
  completed: boolean;
  documentUri: string;
  attendanceUri: string;
  certificateUri: string;
};

type CertificateRecord = {
  id: string;
  employeeRemoteId: string;
  employeeName: string;
  employeeRegistryNo: string;
  trainingTitle: string;
  certificateNo: string;
  issueDate: number | null;
  validUntil: number | null;
  remoteFileUrl: string;
};

type ArchiveFile = {
  id: string;
  firm_id: string;
  document_type:
    | "TRAINING_DOCUMENT"
    | "ATTENDANCE_SIGNED"
    | "CERTIFICATE_SIGNED";
  session_key: string | null;
  employee_remote_id: string | null;
  training_title: string;
  file_name: string;
  public_url: string;
  updated_at: string;
};

type TrainingSession = {
  key: string;
  trainingTitle: string;
  trainingType: string;
  deliveryMode: string;
  trainingDate: number | null;
  validUntil: number | null;
  trainingTimeText: string;
  durationMinutes: number;
  trainerName: string;
  trainerRole: string;
  trainerOrg: string;
  trainingPlace: string;
  onlineUrl: string;
  participantCount: number;
  completedCount: number;
  records: TrainingRecord[];
};

type ApiResponse = {
  success?: boolean;
  employees?: Employee[];
  trainings?: TrainingRecord[];
  certificates?: CertificateRecord[];
  error?: string;
  detail?: string;
};

type CompaniesResponse = {
  data?: Array<{
    id?: string | number | null;
    name?: string | null;
    title?: string | null;
    company_name?: string | null;
  }>;
  error?: string;
  message?: string;
};

type ActiveTab =
  | "DASHBOARD"
  | "SESSIONS"
  | "PARTICIPANTS"
  | "DOCUMENTS"
  | "CERTIFICATES"
  | "WARNINGS";

function formatDate(value: number | null): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function validity(value: number | null) {
  if (!value) {
    return {
      key: "NO_DATE",
      label: "Tarih Yok",
      color: "#475569",
      background: "#f8fafc",
      border: "#cbd5e1",
    };
  }

  const today = new Date();
  const target = new Date(value);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const days = Math.ceil(
    (target.getTime() - today.getTime()) /
      86400000
  );

  if (days < 0) {
    return {
      key: "EXPIRED",
      label: "Süresi Doldu",
      color: "#991b1b",
      background: "#fef2f2",
      border: "#fecaca",
    };
  }

  if (days <= 7) {
    return {
      key: "EXPIRING",
      label: `${days} Gün Kaldı`,
      color: "#991b1b",
      background: "#fef2f2",
      border: "#fca5a5",
    };
  }

  if (days <= 15) {
    return {
      key: "EXPIRING",
      label: `${days} Gün Kaldı`,
      color: "#b45309",
      background: "#fff7ed",
      border: "#fdba74",
    };
  }

  if (days <= 30) {
    return {
      key: "EXPIRING",
      label: `${days} Gün Kaldı`,
      color: "#a16207",
      background: "#fefce8",
      border: "#fde047",
    };
  }

  return {
    key: "VALID",
    label: "Geçerli",
    color: "#047857",
    background: "#ecfdf5",
    border: "#a7f3d0",
  };
}

function isWebUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function sessionKey(record: TrainingRecord): string {
  /*
   * API, Web trainings.id tabanlı gerçek oturum anahtarını döndürür.
   * Özellikle asenkron eğitimlerde çalışanların farklı tamamlama tarihleri
   * aynı eğitimi birden fazla oturum gibi göstermemelidir.
   */
  if (record.sessionKey?.trim()) {
    return record.sessionKey.trim();
  }

  return [
    record.trainingTitle.trim(),
    record.trainingDate ?? 0,
    record.trainingTimeText.trim(),
    record.trainerName.trim(),
    record.trainingPlace.trim(),
  ].join("|");
}

export default function TrainingDocumentsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [archiveFiles, setArchiveFiles] = useState<ArchiveFile[]>([]);
  const [uploadingKey, setUploadingKey] = useState("");

  const [tab, setTab] = useState<ActiveTab>("DASHBOARD");
  const [employeeId, setEmployeeId] = useState("");
  const [trainingTitle, setTrainingTitle] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState("");

  const loadCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      setError("");

      const response = await fetch("/api/admin/companies", {
        credentials: "include",
        cache: "no-store",
      });

      const json: CompaniesResponse =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.error ||
            json.message ||
            "Firmalar alınamadı."
        );
      }

      const rows = (
        Array.isArray(json.data)
          ? json.data
          : []
      )
        .map(
          (item): Company => ({
            id: String(item.id || "").trim(),
            name: String(
              item.name ||
                item.title ||
                item.company_name ||
                ""
            ).trim(),
          })
        )
        .filter((item) => item.id && item.name)
        .sort((first, second) =>
          first.name.localeCompare(second.name, "tr")
        );

      setCompanies(rows);
      setCompanyId(
        (current) =>
          current ||
          rows[0]?.id ||
          ""
      );
    } catch (loadError) {
      setCompanies([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Firmalar yüklenemedi."
      );
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    if (!companyId) {
      setEmployees([]);
      setTrainings([]);
      setCertificates([]);
      setArchiveFiles([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const query = new URLSearchParams({
        firmId: companyId,
      });

      const response = await fetch(
        `/api/admin/documentation/training-documents?${query.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const json: ApiResponse =
        await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.detail ||
            json.error ||
            "Eğitim arşivi alınamadı."
        );
      }

      setEmployees(
        Array.isArray(json.employees)
          ? json.employees
          : []
      );

      setTrainings(
        Array.isArray(json.trainings)
          ? json.trainings
          : []
      );

      setCertificates(
        Array.isArray(json.certificates)
          ? json.certificates
          : []
      );

      setLastSyncedAt(new Date());
    } catch (loadError) {
      setEmployees([]);
      setTrainings([]);
      setCertificates([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Eğitim arşivi yüklenemedi."
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadArchiveFiles = useCallback(async () => {
    if (!companyId) {
      setArchiveFiles([]);
      return;
    }

    const response = await fetch(
      `/api/admin/documentation/training-documents/archive-files?firmId=${encodeURIComponent(
        companyId
      )}`,
      {
        credentials: "include",
        cache: "no-store",
      }
    );

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        json.detail ||
          json.error ||
          "Arşiv belgeleri alınamadı."
      );
    }

    setArchiveFiles(
      Array.isArray(json.files) ? json.files : []
    );
  }, [companyId]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    void loadArchiveFiles().catch((loadError) => {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Arşiv belgeleri yüklenemedi."
      );
    });
  }, [loadArchiveFiles]);

  const refresh = async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        loadCompanies(),
        loadRecords(),
        loadArchiveFiles(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const selectedCompany =
    companies.find(
      (item) => item.id === companyId
    ) || null;

  const normalizedSearch =
    search.trim().toLocaleLowerCase("tr-TR");

  const titles = useMemo(
    () =>
      Array.from(
        new Set([
          ...trainings.map(
            (item) => item.trainingTitle
          ),
          ...certificates.map(
            (item) => item.trainingTitle
          ),
        ])
      )
        .filter(Boolean)
        .sort((first, second) =>
          first.localeCompare(second, "tr")
        ),
    [trainings, certificates]
  );

  const filteredTrainings = useMemo(
    () =>
      trainings.filter((item) => {
        const state = validity(item.validUntil);

        const matchesEmployee =
          !employeeId ||
          item.employeeRemoteId === employeeId;

        const matchesTraining =
          !trainingTitle ||
          item.trainingTitle === trainingTitle;

        const matchesStatus =
          !status ||
          (status === "COMPLETED" &&
            item.completed) ||
          (status === "PENDING" &&
            !item.completed) ||
          state.key === status;

        const matchesSearch =
          !normalizedSearch ||
          [
            item.employeeName,
            item.employeeRegistryNo,
            item.trainingTitle,
            item.trainingType,
            item.trainerName,
            item.trainingPlace,
          ]
            .join(" ")
            .toLocaleLowerCase("tr-TR")
            .includes(normalizedSearch);

        return (
          matchesEmployee &&
          matchesTraining &&
          matchesStatus &&
          matchesSearch
        );
      }),
    [
      trainings,
      employeeId,
      trainingTitle,
      status,
      normalizedSearch,
    ]
  );

  const filteredCertificates = useMemo(
    () =>
      certificates.filter((item) => {
        const state = validity(item.validUntil);

        const matchesEmployee =
          !employeeId ||
          item.employeeRemoteId === employeeId;

        const matchesTraining =
          !trainingTitle ||
          item.trainingTitle === trainingTitle;

        const matchesStatus =
          !status ||
          state.key === status;

        const matchesSearch =
          !normalizedSearch ||
          [
            item.employeeName,
            item.employeeRegistryNo,
            item.trainingTitle,
            item.certificateNo,
          ]
            .join(" ")
            .toLocaleLowerCase("tr-TR")
            .includes(normalizedSearch);

        return (
          matchesEmployee &&
          matchesTraining &&
          matchesStatus &&
          matchesSearch
        );
      }),
    [
      certificates,
      employeeId,
      trainingTitle,
      status,
      normalizedSearch,
    ]
  );

  const sessions = useMemo(() => {
    const groups = new Map<string, TrainingRecord[]>();

    filteredTrainings.forEach((record) => {
      const key = sessionKey(record);
      const rows = groups.get(key) || [];
      rows.push(record);
      groups.set(key, rows);
    });

    return Array.from(groups.entries())
      .map(([key, records]): TrainingSession => {
        const first = records[0];

        return {
          key,
          trainingTitle: first.trainingTitle,
          trainingType: first.trainingType,
          deliveryMode: first.deliveryMode,
          trainingDate: first.trainingDate,
          validUntil: first.validUntil,
          trainingTimeText: first.trainingTimeText,
          durationMinutes: first.durationMinutes,
          trainerName: first.trainerName,
          trainerRole: first.trainerRole,
          trainerOrg: first.trainerOrg,
          trainingPlace: first.trainingPlace,
          onlineUrl: first.onlineUrl,
          participantCount: records.length,
          completedCount: records.filter(
            (item) => item.completed
          ).length,
          records: [...records].sort(
            (firstRecord, secondRecord) =>
              firstRecord.employeeName.localeCompare(
                secondRecord.employeeName,
                "tr"
              )
          ),
        };
      })
      .sort(
        (first, second) =>
          (second.trainingDate || 0) -
          (first.trainingDate || 0)
      );
  }, [filteredTrainings]);

  const metrics = useMemo(() => {
    const participantIds =
      new Set(
        trainings.map(
          (item) => item.employeeRemoteId
        )
      );

    /*
     * Aynı oturumun katılım formu/dokümanı tüm katılımcı satırlarında
     * tekrar edebilir. Kartlar kişi satırı değil gerçek benzersiz belge
     * sayısını göstermelidir.
     */
    const attendanceFormCount =
      new Set(
        trainings
          .map(
            (item) =>
              item.attendanceUri
          )
          .filter(Boolean)
      ).size;

    const trainingDocumentCount =
      new Set(
        trainings
          .map(
            (item) =>
              item.documentUri
          )
          .filter(Boolean)
      ).size;

    const expired =
      trainings.filter(
        (item) =>
          validity(item.validUntil).key ===
          "EXPIRED"
      ).length +
      certificates.filter(
        (item) =>
          validity(item.validUntil).key ===
          "EXPIRED"
      ).length;

    const expiring =
      trainings.filter(
        (item) =>
          validity(item.validUntil).key ===
          "EXPIRING"
      ).length +
      certificates.filter(
        (item) =>
          validity(item.validUntil).key ===
          "EXPIRING"
      ).length;

    return {
      sessionCount: new Set(
        trainings.map(sessionKey)
      ).size,
      participantCount:
        participantIds.size,
      attendanceCount: trainings.length,
      attendanceFormCount,
      trainingDocumentCount,
      certificateCount:
        certificates.length,
      expired,
      expiring,
    };
  }, [trainings, certificates]);

  const warningTrainings =
    filteredTrainings.filter((item) =>
      ["EXPIRED", "EXPIRING"].includes(
        validity(item.validUntil).key
      )
    );

  const warningCertificates =
    filteredCertificates.filter((item) =>
      ["EXPIRED", "EXPIRING"].includes(
        validity(item.validUntil).key
      )
    );

  const uploadArchiveFile = async ({
    file,
    documentType,
    session,
    employeeRemoteId = "",
  }: {
    file: File;
    documentType:
      | "ATTENDANCE_SIGNED"
      | "CERTIFICATE_SIGNED";
    session: TrainingSession;
    employeeRemoteId?: string;
  }) => {
    const key = [
      documentType,
      session.key,
      employeeRemoteId,
    ].join("|");

    try {
      setUploadingKey(key);
      setError("");

      const formData = new FormData();
      formData.set("file", file);
      formData.set("firmId", companyId);
      formData.set("documentType", documentType);
      formData.set("sessionKey", session.key);
      formData.set(
        "employeeRemoteId",
        employeeRemoteId
      );
      formData.set(
        "trainingTitle",
        session.trainingTitle
      );

      const response = await fetch(
        "/api/admin/documentation/training-documents/archive-files",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const json = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.detail ||
            json.error ||
            "Belge yüklenemedi."
        );
      }

      await loadArchiveFiles();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Belge yüklenemedi."
      );
    } finally {
      setUploadingKey("");
    }
  };

  const printSession = (
    session: TrainingSession
  ) => {
    if (!companyId) {
      setError(
        "Katılım formu için önce firma seçilmelidir."
      );
      return;
    }

    const query = new URLSearchParams({
      firmId: companyId,
      sessionKey: session.key,
    });

    const popup = window.open(
      `/api/admin/documentation/training-documents/attendance-form?${query.toString()}`,
      "_blank",
      "width=1200,height=900"
    );

    if (!popup) {
      setError(
        "Katılım formu penceresi açılamadı. Tarayıcı açılır pencere iznini kontrol edin."
      );
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "linear-gradient(180deg,#f8fafc 0%,#fff7ed 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 1540,
          margin: "0 auto",
          display: "grid",
          gap: 18,
        }}
      >
        <section className="hero">
          <div className="heroTop">
            <div>
              <button
                className="backButton"
                onClick={() => {
                  window.location.href =
                    "/admin/documentation";
                }}
              >
                <ArrowLeft size={16} />
                Dokümantasyona Dön
              </button>

              <h1>Eğitim Arşivi</h1>

              <p>
  Eğitimler modülünde oluşturulan eğitim oturumları,
  katılımcılar, katılım kayıtları, katılım formları,
  eğitim dokümanları ve sertifikalar bu merkezde
  arşivlenmektedir.

  <br />
  <br />

  Bu ekran yalnızca görüntüleme, raporlama,
  belge inceleme ve çıktı alma amacıyla kullanılır.
  Veri girişi ve düzenleme işlemleri Eğitimler
  Modülü üzerinden yapılmaktadır.
</p>
            </div>

            <div className="syncBox">
              <button
                className="refreshButton"
                onClick={() => void refresh()}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2
                    size={17}
                    className="spin"
                  />
                ) : (
                  <RefreshCw size={17} />
                )}
                Yenile
              </button>

              <div className="syncText">
                <span>Son Senkron</span>
                <strong>
                  {lastSyncedAt
                    ? lastSyncedAt.toLocaleString("tr-TR")
                    : "Henüz yapılmadı"}
                </strong>
              </div>
            </div>
          </div>

          <div className="heroGrid">
            <Metric
              title="Eğitim Oturumu"
              value={metrics.sessionCount}
              icon={
                <GraduationCap size={18} />
              }
            />

            <Metric
              title="Katılımcı"
              value={metrics.participantCount}
              icon={<Users size={18} />}
            />

            <Metric
              title="Katılım Kaydı"
              value={metrics.attendanceCount}
              icon={
                <ClipboardList size={18} />
              }
            />

            <Metric
              title="Katılım Formu"
              value={metrics.attendanceFormCount}
              icon={<FileText size={18} />}
            />

            <Metric
              title="Eğitim Dokümanı"
              value={metrics.trainingDocumentCount}
              icon={<FileText size={18} />}
            />

            <Metric
              title="Sertifika"
              value={metrics.certificateCount}
              icon={<Award size={18} />}
            />

            <Metric
              title="Süre Uyarısı"
              value={
                metrics.expired +
                metrics.expiring
              }
              icon={
                <AlertTriangle size={18} />
              }
            />
          </div>
        </section>

        {error ? (
          <section className="error">
            <AlertTriangle size={18} />
            {error}
          </section>
        ) : null}

        <section className="toolbar">
          <div className="tabs">
            <Tab
              active={tab === "DASHBOARD"}
              label="Dashboard"
              onClick={() =>
                setTab("DASHBOARD")
              }
            />

            <Tab
              active={tab === "SESSIONS"}
              label={`Oturumlar (${sessions.length})`}
              onClick={() =>
                setTab("SESSIONS")
              }
            />

            <Tab
              active={
                tab === "PARTICIPANTS"
              }
              label={`Katılımcılar (${filteredTrainings.length})`}
              onClick={() =>
                setTab("PARTICIPANTS")
              }
            />

            <Tab
              active={tab === "DOCUMENTS"}
              label="Formlar ve Dokümanlar"
              onClick={() =>
                setTab("DOCUMENTS")
              }
            />

            <Tab
              active={
                tab === "CERTIFICATES"
              }
              label={`Sertifikalar (${filteredCertificates.length})`}
              onClick={() =>
                setTab("CERTIFICATES")
              }
            />

            <Tab
              active={tab === "WARNINGS"}
              label={`Süre Uyarıları (${
                warningTrainings.length +
                warningCertificates.length
              })`}
              onClick={() =>
                setTab("WARNINGS")
              }
            />
          </div>

          <label className="company">
            <Building2 size={16} />

            <select
              value={companyId}
              disabled={loadingCompanies}
              onChange={(event) => {
                setCompanyId(
                  event.target.value
                );
                setEmployeeId("");
                setTrainingTitle("");
                setStatus("");
              }}
            >
              {companies.length === 0 ? (
                <option value="">
                  Firma bulunamadı
                </option>
              ) : null}

              {companies.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="archiveInfo">
          <CheckCircle2 size={19} />

          <div>
            <strong>
              Salt okunur eğitim arşivi
            </strong>

             <div>

Bu ekran Eğitimler Modülünde oluşturulan;

<br/><br/>

✓ Eğitim Oturumları

<br/>

✓ Katılımcılar

<br/>

✓ Katılım Formları

<br/>

✓ Eğitim Dokümanları

<br/>

✓ Sertifikalar

<br/><br/>

kayıtlarının arşiv ekranıdır.

Buradan yalnızca görüntüleme,
raporlama ve çıktı alma işlemleri yapılır.

</div>
          </div>
        </section>

        <section className="filters">
          <select
            value={employeeId}
            onChange={(event) =>
              setEmployeeId(
                event.target.value
              )
            }
          >
            <option value="">
              Tüm Çalışanlar
            </option>

            {employees.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.fullName}
                {item.registryNo
                  ? ` • ${item.registryNo}`
                  : ""}
              </option>
            ))}
          </select>

          <select
            value={trainingTitle}
            onChange={(event) =>
              setTrainingTitle(
                event.target.value
              )
            }
          >
            <option value="">
              Tüm Eğitimler
            </option>

            {titles.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
          >
            <option value="">
              Tüm Durumlar
            </option>
            <option value="COMPLETED">
              Tamamlandı
            </option>
            <option value="PENDING">
              Bekliyor
            </option>
            <option value="VALID">
              Geçerli
            </option>
            <option value="EXPIRING">
              30 Gün İçinde
            </option>
            <option value="EXPIRED">
              Süresi Doldu
            </option>
            <option value="NO_DATE">
              Tarih Yok
            </option>
          </select>

          <label className="search">
            <Search size={16} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Çalışan, eğitim veya belge ara..."
            />
          </label>
        </section>

        <section className="content">
          {loading ? (
            <div className="loading">
              <Loader2
                size={22}
                className="spin"
              />
              Eğitim arşivi yükleniyor...
            </div>
          ) : null}

          {!loading &&
          tab === "DASHBOARD" ? (
            <DashboardArea
              sessions={sessions}
              certificates={
                filteredCertificates
              }
              onPrintSession={printSession}
            />
          ) : null}

          {!loading &&
          tab === "SESSIONS" ? (
            <SessionArchive
              sessions={sessions}
              onPrint={printSession}
            />
          ) : null}

          {!loading &&
          tab === "PARTICIPANTS" ? (
            <ParticipantTable
              records={filteredTrainings}
            />
          ) : null}

          {!loading &&
          tab === "DOCUMENTS" ? (
            <DocumentArchive
              records={filteredTrainings}
              sessions={sessions}
              archiveFiles={archiveFiles}
              uploadingKey={uploadingKey}
              onPrintSession={printSession}
              onUpload={uploadArchiveFile}
            />
          ) : null}

          {!loading &&
          tab === "CERTIFICATES" ? (
            <CertificateArchive
              sessions={sessions}
              archiveFiles={archiveFiles}
              companyId={companyId}
              uploadingKey={uploadingKey}
              onUpload={uploadArchiveFile}
            />
          ) : null}

          {!loading &&
          tab === "WARNINGS" ? (
            <WarningArea
              trainings={warningTrainings}
              certificates={
                warningCertificates
              }
            />
          ) : null}
        </section>
      </div>

      <style jsx>{`
        .hero {
          border-radius: 28px;
          padding: 25px;
          color: white;
          background: linear-gradient(
            135deg,
            #5f0f1b,
            #991b1b 48%,
            #d97706
          );
          box-shadow: 0 24px 60px
            rgba(127, 29, 29, 0.22);
        }

        .heroTop,
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
        }

        .hero h1 {
          font-size: 34px;
          margin: 17px 0 0;
          font-weight: 950;
        }

        .hero p {
          max-width: 900px;
          color: rgba(255, 255, 255, 0.86);
          line-height: 1.6;
        }

       .backButton,
.refreshButton {
  border: 0;
  color: white;
  background: rgba(255, 255, 255, 0.13);
  border-radius: 999px;
  padding: 9px 13px;
  display: inline-flex;
  gap: 7px;
  align-items: center;
  font-weight: 850;
  cursor: pointer;
}

.syncBox {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.syncText {
  display: grid;
  gap: 2px;
  text-align: right;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.78);
}

.syncText strong {
  color: white;
  font-size: 12px;
}

.documentActions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.documentAction {
  border: 1px solid #dbeafe;
  padding: 7px 9px;
  border-radius: 9px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.documentAction:hover {
  background: #dbeafe;
}

        .archiveActions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .archiveButton {
          min-height: 38px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #f8fafc;
          color: #334155;
          font-size: 12px;
          font-weight: 850;
          text-decoration: none;
          cursor: pointer;
        }

        .archiveButton.primary {
          border-color: #fecaca;
          background: #7f1d1d;
          color: #ffffff;
        }

        .archiveButton.upload {
          border-color: #fed7aa;
          background: #fff7ed;
          color: #9a3412;
        }

        .archiveButton.success {
          border-color: #bbf7d0;
          background: #f0fdf4;
          color: #166534;
        }

        .heroGrid {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(
            7,
            minmax(0, 1fr)
          );
          gap: 10px;
        }

        .toolbar,
        .filters,
        .content,
        .archiveInfo {
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 20px;
          padding: 13px;
          box-shadow: 0 10px 28px
            rgba(15, 23, 42, 0.04);
        }

        .tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .company,
        .search {
          min-height: 43px;
          border: 1px solid #dbe3ec;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 11px;
        }

        .company {
          min-width: 300px;
        }

        .company select,
        .search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
        }

        .archiveInfo {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #166534;
          background: #f0fdf4;
          border-color: #bbf7d0;
          line-height: 1.55;
        }

        .archiveInfo div div {
          margin-top: 3px;
          color: #475569;
          font-size: 13px;
        }

        .filters {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr))
            minmax(260px, 1.2fr);
          gap: 10px;
        }

        .filters select {
          min-height: 43px;
          border: 1px solid #dbe3ec;
          border-radius: 12px;
          padding: 0 11px;
          background: white;
        }

        .error {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 16px;
          padding: 14px;
          display: flex;
          gap: 9px;
          font-weight: 800;
        }

        .loading {
          min-height: 230px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          color: #64748b;
          font-weight: 800;
        }

        .spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1350px) {
          .heroGrid {
            grid-template-columns: repeat(
              4,
              1fr
            );
          }

          .filters {
            grid-template-columns: repeat(
              2,
              1fr
            );
          }
        }

        @media (max-width: 760px) {
          main {
            padding: 12px !important;
          }

          .heroGrid,
          .filters {
            grid-template-columns: 1fr;
          }

          .company {
            width: 100%;
            min-width: 0;
          }
        }
      `}</style>
    </main>
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function Metric({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 17,
        padding: 15,
        background:
          "rgba(255,255,255,.12)",
        border:
          "1px solid rgba(255,255,255,.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          color:
            "rgba(255,255,255,.78)",
          fontSize: 12,
          fontWeight: 800,
        }}
      >
        {icon}
        {title}
      </div>

      <div
        style={{
          marginTop: 7,
          fontSize: 25,
          fontWeight: 950,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Tab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 43,
        borderRadius: 12,
        border: active
          ? "1px solid #7f1d1d"
          : "1px solid transparent",
        background: active
          ? "#7f1d1d"
          : "#f8fafc",
        color: active
          ? "white"
          : "#475569",
        padding: "0 15px",
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function DashboardArea({
  sessions,
  certificates,
  onPrintSession,
}: {
  sessions: TrainingSession[];
  certificates: CertificateRecord[];
  onPrintSession: (
    session: TrainingSession
  ) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 22,
      }}
    >
     
     <section
    style={{
        border: "1px solid #dbeafe",
        background: "#eff6ff",
        borderRadius: 18,
        padding: 18,
    }}
>
    <h2
        style={{
            margin: 0,
            color: "#1e3a8a",
        }}
    >
        Eğitim Doküman Merkezi
    </h2>

    <p
        style={{
            marginTop: 10,
            color: "#475569",
            lineHeight: 1.7,
        }}
    >
        Bu ekran Eğitimler Modülünde oluşturulan
        eğitim kayıtlarının arşividir.

        <br /><br />

        Buradan;

        <br />

        • Eğitim Oturumları

        <br />

        • Katılımcılar

        <br />

        • Katılım Formları

        <br />

        • Eğitim Dokümanları

        <br />

        • Sertifikalar

        <br />

        görüntülenebilir ve çıktıları alınabilir.
    </p>
</section>
      <section>

<div
    style={{
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
        gap: 15,
        marginBottom: 10,
    }}
>

    <SummaryCard
        title="Toplam Oturum"
        value={sessions.length}
        color="#7f1d1d"
    />

    <SummaryCard
        title="Toplam Sertifika"
        value={certificates.length}
        color="#065f46"
    />

    <SummaryCard
        title="PDF Çıktıları"
        value={sessions.length}
        color="#1d4ed8"
    />

    <SummaryCard
        title="Aktif Arşiv"
        value={sessions.length + certificates.length}
        color="#92400e"
    />

</div>

        <SectionTitle
          title="Son Eğitim Oturumları"
          subtitle="Katılımcı listesi ve çıktı işlemleriyle birlikte son oturumlar."
        />

        <SessionArchive
          sessions={sessions.slice(0, 6)}
          onPrint={onPrintSession}
        />
      </section>

      <section>
        <SectionTitle
          title="Son Sertifikalar"
          subtitle="Çalışan bazlı sertifika arşivi."
        />

        <CertificateTable
          records={certificates.slice(0, 8)}
        />
      </section>
    </div>
  );
}

function SessionArchive({
  sessions,
  onPrint,
}: {
  sessions: TrainingSession[];
  onPrint: (
    session: TrainingSession
  ) => void;
}) {
  if (!sessions.length) {
    return (
      <Empty text="Eğitim oturumu bulunamadı." />
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
      }}
    >


        
      {sessions.map((session) => (
        <article
          key={session.key}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            padding: 16,
            background: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent:
                "space-between",
              gap: 14,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color: "#0f172a",
                }}
              >
                {session.trainingTitle}
              </h3>

              <div
                style={{
                  marginTop: 6,
                  color: "#64748b",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                {formatDate(
                  session.trainingDate
                )}
                {" • "}
                {session.trainingTimeText ||
                  "Saat belirtilmedi"}
                {" • "}
                {session.trainingPlace ||
                  "Yer belirtilmedi"}
              </div>

              <div
                style={{
                  marginTop: 6,
                  color: "#475569",
                  fontSize: 13,
                }}
              >
                Eğitmen:{" "}
                <strong>
                  {session.trainerName ||
                    "-"}
                </strong>
                {session.trainerRole
                  ? ` • ${session.trainerRole}`
                  : ""}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onPrint(session)
              }
              style={{
                minHeight: 40,
                borderRadius: 11,
                border:
                  "1px solid #bfdbfe",
                background: "#eff6ff",
                color: "#1d4ed8",
                padding: "0 13px",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontWeight: 850,
                cursor: "pointer",
              }}
            >
              <Printer size={16} />
              Katılım Formu / PDF
            </button>
          </div>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Pill
              label={`Katılımcı: ${session.participantCount}`}
            />
            <Pill
              label={`Tamamlayan: ${session.completedCount}`}
            />
            <Pill
              label={`Süre: ${session.durationMinutes || 0} dk`}
            />
            <Pill
              label={
                session.trainingType ||
                "Tür belirtilmedi"
              }
            />
          </div>

          <details
            style={{
              marginTop: 14,
              borderTop:
                "1px solid #eef2f7",
              paddingTop: 12,
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                color: "#7f1d1d",
                fontWeight: 850,
              }}
            >
              Katılımcıları Göster
            </summary>

            <div
              style={{
                marginTop: 10,
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: 650,
                  borderCollapse:
                    "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f8fafc",
                    }}
                  >
                    {[
                      "Çalışan",
                      "Sicil",
                      "Durum",
                      "Geçerlilik",
                    ].map((header) => (
                      <th
                        key={header}
                        style={headerStyle}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {session.records.map(
                    (record) => (
                      <tr
                        key={record.id}
                        style={{
                          borderBottom:
                            "1px solid #eef2f7",
                        }}
                      >
                        <StrongCell>
                          {
                            record.employeeName
                          }
                        </StrongCell>
                        <Cell>
                          {record.employeeRegistryNo ||
                            "-"}
                        </Cell>
                        <Cell>
                          {record.completed
                            ? "Tamamlandı"
                            : "Bekliyor"}
                        </Cell>
                        <Cell>
                          {formatDate(
                            record.validUntil
                          )}
                        </Cell>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </details>
        </article>
      ))}
    </div>
  );
}

function ParticipantTable({
  records,
}: {
  records: TrainingRecord[];
}) {
  if (!records.length) {
    return (
      <Empty text="Katılımcı kaydı bulunamadı." />
    );
  }

  return (
    <Table
      headers={[
        "Çalışan",
        "Eğitim",
        "Tarih",
        "Eğitmen",
        "Yer",
        "Süre",
        "Durum",
        "Geçerlilik",
      ]}
    >
      {records.map((item) => {
        const state = validity(
          item.validUntil
        );

        return (
          <tr
            key={item.id}
            style={{
              borderBottom:
                "1px solid #eef2f7",
            }}
          >
            <StrongCell>
              {item.employeeName}
              <small>
                {item.employeeRegistryNo ||
                  "-"}
              </small>
            </StrongCell>

            <Cell>
              {item.trainingTitle}
            </Cell>
            <Cell>
              {formatDate(
                item.trainingDate
              )}
            </Cell>
            <Cell>
              {item.trainerName || "-"}
            </Cell>
            <Cell>
              {item.trainingPlace || "-"}
            </Cell>
            <Cell>
              {item.durationMinutes
                ? `${item.durationMinutes} dk`
                : "-"}
            </Cell>
            <Cell>
              {item.completed
                ? "Tamamlandı"
                : "Bekliyor"}
            </Cell>
            <Cell>
              <Badge state={state} />
            </Cell>
          </tr>
        );
      })}
    </Table>
  );
}

function DocumentArchive({
  records,
  sessions,
  archiveFiles,
  uploadingKey,
  onPrintSession,
  onUpload,
}: {
  records: TrainingRecord[];
  sessions: TrainingSession[];
  archiveFiles: ArchiveFile[];
  uploadingKey: string;
  onPrintSession: (
    session: TrainingSession
  ) => void;
  onUpload: (args: {
    file: File;
    documentType:
      | "ATTENDANCE_SIGNED"
      | "CERTIFICATE_SIGNED";
    session: TrainingSession;
    employeeRemoteId?: string;
  }) => Promise<void>;
}) {
  if (!records.length) {
    return (
      <Empty text="Eğitim dokümanı veya katılım kaydı bulunamadı." />
    );
  }

  const signedAttendanceCount =
    archiveFiles.filter(
      (file) =>
        file.document_type ===
        "ATTENDANCE_SIGNED"
    ).length;

  const signedCertificateCount =
    archiveFiles.filter(
      (file) =>
        file.document_type ===
        "CERTIFICATE_SIGNED"
    ).length;

  return (
    <div
      style={{
        display: "grid",
        gap: 18,
      }}
    >
      <section>
        <SectionTitle
          title="Oturum Katılım Formları"
          subtitle="Her eğitim oturumu için tüm katılımcıları içeren formu oluşturun ve imzalı nüshasını arşivleyin."
        />

        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {sessions.map((session) => {
            const signedFile =
              archiveFiles.find(
                (file) =>
                  file.document_type ===
                    "ATTENDANCE_SIGNED" &&
                  file.session_key === session.key
              );

            const uploadKey = [
              "ATTENDANCE_SIGNED",
              session.key,
              "",
            ].join("|");

            return (
              <article
                key={session.key}
                style={{
                  border:
                    "1px solid #e2e8f0",
                  borderRadius: 17,
                  padding: 15,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent:
                      "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong>
                      {session.trainingTitle}
                    </strong>

                    <div
                      style={{
                        marginTop: 5,
                        color: "#64748b",
                        fontSize: 12,
                      }}
                    >
                      {formatDate(
                        session.trainingDate
                      )}{" "}
                      • {session.participantCount}{" "}
                      katılımcı
                    </div>
                  </div>

                  <div className="archiveActions">
                    <button
                      type="button"
                      className="archiveButton primary"
                      onClick={() =>
                        onPrintSession(session)
                      }
                    >
                      <Printer size={15} />
                      Katılım Formu Oluştur
                    </button>

                    <FileUploadButton
                      label={
                        signedFile
                          ? "İmzalı Formu Değiştir"
                          : "İmzalı Form Yükle"
                      }
                      loading={
                        uploadingKey === uploadKey
                      }
                      onFile={(file) =>
                        onUpload({
                          file,
                          documentType:
                            "ATTENDANCE_SIGNED",
                          session,
                        })
                      }
                    />

                    {signedFile ? (
                      <a
                        className="archiveButton success"
                        href={signedFile.public_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        İmzalı Formu Aç
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Belge Muhafaza Durumu"
          subtitle="Oluşturulan çıktılar ile imzalanıp sisteme geri yüklenen nihai nüshaların durumu."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(190px,1fr))",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <SummaryCard
            title="Eğitim Dokümanı"
            value={
              records.filter(
                (item) => item.documentUri
              ).length
            }
            color="#2563eb"
          />

          <SummaryCard
            title="İmzalı Katılım Formu"
            value={signedAttendanceCount}
            color="#16a34a"
          />

          <SummaryCard
            title="İmzalı Sertifika"
            value={signedCertificateCount}
            color="#92400e"
          />
        </div>

        <Table
          headers={[
            "Çalışan",
            "Eğitim",
            "Eğitim Dokümanı",
            "Kayıtlı Katılım Formu",
            "Kayıtlı Sertifika",
          ]}
        >
          {records.map((item) => (
            <tr
              key={item.id}
              style={{
                borderBottom:
                  "1px solid #eef2f7",
              }}
            >
              <StrongCell>
                {item.employeeName}
              </StrongCell>
              <Cell>{item.trainingTitle}</Cell>
              <Cell>
                <DocumentLink
                  value={item.documentUri}
                />
              </Cell>
              <Cell>
                {archiveFiles.some(
                  (file) =>
                    file.document_type ===
                      "ATTENDANCE_SIGNED" &&
                    file.session_key ===
                      sessionKey(item)
                ) ? (
                  <span
                    style={{
                      color: "#15803d",
                      fontWeight: 850,
                    }}
                  >
                    ✓ Kayıtlı
                  </span>
                ) : (
                  <span
                    style={{
                      color: "#94a3b8",
                      fontWeight: 700,
                    }}
                  >
                    -
                  </span>
                )}
              </Cell>

              <Cell>
                {archiveFiles.some(
                  (file) =>
                    file.document_type ===
                      "CERTIFICATE_SIGNED" &&
                    file.session_key ===
                      sessionKey(item) &&
                    file.employee_remote_id ===
                      item.employeeRemoteId
                ) ? (
                  <span
                    style={{
                      color: "#15803d",
                      fontWeight: 850,
                    }}
                  >
                    ✓ Kayıtlı
                  </span>
                ) : (
                  <span
                    style={{
                      color: "#94a3b8",
                      fontWeight: 700,
                    }}
                  >
                    -
                  </span>
                )}
              </Cell>
            </tr>
          ))}
        </Table>
      </section>
    </div>
  );
}

function FileUploadButton({
  label,
  loading,
  onFile,
}: {
  label: string;
  loading: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label
      className="archiveButton upload"
      style={{
        opacity: loading ? 0.65 : 1,
        pointerEvents: loading
          ? "none"
          : "auto",
      }}
    >
      {loading ? (
        <Loader2
          size={15}
          className="spin"
        />
      ) : (
        <Upload size={15} />
      )}

      {loading ? "Yükleniyor..." : label}

      <input
        type="file"
        hidden
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={(event) => {
          const file =
            event.currentTarget.files?.[0];

          if (file) {
            onFile(file);
          }

          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function CertificateArchive({
  sessions,
  archiveFiles,
  companyId,
  uploadingKey,
  onUpload,
}: {
  sessions: TrainingSession[];
  archiveFiles: ArchiveFile[];
  companyId: string;
  uploadingKey: string;
  onUpload: (args: {
    file: File;
    documentType:
      | "ATTENDANCE_SIGNED"
      | "CERTIFICATE_SIGNED";
    session: TrainingSession;
    employeeRemoteId?: string;
  }) => Promise<void>;
}) {
  const completedRows = sessions.flatMap(
    (session) =>
      session.records
        .filter((record) => record.completed)
        .map((record) => ({
          session,
          record,
        }))
  );

  if (!completedRows.length) {
    return (
      <Empty text="Belge oluşturulabilecek tamamlanmış eğitim kaydı bulunamadı." />
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
      }}
    >
      <SectionTitle
        title="Çalışan Eğitim Belgeleri"
        subtitle="Her tamamlanmış eğitim için çalışan adına ayrı belge oluşturun; imzalı nihai nüshayı aynı satırdan yükleyin."
      />

      {completedRows.map(
        ({ session, record }) => {
          const signedFile =
            archiveFiles.find(
              (file) =>
                file.document_type ===
                  "CERTIFICATE_SIGNED" &&
                file.session_key ===
                  session.key &&
                file.employee_remote_id ===
                  record.employeeRemoteId
            );

          const uploadKey = [
            "CERTIFICATE_SIGNED",
            session.key,
            record.employeeRemoteId,
          ].join("|");

          const certificateQuery =
            new URLSearchParams({
              firmId: companyId,
              sessionKey: session.key,
              employeeRemoteId:
                record.employeeRemoteId,
            });

          return (
            <article
              key={`${session.key}-${record.id}`}
              style={{
                border:
                  "1px solid #e2e8f0",
                borderRadius: 18,
                padding: 16,
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent:
                    "space-between",
                  gap: 14,
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      color: "#0f172a",
                    }}
                  >
                    {record.employeeName}
                  </h3>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#64748b",
                      fontSize: 13,
                    }}
                  >
                    {session.trainingTitle}
                    {" • "}
                    {formatDate(
                      session.trainingDate
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      color: "#475569",
                      fontSize: 12,
                    }}
                  >
                    Sicil:{" "}
                    {record.employeeRegistryNo ||
                      "-"}
                  </div>
                </div>

                <div className="archiveActions">
                  <a
                    className="archiveButton primary"
                    href={`/api/admin/documentation/training-documents/certificate?${certificateQuery.toString()}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Award size={15} />
                    Belge Oluştur
                  </a>

                  <FileUploadButton
                    label={
                      signedFile
                        ? "İmzalı Belgeyi Değiştir"
                        : "İmzalı Belge Yükle"
                    }
                    loading={
                      uploadingKey === uploadKey
                    }
                    onFile={(file) =>
                      onUpload({
                        file,
                        documentType:
                          "CERTIFICATE_SIGNED",
                        session,
                        employeeRemoteId:
                          record.employeeRemoteId,
                      })
                    }
                  />

                  {signedFile ? (
                    <a
                      className="archiveButton success"
                      href={signedFile.public_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      İmzalı Belgeyi Aç
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          );
        }
      )}
    </div>
  );
}

function DocumentLink({
  value,
}: {
  value: string;
}) {
  if (!value) {
    return <span>-</span>;
  }

  if (!isWebUrl(value)) {
    return (
      <span
        title={value}
        style={{
          color: "#b45309",
          fontWeight: 800,
        }}
      >
        App cihazında
      </span>
    );
  }

  const shareDocument = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Eğitim Belgesi",
          url: value,
        });
        return;
      }

      await navigator.clipboard.writeText(value);
      window.alert("Belge bağlantısı panoya kopyalandı.");
    } catch (shareError) {
      if (
        shareError instanceof DOMException &&
        shareError.name === "AbortError"
      ) {
        return;
      }

      window.alert("Belge bağlantısı paylaşılamadı.");
    }
  };

  return (
    <div className="documentActions">
      <a
        className="documentAction"
        href={value}
        target="_blank"
        rel="noreferrer"
      >
        <ExternalLink size={14} />
        Görüntüle
      </a>

      <a
        className="documentAction"
        href={value}
        download
      >
        <Download size={14} />
        İndir
      </a>

      <button
        type="button"
        className="documentAction"
        onClick={() => void shareDocument()}
      >
        <Share2 size={14} />
        Paylaş
      </button>
    </div>
  );
}

function CertificateTable({
  records,
}: {
  records: CertificateRecord[];
}) {
  if (!records.length) {
    return (
      <Empty text="Sertifika kaydı bulunamadı." />
    );
  }

  return (
    <Table
      headers={[
        "Çalışan",
        "Eğitim",
        "Sertifika No",
        "Düzenlenme",
        "Geçerlilik",
        "Durum",
        "Dosya",
      ]}
    >
      {records.map((item) => {
        const state = validity(
          item.validUntil
        );

        return (
          <tr
            key={item.id}
            style={{
              borderBottom:
                "1px solid #eef2f7",
            }}
          >
            <StrongCell>
              {item.employeeName}
              <small>
                {item.employeeRegistryNo ||
                  "-"}
              </small>
            </StrongCell>
            <Cell>
              {item.trainingTitle}
            </Cell>
            <Cell>
              {item.certificateNo || "-"}
            </Cell>
            <Cell>
              {formatDate(item.issueDate)}
            </Cell>
            <Cell>
              {formatDate(
                item.validUntil
              )}
            </Cell>
            <Cell>
              <Badge state={state} />
            </Cell>
            <Cell>
              <DocumentLink
                value={item.remoteFileUrl}
              />
            </Cell>
          </tr>
        );
      })}
    </Table>
  );
}

function WarningArea({
  trainings,
  certificates,
}: {
  trainings: TrainingRecord[];
  certificates: CertificateRecord[];
}) {
  const allWarnings = [
    ...trainings.map((item) => ({
      id: `training-${item.id}`,
      title: item.trainingTitle,
      subtitle: `${item.employeeName} • Eğitim Katılımı`,
      validUntil: item.validUntil,
    })),

    ...certificates.map((item) => ({
      id: `certificate-${item.id}`,
      title: item.trainingTitle,
      subtitle: `${item.employeeName} • Sertifika ${
        item.certificateNo || ""
      }`,
      validUntil: item.validUntil,
    })),
  ];

  const expiredCount = allWarnings.filter(
    (item) =>
      validity(item.validUntil).key ===
      "EXPIRED"
  ).length;

  const sevenDayCount = allWarnings.filter(
    (item) => {
      if (!item.validUntil) return false;

      const today = new Date();
      const target = new Date(
        item.validUntil
      );

      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);

      const days = Math.ceil(
        (target.getTime() -
          today.getTime()) /
          86400000
      );

      return days >= 0 && days <= 7;
    }
  ).length;

  const fifteenDayCount =
    allWarnings.filter((item) => {
      if (!item.validUntil) return false;

      const today = new Date();
      const target = new Date(
        item.validUntil
      );

      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);

      const days = Math.ceil(
        (target.getTime() -
          today.getTime()) /
          86400000
      );

      return days > 7 && days <= 15;
    }).length;

  const thirtyDayCount =
    allWarnings.filter((item) => {
      if (!item.validUntil) return false;

      const today = new Date();
      const target = new Date(
        item.validUntil
      );

      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);

      const days = Math.ceil(
        (target.getTime() -
          today.getTime()) /
          86400000
      );

      return days > 15 && days <= 30;
    }).length;

  if (!allWarnings.length) {
    return (
      <Empty text="Aktif süre uyarısı bulunmuyor." />
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 18,
      }}
    >
      <section>
        <SectionTitle
          title="Süre Uyarıları"
          subtitle="Eğitim ve sertifika geçerlilik sürelerini kritik eşiklere göre takip edin."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(200px,1fr))",
            gap: 14,
          }}
        >
          <SummaryCard
            title="Süresi Geçen"
            value={expiredCount}
            color="#b91c1c"
          />

          <SummaryCard
            title="7 Gün İçinde"
            value={sevenDayCount}
            color="#991b1b"
          />

          <SummaryCard
            title="15 Gün İçinde"
            value={fifteenDayCount}
            color="#d97706"
          />

          <SummaryCard
            title="30 Gün İçinde"
            value={thirtyDayCount}
            color="#ca8a04"
          />
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: 12,
        }}
      >
        {trainings.map((item) => (
          <Warning
            key={`training-${item.id}`}
            title={item.trainingTitle}
            subtitle={`${item.employeeName} • Eğitim Katılımı`}
            date={item.validUntil}
          />
        ))}

        {certificates.map((item) => (
          <Warning
            key={`certificate-${item.id}`}
            title={item.trainingTitle}
            subtitle={`${item.employeeName} • Sertifika ${
              item.certificateNo || ""
            }`}
            date={item.validUntil}
          />
        ))}
      </section>
    </div>
  );
}

function Warning({
  title,
  subtitle,
  date,
}: {
  title: string;
  subtitle: string;
  date: number | null;
}) {
  const state = validity(date);

  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${state.border}`,
        background: state.background,
        padding: 15,
        display: "flex",
        flexWrap: "wrap",
        justifyContent:
          "space-between",
        alignItems: "center",
        gap: 12,
        boxShadow:
          "0 8px 20px rgba(15,23,42,.05)",
      }}
    >
      <div>
        <strong>{title}</strong>

        <div
          style={{
            marginTop: 5,
            color: "#64748b",
            fontSize: 13,
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            marginTop: 7,
            color: state.color,
            fontSize: 13,
            fontWeight: 850,
          }}
        >
          Son Geçerlilik Tarihi:{" "}
          {formatDate(date)}
        </div>
      </div>

      <Badge state={state} />
    </div>
  );
}

function Badge({
  state,
}: {
  state: ReturnType<typeof validity>;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        marginTop: 4,
        borderRadius: 999,
        padding: "5px 8px",
        color: state.color,
        background: state.background,
        border: `1px solid ${state.border}`,
        fontSize: 11,
        fontWeight: 900,
        whiteSpace: "nowrap",
      }}
    >
      {state.label}
    </span>
  );
}

function Pill({
  label,
}: {
  label: string;
}) {
  return (
    <span
      style={{
        borderRadius: 999,
        padding: "6px 9px",
        color: "#475569",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        fontSize: 11,
        fontWeight: 850,
      }}
    >
      {label}
    </span>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        marginBottom: 13,
      }}
    >
      <h2
        style={{
          margin: 0,
          color: "#0f172a",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: "5px 0 0",
          color: "#64748b",
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        overflowX: "auto",
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: 1000,
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#f8fafc",
            }}
          >
            {headers.map((item) => (
              <th
                key={item}
                style={headerStyle}
              >
                {item}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Cell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td style={cellStyle}>
      {children}
    </td>
  );
}

function StrongCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td style={strongCellStyle}>
      {children}
    </td>
  );
}

function SummaryCard({
    title,
    value,
    color,
}:{
    title:string;
    value:number;
    color:string;
}){

    return(

        <div
            style={{
                borderRadius:18,
                background:"#fff",
                border:`2px solid ${color}`,
                padding:18,
            }}
        >

            <div
                style={{
                    color:"#64748b",
                    fontWeight:700,
                    fontSize:13,
                }}
            >
                {title}
            </div>

            <div
                style={{
                    marginTop:10,
                    fontSize:32,
                    color,
                    fontWeight:900,
                }}
            >
                {value}
            </div>

        </div>

    )

}

function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <div
      style={{
        minHeight: 220,
        display: "grid",
        placeItems: "center",
        color: "#64748b",
        fontWeight: 850,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  padding: "12px 10px",
  textAlign: "left",
  color: "#475569",
  fontSize: 12,
  fontWeight: 900,
};

const cellStyle: React.CSSProperties = {
  padding: "13px 10px",
  color: "#475569",
  fontSize: 13,
};

const strongCellStyle: React.CSSProperties = {
  ...cellStyle,
  color: "#0f172a",
  fontWeight: 900,
};