import { NextResponse } from "next/server";
import { appleHealthDb } from "@/db/apple-health";
import { handleApiError, unauthorized } from "@/lib/api/errors";
import { getUser } from "@/lib/auth";

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

    const connection = await appleHealthDb.getConnection(user.id);
    const latest = await appleHealthDb.getLatestHealthData(user.id);
    const connected = Boolean(connection?.lastSyncAt) || hasMeaningfulData(latest);

    return NextResponse.json({
      connected,
      lastSyncAt: connection?.lastSyncAt?.toISOString() ?? null,
      deviceId: connection?.deviceId ?? null,
      deviceName: connection?.deviceName ?? null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
