"use client";

import { useMemo, useState } from "react";

import ExecutiveHero from "./ExecutiveHero";
import ExecutiveKpiGrid from "./ExecutiveKpiGrid";
import IncidentTrendChart from "./IncidentTrendChart";
import DepartmentHeatmap from "./DepartmentHeatmap";
import RootCauseChart from "./RootCauseChart";
import BodyPartChart from "./BodyPartChart";
import AiExecutiveSummary from "./AiExecutiveSummary";
import ExecutiveFilters from "./ExecutiveFilters";
import ExportCenter from "./ExportCenter";

import {
    IncidentAnalyticsFilters,
    IncidentAnalyticsRecord,
} from "./types";

import { IncidentAnalyticsEngine } from "@/lib/incident/IncidentAnalyticsEngine";

interface Props {

    incidents: IncidentAnalyticsRecord[];

    workedHours?: number;

    employeeCount?: number;

}

export default function IncidentAnalyticsCenter({

    incidents,

    workedHours = 0,

    employeeCount = 0,

}: Props) {

    const [filters, setFilters] =
        useState<IncidentAnalyticsFilters>({});

    const filteredIncidents =
        useMemo(() => {

            return incidents.filter(item => {

                if (
                    filters.department &&
                    item.department !== filters.department
                ) return false;

                if (
                    filters.location &&
                    item.location !== filters.location
                ) return false;

                if (
                    filters.incidentType &&
                    item.incidentType !== filters.incidentType
                ) return false;

                if (filters.startDate) {

                    if (
                        new Date(item.eventDate) <
                        new Date(filters.startDate)
                    ) {
                        return false;
                    }

                }

                if (filters.endDate) {

                    if (
                        new Date(item.eventDate) >
                        new Date(filters.endDate)
                    ) {
                        return false;
                    }

                }

                return true;

            });

        }, [incidents, filters]);

    const analytics =
        useMemo(() =>

            IncidentAnalyticsEngine.analyze(

                filteredIncidents,

                {

                    workedHours,

                    employeeCount,

                }

            ),

            [

                filteredIncidents,

                workedHours,

                employeeCount,

            ]

        );

    const departments =
        [...new Set(

            incidents.map(

                x => x.department

            )

        )].filter(Boolean);

    const locations =
        [...new Set(

            incidents.map(

                x => x.location

            )

        )].filter(Boolean);

    const incidentTypes =
        [...new Set(

            incidents.map(

                x => x.incidentType

            )

        )].filter(Boolean);

    return (

        <div
            style={{
                display: "grid",
                gap: 24,
            }}
        >

            <ExecutiveHero
                data={analytics}
            />

            <ExecutiveFilters

                value={filters}

                departments={departments}

                locations={locations}

                incidentTypes={incidentTypes}

                onChange={setFilters}

                onReset={() =>
                    setFilters({})
                }

            />

            <ExecutiveKpiGrid
                data={analytics}
            />

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "2fr 1fr",
                    gap: 22,
                }}
            >

                <IncidentTrendChart
                    items={
                        analytics.monthlyTrend
                    }
                />

                <AiExecutiveSummary
                    data={analytics}
                />

            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "1fr 1fr",
                    gap: 22,
                }}
            >

                <DepartmentHeatmap
                    items={
                        analytics.departmentDistribution
                    }
                />

                <RootCauseChart
                    items={
                        analytics.rootCauseDistribution
                    }
                />

            </div>

            <BodyPartChart

                items={
                    analytics.bodyPartDistribution
                }

            />

            <ExportCenter

                data={analytics}

            />

        </div>

    );

}