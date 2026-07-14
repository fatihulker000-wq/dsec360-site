"use client";

import {
  Maximize2,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import styles from "./DashboardV3.module.css";

type DashboardToolbarProps = {
  onRefresh: () => void;
  onExportPDF: () => void;
};

export default function DashboardToolbar({
  onRefresh,
  onExportPDF,
}: DashboardToolbarProps) {
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  return (
    <div className={styles.dashboardToolbar}>
      <button className={styles.toolbarButton} type="button" onClick={onRefresh}>
        <RefreshCw size={17} />
        Yenile
      </button>

      <button className={styles.toolbarButton} type="button" onClick={toggleFullscreen}>
        <Maximize2 size={17} />
        Tam ekran
      </button>

      <button className={styles.primaryButton} type="button" onClick={onExportPDF}>
        <UploadCloud size={17} />
        PDF Rapor
      </button>
    </div>
  );
}
