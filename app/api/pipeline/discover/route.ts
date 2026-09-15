import { NextResponse } from "next/server";
import { getUserInterests } from "@/lib/interests";
import { discoverArticlesForInterests } from "@/lib/discovery";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || "00000000-0000-0000-0000-000000000001";
    const interestsList = await getUserInterests(userId);
    const discovered = await discoverArticlesForInterests(interestsList);

    return NextResponse.json({ count: discovered.length, articles: discovered });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
