import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

// WHOOP API Types
interface WhoopPaginatedResponse<T> {
  records: T[];
  next_token?: string;
}

interface WhoopUserProfile {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface WhoopBodyMeasurement {
  height_meter: number;
  weight_kilogram: number;
  max_heart_rate: number;
}

interface WhoopCycleScore {
  strain: number;
  kilojoule: number;
  average_heart_rate: number;
  max_heart_rate: number;
}

interface WhoopCycle {
  id: number;
  user_id: number;
  start: string;
  end?: string;
  timezone_offset: string;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: WhoopCycleScore;
}

interface WhoopRecoveryScore {
  user_calibrating: boolean;
  recovery_score: number;
  resting_heart_rate: number;
  hrv_rmssd_milli: number;
  spo2_percentage?: number;
  skin_temp_celsius?: number;
}

interface WhoopRecovery {
  cycle_id: number;
  sleep_id: string;
  user_id: number;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: WhoopRecoveryScore;
}

interface WhoopSleepScore {
  stage_summary: {
    total_in_bed_time_milli: number;
    total_awake_time_milli: number;
    total_no_data_time_milli: number;
    total_light_sleep_time_milli: number;
    total_slow_wave_sleep_time_milli: number;
    total_rem_sleep_time_milli: number;
    sleep_cycle_count: number;
    disturbance_count: number;
  };
  sleep_needed: {
    baseline_milli: number;
    need_from_sleep_debt_milli: number;
    need_from_recent_strain_milli: number;
    need_from_recent_nap_milli: number;
  };
  respiratory_rate: number;
  sleep_performance_percentage: number;
  sleep_consistency_percentage: number;
  sleep_efficiency_percentage: number;
}

interface WhoopSleep {
  id: string;
  user_id: number;
  start: string;
  end?: string;
  timezone_offset: string;
  nap: boolean;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: WhoopSleepScore;
}

interface WhoopWorkoutScore {
  strain: number;
  average_heart_rate: number;
  max_heart_rate: number;
  kilojoule: number;
  percent_recorded: number;
  distance_meter?: number;
  altitude_gain_meter?: number;
  zone_duration: {
    zone_zero_milli: number;
    zone_one_milli: number;
    zone_two_milli: number;
    zone_three_milli: number;
    zone_four_milli: number;
    zone_five_milli: number;
  };
}

interface WhoopWorkout {
  id: string;
  user_id: number;
  start: string;
  end?: string;
  timezone_offset: string;
  sport_id: number;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: WhoopWorkoutScore;
}

// Sport ID mapping
const WHOOP_SPORTS: Record<number, string> = {
  0: "Running",
  1: "Cycling",
  16: "Baseball",
  17: "Basketball",
  33: "Swimming",
  34: "Tennis",
  43: "Pilates",
  44: "Yoga",
  45: "Weightlifting",
  48: "Functional Fitness",
  52: "Hiking",
  56: "Martial Arts",
  66: "CrossFit",
  70: "High Intensity Interval Training",
  71: "Spin",
  73: "Jogging",
  85: "Stretching",
  86: "Training",
  87: "Meditation",
  88: "Other",
};

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v1";
const WHOOP_AUTH_BASE = "https://api.prod.whoop.com/oauth/oauth2";

// Internal query to get tokens
export const getTokens = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", "whoop"))
      .first();

    if (!integration) return null;

    return {
      accessToken: integration.accessToken,
      refreshToken: integration.refreshToken,
      expiresAt: integration.expiresAt,
    };
  },
});

// Internal mutation to update tokens
export const updateTokensInternal = internalMutation({
  args: {
    userId: v.id("users"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrations")
      .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", "whoop"))
      .first();

    if (integration) {
      await ctx.db.patch(integration._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken ?? integration.refreshToken,
        expiresAt: args.expiresAt,
        updatedAt: Date.now(),
      });
    }
  },
});

// Internal mutation to upsert profile
export const upsertProfile = internalMutation({
  args: {
    userId: v.id("users"),
    whoopUserId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    heightMeter: v.optional(v.string()),
    weightKilogram: v.optional(v.string()),
    maxHeartRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("whoopProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        whoopUserId: args.whoopUserId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        heightMeter: args.heightMeter,
        weightKilogram: args.weightKilogram,
        maxHeartRate: args.maxHeartRate,
        lastSyncedAt: now,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("whoopProfiles", {
      userId: args.userId,
      whoopUserId: args.whoopUserId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      heightMeter: args.heightMeter,
      weightKilogram: args.weightKilogram,
      maxHeartRate: args.maxHeartRate,
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal mutation to upsert cycle
export const upsertCycle = internalMutation({
  args: {
    userId: v.id("users"),
    whoopUserId: v.string(),
    start: v.number(),
    end: v.optional(v.number()),
    timezoneOffset: v.optional(v.string()),
    scoreState: v.string(),
    strain: v.optional(v.string()),
    kilojoule: v.optional(v.string()),
    averageHeartRate: v.optional(v.number()),
    maxHeartRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("whoopCycles")
      .withIndex("by_user_start", (q) => q.eq("userId", args.userId).eq("start", args.start))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        end: args.end,
        timezoneOffset: args.timezoneOffset,
        scoreState: args.scoreState,
        strain: args.strain,
        kilojoule: args.kilojoule,
        averageHeartRate: args.averageHeartRate,
        maxHeartRate: args.maxHeartRate,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("whoopCycles", {
      userId: args.userId,
      whoopUserId: args.whoopUserId,
      start: args.start,
      end: args.end,
      timezoneOffset: args.timezoneOffset,
      scoreState: args.scoreState,
      strain: args.strain,
      kilojoule: args.kilojoule,
      averageHeartRate: args.averageHeartRate,
      maxHeartRate: args.maxHeartRate,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal query to get cycle by start time
export const getCycleByStart = internalQuery({
  args: { userId: v.id("users"), start: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("whoopCycles")
      .withIndex("by_user_start", (q) => q.eq("userId", args.userId).eq("start", args.start))
      .first();
  },
});

// Internal mutation to upsert recovery
export const upsertRecovery = internalMutation({
  args: {
    userId: v.id("users"),
    cycleId: v.id("whoopCycles"),
    sleepId: v.optional(v.string()),
    whoopUserId: v.string(),
    scoreState: v.string(),
    recoveryScore: v.optional(v.number()),
    restingHeartRate: v.optional(v.string()),
    hrvRmssd: v.optional(v.string()),
    spo2Percentage: v.optional(v.string()),
    skinTempCelsius: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("whoopRecovery")
      .withIndex("by_cycle", (q) => q.eq("cycleId", args.cycleId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        sleepId: args.sleepId,
        scoreState: args.scoreState,
        recoveryScore: args.recoveryScore,
        restingHeartRate: args.restingHeartRate,
        hrvRmssd: args.hrvRmssd,
        spo2Percentage: args.spo2Percentage,
        skinTempCelsius: args.skinTempCelsius,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("whoopRecovery", {
      userId: args.userId,
      cycleId: args.cycleId,
      sleepId: args.sleepId,
      whoopUserId: args.whoopUserId,
      scoreState: args.scoreState,
      recoveryScore: args.recoveryScore,
      restingHeartRate: args.restingHeartRate,
      hrvRmssd: args.hrvRmssd,
      spo2Percentage: args.spo2Percentage,
      skinTempCelsius: args.skinTempCelsius,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal mutation to upsert sleep
export const upsertSleep = internalMutation({
  args: {
    userId: v.id("users"),
    whoopUserId: v.string(),
    cycleId: v.optional(v.id("whoopCycles")),
    start: v.number(),
    end: v.optional(v.number()),
    timezoneOffset: v.optional(v.string()),
    isNap: v.optional(v.boolean()),
    scoreState: v.string(),
    totalInBedTime: v.optional(v.number()),
    totalAwakeTime: v.optional(v.number()),
    totalNoDataTime: v.optional(v.number()),
    totalLightSleepTime: v.optional(v.number()),
    totalSlowWaveSleepTime: v.optional(v.number()),
    totalRemSleepTime: v.optional(v.number()),
    sleepCycleCount: v.optional(v.number()),
    disturbanceCount: v.optional(v.number()),
    sleepNeeded: v.optional(v.number()),
    respiratoryRate: v.optional(v.string()),
    sleepPerformancePercentage: v.optional(v.string()),
    sleepConsistencyPercentage: v.optional(v.string()),
    sleepEfficiencyPercentage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("whoopSleep")
      .withIndex("by_user_start", (q) => q.eq("userId", args.userId).eq("start", args.start))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        end: args.end,
        cycleId: args.cycleId ?? existing.cycleId,
        timezoneOffset: args.timezoneOffset,
        isNap: args.isNap,
        scoreState: args.scoreState,
        totalInBedTime: args.totalInBedTime,
        totalAwakeTime: args.totalAwakeTime,
        totalNoDataTime: args.totalNoDataTime,
        totalLightSleepTime: args.totalLightSleepTime,
        totalSlowWaveSleepTime: args.totalSlowWaveSleepTime,
        totalRemSleepTime: args.totalRemSleepTime,
        sleepCycleCount: args.sleepCycleCount,
        disturbanceCount: args.disturbanceCount,
        sleepNeeded: args.sleepNeeded,
        respiratoryRate: args.respiratoryRate,
        sleepPerformancePercentage: args.sleepPerformancePercentage,
        sleepConsistencyPercentage: args.sleepConsistencyPercentage,
        sleepEfficiencyPercentage: args.sleepEfficiencyPercentage,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("whoopSleep", {
      userId: args.userId,
      whoopUserId: args.whoopUserId,
      cycleId: args.cycleId,
      start: args.start,
      end: args.end,
      timezoneOffset: args.timezoneOffset,
      isNap: args.isNap,
      scoreState: args.scoreState,
      totalInBedTime: args.totalInBedTime,
      totalAwakeTime: args.totalAwakeTime,
      totalNoDataTime: args.totalNoDataTime,
      totalLightSleepTime: args.totalLightSleepTime,
      totalSlowWaveSleepTime: args.totalSlowWaveSleepTime,
      totalRemSleepTime: args.totalRemSleepTime,
      sleepCycleCount: args.sleepCycleCount,
      disturbanceCount: args.disturbanceCount,
      sleepNeeded: args.sleepNeeded,
      respiratoryRate: args.respiratoryRate,
      sleepPerformancePercentage: args.sleepPerformancePercentage,
      sleepConsistencyPercentage: args.sleepConsistencyPercentage,
      sleepEfficiencyPercentage: args.sleepEfficiencyPercentage,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal mutation to upsert workout
export const upsertWorkout = internalMutation({
  args: {
    userId: v.id("users"),
    whoopUserId: v.string(),
    start: v.number(),
    end: v.optional(v.number()),
    timezoneOffset: v.optional(v.string()),
    sportId: v.optional(v.number()),
    sportName: v.optional(v.string()),
    scoreState: v.string(),
    strain: v.optional(v.string()),
    averageHeartRate: v.optional(v.number()),
    maxHeartRate: v.optional(v.number()),
    kilojoule: v.optional(v.string()),
    distanceMeters: v.optional(v.string()),
    altitudeGainMeters: v.optional(v.string()),
    altitudeLossMeters: v.optional(v.string()),
    zoneZeroMs: v.optional(v.number()),
    zoneOneMs: v.optional(v.number()),
    zoneTwoMs: v.optional(v.number()),
    zoneThreeMs: v.optional(v.number()),
    zoneFourMs: v.optional(v.number()),
    zoneFiveMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("whoopWorkouts")
      .withIndex("by_user_start", (q) => q.eq("userId", args.userId).eq("start", args.start))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        end: args.end,
        timezoneOffset: args.timezoneOffset,
        sportId: args.sportId,
        sportName: args.sportName,
        scoreState: args.scoreState,
        strain: args.strain,
        averageHeartRate: args.averageHeartRate,
        maxHeartRate: args.maxHeartRate,
        kilojoule: args.kilojoule,
        distanceMeters: args.distanceMeters,
        altitudeGainMeters: args.altitudeGainMeters,
        altitudeLossMeters: args.altitudeLossMeters,
        zoneZeroMs: args.zoneZeroMs,
        zoneOneMs: args.zoneOneMs,
        zoneTwoMs: args.zoneTwoMs,
        zoneThreeMs: args.zoneThreeMs,
        zoneFourMs: args.zoneFourMs,
        zoneFiveMs: args.zoneFiveMs,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("whoopWorkouts", {
      userId: args.userId,
      whoopUserId: args.whoopUserId,
      start: args.start,
      end: args.end,
      timezoneOffset: args.timezoneOffset,
      sportId: args.sportId,
      sportName: args.sportName,
      scoreState: args.scoreState,
      strain: args.strain,
      averageHeartRate: args.averageHeartRate,
      maxHeartRate: args.maxHeartRate,
      kilojoule: args.kilojoule,
      distanceMeters: args.distanceMeters,
      altitudeGainMeters: args.altitudeGainMeters,
      altitudeLossMeters: args.altitudeLossMeters,
      zoneZeroMs: args.zoneZeroMs,
      zoneOneMs: args.zoneOneMs,
      zoneTwoMs: args.zoneTwoMs,
      zoneThreeMs: args.zoneThreeMs,
      zoneFourMs: args.zoneFourMs,
      zoneFiveMs: args.zoneFiveMs,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Internal mutation to log sync
export const logSyncInternal = internalMutation({
  args: {
    userId: v.id("users"),
    provider: v.string(),
    status: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("syncLogs", {
      userId: args.userId,
      provider: args.provider,
      status: args.status,
      message: args.message,
      createdAt: Date.now(),
    });
  },
});

// Helper to refresh token if needed
async function getValidAccessToken(
  ctx: any,
  userId: Id<"users">,
  tokens: {
    accessToken: string;
    refreshToken?: string | null;
    expiresAt?: number | null;
  },
): Promise<string> {
  if (tokens.expiresAt && tokens.refreshToken) {
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    if (tokens.expiresAt < fiveMinutesFromNow) {
      const clientId = process.env.WHOOP_CLIENT_ID;
      const clientSecret = process.env.WHOOP_CLIENT_SECRET;

      const response = await fetch(`${WHOOP_AUTH_BASE}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokens.refreshToken,
          client_id: clientId!,
          client_secret: clientSecret!,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh WHOOP access token");
      }

      const newTokens = await response.json();
      const expiresAt = Date.now() + newTokens.expires_in * 1000;

      await ctx.runMutation(internal.whoop.updateTokensInternal, {
        userId,
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token,
        expiresAt,
      });

      return newTokens.access_token;
    }
  }

  return tokens.accessToken;
}

// Helper to make WHOOP API requests
async function whoopFetch<T>(accessToken: string, endpoint: string): Promise<T> {
  const response = await fetch(`${WHOOP_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WHOOP API error (${response.status}): ${error}`);
  }

  return response.json();
}

// Helper to paginate through all records
async function whoopFetchAll<T>(
  accessToken: string,
  endpoint: string,
  params?: Record<string, string>,
): Promise<T[]> {
  const allRecords: T[] = [];
  let nextToken: string | undefined;

  do {
    const searchParams = new URLSearchParams(params);
    if (nextToken) {
      searchParams.set("nextToken", nextToken);
    }

    const url = `${WHOOP_API_BASE}${endpoint}?${searchParams.toString()}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WHOOP API error (${response.status}): ${error}`);
    }

    const data: WhoopPaginatedResponse<T> = await response.json();
    allRecords.push(...data.records);
    nextToken = data.next_token;
  } while (nextToken);

  return allRecords;
}

/**
 * Sync WHOOP profile
 */
export const syncProfile = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const tokens = await ctx.runQuery(internal.whoop.getTokens, {
      userId: args.userId,
    });
    if (!tokens) {
      throw new Error("No WHOOP integration found");
    }

    const accessToken = await getValidAccessToken(ctx, args.userId, tokens);

    // Fetch profile and body measurements
    const [profile, body] = await Promise.all([
      whoopFetch<WhoopUserProfile>(accessToken, "/user/profile/basic"),
      whoopFetch<WhoopBodyMeasurement>(accessToken, "/user/measurement/body"),
    ]);

    await ctx.runMutation(internal.whoop.upsertProfile, {
      userId: args.userId,
      whoopUserId: String(profile.user_id),
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      heightMeter: String(body.height_meter),
      weightKilogram: String(body.weight_kilogram),
      maxHeartRate: body.max_heart_rate,
    });

    return { whoopUserId: profile.user_id };
  },
});

/**
 * Sync WHOOP cycles (daily strain data)
 */
export const syncCycles = action({
  args: {
    userId: v.id("users"),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.runQuery(internal.whoop.getTokens, {
      userId: args.userId,
    });
    if (!tokens) {
      throw new Error("No WHOOP integration found");
    }

    const accessToken = await getValidAccessToken(ctx, args.userId, tokens);

    // Default to 30 days
    const daysBack = args.daysBack ?? 30;
    const start = new Date();
    start.setDate(start.getDate() - daysBack);

    const cycles = await whoopFetchAll<WhoopCycle>(accessToken, "/cycle", {
      start: start.toISOString(),
    });

    let synced = 0;
    for (const cycle of cycles) {
      await ctx.runMutation(internal.whoop.upsertCycle, {
        userId: args.userId,
        whoopUserId: String(cycle.user_id),
        start: new Date(cycle.start).getTime(),
        end: cycle.end ? new Date(cycle.end).getTime() : undefined,
        timezoneOffset: cycle.timezone_offset,
        scoreState: cycle.score_state,
        strain: cycle.score?.strain?.toString(),
        kilojoule: cycle.score?.kilojoule?.toString(),
        averageHeartRate: cycle.score?.average_heart_rate,
        maxHeartRate: cycle.score?.max_heart_rate,
      });
      synced++;
    }

    await ctx.runMutation(internal.whoop.logSyncInternal, {
      userId: args.userId,
      provider: "whoop",
      status: "success",
      message: `Synced ${synced} cycles`,
    });

    return { synced };
  },
});

/**
 * Sync WHOOP recovery data
 */
export const syncRecovery = action({
  args: {
    userId: v.id("users"),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.runQuery(internal.whoop.getTokens, {
      userId: args.userId,
    });
    if (!tokens) {
      throw new Error("No WHOOP integration found");
    }

    const accessToken = await getValidAccessToken(ctx, args.userId, tokens);

    const daysBack = args.daysBack ?? 30;
    const start = new Date();
    start.setDate(start.getDate() - daysBack);

    const recoveries = await whoopFetchAll<WhoopRecovery>(accessToken, "/recovery", {
      start: start.toISOString(),
    });

    let synced = 0;
    for (const recovery of recoveries) {
      // We need to find the cycle for this recovery
      // WHOOP recovery is tied to a cycle via cycle_id
      // First fetch the cycle to get its start time
      try {
        const cycle = await whoopFetch<WhoopCycle>(accessToken, `/cycle/${recovery.cycle_id}`);
        const cycleStart = new Date(cycle.start).getTime();

        const cycleRecord = await ctx.runQuery(internal.whoop.getCycleByStart, {
          userId: args.userId,
          start: cycleStart,
        });

        if (cycleRecord) {
          await ctx.runMutation(internal.whoop.upsertRecovery, {
            userId: args.userId,
            cycleId: cycleRecord._id,
            sleepId: recovery.sleep_id,
            whoopUserId: String(recovery.user_id),
            scoreState: recovery.score_state,
            recoveryScore: recovery.score?.recovery_score,
            restingHeartRate: recovery.score?.resting_heart_rate?.toString(),
            hrvRmssd: recovery.score?.hrv_rmssd_milli?.toString(),
            spo2Percentage: recovery.score?.spo2_percentage?.toString(),
            skinTempCelsius: recovery.score?.skin_temp_celsius?.toString(),
          });
          synced++;
        }
      } catch {
        // Skip if cycle not found
      }
    }

    await ctx.runMutation(internal.whoop.logSyncInternal, {
      userId: args.userId,
      provider: "whoop",
      status: "success",
      message: `Synced ${synced} recovery records`,
    });

    return { synced };
  },
});

/**
 * Sync WHOOP sleep data
 */
export const syncSleep = action({
  args: {
    userId: v.id("users"),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.runQuery(internal.whoop.getTokens, {
      userId: args.userId,
    });
    if (!tokens) {
      throw new Error("No WHOOP integration found");
    }

    const accessToken = await getValidAccessToken(ctx, args.userId, tokens);

    const daysBack = args.daysBack ?? 30;
    const start = new Date();
    start.setDate(start.getDate() - daysBack);

    const sleeps = await whoopFetchAll<WhoopSleep>(accessToken, "/activity/sleep", {
      start: start.toISOString(),
    });

    let synced = 0;
    for (const sleep of sleeps) {
      const sleepNeeded = sleep.score?.sleep_needed
        ? sleep.score.sleep_needed.baseline_milli +
          sleep.score.sleep_needed.need_from_sleep_debt_milli +
          sleep.score.sleep_needed.need_from_recent_strain_milli -
          sleep.score.sleep_needed.need_from_recent_nap_milli
        : undefined;

      await ctx.runMutation(internal.whoop.upsertSleep, {
        userId: args.userId,
        whoopUserId: String(sleep.user_id),
        start: new Date(sleep.start).getTime(),
        end: sleep.end ? new Date(sleep.end).getTime() : undefined,
        timezoneOffset: sleep.timezone_offset,
        isNap: sleep.nap,
        scoreState: sleep.score_state,
        totalInBedTime: sleep.score?.stage_summary?.total_in_bed_time_milli,
        totalAwakeTime: sleep.score?.stage_summary?.total_awake_time_milli,
        totalNoDataTime: sleep.score?.stage_summary?.total_no_data_time_milli,
        totalLightSleepTime: sleep.score?.stage_summary?.total_light_sleep_time_milli,
        totalSlowWaveSleepTime: sleep.score?.stage_summary?.total_slow_wave_sleep_time_milli,
        totalRemSleepTime: sleep.score?.stage_summary?.total_rem_sleep_time_milli,
        sleepCycleCount: sleep.score?.stage_summary?.sleep_cycle_count,
        disturbanceCount: sleep.score?.stage_summary?.disturbance_count,
        sleepNeeded,
        respiratoryRate: sleep.score?.respiratory_rate?.toString(),
        sleepPerformancePercentage: sleep.score?.sleep_performance_percentage?.toString(),
        sleepConsistencyPercentage: sleep.score?.sleep_consistency_percentage?.toString(),
        sleepEfficiencyPercentage: sleep.score?.sleep_efficiency_percentage?.toString(),
      });
      synced++;
    }

    await ctx.runMutation(internal.whoop.logSyncInternal, {
      userId: args.userId,
      provider: "whoop",
      status: "success",
      message: `Synced ${synced} sleep records`,
    });

    return { synced };
  },
});

/**
 * Sync WHOOP workouts
 */
export const syncWorkouts = action({
  args: {
    userId: v.id("users"),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.runQuery(internal.whoop.getTokens, {
      userId: args.userId,
    });
    if (!tokens) {
      throw new Error("No WHOOP integration found");
    }

    const accessToken = await getValidAccessToken(ctx, args.userId, tokens);

    const daysBack = args.daysBack ?? 30;
    const start = new Date();
    start.setDate(start.getDate() - daysBack);

    const workouts = await whoopFetchAll<WhoopWorkout>(accessToken, "/activity/workout", {
      start: start.toISOString(),
    });

    let synced = 0;
    for (const workout of workouts) {
      await ctx.runMutation(internal.whoop.upsertWorkout, {
        userId: args.userId,
        whoopUserId: String(workout.user_id),
        start: new Date(workout.start).getTime(),
        end: workout.end ? new Date(workout.end).getTime() : undefined,
        timezoneOffset: workout.timezone_offset,
        sportId: workout.sport_id,
        sportName: WHOOP_SPORTS[workout.sport_id] ?? `Sport ${workout.sport_id}`,
        scoreState: workout.score_state,
        strain: workout.score?.strain?.toString(),
        averageHeartRate: workout.score?.average_heart_rate,
        maxHeartRate: workout.score?.max_heart_rate,
        kilojoule: workout.score?.kilojoule?.toString(),
        distanceMeters: workout.score?.distance_meter?.toString(),
        altitudeGainMeters: workout.score?.altitude_gain_meter?.toString(),
        zoneZeroMs: workout.score?.zone_duration?.zone_zero_milli,
        zoneOneMs: workout.score?.zone_duration?.zone_one_milli,
        zoneTwoMs: workout.score?.zone_duration?.zone_two_milli,
        zoneThreeMs: workout.score?.zone_duration?.zone_three_milli,
        zoneFourMs: workout.score?.zone_duration?.zone_four_milli,
        zoneFiveMs: workout.score?.zone_duration?.zone_five_milli,
      });
      synced++;
    }

    await ctx.runMutation(internal.whoop.logSyncInternal, {
      userId: args.userId,
      provider: "whoop",
      status: "success",
      message: `Synced ${synced} workouts`,
    });

    return { synced };
  },
});

/**
 * Full sync of all WHOOP data
 */
export const fullSync = action({
  args: {
    userId: v.id("users"),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack ?? 30;

    // Sync profile first
    const profile = await ctx.runAction(internal.whoop.syncProfile, {
      userId: args.userId,
    });

    // Then sync all data types in parallel
    const [cycles, recovery, sleep, workouts] = await Promise.all([
      ctx.runAction(internal.whoop.syncCycles, {
        userId: args.userId,
        daysBack,
      }),
      ctx.runAction(internal.whoop.syncRecovery, {
        userId: args.userId,
        daysBack,
      }),
      ctx.runAction(internal.whoop.syncSleep, {
        userId: args.userId,
        daysBack,
      }),
      ctx.runAction(internal.whoop.syncWorkouts, {
        userId: args.userId,
        daysBack,
      }),
    ]);

    return {
      profile,
      cycles: cycles.synced,
      recovery: recovery.synced,
      sleep: sleep.synced,
      workouts: workouts.synced,
    };
  },
});

// Public queries for reading WHOOP data

/**
 * Get WHOOP profile
 */
export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("whoopProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
  },
});

/**
 * Get recent recovery data
 */
export const listRecovery = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = args.limit ?? 7;

    return await ctx.db
      .query("whoopRecovery")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get recent cycles
 */
export const listCycles = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = args.limit ?? 7;

    return await ctx.db
      .query("whoopCycles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get recent sleep data
 */
export const listSleep = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = args.limit ?? 7;

    return await ctx.db
      .query("whoopSleep")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get recent workouts
 */
export const listWorkouts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = args.limit ?? 14;

    return await ctx.db
      .query("whoopWorkouts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});
