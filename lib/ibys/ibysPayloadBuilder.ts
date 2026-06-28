export type IbysRecordType =
  | "EMPLOYEE"
  | "TRAINING"
  | "HEALTH"
  | "ACCIDENT"
  | "UNKNOWN";

export type BuildIbysPayloadInput = {
  recordType: string;
  firmId?: string | null;
  firmName?: string | null;
  recordId?: string | null;
  recordTitle?: string | null;
  sourceData?: Record<string, unknown> | null;
};

function pick(
  data: Record<string, unknown>,
  keys: string[],
  fallback: unknown = null
) {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null && String(data[key]).trim() !== "") {
      return data[key];
    }
  }

  return fallback;
}

function normalizeRecordType(type: string): IbysRecordType {
  const value = String(type || "").toUpperCase();

  if (["EMPLOYEE", "CALISAN", "ÇALIŞAN"].includes(value)) return "EMPLOYEE";
  if (["TRAINING", "EGITIM", "EĞİTİM"].includes(value)) return "TRAINING";
  if (["HEALTH", "MUAYENE", "SAGLIK", "SAĞLIK"].includes(value)) return "HEALTH";
  if (["ACCIDENT", "OLAY", "IS_KAZASI", "İŞ_KAZASI"].includes(value)) return "ACCIDENT";

  return "UNKNOWN";
}

export function buildIbysPayload(input: BuildIbysPayloadInput) {
  const source = input.sourceData ?? {};
  const recordType = normalizeRecordType(input.recordType);

  const base = {
    recordType,
    firmId: input.firmId ?? pick(source, ["firmId", "firm_id", "company_id"]),
    firmName: input.firmName ?? pick(source, ["firmName", "firm_name", "company_name"]),
    recordId: input.recordId ?? pick(source, ["recordId", "record_id", "id"]),
    recordTitle: input.recordTitle ?? pick(source, ["recordTitle", "record_title", "title", "name"]),
    sgkRegistrationNo: pick(source, [
      "sgkRegistrationNo",
      "sgk_registration_no",
      "sgk_sicil_no",
    ]),
    ibysWorkplaceId: pick(source, [
      "ibysWorkplaceId",
      "ibys_workplace_id",
      "ibys_isyeri_id",
    ]),
  };

  if (recordType === "EMPLOYEE") {
    return {
      ...base,
      employeeName: pick(source, ["employeeName", "employee_name", "full_name", "name"]),
      tcKimlikNo: pick(source, ["tcKimlikNo", "tc_kimlik_no", "identityNo", "tc_no"]),
      jobTitle: pick(source, ["jobTitle", "job_title", "position", "gorev"]),
      startDate: pick(source, ["startDate", "start_date", "employment_start_date"]),
      phone: pick(source, ["phone", "phone_number"]),
      email: pick(source, ["email"]),
    };
  }

  if (recordType === "TRAINING") {
    return {
      ...base,
      trainingName: pick(source, ["trainingName", "training_name", "title", "name"]),
      trainingDate: pick(source, ["trainingDate", "training_date", "date"]),
      durationMinutes: pick(source, [
        "durationMinutes",
        "duration_minutes",
        "duration",
        "sure_dakika",
      ]),
      trainerName: pick(source, ["trainerName", "trainer_name", "expert_name"]),
      participantCount: pick(source, ["participantCount", "participant_count"]),
      trainingType: pick(source, ["trainingType", "training_type"]),
    };
  }

  if (recordType === "HEALTH") {
    return {
      ...base,
      employeeName: pick(source, ["employeeName", "employee_name", "full_name", "name"]),
      tcKimlikNo: pick(source, ["tcKimlikNo", "tc_kimlik_no", "identityNo", "tc_no"]),
      examinationDate: pick(source, [
        "examinationDate",
        "examination_date",
        "muayene_tarihi",
        "date",
      ]),
      doctorName: pick(source, ["doctorName", "doctor_name", "workplace_doctor"]),
      decision: pick(source, ["decision", "health_decision", "karar"]),
      nextExaminationDate: pick(source, [
        "nextExaminationDate",
        "next_examination_date",
      ]),
    };
  }

  if (recordType === "ACCIDENT") {
    return {
      ...base,
      employeeName: pick(source, ["employeeName", "employee_name", "full_name", "name"]),
      tcKimlikNo: pick(source, ["tcKimlikNo", "tc_kimlik_no", "identityNo", "tc_no"]),
      accidentDate: pick(source, ["accidentDate", "accident_date", "event_date"]),
      accidentType: pick(source, ["accidentType", "accident_type", "event_type"]),
      description: pick(source, ["description", "event_description", "aciklama"]),
      location: pick(source, ["location", "event_location"]),
    };
  }

  return {
    ...base,
    raw: source,
  };
}