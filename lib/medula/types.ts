export type MedulaEnvironment="TEST"|"PROD";

export type MedulaCredentials={
  username:string;       // hekim T.C. / MEDULA kullanıcı adı
  password:string;
  doctorTc:string;
  facilityCode:string;
  environment:MedulaEnvironment;
};

export type MedulaResult<T=unknown>={
  ok:boolean;
  resultCode:string;
  resultMessage:string;
  warningMessage:string;
  data?:T;
};

export type EreceteDrug={
  barkod:string;
  adet:number;
  kullanimSekli?:number;
  kullanimDoz1:number;
  kullanimDoz2:number;
  kullanimPeriyot:number;
  kullanimPeriyotBirimi:number;
  geriOdemeKapsaminda?:"E"|"H";
};

export type ErecetePayload={
  tesisKodu:number;
  tcKimlikNo:number|string;
  takipNo?:string;
  provizyonTipi:number;
  receteTarihi:string; // dd.MM.yyyy
  receteTuru:number;
  receteAltTuru:number;
  protokolNo:string;
  doktorTcKimlikNo:number|string;
  doktorBransKodu:number;
  doktorSertifikaKodu:number;
  ereceteIlacListesi:EreceteDrug[];
  ereceteTaniListesi:Array<{taniKodu:string;taniAdi?:string}>;
};
