"use client";

import { useMemo, useState } from "react";

import InvestigationDashboard from "./InvestigationDashboard";
import InvestigationWizard from "./InvestigationWizard";
import InvestigationAiAssistant from "./InvestigationAiAssistant";
import InvestigationTimeline from "./InvestigationTimeline";
import EvidenceCenter from "./EvidenceCenter";
import WitnessCenter from "./WitnessCenter";
import InterviewCenter from "./InterviewCenter";
import ActionTracking from "./ActionTracking";

import { InvestigationReport } from "./types";

import type {
  InvestigationTimelineItem,
} from "./InvestigationTimeline";

import { FiveWhyEngine } from "./FiveWhyEngine";
import { FishboneEngine } from "./FishboneEngine";
import { RootCauseEngine } from "./RootCauseEngine";

interface Props {

    reports: InvestigationReport[];

    onChange(
        reports: InvestigationReport[]
    ): void;

}

export default function InvestigationCenter({

    reports,

    onChange,

}: Props) {

    const [selectedId, setSelectedId] =
        useState<string>();

    const report = useMemo(

        () =>

            reports.find(

                x => x.id === selectedId

            ),

        [reports, selectedId]

    );

    function updateReport(

        updated: InvestigationReport

    ) {

        onChange(

            reports.map(item =>

                item.id === updated.id

                    ? updated

                    : item

            )

        );

    }

    function createInvestigation() {

        const item: InvestigationReport = {

            id: crypto.randomUUID(),

            incidentId: "",

            investigationNo:

                `INV-${new Date().getFullYear()}-${Date.now()}`,

            status: "OPEN",

            priority: "MEDIUM",

            severity: 3,

            startedAt:
                new Date().toISOString(),

            investigator: "",

            summary: "",

            findings: "",

            recommendations: "",

            aiScore: 0,

            people: [],

            interviews: [],

            evidences: [],

            actions: [],

            fiveWhy:
                FiveWhyEngine.createTemplate(),

            fishbone:
                FishboneEngine.createTemplate(),

            rootCauses:
                RootCauseEngine.createTemplate(),

        };

        onChange([

            item,

            ...reports,

        ]);

        setSelectedId(item.id);

    }

    const timeline: InvestigationTimelineItem[] = report

        ? [

              {

                  id: "1",

                  title: "Soruşturma Başlatıldı",

                  description:
                      "Yeni soruşturma kaydı oluşturuldu.",

                  user:
                      report.investigator ||

                      "Sistem",

                  createdAt:
                      report.startedAt,

                  type: "SUCCESS",

              },

          ]

        : [];

    if (!report) {

        return (

            <InvestigationDashboard

                reports={reports}

                onCreate={createInvestigation}

                onOpen={item =>

                    setSelectedId(item.id)

                }

            />

        );

    }

    return (

        <div
            style={{
                display: "grid",
                gap: 24,
            }}
        >

            <button

                onClick={()=>

                    setSelectedId(undefined)

                }

            >

                ← Dashboard'a Dön

            </button>

            <InvestigationWizard

                report={report}

                onChange={updateReport}

                onFinish={() => {

                    updateReport({

                        ...report,

                        status: "COMPLETED",

                    });

                }}

            />

            <EvidenceCenter

                evidences={

                    report.evidences

                }

                onChange={items =>

                    updateReport({

                        ...report,

                        evidences: items,

                    })

                }

            />

            <WitnessCenter

                witnesses={

                    report.people.filter(

                        x =>

                            x.role ===

                            "WITNESS"

                    )

                }

                onChange={items =>

                    updateReport({

                        ...report,

                        people: [

                            ...report.people.filter(

                                x =>

                                    x.role !==

                                    "WITNESS"

                            ),

                            ...items,

                        ],

                    })

                }

            />

            <InterviewCenter

                interviews={

                    report.interviews

                }

                people={

                    report.people

                }

                onChange={items =>

                    updateReport({

                        ...report,

                        interviews: items,

                    })

                }

            />

            <ActionTracking

                actions={

                    report.actions

                }

                onChange={items =>

                    updateReport({

                        ...report,

                        actions: items,

                    })

                }

            />

            <InvestigationAiAssistant

                report={report}

            />

            <InvestigationTimeline

                items={timeline}

            />

        </div>

    );

}