import { NextResponse } from "next/server";
import { getClustersForUser, getInMemoryClusters } from "@/lib/clustering";
import { synthesizeCluster, getCachedSynthesis } from "@/lib/synthesis";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || DEFAULT_USER_ID;
    const forceSynthesize = searchParams.get("synthesize") === "true";

    const clusters = await getClustersForUser(userId);
    const inMem = getInMemoryClusters();
    const allClusters = [...clusters, ...inMem];

    const targetCluster = allClusters.find(
      (c) => c.id === id || c.clusterKey === id || c.clusterKey === decodeURIComponent(id)
    );

    if (!targetCluster) {
      return NextResponse.json({ error: "Story cluster not found" }, { status: 404 });
    }

    let synthesis = getCachedSynthesis(targetCluster.clusterKey);

    if (!synthesis || forceSynthesize) {
      synthesis = await synthesizeCluster(targetCluster, targetCluster.id);
    }

    return NextResponse.json({
      cluster: targetCluster,
      synthesis,
    });
  } catch (error) {
    console.error("Cluster detail error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve story cluster", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || DEFAULT_USER_ID;

    const clusters = await getClustersForUser(userId);
    const inMem = getInMemoryClusters();
    const allClusters = [...clusters, ...inMem];

    const targetCluster = allClusters.find(
      (c) => c.id === id || c.clusterKey === id || c.clusterKey === decodeURIComponent(id)
    );

    if (!targetCluster) {
      return NextResponse.json({ error: "Story cluster not found" }, { status: 404 });
    }

    const synthesis = await synthesizeCluster(targetCluster, targetCluster.id);

    return NextResponse.json({
      success: true,
      cluster: targetCluster,
      synthesis,
    });
  } catch (error) {
    console.error("Synthesis error:", error);
    return NextResponse.json(
      { error: "Failed to synthesize story cluster", details: String(error) },
      { status: 500 }
    );
  }
}
