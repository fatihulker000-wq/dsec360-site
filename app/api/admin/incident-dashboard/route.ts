import { NextRequest, NextResponse } from "next/server";
import { IncidentDashboardService } from "@/lib/incident/IncidentDashboardService";

export async function GET(req: NextRequest) {

    try {

        const { searchParams } =
            new URL(req.url);

        const companyId =
            searchParams.get("companyId") ?? undefined;

        const dashboard =
            await IncidentDashboardService.getDashboard(
                companyId
            );

        return NextResponse.json({

            success: true,

            data: dashboard,

        });

    } catch (error: any) {

        return NextResponse.json(

            {

                success: false,

                error: error.message,

            },

            {

                status: 500,

            }

        );

    }

}