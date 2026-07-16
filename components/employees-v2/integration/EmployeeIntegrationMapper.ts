import type {
  EmployeeIntegrationData,
} from "./types";

export function mapIntegrationToProfileProps(
  integration?: EmployeeIntegrationData | null
) {

  return {

    trainingItems:
      integration?.trainingItems || [],

    healthItems:
      integration?.healthItems || [],

    ppeItems:
      integration?.ppeItems || [],

    riskItems:
      integration?.riskItems || [],

    auditItems:
      integration?.auditItems || [],

    accidentItems:
      integration?.accidentItems || [],

    documentItems:
      integration?.documentItems || [],

    agendaItems:
      integration?.agendaItems || [],

    sgkItems:
      integration?.sgkItems || [],

    ibysItems:
      integration?.ibysItems || [],

    activityItems:
      integration?.activityItems || [],

  };

}

export function mapIntegrationToEmployeeSummary(
  integration?: EmployeeIntegrationData | null
) {

  return (

    integration?.summary ||

    {

      training_status: "UNKNOWN",

      health_status: "UNKNOWN",

      ppe_status: "UNKNOWN",

      document_status: "UNKNOWN",

      risk_status: "UNKNOWN",

      training_completion_rate: undefined,

      ppe_completion_rate: undefined,

      open_risk_count: 0,

      open_action_count: 0,

      accident_count: 0,

      upcoming_count: 0,

    }

  );

}