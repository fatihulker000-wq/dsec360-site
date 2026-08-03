"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Building2,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Company = { id: string; name: string };
type Employee = { id: string; fullName: string; registryNo: string; jobTitle: string };
type TrainingRecord = {
  id: string;
  employeeRemoteId: string;
  employeeName: string;
  employeeRegistryNo: string;
  trainingTitle: string;
  trainingType: string;
  trainingDate: number | null;
  validUntil: number | null;
  trainerName: string;
  trainingPlace: string;
  durationMinutes: number;
  completed: boolean;
  hasDocument: boolean;
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
    is_active?: boolean | null;
  }>;
  error?: string;
  message?: string;
};
type ActiveTab = "DASHBOARD" | "TRAININGS" | "CERTIFICATES" | "WARNINGS";

function formatDate(value: number | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function validity(value: number | null) {
  if (!value) {
    return { key: "NO_DATE", label: "Tarih Yok", color: "#475569", bg: "#f8fafc", border: "#cbd5e1" };
  }

  const today = new Date();
  const target = new Date(value);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const days = Math.ceil((target.getTime() - today.getTime()) / 86400000);

  if (days < 0) {
    return { key: "EXPIRED", label: "Süresi Doldu", color: "#991b1b", bg: "#fef2f2", border: "#fecaca" };
  }

  if (days <= 40) {
    return { key: "EXPIRING", label: `${days} Gün Kaldı`, color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" };
  }

  return { key: "VALID", label: "Geçerli", color: "#047857", bg: "#ecfdf5", border: "#a7f3d0" };
}

export default function TrainingDocumentsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [trainings, setTrainings] = useState<TrainingRecord[]>([]);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [tab, setTab] = useState<ActiveTab>("DASHBOARD");
  const [employeeId, setEmployeeId] = useState("");
  const [trainingTitle, setTrainingTitle] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      const response = await fetch("/api/admin/companies", {
        credentials: "include",
        cache: "no-store",
      });
      const json: CompaniesResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.error || json.message || "Firmalar alınamadı.");
      }

      const rows = (Array.isArray(json.data) ? json.data : [])
        .map((item): Company => ({
          id: String(item.id || "").trim(),
          name: String(item.name || item.title || item.company_name || "").trim(),
        }))
        .filter((item) => item.id && item.name)
        .sort((a, b) => a.name.localeCompare(b.name, "tr"));

      setCompanies(rows);
      setCompanyId((current) => current || rows[0]?.id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Firmalar yüklenemedi.");
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    if (!companyId) {
      setEmployees([]);
      setTrainings([]);
      setCertificates([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const query = new URLSearchParams({ firmId: companyId });
      const response = await fetch(
        `/api/admin/documentation/training-documents?${query.toString()}`,
        { credentials: "include", cache: "no-store" }
      );
      const json: ApiResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.detail || json.error || "Kayıtlar alınamadı.");
      }

      setEmployees(Array.isArray(json.employees) ? json.employees : []);
      setTrainings(Array.isArray(json.trainings) ? json.trainings : []);
      setCertificates(Array.isArray(json.certificates) ? json.certificates : []);
    } catch (e) {
      setEmployees([]);
      setTrainings([]);
      setCertificates([]);
      setError(e instanceof Error ? e.message : "Kayıtlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => void loadCompanies(), [loadCompanies]);
  useEffect(() => void loadRecords(), [loadRecords]);

  const refresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadCompanies(), loadRecords()]);
    } finally {
      setRefreshing(false);
    }
  };

  const titles = useMemo(
    () =>
      Array.from(
        new Set([
          ...trainings.map((item) => item.trainingTitle),
          ...certificates.map((item) => item.trainingTitle),
        ])
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "tr")),
    [trainings, certificates]
  );

  const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");

  const filteredTrainings = useMemo(
    () =>
      trainings.filter((item) => {
        const state = validity(item.validUntil);
        return (
          (!employeeId || item.employeeRemoteId === employeeId) &&
          (!trainingTitle || item.trainingTitle === trainingTitle) &&
          (!status ||
            (status === "COMPLETED" && item.completed) ||
            (status === "PENDING" && !item.completed) ||
            state.key === status) &&
          (!normalizedSearch ||
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
              .includes(normalizedSearch))
        );
      }),
    [trainings, employeeId, trainingTitle, status, normalizedSearch]
  );

  const filteredCertificates = useMemo(
    () =>
      certificates.filter((item) => {
        const state = validity(item.validUntil);
        return (
          (!employeeId || item.employeeRemoteId === employeeId) &&
          (!trainingTitle || item.trainingTitle === trainingTitle) &&
          (!status || state.key === status) &&
          (!normalizedSearch ||
            [
              item.employeeName,
              item.employeeRegistryNo,
              item.trainingTitle,
              item.certificateNo,
            ]
              .join(" ")
              .toLocaleLowerCase("tr-TR")
              .includes(normalizedSearch))
        );
      }),
    [certificates, employeeId, trainingTitle, status, normalizedSearch]
  );

  const metrics = useMemo(() => {
    const completed = trainings.filter((item) => item.completed).length;
    const expired =
      trainings.filter((item) => validity(item.validUntil).key === "EXPIRED").length +
      certificates.filter((item) => validity(item.validUntil).key === "EXPIRED").length;
    const expiring =
      trainings.filter((item) => validity(item.validUntil).key === "EXPIRING").length +
      certificates.filter((item) => validity(item.validUntil).key === "EXPIRING").length;

    return {
      training: trainings.length,
      completed,
      pending: trainings.length - completed,
      certificate: certificates.length,
      expired,
      expiring,
      files:
        trainings.filter((item) => item.hasDocument).length +
        certificates.filter((item) => item.remoteFileUrl).length,
    };
  }, [trainings, certificates]);

  const warningsTrainings = filteredTrainings.filter((item) =>
    ["EXPIRED", "EXPIRING"].includes(validity(item.validUntil).key)
  );
  const warningsCertificates = filteredCertificates.filter((item) =>
    ["EXPIRED", "EXPIRING"].includes(validity(item.validUntil).key)
  );

  return (
    <main style={{ minHeight: "100vh", padding: 24, background: "linear-gradient(180deg,#f8fafc,#fff7ed)" }}>
      <div style={{ maxWidth: 1540, margin: "0 auto", display: "grid", gap: 18 }}>
        <section className="hero">
          <div className="heroTop">
            <div>
              <button className="backButton" onClick={() => (window.location.href = "/admin/documentation")}>
                <ArrowLeft size={16} />
                Dokümantasyona Dön
              </button>
              <h1>Eğitim Dokümanları</h1>
              <p>Eğitim katılımlarını, sertifikaları ve belge geçerliliklerini firma bazında yönetin.</p>
            </div>

            <button className="refreshButton" onClick={() => void refresh()} disabled={refreshing}>
              {refreshing ? <Loader2 size={17} className="spin" /> : <RefreshCw size={17} />}
              Yenile
            </button>
          </div>

          <div className="heroGrid">
            <Metric title="Toplam Eğitim" value={metrics.training} icon={<GraduationCap size={18} />} />
            <Metric title="Tamamlanan" value={metrics.completed} icon={<CheckCircle2 size={18} />} />
            <Metric title="Bekleyen" value={metrics.pending} icon={<Users size={18} />} />
            <Metric title="Sertifika" value={metrics.certificate} icon={<Award size={18} />} />
            <Metric title="Süresi Dolan" value={metrics.expired} icon={<AlertTriangle size={18} />} />
            <Metric title="40 Gün İçinde" value={metrics.expiring} icon={<FileText size={18} />} />
            <Metric title="Dosyalı Kayıt" value={metrics.files} icon={<FileText size={18} />} />
          </div>
        </section>

        {error ? <div className="error"><AlertTriangle size={18} />{error}</div> : null}

        <section className="toolbar">
          <div className="tabs">
            <Tab active={tab === "DASHBOARD"} label="Dashboard" onClick={() => setTab("DASHBOARD")} />
            <Tab active={tab === "TRAININGS"} label={`Katılımlar (${trainings.length})`} onClick={() => setTab("TRAININGS")} />
            <Tab active={tab === "CERTIFICATES"} label={`Sertifikalar (${certificates.length})`} onClick={() => setTab("CERTIFICATES")} />
            <Tab active={tab === "WARNINGS"} label={`Süre Uyarıları (${metrics.expired + metrics.expiring})`} onClick={() => setTab("WARNINGS")} />
          </div>

          <label className="company">
            <Building2 size={16} />
            <select
              value={companyId}
              disabled={loadingCompanies}
              onChange={(event) => {
                setCompanyId(event.target.value);
                setEmployeeId("");
                setTrainingTitle("");
                setStatus("");
              }}
            >
              {companies.length === 0 ? <option value="">Firma bulunamadı</option> : null}
              {companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
        </section>

        <section className="filters">
          <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
            <option value="">Tüm Çalışanlar</option>
            {employees.map((item) => (
              <option key={item.id} value={item.id}>
                {item.fullName}{item.registryNo ? ` • ${item.registryNo}` : ""}
              </option>
            ))}
          </select>

          <select value={trainingTitle} onChange={(event) => setTrainingTitle(event.target.value)}>
            <option value="">Tüm Eğitimler</option>
            {titles.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tüm Durumlar</option>
            <option value="COMPLETED">Tamamlandı</option>
            <option value="PENDING">Bekliyor</option>
            <option value="VALID">Geçerli</option>
            <option value="EXPIRING">40 Gün İçinde</option>
            <option value="EXPIRED">Süresi Doldu</option>
            <option value="NO_DATE">Tarih Yok</option>
          </select>

          <label className="search">
            <Search size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kayıt ara..." />
          </label>
        </section>

        <section className="content">
          {loading ? <div className="loading"><Loader2 size={22} className="spin" />Kayıtlar yükleniyor...</div> : null}

          {!loading && tab === "DASHBOARD" ? (
            <div style={{ display: "grid", gap: 20 }}>
              <SectionTitle title="Son Eğitim Katılımları" />
              <TrainingTable records={filteredTrainings.slice(0, 8)} />
              <SectionTitle title="Son Sertifikalar" />
              <CertificateTable records={filteredCertificates.slice(0, 8)} />
            </div>
          ) : null}

          {!loading && tab === "TRAININGS" ? <TrainingTable records={filteredTrainings} /> : null}
          {!loading && tab === "CERTIFICATES" ? <CertificateTable records={filteredCertificates} /> : null}
          {!loading && tab === "WARNINGS" ? (
            <WarningArea trainings={warningsTrainings} certificates={warningsCertificates} />
          ) : null}
        </section>
      </div>

      <style jsx>{`
        .hero{border-radius:28px;padding:25px;color:white;background:linear-gradient(135deg,#5f0f1b,#991b1b 48%,#d97706);box-shadow:0 24px 60px rgba(127,29,29,.22)}
        .heroTop,.toolbar{display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;align-items:center}
        .hero h1{font-size:34px;margin:17px 0 0;font-weight:950}.hero p{color:rgba(255,255,255,.86)}
        .backButton,.refreshButton{border:0;color:white;background:rgba(255,255,255,.13);border-radius:999px;padding:9px 13px;display:inline-flex;gap:7px;align-items:center;font-weight:850;cursor:pointer}
        .heroGrid{margin-top:22px;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px}
        .toolbar,.filters,.content{border:1px solid #e5e7eb;background:white;border-radius:20px;padding:13px;box-shadow:0 10px 28px rgba(15,23,42,.04)}
        .tabs{display:flex;flex-wrap:wrap;gap:8px}.company,.search{min-height:43px;border:1px solid #dbe3ec;border-radius:12px;display:flex;align-items:center;gap:8px;padding:0 11px}
        .company{min-width:300px}.company select,.search input{width:100%;border:0;outline:0;background:transparent}
        .filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) minmax(260px,1.2fr);gap:10px}.filters select{min-height:43px;border:1px solid #dbe3ec;border-radius:12px;padding:0 11px;background:white}
        .error{border:1px solid #fecaca;background:#fef2f2;color:#b91c1c;border-radius:16px;padding:14px;display:flex;gap:9px;font-weight:800}
        .loading{min-height:230px;display:flex;justify-content:center;align-items:center;gap:10px;color:#64748b;font-weight:800}
        .spin{animation:spin .9s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:1350px){.heroGrid{grid-template-columns:repeat(4,1fr)}.filters{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:760px){main{padding:12px!important}.heroGrid,.filters{grid-template-columns:1fr}.company{width:100%;min-width:0}}
      `}</style>
    </main>
  );
}

function Metric({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 17, padding: 15, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.12)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,.78)", fontSize: 12, fontWeight: 800 }}>{icon}{title}</div>
      <div style={{ marginTop: 7, fontSize: 25, fontWeight: 950 }}>{value}</div>
    </div>
  );
}

function Tab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        minHeight: 43,
        borderRadius: 12,
        border: active ? "1px solid #7f1d1d" : "1px solid transparent",
        background: active ? "#7f1d1d" : "#f8fafc",
        color: active ? "white" : "#475569",
        padding: "0 15px",
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 style={{ margin: 0, color: "#0f172a" }}>{title}</h2>;
}

function TrainingTable({ records }: { records: TrainingRecord[] }) {
  if (!records.length) return <Empty text="Eğitim katılım kaydı bulunamadı." />;

  return (
    <Table headers={["Çalışan","Eğitim","Tür","Tarih","Geçerlilik","Eğitmen","Yer","Süre","Durum","Doküman"]}>
      {records.map((item) => {
        const state = validity(item.validUntil);
        return (
          <tr key={item.id} style={{ borderBottom: "1px solid #eef2f7" }}>
            <StrongCell>{item.employeeName}<small>{item.employeeRegistryNo || "-"}</small></StrongCell>
            <Cell>{item.trainingTitle}</Cell><Cell>{item.trainingType || "-"}</Cell>
            <Cell>{formatDate(item.trainingDate)}</Cell><Cell>{formatDate(item.validUntil)}<Badge state={state} /></Cell>
            <Cell>{item.trainerName || "-"}</Cell><Cell>{item.trainingPlace || "-"}</Cell>
            <Cell>{item.durationMinutes ? `${item.durationMinutes} dk` : "-"}</Cell>
            <Cell>{item.completed ? "Tamamlandı" : "Bekliyor"}</Cell><Cell>{item.hasDocument ? "Var" : "-"}</Cell>
          </tr>
        );
      })}
    </Table>
  );
}

function CertificateTable({ records }: { records: CertificateRecord[] }) {
  if (!records.length) return <Empty text="Sertifika kaydı bulunamadı." />;

  return (
    <Table headers={["Çalışan","Eğitim","Sertifika No","Düzenlenme","Geçerlilik","Durum","Dosya"]}>
      {records.map((item) => {
        const state = validity(item.validUntil);
        return (
          <tr key={item.id} style={{ borderBottom: "1px solid #eef2f7" }}>
            <StrongCell>{item.employeeName}<small>{item.employeeRegistryNo || "-"}</small></StrongCell>
            <Cell>{item.trainingTitle}</Cell><Cell>{item.certificateNo || "-"}</Cell>
            <Cell>{formatDate(item.issueDate)}</Cell><Cell>{formatDate(item.validUntil)}</Cell>
            <Cell><Badge state={state} /></Cell>
            <Cell>{item.remoteFileUrl ? <a href={item.remoteFileUrl} target="_blank" rel="noreferrer">Görüntüle</a> : "-"}</Cell>
          </tr>
        );
      })}
    </Table>
  );
}

function WarningArea({ trainings, certificates }: { trainings: TrainingRecord[]; certificates: CertificateRecord[] }) {
  if (!trainings.length && !certificates.length) return <Empty text="Aktif süre uyarısı bulunmuyor." />;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {trainings.map((item) => <Warning key={`t-${item.id}`} title={item.trainingTitle} subtitle={`${item.employeeName} • Eğitim Katılımı`} date={item.validUntil} />)}
      {certificates.map((item) => <Warning key={`c-${item.id}`} title={item.trainingTitle} subtitle={`${item.employeeName} • Sertifika ${item.certificateNo || ""}`} date={item.validUntil} />)}
    </div>
  );
}

function Warning({ title, subtitle, date }: { title: string; subtitle: string; date: number | null }) {
  const state = validity(date);
  return (
    <div style={{ borderRadius: 18, border: `1px solid ${state.border}`, background: state.bg, padding: 15, display: "flex", justifyContent: "space-between", gap: 12 }}>
      <div><strong>{title}</strong><div style={{ color: "#64748b", marginTop: 4 }}>{subtitle}</div><div style={{ color: state.color, marginTop: 6 }}>Geçerlilik: {formatDate(date)}</div></div>
      <Badge state={state} />
    </div>
  );
}

function Badge({ state }: { state: ReturnType<typeof validity> }) {
  return <span style={{ display: "inline-flex", marginTop: 4, borderRadius: 999, padding: "5px 8px", color: state.color, background: state.bg, border: `1px solid ${state.border}`, fontSize: 11, fontWeight: 900 }}>{state.label}</span>;
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", minWidth: 1000, borderCollapse: "collapse" }}>
        <thead><tr style={{ background: "#f8fafc" }}>{headers.map((item) => <th key={item} style={{ padding: "12px 10px", textAlign: "left", color: "#475569", fontSize: 12 }}>{item}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "13px 10px", color: "#475569", fontSize: 13 }}>{children}</td>;
}

function StrongCell({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "13px 10px", color: "#0f172a", fontSize: 13, fontWeight: 900 }}>{children}</td>;
}

function Empty({ text }: { text: string }) {
  return <div style={{ minHeight: 220, display: "grid", placeItems: "center", color: "#64748b", fontWeight: 850 }}>{text}</div>;
}