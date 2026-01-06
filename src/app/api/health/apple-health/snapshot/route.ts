import { NextResponse } from "next/server";
import { appleHealthDb } from "@/db/apple-health";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

const DAYS = 15; // 14 days history + today

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function formatDateKey(date: Date | string) {
  if (typeof date === "string") return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function hasMeaningfulData(data: Record<string, unknown> | null) {
  if (!data) return false;
  const fields = [
    "steps",
    "activeEnergy",
    "exerciseMinutes",
    "standMinutes",
    "restingHeartRate",
    "hrvSDNN",
    "sleepHours",
  ] as const;

  return fields.some((field) => {
    const value = data[field];
    return typeof value === "number" && value > 0;
  });
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) throw unauthorized();

    const endDate = startOfDay(new Date());
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (DAYS - 1));

    const [rows, connection] = await Promise.all([
      appleHealthDb.getHealthDataRange(user.id, startDate, endDate),
      appleHealthDb.getConnection(user.id),
    ]);

    const byDate = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const key = formatDateKey(row.date);
      byDate.set(key, row);
    }

    const data = [];
    for (let i = 0; i < DAYS; i += 1) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      const key = formatDateKey(day);
      const row = byDate.get(key);
      data.push({
        date: key,
        steps: row?.steps ?? null,
        activeEnergy: row?.activeEnergy ?? null,
        basalEnergy: row?.basalEnergy ?? null,
        exerciseMinutes: row?.exerciseMinutes ?? null,
        standMinutes: row?.standMinutes ?? null,
        distanceMiles: row?.distanceMiles ?? null,
        flightsClimbed: row?.flightsClimbed ?? null,
        restingHeartRate: row?.restingHeartRate ?? null,
        hrvSDNN: row?.hrvSDNN ?? null,
        walkingHeartRate: row?.walkingHeartRate ?? null,
        vo2Max: row?.vo2Max ?? null,
        oxygenSaturation: row?.oxygenSaturation ?? null,
        respiratoryRate: row?.respiratoryRate ?? null,
        bodyWeight: row?.bodyWeight ?? null,
        bodyFatPercentage: row?.bodyFatPercentage ?? null,
        leanBodyMass: row?.leanBodyMass ?? null,
        sleepHours: row?.sleepHours ?? null,
        sleepStages:
          row &&
          (row.sleepAwakeHours || row.sleepRemHours || row.sleepCoreHours || row.sleepDeepHours)
            ? {
                awake: row.sleepAwakeHours ?? 0,
                rem: row.sleepRemHours ?? 0,
                core: row.sleepCoreHours ?? 0,
                deep: row.sleepDeepHours ?? 0,
                inBed: row.sleepInBedHours ?? 0,
              }
            : null,
      });
    }

    const today = data[data.length - 1];
    const history = data.slice(0, -1);
    const connected = Boolean(connection?.lastSyncAt) || hasMeaningfulData(today ?? null);

    return NextResponse.json({
      connected,
      lastSyncAt: connection?.lastSyncAt?.toISOString() ?? null,
      deviceId: connection?.deviceId ?? null,
      deviceName: connection?.deviceName ?? null,
      snapshot: {
        timestamp: new Date().toISOString(),
        today,
        history,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
