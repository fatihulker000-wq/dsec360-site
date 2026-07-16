import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {

    try {

        const { searchParams } =
            new URL(req.url);

        const companyId =
            searchParams.get("companyId");

        let query =
            supabase
                .from("incidents")
                .select("*")
                .order("incident_date", {
                    ascending: false,
                });

        if (companyId) {

            query =
                query.eq(
                    "company_id",
                    companyId
                );

        }

        const {
            data,
            error,
        } = await query;

        if (error)
            throw error;

        return NextResponse.json({

            success: true,

            data,

        });

    } catch (e: any) {

        return NextResponse.json(

            {

                success: false,

                error: e.message,

            },

            {

                status: 500,

            }

        );

    }

}

export async function POST(req: NextRequest) {

    try {

        const body =
            await req.json();

        const {

            data,

            error,

        } = await supabase

            .from("incidents")

            .insert(body)

            .select()

            .single();

        if (error)
            throw error;

        return NextResponse.json({

            success: true,

            data,

        });

    } catch (e: any) {

        return NextResponse.json(

            {

                success: false,

                error: e.message,

            },

            {

                status: 500,

            }

        );

    }

}

export async function PUT(req: NextRequest) {

    try {

        const body =
            await req.json();

        const {

            id,

            ...update

        } = body;

        const {

            data,

            error,

        } = await supabase

            .from("incidents")

            .update(update)

            .eq("id", id)

            .select()

            .single();

        if (error)
            throw error;

        return NextResponse.json({

            success: true,

            data,

        });

    } catch (e: any) {

        return NextResponse.json(

            {

                success: false,

                error: e.message,

            },

            {

                status: 500,

            }

        );

    }

}

export async function DELETE(req: NextRequest) {

    try {

        const { searchParams } =
            new URL(req.url);

        const id =
            searchParams.get("id");

        if (!id) {

            return NextResponse.json(

                {

                    success: false,

                    error: "id required",

                },

                {

                    status: 400,

                }

            );

        }

        const { error } =
            await supabase

                .from("incidents")

                .delete()

                .eq("id", id);

        if (error)
            throw error;

        return NextResponse.json({

            success: true,

        });

    } catch (e: any) {

        return NextResponse.json(

            {

                success: false,

                error: e.message,

            },

            {

                status: 500,

            }

        );

    }

}