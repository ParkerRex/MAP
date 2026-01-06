import { NextResponse } from "next/server";
import { appleHealthDb } from "@/db/apple-health";
import { handleApiError, unauthorized, validationError } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

interface HealthSyncPayload {
  syncedAt?: string;
  deviceId?: string;
  healthData: Array<{
    date: string;
    steps?: number | null;
    activeEnergy?: number | null;
    basalEnergy?: number | null;
    exerciseMinutes?: number | null;
    standMinutes?: number | null;
    distanceMiles?: number | null;
    flightsClimbed?: number | null;
    restingHeartRate?: number | null;
    hrvSDNN?: number | null;
    walkingHeartRate?: number | null;
    vo2Max?: number | null;
    oxygenSaturation?: number | null;
    respiratoryRate?: number | null;
    bodyWeight?: number | null;
    bodyFatPercentage?: number | null;
    leanBodyMass?: number | null;
    sleepHours?: number | null;
    sleepStages?: {
      awake: number;
      rem: number;
      core: number;
      deep: number;
      inBed: number;
    } | null;
  }>;
}

function toNumber(value?: number | null) {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw validationError("Invalid date in health payload");
  }
  return parsed;
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) throw unauthorized();

    const payload = (await request.json()) as HealthSyncPayload;
    if (!payload?.healthData || !Array.isArray(payload.healthData)) {
      throw validationError("Invalid health sync payload");
    }

    const syncedAt = payload.syncedAt ? new Date(payload.syncedAt) : new Date();

    await appleHealthDb.upsertConnection({
      userId: user.id,
      deviceId: payload.deviceId ?? null,
      lastSyncAt: syncedAt,
    });

    let recordsProcessed = 0;

    for (const item of payload.healthData) {
      if (!item?.date) continue;
      const date = normalizeDate(item.date);
      await appleHealthDb.upsertHealthData({
        userId: user.id,
        date,
        steps: toNumber(item.steps),
        activeEnergy: toNumber(item.activeEnergy),
        basalEnergy: toNumber(item.basalEnergy),
        exerciseMinutes: toNumber(item.exerciseMinutes),
        standMinutes: toNumber(item.standMinutes),
        distanceMiles: toNumber(item.distanceMiles),
        flightsClimbed: toNumber(item.flightsClimbed),
        restingHeartRate: toNumber(item.restingHeartRate),
        hrvSDNN: toNumber(item.hrvSDNN),
        walkingHeartRate: toNumber(item.walkingHeartRate),
        vo2Max: toNumber(item.vo2Max),
        oxygenSaturation: toNumber(item.oxygenSaturation),
        respiratoryRate: toNumber(item.respiratoryRate),
        bodyWeight: toNumber(item.bodyWeight),
        bodyFatPercentage: toNumber(item.bodyFatPercentage),
        leanBodyMass: toNumber(item.leanBodyMass),
        sleepHours: toNumber(item.sleepHours),
        sleepAwakeHours: toNumber(item.sleepStages?.awake),
        sleepRemHours: toNumber(item.sleepStages?.rem),
        sleepCoreHours: toNumber(item.sleepStages?.core),
        sleepDeepHours: toNumber(item.sleepStages?.deep),
        sleepInBedHours: toNumber(item.sleepStages?.inBed),
      });
      recordsProcessed += 1;
    }

    return NextResponse.json({
      success: true,
      recordsProcessed,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
