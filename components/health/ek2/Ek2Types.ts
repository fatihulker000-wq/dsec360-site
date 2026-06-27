// Ek2Types.ts

export type FormType =
  | "İşe Giriş"
  | "Periyodik";

export type FormStatus =
  | "Taslak"
  | "Tamamlandı"
  | "İmzalandı";

export type Decision =
  | "Çalışabilir"
  | "Şartlı Çalışabilir"
  | "Çalışamaz";

export interface AudiometryModel {
  testDate: string;

  rightEar500: string;
  rightEar1000: string;
  rightEar2000: string;
  rightEar4000: string;

  leftEar500: string;
  leftEar1000: string;
  leftEar2000: string;
  leftEar4000: string;

  result:
    | ""
    | "Normal"
    | "Takip Gerekli"
    | "Patolojik";

  note: string;
}

export interface SftModel {
  testDate: string;

  fvc: string;
  fev1: string;
  fev1fvc: string;
  pef: string;
  fef2575: string;

  result:
    | ""
    | "Normal"
    | "Obstrüktif"
    | "Restriktif"
    | "Takip Gerekli";

  doctorNote: string;
}

export interface VisionModel {

  testDate: string;

  rightFar: string;
  leftFar: string;

  rightNear: string;
  leftNear: string;

  colorVision: string;

  depthVision: string;

  glasses: boolean;

  result:
    | ""
    | "Normal"
    | "Takip Gerekli"
    | "Uygun Değil";

  note: string;

}

export interface VaccineItem {

  id: string;

  name: string;

  date: string;

  nextDate: string;

  status:
    | "Tam"
    | "Eksik"
    | "Süresi Dolmuş";

}

export interface Ek2Form {

  id?: string;

  employeeId: string;

  companyId: string;

  formType: FormType;

  status: FormStatus;

  fileNo: string;

  revisionNo: string;

  examDate: string;

  nextExamDate: string;

  doctorName: string;

  employeeName: string;

  identityNumber: string;

  birthDate: string;

  gender: string;

  bloodGroup: string;

  phone: string;

  companyName: string;

  workplaceAddress: string;

  department: string;

  jobTitle: string;

  startDate: string;

  dangerClass: string;

  naceCode: string;

  previousJobs: string;

  currentJobDescription: string;

  exposures: string;

  ppeUsage: string;

  previousAccidents: string;

  occupationalDiseaseHistory: string;

  chronicDiseases: string;

  surgeries: string;

  medicines: string;

  allergies: string;

  habits: string;

  familyHistory: string;

  height: string;

  weight: string;

  bmi: string;

  systolic: string;

  diastolic: string;

  pulse: string;

  respiration: string;

  temperature: string;

  spo2: string;

  headNeck: string;

  eye: string;

  earNoseThroat: string;

  respiratory: string;

  cardiovascular: string;

  digestive: string;

  genitourinary: string;

  musculoskeletal: string;

  neurological: string;

  skin: string;

  psychological: string;

  hemogram: string;

  biochemistry: string;

  urine: string;

  radiology: string;

  ekg: string;

  otherTests: string;

  riskEvaluation: string;

  restrictions: string;

  recommendations: string;

  decision: Decision;

  doctorOpinion: string;

  signatureNote: string;

  audiometry: AudiometryModel;

  sft: SftModel;

  vision: VisionModel;

  vaccines: VaccineItem[];

}

export interface DoraWarning {

  title: string;

  level:
    | "info"
    | "warning"
    | "danger";

  message: string;

}

export interface PdfPreviewData {

  employeeName: string;

  companyName: string;

  doctorName: string;

  examDate: string;

  decision: string;

  formType: string;

}