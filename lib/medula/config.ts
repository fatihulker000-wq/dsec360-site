export type MedulaEnvironment="TEST"|"PROD";

export const MEDULA={
  TEST:{
    RECETE_WSDL:"https://sgkt.sgk.gov.tr/medula/eczane/saglikTesisiReceteIslemleriWS?wsdl",
    RECETE_ENDPOINT:"https://sgkt.sgk.gov.tr/medula/eczane/saglikTesisiReceteIslemleriWS",
  },
  PROD:{
    RECETE_WSDL:"https://medeczane.sgk.gov.tr/medula/eczane/saglikTesisiReceteIslemleriWS?wsdl",
    RECETE_ENDPOINT:"https://medeczane.sgk.gov.tr/medula/eczane/saglikTesisiReceteIslemleriWS",
  }
} as const;

export function medulaConfig(env:MedulaEnvironment){
  return MEDULA[env];
}
