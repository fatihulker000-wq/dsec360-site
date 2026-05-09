"use client";

import { useEffect, useMemo, useState } from "react";

type UserApiRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  app_user_type?: string | null;
  is_active?: boolean | null;
  permissions?: string[] | null;
};

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  app_user_type: string;
  is_active: boolean;
  permissions: string[];
};

type PermissionAction = {
  key: string;
  label: string;
  desc?: string;
};

type PermissionGroup = {
  title: string;
  desc: string;
  actions: PermissionAction[];
};

type PermissionModule = {
  key: string;
  title: string;
  desc: string;
  groups: PermissionGroup[];
};

const BRAND = {
  bg: "#f7f8fb",
  white: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  red: "#c62828",
  redDark: "#5a0f1f",
  green: "#166534",
  blue: "#1d4ed8",
  shadow: "0 10px 30px rgba(15,23,42,0.06)",
};

const MODULES: PermissionModule[] = [
  {
    key: "DENETIM",
    title: "Denetim Modülü",
    desc: "Klasik, puanlamalı, fotoğraflı denetim ve DÖF yönetimi",
    groups: [
      {
        title: "Genel",
        desc: "Denetim ana kart ve genel erişim",
        actions: [
          { key: "DENETIM.VIEW", label: "Modülü gör" },
          { key: "DENETIM.DASHBOARD.VIEW", label: "Denetim dashboard gör" },
        ],
      },
      {
        title: "Klasik Denetim",
        desc: "Klasik denetim formları",
        actions: [
          { key: "DENETIM.CLASSIC.VIEW", label: "Listeyi gör" },
          { key: "DENETIM.CLASSIC.CREATE", label: "Denetim başlat" },
          { key: "DENETIM.CLASSIC.DETAIL", label: "Detay gör" },
          { key: "DENETIM.CLASSIC.DELETE", label: "Sil" },
          { key: "DENETIM.CLASSIC.PDF", label: "PDF al" },
        ],
      },
      {
        title: "Puanlamalı / Fotoğraflı",
        desc: "Puan, Elmeri ve fotoğraflı denetimler",
        actions: [
          { key: "DENETIM.SCORING.VIEW", label: "Puanlamalı gör" },
          { key: "DENETIM.SCORING.CREATE", label: "Puanlamalı başlat" },
          { key: "DENETIM.PHOTO.VIEW", label: "Fotoğraflı gör" },
          { key: "DENETIM.PHOTO.CREATE", label: "Fotoğraflı başlat" },
        ],
      },
      {
        title: "DÖF",
        desc: "Düzeltici önleyici faaliyet takip merkezi",
        actions: [
          { key: "DENETIM.DOF.VIEW", label: "DÖF gör" },
          { key: "DENETIM.DOF.CREATE", label: "DÖF oluştur" },
          { key: "DENETIM.DOF.CLOSE", label: "DÖF kapat" },
          { key: "DENETIM.DOF.DELETE", label: "DÖF sil" },
        ],
      },
    ],
  },
  {
    key: "SAGLIK",
    title: "Sağlık Modülü",
    desc: "İşyeri hekimi, EK-2, muayene ve sağlık kayıtları",
    groups: [
      {
        title: "Genel",
        desc: "Sağlık ana modül erişimi",
        actions: [
          { key: "SAGLIK.VIEW", label: "Modülü gör" },
          { key: "SAGLIK.SUMMARY.VIEW", label: "Özet var/yok gör" },
          { key: "SAGLIK.SENSITIVE.VIEW", label: "Hassas sağlık verisi gör" },
        ],
      },
      {
        title: "EK-2 Raporları",
        desc: "EK-2 sağlık raporu işlemleri",
        actions: [
          { key: "SAGLIK.EK2.VIEW_SUMMARY", label: "EK-2 var/yok gör" },
          { key: "SAGLIK.EK2.VIEW_DETAIL", label: "EK-2 detay gör" },
          { key: "SAGLIK.EK2.CREATE", label: "EK-2 ekle" },
          { key: "SAGLIK.EK2.EDIT", label: "EK-2 düzenle" },
          { key: "SAGLIK.EK2.DELETE", label: "EK-2 sil" },
          { key: "SAGLIK.EK2.PDF", label: "EK-2 PDF al" },
        ],
      },
      {
        title: "Muayene / Reçete",
        desc: "Periyodik muayene ve reçete alanları",
        actions: [
          { key: "SAGLIK.MUAYENE.VIEW", label: "Muayene gör" },
          { key: "SAGLIK.MUAYENE.CREATE", label: "Muayene ekle" },
          { key: "SAGLIK.MUAYENE.EDIT", label: "Muayene düzenle" },
          { key: "SAGLIK.RECETE.VIEW", label: "Reçete gör" },
          { key: "SAGLIK.RECETE.CREATE", label: "Reçete oluştur" },
        ],
      },
    ],
  },
  {
    key: "EGITIM",
    title: "Eğitim Modülü",
    desc: "Eğitim atama, takip, portal, sınav ve sertifika",
    groups: [
      {
        title: "Genel",
        desc: "Eğitim modülü erişimi",
        actions: [
          { key: "EGITIM.VIEW", label: "Modülü gör" },
          { key: "EGITIM.DASHBOARD.VIEW", label: "Eğitim dashboard gör" },
        ],
      },
      {
        title: "Atama / Takip",
        desc: "Eğitim atama ve katılımcı izleme",
        actions: [
          { key: "EGITIM.ASSIGNMENT.VIEW", label: "Atamaları gör" },
          { key: "EGITIM.ASSIGNMENT.CREATE", label: "Eğitim ata" },
          { key: "EGITIM.ASSIGNMENT.DELETE", label: "Atama sil" },
          { key: "EGITIM.PROGRESS.VIEW", label: "İlerleme gör" },
        ],
      },
      {
        title: "Belge / Sertifika",
        desc: "Katılım ve sertifika çıktıları",
        actions: [
          { key: "EGITIM.CERTIFICATE.VIEW", label: "Sertifika gör" },
          { key: "EGITIM.CERTIFICATE.PDF", label: "Sertifika PDF al" },
          { key: "EGITIM.ATTENDANCE.PDF", label: "Katılım formu PDF al" },
        ],
      },
    ],
  },
  {
    key: "CALISANLAR",
    title: "Çalışanlar Modülü",
    desc: "Çalışan listesi, detay ve içe/dışa aktarım",
    groups: [
      {
        title: "Genel",
        desc: "Çalışan modülü erişimi",
        actions: [
          { key: "CALISANLAR.VIEW", label: "Modülü gör" },
          { key: "CALISANLAR.DETAIL", label: "Çalışan detay gör" },
          { key: "CALISANLAR.CREATE", label: "Çalışan ekle" },
          { key: "CALISANLAR.EDIT", label: "Çalışan düzenle" },
          { key: "CALISANLAR.DELETE", label: "Çalışan sil" },
          { key: "CALISANLAR.IMPORT", label: "Toplu aktarım" },
          { key: "CALISANLAR.EXPORT", label: "Dışa aktarım" },
        ],
      },
    ],
  },
  {
    key: "CBS",
    title: "ÇBS Modülü",
    desc: "Çalışan bildirim sistemi, şikayet, öneri ve talep",
    groups: [
      {
        title: "Genel",
        desc: "ÇBS erişim ve kayıt yönetimi",
        actions: [
          { key: "CBS.VIEW", label: "Modülü gör" },
          { key: "CBS.RECORDS.VIEW_ASSIGNED", label: "Kendisine gelenleri gör" },
          { key: "CBS.RECORDS.VIEW_ALL", label: "Tüm kayıtları gör" },
          { key: "CBS.RECORDS.CREATE", label: "Kayıt oluştur" },
          { key: "CBS.RECORDS.REPLY", label: "Yanıtla" },
          { key: "CBS.RECORDS.CLOSE", label: "Kapat" },
          { key: "CBS.RECORDS.DELETE", label: "Sil" },
        ],
      },
    ],
  },
  {
    key: "RAPORLAMA",
    title: "Raporlama Modülü",
    desc: "Executive dashboard, analiz ve PDF raporlar",
    groups: [
      {
        title: "Genel",
        desc: "Raporlama ve yönetici görünümü",
        actions: [
          { key: "RAPORLAMA.VIEW", label: "Modülü gör" },
          { key: "RAPORLAMA.EXECUTIVE.VIEW", label: "Executive dashboard gör" },
          { key: "RAPORLAMA.DETAIL.VIEW", label: "Detaylı rapor gör" },
          { key: "RAPORLAMA.PDF", label: "PDF rapor al" },
          { key: "RAPORLAMA.AI_SUMMARY.VIEW", label: "AI yönetici özeti gör" },
        ],
      },
    ],
  },
  {
    key: "AJANDA",
    title: "Ajanda Modülü",
    desc: "Görev, takip, harita ve planlama",
    groups: [
      {
        title: "Genel",
        desc: "Ajanda görev işlemleri",
        actions: [
          { key: "AJANDA.VIEW", label: "Modülü gör" },
          { key: "AJANDA.CREATE", label: "Görev oluştur" },
          { key: "AJANDA.EDIT", label: "Görev düzenle" },
          { key: "AJANDA.DELETE", label: "Görev sil" },
          { key: "AJANDA.MAP.VIEW", label: "Harita gör" },
        ],
      },
    ],
  },
  {
    key: "DOKUMANTASYON",
    title: "Dokümantasyon",
    desc: "Doküman yönetimi ve belge kayıtları",
    groups: [
      {
        title: "Genel",
        desc: "Doküman erişimi",
        actions: [
          { key: "DOKUMANTASYON.VIEW", label: "Modülü gör" },
          { key: "DOKUMANTASYON.CREATE", label: "Doküman ekle" },
          { key: "DOKUMANTASYON.EDIT", label: "Doküman düzenle" },
          { key: "DOKUMANTASYON.DELETE", label: "Doküman sil" },
          { key: "DOKUMANTASYON.PDF", label: "PDF al" },
        ],
      },
    ],
  },
  {
    key: "MEVZUAT",
    title: "Mevzuat",
    desc: "Mevzuat kütüphanesi ve bağlantılar",
    groups: [
      {
        title: "Genel",
        desc: "Mevzuat erişimi",
        actions: [
          { key: "MEVZUAT.VIEW", label: "Modülü gör" },
          { key: "MEVZUAT.LINK_OPEN", label: "Bağlantı aç" },
          { key: "MEVZUAT.FAVORITE", label: "Favoriye ekle" },
        ],
      },
    ],
  },
  {
    key: "RISK_YONETIMI",
    title: "Risk Yönetimi",
    desc: "Risk değerlendirme ve aksiyon takibi",
    groups: [
      {
        title: "Genel",
        desc: "Risk modülü erişimi",
        actions: [
          { key: "RISK_YONETIMI.VIEW", label: "Modülü gör" },
          { key: "RISK_YONETIMI.CREATE", label: "Risk ekle" },
          { key: "RISK_YONETIMI.EDIT", label: "Risk düzenle" },
          { key: "RISK_YONETIMI.DELETE", label: "Risk sil" },
          { key: "RISK_YONETIMI.PDF", label: "PDF al" },
        ],
      },
    ],
  },
  {
    key: "KAZA_OLAY_YONETIMI",
    title: "Kaza ve Olay Yönetimi",
    desc: "Kaza, ramak kala, olay ve analiz kayıtları",
    groups: [
      {
        title: "Genel",
        desc: "Kaza ve olay kayıtları",
        actions: [
          { key: "KAZA_OLAY_YONETIMI.VIEW", label: "Modülü gör" },
          { key: "KAZA_OLAY_YONETIMI.CREATE", label: "Kayıt oluştur" },
          { key: "KAZA_OLAY_YONETIMI.EDIT", label: "Düzenle" },
          { key: "KAZA_OLAY_YONETIMI.DELETE", label: "Sil" },
          { key: "KAZA_OLAY_YONETIMI.PDF", label: "PDF al" },
        ],
      },
    ],
  },
  {
    key: "ADMIN",
    title: "Admin / Sistem Yönetimi",
    desc: "Firma, kullanıcı ve sistem yönetimi",
    groups: [
      {
        title: "Yönetim",
        desc: "Admin panel yetkileri",
        actions: [
          { key: "ADMIN.VIEW", label: "Admin panel gör" },
          { key: "FIRMA_YONETIM.VIEW", label: "Firma yönetimi gör" },
          { key: "FIRMA_YONETIM.CREATE", label: "Firma oluştur" },
          { key: "FIRMA_YONETIM.EDIT", label: "Firma düzenle" },
          { key: "FIRMA_YONETIM.DELETE", label: "Firma sil" },
          { key: "KULLANICI_YONETIMI.VIEW", label: "Kullanıcı yönetimi gör" },
          { key: "KULLANICI_YONETIMI.CREATE", label: "Kullanıcı oluştur" },
          { key: "KULLANICI_YONETIMI.EDIT", label: "Kullanıcı düzenle" },
          { key: "KULLANICI_YONETIMI.DELETE", label: "Kullanıcı sil" },
          { key: "KULLANICI_YONETIMI.PERMISSIONS", label: "Yetki yönetimi yap" },
        ],
      },
    ],
  },
];

function cardStyle(): React.CSSProperties {
  return {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 18,
    background: BRAND.white,
    padding: 18,
    boxShadow: BRAND.shadow,
    minWidth: 0,
  };
}

function getRoleLabel(role: string, appUserType: string) {
  if (appUserType === "isg_uzmani") return "İSG Uzmanı";
  if (appUserType === "hekim") return "İşyeri Hekimi";
  if (appUserType === "dsp") return "DSP";
  if (appUserType === "diger") return "Diğer App Kullanıcısı";
  if (role === "super_admin") return "Süper Admin";
  if (role === "company_admin") return "Firma Yöneticisi";
  if (role === "operator") return "Operatör";
  return role || "-";
}

function allPermissionKeys() {
  return MODULES.flatMap((m) => m.groups.flatMap((g) => g.actions.map((a) => a.key)));
}

function modulePermissionKeys(module: PermissionModule) {
  return module.groups.flatMap((g) => g.actions.map((a) => a.key));
}

function groupPermissionKeys(group: PermissionGroup) {
  return group.actions.map((a) => a.key);
}

export default function AdminPermissionsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedModuleKey, setSelectedModuleKey] = useState("ALL");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const visibleModules = useMemo(() => {
    if (selectedModuleKey === "ALL") return MODULES;
    return MODULES.filter((m) => m.key === selectedModuleKey);
  }, [selectedModuleKey]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const text = `${u.full_name} ${u.email} ${u.role} ${u.app_user_type}`.toLowerCase();
      const matchesSearch = !search || text.includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "all"
          ? true
          : roleFilter === "app_users"
          ? Boolean(u.app_user_type)
          : roleFilter === "hekim"
          ? u.app_user_type === "hekim"
          : roleFilter === "isg_uzmani"
          ? u.app_user_type === "isg_uzmani"
          : roleFilter === "dsp"
          ? u.app_user_type === "dsp"
          : u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const selectedPerms = selectedUser?.permissions || [];

  const loadUsers = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/users", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json = await res.json();

      const normalized: UserRow[] = Array.isArray(json?.data)
        ? json.data.map((u: UserApiRow) => ({
            id: String(u.id || ""),
            full_name: String(u.full_name || "Adsız Kullanıcı").trim(),
            email: String(u.email || "").trim(),
            role: String(u.role || "").trim(),
            app_user_type: String(u.app_user_type || "").trim(),
            is_active: Boolean(u.is_active),
            permissions: Array.isArray(u.permissions)
              ? u.permissions.map((p) => String(p || "").trim()).filter(Boolean)
              : [],
          }))
        : [];

      setUsers(normalized);

      if (!selectedUserId && normalized.length > 0) {
        setSelectedUserId(normalized[0].id);
      }
    } catch (error) {
      console.error(error);
      alert("Kullanıcılar alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePermissions = async (userId: string, permissions: string[]) => {
    try {
      setSaving(true);

      const res = await fetch("/api/admin/users/update-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          permissions: Array.from(new Set(permissions)).sort((a, b) =>
            a.localeCompare(b, "tr")
          ),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!res.ok) {
        alert(json?.error || "Yetkiler kaydedilemedi.");
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                permissions: Array.from(new Set(permissions)).sort((a, b) =>
                  a.localeCompare(b, "tr")
                ),
              }
            : u
        )
      );
    } catch (error) {
      console.error(error);
      alert("Yetkiler kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (key: string, checked: boolean) => {
    if (!selectedUser) return;

    const current = selectedUser.permissions || [];
    const next = checked
      ? Array.from(new Set([...current, key]))
      : current.filter((p) => p !== key);

    void savePermissions(selectedUser.id, next);
  };

  const toggleKeys = (keys: string[], checked: boolean) => {
    if (!selectedUser) return;

    const current = selectedUser.permissions || [];
    const next = checked
      ? Array.from(new Set([...current, ...keys]))
      : current.filter((p) => !keys.includes(p));

    void savePermissions(selectedUser.id, next);
  };

  const applyTemplate = (template: "super_admin" | "company_admin" | "isg" | "hekim" | "dsp" | "employee") => {
    if (!selectedUser) return;

    let keys: string[] = [];

    if (template === "super_admin") {
      keys = allPermissionKeys();
    }

    if (template === "company_admin") {
      keys = allPermissionKeys().filter(
        (k) => !k.includes("SAGLIK.SENSITIVE.VIEW")
      );
    }

    if (template === "isg") {
      keys = [
        "DENETIM.VIEW",
        "DENETIM.DASHBOARD.VIEW",
        "DENETIM.CLASSIC.VIEW",
        "DENETIM.CLASSIC.CREATE",
        "DENETIM.CLASSIC.DETAIL",
        "DENETIM.CLASSIC.PDF",
        "DENETIM.SCORING.VIEW",
        "DENETIM.SCORING.CREATE",
        "DENETIM.PHOTO.VIEW",
        "DENETIM.PHOTO.CREATE",
        "DENETIM.DOF.VIEW",
        "DENETIM.DOF.CREATE",
        "DENETIM.DOF.CLOSE",
        "EGITIM.VIEW",
        "EGITIM.DASHBOARD.VIEW",
        "EGITIM.ASSIGNMENT.VIEW",
        "EGITIM.PROGRESS.VIEW",
        "CALISANLAR.VIEW",
        "CALISANLAR.DETAIL",
        "CBS.VIEW",
        "CBS.RECORDS.VIEW_ASSIGNED",
        "CBS.RECORDS.REPLY",
        "CBS.RECORDS.CLOSE",
        "SAGLIK.VIEW",
        "SAGLIK.SUMMARY.VIEW",
        "SAGLIK.EK2.VIEW_SUMMARY",
        "AJANDA.VIEW",
        "AJANDA.CREATE",
        "AJANDA.EDIT",
        "MEVZUAT.VIEW",
        "MEVZUAT.LINK_OPEN",
      ];
    }

    if (template === "hekim") {
      keys = [
        "SAGLIK.VIEW",
        "SAGLIK.SUMMARY.VIEW",
        "SAGLIK.SENSITIVE.VIEW",
        "SAGLIK.EK2.VIEW_SUMMARY",
        "SAGLIK.EK2.VIEW_DETAIL",
        "SAGLIK.EK2.CREATE",
        "SAGLIK.EK2.EDIT",
        "SAGLIK.EK2.DELETE",
        "SAGLIK.EK2.PDF",
        "SAGLIK.MUAYENE.VIEW",
        "SAGLIK.MUAYENE.CREATE",
        "SAGLIK.MUAYENE.EDIT",
        "SAGLIK.RECETE.VIEW",
        "SAGLIK.RECETE.CREATE",
        "CBS.VIEW",
        "CBS.RECORDS.VIEW_ASSIGNED",
        "CBS.RECORDS.REPLY",
        "CBS.RECORDS.CLOSE",
        "EGITIM.VIEW",
        "EGITIM.PROGRESS.VIEW",
        "AJANDA.VIEW",
        "AJANDA.CREATE",
        "AJANDA.EDIT",
        "MEVZUAT.VIEW",
      ];
    }

    if (template === "dsp") {
      keys = [
        "SAGLIK.VIEW",
        "SAGLIK.SUMMARY.VIEW",
        "SAGLIK.EK2.VIEW_SUMMARY",
        "SAGLIK.MUAYENE.VIEW",
        "CBS.VIEW",
        "CBS.RECORDS.VIEW_ASSIGNED",
        "CBS.RECORDS.REPLY",
        "EGITIM.VIEW",
        "EGITIM.PROGRESS.VIEW",
        "AJANDA.VIEW",
      ];
    }

    if (template === "employee") {
      keys = [
        "EGITIM.VIEW",
        "EGITIM.PROGRESS.VIEW",
        "EGITIM.CERTIFICATE.VIEW",
        "CBS.VIEW",
        "CBS.RECORDS.CREATE",
        "AJANDA.VIEW",
      ];
    }

    void savePermissions(selectedUser.id, keys);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BRAND.bg,
        padding: "clamp(12px, 2vw, 24px)",
      }}
    >
      <div style={{ maxWidth: 1500, margin: "0 auto", width: "100%" }}>
        <div
          style={{
            ...cardStyle(),
            background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 100%)`,
            color: "#fff",
            marginBottom: 20,
            padding: "clamp(16px, 2.4vw, 24px)",
            borderRadius: 24,
          }}
        >
          <h1 style={{ margin: 0, fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 900 }}>
            Modül ve Yetki Yönetimi V3
          </h1>
          <p style={{ margin: "10px 0 0", color: "rgba(255,255,255,0.92)", lineHeight: 1.7 }}>
            App ve web tarafındaki modül, alt sekme, kart ve işlem yetkilerini kullanıcı bazında yönetin.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 360px) minmax(0, 1fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <section style={cardStyle()}>
            <h2 style={{ marginTop: 0, fontSize: 20, fontWeight: 900 }}>
              Kullanıcı Seç
            </h2>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kullanıcı ara..."
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                fontSize: 14,
                boxSizing: "border-box",
                marginBottom: 10,
              }}
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                background: "#fff",
                fontSize: 14,
                marginBottom: 14,
              }}
            >
              <option value="all">Tüm kullanıcılar</option>
              <option value="app_users">App kullanıcıları</option>
              <option value="isg_uzmani">İSG Uzmanı</option>
              <option value="hekim">İşyeri Hekimi</option>
              <option value="dsp">DSP</option>
              <option value="company_admin">Firma Admin</option>
              <option value="super_admin">Süper Admin</option>
              <option value="operator">Operatör</option>
            </select>

            {loading ? (
              <div style={{ color: BRAND.muted }}>Yükleniyor...</div>
            ) : (
              <div style={{ display: "grid", gap: 8, maxHeight: 650, overflowY: "auto" }}>
                {filteredUsers.map((u) => {
                  const active = selectedUserId === u.id;

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUserId(u.id)}
                      style={{
                        textAlign: "left",
                        border: active ? `2px solid ${BRAND.red}` : `1px solid ${BRAND.border}`,
                        background: active ? "#fff5f5" : "#fff",
                        borderRadius: 14,
                        padding: 12,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 900, color: BRAND.text }}>
                        {u.full_name}
                      </div>
                      <div style={{ fontSize: 12, color: BRAND.muted, marginTop: 4 }}>
                        {u.email}
                      </div>
                      <div style={{ fontSize: 12, color: BRAND.red, marginTop: 6, fontWeight: 800 }}>
                        {getRoleLabel(u.role, u.app_user_type)}
                      </div>
                      <div style={{ fontSize: 11, color: BRAND.muted, marginTop: 4 }}>
                        {u.permissions.length} yetki
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section style={{ display: "grid", gap: 16 }}>
            <div style={cardStyle()}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
                    {selectedUser ? selectedUser.full_name : "Kullanıcı seçilmedi"}
                  </h2>
                  <div style={{ color: BRAND.muted, fontSize: 13, marginTop: 5 }}>
                    {selectedUser
                      ? `${selectedUser.email} • ${getRoleLabel(selectedUser.role, selectedUser.app_user_type)}`
                      : "Yetki yönetimi için soldan kullanıcı seçin."}
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 900, color: saving ? BRAND.red : BRAND.green }}>
                  {saving ? "Kaydediliyor..." : "Hazır"}
                </div>
              </div>

              {selectedUser && (
                <>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginTop: 16,
                    }}
                  >
                    <button type="button" onClick={() => applyTemplate("super_admin")} style={templateButton()}>
                      Süper Admin Şablonu
                    </button>
                    <button type="button" onClick={() => applyTemplate("company_admin")} style={templateButton()}>
                      Firma Admin Şablonu
                    </button>
                    <button type="button" onClick={() => applyTemplate("isg")} style={templateButton()}>
                      İSG Uzmanı Şablonu
                    </button>
                    <button type="button" onClick={() => applyTemplate("hekim")} style={templateButton()}>
                      Hekim Şablonu
                    </button>
                    <button type="button" onClick={() => applyTemplate("dsp")} style={templateButton()}>
                      DSP Şablonu
                    </button>
                    <button type="button" onClick={() => applyTemplate("employee")} style={templateButton()}>
                      Çalışan Şablonu
                    </button>
                    <button
                      type="button"
                      onClick={() => savePermissions(selectedUser.id, [])}
                      style={{
                        ...templateButton(),
                        background: "#fff5f5",
                        color: "#b91c1c",
                        border: "1px solid #fecaca",
                      }}
                    >
                      Tümünü Temizle
                    </button>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <select
                      value={selectedModuleKey}
                      onChange={(e) => setSelectedModuleKey(e.target.value)}
                      style={{
                        width: "100%",
                        maxWidth: 420,
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: `1px solid ${BRAND.border}`,
                        background: "#fff",
                        fontSize: 14,
                      }}
                    >
                      <option value="ALL">Tüm modüller</option>
                      {MODULES.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {selectedUser &&
              visibleModules.map((module) => {
                const mKeys = modulePermissionKeys(module);
                const mCheckedCount = mKeys.filter((k) => selectedPerms.includes(k)).length;
                const moduleAllChecked = mCheckedCount === mKeys.length;

                return (
                  <div key={module.key} style={cardStyle()}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>
                          {module.title}
                        </h3>
                        <p style={{ margin: "6px 0 0", color: BRAND.muted, fontSize: 13 }}>
                          {module.desc}
                        </p>
                      </div>

                      <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 800 }}>
                        <input
                          type="checkbox"
                          checked={moduleAllChecked}
                          disabled={saving}
                          onChange={(e) => toggleKeys(mKeys, e.target.checked)}
                        />
                        Tüm modül yetkileri
                      </label>
                    </div>

                    <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                      {module.groups.map((group) => {
                        const gKeys = groupPermissionKeys(group);
                        const groupAllChecked = gKeys.every((k) => selectedPerms.includes(k));

                        return (
                          <div
                            key={`${module.key}-${group.title}`}
                            style={{
                              border: `1px solid ${BRAND.border}`,
                              borderRadius: 14,
                              padding: 14,
                              background: "#fafafa",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "center",
                                marginBottom: 10,
                              }}
                            >
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 900 }}>
                                  {group.title}
                                </div>
                                <div style={{ fontSize: 12, color: BRAND.muted, marginTop: 3 }}>
                                  {group.desc}
                                </div>
                              </div>

                              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, fontWeight: 800 }}>
                                <input
                                  type="checkbox"
                                  checked={groupAllChecked}
                                  disabled={saving}
                                  onChange={(e) => toggleKeys(gKeys, e.target.checked)}
                                />
                                Grubu seç
                              </label>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: 8,
                              }}
                            >
                              {group.actions.map((action) => {
                                const checked = selectedPerms.includes(action.key);

                                return (
                                  <label
                                    key={action.key}
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      alignItems: "flex-start",
                                      padding: 10,
                                      borderRadius: 12,
                                      border: checked ? "1px solid #86efac" : `1px solid ${BRAND.border}`,
                                      background: checked ? "#f0fdf4" : "#fff",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={saving}
                                      onChange={(e) => togglePermission(action.key, e.target.checked)}
                                      style={{ marginTop: 2 }}
                                    />
                                    <span>
                                      <span style={{ display: "block", fontSize: 13, fontWeight: 850, color: BRAND.text }}>
                                        {action.label}
                                      </span>
                                      <span style={{ display: "block", fontSize: 11, color: BRAND.muted, marginTop: 3 }}>
                                        {action.key}
                                      </span>
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </section>
        </div>
      </div>
    </main>
  );
}

function templateButton(): React.CSSProperties {
  return {
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    borderRadius: 12,
    padding: "9px 12px",
    fontSize: 12,
    fontWeight: 850,
    cursor: "pointer",
  };
}