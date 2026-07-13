import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import styles from "./PageHeader.module.css";

export type PageHeaderMeta = {
  label: string;
  icon?: ReactNode;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  meta?: PageHeaderMeta[];
};

export default function PageHeader({
  title,
  description,
  eyebrow = "D-SEC Enterprise",
  actions,
  meta = [],
}: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>
            <Sparkles size={15} strokeWidth={2.3} aria-hidden="true" />
            {eyebrow}
          </p>

          <h1 className={styles.title}>{title}</h1>

          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}

          {meta.length > 0 ? (
            <div className={styles.meta} aria-label="Sayfa bilgileri">
              {meta.map((item, index) => (
                <span className={styles.metaItem} key={`${item.label}-${index}`}>
                  {item.icon}
                  {item.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  );
}
