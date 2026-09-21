import { NextResponse } from "next/server";
import { snapshotAnalytics } from "@/lib/analytics";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST() {
  try {
    const userId = DEFAULT_USER_ID;
    const snapshot = await snapshotAnalytics(userId);
    return NextResponse.json({ success: true, snapshot });
  } catch (err) {
    console.error("POST /api/analytics/snapshot error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create analytics snapshot" },
      { status: 500 }
    );
  }
}
