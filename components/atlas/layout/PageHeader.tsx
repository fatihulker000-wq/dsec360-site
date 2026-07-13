"use client";

import styles from "./PageHeader.module.css";
import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;

  breadcrumbs?: BreadcrumbItem[];

  actions?: ReactNode;

  children?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  children,
}: PageHeaderProps) {
  return (
    <header className={styles.wrapper}>
      {breadcrumbs.length > 0 && (
        <nav className={styles.breadcrumbs}>
          {breadcrumbs.map((item, index) => (
            <div key={index} className={styles.crumb}>
              <span>{item.label}</span>

              {index < breadcrumbs.length - 1 && (
                <ChevronRight size={14} />
              )}
            </div>
          ))}
        </nav>
      )}

      <div className={styles.topRow}>
        <div>
          <h1>{title}</h1>

          {subtitle && (
            <p>{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className={styles.actions}>
            {actions}
          </div>
        )}
      </div>

      {children && (
        <div className={styles.extra}>
          {children}
        </div>
      )}
    </header>
  );
}