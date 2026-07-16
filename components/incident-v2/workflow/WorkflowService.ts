"use client";

import { IncidentWorkflowEngine } from "./IncidentWorkflowEngine";

import {
    IncidentWorkflowContext,
    IncidentWorkflowResult,
    IncidentWorkflowEvent,
} from "./types";

export class WorkflowService {

    static runWorkflow(
  context: IncidentWorkflowContext
): {
  workflow: IncidentWorkflowResult;
  events: IncidentWorkflowEvent[];
} {

        const workflow =
            IncidentWorkflowEngine.execute(context);

        const now =
            new Date().toISOString();

        const events: IncidentWorkflowEvent[] =
            workflow.steps.map(step => ({

                id: crypto.randomUUID(),

                workflowId:
                    workflow.workflowId,

                incidentId:
                    workflow.incidentId,

                stepType:
                    step.type,

                status:
                    step.status,

                createdAt:
                    step.completedAt ??
                    step.startedAt ??
                    now,

                createdBy:
                    context.createdBy ??
                    "SYSTEM",

                message:
                    this.buildMessage(step.title, step.status),

                metadata:
                    step.output,

            }));

        return {

            workflow,

            events,

        };

    }

    static getProgress(
        workflow: IncidentWorkflowResult
    ) {

        const completed =
            workflow.steps.filter(

                x =>

                    x.status === "COMPLETED"

            ).length;

        return Math.round(

            completed /

            workflow.steps.length *

            100

        );

    }

    static hasErrors(
        workflow: IncidentWorkflowResult
    ) {

        return workflow.steps.some(

            x =>

                x.status === "FAILED"

        );

    }

    static buildMessage(
        title: string,
        status: string
    ) {

        switch(status){

            case "COMPLETED":

                return `${title} başarıyla tamamlandı.`;

            case "FAILED":

                return `${title} sırasında hata oluştu.`;

            case "RUNNING":

                return `${title} devam ediyor.`;

            case "SKIPPED":

                return `${title} atlandı.`;

            default:

                return `${title} bekliyor.`;

        }

    }

}