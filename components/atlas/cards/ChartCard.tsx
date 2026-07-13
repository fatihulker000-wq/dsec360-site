import { ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import styles from "./ChartCard.module.css";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  minHeight?: number;
}

export default function ChartCard({
  title,
  description,
  children,
  actions,
  footer,
  minHeight = 320,
}: ChartCardProps) {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.iconBox}>
            <BarChart3 size={20} />
          </div>

          <div>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </div>
        </div>

        {actions && <div className={styles.actions}>{actions}</div>}
      </div>

      <div className={styles.content} style={{ minHeight }}>
        {children}
      </div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </section>
  );
}