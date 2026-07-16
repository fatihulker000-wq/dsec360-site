import {
  IbysIncidentRecord,
  IbysValidationResult,
} from "./types";

export class IbysValidationEngine {
  static isNotificationRequired(
    item: IbysIncidentRecord
  ) {
    return (
      item.incidentType === "WORK_ACCIDENT" ||
      item.incidentType ===
        "OCCUPATIONAL_DISEASE" ||
      item.fatal ||
      item.severity >= 3
    );
  }

  static validate(
    item: IbysIncidentRecord
  ): IbysValidationResult {
    const required =
      this.isNotificationRequired(item);

    if (!required) {
      return {
        valid: true,
        required: false,
        missingFields: [],
        warnings: [],
        completionRate: 100,
      };
    }

    const checks: Array<{
      title: string;
      completed: boolean;
    }> = [
      {
        title: "Olay No",
        completed: Boolean(
          item.incidentNo?.trim()
        ),
      },
      {
        title: "Firma",
        completed: Boolean(
          item.companyName?.trim()
        ),
      },
      {
        title: "Firma Kimliği",
        completed: Boolean(
          item.companyId?.trim()
        ),
      },
      {
        title: "İşyeri SGK Sicil No",
        completed: Boolean(
          item.workplaceSgkNo?.trim()
        ),
      },
      {
        title: "Çalışan Ad Soyad",
        completed: Boolean(
          item.employeeName?.trim()
        ),
      },
      {
        title: "Çalışan T.C. Kimlik No",
        completed:
          this.isValidTcNo(
            item.employeeTcNo
          ),
      },
      {
        title: "Olay Türü",
        completed: Boolean(
          item.incidentType
        ),
      },
      {
        title: "Olay Tarihi",
        completed: Boolean(
          item.incidentDate
        ),
      },
      {
        title: "Olay Saati",
        completed: Boolean(
          item.incidentTime
        ),
      },
      {
        title: "Departman",
        completed: Boolean(
          item.department?.trim()
        ),
      },
      {
        title: "Lokasyon",
        completed: Boolean(
          item.location?.trim()
        ),
      },
      {
        title: "Olay Açıklaması",
        completed:
          Boolean(
            item.description?.trim()
          ) &&
          item.description.trim().length >= 20,
      },
      {
        title: "Şiddet Seviyesi",
        completed:
          item.severity >= 1 &&
          item.severity <= 5,
      },
    ];

    const missingFields = checks
      .filter((check) => !check.completed)
      .map((check) => check.title);

    const warnings: string[] = [];

    if (!item.investigationCompleted) {
      warnings.push(
        "Olay soruşturması henüz tamamlanmamış."
      );
    }

    if (!item.rootCauseCompleted) {
      warnings.push(
        "Kök neden analizi henüz tamamlanmamış."
      );
    }

    if (
      item.severity >= 3 &&
      !item.correctiveActionCreated
    ) {
      warnings.push(
        "Yüksek şiddetli olay için DÖF oluşturulmamış."
      );
    }

    if (
      item.incidentType === "WORK_ACCIDENT" &&
      !item.employeeId
    ) {
      warnings.push(
        "Çalışan kaydı sistem kullanıcısıyla ilişkilendirilmemiş."
      );
    }

    const completed =
      checks.length - missingFields.length;

    return {
      valid: missingFields.length === 0,
      required,
      missingFields,
      warnings,
      completionRate: Math.round(
        (completed / checks.length) * 100
      ),
    };
  }

  private static isValidTcNo(
    value?: string
  ) {
    const normalized =
      String(value || "").replace(
        /\D/g,
        ""
      );

    return (
      normalized.length === 11 &&
      normalized[0] !== "0"
    );
  }
}