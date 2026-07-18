export type DemoSeedResult = {
  success: boolean;

  error?: string;

  message?: string;

  company?: {
    id: string;

    local_firm_id?:
      | number
      | null;

    name: string;
  };

  employees?: {
    inserted: number;

    errors: string[];
  };

  accidents?: {
    inserted: number;

    errors: string[];
  };

  inspections?: {
    inserted: number;

    errors: string[];
  };

  cbs?: {
    inserted: number;

    errors: string[];
  };
};

export async function createDemoCompanyData():
  Promise<DemoSeedResult> {
  const response =
    await fetch(
      "/api/admin/demo/seed",
      {
        method: "POST",
        credentials:
          "include",
      }
    );

  const json =
    await response
      .json()
      .catch(
        () =>
          ({}) as DemoSeedResult
      );

  if (
    !response.ok ||
    !json.success
  ) {
    throw new Error(
      json.error ||
        "Demo verileri oluşturulamadı."
    );
  }

  return json;
}