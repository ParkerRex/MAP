import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "./index";
import {
  type NewWhoopCycle,
  type NewWhoopProfile,
  type NewWhoopRecovery,
  type NewWhoopSleep,
  type NewWhoopWorkout,
  whoopCycles,
  whoopProfiles,
  whoopRecovery,
  whoopSleep,
  whoopWorkouts,
} from "./schema";

export const whoopDb = {
  // Cycles
  async getCycles(userId: string, options?: { startDate?: Date; endDate?: Date; limit?: number }) {
    let query = db
      .select()
      .from(whoopCycles)
      .where(eq(whoopCycles.userId, userId))
      .orderBy(desc(whoopCycles.start));

    if (options?.startDate && options?.endDate) {
      query = db
        .select()
        .from(whoopCycles)
        .where(
          and(
            eq(whoopCycles.userId, userId),
            gte(whoopCycles.start, options.startDate),
            lte(whoopCycles.start, options.endDate),
          ),
        )
        .orderBy(desc(whoopCycles.start));
    }

    if (options?.limit) {
      return query.limit(options.limit);
    }

    return query;
  },

  async getCycleById(cycleId: string, userId: string) {
    const result = await db
      .select()
      .from(whoopCycles)
      .where(and(eq(whoopCycles.id, cycleId), eq(whoopCycles.userId, userId)))
      .limit(1);
    return result[0] ?? null;
  },

  async getLatestCycle(userId: string) {
    const result = await db
      .select()
      .from(whoopCycles)
      .where(eq(whoopCycles.userId, userId))
      .orderBy(desc(whoopCycles.start))
      .limit(1);
    return result[0] ?? null;
  },

  async upsertCycle(data: NewWhoopCycle) {
    const result = await db
      .insert(whoopCycles)
      .values(data)
      .onConflictDoUpdate({
        target: whoopCycles.id,
        set: {
          end: data.end,
          scoreState: data.scoreState,
          strain: data.strain,
          kilojoule: data.kilojoule,
          averageHeartRate: data.averageHeartRate,
          maxHeartRate: data.maxHeartRate,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  },

  // Recovery
  async getRecoveryByCycleId(cycleId: string, userId: string) {
    const result = await db
      .select()
      .from(whoopRecovery)
      .where(and(eq(whoopRecovery.cycleId, cycleId), eq(whoopRecovery.userId, userId)))
      .limit(1);
    return result[0] ?? null;
  },

  async getRecoveries(
    userId: string,
    options?: { startDate?: Date; endDate?: Date; limit?: number },
  ) {
    const cycles = await this.getCycles(userId, options);
    const cycleIds = cycles.map((c) => c.id);

    if (cycleIds.length === 0) return [];

    const recoveries = await db
      .select()
      .from(whoopRecovery)
      .where(eq(whoopRecovery.userId, userId))
      .orderBy(desc(whoopRecovery.createdAt));

    return recoveries.filter((r) => cycleIds.includes(r.cycleId));
  },

  async getLatestRecovery(userId: string) {
    const latestCycle = await this.getLatestCycle(userId);
    if (!latestCycle) return null;
    return this.getRecoveryByCycleId(latestCycle.id, userId);
  },

  async upsertRecovery(data: NewWhoopRecovery) {
    // Check if recovery exists for this cycle
    const existing = await db
      .select()
      .from(whoopRecovery)
      .where(eq(whoopRecovery.cycleId, data.cycleId))
      .limit(1);

    if (existing[0]) {
      const result = await db
        .update(whoopRecovery)
        .set({
          sleepId: data.sleepId,
          scoreState: data.scoreState,
          recoveryScore: data.recoveryScore,
          restingHeartRate: data.restingHeartRate,
          hrvRmssd: data.hrvRmssd,
          spo2Percentage: data.spo2Percentage,
          skinTempCelsius: data.skinTempCelsius,
          updatedAt: new Date(),
        })
        .where(eq(whoopRecovery.id, existing[0].id))
        .returning();
      return result[0];
    }

    const result = await db.insert(whoopRecovery).values(data).returning();
    return result[0];
  },

  // Sleep
  async getSleeps(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      includeNaps?: boolean;
    },
  ) {
    let baseConditions = [eq(whoopSleep.userId, userId)];

    if (options?.startDate && options?.endDate) {
      baseConditions = [
        ...baseConditions,
        gte(whoopSleep.start, options.startDate),
        lte(whoopSleep.start, options.endDate),
      ];
    }

    if (options?.includeNaps === false) {
      baseConditions = [...baseConditions, eq(whoopSleep.isNap, false)];
    }

    const query = db
      .select()
      .from(whoopSleep)
      .where(and(...baseConditions))
      .orderBy(desc(whoopSleep.start));

    if (options?.limit) {
      return query.limit(options.limit);
    }

    return query;
  },

  async getSleepById(sleepId: string, userId: string) {
    const result = await db
      .select()
      .from(whoopSleep)
      .where(and(eq(whoopSleep.id, sleepId), eq(whoopSleep.userId, userId)))
      .limit(1);
    return result[0] ?? null;
  },

  async getLatestSleep(userId: string) {
    const result = await db
      .select()
      .from(whoopSleep)
      .where(and(eq(whoopSleep.userId, userId), eq(whoopSleep.isNap, false)))
      .orderBy(desc(whoopSleep.start))
      .limit(1);
    return result[0] ?? null;
  },

  async upsertSleep(data: NewWhoopSleep) {
    const result = await db
      .insert(whoopSleep)
      .values(data)
      .onConflictDoUpdate({
        target: whoopSleep.id,
        set: {
          cycleId: data.cycleId,
          end: data.end,
          isNap: data.isNap,
          scoreState: data.scoreState,
          totalInBedTime: data.totalInBedTime,
          totalAwakeTime: data.totalAwakeTime,
          totalNoDataTime: data.totalNoDataTime,
          totalLightSleepTime: data.totalLightSleepTime,
          totalSlowWaveSleepTime: data.totalSlowWaveSleepTime,
          totalRemSleepTime: data.totalRemSleepTime,
          sleepCycleCount: data.sleepCycleCount,
          disturbanceCount: data.disturbanceCount,
          sleepNeeded: data.sleepNeeded,
          respiratoryRate: data.respiratoryRate,
          sleepPerformancePercentage: data.sleepPerformancePercentage,
          sleepConsistencyPercentage: data.sleepConsistencyPercentage,
          sleepEfficiencyPercentage: data.sleepEfficiencyPercentage,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  },

  // Workouts
  async getWorkouts(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      sportId?: number;
    },
  ) {
    let baseConditions = [eq(whoopWorkouts.userId, userId)];

    if (options?.startDate && options?.endDate) {
      baseConditions = [
        ...baseConditions,
        gte(whoopWorkouts.start, options.startDate),
        lte(whoopWorkouts.start, options.endDate),
      ];
    }

    if (options?.sportId !== undefined) {
      baseConditions = [...baseConditions, eq(whoopWorkouts.sportId, options.sportId)];
    }

    const query = db
      .select()
      .from(whoopWorkouts)
      .where(and(...baseConditions))
      .orderBy(desc(whoopWorkouts.start));

    if (options?.limit) {
      return query.limit(options.limit);
    }

    return query;
  },

  async getWorkoutById(workoutId: string, userId: string) {
    const result = await db
      .select()
      .from(whoopWorkouts)
      .where(and(eq(whoopWorkouts.id, workoutId), eq(whoopWorkouts.userId, userId)))
      .limit(1);
    return result[0] ?? null;
  },

  async upsertWorkout(data: NewWhoopWorkout) {
    const result = await db
      .insert(whoopWorkouts)
      .values(data)
      .onConflictDoUpdate({
        target: whoopWorkouts.id,
        set: {
          end: data.end,
          sportId: data.sportId,
          sportName: data.sportName,
          scoreState: data.scoreState,
          strain: data.strain,
          averageHeartRate: data.averageHeartRate,
          maxHeartRate: data.maxHeartRate,
          kilojoule: data.kilojoule,
          distanceMeters: data.distanceMeters,
          altitudeGainMeters: data.altitudeGainMeters,
          altitudeLossMeters: data.altitudeLossMeters,
          zoneZeroMs: data.zoneZeroMs,
          zoneOneMs: data.zoneOneMs,
          zoneTwoMs: data.zoneTwoMs,
          zoneThreeMs: data.zoneThreeMs,
          zoneFourMs: data.zoneFourMs,
          zoneFiveMs: data.zoneFiveMs,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  },

  // Profile
  async getProfile(userId: string) {
    const result = await db
      .select()
      .from(whoopProfiles)
      .where(eq(whoopProfiles.userId, userId))
      .limit(1);
    return result[0] ?? null;
  },

  async upsertProfile(data: NewWhoopProfile) {
    const result = await db
      .insert(whoopProfiles)
      .values(data)
      .onConflictDoUpdate({
        target: whoopProfiles.userId,
        set: {
          whoopUserId: data.whoopUserId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          heightMeter: data.heightMeter,
          weightKilogram: data.weightKilogram,
          maxHeartRate: data.maxHeartRate,
          lastSyncedAt: data.lastSyncedAt,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  },

  // Delete all WHOOP data for a user
  async deleteAllUserData(userId: string) {
    await db.delete(whoopRecovery).where(eq(whoopRecovery.userId, userId));
    await db.delete(whoopSleep).where(eq(whoopSleep.userId, userId));
    await db.delete(whoopWorkouts).where(eq(whoopWorkouts.userId, userId));
    await db.delete(whoopCycles).where(eq(whoopCycles.userId, userId));
    await db.delete(whoopProfiles).where(eq(whoopProfiles.userId, userId));
  },
};
