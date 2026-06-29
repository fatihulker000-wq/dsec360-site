function toNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toStringValue(value: unknown) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function todayTimestamp() {
  return new Date().toISOString().slice(0, 23);
}

function formatDateTr(value: unknown) {
  if (!value) return "";

  const raw = String(value);

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) return raw;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function mapToCsgbPayload(input: {
  recordType?: string | null;
  payload: Record<string, unknown>;
}) {
  const type = String(input.recordType || input.payload.recordType || "").toUpperCase();
  const p = input.payload;

  if (type === "TRAINING" || type === "EGITIM") {
    return {
      sertifikaTipi: toNumber(p.sertifikaTipi ?? p.certificateType) ?? 1,
      isgProfTcKNo: toNumber(p.isgProfTcKNo ?? p.isgProfessionalTcNo ?? p.trainerTcKimlikNo),
      egitimKodu: toStringValue(p.egitimKodu ?? p.trainingCode ?? p.training_code),
      egitimSuresi: Number(p.egitimSuresi ?? p.durationMinutes ?? p.duration_minutes ?? 0),
      egitimTarihi: formatDateTr(p.egitimTarihi ?? p.trainingDate ?? p.training_date),
      egitimYeri: toNumber(p.egitimYeri ?? p.trainingPlace) ?? 1,
      egitimYontemi: toNumber(p.egitimYontemi ?? p.trainingMethod) ?? 0,
      egiticiTcKNo: toNumber(p.egiticiTcKNo ?? p.trainerTcKimlikNo ?? p.trainer_tc_no),
      isyeriSgkSicilNo: toStringValue(
        p.isyeriSgkSicilNo ?? p.sgkRegistrationNo ?? p.sgk_registration_no
      ),
      calisanTcKNo: toNumber(p.calisanTcKNo ?? p.tcKimlikNo ?? p.tc_kimlik_no),
      zamanDamgasi: toStringValue(p.zamanDamgasi ?? p.timestamp) || todayTimestamp(),
      imzalayanKimlikNo: toNumber(
        p.imzalayanKimlikNo ?? p.signerTcKimlikNo ?? p.isgProfTcKNo
      ),
    };
  }

  if (type === "HEALTH" || type === "MUAYENE") {
    return {
      ihKimlikNo: toNumber(p.ihKimlikNo ?? p.doctorTcKimlikNo ?? p.doctorTcNo),
      calisanMeslegi: toStringValue(p.calisanMeslegi ?? p.jobCode ?? p.employeeJobCode),
      rontgenYapildiMi: toNumber(p.rontgenYapildiMi ?? p.xrayDone) ?? 0,
      isitmeTestiYapildiMi: toNumber(p.isitmeTestiYapildiMi ?? p.hearingTestDone) ?? 0,
      solunumFonkTestiYapildiMi:
        toNumber(p.solunumFonkTestiYapildiMi ?? p.respiratoryTestDone) ?? 0,
      kanTetkikiYapildiMi: toNumber(p.kanTetkikiYapildiMi ?? p.bloodTestDone) ?? 0,
      idrarTetkikiYapildiMi: toNumber(p.idrarTetkikiYapildiMi ?? p.urineTestDone) ?? 0,
      isyeriSgkSicilNo: toStringValue(
        p.isyeriSgkSicilNo ?? p.sgkRegistrationNo ?? p.sgk_registration_no
      ),
      calisanTcKNo: toNumber(p.calisanTcKNo ?? p.tcKimlikNo ?? p.tc_kimlik_no),
      sonucVeKanaat: toStringValue(p.sonucVeKanaat ?? p.healthDecisionCode ?? p.decisionCode),
      muayeneRaporTarihi: formatDateTr(
        p.muayeneRaporTarihi ?? p.examinationDate ?? p.examination_date
      ),
      raporGecerlikTarihi: formatDateTr(
        p.raporGecerlikTarihi ?? p.nextExaminationDate ?? p.next_examination_date
      ),
      zamanDamgasi: toStringValue(p.zamanDamgasi ?? p.timestamp) || todayTimestamp(),
      imzalayanKimlikNo: toNumber(
        p.imzalayanKimlikNo ?? p.signerTcKimlikNo ?? p.ihKimlikNo
      ),
      raporTuru: toStringValue(p.raporTuru ?? p.reportTypeCode) || "100050",

      calismaOrtamiDTO: p.calismaOrtamiDTO ?? {
        fizikiOrtamSinifi: [],
        havaSinifi: [],
        gurultuSinifi: [],
        elektrikSinifi: [],
        tozYonetmeligiSinifi: [],
        kimyasalMaddeSinifi: [],
        biyolojikEtkenlerSinifi: [],
      },

      calismaSekliDTO: p.calismaSekliDTO ?? {
        calismaPozisyonu: "",
        calismaZamani: "",
        aracKullanimi: "",
      },

      kullanilanIsEkipmanlari: p.kullanilanIsEkipmanlari ?? [],
    };
  }

  if (type === "WORKPLACE" || type === "ISYERI") {
    return {
      sgkSicilNo: toStringValue(
        p.sgkSicilNo ?? p.sgkRegistrationNo ?? p.sgk_registration_no
      ),
      hizmetBaslangicTarih: formatDateTr(
        p.hizmetBaslangicTarih ?? p.serviceStartDate ?? p.startDate
      ),
    };
  }

  return p;
}