"use client";

import { AlertCard, DashboardGrid } from "@/components/atlas";
import type { DashboardAlert } from "./types";

type AlarmCenterProps = {
  alerts: DashboardAlert[];
};

export default function AlarmCenter({ alerts }: AlarmCenterProps) {
  return (
    <section>
      <DashboardGrid columns={4}>
        {alerts.map((alert) => (
          <AlertCard
            key={alert.title}
            title={alert.title}
            value={alert.value}
            description={alert.description}
            variant={alert.variant}
            href={alert.href}
          />
        ))}
      </DashboardGrid>
    </section>
  );
}
