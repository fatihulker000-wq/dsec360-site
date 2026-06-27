import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    success: true,
    status: "ok",
    service: "ibys-heartbeat",
    time: new Date().toISOString(),
  });
}