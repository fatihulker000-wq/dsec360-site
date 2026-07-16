"use client";

import { IncidentAuditEngine } from "./IncidentAuditEngine";

import {
  IncidentAuditAction,
  IncidentAuditLog,
  IncidentAuditStatus,
} from "./types";

export class IncidentAuditService {

  private static logs: IncidentAuditLog[] = [];

  static getAll(): IncidentAuditLog[] {
    return IncidentAuditEngine.sortNewest(
      this.logs
    );
  }

  static getByIncident(
    incidentId: string
  ): IncidentAuditLog[] {
    return IncidentAuditEngine.sortNewest(
      this.logs.filter(
        (x) => x.incidentId === incidentId
      )
    );
  }

  static clear() {
    this.logs = [];
  }

  static add(
    log: Omit<
      IncidentAuditLog,
      "id" | "createdAt"
    >
  ) {
    const item =
      IncidentAuditEngine.create(log);

    this.logs.unshift(item);

    return item;
  }

  static success(
    action: IncidentAuditAction,
    title: string,
    description: string,
    data: {
      incidentId: string;
      incidentNo?: string;
      companyId?: string;
      companyName?: string;
      userName: string;
      module: IncidentAuditLog["module"];
      metadata?: Record<string, unknown>;
    }
  ) {
    return this.add({

      ...data,

      action,

      title,

      description,

      status: "SUCCESS",

      severity: IncidentAuditEngine
        .severityFromStatus("SUCCESS"),

    });
  }

  static warning(
    action: IncidentAuditAction,
    title: string,
    description: string,
    data: {
      incidentId: string;
      incidentNo?: string;
      companyId?: string;
      companyName?: string;
      userName: string;
      module: IncidentAuditLog["module"];
      metadata?: Record<string, unknown>;
    }
  ) {
    return this.add({

      ...data,

      action,

      title,

      description,

      status: "WARNING",

      severity: IncidentAuditEngine
        .severityFromStatus("WARNING"),

    });
  }

  static failed(
    action: IncidentAuditAction,
    title: string,
    description: string,
    data: {
      incidentId: string;
      incidentNo?: string;
      companyId?: string;
      companyName?: string;
      userName: string;
      module: IncidentAuditLog["module"];
      metadata?: Record<string, unknown>;
    }
  ) {
    return this.add({

      ...data,

      action,

      title,

      description,

      status: "FAILED",

      severity: IncidentAuditEngine
        .severityFromStatus("FAILED"),

    });
  }

  static info(
    action: IncidentAuditAction,
    title: string,
    description: string,
    data: {
      incidentId: string;
      incidentNo?: string;
      companyId?: string;
      companyName?: string;
      userName: string;
      module: IncidentAuditLog["module"];
      metadata?: Record<string, unknown>;
    }
  ) {
    return this.add({

      ...data,

      action,

      title,

      description,

      status: "INFO",

      severity: IncidentAuditEngine
        .severityFromStatus("INFO"),

    });
  }

  // Incident

  static incidentCreated(
    incidentId: string,
    incidentNo: string,
    companyId: string,
    companyName: string,
    userName: string
  ) {
    return this.success(

      "INCIDENT_CREATED",

      "İş kazası oluşturuldu",

      "Yeni iş kazası kaydı oluşturuldu.",

      {

        incidentId,

        incidentNo,

        companyId,

        companyName,

        userName,

        module: "INCIDENT",

      }

    );
  }

  static incidentUpdated(
    incidentId: string,
    incidentNo: string,
    userName: string
  ) {
    return this.info(

      "INCIDENT_UPDATED",

      "İş kazası güncellendi",

      "İş kazası bilgileri düzenlendi.",

      {

        incidentId,

        incidentNo,

        userName,

        module: "INCIDENT",

      }

    );
  }

  static investigationStarted(
    incidentId: string,
    incidentNo: string,
    userName: string
  ) {
    return this.success(

      "INVESTIGATION_STARTED",

      "Soruşturma başlatıldı",

      "Olay soruşturma süreci başlatıldı.",

      {

        incidentId,

        incidentNo,

        userName,

        module: "INVESTIGATION",

      }

    );
  }

  static rootCauseCompleted(
    incidentId: string,
    incidentNo: string,
    userName: string
  ) {
    return this.success(

      "ROOT_CAUSE_COMPLETED",

      "Kök neden analizi tamamlandı",

      "Kök neden analizi başarıyla tamamlandı.",

      {

        incidentId,

        incidentNo,

        userName,

        module: "INVESTIGATION",

      }

    );
  }

  static correctiveActionCreated(
    incidentId: string,
    incidentNo: string,
    userName: string
  ) {
    return this.success(

      "CORRECTIVE_ACTION_CREATED",

      "DÖF oluşturuldu",

      "Düzeltici Önleyici Faaliyet kaydı oluşturuldu.",

      {

        incidentId,

        incidentNo,

        userName,

        module: "CORRECTIVE_ACTION",

      }

    );
  }

  static sgkPrepared(
    incidentId: string,
    incidentNo: string,
    userName: string
  ) {
    return this.success(

      "SGK_PREPARED",

      "SGK hazırlığı tamamlandı",

      "SGK bildirimi için veri hazırlandı.",

      {

        incidentId,

        incidentNo,

        userName,

        module: "SGK",

      }

    );
  }

  static ibysPrepared(
    incidentId: string,
    incidentNo: string,
    userName: string
  ) {
    return this.success(

      "IBYS_PREPARED",

      "İBYS paketi oluşturuldu",

      "İBYS veri paketi hazırlandı.",

      {

        incidentId,

        incidentNo,

        userName,

        module: "IBYS",

      }

    );
  }

  static ibysSent(
    incidentId: string,
    incidentNo: string,
    userName: string
  ) {
    return this.success(

      "IBYS_SENT",

      "İBYS bildirimi gönderildi",

      "İBYS gönderimi başarıyla tamamlandı.",

      {

        incidentId,

        incidentNo,

        userName,

        module: "IBYS",

      }

    );
  }
}