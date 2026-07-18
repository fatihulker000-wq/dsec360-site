export type DemoSeedResult = {
  success?: boolean;
  error?: string;
  company?: {
    id?: string;
    name?: string;
  };
  employees?: {
    inserted?: number;
    skipped?: number;
  };
  summary?: Record<string, number>;
};

export async function seedDemoCompany(): Promise<DemoSeedResult> {
  const response = await fetch("/api/admin/demo/seed", {
    method: "POST",
    credentials: "include",
  });

  if (
    response.status === 401 &&
    typeof window !== "undefined"
  ) {
    window.location.href = "/admin/login";
  }

  const json: DemoSeedResult = await response
    .json()
    .catch(() => ({} as DemoSeedResult));

  if (!response.ok) {
    throw new Error(
      json.error || "Demo verileri oluşturulamadı."
    );
  }

  return json;
}