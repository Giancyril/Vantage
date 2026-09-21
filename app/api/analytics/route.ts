import { NextResponse } from "next/server";
import { computeDailyMetrics } from "@/lib/analytics";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") ?? "30", 10);
    const userId = DEFAULT_USER_ID;

    const dashboard = await computeDailyMetrics(userId, days);

    return NextResponse.json({ success: true, data: dashboard });
  } catch (err) {
    console.error("GET /api/analytics error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to compute analytics" },
      { status: 500 }
    );
  }
}
