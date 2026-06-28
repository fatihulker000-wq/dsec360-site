export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { createNewIbysToken, getValidIbysAccessToken } from "@/lib/ibys/ibysTokenService";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function GET() {
  try {
    const token = await getValidIbysAccessToken();

    return Response.json({
      success: true,
      message: token.reused
        ? "Geçerli token bulundu, yeniden kullanılıyor."
        : "Yeni token oluşturuldu.",
      reused: token.reused,
      tokenType: token.tokenType,
      expiresAt: token.expiresAt,
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

export async function POST() {
  try {
    const token = await createNewIbysToken();

    return Response.json({
      success: true,
      message: "Token başarıyla oluşturuldu.",
      reused: token.reused,
      tokenType: token.tokenType,
      expiresAt: token.expiresAt,
      durationMs: token.durationMs,
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