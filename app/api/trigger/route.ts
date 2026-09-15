import { NextResponse } from "next/server";
import { runDailyDigestPipeline } from "@/jobs/daily-digest";
import { runReweightJob } from "@/jobs/reweight-interests";

// Webhook endpoint for external cron or Trigger.dev triggers
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const task = searchParams.get("task") || "digest";

  if (task === "reweight") {
    const result = await runReweightJob();
    return NextResponse.json({ success: true, task: "reweight", result });
  }

  const report = await runDailyDigestPipeline();
  return NextResponse.json({ success: true, task: "digest", report });
}
