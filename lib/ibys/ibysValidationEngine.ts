export type IbysValidationIssue = {
  field: string;
  message: string;
  severity: "ERROR" | "WARNING";
};

export type IbysValidationResult = {
  valid: boolean;
  issues: IbysValidationIssue[];
};

function isEmpty(value: unknown) {
  return value === undefined || value === null || String(value).trim() === "";
}

function isValidTcKimlik(value: unknown) {
  const tc = String(value || "").trim();

  if (!/^\d{11}$/.test(tc)) return false;
  if (tc[0] === "0") return false;

  const digits = tc.split("").map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  const digit10 = ((oddSum * 7 - evenSum) % 10 + 10) % 10;
  const digit11 = digits.slice(0, 10).reduce((sum, d) => sum + d, 0) % 10;

  return digit10 === digits[9] && digit11 === digits[10];
}

function isValidDate(value: unknown) {
  if (isEmpty(value)) return false;
  const date = new Date(String(value));
  return !Number.isNaN(date.getTime());
}

function addIssue(
  issues: IbysValidationIssue[],
  field: string,
  message: string,
  severity: "ERROR" | "WARNING" = "ERROR"
) {
  issues.push({ field, message, severity });
}

export function validateIbysQueuePayload(payload: Record<string, unknown> = {}) {
  const issues: IbysValidationIssue[] = [];

  const recordType = String(payload.recordType || payload.record_type || "").toUpperCase();

  if (!recordType) {
    addIssue(
      issues,
      "recordType",
      "Kayıt türü belirlenmemiş. Gönderim tipi eğitim, sağlık, çalışan veya olay olarak belirtilmeli."
    );
  }

  if (isEmpty(payload.firmName) && isEmpty(payload.firm_name)) {
    addIssue(issues, "firmName", "Firma adı zorunludur.");
  }

  if (isEmpty(payload.firmId) && isEmpty(payload.firm_id)) {
    addIssue(issues, "firmId", "D-SEC firma ID bilgisi zorunludur.", "WARNING");
  }

  if (isEmpty(payload.sgkRegistrationNo) && isEmpty(payload.sgk_registration_no)) {
    addIssue(issues, "sgkRegistrationNo", "Firma SGK sicil numarası eksiktir.");
  }

  if (isEmpty(payload.ibysWorkplaceId) && isEmpty(payload.ibys_workplace_id)) {
    addIssue(issues, "ibysWorkplaceId", "Firma İBYS işyeri eşleştirmesi yapılmamış.");
  }

  if (recordType === "EMPLOYEE" || recordType === "CALISAN") {
    if (isEmpty(payload.employeeName) && isEmpty(payload.employee_name)) {
      addIssue(issues, "employeeName", "Çalışan adı soyadı zorunludur.");
    }

    const tc = payload.tcKimlikNo ?? payload.tc_kimlik_no ?? payload.identityNo;
    if (!isValidTcKimlik(tc)) {
      addIssue(issues, "tcKimlikNo", "Çalışan TC kimlik numarası geçerli değil.");
    }

    if (isEmpty(payload.jobTitle) && isEmpty(payload.job_title)) {
      addIssue(issues, "jobTitle", "Çalışan görev/unvan bilgisi eksiktir.", "WARNING");
    }
  }

  if (recordType === "TRAINING" || recordType === "EGITIM") {
    if (isEmpty(payload.trainingName) && isEmpty(payload.training_name)) {
      addIssue(issues, "trainingName", "Eğitim adı zorunludur.");
    }

    if (isEmpty(payload.trainingDate) && isEmpty(payload.training_date)) {
      addIssue(issues, "trainingDate", "Eğitim tarihi zorunludur.");
    } else if (!isValidDate(payload.trainingDate ?? payload.training_date)) {
      addIssue(issues, "trainingDate", "Eğitim tarihi geçerli bir tarih değil.");
    }

    const duration = Number(payload.durationMinutes ?? payload.duration_minutes ?? 0);
    if (!duration || duration <= 0) {
      addIssue(issues, "durationMinutes", "Eğitim süresi dakika olarak girilmelidir.");
    }

    if (isEmpty(payload.trainerName) && isEmpty(payload.trainer_name)) {
      addIssue(issues, "trainerName", "Eğitmen/uzman adı eksiktir.");
    }
  }

  if (recordType === "HEALTH" || recordType === "MUAYENE") {
    if (isEmpty(payload.employeeName) && isEmpty(payload.employee_name)) {
      addIssue(issues, "employeeName", "Muayene için çalışan adı soyadı zorunludur.");
    }

    const tc = payload.tcKimlikNo ?? payload.tc_kimlik_no ?? payload.identityNo;
    if (!isValidTcKimlik(tc)) {
      addIssue(issues, "tcKimlikNo", "Muayene kaydı için TC kimlik numarası geçerli değil.");
    }

    if (isEmpty(payload.examinationDate) && isEmpty(payload.examination_date)) {
      addIssue(issues, "examinationDate", "Muayene tarihi zorunludur.");
    } else if (!isValidDate(payload.examinationDate ?? payload.examination_date)) {
      addIssue(issues, "examinationDate", "Muayene tarihi geçerli bir tarih değil.");
    }

    if (isEmpty(payload.doctorName) && isEmpty(payload.doctor_name)) {
      addIssue(issues, "doctorName", "İşyeri hekimi adı eksiktir.");
    }
  }

  if (recordType === "ACCIDENT" || recordType === "OLAY" || recordType === "IS_KAZASI") {
    if (isEmpty(payload.accidentDate) && isEmpty(payload.accident_date)) {
      addIssue(issues, "accidentDate", "Olay/kaza tarihi zorunludur.");
    } else if (!isValidDate(payload.accidentDate ?? payload.accident_date)) {
      addIssue(issues, "accidentDate", "Olay/kaza tarihi geçerli bir tarih değil.");
    }

    if (isEmpty(payload.description)) {
      addIssue(issues, "description", "Olay/kaza açıklaması zorunludur.");
    }
  }

  return {
    valid: issues.filter((issue) => issue.severity === "ERROR").length === 0,
    issues,
  } satisfies IbysValidationResult;
}