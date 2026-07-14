import Link from "next/link";
import styles from "./Inspection.module.css";

type DoraExecutiveProps = {
  activeFirmName: string;
  totalInspections: number;
  totalAnswers: number;
  suitable: number;
  partial: number;
  unsuitable: number;
  openDof: number;
  closedDof: number;
  emptyRunCount: number;
  topCompany?: {
    name: string;
    inspections: number;
    conformity: number;
  } | null;
  dofHref: string;
};

export default function DoraExecutive({
  activeFirmName,
  totalInspections,
  totalAnswers,
  suitable,
  partial,
  unsuitable,
  openDof,
  closedDof,
  emptyRunCount,
  topCompany,
  dofHref,
}: DoraExecutiveProps) {
  const conformityRate =
    totalAnswers > 0
      ? Math.round((suitable / totalAnswers) * 100)
      : 100;

  const totalDof = openDof + closedDof;

  const closureRate =
    totalDof > 0
      ? Math.round((closedDof / totalDof) * 100)
      : 100;

  const confidence = Math.max(
    78,
    Math.min(
      98,
      Math.round(
        84 +
          Math.min(8, totalInspections) -
          Math.min(8, emptyRunCount * 2)
      )
    )
  );

  const priorityText =
    openDof > 0
      ? `${openDof} açık DÖF kaydını sorumlu ve hedef tarih bazında önceliklendirin.`
      : unsuitable > 0
        ? `${unsuitable} uygunsuz bulgunun DÖF dönüşümünü doğrulayın.`
        : "Kritik bir açık faaliyet görünmüyor; mevcut kontrol seviyesini koruyun.";

  const summaryItems = [
    {
      label: "Uygunluk",
      value: `%${conformityRate}`,
      tone: conformityRate >= 80 ? "good" : "warning",
      text:
        conformityRate >= 80
          ? "Denetim maddelerinde güçlü görünüm"
          : "Uygunluk performansında iyileştirme gerekli",
    },
    {
      label: "DÖF kapanışı",
      value: `%${closureRate}`,
      tone: closureRate >= 70 ? "good" : "warning",
      text:
        closureRate >= 70
          ? "Faaliyet kapanış performansı kontrollü"
          : "Açık faaliyetlerin kapanış hızı artırılmalı",
    },
    {
      label: "Kritik bulgu",
      value: String(unsuitable),
      tone: unsuitable > 0 ? "danger" : "good",
      text:
        unsuitable > 0
          ? "Öncelikli yönetim takibi gerekiyor"
          : "Kritik uygunsuzluk görünmüyor",
    },
    {
      label: "Kayıt sağlığı",
      value: emptyRunCount === 0 ? "Temiz" : `${emptyRunCount}`,
      tone: emptyRunCount === 0 ? "good" : "warning",
      text:
        emptyRunCount === 0
          ? "Bulgu içermeyen denetim kaydı yok"
          : "Bulgu sayısı sıfır olan kayıtlar kontrol edilmeli",
    },
  ];

  return (
    <section className={styles.doraSection}>
      <div className={styles.doraHeader}>
        <div className={styles.doraIdentity}>
          <div className={styles.doraIcon}>D</div>

          <div>
            <span className={styles.sectionEyebrow}>
              DORA Intelligence
            </span>

            <h2>Denetim yönetici özeti</h2>

            <p>
              {activeFirmName} kapsamındaki canlı denetim
              verilerinden üretildi.
            </p>
          </div>
        </div>

        <div className={styles.aiConfidence}>
          <span>AI güveni</span>
          <strong>%{confidence}</strong>
        </div>
      </div>

      <div className={styles.doraLayout}>
        <div className={styles.doraSummaryGrid}>
          {summaryItems.map((item) => (
            <article
              key={item.label}
              className={`${styles.doraInsightCard} ${
                styles[`dora_${item.tone}`]
              }`}
            >
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.text}</p>
            </article>
          ))}
        </div>

        <aside className={styles.doraPriority}>
          <span className={styles.doraPriorityLabel}>
            Öncelikli aksiyon
          </span>

          <h3>{priorityText}</h3>

          <div className={styles.doraPriorityMeta}>
            <div>
              <span>Toplam denetim</span>
              <strong>{totalInspections}</strong>
            </div>

            <div>
              <span>Toplam madde</span>
              <strong>{totalAnswers}</strong>
            </div>

            <div>
              <span>Kısmen uygun</span>
              <strong>{partial}</strong>
            </div>
          </div>

          {topCompany && (
            <div className={styles.doraTopCompany}>
              <span>Öne çıkan firma</span>
              <strong>{topCompany.name}</strong>

              <em>
                {topCompany.inspections} denetim • %
                {topCompany.conformity} uygunluk
              </em>
            </div>
          )}

          <Link href={dofHref} className={styles.doraAction}>
            DÖF merkezini aç
            <span>→</span>
          </Link>
        </aside>
      </div>
    </section>
  );
}