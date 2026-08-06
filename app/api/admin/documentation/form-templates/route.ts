import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function clean(value: unknown) {
  return String(value ?? "").trim();
}

/* -------------------------------------------------- */
/* LIST */
/* -------------------------------------------------- */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const companyId = clean(searchParams.get("companyId"));
    const category = clean(searchParams.get("category"));
    const status = clean(searchParams.get("status"));

    let query = supabase
      .from("form_template_library")
      .select("*")
      .eq("is_deleted", false)
      .order("category")
      .order("short_title")
      .order("title");

    if (companyId) {
      query = query.or(
        `company_id.is.null,company_id.eq.${companyId}`
      );
    } else {
      query = query.is("company_id", null);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      records: data ?? [],
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------- */
/* CREATE */
/* -------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payload = {
      company_id: body.companyId || null,

      template_code: body.templateCode,
      title: body.title,
      short_title: body.shortTitle,

      category: body.category,
      form_type: body.formType,

      source_module: "DOCUMENTATION",
      target_module: body.targetModule,

      description: body.description,
      legal_basis: body.legalBasis,

      version_no: body.versionNo ?? 1,
      revision_no: body.revisionNo ?? 0,

      schema_json: body.schemaJson ?? {},
      sections_json: body.sectionsJson ?? [],
      fields_json: body.fieldsJson ?? [],

      status: body.status ?? "PUBLISHED",

      is_system: false,
      is_active: true,
      is_deleted: false,

      created_by: body.createdBy ?? null,
      updated_by: body.createdBy ?? null,

      published_at: new Date().toISOString()
    };

    const { data, error } =
      await supabase
        .from("form_template_library")
        .insert(payload)
        .select("*")
        .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      record: data,
    });

  } catch (e) {

    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      },
      {
        status: 500,
      }
    );
  }
}

/* -------------------------------------------------- */
/* UPDATE */
/* -------------------------------------------------- */

export async function PATCH(req: NextRequest) {

  try {

    const body = await req.json();

    const id = clean(body.id);

    if (!id) {

      return NextResponse.json(
        {
          success: false,
          error: "ID bulunamadı."
        },
        {
          status:400
        }
      );

    }

    const { data, error } =
      await supabase
        .from("form_template_library")
        .update({

          title: body.title,
          short_title: body.shortTitle,

          description: body.description,

          legal_basis: body.legalBasis,

          category: body.category,

          form_type: body.formType,

          target_module: body.targetModule,

          revision_no: body.revisionNo,

          schema_json: body.schemaJson,

          sections_json: body.sectionsJson,

          fields_json: body.fieldsJson,

          status: body.status,

          updated_by: body.updatedBy ?? null,

          updated_at: new Date().toISOString()

        })
        .eq("id", id)
        .select("*")
        .single();

    if (error) throw error;

    return NextResponse.json({

      success:true,

      record:data

    });

  } catch(e){

    return NextResponse.json(
      {

        success:false,

        error:e instanceof Error
          ? e.message
          : String(e)

      },
      {
        status:500
      }
    );

  }

}

/* -------------------------------------------------- */
/* DELETE (SOFT) */
/* -------------------------------------------------- */

export async function DELETE(req: NextRequest) {

  try {

    const { searchParams } =
      new URL(req.url);

    const id =
      clean(searchParams.get("id"));

    if (!id){

      return NextResponse.json(
        {
          success:false,
          error:"ID bulunamadı."
        },
        {
          status:400
        }
      );

    }

    const { error } =
      await supabase
        .from("form_template_library")
        .update({

          is_deleted:true,

          is_active:false,

          updated_at:new Date().toISOString()

        })
        .eq("id",id);

    if(error)
      throw error;

    return NextResponse.json({

      success:true

    });

  } catch(e){

    return NextResponse.json(
      {

        success:false,

        error:e instanceof Error
          ? e.message
          : String(e)

      },
      {
        status:500
      }
    );

  }

}