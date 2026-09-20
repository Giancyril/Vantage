/**
 * Audio Briefing Storage & Cache Engine
 * Manages database persistence and fast in-memory caching for executive podcasts.
 */

import { db, hasDatabase } from "@/lib/db";
import { audioBriefings } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { BriefingSegment } from "@/lib/audio-briefing";

export interface BriefingRecord {
  id: string;
  userId: string;
  digestId?: string | null;
  title: string;
  durationSeconds: number;
  audioUrl: string;
  script: string;
  voice: string;
  segments: BriefingSegment[];
  status: string;
  createdAt: string;
}

interface AudioBriefingRow {
  id: string;
  userId: string | null;
  digestId: string | null;
  title: string;
  durationSeconds: number;
  audioUrl: string | null;
  script: string;
  voice: string;
  segments: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-Memory fallback store
const inMemoryBriefings = new Map<string, BriefingRecord>();

function generateId(): string {
  return `briefing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function saveAudioBriefing(data: {
  userId: string;
  digestId?: string;
  title: string;
  durationSeconds: number;
  audioUrl: string;
  script: string;
  voice?: string;
  segments: BriefingSegment[];
  status?: string;
}): Promise<BriefingRecord> {
  const id = generateId();
  const record: BriefingRecord = {
    id,
    userId: data.userId,
    digestId: data.digestId || null,
    title: data.title,
    durationSeconds: data.durationSeconds,
    audioUrl: data.audioUrl,
    script: data.script,
    voice: data.voice || "alloy",
    segments: data.segments,
    status: data.status || "ready",
    createdAt: new Date().toISOString(),
  };

  if (hasDatabase) {
    try {
      const [inserted] = await db
        .insert(audioBriefings)
        .values({
          userId: data.userId,
          digestId: data.digestId,
          title: data.title,
          durationSeconds: data.durationSeconds,
          audioUrl: data.audioUrl,
          script: data.script,
          voice: record.voice,
          segments: data.segments as unknown as Record<string, unknown>,
          status: record.status,
        })
        .returning();

      if (inserted) {
        record.id = inserted.id;
        record.createdAt = inserted.createdAt.toISOString();
      }
    } catch (e) {
      console.warn("DB saveAudioBriefing failed, using in-memory:", e);
    }
  }

  inMemoryBriefings.set(record.id, record);
  return record;
}

export async function getAudioBriefing(
  id: string,
  userId: string
): Promise<BriefingRecord | null> {
  const mem = inMemoryBriefings.get(id);
  if (mem && mem.userId === userId) return mem;

  if (!hasDatabase) return null;

  try {
    const [row] = await db
      .select()
      .from(audioBriefings)
      .where(and(eq(audioBriefings.id, id), eq(audioBriefings.userId, userId)))
      .limit(1);

    if (!row) return null;

    const record: BriefingRecord = mapRowToRecord(row as AudioBriefingRow);
    inMemoryBriefings.set(record.id, record);
    return record;
  } catch (e) {
    console.warn("DB getAudioBriefing failed:", e);
    return mem || null;
  }
}

export async function getLatestAudioBriefing(userId: string): Promise<BriefingRecord | null> {
  const memList = Array.from(inMemoryBriefings.values())
    .filter((b) => b.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!hasDatabase) {
    return memList[0] || null;
  }

  try {
    const [row] = await db
      .select()
      .from(audioBriefings)
      .where(eq(audioBriefings.userId, userId))
      .orderBy(desc(audioBriefings.createdAt))
      .limit(1);

    if (!row) {
      return memList[0] || null;
    }

    return mapRowToRecord(row as AudioBriefingRow);
  } catch (e) {
    console.warn("DB getLatestAudioBriefing failed:", e);
    return memList[0] || null;
  }
}

export async function listAudioBriefings(
  userId: string,
  limit = 10
): Promise<BriefingRecord[]> {
  const memList = Array.from(inMemoryBriefings.values())
    .filter((b) => b.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  if (!hasDatabase) return memList;

  try {
    const rows = await db
      .select()
      .from(audioBriefings)
      .where(eq(audioBriefings.userId, userId))
      .orderBy(desc(audioBriefings.createdAt))
      .limit(limit);

    if (rows.length === 0) return memList;

    return rows.map((r) => mapRowToRecord(r as AudioBriefingRow));
  } catch (e) {
    console.warn("DB listAudioBriefings failed:", e);
    return memList;
  }
}

export async function deleteAudioBriefing(id: string, userId: string): Promise<boolean> {
  inMemoryBriefings.delete(id);

  if (hasDatabase) {
    try {
      await db
        .delete(audioBriefings)
        .where(and(eq(audioBriefings.id, id), eq(audioBriefings.userId, userId)));
      return true;
    } catch (e) {
      console.warn("DB deleteAudioBriefing failed:", e);
      return false;
    }
  }
  return true;
}

function mapRowToRecord(row: AudioBriefingRow): BriefingRecord {
  return {
    id: row.id,
    userId: row.userId || "",
    digestId: row.digestId,
    title: row.title,
    durationSeconds: row.durationSeconds,
    audioUrl: row.audioUrl || "",
    script: row.script,
    voice: row.voice,
    segments: (row.segments as BriefingSegment[]) || [],
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
