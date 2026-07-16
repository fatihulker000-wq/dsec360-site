import {
  IbysIncidentRecord,
  IbysPreparationStatus,
  IbysValidationResult,
} from "./types";

export class IbysStatusEngine {
  static calculate(
    item: IbysIncidentRecord,
    validation: IbysValidationResult
  ): IbysPreparationStatus {
    if (!validation.required) {
      return "NOT_REQUIRED";
    }

    if (item.sentAt) {
      return "SENT";
    }

    if (item.errorMessage) {
      return "FAILED";
    }

    if (!validation.valid) {
      return "MISSING_INFORMATION";
    }

    if (item.preparedAt) {
      return "READY";
    }

    return "DRAFT";
  }
}