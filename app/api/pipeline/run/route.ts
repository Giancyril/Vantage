import { NextResponse } from "next/server";
import { runDailyDigestPipeline } from "@/jobs/daily-digest";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || "00000000-0000-0000-0000-000000000001";
    const email = body.email || "reader@example.com";

    const report = await runDailyDigestPipeline(userId, email);
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("Pipeline execution failed:", error);
    return NextResponse.json({ error: error?.message || "Execution failed" }, { status: 500 });
  }
}
