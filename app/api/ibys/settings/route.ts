export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import {
  getIbysSettings,
  saveIbysSettings,
} from "@/lib/ibys/ibysSettingsService";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function GET() {
  try {
    const data = await getIbysSettings();

    return Response.json({
      success: true,
      data,
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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const data = await saveIbysSettings({
      environment: body.environment ?? "TEST",
      apiUrl: body.apiUrl ?? "",
      tokenUrl: body.tokenUrl ?? "",
      clientId: body.clientId ?? "",
      clientSecret: body.clientSecret ?? "",
      autoSendEnabled: Boolean(body.autoSendEnabled),
      debugMode: Boolean(body.debugMode),
      retryCount: Number(body.retryCount ?? 3),
      retryDelaySeconds: Number(body.retryDelaySeconds ?? 60),
      queueLimit: Number(body.queueLimit ?? 100),
    });

    return Response.json({
      success: true,
      data,
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