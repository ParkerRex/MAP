import { calendarDb } from "@/db/calendar";
import { getUser } from "@/lib/auth";

// WHOOP API v2 Base URL
const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v1";
const WHOOP_AUTH_BASE = "https://api.prod.whoop.com/oauth/oauth2";

// WHOOP OAuth Scopes
export const WHOOP_SCOPES = [
  "read:profile",
  "read:body_measurement",
  "read:cycles",
  "read:recovery",
  "read:sleep",
  "read:workout",
  "offline", // Required for refresh tokens
] as const;

// WHOOP API Types
export interface WhoopPaginatedResponse<T> {
  records: T[];
  next_token?: string;
}

export interface WhoopUserProfile {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface WhoopBodyMeasurement {
  height_meter: number;
  weight_kilogram: number;
  max_heart_rate: number;
}

export interface WhoopCycleScore {
  strain: number;
  kilojoule: number;
  average_heart_rate: number;
  max_heart_rate: number;
}

export interface WhoopCycle {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end?: string;
  timezone_offset: string;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: WhoopCycleScore;
}

export interface WhoopRecoveryScore {
  user_calibrating: boolean;
  recovery_score: number;
  resting_heart_rate: number;
  hrv_rmssd_milli: number;
  spo2_percentage?: number;
  skin_temp_celsius?: number;
}

export interface WhoopRecovery {
  cycle_id: number;
  sleep_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: WhoopRecoveryScore;
}

export interface WhoopSleepStagesSummary {
  total_in_bed_time_milli: number;
  total_awake_time_milli: number;
  total_no_data_time_milli: number;
  total_light_sleep_time_milli: number;
  total_slow_wave_sleep_time_milli: number;
  total_rem_sleep_time_milli: number;
  sleep_cycle_count: number;
  disturbance_count: number;
}

export interface WhoopSleepNeeded {
  baseline_milli: number;
  need_from_sleep_debt_milli: number;
  need_from_recent_strain_milli: number;
  need_from_recent_nap_milli: number;
}

export interface WhoopSleepScore {
  stage_summary: WhoopSleepStagesSummary;
  sleep_needed: WhoopSleepNeeded;
  respiratory_rate: number;
  sleep_performance_percentage: number;
  sleep_consistency_percentage: number;
  sleep_efficiency_percentage: number;
}

export interface WhoopSleep {
  id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end?: string;
  timezone_offset: string;
  nap: boolean;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: WhoopSleepScore;
}

export interface WhoopWorkoutZoneDuration {
  zone_zero_milli: number;
  zone_one_milli: number;
  zone_two_milli: number;
  zone_three_milli: number;
  zone_four_milli: number;
  zone_five_milli: number;
}

export interface WhoopWorkoutScore {
  strain: number;
  average_heart_rate: number;
  max_heart_rate: number;
  kilojoule: number;
  percent_recorded: number;
  distance_meter?: number;
  altitude_gain_meter?: number;
  altitude_change_meter?: number;
  zone_duration: WhoopWorkoutZoneDuration;
}

export interface WhoopWorkout {
  id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end?: string;
  timezone_offset: string;
  sport_id: number;
  score_state: "SCORED" | "PENDING_SCORE" | "UNSCORABLE";
  score?: WhoopWorkoutScore;
}

// Generate OAuth authorization URL
export function getWhoopAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: WHOOP_SCOPES.join(" "),
    state,
  });

  return `${WHOOP_AUTH_BASE}/auth?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeWhoopCode(
  code: string,
  redirectUri: string,
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const response = await fetch(`${WHOOP_AUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange WHOOP code: ${error}`);
  }

  return response.json();
}

// Refresh access token
export async function refreshWhoopToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const response = await fetch(`${WHOOP_AUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh WHOOP token: ${error}`);
  }

  return response.json();
}

// Revoke access token
export async function revokeWhoopToken(accessToken: string): Promise<void> {
  const response = await fetch(`${WHOOP_API_BASE}/user/access_token`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new Error(`Failed to revoke WHOOP token: ${error}`);
  }
}

// Create authenticated WHOOP API client
async function createWhoopClient(
  userId: string,
  integration: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  },
): Promise<{ accessToken: string }> {
  let { accessToken } = integration;

  // Check if token needs refresh
  if (integration.expiresAt && integration.refreshToken) {
    const expiresAt = new Date(integration.expiresAt);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt < fiveMinutesFromNow) {
      const tokens = await refreshWhoopToken(integration.refreshToken);

      await calendarDb.updateIntegration(userId, "WHOOP", {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      });

      accessToken = tokens.access_token;
    }
  }

  return { accessToken };
}

// Make authenticated API request
async function whoopFetch<T>(
  accessToken: string,
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${WHOOP_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WHOOP API error (${response.status}): ${error}`);
  }

  return response.json();
}

// WHOOP API Client class
export class WhoopClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // User Profile
  async getProfile(): Promise<WhoopUserProfile> {
    return whoopFetch<WhoopUserProfile>(this.accessToken, "/user/profile/basic");
  }

  // Body Measurements
  async getBodyMeasurement(): Promise<WhoopBodyMeasurement> {
    return whoopFetch<WhoopBodyMeasurement>(this.accessToken, "/user/measurement/body");
  }

  // Cycles
  async getCycles(params?: {
    start?: string;
    end?: string;
    nextToken?: string;
    limit?: number;
  }): Promise<WhoopPaginatedResponse<WhoopCycle>> {
    const searchParams = new URLSearchParams();
    if (params?.start) searchParams.set("start", params.start);
    if (params?.end) searchParams.set("end", params.end);
    if (params?.nextToken) searchParams.set("nextToken", params.nextToken);
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const queryString = searchParams.toString();
    return whoopFetch<WhoopPaginatedResponse<WhoopCycle>>(
      this.accessToken,
      `/cycle${queryString ? `?${queryString}` : ""}`,
    );
  }

  async getCycleById(cycleId: string): Promise<WhoopCycle> {
    return whoopFetch<WhoopCycle>(this.accessToken, `/cycle/${cycleId}`);
  }

  // Recovery
  async getRecoveries(params?: {
    start?: string;
    end?: string;
    nextToken?: string;
    limit?: number;
  }): Promise<WhoopPaginatedResponse<WhoopRecovery>> {
    const searchParams = new URLSearchParams();
    if (params?.start) searchParams.set("start", params.start);
    if (params?.end) searchParams.set("end", params.end);
    if (params?.nextToken) searchParams.set("nextToken", params.nextToken);
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const queryString = searchParams.toString();
    return whoopFetch<WhoopPaginatedResponse<WhoopRecovery>>(
      this.accessToken,
      `/recovery${queryString ? `?${queryString}` : ""}`,
    );
  }

  async getRecoveryByCycleId(cycleId: string): Promise<WhoopRecovery> {
    return whoopFetch<WhoopRecovery>(this.accessToken, `/cycle/${cycleId}/recovery`);
  }

  // Sleep
  async getSleeps(params?: {
    start?: string;
    end?: string;
    nextToken?: string;
    limit?: number;
  }): Promise<WhoopPaginatedResponse<WhoopSleep>> {
    const searchParams = new URLSearchParams();
    if (params?.start) searchParams.set("start", params.start);
    if (params?.end) searchParams.set("end", params.end);
    if (params?.nextToken) searchParams.set("nextToken", params.nextToken);
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const queryString = searchParams.toString();
    return whoopFetch<WhoopPaginatedResponse<WhoopSleep>>(
      this.accessToken,
      `/activity/sleep${queryString ? `?${queryString}` : ""}`,
    );
  }

  async getSleepById(sleepId: string): Promise<WhoopSleep> {
    return whoopFetch<WhoopSleep>(this.accessToken, `/activity/sleep/${sleepId}`);
  }

  // Workouts
  async getWorkouts(params?: {
    start?: string;
    end?: string;
    nextToken?: string;
    limit?: number;
  }): Promise<WhoopPaginatedResponse<WhoopWorkout>> {
    const searchParams = new URLSearchParams();
    if (params?.start) searchParams.set("start", params.start);
    if (params?.end) searchParams.set("end", params.end);
    if (params?.nextToken) searchParams.set("nextToken", params.nextToken);
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const queryString = searchParams.toString();
    return whoopFetch<WhoopPaginatedResponse<WhoopWorkout>>(
      this.accessToken,
      `/activity/workout${queryString ? `?${queryString}` : ""}`,
    );
  }

  async getWorkoutById(workoutId: string): Promise<WhoopWorkout> {
    return whoopFetch<WhoopWorkout>(this.accessToken, `/activity/workout/${workoutId}`);
  }
}

// Get WHOOP client for current user
export async function getWhoopClient(): Promise<WhoopClient> {
  const user = await getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const integration = await calendarDb.getIntegration(user.id, "WHOOP");

  if (!integration) {
    throw new Error("No WHOOP integration found");
  }

  const { accessToken } = await createWhoopClient(user.id, integration);

  return new WhoopClient(accessToken);
}

// Get WHOOP client for a specific user
export async function getWhoopClientForUser(userId: string): Promise<WhoopClient> {
  const integration = await calendarDb.getIntegration(userId, "WHOOP");

  if (!integration) {
    throw new Error("No WHOOP integration found");
  }

  const { accessToken } = await createWhoopClient(userId, integration);

  return new WhoopClient(accessToken);
}

// Sport ID to name mapping (partial list of common sports)
export const WHOOP_SPORTS: Record<number, string> = {
  0: "Running",
  1: "Cycling",
  16: "Baseball",
  17: "Basketball",
  18: "Rowing",
  19: "Fencing",
  20: "Field Hockey",
  21: "Football",
  22: "Golf",
  24: "Ice Hockey",
  25: "Lacrosse",
  27: "Rugby",
  28: "Sailing",
  29: "Skiing",
  30: "Soccer",
  31: "Softball",
  32: "Squash",
  33: "Swimming",
  34: "Tennis",
  35: "Track & Field",
  36: "Volleyball",
  37: "Water Polo",
  38: "Wrestling",
  39: "Boxing",
  42: "Dance",
  43: "Pilates",
  44: "Yoga",
  45: "Weightlifting",
  47: "Cross Country Skiing",
  48: "Functional Fitness",
  49: "Duathlon",
  51: "Gymnastics",
  52: "Hiking",
  53: "Horseback Riding",
  55: "Kayaking",
  56: "Martial Arts",
  57: "Mountain Biking",
  59: "Powerlifting",
  60: "Rock Climbing",
  62: "Snowboarding",
  63: "Surfing",
  64: "Triathlon",
  65: "Walking",
  66: "CrossFit",
  70: "High Intensity Interval Training",
  71: "Spin",
  73: "Jogging",
  74: "Obstacle Course Racing",
  75: "Paddle Boarding",
  76: "Paddling",
  82: "Assault Bike",
  84: "Kickboxing",
  85: "Stretching",
  86: "Training",
  87: "Meditation",
  88: "Other",
  126: "Breathwork",
  260: "Jump Rope",
  261: "Stairmaster",
  264: "HYROX",
  270: "Cleaning",
};

export function getSportName(sportId: number): string {
  return WHOOP_SPORTS[sportId] ?? `Sport ${sportId}`;
}
