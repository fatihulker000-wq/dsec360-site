export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { createIbysLog, createIbysQueueItem } from "@/lib/ibys/ibysService";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function POST() {
  try {
    const startedAt = Date.now();

    const testPayload = {
      test: true,
      source: "D-SEC360",
      moduleName: "IBYS_TEST",
      recordType: "TEST_EMPLOYEE",
      employee: {
        tcKimlikNo: "11111111110",
        adSoyad: "Test Çalışan",
        firma: "D-SEC360 Test Firma",
        egitimAdi: "Temel İSG Eğitimi",
        ortam: "TEST",
      },
      createdAt: new Date().toISOString(),
    };

    const queue = await createIbysQueueItem({
      firmName: "D-SEC360 Test Firma",
      moduleName: "IBYS_TEST",
      recordType: "TEST_EMPLOYEE",
      recordTitle: "Test Çalışan - Temel İSG Eğitimi",
      payload: testPayload,
      createdBy: null,
    });

    const durationMs = Date.now() - startedAt;

    const log = await createIbysLog({
      queueId: queue.id,
      firmName: "D-SEC360 Test Firma",
      moduleName: "IBYS_TEST",
      action: "TEST_SEND",
      status: "SUCCESS",
      requestPayload: testPayload,
      responsePayload: {
        message: "Test gönderimi kuyruk kaydı oluşturuldu.",
        queueId: queue.id,
      },
      responseCode: "QUEUED",
      durationMs,
      createdBy: null,
    });

    return Response.json({
      success: true,
      message: "Test gönderimi başarıyla kuyruğa eklendi.",
      durationMs,
      data: {
        queueId: queue.id,
        logId: log.id,
      },
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}