export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { sendIbysQueueItem } from "@/lib/ibys/ibysService";
import { getValidIbysAccessToken } from "@/lib/ibys/ibysTokenService";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.queueId) {
      return Response.json(
        {
          success: false,
          error: "queueId zorunludur.",
        },
        { status: 400 }
      );
    }

    const token = await getValidIbysAccessToken();

    const result = await sendIbysQueueItem(body.queueId);

    return Response.json({
      ...result,
      token: {
        tokenType: token.tokenType,
        expiresAt: token.expiresAt,
        reused: token.reused,
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