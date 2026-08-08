import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function db() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function text(v: unknown) {
  return String(v ?? "").trim();
}

function num(v: unknown): number | null {
  if (
    v === null ||
    v === undefined ||
    v === ""
  ) {
    return null;
  }

  const n = Number(v);

  return Number.isFinite(n)
    ? n
    : null;
}

export async function GET(
  req: NextRequest
) {
  try {
    const firmId = text(
      req.nextUrl.searchParams.get(
        "firmId"
      )
    );

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "firmId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = db();
    const now = Date.now();

    const [
      companiesR,
      employeesR,
      companyDocsR,
      employeeDocsR,
      permitsR,
      logsR,
      qrR,
    ] = await Promise.all([
      supabase
        .from(
          "subcontractor_companies"
        )
        .select("*")
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "is_deleted",
          false
        )
        .order(
          "company_name"
        ),

      supabase
        .from(
          "subcontractor_employees"
        )
        .select("*")
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "is_deleted",
          false
        )
        .order(
          "full_name"
        ),

      supabase
        .from(
          "subcontractor_company_documents"
        )
        .select("*")
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "is_deleted",
          false
        ),

      supabase
        .from(
          "subcontractor_employee_documents"
        )
        .select("*")
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "is_deleted",
          false
        ),

      supabase
        .from(
          "subcontractor_work_permits"
        )
        .select("*")
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "is_deleted",
          false
        ),

      supabase
        .from(
          "subcontractor_entry_logs"
        )
        .select("*")
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "is_deleted",
          false
        )
        .order(
          "entry_time_millis",
          {
            ascending: false,
          }
        ),

      supabase
        .from(
          "subcontractor_qr_tokens"
        )
        .select("*")
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "is_deleted",
          false
        )
        .order(
          "created_at_millis",
          {
            ascending: false,
          }
        ),
    ]);

    for (
      const result of [
        companiesR,
        employeesR,
        companyDocsR,
        employeeDocsR,
        permitsR,
        logsR,
        qrR,
      ]
    ) {
      if (result.error) {
        throw result.error;
      }
    }

    const companies =
      companiesR.data || [];

    const employees =
      employeesR.data || [];

    const companyDocuments =
      companyDocsR.data || [];

    const employeeDocuments =
      employeeDocsR.data || [];

    const permits =
      permitsR.data || [];

    const logs =
      logsR.data || [];

    const qrTokens =
      qrR.data || [];

    const companyById =
      new Map(
        companies.map(
          (c: any) => [
            String(c.id),
            c,
          ]
        )
      );

    const blockedEmployees =
      employees.filter(
        (e: any) => {
          const company =
            companyById.get(
              String(
                e.company_id
              )
            );

          if (
            !company ||
            company.is_active !== true
          ) {
            return true;
          }

          if (
            company.contract_end_millis &&
            Number(
              company.contract_end_millis
            ) < now
          ) {
            return true;
          }

          if (
            e.entry_permission !== true
          ) {
            return true;
          }

          if (
            text(
              e.access_blocked_note
            )
          ) {
            return true;
          }

          const docs =
            employeeDocuments.filter(
              (d: any) =>
                String(
                  d.employee_id
                ) ===
                  String(
                    e.id
                  ) &&
                d.is_required ===
                  true
            );

          return docs.some(
            (d: any) =>
              text(
                d.status
              ).toUpperCase() !==
                "TAM" ||
              (
                d.valid_until_millis &&
                Number(
                  d.valid_until_millis
                ) < now
              )
          );
        }
      );

    const missingCompanyDocs =
      companyDocuments.filter(
        (d: any) =>
          d.is_required === true &&
          text(
            d.status
          ).toUpperCase() !==
            "TAM"
      ).length;

    const expiredCompanyDocs =
      companyDocuments.filter(
        (d: any) =>
          d.valid_until_millis &&
          Number(
            d.valid_until_millis
          ) < now
      ).length;

    const activePermits =
      permits.filter(
        (p: any) =>
          text(
            p.status
          ).toUpperCase() ===
            "AKTIF" &&
          Number(
            p.start_millis
          ) <= now &&
          (
            !p.end_millis ||
            Number(
              p.end_millis
            ) >= now
          )
      ).length;

    const expiredPermits =
      permits.filter(
        (p: any) =>
          p.end_millis &&
          Number(
            p.end_millis
          ) < now
      ).length;

    return NextResponse.json(
      {
        success: true,
        firmId,

        summary: {
          subcontractors:
            companies.length,

          activeSubcontractors:
            companies.filter(
              (c: any) =>
                c.is_active ===
                true
            ).length,

          passiveSubcontractors:
            companies.filter(
              (c: any) =>
                c.is_active !==
                true
            ).length,

          employees:
            employees.length,

          inside:
            employees.filter(
              (e: any) =>
                e.is_inside ===
                true
            ).length,

          blocked:
            blockedEmployees.length,

          missingCompanyDocs,

          expiredCompanyDocs,

          activePermits,

          expiredPermits,
        },

        companies,

        employees,

        companyDocuments,

        employeeDocuments,

        permits,

        entryLogs: logs,

        qrTokens,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "subcontractors GET error",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Taşeron verileri alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    const firmId =
      text(body.firmId);

    const companyName =
      text(body.companyName);

    if (
      !firmId ||
      !companyName
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "firmId ve companyName zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now = Date.now();

    const supabase =
      db();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "subcontractor_companies"
        )
        .insert({
          firm_id:
            firmId,

          company_name:
            companyName,

          authorized_person:
            text(
              body.authorizedPerson
            ),

          phone:
            text(
              body.phone
            ),

          email:
            text(
              body.email
            ),

          tax_no:
            text(
              body.taxNo
            ),

          work_scope:
            text(
              body.workScope
            ),

          contract_start_millis:
            num(
              body.contractStartMillis
            ),

          contract_end_millis:
            num(
              body.contractEndMillis
            ),

          application_status:
            text(
              body.applicationStatus
            ) ||
            "TASLAK",

          approval_status:
            text(
              body.approvalStatus
            ) ||
            "BEKLIYOR",

          is_active:
            body.isActive !==
            false,

          source:
            "WEB",

          created_at_millis:
            now,

          updated_at_millis:
            now,
        })
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Taşeron firma eklenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    const id =
      text(body.id);

    const firmId =
      text(body.firmId);

    if (!id || !firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "id ve firmId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const payload:
      Record<
        string,
        unknown
      > = {
        updated_at_millis:
          Date.now(),

        source:
          "WEB",
      };

    const map:
      Record<
        string,
        string
      > = {
        companyName:
          "company_name",

        authorizedPerson:
          "authorized_person",

        phone:
          "phone",

        email:
          "email",

        taxNo:
          "tax_no",

        workScope:
          "work_scope",

        applicationStatus:
          "application_status",

        approvalStatus:
          "approval_status",

        revisionNote:
          "revision_note",
      };

    for (
      const [
        from,
        to,
      ] of Object.entries(
        map
      )
    ) {
      if (
        body[from] !==
        undefined
      ) {
        payload[to] =
          text(
            body[from]
          );
      }
    }

    if (
      body.isActive !==
      undefined
    ) {
      payload.is_active =
        Boolean(
          body.isActive
        );
    }

    if (
      body.contractStartMillis !==
      undefined
    ) {
      payload.contract_start_millis =
        num(
          body.contractStartMillis
        );
    }

    if (
      body.contractEndMillis !==
      undefined
    ) {
      payload.contract_end_millis =
        num(
          body.contractEndMillis
        );
    }

    const supabase =
      db();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "subcontractor_companies"
        )
        .update(
          payload
        )
        .eq(
          "id",
          id
        )
        .eq(
          "firm_id",
          firmId
        )
        .eq(
          "is_deleted",
          false
        )
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Taşeron firma güncellenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    const id =
      text(body.id);

    const firmId =
      text(body.firmId);

    if (!id || !firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "id ve firmId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      Date.now();

    const supabase =
      db();

    const {
      error,
    } =
      await supabase
        .from(
          "subcontractor_companies"
        )
        .update({
          is_deleted:
            true,

          deleted_at_millis:
            now,

          updated_at_millis:
            now,

          source:
            "WEB",
        })
        .eq(
          "id",
          id
        )
        .eq(
          "firm_id",
          firmId
        );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Taşeron firma silinemedi.",
      },
      {
        status: 500,
      }
    );
  }
}