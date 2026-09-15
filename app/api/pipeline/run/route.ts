import { NextResponse } from "next/server";
import { runDailyDigestPipeline } from "@/jobs/daily-digest";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { userId?: string; email?: string };
    const userId = body.userId || "00000000-0000-0000-0000-000000000001";
    const email = body.email || "reader@example.com";

    const report = await runDailyDigestPipeline(userId, email);
    return NextResponse.json({ success: true, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution failed";
    console.error("Pipeline execution failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
