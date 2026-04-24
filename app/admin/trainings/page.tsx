"use client";

import { useEffect, useMemo, useState } from "react";

type UserApiRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  company?: string | null;
  company_id?: string | null;
  role?: string | null;
  is_active?: boolean | null;
};

type TrainingApiRow = {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  type?: string | null;
  duration_minutes?: number | null;
  content_url?: string | null;
  topics_text?: string | null;
  assigned_count?: number | null;
  not_started_count?: number | null;
  in_progress_count?: number | null;
  completed_count?: number | null;
};

type CompanyApiRow = {
  id?: string | null;
  name?: string | null;
  is_active?: boolean | null;
};

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  company: string;
  role: string;
  is_active: boolean;
};

type TrainingRow = {
  id: string;
  title: string;
  description: string;
  type: string;
  duration_minutes: number | null;
  content_url: string;
  topics_text: string;
  assigned_count: number;
  not_started_count: number;
  in_progress_count: number;
  completed_count: number;
};

type AssignResponse = {
  success?: boolean;
  insertedCount?: number;
  skippedCount?: number;
  emailedCount?: number;
  mailFailedCount?: number;
  noEmailCount?: number;
  trainingTitle?: string | null;
  message?: string;
  mailResults?: Array<{
    userId: string;
    email: string | null;
    ok: boolean;
    reason?: string;
  }>;
  error?: string;
};

const BRAND = {
  bg: "#f7f8fb",
  white: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  red: "#c62828",
  redDark: "#5a0f1f",
  shadow: "0 10px 30px rgba(15,23,42,0.06)",
};

function getRoleLabel(role?: string | null) {
  if (role === "super_admin") return "Süper Admin";
  if (role === "company_admin") return "Firma Yöneticisi";
  if (role === "operator") return "Operatör";
  if (role === "training_user") return "Eğitim Kullanıcısı";
  return role || "-";
}

function buildCompanyLabel(user: UserApiRow) {
  if (user.company && user.company.trim()) {
    return user.company.trim();
  }

  return "❗ Firma yok";
}

function parseTopicsCount(topicsText?: string | null) {
  const raw = String(topicsText || "").trim();
  if (!raw) return 0;

  return raw
    .replace(/\r/g, "\n")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.replace(/^[-–—•]\s*/, "").trim())
    .filter(Boolean).length;
}

function cardStyle(): React.CSSProperties {
  return {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 18,
    background: BRAND.white,
    padding: 18,
    boxShadow: BRAND.shadow,
  };
}

function badgeStyle(
  bg: string,
  border: string,
  color: string
): React.CSSProperties {
  return {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    background: bg,
    border: `1px solid ${border}`,
    fontSize: 12,
    fontWeight: 700,
    color,
  };
}

export default function AdminTrainingPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [trainingId, setTrainingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [selectedTrainingInfo, setSelectedTrainingInfo] =
    useState<TrainingRow | null>(null);
  const [assignSummary, setAssignSummary] = useState<AssignResponse | null>(null);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
const [previewErrors, setPreviewErrors] = useState<Record<number, string[]>>({});
const [previewReady, setPreviewReady] = useState(false);
const [previewLoading, setPreviewLoading] = useState(false);

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<string>("");

  const loadAll = async () => {
    try {
      setError("");
      setLoading(true);

      const [usersRes, trainingsRes, companiesRes] = await Promise.all([
        fetch("/api/admin/users", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/admin/trainings", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/admin/companies", {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      if (
        usersRes.status === 401 ||
        trainingsRes.status === 401 ||
        companiesRes.status === 401
      ) {
        window.location.href = "/admin/login";
        return;
      }

      const usersJson = await usersRes.json();
      const trainingsJson = await trainingsRes.json();
      const companiesJson = await companiesRes.json();

      if (!usersRes.ok) {
        throw new Error(usersJson?.error || "Kullanıcı listesi alınamadı.");
      }

      if (!trainingsRes.ok) {
        throw new Error(trainingsJson?.error || "Eğitim listesi alınamadı.");
      }

      if (!companiesRes.ok) {
        throw new Error(companiesJson?.error || "Firma listesi alınamadı.");
      }

      const normalizedUsers: UserRow[] = Array.isArray(usersJson?.data)
        ? usersJson.data.map((u: UserApiRow) => ({
            id: String(u.id || ""),
            full_name: (u.full_name || "Adsız Kullanıcı").trim(),
            email: (u.email || "-").trim(),
            company: buildCompanyLabel(u),
            role: getRoleLabel(u.role),
            is_active: Boolean(u.is_active),
          }))
        : [];

      const normalizedTrainings: TrainingRow[] = Array.isArray(trainingsJson?.data)
        ? trainingsJson.data.map((t: TrainingApiRow) => ({
            id: String(t.id || ""),
            title: (t.title || "Adsız Eğitim").trim(),
            description: (t.description || "Açıklama bulunmuyor.").trim(),
            type: (t.type || "online").trim(),
            duration_minutes:
              typeof t.duration_minutes === "number" ? t.duration_minutes : null,
            content_url: (t.content_url || "").trim(),
            topics_text: (t.topics_text || "").trim(),
            assigned_count:
              typeof t.assigned_count === "number" ? t.assigned_count : 0,
            not_started_count:
              typeof t.not_started_count === "number" ? t.not_started_count : 0,
            in_progress_count:
              typeof t.in_progress_count === "number" ? t.in_progress_count : 0,
            completed_count:
              typeof t.completed_count === "number" ? t.completed_count : 0,
          }))
        : [];

      const normalizedCompanies: string[] = Array.isArray(companiesJson?.data)
        ? companiesJson.data
            .filter((c: CompanyApiRow) => (c?.is_active ?? true) === true)
            .map((c: CompanyApiRow) => String(c?.name || "").trim())
            .filter(Boolean)
            .sort((a: string, b: string) => a.localeCompare(b, "tr"))
        : [];

      setUsers(normalizedUsers);
      setTrainings(normalizedTrainings);
      setCompanies(normalizedCompanies);
    } catch (err) {
      console.error(err);
      setUsers([]);
      setTrainings([]);
      setCompanies([]);
      setError(
        err instanceof Error ? err.message : "Veriler alınırken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const found = trainings.find((t) => t.id === trainingId) || null;
    setSelectedTrainingInfo(found);
  }, [trainingId, trainings]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const text = `${u.full_name} ${u.email} ${u.company} ${u.role}`.toLowerCase();
      const matchesSearch = !search || text.includes(search.toLowerCase());
      const matchesCompany =
        companyFilter === "all" ? true : u.company === companyFilter;

      return matchesSearch && matchesCompany;
    });
  }, [users, search, companyFilter]);

  const selectedCount = selectedUsers.length;

  const allFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedUsers.includes(u.id));

  const selectedUserDetails = useMemo(() => {
    const selectedSet = new Set(selectedUsers);
    return users.filter((u) => selectedSet.has(u.id));
  }, [users, selectedUsers]);

  const selectedCompanyCount = useMemo(() => {
    return new Set(selectedUserDetails.map((u) => u.company)).size;
  }, [selectedUserDetails]);

  const selectedWithoutEmailCount = useMemo(() => {
    return selectedUserDetails.filter((u) => !u.email || u.email === "-").length;
  }, [selectedUserDetails]);

  const trainingTotals = useMemo(() => {
    const totalAssigned = trainings.reduce((sum, t) => sum + t.assigned_count, 0);
    const totalNotStarted = trainings.reduce(
      (sum, t) => sum + t.not_started_count,
      0
    );
    const totalInProgress = trainings.reduce(
      (sum, t) => sum + t.in_progress_count,
      0
    );
    const totalCompleted = trainings.reduce(
      (sum, t) => sum + t.completed_count,
      0
    );

    return {
      totalAssigned,
      totalNotStarted,
      totalInProgress,
      totalCompleted,
    };
  }, [trainings]);

  const toggleUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    } else {
      setSelectedUsers((prev) => prev.filter((x) => x !== userId));
    }
  };

  const toggleAllFiltered = (checked: boolean) => {
    if (checked) {
      const filteredIds = filteredUsers.map((u) => u.id);
      setSelectedUsers((prev) => Array.from(new Set([...prev, ...filteredIds])));
    } else {
      const filteredIdSet = new Set(filteredUsers.map((u) => u.id));
      setSelectedUsers((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    }
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const assign = async () => {
    if (!trainingId) {
      alert("Önce eğitim seç.");
      return;
    }

    if (!selectedUsers.length) {
      alert("En az bir çalışan seç.");
      return;
    }

    try {
      setAssigning(true);
      setAssignSummary(null);

      const res = await fetch("/api/training/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          trainingId,
        }),
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const data: AssignResponse = await res.json();

      if (!res.ok) {
        setAssignSummary(data);
        alert(data?.error || "Eğitim atama başarısız.");
        return;
      }

      setAssignSummary(data);
      alert(data?.message || "Eğitim atandı ✅");
      setSelectedUsers([]);
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Sunucu hatası oluştu.");
    } finally {
      setAssigning(false);
    }
  };
  
  const downloadTemplate = () => {
  const csv =
    "full_name,email,password,company_id,is_active\n" +
    "Ali Veli,ali.veli@mail.com,123456,FIRMA_ID,true\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "dsec-egitim-katilimci-sablon.csv";
  a.click();

  URL.revokeObjectURL(url);
};

const parseFileForPreview = async (file: File) => {
  setPreviewLoading(true);
  setPreviewRows([]);
  setPreviewErrors({});
  setPreviewReady(false);

  try {
    let rows: any[] = [];

    if (file.name.endsWith(".csv")) {
      const text = await file.text();
      const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
      const headers = lines[0].split(",");

      rows = lines.slice(1).map((line) => {
        const values = line.split(",");
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h.trim()] = values[i]?.trim() || "";
        });
        return obj;
      });
    } else if (file.name.endsWith(".xlsx")) {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    }

    // 🔥 VALIDATION
    const errors: Record<number, string[]> = {};

    rows.forEach((row, index) => {
      const rowErrors: string[] = [];

      if (!row.full_name) rowErrors.push("Ad soyad eksik");
      if (!row.email) rowErrors.push("Email eksik");
      if (!row.password) rowErrors.push("Şifre eksik");
      if (!row.company_id) rowErrors.push("Firma eksik");

      if (rowErrors.length) {
        errors[index] = rowErrors;
      }
    });

    setPreviewRows(rows);
    setPreviewErrors(errors);
    setPreviewReady(true);

  } catch (err) {
    console.error(err);
    alert("Dosya okunamadı");
  } finally {
    setPreviewLoading(false);
  }
};

const uploadBulkParticipants = async () => {
  if (!bulkFile) {
    alert("Önce CSV veya Excel dosyası seç.");
    return;
  }

  const allowedTypes = [
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const isAllowedByName =
    bulkFile.name.endsWith(".csv") || bulkFile.name.endsWith(".xlsx");

  if (!allowedTypes.includes(bulkFile.type) && !isAllowedByName) {
    alert("Sadece CSV veya Excel (.xlsx) dosyası yükleyebilirsin.");
    return;
  }

  if (!previewReady) {
    alert("Önce dosyayı seç ve önizlemenin oluşmasını bekle.");
    return;
  }

  if (Object.keys(previewErrors).length > 0) {
    const ok = window.confirm(
      "Dosyada hatalı satırlar var. Yine de yüklemeye devam etmek istiyor musun?"
    );

    if (!ok) return;
  }

  try {
    setBulkUploading(true);
    setBulkResult("");

    const formData = new FormData();
    formData.append("file", bulkFile);

    const res = await fetch("/api/admin/training-users/bulk-upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json?.error || "Toplu yükleme başarısız.");
      setBulkResult(json?.error || "Toplu yükleme başarısız.");
setBulkErrors(json.errors || []);
return;
    }

    setBulkResult(
      `Yükleme tamamlandı. Eklenen: ${json.insertedCount || 0}, Atlanan: ${
        json.skippedCount || 0
      }`
    );

    setBulkFile(null);
    await loadAll();
  } catch (err) {
    console.error(err);
    alert("Toplu yükleme sırasında hata oluştu.");
  } finally {
    setBulkUploading(false);
  }
};

  return (
    <main
      style={{
        minHeight: "100%",
        background: BRAND.bg,
        padding: "clamp(12px, 2vw, 24px)",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        <div
          style={{
            ...cardStyle(),
            background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 100%)`,
            color: "#fff",
            marginBottom: 20,
            padding: "clamp(16px, 2.8vw, 28px)",
            borderRadius: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: 620 }}>
              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  fontSize: 12,
                  fontWeight: 900,
                  marginBottom: 12,
                }}
              >
                D-SEC Eğitim Yönetimi
              </div>

              <h1
                style={{
                  marginTop: 0,
                  marginBottom: 10,
                  fontSize: "clamp(24px, 5vw, 38px)",
                  fontWeight: 900,
                  lineHeight: 1.15,
                }}
              >
                Eğitim Atama Paneli
              </h1>

              <p
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.92)",
                  lineHeight: 1.7,
                  fontSize: "clamp(14px, 2.5vw, 16px)",
                }}
              >
                Eğitimleri merkezi olarak yönet, çalışanları filtrele, toplu atama yap ve
                tüm süreci tek ekrandan kontrol et.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
                minWidth: 160,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.12)",
                  padding: 14,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.9 }}>Seçili Çalışan</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{selectedCount}</div>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.12)",
                  padding: 14,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.9 }}>Toplam Eğitim</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{trainings.length}</div>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div
            style={{
              ...cardStyle(),
              marginBottom: 20,
              color: BRAND.red,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >

        <div style={{ ...cardStyle(), marginBottom: 20 }}>

  <div style={{ fontWeight: 900, marginBottom: 12 }}>
    Eğitim Performans Analizi
  </div>

  <div style={{ fontSize: 28, fontWeight: 900 }}>
    %{Math.round(
      (trainingTotals.totalCompleted /
        (trainingTotals.totalAssigned || 1)) *
        100
    )}
  </div>

  <div
    style={{
      height: 10,
      background: "#eee",
      borderRadius: 10,
      marginTop: 10,
    }}
  >
    <div
      style={{
        width: `${
          (trainingTotals.totalCompleted /
            (trainingTotals.totalAssigned || 1)) *
          100
        }%`,
        background: "#16a34a",
        height: "100%",
        borderRadius: 10,
      }}
    />
  </div>

  <div style={{ marginTop: 10, fontSize: 13 }}>
    Tamamlanan: {trainingTotals.totalCompleted}  
    Devam: {trainingTotals.totalInProgress}  
    Başlamayan: {trainingTotals.totalNotStarted}
  </div>

</div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.muted }}>Toplam Çalışan</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
              {users.length}
            </div>
          </div>
          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.muted }}>Toplam Eğitim</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
              {trainings.length}
            </div>
          </div>
          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.muted }}>Toplam Atama</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
              {trainingTotals.totalAssigned}
            </div>
          </div>
          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.muted }}>Seçili Çalışan</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
              {selectedCount}
            </div>
          </div>
        </div>

        <div
          style={{
            ...cardStyle(),
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              Eğitim
            </div>
            <select
              value={trainingId}
              onChange={(e) => setTrainingId(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                background: "#fff",
                fontSize: 14,
              }}
            >
              <option value="">Eğitim seç</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              border: `1px solid ${BRAND.border}`,
              borderRadius: 16,
              padding: 14,
              background: "#fafafa",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              Seçilen Eğitim Özeti
            </div>

            {selectedTrainingInfo ? (
              <>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 900,
                    lineHeight: 1.35,
                    wordBreak: "break-word",
                  }}
                >
                  {selectedTrainingInfo.title}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: BRAND.muted,
                    lineHeight: 1.6,
                  }}
                >
                  {selectedTrainingInfo.description}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <span style={badgeStyle("#f3f4f6", "#d1d5db", "#374151")}>
                    Tür: {selectedTrainingInfo.type}
                  </span>
                  <span style={badgeStyle("#eff6ff", "#bfdbfe", "#1d4ed8")}>
                    Süre:{" "}
                    {typeof selectedTrainingInfo.duration_minutes === "number"
                      ? `${selectedTrainingInfo.duration_minutes} dk`
                      : "Tanımlı değil"}
                  </span>
                  <span style={badgeStyle("#f0fdf4", "#86efac", "#166534")}>
                    Konu: {parseTopicsCount(selectedTrainingInfo.topics_text)}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: BRAND.muted }}>
                Henüz eğitim seçilmedi.
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            ...cardStyle(),
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              Ara
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ad soyad, e-posta, rol veya firma ara..."
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              Firma
            </div>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                background: "#fff",
                fontSize: 14,
              }}
            >
              <option value="all">Tüm Firmalar</option>
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
        </div>
      
     <div style={{ ...cardStyle(), marginBottom: 20 }}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: 14,
    }}
  >
    <div>
      <div style={{ fontWeight: 900, fontSize: 18 }}>
        Toplu Katılımcı Yükleme
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: BRAND.muted }}>
        CSV veya Excel dosyası yükleyerek eğitim katılımcılarını toplu oluştur.
      </div>
    </div>

    <button
      type="button"
      onClick={downloadTemplate}
      style={{
        border: "none",
        borderRadius: 10,
        padding: "10px 14px",
        background: "#111827",
        color: "#fff",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      Şablon İndir
    </button>
  </div>

  <div
    onDragOver={(e) => e.preventDefault()}
    onDrop={(e) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];

      if (file) {
        setBulkFile(file);
        void parseFileForPreview(file);
      }
    }}
    style={{
      border: "2px dashed #cbd5e1",
      padding: 20,
      borderRadius: 12,
      textAlign: "center",
      background: "#f8fafc",
      cursor: "pointer",
    }}
  >
    <div style={{ fontWeight: 800 }}>
      Dosyayı buraya sürükle bırak
    </div>

    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
      veya dosya seç — CSV / XLSX
    </div>

    <input
      type="file"
      accept=".csv,.xlsx"
      onChange={(e) => {
        const file = e.target.files?.[0];

        if (file) {
          setBulkFile(file);
          void parseFileForPreview(file);
        }
      }}
      style={{ marginTop: 10 }}
    />
  </div>

  <button
    type="button"
    onClick={uploadBulkParticipants}
    disabled={!bulkFile || bulkUploading || previewLoading}
    style={{
      marginTop: 12,
      border: "none",
      borderRadius: 10,
      padding: "10px 14px",
      background:
        !bulkFile || bulkUploading || previewLoading ? "#9ca3af" : "#16a34a",
      color: "#fff",
      fontWeight: 800,
      cursor:
        !bulkFile || bulkUploading || previewLoading ? "not-allowed" : "pointer",
    }}
  >
    {previewLoading
      ? "Önizleme hazırlanıyor..."
      : bulkUploading
      ? "Yükleniyor..."
      : "Toplu Yükle"}
  </button>

  {bulkErrors.length > 0 && (
    <button
      type="button"
      onClick={() => {
        const blob = new Blob([bulkErrors.join("\n")], {
          type: "text/plain;charset=utf-8",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "hata-raporu.txt";
        a.click();
        URL.revokeObjectURL(url);
      }}
      style={{
        marginTop: 10,
        marginLeft: 8,
        padding: "8px 12px",
        background: "#b91c1c",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      Hata Raporu İndir
    </button>
  )}

  <div style={{ marginTop: 10, fontSize: 12, color: BRAND.muted }}>
    Format: full_name, email, password, company_id, is_active
  </div>

  {bulkResult ? (
    <div
      style={{
        marginTop: 10,
        fontSize: 13,
        fontWeight: 800,
        color: bulkErrors.length > 0 ? "#b91c1c" : "#166534",
      }}
    >
      {bulkResult}
    </div>
  ) : null}
</div>

{previewReady && (
  <div style={{ ...cardStyle(), marginBottom: 20 }}>
    <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>
      Yükleme Önizleme
    </div>

    <div style={{ maxHeight: 300, overflow: "auto", fontSize: 13 }}>
      {previewRows.map((row, i) => {
        const hasError = previewErrors[i];

        return (
          <div
            key={i}
            style={{
              padding: 10,
              borderBottom: "1px solid #eee",
              background: hasError ? "#fee2e2" : "#f0fdf4",
            }}
          >
            <div><b>{row.full_name}</b> - {row.email}</div>

            {hasError && (
              <div style={{ color: "#b91c1c", marginTop: 4 }}>
                {hasError.join(", ")}
              </div>
            )}
          </div>
        );
      })}
    </div>

    <div style={{ marginTop: 10, fontSize: 12 }}>
      Toplam: {previewRows.length} | Hatalı: {Object.keys(previewErrors).length}
    </div>
  </div>
)}

        <div style={{ ...cardStyle(), marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
          
          {/* 🔥 YENİ: ÇALIŞAN YÖNETİM PANELİ */}
<div style={{ ...cardStyle(), marginBottom: 20 }}>

  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14
  }}>
    
    <div style={{ fontSize: 18, fontWeight: 900 }}>
      Çalışan Yönetimi
    </div>

    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>

      {/* MANUEL EKLE */}
      <button
        onClick={() => {
          const name = prompt("Ad Soyad");
          const email = prompt("Email");
          const company = prompt("Firma");

          if (!name || !email || !company) return;

          fetch("/api/admin/users/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              full_name: name,
              email,
              company_name: company
            })
          }).then(() => loadAll());
        }}
        style={{
          background: "#16a34a",
          color: "#fff",
          border: "none",
          padding: "10px 14px",
          borderRadius: 10,
          fontWeight: 800,
          cursor: "pointer"
        }}
      >
        + Yeni Çalışan
      </button>

      {/* EXCEL YÜKLE */}
      <button
        onClick={() => window.scrollTo({ top: 600, behavior: "smooth" })}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          padding: "10px 14px",
          borderRadius: 10,
          fontWeight: 800,
          cursor: "pointer"
        }}
      >
        Excel Yükle
      </button>

    </div>
  </div>

  <div style={{ fontSize: 13, color: BRAND.muted }}>
    Çalışan ekle, düzenle, sil ve firmaya bağla.
  </div>

</div>

            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
              Çalışan Seçimi
            </h2>
         
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label
                style={{
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={(e) => toggleAllFiltered(e.target.checked)}
                />
                Filtrelenenleri seç
              </label>

              <button
                type="button"
                onClick={clearSelection}
                style={{
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 14px",
                  background: "#111827",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Seçimi Temizle
              </button>
            </div>
          </div>

          {loading ? (
            <div>Yükleniyor...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ color: BRAND.muted }}>Uygun çalışan bulunamadı.</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              {filteredUsers.map((u) => {
                const checked = selectedUsers.includes(u.id);

                return (
                  <label
                    key={u.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: 16,
                      borderRadius: 16,
                      border: checked
                        ? "2px solid #2563eb"
                        : `1px solid ${BRAND.border}`,
                      background: checked ? "#eff6ff" : "#f9fafb",
                      cursor: "pointer",
                      minWidth: 0,
                      overflow: "hidden",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleUser(u.id, e.target.checked)}
                      style={{ marginTop: 4 }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 900 }}>
                        {u.full_name}
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 13,
                          color: BRAND.muted,
                          lineHeight: 1.6,
                          wordBreak: "break-word",
                        }}
                      >
                        {u.email}
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={badgeStyle("#fff", "#e5e7eb", "#374151")}>
                          {u.company}
                        </span>
                        <span
                          style={
                            u.is_active
                              ? badgeStyle("#dcfce7", "#86efac", "#166534")
                              : badgeStyle("#fee2e2", "#fca5a5", "#b91c1c")
                          }
                        >
                          {u.is_active ? "Aktif" : "Pasif"}
                        </span>
                        <span style={badgeStyle("#f3f4f6", "#d1d5db", "#374151")}>
                          {u.role}
                        </span>
                      </div>

<div style={{
  marginTop: 10,
  display: "flex",
  gap: 8,
  flexWrap: "wrap"
}}>

  {/* DÜZENLE */}
  <button
    onClick={() => {
      const name = prompt("Ad Soyad", u.full_name);
      if (!name) return;

      fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: u.id,
          full_name: name
        })
      }).then(() => loadAll());
    }}
    style={{
      background: "#f59e0b",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "6px 10px",
      cursor: "pointer"
    }}
  >
    Düzenle
  </button>

  {/* AKTİF / PASİF */}
  <button
    onClick={() => {
      fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: u.id,
          is_active: !u.is_active
        })
      }).then(() => loadAll());
    }}
    style={{
      background: u.is_active ? "#b91c1c" : "#16a34a",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "6px 10px",
      cursor: "pointer"
    }}
  >
    {u.is_active ? "Pasif Yap" : "Aktif Yap"}
  </button>

  {/* SİL */}
  <button
    onClick={() => {
      if (!confirm("Silmek istediğine emin misin?")) return;

      fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id })
      }).then(() => loadAll());
    }}
    style={{
      background: "#111827",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "6px 10px",
      cursor: "pointer"
    }}
  >
    Sil
  </button>

</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div
          style={{
            ...cardStyle(),
            marginBottom: assignSummary ? 20 : 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          <div style={{ ...cardStyle(), padding: 14 }}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>Seçilen Eğitim</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginTop: 8 }}>
              {selectedTrainingInfo?.title || "-"}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 14 }}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>Seçilen Kişi</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8 }}>
              {selectedCount}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 14 }}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>Firma Sayısı</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8 }}>
              {selectedCompanyCount}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 14 }}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>Mail Eksik</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8 }}>
              {selectedWithoutEmailCount}
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle(), marginTop: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: BRAND.text }}>
                Atama Özeti
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: BRAND.muted,
                  lineHeight: 1.6,
                }}
              >
                Seçilen eğitim: {selectedTrainingInfo?.title || "-"}
                <br />
                Seçilen çalışan sayısı: {selectedCount}
              </div>
            </div>

            <button
              onClick={assign}
              disabled={!trainingId || selectedCount === 0 || assigning}
              style={{
                border: "none",
                borderRadius: 14,
                padding: "14px 20px",
                background:
                  !trainingId || selectedCount === 0 || assigning
                    ? "#9ca3af"
                    : "#16a34a",
                color: "#fff",
                fontWeight: 900,
                cursor:
                  !trainingId || selectedCount === 0 || assigning
                    ? "not-allowed"
                    : "pointer",
                minWidth: 180,
                width: "100%",
                maxWidth: 260,
              }}
            >
              {assigning ? "Atanıyor..." : "Eğitimi Ata"}
            </button>
          </div>
        </div>

        {assignSummary ? (
          <div style={{ ...cardStyle(), marginTop: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
                  Son Atama Sonucu
                </h3>
                <div style={{ marginTop: 6, fontSize: 13, color: BRAND.muted }}>
                  {assignSummary.message || "İşlem sonucu hazır."}
                </div>
              </div>

              <div
                style={
                  assignSummary.success
                    ? badgeStyle("#dcfce7", "#86efac", "#166534")
                    : badgeStyle("#fee2e2", "#fca5a5", "#b91c1c")
                }
              >
                {assignSummary.success ? "Başarılı" : "Hata"}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 18,
              }}
            >
              {[
                ["Yeni Atama", assignSummary.insertedCount || 0],
                ["Atlandı", assignSummary.skippedCount || 0],
                ["Mail Başarılı", assignSummary.emailedCount || 0],
                ["Mail Başarısız", assignSummary.mailFailedCount || 0],
                ["Mail Yok", assignSummary.noEmailCount || 0],
              ].map(([label, value]) => (
                <div key={label as string} style={{ ...cardStyle(), padding: 14 }}>
                  <div style={{ fontSize: 12, color: BRAND.muted }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                borderRadius: 16,
                border: `1px solid ${BRAND.border}`,
                overflow: "hidden",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: `1px solid ${BRAND.border}`,
                  background: "#f9fafb",
                  fontSize: 13,
                  fontWeight: 900,
                  color: BRAND.text,
                }}
              >
                Mail Sonuç Listesi
              </div>

              {!assignSummary.mailResults || assignSummary.mailResults.length === 0 ? (
                <div style={{ padding: 16, fontSize: 13, color: BRAND.muted }}>
                  Mail sonuç verisi bulunamadı.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 0 }}>
                  {assignSummary.mailResults.map((item, index) => (
                    <div
                      key={`${item.userId}-${index}`}
                      style={{
                        padding: "14px 16px",
                        borderTop:
                          index === 0 ? "none" : "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                        minWidth: 0,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: BRAND.text,
                            wordBreak: "break-word",
                          }}
                        >
                          {item.email || "Email tanımlı değil"}
                        </div>

                        {item.reason ? (
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 12,
                              color: BRAND.muted,
                              lineHeight: 1.5,
                            }}
                          >
                            {item.reason}
                          </div>
                        ) : null}
                      </div>

                      <div
                        style={
                          item.ok
                            ? badgeStyle("#dcfce7", "#86efac", "#166534")
                            : badgeStyle("#fee2e2", "#fca5a5", "#b91c1c")
                        }
                      >
                        {item.ok ? "Gönderildi" : "Başarısız"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
