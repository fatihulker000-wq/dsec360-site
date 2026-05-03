"use client";

import { useEffect, useMemo, useState } from "react";

type Employee = {
  id: string;
  firm_id?: string | null;
  full_name: string;
  job_title?: string | null;
  phone?: string | null;
  email?: string | null;
  registry_no?: string | null;
  tc_no?: string | null;
  start_date?: string | null;
  exit_date?: string | null;
  gender?: string | null;
  disability_status?: string | null;
  active: boolean;
};

type Company = {
  id: string;
  name: string;
};

type EmployeeForm = {
  full_name: string;
  job_title: string;
  phone: string;
  email: string;
  registry_no: string;
  tc_no: string;
  gender: string;
  disability_status: string;
};

const emptyForm: EmployeeForm = {
  full_name: "",
  job_title: "",
  phone: "",
  email: "",
  registry_no: "",
  tc_no: "",
  gender: "",
  disability_status: "",
};

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [firmFilter, setFirmFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "passive">("all");
  const [letterFilter, setLetterFilter] = useState<string | null>(null);

  const [editModal, setEditModal] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<EmployeeForm>(emptyForm);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState<EmployeeForm>(emptyForm);

  const loadEmployees = async (firmId = firmFilter) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/admin/employees?firmId=${encodeURIComponent(firmId)}`, {
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setData([]);
        setError(json?.error || "Çalışanlar alınamadı.");
        return;
      }

      setData(json?.data || []);
      setCompanies(json?.companies || []);
    } catch {
      setData([]);
      setError("Çalışan listesi yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployees("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddEmployee = () => {
  if (firmFilter === "all") {
    alert("Önce firma seçmelisin.");
    return;
  }

  setAddForm(emptyForm);
  setAddModal(true);
 };

const saveNewEmployee = async () => {
  if (firmFilter === "all") {
    alert("Önce firma seçmelisin.");
    return;
  }

  if (!addForm.full_name.trim()) {
    alert("Ad Soyad zorunlu.");
    return;
  }

  try {
    setActionLoading(true);

    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        firm_id: firmFilter,
        full_name: addForm.full_name.trim(),
        job_title: addForm.job_title.trim(),
        phone: addForm.phone.trim(),
        email: addForm.email.trim(),
        registry_no: addForm.registry_no.trim(),
        tc_no: addForm.tc_no.trim(),
        gender: addForm.gender.trim(),
        disability_status: addForm.disability_status.trim(),
        active: true,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json?.error || "Çalışan eklenemedi.");
      return;
    }

    setAddModal(false);
    setAddForm(emptyForm);
    await loadEmployees(firmFilter);
  } finally {
    setActionLoading(false);
  }
};

  const openEditModal = (emp: Employee) => {
    setEditModal(emp);
    setEditForm({
      full_name: emp.full_name || "",
      job_title: emp.job_title || "",
      phone: emp.phone || "",
      email: emp.email || "",
      registry_no: emp.registry_no || "",
      tc_no: emp.tc_no || "",
      gender: emp.gender || "",
      disability_status: emp.disability_status || "",
    });
  };

  const saveEditEmployee = async () => {
    if (!editModal) return;

    if (!editForm.full_name.trim()) {
      alert("Ad Soyad zorunlu.");
      return;
    }

    try {
      setActionLoading(true);

      const res = await fetch("/api/admin/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: editModal.id,
          full_name: editForm.full_name.trim(),
          job_title: editForm.job_title.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email.trim(),
          registry_no: editForm.registry_no.trim(),
          tc_no: editForm.tc_no.trim(),
          gender: editForm.gender.trim(),
          disability_status: editForm.disability_status.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "Çalışan güncellenemedi.");
        return;
      }

      setEditModal(null);
      setEditForm(emptyForm);
      await loadEmployees(firmFilter);
    } finally {
      setActionLoading(false);
    }
  };

  const downloadEmployeeTemplate = () => {
  const csv =
    "full_name,job_title,phone,email,registry_no,tc_no,gender,disability_status,active\n" +
    "Ali Veli,Operatör,05551234567,ali.veli@mail.com,SCL-001,11111111111,Erkek,Yok,true\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "dsec-calisan-toplu-yukleme-sablon.csv";
  a.click();

  URL.revokeObjectURL(url);
};

const uploadBulkEmployees = async () => {
  if (firmFilter === "all") {
    alert("Toplu yükleme için önce firma seçmelisin.");
    return;
  }

  if (!bulkFile) {
    alert("Önce CSV veya Excel dosyası seç.");
    return;
  }

  try {
    setBulkLoading(true);

    const formData = new FormData();
    formData.append("file", bulkFile);
    formData.append("firm_id", firmFilter);

    const res = await fetch("/api/admin/employees/bulk-upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json?.error || "Toplu çalışan yükleme başarısız.");
      return;
    }

    alert(
      `Toplu yükleme tamamlandı.\nEklenen: ${json.insertedCount || 0}\nAtlanan: ${json.skippedCount || 0}`
    );

    setBulkFile(null);
    await loadEmployees(firmFilter);
  } finally {
    setBulkLoading(false);
  }
};

  const handleActiveEmployee = async (emp: Employee) => {
    try {
      setActionLoading(true);

      const res = await fetch("/api/admin/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: emp.id,
          active: true,
          exit_date: "",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json?.error || "Çalışan aktifleştirilemedi.");
        return;
      }

      await loadEmployees(firmFilter);
    } finally {
      setActionLoading(false);
    }
  };

const handlePassiveEmployee = async (emp: Employee) => {
  if (!confirm(`${emp.full_name} pasife alınsın mı?`)) return;

  try {
    setActionLoading(true);

    const res = await fetch(`/api/admin/employees?id=${encodeURIComponent(emp.id)}`, {
      method: "DELETE",
      credentials: "include",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json?.error || "Çalışan pasife alınamadı.");
      return;
    }

    await loadEmployees(firmFilter);
  } finally {
    setActionLoading(false);
  }
};

const handleHardDeleteEmployee = async (emp: Employee) => {
  const ok = confirm(
    `${emp.full_name} kaydı kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misin?`
  );

  if (!ok) return;

  try {
    setActionLoading(true);

    const res = await fetch(
      `/api/admin/employees?id=${encodeURIComponent(emp.id)}&mode=hard`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json?.error || "Çalışan silinemedi.");
      return;
    }

    await loadEmployees(firmFilter);
  } finally {
    setActionLoading(false);
  }
};

  const filtered = useMemo(() => {
  let list = data;

  if (statusFilter === "active") list = list.filter((x) => x.active);
  if (statusFilter === "passive") list = list.filter((x) => !x.active);

  if (letterFilter) {
    list = list.filter((emp) =>
      String(emp.full_name || "")
        .trim()
        .toLocaleUpperCase("tr-TR")
        .startsWith(letterFilter)
    );
  }

  const q = search.trim().toLowerCase();
  if (!q) return list;

  return list.filter((emp) =>
    [
      emp.full_name,
      emp.job_title,
      emp.phone,
      emp.email,
      emp.registry_no,
      emp.tc_no,
    ]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
}, [data, search, statusFilter, letterFilter]);

  
  const activeCount = filtered.filter((x) => x.active).length;
const passiveCount = filtered.filter((x) => !x.active).length;
const activeEmployees = filtered.filter((x) => x.active);

  const maleCount = activeEmployees.filter((x) => {
    const v = String(x.gender || "").toLowerCase().trim();
    return v === "erkek" || v === "e" || v === "male" || v === "bay";
  }).length;

  const femaleCount = activeEmployees.filter((x) => {
    const v = String(x.gender || "").toLowerCase().trim();
    return v === "kadın" || v === "kadin" || v === "k" || v === "female" || v === "bayan";
  }).length;

  const disabledCount = activeEmployees.filter((x) => {
    const v = String(x.disability_status || "").toLowerCase().trim();
    if (!v || v === "yok" || v === "hayır" || v === "hayir" || v === "0" || v === "false") return false;
    return true;
  }).length;

  return (
    <main style={{ padding: 28 }}>
      <div
        style={{
          borderRadius: 28,
          padding: 28,
          background: "linear-gradient(135deg, #4a0d1a 0%, #7f1734 48%, #c62828 100%)",
          color: "#fff",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.85 }}>
          D-SEC Çalışan Yönetimi
        </div>

        <h1 style={{ margin: "10px 0 8px", fontSize: 34, fontWeight: 900 }}>
          Çalışanlar
        </h1>

        <p style={{ margin: 0, opacity: 0.88 }}>
          Web-app entegrasyonlu çalışan listesi, aktif/pasif takip ve firma bazlı arama ekranı.
        </p>
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <Kpi title="Toplam" value={filtered.length} />
        <Kpi title="Aktif" value={activeCount} />
        <Kpi title="Pasif" value={passiveCount} />
        <Kpi title="Görünen" value={filtered.length} />
        <Kpi title="Erkek" value={maleCount} />
        <Kpi title="Kadın" value={femaleCount} />
        <Kpi title="Engelli" value={disabledCount} />
      </section>

<section
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 20,
          background: "#fff",
          padding: 12,
          borderRadius: 16,
          border: "1px solid #e5e7eb",
        }}
      >
        {"ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("").map((letter) => (
          <button
            key={letter}
            onClick={() => setLetterFilter(letter)}
            style={{
              padding: "7px 11px",
              borderRadius: 10,
              border: "none",
              fontWeight: 900,
              cursor: "pointer",
              background: letterFilter === letter ? "#c62828" : "#f3f4f6",
              color: letterFilter === letter ? "#fff" : "#374151",
            }}
          >
            {letter}
          </button>
        ))}

        <button
          onClick={() => setLetterFilter(null)}
          style={{
            padding: "7px 12px",
            borderRadius: 10,
            border: "none",
            fontWeight: 900,
            cursor: "pointer",
            background: "#111827",
            color: "#fff",
          }}
        >
          Tümü
        </button>
      </section>

             <section
  style={{
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
  }}
>
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select
            value={firmFilter}
            onChange={(e) => {
              const nextFirmId = e.target.value;
              setFirmFilter(nextFirmId);
              void loadEmployees(nextFirmId);
            }}
            style={inputStyle}
          >
            <option value="all">Tüm firmalar</option>
            {companies.map((firm) => (
              <option key={firm.id} value={firm.id}>
                {firm.name || "Firma"}
              </option>
            ))}
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, ünvan, telefon, e-posta, sicil veya TC ara"
            style={{ ...inputStyle, flex: 1, minWidth: 260 }}
          />

          <button onClick={() => setStatusFilter("all")} style={btn(statusFilter === "all")}>
            Tümü
          </button>
          <button onClick={() => setStatusFilter("active")} style={btn(statusFilter === "active")}>
            Aktif
          </button>
          <button onClick={() => setStatusFilter("passive")} style={btn(statusFilter === "passive")}>
            Pasif
          </button>

          <button onClick={() => loadEmployees(firmFilter)} style={darkBtn()}>
            Yenile
          </button>

          <button onClick={handleAddEmployee} disabled={actionLoading} style={blueBtn(actionLoading)}>
            + Çalışan Ekle
          </button>
          <button onClick={downloadEmployeeTemplate} style={darkBtn()}>
  Şablon İndir
</button>

<input
  type="file"
  accept=".csv,.xlsx"
  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
  style={{
    minWidth: 220,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "10px 12px",
    background: "#fff",
    fontWeight: 800,
  }}
/>

<button
  onClick={uploadBulkEmployees}
  disabled={bulkLoading || !bulkFile}
  style={blueBtn(bulkLoading || !bulkFile)}
>
  {bulkLoading ? "Yükleniyor..." : "Toplu Yükle"}
</button>
        </div>
      </section>

      {loading ? (
        <CardText title="Yükleniyor" text="Çalışan kayıtları getiriliyor..." />
      ) : error ? (
        <CardText title="Hata" text={error} />
      ) : filtered.length === 0 ? (
        <CardText title="Kayıt bulunamadı" text="Seçili filtreye uygun çalışan görünmüyor." />
      ) : (
        
        <section style={{ display: "grid", gap: 14 }}>
  {filtered.map((emp) => (
    <div
      key={emp.id}
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 22,
        padding: 18,
        boxShadow: "0 12px 30px rgba(15,23,42,0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 900, color: "#111827" }}>
            {emp.full_name || "Adsız çalışan"}
          </div>

          <div style={{ marginTop: 6, color: "#6b7280", lineHeight: 1.7 }}>
            <div>Ünvan: {emp.job_title || "-"}</div>
            <div>Telefon: {emp.phone || "-"}</div>
            <div>E-posta: {emp.email || "-"}</div>
            <div>Sicil: {emp.registry_no || "-"}</div>
            <div>Firma ID: {emp.firm_id || "-"}</div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => openEditModal(emp)} disabled={actionLoading} style={smallBtn("#2563eb")}>
              Düzenle
            </button>

            {emp.active ? (
              <button onClick={() => handlePassiveEmployee(emp)} disabled={actionLoading} style={smallBtn("#dc2626")}>
                Pasife Al
              </button>
            ) : (
              <button onClick={() => handleActiveEmployee(emp)} disabled={actionLoading} style={smallBtn("#16a34a")}>
                Aktif Yap
              </button>
            )}

<button
  onClick={() => handleHardDeleteEmployee(emp)}
  disabled={actionLoading}
  style={smallBtn("#7f1d1d")}
>
  Sil
</button>

          </div>
        </div>

        <span
          style={{
            height: 34,
            padding: "8px 12px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 900,
            background: emp.active ? "#ecfdf5" : "#fef2f2",
            color: emp.active ? "#166534" : "#b91c1c",
          }}
        >
          {emp.active ? "Aktif" : "Pasif"}
        </span>
      </div>
    </div>
  ))}
</section>
      )}

{addModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: 20,
    }}
  >
    <div
      style={{
        width: "min(760px, 100%)",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#fff",
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          borderRadius: 20,
          padding: 20,
          background: "linear-gradient(135deg, #4a0d1a 0%, #c62828 100%)",
          color: "#fff",
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.85 }}>
          Yeni Çalışan
        </div>
        <h2 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 950 }}>
          Çalışan Ekle
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <FormInput label="Ad Soyad *" value={addForm.full_name} onChange={(v) => setAddForm({ ...addForm, full_name: v })} />
        <FormInput label="Ünvan" value={addForm.job_title} onChange={(v) => setAddForm({ ...addForm, job_title: v })} />
        <FormInput label="Telefon" value={addForm.phone} onChange={(v) => setAddForm({ ...addForm, phone: v })} />
        <FormInput label="E-posta" value={addForm.email} onChange={(v) => setAddForm({ ...addForm, email: v })} />
        <FormInput label="Sicil No" value={addForm.registry_no} onChange={(v) => setAddForm({ ...addForm, registry_no: v })} />
        <FormInput label="TC No" value={addForm.tc_no} onChange={(v) => setAddForm({ ...addForm, tc_no: v })} />
        <FormInput label="Cinsiyet" value={addForm.gender} onChange={(v) => setAddForm({ ...addForm, gender: v })} />
        <FormInput label="Engellilik Durumu" value={addForm.disability_status} onChange={(v) => setAddForm({ ...addForm, disability_status: v })} />
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
        <button
          onClick={() => {
            setAddModal(false);
            setAddForm(emptyForm);
          }}
          disabled={actionLoading}
          style={darkBtn()}
        >
          İptal
        </button>

        <button onClick={saveNewEmployee} disabled={actionLoading} style={blueBtn(actionLoading)}>
          {actionLoading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  </div>
)}

      {editModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              width: "min(720px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                borderRadius: 20,
                padding: 20,
                background: "linear-gradient(135deg, #4a0d1a 0%, #c62828 100%)",
                color: "#fff",
                marginBottom: 18,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.85 }}>
                Çalışan Bilgisi
              </div>
              <h2 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 950 }}>
                Düzenle
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <FormInput label="Ad Soyad *" value={editForm.full_name} onChange={(v) => setEditForm({ ...editForm, full_name: v })} />
              <FormInput label="Ünvan" value={editForm.job_title} onChange={(v) => setEditForm({ ...editForm, job_title: v })} />
              <FormInput label="Telefon" value={editForm.phone} onChange={(v) => setEditForm({ ...editForm, phone: v })} />
              <FormInput label="E-posta" value={editForm.email} onChange={(v) => setEditForm({ ...editForm, email: v })} />
              <FormInput label="Sicil No" value={editForm.registry_no} onChange={(v) => setEditForm({ ...editForm, registry_no: v })} />
              <FormInput label="TC No" value={editForm.tc_no} onChange={(v) => setEditForm({ ...editForm, tc_no: v })} />
              <FormInput label="Cinsiyet" value={editForm.gender} onChange={(v) => setEditForm({ ...editForm, gender: v })} />
              <FormInput label="Engellilik Durumu" value={editForm.disability_status} onChange={(v) => setEditForm({ ...editForm, disability_status: v })} />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button
                onClick={() => {
                  setEditModal(null);
                  setEditForm(emptyForm);
                }}
                disabled={actionLoading}
                style={darkBtn()}
              >
                İptal
              </button>

              <button onClick={saveEditEmployee} disabled={actionLoading} style={blueBtn(actionLoading)}>
                {actionLoading ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function FormInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: "12px 14px",
          fontSize: 14,
          color: "#111827",
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  minWidth: 240,
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 14,
  background: "#fff",
  fontWeight: 800,
  color: "#374151",
};

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 18,
      }}
    >
      <div style={{ color: "#6b7280", fontWeight: 800 }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 30, fontWeight: 950, color: "#111827" }}>
        {value}
      </div>
    </div>
  );
}

function CardText({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 22,
        padding: 22,
      }}
    >
      <h3 style={{ margin: 0, color: "#111827" }}>{title}</h3>
      <p style={{ marginBottom: 0, color: "#6b7280" }}>{text}</p>
    </div>
  );
}

function btn(active: boolean): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "12px 16px",
    background: active ? "#c62828" : "#fff",
    color: active ? "#fff" : "#374151",
    fontWeight: 800,
    cursor: "pointer",
  };
}

function darkBtn(): React.CSSProperties {
  return {
    border: 0,
    borderRadius: 14,
    padding: "12px 16px",
    background: "#111827",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  };
}

function blueBtn(disabled: boolean): React.CSSProperties {
  return {
    border: 0,
    borderRadius: 14,
    padding: "12px 16px",
    background: disabled ? "#93c5fd" : "#2563eb",
    color: "#fff",
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

function smallBtn(bg: string): React.CSSProperties {
  return {
    border: 0,
    borderRadius: 12,
    padding: "8px 12px",
    background: bg,
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  };
}