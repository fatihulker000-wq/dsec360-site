"use client";

import styles from "./training.module.css";
import {
  ShieldCheck,
  BrainCircuit,
  GraduationCap,
  RefreshCw,
  Building2,
  Users,
  CalendarClock,
  Award,
  Activity,
  ArrowUpRight,
  Plus,
  Upload,
  BarChart3,
} from "lucide-react";

import type { TrainingExecutiveHeroProps } from "./types";

interface HeroAction {
  id: "new" | "upload" | "report";
  label: string;
  icon: React.ReactNode;
  color: string;
  href: string;
}

const quickActions: HeroAction[] = [
  {
    id: "new",
    label: "Yeni Eğitim",
    icon: <Plus size={18} />,
    color: "#2563EB",
    href: "#training-catalog-section",
  },
  {
    id: "upload",
    label: "İçerik Yükle",
    icon: <Upload size={18} />,
    color: "#9333EA",
    href: "#training-video-manager-section",
  },
  {
    id: "report",
    label: "Raporlar",
    icon: <BarChart3 size={18} />,
    color: "#EA580C",
    href: "#training-reports-section",
  },
];

export default function TrainingExecutiveHero({
  title,
  companyName,
  totalTrainings,
  activeTrainings,
  completedTrainings,
  pendingTrainings,
  certificatesWaiting,
  complianceScore,
  participantCount,
  lastSync,
  aiEnabled,
}: TrainingExecutiveHeroProps) {

  return (
    <section className={styles.hero}>
      <div className={styles.heroTop}>
        <div>
          <div className={styles.heroBadge}>
            <GraduationCap size={18} />
            <span>Eğitim Yönetim Merkezi</span>
          </div>
          <h1 className={styles.heroTitle}>{title}</h1>
          <p className={styles.heroSubtitle}>{companyName}</p>
        </div>

        <div className={styles.heroStatus}>
          <div className={styles.statusItem}>
            <BrainCircuit size={18} />
            <span>DORA</span>
            <strong>{aiEnabled ? "AKTİF" : "PASİF"}</strong>
          </div>
          <div className={styles.statusItem}>
            <RefreshCw size={18} />
            <span>Son Senkronizasyon</span>
            <strong>{lastSync}</strong>
          </div>
        </div>
      </div>

      <div className={styles.heroBody}>
        <div className={styles.scorePanel}>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreValue}>{complianceScore}</span>
            <span className={styles.scoreUnit}>%</span>
          </div>
          <div>
            <h2 className={styles.scoreTitle}>Eğitim Uygunluk Skoru</h2>
            <p className={styles.scoreDescription}>
              Eğitim tamamlama, sertifika, içerik ve katılımcı durumuna göre hesaplanır.
            </p>
            <div className={styles.heroBadges}>
              <span className={styles.successBadge}>
                <ShieldCheck size={16} /> Denetime Hazır
              </span>
              <span className={styles.infoBadge}>
                <Activity size={16} /> İBYS Hazır
              </span>
            </div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}><Building2 size={24} /><div><small>Toplam Eğitim</small><h3>{totalTrainings}</h3></div></div>
          <div className={styles.statCard}><GraduationCap size={24} /><div><small>Aktif Eğitim</small><h3>{activeTrainings}</h3></div></div>
          <div className={styles.statCard}><Award size={24} /><div><small>Tamamlanan</small><h3>{completedTrainings}</h3></div></div>
          <div className={styles.statCard}><CalendarClock size={24} /><div><small>Bekleyen</small><h3>{pendingTrainings}</h3></div></div>
          <div className={styles.statCard}><Users size={24} /><div><small>Katılımcılar</small><h3>{participantCount}</h3></div></div>
          <div className={styles.statCard}><ShieldCheck size={24} /><div><small>Sertifika Bekleyen</small><h3>{certificatesWaiting}</h3></div></div>
        </div>
      </div>

      <div className={styles.quickActionsSection}>
        <div className={styles.sectionHeader}>
          <h3>Hızlı İşlemler</h3>
          <span>Eğitim yönetimini hızlandırın</span>
        </div>

        <div className={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <a
              key={action.id}
              className={styles.quickActionButton}
              href={action.href}
              style={{ textDecoration: "none" }}
            >
              <div className={styles.quickActionIcon} style={{ background: action.color }}>
                {action.icon}
              </div>
              <span>{action.label}</span>
              <ArrowUpRight size={18} className={styles.arrowIcon} />
            </a>
          ))}
        </div>
      </div>

      <div className={styles.systemHealthGrid}>
        <div className={styles.healthCard}><h4>Eğitim Sağlık Skoru</h4><strong>96 / 100</strong><small>Video • PDF • Sınav • Sertifika yapısı eksiksiz.</small></div>
        <div className={styles.healthCard}><h4>İBYS Hazırlık</h4><strong>%100</strong><small>Eğitim kayıtları, sürüm bilgisi ve tamamlama verileri hazır.</small></div>
        <div className={styles.healthCard}><h4>Denetim Kaydı</h4><strong>AKTİF</strong><small>Tüm kritik eğitim işlemleri kayıt altına alınmaya hazır.</small></div>
        <div className={styles.healthCard}><h4>DORA Analizi</h4><strong>İYİ</strong><small>Kritik eksiklik bulunmuyor.</small></div>
      </div>

      <div className={styles.footerPanel}>
        <div className={styles.footerLeft}>
          <h4>D-SEC Eğitim Yönetim Merkezi</h4>
          <p>Eğitimler, katılımcılar, içerikler, sınavlar, sertifikalar ve kurumsal uyumluluk tek panelden yönetilmektedir.</p>
        </div>
        <div className={styles.footerRight}>
          <div className={styles.footerBadge}><ShieldCheck size={16} /> Denetime Hazır</div>
          <div className={styles.footerBadge}><RefreshCw size={16} /> İBYS Hazır</div>
          <div className={styles.footerBadge}><BrainCircuit size={16} /> DORA Aktif</div>
        </div>
      </div>
    </section>
  );
}