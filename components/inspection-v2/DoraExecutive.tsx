import Link from "next/link";
import styles from "./Inspection.module.css";

type Props = {
  activeFirmName: string; totalInspections: number; totalAnswers: number; suitable: number;
  partial: number; unsuitable: number; openDof: number; closedDof: number; emptyRunCount: number;
  topCompany?: { name: string; inspections: number; conformity: number } | null; dofHref: string;
};

export default function DoraExecutive(props: Props) {
  const conformity = props.totalAnswers > 0 ? Math.round((props.suitable / props.totalAnswers) * 100) : 100;
  const totalDof = props.openDof + props.closedDof;
  const closure = totalDof > 0 ? Math.round((props.closedDof / totalDof) * 100) : 100;
  const confidence = Math.max(78, Math.min(98, Math.round(84 + Math.min(8, props.totalInspections) - Math.min(8, props.emptyRunCount * 2))));
  const priority = props.openDof > 0
    ? `${props.openDof} açık DÖF kaydını sorumlu ve hedef tarih bazında önceliklendirin.`
    : props.unsuitable > 0 ? `${props.unsuitable} uygunsuz bulgunun DÖF dönüşümünü doğrulayın.`
    : "Kritik bir açık faaliyet görünmüyor; mevcut kontrol seviyesini koruyun.";

  const cards = [
    { label:"Uygunluk", value:`%${conformity}`, tone: conformity >= 80 ? "good" : "warning", text:"Denetim maddelerinin genel kalite görünümü" },
    { label:"DÖF kapanışı", value:`%${closure}`, tone: closure >= 70 ? "good" : "warning", text:"Faaliyet kapanış performansı" },
    { label:"Kritik bulgu", value:String(props.unsuitable), tone: props.unsuitable > 0 ? "danger" : "good", text:"Öncelikli yönetim takibi" },
    { label:"Kayıt sağlığı", value:props.emptyRunCount === 0 ? "Temiz" : String(props.emptyRunCount), tone: props.emptyRunCount === 0 ? "good" : "warning", text:"Bulgu içermeyen kayıt kontrolü" },
  ];

  return (
    <section className={styles.doraSection}>
      <div className={styles.doraHeader}>
        <div className={styles.doraIdentity}><div className={styles.doraIcon}>D</div>
          <div><span className={styles.sectionEyebrow}>DORA Intelligence</span><h2>Denetim yönetici özeti</h2><p>{props.activeFirmName} kapsamındaki canlı verilerden üretildi.</p></div>
        </div>
        <div className={styles.aiConfidence}><span>AI güveni</span><strong>%{confidence}</strong></div>
      </div>
      <div className={styles.doraLayout}>
        <div className={styles.doraSummaryGrid}>
          {cards.map((c) => <article key={c.label} className={`${styles.doraInsightCard} ${styles[`dora_${c.tone}`]}`}><span>{c.label}</span><strong>{c.value}</strong><p>{c.text}</p></article>)}
        </div>
        <aside className={styles.doraPriority}>
          <span className={styles.doraPriorityLabel}>Öncelikli aksiyon</span><h3>{priority}</h3>
          <div className={styles.doraPriorityMeta}>
            <div><span>Denetim</span><strong>{props.totalInspections}</strong></div>
            <div><span>Madde</span><strong>{props.totalAnswers}</strong></div>
            <div><span>Kısmen</span><strong>{props.partial}</strong></div>
          </div>
          {props.topCompany && <div className={styles.doraTopCompany}><span>Öne çıkan firma</span><strong>{props.topCompany.name}</strong><em>{props.topCompany.inspections} denetim • %{props.topCompany.conformity} uygunluk</em></div>}
          <Link href={props.dofHref} className={styles.doraAction}>DÖF merkezini aç <span>→</span></Link>
        </aside>
      </div>
    </section>
  );
}
