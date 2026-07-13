import { ReactNode } from "react";
import styles from "./DashboardGrid.module.css";

interface DashboardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export default function DashboardGrid({
  children,
  columns = 4,
  className = "",
}: DashboardGridProps) {
  return (
    <div
      className={`${styles.grid} ${styles[`columns${columns}`]} ${className}`}
    >
      {children}
    </div>
  );
}