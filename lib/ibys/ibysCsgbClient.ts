import { getIbysSettings } from "@/lib/ibys/ibysSettingsService";
import { mapToCsgbPayload } from "@/lib/ibys/ibysCsgbPayloadMapper";

export type IbysEndpointType =
  | "EGITIM_BILDIR"
  | "MUAYENE_BILDIR"
  | "HIZMET_ISYERI_BILDIR"
  | "ISG_PROF_DOGRULA"
  | "SIGORTALILIK_KONTROL";

const TEST_BASE_URL = "https://ibystestws.csgb.gov.tr/ibystest/api";
const LIVE_BASE_URL = "https://ibysws.csgb.gov.tr/ibys/api";

const endpointMap: Record<IbysEndpointType, string> = {
  EGITIM_BILDIR: "/egitimBilgisiIslemleri/egitimBilgisiBildir",
  MUAYENE_BILDIR: "/muayeneBilgisiIslemleri/muayeneBilgisiBildir",
  HIZMET_ISYERI_BILDIR:
    "/hizmetVerilenIsyeriIslemleri/hizmetVerilenIsyeriBildir",
  ISG_PROF_DOGRULA:
    "/isgProfesyoneliIslemleri/isgProfesyoneliDogrula",
  SIGORTALILIK_KONTROL:
    "/calisanSigortalilikIslemleri/calisanSigortalilikKontrolu",
};

function getBasicAuth(username: string, password: string) {
  const token = Buffer.from(`${username}:${password}`).toString("base64");
  return `Basic ${token}`;
}

function getEndpointType(recordType?: string | null): IbysEndpointType {
  const type = String(recordType || "").toUpperCase();

  if (type === "TRAINING" || type === "EGITIM") return "EGITIM_BILDIR";
  if (type === "HEALTH" || type === "MUAYENE") return "MUAYENE_BILDIR";
  if (type === "WORKPLACE" || type === "ISYERI") {
    return "HIZMET_ISYERI_BILDIR";
  }

  throw new Error(`Bu kayıt türü için İBYS endpoint tanımı yok: ${recordType}`);
}

export async function sendToCsgbIbys(input: {
  recordType?: string | null;
  payload: Record<string, unknown>;
}) {
  const settings = await getIbysSettings();

  if (!settings?.client_id || !settings?.client_secret_encrypted) {
    throw new Error("İBYS firma kodu veya firma şifresi eksik.");
  }

  const environment = String(settings.environment || "TEST").toUpperCase();
  const baseUrl =
    environment === "CANLI"
      ? LIVE_BASE_URL
      : settings.api_url || TEST_BASE_URL;

  const endpointType = getEndpointType(input.recordType);
  const url = `${baseUrl}${endpointMap[endpointType]}`;

  const csgbPayload = mapToCsgbPayload({
  recordType: input.recordType,
  payload: input.payload,
});
  const startedAt = Date.now();

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: getBasicAuth(
        settings.client_id,
        settings.client_secret_encrypted
      ),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(csgbPayload),
    cache: "no-store",
  });

  const rawText = await response.text();

  let responseJson: any = {};
  try {
    responseJson = rawText ? JSON.parse(rawText) : {};
  } catch {
    responseJson = { raw: rawText };
  }

  const durationMs = Date.now() - startedAt;

  return {
    ok: response.ok,
    httpStatus: response.status,
    durationMs,
    endpointType,
    url,
    payload: csgbPayload,
    response: responseJson,
  };
}
