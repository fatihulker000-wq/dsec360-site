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
  BarChart3
} from "lucide-react";

import type { TrainingExecutiveHeroProps } from "./types";

interface HeroAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const quickActions: HeroAction[] = [
  {
    id: "new",
    label: "Yeni EÄŸitim",
    icon: <Plus size={18} />,
    color: "#2563EB",
  },
  {
    id: "upload",
    label: "Ä°Ã§erik YÃ¼kle",
    icon: <Upload size={18} />,
    color: "#9333EA",
  },
  {
    id: "report",
    label: "Raporlar",
    icon: <BarChart3 size={18} />,
    color: "#EA580C",
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

            <span>EÄŸitim YÃ¶netim Merkezi</span>

          </div>

          <h1 className={styles.heroTitle}>
            {title}
          </h1>

          <p className={styles.heroSubtitle}>
            {companyName}
          </p>

        </div>

        <div className={styles.heroStatus}>

          <div className={styles.statusItem}>

            <BrainCircuit size={18} />

            <span>

              DORA

            </span>

            <strong>

              {aiEnabled ? "AKTÄ°F" : "PASÄ°F"}

            </strong>

          </div>

          <div className={styles.statusItem}>

            <RefreshCw size={18} />

            <span>

              Son Senkronizasyon

            </span>

            <strong>

              {lastSync}

            </strong>

          </div>

        </div>

      </div>
            <div className={styles.heroBody}>

        {/* Sol Alan */}

        <div className={styles.scorePanel}>

          <div className={styles.scoreCircle}>

            <span className={styles.scoreValue}>
              {complianceScore}
            </span>

            <span className={styles.scoreUnit}>
              %
            </span>

          </div>

          <div>

            <h2 className={styles.scoreTitle}>
              EÄŸitim Uygunluk Skoru
            </h2>

            <p className={styles.scoreDescription}>
              EÄŸitim tamamlama, sertifika, iÃ§erik ve
              katÄ±lÄ±mcÄ± durumuna gÃ¶re hesaplanÄ±r.
            </p>

            <div className={styles.heroBadges}>

              <span className={styles.successBadge}>

                <ShieldCheck size={16} />

                Audit HazÄ±r

              </span>

              <span className={styles.infoBadge}>

                <Activity size={16} />

                IBYS HazÄ±r

              </span>

            </div>

          </div>

        </div>

        {/* SaÄŸ Alan */}

        <div className={styles.statsGrid}>

          <div className={styles.statCard}>

            <Building2 size={24} />

            <div>

              <small>
                Toplam EÄŸitim
              </small>

              <h3>
                {totalTrainings}
              </h3>

            </div>

          </div>

          <div className={styles.statCard}>

            <GraduationCap size={24} />

            <div>

              <small>
                Aktif EÄŸitim
              </small>

              <h3>
                {activeTrainings}
              </h3>

            </div>

          </div>

          <div className={styles.statCard}>

            <Award size={24} />

            <div>

              <small>
                Tamamlanan
              </small>

              <h3>
                {completedTrainings}
              </h3>

            </div>

          </div>

          <div className={styles.statCard}>

            <CalendarClock size={24} />

            <div>

              <small>
                Bekleyen
              </small>

              <h3>
                {pendingTrainings}
              </h3>

            </div>

          </div>

          <div className={styles.statCard}>

            <Users size={24} />

            <div>

              <small>
                KatÄ±lÄ±mcÄ±lar
              </small>

              <h3>
                {participantCount}
              </h3>

            </div>

          </div>

          <div className={styles.statCard}>

            <ShieldCheck size={24} />

            <div>

              <small>
                Sertifika Bekleyen
              </small>

              <h3>
                {certificatesWaiting}
              </h3>

            </div>

          </div>

        </div>

      </div>
            {/* HÄ±zlÄ± Ä°ÅŸlemler */}

      <div className={styles.quickActionsSection}>

        <div className={styles.sectionHeader}>

          <h3>

            HÄ±zlÄ± Ä°ÅŸlemler

          </h3>

          <span>

            EÄŸitim yÃ¶netimini hÄ±zlandÄ±rÄ±n

          </span>

        </div>

        <div className={styles.quickActionsGrid}>

          {quickActions.map((action) => (

            <button
              key={action.id}
              className={styles.quickActionButton}
              type="button"
            >

              <div
                className={styles.quickActionIcon}
                style={{
                  background: action.color,
                }}
              >

                {action.icon}

              </div>

              <span>

                {action.label}

              </span>

              <ArrowUpRight
                size={18}
                className={styles.arrowIcon}
              />

            </button>

          ))}

        </div>

      </div>

      {/* Sistem Durumu */}

      <div className={styles.systemHealthGrid}>

        <div className={styles.healthCard}>

          <h4>EÄŸitim SaÄŸlÄ±k Skoru</h4>

          <strong>96 /100</strong>

          <small>

            Video â€¢ PDF â€¢ SÄ±nav â€¢ Sertifika
            yapÄ±sÄ± eksiksiz.

          </small>

        </div>

        <div className={styles.healthCard}>

          <h4>IBYS HazÄ±rlÄ±k</h4>

          <strong>%100</strong>

          <small>

            EÄŸitim kayÄ±tlarÄ±,
            sÃ¼rÃ¼m bilgisi,
            tamamlama verileri
            hazÄ±r.

          </small>

        </div>

        <div className={styles.healthCard}>

          <h4>Audit Log</h4>

          <strong>AKTÄ°F</strong>

          <small>

            TÃ¼m kritik eÄŸitim
            iÅŸlemleri kayÄ±t
            altÄ±na alÄ±nmaya hazÄ±r.

          </small>

        </div>

        <div className={styles.healthCard}>

          <h4>DORA Analizi</h4>

          <strong>Ä°YÄ°</strong>

          <small>

            Kritik eksiklik
            bulunmuyor.

          </small>

        </div>

      </div>
            {/* Alt Bilgi Paneli */}

      <div className={styles.footerPanel}>

        <div className={styles.footerLeft}>

          <h4>D-SEC EÄŸitim YÃ¶netim Merkezi</h4>

          <p>
            EÄŸitimler, katÄ±lÄ±mcÄ±lar, iÃ§erikler, sÄ±navlar,
            sertifikalar ve kurumsal uyumluluk tek panelden
            yÃ¶netilmektedir.
          </p>

        </div>

        <div className={styles.footerRight}>

          <div className={styles.footerBadge}>

            <ShieldCheck size={16} />

            Audit Ready

          </div>

          <div className={styles.footerBadge}>

            <RefreshCw size={16} />

            IBYS Ready

          </div>

          <div className={styles.footerBadge}>

            <BrainCircuit size={16} />

            DORA Active

          </div>

        </div>

      </div>

    </section>
  );
}
