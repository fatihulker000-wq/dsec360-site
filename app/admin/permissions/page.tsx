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

type AdminMe = {
  id: string;
  full_name: string;
  email: string;
  role: "super_admin" | "company_admin";
  company_id: string;
};

type PermissionAction = {
  key: string;
  label: string;
  desc?: string;

  // Bu yetkiyi kim verebilir?
  // super_admin: Süper admin verebilir
  // company_admin: Firma admini kendi firması içinde verebilir
  assignableBy?: Array<"super_admin" | "company_admin">;

  // Kritik yetkiler için görsel/uyarı amaçlı kullanılacak
  isCritical?: boolean;
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
    key: "DASHBOARD",
    title: "Dashboard",
    desc: "Ana ekran, KPI kartları, grafikler ve yönetici özetleri",
    groups: [
      {
        title: "Genel",
        desc: "Dashboard ana görünüm ve özet kartlar",
        actions: [
          { key: "DASHBOARD.VIEW", label: "Dashboard gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DASHBOARD.KPI.VIEW", label: "KPI kartlarını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DASHBOARD.CHARTS.VIEW", label: "Grafikleri gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DASHBOARD.EXECUTIVE.VIEW", label: "Yönetici özetini gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Yaklaşan İşler",
        desc: "Yaklaşan eğitim, denetim, sağlık ve aksiyon takipleri",
        actions: [
          { key: "DASHBOARD.UPCOMING_TASKS.VIEW", label: "Yaklaşan görevleri gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DASHBOARD.UPCOMING_TRAININGS.VIEW", label: "Yaklaşan eğitimleri gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DASHBOARD.UPCOMING_HEALTH.VIEW", label: "Yaklaşan sağlık/periyodikleri gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DASHBOARD.UPCOMING_INSPECTIONS.VIEW", label: "Yaklaşan denetimleri gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },

  {
    key: "FIRMA_YONETIM",
    title: "Firma Yönetimi",
    desc: "Firma, şube, tehlike sınıfı, lisans ve paket yönetimi",
    groups: [
      {
        title: "Firma İşlemleri",
        desc: "Firma kayıt ve düzenleme işlemleri",
        actions: [
          { key: "FIRMA_YONETIM.VIEW", label: "Firma yönetimini gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "FIRMA_YONETIM.CREATE", label: "Firma oluştur", assignableBy: ["super_admin"], isCritical: true },
          { key: "FIRMA_YONETIM.EDIT", label: "Firma düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "FIRMA_YONETIM.DELETE", label: "Firma sil", assignableBy: ["super_admin"], isCritical: true },
          { key: "FIRMA_YONETIM.BRANCHES.VIEW", label: "Şubeleri gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "FIRMA_YONETIM.BRANCHES.EDIT", label: "Şubeleri düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "FIRMA_YONETIM.DANGER_CLASS.EDIT", label: "Tehlike sınıfı düzenle", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Lisans ve Paket",
        desc: "Sadece süper admin tarafından yönetilecek ticari alanlar",
        actions: [
          { key: "FIRMA_YONETIM.LICENSE.VIEW", label: "Lisans bilgilerini gör", assignableBy: ["super_admin"], isCritical: true },
          { key: "FIRMA_YONETIM.LICENSE.MANAGE", label: "Lisans yönet", assignableBy: ["super_admin"], isCritical: true },
          { key: "FIRMA_YONETIM.PACKAGE.VIEW", label: "Paket bilgilerini gör", assignableBy: ["super_admin"], isCritical: true },
          { key: "FIRMA_YONETIM.PACKAGE.MANAGE", label: "Paket yönet", assignableBy: ["super_admin"], isCritical: true },
          { key: "FIRMA_YONETIM.UNLIMITED_COMPANY", label: "Sınırsız firma yönetimi", assignableBy: ["super_admin"], isCritical: true },
        ],
      },
    ],
  },

  {
    key: "KULLANICI_YONETIMI",
    title: "Kullanıcı Yönetimi",
    desc: "Sistem kullanıcıları, firma kullanıcıları, roller ve yetkiler",
    groups: [
      {
        title: "Kullanıcı İşlemleri",
        desc: "Kullanıcı oluşturma, düzenleme ve pasifleştirme",
        actions: [
          { key: "KULLANICI_YONETIMI.VIEW", label: "Kullanıcı yönetimini gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KULLANICI_YONETIMI.CREATE", label: "Kullanıcı oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "KULLANICI_YONETIMI.EDIT", label: "Kullanıcı düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "KULLANICI_YONETIMI.DELETE", label: "Kullanıcı sil", assignableBy: ["super_admin"], isCritical: true },
          { key: "KULLANICI_YONETIMI.PASSIVE", label: "Kullanıcı pasifleştir", assignableBy: ["super_admin", "company_admin"] },
          { key: "KULLANICI_YONETIMI.RESET_PASSWORD", label: "Şifre sıfırla", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Rol ve Yetki",
        desc: "Rol şablonları ve modül/kart yetkilendirme",
        actions: [
          { key: "KULLANICI_YONETIMI.ROLES.VIEW", label: "Rolleri gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KULLANICI_YONETIMI.ROLES.MANAGE", label: "Rol yönet", assignableBy: ["super_admin"], isCritical: true },
          { key: "KULLANICI_YONETIMI.PERMISSIONS", label: "Yetki yönetimi yap", assignableBy: ["super_admin", "company_admin"] },
          { key: "KULLANICI_YONETIMI.GLOBAL_MANAGE", label: "Global kullanıcı yönetimi", assignableBy: ["super_admin"], isCritical: true },
          { key: "KULLANICI_YONETIMI.UNLIMITED_USER", label: "Sınırsız kullanıcı yönetimi", assignableBy: ["super_admin"], isCritical: true },
        ],
      },
    ],
  },

  {
    key: "SISTEM_AYARLARI",
    title: "Sistem Ayarları",
    desc: "Genel sistem, entegrasyon, yedekleme ve güvenlik ayarları",
    groups: [
      {
        title: "Genel Ayarlar",
        desc: "Platform ayarları ve sistemsel yönetim",
        actions: [
          { key: "SISTEM_AYARLARI.VIEW", label: "Sistem ayarlarını gör", assignableBy: ["super_admin"], isCritical: true },
          { key: "SISTEM_AYARLARI.GENERAL.EDIT", label: "Genel ayarları düzenle", assignableBy: ["super_admin"], isCritical: true },
          { key: "SISTEM_AYARLARI.NOTIFICATIONS.EDIT", label: "Bildirim ayarlarını düzenle", assignableBy: ["super_admin"], isCritical: true },
          { key: "SISTEM_AYARLARI.INTEGRATIONS.EDIT", label: "Entegrasyonları düzenle", assignableBy: ["super_admin"], isCritical: true },
          { key: "SISTEM_AYARLARI.BACKUP.MANAGE", label: "Yedekleme yönet", assignableBy: ["super_admin"], isCritical: true },
          { key: "SISTEM_AYARLARI.SECURITY.MANAGE", label: "Güvenlik ayarlarını yönet", assignableBy: ["super_admin"], isCritical: true },
        ],
      },
    ],
  },

  {
    key: "CALISANLAR",
    title: "Çalışan Yönetimi",
    desc: "Çalışan listesi, detay, belgeler, eğitim ve sağlık bağlantıları",
    groups: [
      {
        title: "Genel",
        desc: "Çalışan modülü erişimi",
        actions: [
          { key: "CALISANLAR.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.LIST.VIEW", label: "Çalışan listesini gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.DETAIL.VIEW", label: "Çalışan detayını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.CREATE", label: "Çalışan ekle", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.EDIT", label: "Çalışan düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.DELETE", label: "Çalışan sil", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Aktarım ve Kartlar",
        desc: "Toplu aktarım, dışa aktarım ve QR kart işlemleri",
        actions: [
          { key: "CALISANLAR.IMPORT.CSV", label: "CSV içe aktar", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.IMPORT.EXCEL", label: "Excel içe aktar", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.EXPORT.EXCEL", label: "Excel dışa aktar", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.EXPORT.PDF", label: "PDF dışa aktar", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.QR_CARD.VIEW", label: "QR kart gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.QR_CARD.CREATE", label: "QR kart oluştur", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Çalışan Alt Kartları",
        desc: "Çalışan detay ekranındaki özel kartlar",
        actions: [
          { key: "CALISANLAR.DOCUMENTS.VIEW", label: "Belgeler kartını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.TRAINING.VIEW", label: "Eğitim geçmişi kartını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.HEALTH_SUMMARY.VIEW", label: "Sağlık özet kartını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.ACCIDENT_HISTORY.VIEW", label: "Kaza geçmişi kartını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "CALISANLAR.RISK_GROUP.VIEW", label: "Risk grubu kartını gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },

  {
    key: "EGITIM",
    title: "Eğitim Yönetimi",
    desc: "Eğitim atama, takip, asenkron eğitim, sınav ve sertifika",
    groups: [
      {
        title: "Genel",
        desc: "Eğitim modülü ve dashboard",
        actions: [
          { key: "EGITIM.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.DASHBOARD.VIEW", label: "Eğitim dashboard gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.LIST.VIEW", label: "Eğitim listesini gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.CREATE", label: "Eğitim oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.EDIT", label: "Eğitim düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.DELETE", label: "Eğitim sil", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Atama ve Takip",
        desc: "Eğitim atama, katılımcı ve ilerleme yönetimi",
        actions: [
          { key: "EGITIM.ASSIGNMENT.VIEW", label: "Atamaları gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.ASSIGNMENT.CREATE", label: "Eğitim ata", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.ASSIGNMENT.EDIT", label: "Atama düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.ASSIGNMENT.DELETE", label: "Atama sil", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.ASSIGNMENT.BULK", label: "Toplu eğitim ata", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.PROGRESS.VIEW", label: "Eğitim ilerlemesini gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Belge ve Sertifika",
        desc: "Katılım formları ve sertifika çıktıları",
        actions: [
          { key: "EGITIM.CERTIFICATE.VIEW", label: "Sertifika gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.CERTIFICATE.PDF", label: "Sertifika PDF al", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.ATTENDANCE.VIEW", label: "Katılım formu gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.ATTENDANCE.PDF", label: "Katılım formu PDF al", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.REPORT.EXCEL", label: "Eğitim Excel raporu al", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Asenkron / Video / Sınav",
        desc: "Online eğitim, video içerik ve sınav yönetimi",
        actions: [
          { key: "EGITIM.ASYNC.VIEW", label: "Asenkron eğitimleri gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.ASYNC.CREATE", label: "Asenkron eğitim oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.VIDEO.VIEW", label: "Video eğitimleri gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.VIDEO.UPLOAD", label: "Video yükle", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.EXAM.VIEW", label: "Sınavları gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.EXAM.CREATE", label: "Sınav oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "EGITIM.EXAM.RESULTS.VIEW", label: "Sınav sonuçlarını gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },

  {
    key: "SAGLIK",
    title: "Sağlık Yönetimi",
    desc: "EK-2, muayene, reçete, sağlık karar destek ve riskli çalışanlar",
    groups: [
      {
        title: "Genel",
        desc: "Sağlık modülü ve özet görünüm",
        actions: [
          { key: "SAGLIK.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "SAGLIK.DASHBOARD.VIEW", label: "Sağlık dashboard gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "SAGLIK.SUMMARY.VIEW", label: "Sağlık özetlerini gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "SAGLIK.SENSITIVE.VIEW", label: "Hassas sağlık verisi gör", assignableBy: ["super_admin"], isCritical: true },
        ],
      },
      {
        title: "EK-2 Raporları",
        desc: "İşe giriş ve periyodik sağlık raporları",
        actions: [
          { key: "SAGLIK.EK2.VIEW_SUMMARY", label: "EK-2 var/yok gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "SAGLIK.EK2.VIEW_DETAIL", label: "EK-2 detay gör", assignableBy: ["super_admin"] },
          { key: "SAGLIK.EK2.CREATE", label: "EK-2 oluştur", assignableBy: ["super_admin"] },
          { key: "SAGLIK.EK2.EDIT", label: "EK-2 düzenle", assignableBy: ["super_admin"] },
          { key: "SAGLIK.EK2.DELETE", label: "EK-2 sil", assignableBy: ["super_admin"], isCritical: true },
          { key: "SAGLIK.EK2.PDF", label: "EK-2 PDF al", assignableBy: ["super_admin"] },
        ],
      },
      {
        title: "Muayene / Reçete",
        desc: "Muayene kayıtları ve reçete işlemleri",
        actions: [
          { key: "SAGLIK.MUAYENE.VIEW", label: "Muayene gör", assignableBy: ["super_admin"] },
          { key: "SAGLIK.MUAYENE.CREATE", label: "Muayene oluştur", assignableBy: ["super_admin"] },
          { key: "SAGLIK.MUAYENE.EDIT", label: "Muayene düzenle", assignableBy: ["super_admin"] },
          { key: "SAGLIK.RECETE.VIEW", label: "Reçete gör", assignableBy: ["super_admin"] },
          { key: "SAGLIK.RECETE.CREATE", label: "Reçete oluştur", assignableBy: ["super_admin"] },
        ],
      },
      {
        title: "Karar Destek ve Riskli Çalışanlar",
        desc: "Riskli çalışanlar, özel gruplar ve karar destek ekranları",
        actions: [
          { key: "SAGLIK.RISKY_EMPLOYEES.VIEW", label: "Riskli çalışanları gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "SAGLIK.DECISION_SUPPORT.VIEW", label: "Sağlık karar destek gör", assignableBy: ["super_admin"] },
          { key: "SAGLIK.REPORTS.VIEW", label: "Sağlık raporlarını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "SAGLIK.REPORTS.PDF", label: "Sağlık PDF raporu al", assignableBy: ["super_admin"] },
        ],
      },
    ],
  },

  {
    key: "RISK_YONETIMI",
    title: "Risk Yönetimi",
    desc: "Risk değerlendirme, Fine Kinney, 5x5, Checklist, HAZOP, FMEA ve aksiyon takibi",
    groups: [
      {
        title: "Genel",
        desc: "Risk modülü ana ekranları",
        actions: [
          { key: "RISK_YONETIMI.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.DASHBOARD.VIEW", label: "Risk dashboard gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.PREMIUM_DASHBOARD.VIEW", label: "Premium risk dashboard gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Risk Metotları",
        desc: "Risk değerlendirme yöntemleri ve özel analiz kartları",
        actions: [
          { key: "RISK_YONETIMI.FINE_KINNEY.VIEW", label: "Fine Kinney gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.FINE_KINNEY.CREATE", label: "Fine Kinney oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.FINE_KINNEY.EDIT", label: "Fine Kinney düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.FINE_KINNEY.DELETE", label: "Fine Kinney sil", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.MATRIX5X5.VIEW", label: "5x5 matris gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.MATRIX5X5.CREATE", label: "5x5 oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.MATRIX5X5.EDIT", label: "5x5 düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.CHECKLIST.VIEW", label: "Checklist gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.CHECKLIST.CREATE", label: "Checklist oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.WHATIF.VIEW", label: "What-If gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.WHATIF.CREATE", label: "What-If oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.HAZOP.VIEW", label: "HAZOP gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.HAZOP.CREATE", label: "HAZOP oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.FMEA.VIEW", label: "FMEA gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.FMEA.CREATE", label: "FMEA oluştur", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Acil Durum ve Aksiyon",
        desc: "Acil durum planı, destek ekipleri, tatbikat ve aksiyon takibi",
        actions: [
          { key: "RISK_YONETIMI.EMERGENCY_PLAN.VIEW", label: "Acil durum planı gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.EMERGENCY_PLAN.EDIT", label: "Acil durum planı düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.SUPPORT_TEAM.VIEW", label: "Acil destek ekiplerini gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.SUPPORT_TEAM.EDIT", label: "Acil destek ekiplerini düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.DRILL.VIEW", label: "Tatbikatları gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.DRILL.CREATE", label: "Tatbikat oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.ACTION.VIEW", label: "Aksiyonları gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.ACTION.CREATE", label: "Aksiyon oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.ACTION.CLOSE", label: "Aksiyon kapat", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Rapor ve Aktarım",
        desc: "Risk raporları, PDF/Excel ve toplu aktarım işlemleri",
        actions: [
          { key: "RISK_YONETIMI.PDF", label: "Risk PDF al", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.EXCEL", label: "Risk Excel al", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.IMPORT", label: "Toplu risk aktarımı", assignableBy: ["super_admin", "company_admin"] },
          { key: "RISK_YONETIMI.EXPORT", label: "Risk dışa aktar", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },
{
    key: "DENETIM",
    title: "Denetim Yönetimi",
    desc: "Klasik, puanlamalı, fotoğraflı, Elmeri denetimleri ve DÖF yönetimi",
    groups: [
      {
        title: "Genel",
        desc: "Denetim ana ekranları",
        actions: [
          { key: "DENETIM.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.DASHBOARD.VIEW", label: "Denetim dashboard gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Denetim Türleri",
        desc: "Klasik, puanlamalı, fotoğraflı ve Elmeri denetimleri",
        actions: [
          { key: "DENETIM.CLASSIC.VIEW", label: "Klasik denetim gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.CLASSIC.CREATE", label: "Klasik denetim başlat", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.CLASSIC.EDIT", label: "Klasik denetim düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.CLASSIC.DELETE", label: "Klasik denetim sil", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.SCORING.VIEW", label: "Puanlamalı denetim gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.SCORING.CREATE", label: "Puanlamalı denetim başlat", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.PHOTO.VIEW", label: "Fotoğraflı denetim gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.PHOTO.CREATE", label: "Fotoğraflı denetim başlat", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.ELMERI.VIEW", label: "Elmeri denetimi gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.ELMERI.CREATE", label: "Elmeri denetimi başlat", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "DÖF",
        desc: "Düzeltici önleyici faaliyet yönetimi",
        actions: [
          { key: "DENETIM.DOF.VIEW", label: "DÖF gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.DOF.CREATE", label: "DÖF oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.DOF.EDIT", label: "DÖF düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.DOF.CLOSE", label: "DÖF kapat", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.DOF.DELETE", label: "DÖF sil", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Rapor",
        desc: "Denetim raporları",
        actions: [
          { key: "DENETIM.PDF", label: "Denetim PDF al", assignableBy: ["super_admin", "company_admin"] },
          { key: "DENETIM.EXCEL", label: "Denetim Excel al", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },

  {
    key: "KAZA_OLAY_YONETIMI",
    title: "Kaza ve Olay Yönetimi",
    desc: "İş kazası, ramak kala, olay, kök neden ve işe dönüş eğitimi",
    groups: [
      {
        title: "Genel",
        desc: "Kaza ve olay modülü",
        actions: [
          { key: "KAZA_OLAY_YONETIMI.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KAZA_OLAY_YONETIMI.DASHBOARD.VIEW", label: "Kaza dashboard gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KAZA_OLAY_YONETIMI.CREATE", label: "Yeni kayıt oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "KAZA_OLAY_YONETIMI.EDIT", label: "Kayıt düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "KAZA_OLAY_YONETIMI.DELETE", label: "Kayıt sil", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Kayıt Türleri",
        desc: "İş kazası, ramak kala ve meslek hastalığı",
        actions: [
          { key: "KAZA_OLAY_YONETIMI.ACCIDENT.VIEW", label: "İş kazalarını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KAZA_OLAY_YONETIMI.NEAR_MISS.VIEW", label: "Ramak kala kayıtlarını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KAZA_OLAY_YONETIMI.OCCUPATIONAL_DISEASE.VIEW", label: "Meslek hastalığı kayıtlarını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KAZA_OLAY_YONETIMI.PHOTOS.VIEW", label: "Fotoğrafları gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Analiz ve Eğitim",
        desc: "Kök neden analizi ve işe dönüş eğitimi",
        actions: [
          { key: "KAZA_OLAY_YONETIMI.ROOT_CAUSE.VIEW", label: "Kök neden analizi gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KAZA_OLAY_YONETIMI.ROOT_CAUSE.EDIT", label: "Kök neden analizi düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "KAZA_OLAY_YONETIMI.RETURN_TRAINING.VIEW", label: "İşe dönüş eğitimi gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KAZA_OLAY_YONETIMI.RETURN_TRAINING.COMPLETE", label: "İşe dönüş eğitimini tamamla", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Rapor",
        desc: "Kaza raporları ve istatistikler",
        actions: [
          { key: "KAZA_OLAY_YONETIMI.PDF", label: "Kaza PDF al", assignableBy: ["super_admin", "company_admin"] },
          { key: "KAZA_OLAY_YONETIMI.EXCEL", label: "Kaza Excel al", assignableBy: ["super_admin", "company_admin"] },
          { key: "KAZA_OLAY_YONETIMI.STATS.VIEW", label: "Kaza istatistiklerini gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },

  {
    key: "DOKUMANTASYON",
    title: "Dokümantasyon",
    desc: "Form, talimat, kurul, eğitim, risk ve şablon dokümanları",
    groups: [
      {
        title: "Genel",
        desc: "Doküman yönetimi",
        actions: [
          { key: "DOKUMANTASYON.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DOKUMANTASYON.CREATE", label: "Doküman ekle", assignableBy: ["super_admin", "company_admin"] },
          { key: "DOKUMANTASYON.EDIT", label: "Doküman düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "DOKUMANTASYON.DELETE", label: "Doküman sil", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Doküman Kartları",
        desc: "Dokümantasyon modülü alt kartları",
        actions: [
          { key: "DOKUMANTASYON.FORMS.VIEW", label: "Formları gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DOKUMANTASYON.INSTRUCTIONS.VIEW", label: "Talimatları gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DOKUMANTASYON.TRAINING_DOCS.VIEW", label: "Eğitim dokümanlarını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DOKUMANTASYON.BOARD_DOCS.VIEW", label: "Kurul dokümanlarını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DOKUMANTASYON.RISK_DOCS.VIEW", label: "Risk dokümanlarını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "DOKUMANTASYON.TEMPLATES.VIEW", label: "Şablonları gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Çıktılar",
        desc: "Doküman dışa aktarım işlemleri",
        actions: [
          { key: "DOKUMANTASYON.PDF", label: "PDF al", assignableBy: ["super_admin", "company_admin"] },
          { key: "DOKUMANTASYON.WORD", label: "Word al", assignableBy: ["super_admin", "company_admin"] },
          { key: "DOKUMANTASYON.EXCEL", label: "Excel al", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },

  {
    key: "ACIL_DURUM",
    title: "Acil Durum Yönetimi",
    desc: "Acil durum planı, destek ekipleri, tatbikat, senaryo ve toplanma alanları",
    groups: [
      {
        title: "Genel",
        desc: "Acil durum modülü",
        actions: [
          { key: "ACIL_DURUM.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "ACIL_DURUM.PLAN.VIEW", label: "Acil durum planı gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "ACIL_DURUM.PLAN.EDIT", label: "Acil durum planı düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "ACIL_DURUM.PDF", label: "Acil durum PDF al", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Kartlar",
        desc: "Acil durum alt kartları",
        actions: [
          { key: "ACIL_DURUM.SUPPORT_TEAMS.VIEW", label: "Destek ekiplerini gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "ACIL_DURUM.SUPPORT_TEAMS.EDIT", label: "Destek ekiplerini düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "ACIL_DURUM.DRILLS.VIEW", label: "Tatbikatları gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "ACIL_DURUM.DRILLS.CREATE", label: "Tatbikat oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "ACIL_DURUM.SCENARIOS.VIEW", label: "Senaryoları gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "ACIL_DURUM.ASSEMBLY_AREAS.VIEW", label: "Toplanma alanlarını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "ACIL_DURUM.ESCAPE_ROUTES.VIEW", label: "Kaçış planlarını gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },

  {
    key: "TASERON",
    title: "Taşeron Yönetimi",
    desc: "Taşeron firma, çalışan, evrak ve giriş kayıtları",
    groups: [
      {
        title: "Genel",
        desc: "Taşeron modülü",
        actions: [
          { key: "TASERON.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "TASERON.COMPANY.VIEW", label: "Taşeron firmaları gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "TASERON.COMPANY.CREATE", label: "Taşeron firma ekle", assignableBy: ["super_admin", "company_admin"] },
          { key: "TASERON.COMPANY.EDIT", label: "Taşeron firma düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "TASERON.COMPANY.DELETE", label: "Taşeron firma sil", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Çalışan / Evrak / Giriş",
        desc: "Taşeron çalışan ve saha giriş uygunluğu",
        actions: [
          { key: "TASERON.EMPLOYEE.VIEW", label: "Taşeron çalışanlarını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "TASERON.EMPLOYEE.CREATE", label: "Taşeron çalışan ekle", assignableBy: ["super_admin", "company_admin"] },
          { key: "TASERON.DOCUMENTS.VIEW", label: "Taşeron evraklarını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "TASERON.DOCUMENTS.APPROVE", label: "Taşeron evrak onayla", assignableBy: ["super_admin", "company_admin"] },
          { key: "TASERON.ENTRY_LOGS.VIEW", label: "Giriş kayıtlarını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "TASERON.REPORTS.VIEW", label: "Taşeron raporlarını gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },

  {
    key: "AJANDA",
    title: "Ajanda",
    desc: "Görev, hatırlatma, takvim ve planlama",
    groups: [
      {
        title: "Genel",
        desc: "Ajanda görev işlemleri",
        actions: [
          { key: "AJANDA.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "AJANDA.TASKS.VIEW", label: "Görevleri gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "AJANDA.CREATE", label: "Görev oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "AJANDA.EDIT", label: "Görev düzenle", assignableBy: ["super_admin", "company_admin"] },
          { key: "AJANDA.DELETE", label: "Görev sil", assignableBy: ["super_admin", "company_admin"] },
          { key: "AJANDA.CALENDAR.VIEW", label: "Takvim gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "AJANDA.REMINDER.VIEW", label: "Hatırlatmaları gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "AJANDA.MAP.VIEW", label: "Harita gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },

  {
    key: "MEVZUAT",
    title: "Mevzuat",
    desc: "Mevzuat kütüphanesi, favoriler ve bağlantılar",
    groups: [
      {
        title: "Genel",
        desc: "Mevzuat erişimi",
        actions: [
          { key: "MEVZUAT.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "MEVZUAT.LIST.VIEW", label: "Mevzuat listesini gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "MEVZUAT.LINK_OPEN", label: "Bağlantı aç", assignableBy: ["super_admin", "company_admin"] },
          { key: "MEVZUAT.FAVORITE", label: "Favoriye ekle", assignableBy: ["super_admin", "company_admin"] },
          { key: "MEVZUAT.UPDATES.VIEW", label: "Mevzuat güncellemelerini gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },

  {
    key: "RAPORLAMA",
    title: "Raporlama",
    desc: "Yönetici dashboard, AI özet, PDF, Excel, Word ve toplu raporlar",
    groups: [
      {
        title: "Genel",
        desc: "Raporlama ekranları",
        actions: [
          { key: "RAPORLAMA.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RAPORLAMA.EXECUTIVE.VIEW", label: "Executive dashboard gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RAPORLAMA.DETAIL.VIEW", label: "Detaylı raporları gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "RAPORLAMA.AI_SUMMARY.VIEW", label: "AI yönetici özeti gör", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
      {
        title: "Çıktılar",
        desc: "Rapor dışa aktarım işlemleri",
        actions: [
          { key: "RAPORLAMA.PDF", label: "PDF rapor al", assignableBy: ["super_admin", "company_admin"] },
          { key: "RAPORLAMA.EXCEL", label: "Excel rapor al", assignableBy: ["super_admin", "company_admin"] },
          { key: "RAPORLAMA.WORD", label: "Word rapor al", assignableBy: ["super_admin", "company_admin"] },
          { key: "RAPORLAMA.BULK_EXPORT", label: "Toplu rapor al", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },

  {
    key: "CBS",
    title: "ÇBS / Çalışan Bildirim Sistemi",
    desc: "Çalışan öneri, şikayet, talep ve bildirim sistemi",
    groups: [
      {
        title: "Genel",
        desc: "ÇBS kayıt yönetimi",
        actions: [
          { key: "CBS.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "CBS.RECORDS.CREATE", label: "Kayıt oluştur", assignableBy: ["super_admin", "company_admin"] },
          { key: "CBS.RECORDS.VIEW_ASSIGNED", label: "Kendisine gelenleri gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "CBS.RECORDS.VIEW_ALL", label: "Tüm kayıtları gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "CBS.RECORDS.REPLY", label: "Yanıtla", assignableBy: ["super_admin", "company_admin"] },
          { key: "CBS.RECORDS.CLOSE", label: "Kapat", assignableBy: ["super_admin", "company_admin"] },
          { key: "CBS.RECORDS.DELETE", label: "Sil", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },

  {
    key: "AI_ISG",
    title: "AI İSG",
    desc: "AI sohbet, risk analizi, doküman, eğitim ve rapor asistanı",
    groups: [
      {
        title: "Genel",
        desc: "AI destekli İSG işlemleri",
        actions: [
          { key: "AI_ISG.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "AI_ISG.CHAT.VIEW", label: "AI sohbet gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "AI_ISG.RISK_ANALYSIS.USE", label: "AI risk analizi kullan", assignableBy: ["super_admin", "company_admin"] },
          { key: "AI_ISG.DOCUMENT_GENERATE.USE", label: "AI doküman üret", assignableBy: ["super_admin", "company_admin"] },
          { key: "AI_ISG.TRAINING_GENERATE.USE", label: "AI eğitim içeriği üret", assignableBy: ["super_admin", "company_admin"] },
          { key: "AI_ISG.REPORT_ASSISTANT.USE", label: "AI rapor asistanı kullan", assignableBy: ["super_admin", "company_admin"] },
        ],
      },
    ],
  },

  {
    key: "KULLANICI_AKTIVITE",
    title: "Kullanıcı Aktivite Merkezi",
    desc: "Son girişler, oturum süreleri, işlem logları ve modül kullanımı",
    groups: [
      {
        title: "Genel",
        desc: "Kullanıcı aktivite izleme",
        actions: [
          { key: "KULLANICI_AKTIVITE.VIEW", label: "Modülü gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KULLANICI_AKTIVITE.LAST_LOGIN.VIEW", label: "Son girişleri gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KULLANICI_AKTIVITE.LOGS.VIEW", label: "Aktivite loglarını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KULLANICI_AKTIVITE.SESSION_TIME.VIEW", label: "Oturum sürelerini gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KULLANICI_AKTIVITE.MODULE_USAGE.VIEW", label: "Modül kullanımını gör", assignableBy: ["super_admin", "company_admin"] },
          { key: "KULLANICI_AKTIVITE.REPORTS.VIEW", label: "Aktivite raporlarını gör", assignableBy: ["super_admin", "company_admin"] },
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
  const [currentAdmin, setCurrentAdmin] = useState<AdminMe | null>(null);

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
  const currentAdminRole = currentAdmin?.role || "company_admin";

const canCurrentAdminAssignAction = (action: PermissionAction) => {
  if (currentAdminRole === "super_admin") return true;
  return action.assignableBy?.includes("company_admin") === true;
};

const getAssignableKeys = (keys: string[]) => {
  if (currentAdminRole === "super_admin") return keys;

  return keys.filter((key) => {
    const action = MODULES
      .flatMap((m) => m.groups)
      .flatMap((g) => g.actions)
      .find((a) => a.key === key);

    return action?.assignableBy?.includes("company_admin") === true;
  });
};

const loadCurrentAdmin = async () => {
  try {
    const res = await fetch("/api/admin/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }

    const json = await res.json().catch(() => ({}));

    if (json?.success && json?.user) {
      setCurrentAdmin({
        id: String(json.user.id || ""),
        full_name: String(json.user.full_name || ""),
        email: String(json.user.email || ""),
        role: String(json.user.role || "company_admin") as "super_admin" | "company_admin",
        company_id: String(json.user.company_id || ""),
      });
    }
  } catch (error) {
    console.error(error);
  }
};

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
  void loadCurrentAdmin();
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

  const action = MODULES
    .flatMap((m) => m.groups)
    .flatMap((g) => g.actions)
    .find((a) => a.key === key);

  if (!action || !canCurrentAdminAssignAction(action)) return;

  const current = selectedUser.permissions || [];
  const next = checked
    ? Array.from(new Set([...current, key]))
    : current.filter((p) => p !== key);

  void savePermissions(selectedUser.id, next);
};

  const toggleKeys = (keys: string[], checked: boolean) => {
  if (!selectedUser) return;

  const assignableKeys = getAssignableKeys(keys);
  const current = selectedUser.permissions || [];

  const next = checked
    ? Array.from(new Set([...current, ...assignableKeys]))
    : current.filter((p) => !assignableKeys.includes(p));

  void savePermissions(selectedUser.id, next);
};

  type TemplateKey =
  | "super_admin"
  | "company_admin"
  | "isg"
  | "hekim"
  | "dsp"
  | "hr"
  | "auditor"
  | "subcontractor"
  | "department_manager"
  | "employee"
  | "viewer"
  | "ai_operator";

const onlyCompanyAssignableKeys = () =>
  allPermissionKeys().filter((key) => {
    const action = MODULES
      .flatMap((m) => m.groups)
      .flatMap((g) => g.actions)
      .find((a) => a.key === key);

    return action?.assignableBy?.includes("company_admin");
  });

const applyQuickPreset = (
  preset: "readonly" | "operation" | "report" | "view_only"
) => {
  if (!selectedUser) return;

  const assignableKeys = getAssignableKeys(allPermissionKeys());

  let keys: string[] = [];

  if (preset === "readonly") {
    keys = assignableKeys.filter(
      (k) =>
        k.endsWith(".VIEW") ||
        k.includes(".VIEW.") ||
        k.includes("VIEW_") ||
        k.includes("LIST") ||
        k.includes("SUMMARY")
    );
  }

  if (preset === "view_only") {
    keys = assignableKeys.filter((k) => k.includes("VIEW"));
  }

  if (preset === "report") {
    keys = assignableKeys.filter(
      (k) =>
        k.includes("RAPORLAMA") ||
        k.includes("PDF") ||
        k.includes("EXCEL") ||
        k.includes("WORD") ||
        k.includes("REPORT")
    );
  }

  if (preset === "operation") {
    keys = assignableKeys.filter(
      (k) =>
        !k.includes("DELETE") &&
        !k.includes("LICENSE") &&
        !k.includes("PACKAGE") &&
        !k.includes("UNLIMITED") &&
        !k.includes("GLOBAL_MANAGE") &&
        !k.includes("SISTEM_AYARLARI")
    );
  }

  void savePermissions(selectedUser.id, Array.from(new Set(keys)));
};

const applyTemplate = (template: TemplateKey) => {
  if (!selectedUser) return;

  let keys: string[] = [];

  if (template === "super_admin") {
    keys = allPermissionKeys();
  }

  if (template === "company_admin") {
    keys = onlyCompanyAssignableKeys().filter(
      (k) =>
        !k.includes("SAGLIK.SENSITIVE.VIEW") &&
        !k.includes("SAGLIK.EK2.VIEW_DETAIL") &&
        !k.includes("SAGLIK.EK2.CREATE") &&
        !k.includes("SAGLIK.EK2.EDIT") &&
        !k.includes("SAGLIK.EK2.DELETE") &&
        !k.includes("SAGLIK.MUAYENE") &&
        !k.includes("SAGLIK.RECETE")
    );
  }

  if (template === "isg") {
    keys = [
      "DASHBOARD.VIEW",
      "DASHBOARD.KPI.VIEW",
      "DASHBOARD.CHARTS.VIEW",

      "CALISANLAR.VIEW",
      "CALISANLAR.LIST.VIEW",
      "CALISANLAR.DETAIL.VIEW",
      "CALISANLAR.TRAINING.VIEW",
      "CALISANLAR.HEALTH_SUMMARY.VIEW",
      "CALISANLAR.ACCIDENT_HISTORY.VIEW",
      "CALISANLAR.RISK_GROUP.VIEW",

      "EGITIM.VIEW",
      "EGITIM.DASHBOARD.VIEW",
      "EGITIM.LIST.VIEW",
      "EGITIM.CREATE",
      "EGITIM.EDIT",
      "EGITIM.ASSIGNMENT.VIEW",
      "EGITIM.ASSIGNMENT.CREATE",
      "EGITIM.PROGRESS.VIEW",
      "EGITIM.CERTIFICATE.VIEW",
      "EGITIM.CERTIFICATE.PDF",
      "EGITIM.ATTENDANCE.VIEW",
      "EGITIM.ATTENDANCE.PDF",

      "SAGLIK.VIEW",
      "SAGLIK.SUMMARY.VIEW",
      "SAGLIK.EK2.VIEW_SUMMARY",
      "SAGLIK.RISKY_EMPLOYEES.VIEW",

      "RISK_YONETIMI.VIEW",
      "RISK_YONETIMI.DASHBOARD.VIEW",
      "RISK_YONETIMI.PREMIUM_DASHBOARD.VIEW",
      "RISK_YONETIMI.FINE_KINNEY.VIEW",
      "RISK_YONETIMI.FINE_KINNEY.CREATE",
      "RISK_YONETIMI.FINE_KINNEY.EDIT",
      "RISK_YONETIMI.MATRIX5X5.VIEW",
      "RISK_YONETIMI.MATRIX5X5.CREATE",
      "RISK_YONETIMI.MATRIX5X5.EDIT",
      "RISK_YONETIMI.CHECKLIST.VIEW",
      "RISK_YONETIMI.CHECKLIST.CREATE",
      "RISK_YONETIMI.WHATIF.VIEW",
      "RISK_YONETIMI.WHATIF.CREATE",
      "RISK_YONETIMI.HAZOP.VIEW",
      "RISK_YONETIMI.HAZOP.CREATE",
      "RISK_YONETIMI.FMEA.VIEW",
      "RISK_YONETIMI.FMEA.CREATE",
      "RISK_YONETIMI.EMERGENCY_PLAN.VIEW",
      "RISK_YONETIMI.EMERGENCY_PLAN.EDIT",
      "RISK_YONETIMI.SUPPORT_TEAM.VIEW",
      "RISK_YONETIMI.SUPPORT_TEAM.EDIT",
      "RISK_YONETIMI.DRILL.VIEW",
      "RISK_YONETIMI.DRILL.CREATE",
      "RISK_YONETIMI.ACTION.VIEW",
      "RISK_YONETIMI.ACTION.CREATE",
      "RISK_YONETIMI.ACTION.CLOSE",
      "RISK_YONETIMI.PDF",
      "RISK_YONETIMI.EXCEL",
      "RISK_YONETIMI.IMPORT",

      "DENETIM.VIEW",
      "DENETIM.DASHBOARD.VIEW",
      "DENETIM.CLASSIC.VIEW",
      "DENETIM.CLASSIC.CREATE",
      "DENETIM.CLASSIC.EDIT",
      "DENETIM.SCORING.VIEW",
      "DENETIM.SCORING.CREATE",
      "DENETIM.PHOTO.VIEW",
      "DENETIM.PHOTO.CREATE",
      "DENETIM.ELMERI.VIEW",
      "DENETIM.ELMERI.CREATE",
      "DENETIM.DOF.VIEW",
      "DENETIM.DOF.CREATE",
      "DENETIM.DOF.EDIT",
      "DENETIM.DOF.CLOSE",
      "DENETIM.PDF",

      "KAZA_OLAY_YONETIMI.VIEW",
      "KAZA_OLAY_YONETIMI.DASHBOARD.VIEW",
      "KAZA_OLAY_YONETIMI.CREATE",
      "KAZA_OLAY_YONETIMI.EDIT",
      "KAZA_OLAY_YONETIMI.ACCIDENT.VIEW",
      "KAZA_OLAY_YONETIMI.NEAR_MISS.VIEW",
      "KAZA_OLAY_YONETIMI.ROOT_CAUSE.VIEW",
      "KAZA_OLAY_YONETIMI.ROOT_CAUSE.EDIT",
      "KAZA_OLAY_YONETIMI.RETURN_TRAINING.VIEW",
      "KAZA_OLAY_YONETIMI.RETURN_TRAINING.COMPLETE",
      "KAZA_OLAY_YONETIMI.PDF",
      "KAZA_OLAY_YONETIMI.STATS.VIEW",

      "DOKUMANTASYON.VIEW",
      "DOKUMANTASYON.FORMS.VIEW",
      "DOKUMANTASYON.INSTRUCTIONS.VIEW",
      "DOKUMANTASYON.TRAINING_DOCS.VIEW",
      "DOKUMANTASYON.BOARD_DOCS.VIEW",
      "DOKUMANTASYON.RISK_DOCS.VIEW",
      "DOKUMANTASYON.TEMPLATES.VIEW",
      "DOKUMANTASYON.PDF",

      "ACIL_DURUM.VIEW",
      "ACIL_DURUM.PLAN.VIEW",
      "ACIL_DURUM.PLAN.EDIT",
      "ACIL_DURUM.SUPPORT_TEAMS.VIEW",
      "ACIL_DURUM.SUPPORT_TEAMS.EDIT",
      "ACIL_DURUM.DRILLS.VIEW",
      "ACIL_DURUM.DRILLS.CREATE",
      "ACIL_DURUM.SCENARIOS.VIEW",
      "ACIL_DURUM.ASSEMBLY_AREAS.VIEW",
      "ACIL_DURUM.PDF",

      "TASERON.VIEW",
      "TASERON.COMPANY.VIEW",
      "TASERON.EMPLOYEE.VIEW",
      "TASERON.DOCUMENTS.VIEW",
      "TASERON.ENTRY_LOGS.VIEW",

      "AJANDA.VIEW",
      "AJANDA.TASKS.VIEW",
      "AJANDA.CREATE",
      "AJANDA.EDIT",
      "AJANDA.CALENDAR.VIEW",
      "AJANDA.REMINDER.VIEW",

      "MEVZUAT.VIEW",
      "MEVZUAT.LIST.VIEW",
      "MEVZUAT.LINK_OPEN",
      "MEVZUAT.FAVORITE",

      "RAPORLAMA.VIEW",
      "RAPORLAMA.DETAIL.VIEW",
      "RAPORLAMA.PDF",
      "RAPORLAMA.EXCEL",

      "CBS.VIEW",
      "CBS.RECORDS.CREATE",
      "CBS.RECORDS.VIEW_ASSIGNED",
      "CBS.RECORDS.VIEW_ALL",
      "CBS.RECORDS.REPLY",
      "CBS.RECORDS.CLOSE",

      "AI_ISG.VIEW",
      "AI_ISG.CHAT.VIEW",
      "AI_ISG.RISK_ANALYSIS.USE",
      "AI_ISG.DOCUMENT_GENERATE.USE",
      "AI_ISG.TRAINING_GENERATE.USE",
      "AI_ISG.REPORT_ASSISTANT.USE",
    ];
  }

  if (template === "hekim") {
    keys = [
      "DASHBOARD.VIEW",
      "DASHBOARD.KPI.VIEW",

      "CALISANLAR.VIEW",
      "CALISANLAR.LIST.VIEW",
      "CALISANLAR.DETAIL.VIEW",
      "CALISANLAR.HEALTH_SUMMARY.VIEW",
      "CALISANLAR.TRAINING.VIEW",
      "CALISANLAR.ACCIDENT_HISTORY.VIEW",

      "SAGLIK.VIEW",
      "SAGLIK.DASHBOARD.VIEW",
      "SAGLIK.SUMMARY.VIEW",
      "SAGLIK.SENSITIVE.VIEW",
      "SAGLIK.EK2.VIEW_SUMMARY",
      "SAGLIK.EK2.VIEW_DETAIL",
      "SAGLIK.EK2.CREATE",
      "SAGLIK.EK2.EDIT",
      "SAGLIK.EK2.PDF",
      "SAGLIK.MUAYENE.VIEW",
      "SAGLIK.MUAYENE.CREATE",
      "SAGLIK.MUAYENE.EDIT",
      "SAGLIK.RECETE.VIEW",
      "SAGLIK.RECETE.CREATE",
      "SAGLIK.RISKY_EMPLOYEES.VIEW",
      "SAGLIK.DECISION_SUPPORT.VIEW",
      "SAGLIK.REPORTS.VIEW",
      "SAGLIK.REPORTS.PDF",

      "EGITIM.VIEW",
      "EGITIM.PROGRESS.VIEW",

      "KAZA_OLAY_YONETIMI.VIEW",
      "KAZA_OLAY_YONETIMI.ACCIDENT.VIEW",
      "KAZA_OLAY_YONETIMI.PHOTOS.VIEW",

      "AJANDA.VIEW",
      "AJANDA.TASKS.VIEW",
      "AJANDA.CREATE",
      "AJANDA.EDIT",
      "AJANDA.CALENDAR.VIEW",

      "MEVZUAT.VIEW",
      "MEVZUAT.LIST.VIEW",
      "MEVZUAT.LINK_OPEN",
    ];
  }

  if (template === "dsp") {
    keys = [
      "DASHBOARD.VIEW",

      "CALISANLAR.VIEW",
      "CALISANLAR.LIST.VIEW",
      "CALISANLAR.DETAIL.VIEW",
      "CALISANLAR.HEALTH_SUMMARY.VIEW",

      "SAGLIK.VIEW",
      "SAGLIK.DASHBOARD.VIEW",
      "SAGLIK.SUMMARY.VIEW",
      "SAGLIK.EK2.VIEW_SUMMARY",
      "SAGLIK.MUAYENE.VIEW",
      "SAGLIK.RISKY_EMPLOYEES.VIEW",

      "EGITIM.VIEW",
      "EGITIM.PROGRESS.VIEW",

      "AJANDA.VIEW",
      "AJANDA.TASKS.VIEW",

      "CBS.VIEW",
      "CBS.RECORDS.VIEW_ASSIGNED",
      "CBS.RECORDS.REPLY",
    ];
  }

  if (template === "hr") {
    keys = [
      "DASHBOARD.VIEW",
      "DASHBOARD.KPI.VIEW",

      "CALISANLAR.VIEW",
      "CALISANLAR.LIST.VIEW",
      "CALISANLAR.DETAIL.VIEW",
      "CALISANLAR.CREATE",
      "CALISANLAR.EDIT",
      "CALISANLAR.IMPORT.CSV",
      "CALISANLAR.IMPORT.EXCEL",
      "CALISANLAR.EXPORT.EXCEL",
      "CALISANLAR.DOCUMENTS.VIEW",
      "CALISANLAR.TRAINING.VIEW",
      "CALISANLAR.HEALTH_SUMMARY.VIEW",

      "EGITIM.VIEW",
      "EGITIM.DASHBOARD.VIEW",
      "EGITIM.LIST.VIEW",
      "EGITIM.CREATE",
      "EGITIM.EDIT",
      "EGITIM.ASSIGNMENT.VIEW",
      "EGITIM.ASSIGNMENT.CREATE",
      "EGITIM.ASSIGNMENT.BULK",
      "EGITIM.PROGRESS.VIEW",
      "EGITIM.CERTIFICATE.VIEW",
      "EGITIM.CERTIFICATE.PDF",
      "EGITIM.ATTENDANCE.VIEW",
      "EGITIM.ATTENDANCE.PDF",

      "DOKUMANTASYON.VIEW",
      "DOKUMANTASYON.FORMS.VIEW",
      "DOKUMANTASYON.TRAINING_DOCS.VIEW",
      "DOKUMANTASYON.TEMPLATES.VIEW",
      "DOKUMANTASYON.PDF",

      "AJANDA.VIEW",
      "AJANDA.TASKS.VIEW",
      "AJANDA.CREATE",
      "AJANDA.EDIT",

      "RAPORLAMA.VIEW",
      "RAPORLAMA.DETAIL.VIEW",
      "RAPORLAMA.PDF",
      "RAPORLAMA.EXCEL",
    ];
  }

  if (template === "auditor") {
    keys = [
      "DASHBOARD.VIEW",
      "DENETIM.VIEW",
      "DENETIM.DASHBOARD.VIEW",
      "DENETIM.CLASSIC.VIEW",
      "DENETIM.CLASSIC.CREATE",
      "DENETIM.SCORING.VIEW",
      "DENETIM.SCORING.CREATE",
      "DENETIM.PHOTO.VIEW",
      "DENETIM.PHOTO.CREATE",
      "DENETIM.ELMERI.VIEW",
      "DENETIM.ELMERI.CREATE",
      "DENETIM.DOF.VIEW",
      "DENETIM.DOF.CREATE",
      "DENETIM.DOF.CLOSE",
      "DENETIM.PDF",
      "DENETIM.EXCEL",

      "RISK_YONETIMI.VIEW",
      "RISK_YONETIMI.DASHBOARD.VIEW",
      "RISK_YONETIMI.FINE_KINNEY.VIEW",
      "RISK_YONETIMI.MATRIX5X5.VIEW",
      "RISK_YONETIMI.ACTION.VIEW",

      "DOKUMANTASYON.VIEW",
      "DOKUMANTASYON.FORMS.VIEW",
      "DOKUMANTASYON.INSTRUCTIONS.VIEW",

      "RAPORLAMA.VIEW",
      "RAPORLAMA.DETAIL.VIEW",
      "RAPORLAMA.PDF",

      "MEVZUAT.VIEW",
      "MEVZUAT.LINK_OPEN",
    ];
  }

  if (template === "subcontractor") {
    keys = [
      "TASERON.VIEW",
      "TASERON.COMPANY.VIEW",
      "TASERON.EMPLOYEE.VIEW",
      "TASERON.EMPLOYEE.CREATE",
      "TASERON.DOCUMENTS.VIEW",
      "TASERON.ENTRY_LOGS.VIEW",
      "AJANDA.VIEW",
      "AJANDA.TASKS.VIEW",
      "CBS.VIEW",
      "CBS.RECORDS.CREATE",
    ];
  }

  if (template === "department_manager") {
    keys = [
      "DASHBOARD.VIEW",
      "DASHBOARD.KPI.VIEW",
      "CALISANLAR.VIEW",
      "CALISANLAR.LIST.VIEW",
      "CALISANLAR.DETAIL.VIEW",
      "EGITIM.VIEW",
      "EGITIM.PROGRESS.VIEW",
      "RISK_YONETIMI.VIEW",
      "RISK_YONETIMI.ACTION.VIEW",
      "DENETIM.VIEW",
      "DENETIM.DOF.VIEW",
      "AJANDA.VIEW",
      "AJANDA.TASKS.VIEW",
      "AJANDA.EDIT",
      "CBS.VIEW",
      "CBS.RECORDS.CREATE",
      "CBS.RECORDS.VIEW_ASSIGNED",
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
      "AJANDA.TASKS.VIEW",
      "DOKUMANTASYON.VIEW",
      "DOKUMANTASYON.TRAINING_DOCS.VIEW",
    ];
  }

  if (template === "viewer") {
    keys = [
      "DASHBOARD.VIEW",
      "DASHBOARD.KPI.VIEW",
      "RAPORLAMA.VIEW",
      "RAPORLAMA.DETAIL.VIEW",
      "DOKUMANTASYON.VIEW",
      "DOKUMANTASYON.FORMS.VIEW",
      "DOKUMANTASYON.INSTRUCTIONS.VIEW",
      "MEVZUAT.VIEW",
      "MEVZUAT.LIST.VIEW",
    ];
  }

  if (template === "ai_operator") {
    keys = [
      "AI_ISG.VIEW",
      "AI_ISG.CHAT.VIEW",
      "AI_ISG.RISK_ANALYSIS.USE",
      "AI_ISG.DOCUMENT_GENERATE.USE",
      "AI_ISG.TRAINING_GENERATE.USE",
      "AI_ISG.REPORT_ASSISTANT.USE",
    ];
  }

  const finalKeys =
  currentAdminRole === "super_admin"
    ? keys
    : getAssignableKeys(keys);

void savePermissions(selectedUser.id, Array.from(new Set(finalKeys)));
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
  👑 Süper Admin
</button>

<button type="button" onClick={() => applyTemplate("company_admin")} style={templateButton()}>
  🏢 Firma Admini
</button>

<button type="button" onClick={() => applyTemplate("isg")} style={templateButton()}>
  🦺 İSG Uzmanı
</button>

<button type="button" onClick={() => applyTemplate("hekim")} style={templateButton()}>
  👨‍⚕️ İşyeri Hekimi
</button>

<button type="button" onClick={() => applyTemplate("dsp")} style={templateButton()}>
  👩‍⚕️ DSP
</button>

<button type="button" onClick={() => applyTemplate("hr")} style={templateButton()}>
  👨‍💼 İnsan Kaynakları
</button>

<button type="button" onClick={() => applyTemplate("auditor")} style={templateButton()}>
  🔍 Denetçi
</button>

<button type="button" onClick={() => applyTemplate("subcontractor")} style={templateButton()}>
  🏗️ Taşeron Yetkilisi
</button>

<button type="button" onClick={() => applyTemplate("department_manager")} style={templateButton()}>
  🧑‍💼 Birim Sorumlusu
</button>

<button type="button" onClick={() => applyTemplate("employee")} style={templateButton()}>
  👷 Çalışan
</button>

<button type="button" onClick={() => applyTemplate("viewer")} style={templateButton()}>
  👀 Salt Okunur
</button>

<button type="button" onClick={() => applyTemplate("ai_operator")} style={templateButton()}>
  🤖 AI Operatörü
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


<div
  style={{
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  }}
>
  <button
    type="button"
    onClick={() => applyQuickPreset("readonly")}
    style={templateButton()}
  >
    👀 Sadece Görüntüleme
  </button>

  <button
    type="button"
    onClick={() => applyQuickPreset("operation")}
    style={templateButton()}
  >
    ⚙️ Operasyon Yetkisi
  </button>

  <button
    type="button"
    onClick={() => applyQuickPreset("report")}
    style={templateButton()}
  >
    📊 Sadece Rapor
  </button>

  <button
    type="button"
    onClick={() => applyQuickPreset("view_only")}
    style={templateButton()}
  >
    🔒 Salt Okunur
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
  disabled={
    saving ||
    getAssignableKeys(mKeys).length === 0
  }
  onChange={(e) =>
    toggleKeys(mKeys, e.target.checked)
  }
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
  disabled={
    saving ||
    getAssignableKeys(gKeys).length === 0
  }
  onChange={(e) =>
    toggleKeys(gKeys, e.target.checked)
  }
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
                                const canAssign =
  canCurrentAdminAssignAction(action);

                                return (
                                  <label
                                    key={action.key}
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      alignItems: "flex-start",
                                      padding: 10,
                                      borderRadius: 12,
                                      border: !canAssign
  ? "1px dashed #cbd5e1"
  : checked
  ? "1px solid #86efac"
  : `1px solid ${BRAND.border}`,
                                      background: !canAssign
  ? "#f3f4f6"
  : checked
  ? "#f0fdf4"
  : "#fff",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <input
  type="checkbox"
  checked={checked}
  disabled={
    saving ||
    !canAssign
  }
                                      onChange={(e) => togglePermission(action.key, e.target.checked)}
                                      style={{ marginTop: 2 }}
                                    />
                                    <span>
                                      <span style={{ display: "block", fontSize: 13, fontWeight: 850, color: BRAND.text }}>
                                        {action.label}
                                      </span>
                                      <span
  style={{
    display: "block",
    fontSize: 11,
    color: BRAND.muted,
    marginTop: 3,
  }}
>
  {action.key}
</span>

{!canAssign && (
  <span
    style={{
      display: "block",
      fontSize: 10,
      color: "#dc2626",
      marginTop: 4,
      fontWeight: 700,
    }}
  >
    🔒 Sadece Süper Admin tarafından atanabilir
  </span>
)}
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