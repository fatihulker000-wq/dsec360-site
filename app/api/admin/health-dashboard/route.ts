import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;

    const isAllowedRole =
      adminRole === "super_admin" || adminRole === "company_admin";

    if (adminAuth !== "ok" || !isAllowedRole) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,

      summary: {
        todayExams: 0,
        upcomingExams: 0,
        overdueExams: 0,
        todayPrescriptions: 0,
        openAccidents: 0,
        upcomingVaccines: 0,
        criticalAlerts: 0,
        riskyEmployees: 0,
      },

      upcomingExams: [],

      recentPrescriptions: [],

      recentEk2: [],

      alerts: [
        {
          id: "health-module-info",
          level: "Bilgi",
          title: "Sağlık modülü kurulum aşamasında",
          desc: "Muayene, EK-2, reçete, laboratuvar ve aşı takip verileri eklendikçe dashboard otomatik beslenecektir.",
        },
      ],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Health dashboard could not be loaded." },
      { status: 500 }
    );
  }
}