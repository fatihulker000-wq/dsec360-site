"use client";

import { useMemo } from "react";

import WorkflowDashboard from "./WorkflowDashboard";
import WorkflowTimeline from "./WorkflowTimeline";
import WorkflowNotificationCenter from "./WorkflowNotificationCenter";
import WorkflowHistory from "./WorkflowHistory";

import { WorkflowService } from "./WorkflowService";

import {
    IncidentWorkflowContext,
} from "./types";

interface Props {

    context: IncidentWorkflowContext;

}

export default function WorkflowCenter({

    context,

}: Props) {

    const {

        workflow,

        events,

    } = useMemo(

        () =>

            WorkflowService.runWorkflow(
                context
            ),

        [context]

    );

    if (!workflow || !events) {

        return (

            <div
                style={{
                    padding: 60,
                    textAlign: "center",
                }}
            >
                Workflow hazırlanıyor...
            </div>

        );

    }

    return (

        <div
            style={{
                display: "grid",
                gap: 24,
            }}
        >

            <WorkflowDashboard
                workflow={workflow}
            />

            <WorkflowTimeline
                steps={workflow.steps}
            />

            <WorkflowNotificationCenter
                events={events}
            />

            <WorkflowHistory
                events={events}
            />

        </div>

    );

}