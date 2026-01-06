import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "./index";
import {
  type NewAppleHealthConnection,
  type NewAppleHealthData,
  appleHealthConnections,
  appleHealthData,
} from "./schema";

export const appleHealthDb = {
  async upsertConnection(data: NewAppleHealthConnection) {
    const result = await db
      .insert(appleHealthConnections)
      .values(data)
      .onConflictDoUpdate({
        target: appleHealthConnections.userId,
        set: {
          deviceId: data.deviceId,
          deviceName: data.deviceName,
          lastSyncAt: data.lastSyncAt,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  },

  async upsertHealthData(data: NewAppleHealthData) {
    const result = await db
      .insert(appleHealthData)
      .values(data)
      .onConflictDoUpdate({
        target: [appleHealthData.userId, appleHealthData.date],
        set: {
          steps: data.steps,
          activeEnergy: data.activeEnergy,
          basalEnergy: data.basalEnergy,
          exerciseMinutes: data.exerciseMinutes,
          standMinutes: data.standMinutes,
          distanceMiles: data.distanceMiles,
          flightsClimbed: data.flightsClimbed,
          restingHeartRate: data.restingHeartRate,
          hrvSDNN: data.hrvSDNN,
          walkingHeartRate: data.walkingHeartRate,
          vo2Max: data.vo2Max,
          oxygenSaturation: data.oxygenSaturation,
          respiratoryRate: data.respiratoryRate,
          bodyWeight: data.bodyWeight,
          bodyFatPercentage: data.bodyFatPercentage,
          leanBodyMass: data.leanBodyMass,
          sleepHours: data.sleepHours,
          sleepAwakeHours: data.sleepAwakeHours,
          sleepRemHours: data.sleepRemHours,
          sleepCoreHours: data.sleepCoreHours,
          sleepDeepHours: data.sleepDeepHours,
          sleepInBedHours: data.sleepInBedHours,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  },

  async getConnection(userId: string) {
    const result = await db
      .select()
      .from(appleHealthConnections)
      .where(eq(appleHealthConnections.userId, userId))
      .limit(1);
    return result[0] ?? null;
  },

  async getLatestHealthData(userId: string) {
    const result = await db
      .select()
      .from(appleHealthData)
      .where(eq(appleHealthData.userId, userId))
      .orderBy(desc(appleHealthData.date))
      .limit(1);
    return result[0] ?? null;
  },

  async getHealthDataRange(userId: string, startDate: Date, endDate: Date) {
    return db
      .select()
      .from(appleHealthData)
      .where(
        and(
          eq(appleHealthData.userId, userId),
          gte(appleHealthData.date, startDate),
          lte(appleHealthData.date, endDate),
        ),
      )
      .orderBy(appleHealthData.date);
  },
};
