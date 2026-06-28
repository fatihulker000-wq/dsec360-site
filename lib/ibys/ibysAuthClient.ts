type IbysAuthResult = {
  success: boolean;
  token?: string;
  expiresAt?: string;
  error?: string;
  raw?: unknown;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} env değeri tanımlı değil.`);
  }

  return value;
}

export async function getIbysAccessToken(): Promise<IbysAuthResult> {
  try {
    const authUrl = getRequiredEnv("IBYS_AUTH_URL");
    const clientId = getRequiredEnv("IBYS_CLIENT_ID");
    const clientSecret = getRequiredEnv("IBYS_CLIENT_SECRET");

    const res = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId,
        clientSecret,
      }),
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: `İBYS token alınamadı. HTTP ${res.status}`,
        raw: json,
      };
    }

    const token =
      json?.access_token ||
      json?.token ||
      json?.data?.access_token ||
      json?.data?.token;

    if (!token) {
      return {
        success: false,
        error: "İBYS token cevabında token alanı bulunamadı.",
        raw: json,
      };
    }

    const expiresIn = Number(json?.expires_in || json?.expiresIn || 3600);
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return {
      success: true,
      token,
      expiresAt,
      raw: json,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}