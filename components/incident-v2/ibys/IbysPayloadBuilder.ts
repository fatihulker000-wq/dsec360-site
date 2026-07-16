import {
  IbysIncidentPayload,
  IbysIncidentRecord,
} from "./types";

import { IbysValidationEngine } from "./IbysValidationEngine";

export class IbysPayloadBuilder {
  static build(
    item: IbysIncidentRecord
  ): IbysIncidentPayload {
    const validation =
      IbysValidationEngine.validate(item);

    if (!validation.required) {
      throw new Error(
        "Bu kayıt için İBYS hazırlığı gerekmiyor."
      );
    }

    if (!validation.valid) {
      throw new Error(
        `Eksik alanlar: ${validation.missingFields.join(
          ", "
        )}`
      );
    }

    return {
      sourceSystem: "D-SEC",

      sourceVersion: "2",

      generatedAt:
        new Date().toISOString(),

      incident: {
        localIncidentId:
          item.incidentId,

        incidentNo:
          item.incidentNo,

        companyId:
          item.companyId,

        companyName:
          item.companyName,

        workplaceSgkNo:
          item.workplaceSgkNo,

        naceCode:
          item.naceCode,

        incidentType:
          item.incidentType,

        incidentDate:
          item.incidentDate,

        incidentTime:
          item.incidentTime,

        department:
          item.department,

        location:
          item.location,

        description:
          item.description,

        severity:
          item.severity,

        lostDay:
          Number(item.lostDay || 0),

        fatal:
          Boolean(item.fatal),

        hospitalTransfer:
          Boolean(
            item.hospitalTransfer
          ),
      },

      employee: {
        employeeId:
          item.employeeId,

        fullName:
          item.employeeName,

        tcNo:
          item.employeeTcNo,
      },

      process: {
        investigationCompleted:
          item.investigationCompleted,

        rootCauseCompleted:
          item.rootCauseCompleted,

        correctiveActionCreated:
          item.correctiveActionCreated,
      },
    };
  }
}