"use client";

import { AlertCard, PageHeader } from "@/components/atlas";
import type { DashboardV3Props } from "./types";
import ExecutiveHero from "./ExecutiveHero";
import ExecutiveKPIStrip from "./ExecutiveKPIStrip";
import AnalyticsSection from "./AnalyticsSection";
import AlarmCenter from "./AlarmCenter";
import QuickActions from "./QuickActions";
import DashboardToolbar from "./DashboardToolbar";
import FilterBar from "./filter-bar";
import ExecutiveSummary from "./executive-summary";
import OperationalInsights from "./OperationalInsights";
import DashboardSkeleton from "./DashboardSkeleton";
import styles from "./DashboardV3.module.css";

export default function DashboardV3({
  loading,
  error,
  isMobile,
  title,
  subtitle,
  heroTitle,
  heroDescription,
  heroStats,
  metrics,
  alerts,
  doraInsights,
  onRefresh,
  onExportPDF,
  trendData,
  pieData,
  riskCompanies,
  completionRate,
  inProgressRate,
  riskRate,
  cbsSummary,
  inspectionSummary,
  quickActions = [],
  activities,
  riskMatrix,
  companyPerformance,
  companies,
  selectedCompany,
  onCompanyChange,
  searchValue,
  onSearchChange,
  companyLocked = false,
  criticalCount,
  executiveRecommendation,
  legacyExecutive,
  legacyLists,
}: DashboardV3Props) {
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className={styles.errorWrap}>
        <AlertCard
          title="Dashboard verileri yüklenemedi"
          value="!"
          description={error}
          variant="critical"
        />
      </div>
    );
  }

  return (
    <div
      id="admin-dashboard-pdf"
      className={styles.shell}
      style={{
        opacity: loading ? 0.96 : 1,
        transition: "opacity 200ms ease",
      }}
    >
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[{ label: "D-SEC" }, { label: "Dashboard" }]}
        actions={
          <DashboardToolbar
            onRefresh={onRefresh}
            onExportPDF={onExportPDF}
          />
        }
      />

      <FilterBar
        companies={companies}
        selectedCompany={selectedCompany}
        onCompanyChange={onCompanyChange}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        companyLocked={companyLocked}
      />

      <ExecutiveHero
        title={heroTitle}
        description={heroDescription}
        stats={heroStats}
      />

      <ExecutiveSummary
        insights={doraInsights}
        criticalCount={criticalCount}
        recommendation={executiveRecommendation}
      />

      <ExecutiveKPIStrip metrics={metrics} />

      <AnalyticsSection
        isMobile={isMobile}
        trendData={trendData}
        pieData={pieData}
        riskCompanies={riskCompanies}
        completionRate={completionRate}
        inProgressRate={inProgressRate}
        riskRate={riskRate}
        cbsSummary={cbsSummary}
        inspectionSummary={inspectionSummary}
        doraInsights={doraInsights}
      />

      <OperationalInsights
        activities={activities}
        riskMatrix={riskMatrix}
        companyPerformance={companyPerformance}
      />

      <AlarmCenter alerts={alerts} />

      <QuickActions items={quickActions} />

      {legacyExecutive}
      {legacyLists}
    </div>
  );
}
