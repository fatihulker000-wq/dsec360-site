"use client";

import { useEffect, useMemo, useState } from "react";

import styles from "./TrainingIntelligenceCenter.module.css";

import {
    calculateTrainingAiScore,
    TrainingIntelligenceMetrics,
} from "./aiScoreEngine";

import {
    generateTrainingRecommendations,
} from "./aiRecommendationEngine";

import {
    analyzeDepartments,
} from "./departmentAnalyzer";

import {
    buildHeatmap,
} from "./heatmapEngine";

import {
    buildPrediction,
} from "./predictionEngine";

import {
    createMonthlyTrend,
} from "./trendAnalyzer";

export interface IntelligenceKpiCard {

    title: string;

    value: string | number;

    color:
        | "green"
        | "yellow"
        | "orange"
        | "red"
        | "blue";

}

export interface IntelligenceRiskItem {

    title: string;

    value: string;

    level:
        | "LOW"
        | "MEDIUM"
        | "HIGH"
        | "CRITICAL";

}

export interface IntelligenceRecommendation {

    title: string;

    description: string;

}

export interface IntelligenceDashboardData {

    metrics:
        TrainingIntelligenceMetrics;

    monthly: any[];

    departments: any[];

    heatmap: any[];

}

export interface TrainingIntelligenceProps {

    dashboard:
        IntelligenceDashboardData;

}

export default function TrainingIntelligenceCenter({

    dashboard,

}: TrainingIntelligenceProps) {

    const [

        loading,

        setLoading,

    ] = useState(true);

    useEffect(() => {

        const timer =
            setTimeout(() => {

                setLoading(false);

            }, 250);

        return () =>
            clearTimeout(timer);

    }, []);

    const aiScore =
        useMemo(

            () =>

                calculateTrainingAiScore(
                    dashboard.metrics
                ),

            [dashboard]

        );

    const recommendations =
        useMemo(

            () =>

                generateTrainingRecommendations(

                    dashboard.metrics,

                    aiScore

                ),

            [dashboard, aiScore]

        );

    const departmentAnalysis =
        useMemo(

            () =>

                analyzeDepartments(

                    dashboard.departments

                ),

            [dashboard]

        );

    const heatmap =
        useMemo(

            () =>

                buildHeatmap(

                    dashboard.heatmap

                ),

            [dashboard]

        );

    const trend =
        useMemo(

            () =>

                createMonthlyTrend(

                    dashboard.monthly

                ),

            [dashboard]

        );

    const prediction =
        useMemo(

            () =>

                buildPrediction({

                    completionRate:
                        aiScore.breakdown.completionScore,

                    averageFinalScore:
                        dashboard.metrics.averageFinalScore,

                    averageEvidenceScore:
                        dashboard.metrics.averageEvidenceScore,

                    assignedTrainings:
                        dashboard.metrics.totalAssignments,

                    completedTrainings:
                        dashboard.metrics.completedAssignments,

                    monthlyGrowthRate:
                        trend.summary.completionChange,

                    overdueTrainings:
                        dashboard.metrics.overdueAssignments || 0,

                    expiringCertificates:
                        dashboard.metrics.expiringCertificates || 0,

                }),

            [

                dashboard,

                aiScore,

                trend,

            ]

        );
            const kpis: IntelligenceKpiCard[] = [
        {
            title: "AI Eğitim Skoru",
            value: `${aiScore.score}/100`,
            color:
                aiScore.score >= 90
                    ? "green"
                    : aiScore.score >= 75
                    ? "blue"
                    : aiScore.score >= 60
                    ? "yellow"
                    : "red",
        },
        {
            title: "Tamamlama",
            value: `%${aiScore.breakdown.completionScore}`,
            color: "green",
        },
        {
            title: "Sınav Başarısı",
            value: `%${aiScore.breakdown.examScore}`,
            color: "blue",
        },
        {
            title: "Kanıt Kalitesi",
            value: `%${aiScore.breakdown.evidenceScore}`,
            color: "green",
        },
        {
            title: "Sertifika",
            value: `%${aiScore.breakdown.certificateScore}`,
            color: "yellow",
        },
        {
            title: "İçerik Hazırlığı",
            value: `%${aiScore.breakdown.contentReadinessScore}`,
            color: "blue",
        },
        {
            title: "Risk Cezası",
            value: `-${aiScore.breakdown.riskPenalty}`,
            color: "red",
        },
        {
            title: "Tahmin (90 Gün)",
            value: `%${prediction.next90}`,
            color: "green",
        },
    ];

    const criticalRisks: IntelligenceRiskItem[] = [
        {
            title: "Geciken Eğitimler",
            value: String(
                dashboard.metrics.overdueAssignments || 0
            ),
            level:
                (dashboard.metrics.overdueAssignments || 0) > 10
                    ? "CRITICAL"
                    : (dashboard.metrics.overdueAssignments || 0) > 0
                    ? "HIGH"
                    : "LOW",
        },
        {
            title: "Başlamayan Eğitimler",
            value: String(
                dashboard.metrics.notStartedAssignments
            ),
            level:
                dashboard.metrics.notStartedAssignments > 20
                    ? "CRITICAL"
                    : dashboard.metrics.notStartedAssignments > 5
                    ? "HIGH"
                    : "LOW",
        },
        {
            title: "Süresi Dolmuş Sertifikalar",
            value: String(
                dashboard.metrics.certificatesExpired
            ),
            level:
                dashboard.metrics.certificatesExpired > 0
                    ? "HIGH"
                    : "LOW",
        },
        {
            title: "Başarısız Final Sınavları",
            value: String(
                dashboard.metrics.failedFinalExams
            ),
            level:
                dashboard.metrics.failedFinalExams > 5
                    ? "HIGH"
                    : dashboard.metrics.failedFinalExams > 0
                    ? "MEDIUM"
                    : "LOW",
        },
    ];

    if (loading) {
        return (
            <section className={styles.loading}>
                <div className={styles.loader} />

                <h2>
                    AI Eğitim Analiz Merkezi hazırlanıyor...
                </h2>

                <p>
                    Eğitim performansı, sertifikalar,
                    sınavlar ve denetim kayıtları analiz ediliyor.
                </p>
            </section>
        );
    }

    return (
        <section className={styles.container}>

            <header className={styles.header}>

                <div>

                    <span className={styles.badge}>
                        TRAINING INTELLIGENCE CENTER
                    </span>

                    <h1>
                        AI Eğitim Analiz Merkezi
                    </h1>

                    <p>
                        Eğitim performansı, risk analizi,
                        departman başarıları ve
                        DORA AI önerileri tek ekranda.
                    </p>

                </div>

                <div className={styles.scoreCard}>

                    <span>AI SCORE</span>

                    <strong>
                        {aiScore.score}
                    </strong>

                    <small>
                        {aiScore.label}
                    </small>

                </div>

            </header>

            <section className={styles.kpiGrid}>

                {kpis.map((item) => (

                    <article
                        key={item.title}
                        className={`${styles.kpi} ${styles[item.color]}`}
                    >

                        <span>
                            {item.title}
                        </span>

                        <strong>
                            {item.value}
                        </strong>

                    </article>

                ))}

            </section>
                        <section className={styles.contentGrid}>

                {/* Trend Analizi */}

                <article className={styles.card}>

                    <div className={styles.cardHeader}>

                        <div>

                            <span>
                                AI TREND
                            </span>

                            <h3>
                                Son 12 Ay
                            </h3>

                        </div>

                    </div>

                    <div className={styles.trendList}>

                        {trend.monthly.map((item) => (

                            <div
                                key={item.month}
                                className={styles.trendRow}
                            >

                                <span>

                                    {item.month}

                                </span>

                                <strong>

                                    %{item.completionRate}

                                </strong>

                            </div>

                        ))}

                    </div>

                    <footer
                        className={styles.cardFooter}
                    >

                        <strong>

                            Trend

                        </strong>

                        <span>

                            {trend.direction}

                        </span>

                    </footer>

                </article>

                {/* Departman Analizi */}

                <article className={styles.card}>

                    <div className={styles.cardHeader}>

                        <div>

                            <span>

                                DEPARTMENTS

                            </span>

                            <h3>

                                Performans

                            </h3>

                        </div>

                    </div>

                    <div
                        className={styles.departmentList}
                    >

                        {departmentAnalysis.map(

                            (department) => (

                                <div
                                    key={department.id}
                                    className={styles.departmentRow}
                                >

                                    <div>

                                        <strong>

                                            {department.name}

                                        </strong>

                                        <small>

                                            {department.performance}

                                        </small>

                                    </div>

                                    <span>

                                        {department.aiScore}

                                    </span>

                                </div>

                            )

                        )}

                    </div>

                </article>

                {/* HeatMap */}

                <article className={styles.card}>

                    <div className={styles.cardHeader}>

                        <div>

                            <span>

                                HEATMAP

                            </span>

                            <h3>

                                Risk Haritası

                            </h3>

                        </div>

                    </div>

                    <div className={styles.heatmapGrid}>

                        {heatmap.map(

                            (item) => (

                                <div

                                    key={item.id}

                                    title={
                                        item.tooltip
                                    }

                                    className={`${styles.heatCell} ${styles[item.color.toLowerCase()]}`}

                                >

                                    {item.score}

                                </div>

                            )

                        )}

                    </div>

                </article>

                {/* Kritik Riskler */}

                <article className={styles.card}>

                    <div className={styles.cardHeader}>

                        <div>

                            <span>

                                RISK CENTER

                            </span>

                            <h3>

                                Kritik Riskler

                            </h3>

                        </div>

                    </div>

                    <div className={styles.riskList}>

                        {criticalRisks.map(

                            (risk) => (

                                <div
                                    key={risk.title}
                                    className={styles.riskRow}
                                >

                                    <div>

                                        <strong>

                                            {risk.title}

                                        </strong>

                                        <small>

                                            {risk.level}

                                        </small>

                                    </div>

                                    <span>

                                        {risk.value}

                                    </span>

                                </div>

                            )

                        )}

                    </div>

                </article>

            </section>
                        {/* AI Yönetici Önerileri */}

            <section className={styles.bottomGrid}>

                <article className={styles.card}>

                    <div className={styles.cardHeader}>

                        <div>

                            <span>

                                DORA AI

                            </span>

                            <h3>

                                Yönetici Önerileri

                            </h3>

                        </div>

                    </div>

                    <div className={styles.recommendationList}>

                        {recommendations.map((item) => (

                            <div
                                key={item.id}
                                className={styles.recommendation}
                            >

                                <strong>

                                    {item.title}

                                </strong>

                                <p>

                                    {item.description}

                                </p>

                                <small>

                                    ► {item.action}

                                </small>

                            </div>

                        ))}

                    </div>

                </article>

                {/* Executive Summary */}

                <article className={styles.card}>

                    <div className={styles.cardHeader}>

                        <div>

                            <span>

                                EXECUTIVE SUMMARY

                            </span>

                            <h3>

                                AI Değerlendirmesi

                            </h3>

                        </div>

                    </div>

                    <div className={styles.summaryBox}>

                        <h2>

                            {aiScore.score}/100

                        </h2>

                        <strong>

                            {aiScore.label}

                        </strong>

                        <p>

                            {aiScore.description}

                        </p>

                    </div>

                </article>

            </section>

            {/* Tahmin Kartları */}

            <section className={styles.forecastGrid}>

                <article className={styles.forecastCard}>

                    <span>

                        30 Gün

                    </span>

                    <strong>

                        %{prediction.next30}

                    </strong>

                </article>

                <article className={styles.forecastCard}>

                    <span>

                        60 Gün

                    </span>

                    <strong>

                        %{prediction.next60}

                    </strong>

                </article>

                <article className={styles.forecastCard}>

                    <span>

                        90 Gün

                    </span>

                    <strong>

                        %{prediction.next90}

                    </strong>

                </article>

                <article className={styles.forecastCard}>

                    <span>

                        Güven

                    </span>

                    <strong>

                        %{prediction.confidence}

                    </strong>

                </article>

            </section>

            <footer className={styles.footer}>

                <strong>

                    Training Intelligence Center

                </strong>

                <span>

                    AI destekli eğitim analizi ·
                    DORA Executive Analytics ·
                    D-SEC

                </span>

            </footer>

        </section>

    );

}
