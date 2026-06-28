export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { listIbysLogs } from "@/lib/ibys/ibysService";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function GET() {
  try {
    const data = await listIbysLogs();

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