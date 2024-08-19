import { z } from "zod";
import { ActivitySchema } from "../../routes/whoop/activities/schema";
import { BodyMeasurementSchema } from "../../routes/whoop/body-measurements/schema";
import { CycleSchema } from "../../routes/whoop/cycles/schema";
import { ProfileSchema } from "../../routes/whoop/profile/schema";
import { RecoverySchema } from "../../routes/whoop/recoveries/schema";
import { SleepSchema } from "../../routes/whoop/sleeps/schema";
import { TeamMemberSchema, TeamSchema } from "../../routes/whoop/teams/schema";
import { WorkoutSchema } from "../../routes/whoop/workouts/schema";
import type { Bindings } from "../../types";

export class WhoopProvider {
  private baseUrl = "https://api.whoop.com/v2";

  constructor(private c: { env: Bindings }) {}

  private async fetchWithAuth<T>(
    endpoint: string,
    accessToken: string,
    method = "GET",
    body?: Record<string, unknown>,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`WHOOP API error: ${response.statusText}`);
    }

    return response.json();
  }

  async createBodyMeasurement(
    accessToken: string,
    measurement: z.infer<typeof BodyMeasurementSchema>,
  ) {
    const data = await this.fetchWithAuth<
      z.infer<typeof BodyMeasurementSchema>
    >("/body_measurement", accessToken, "POST", measurement);
    return BodyMeasurementSchema.parse(data);
  }

  async getActivities(
    accessToken: string,
    start: string,
    end: string,
    limit?: number,
    nextToken?: string,
  ) {
    const queryParams = new URLSearchParams({
      start,
      end,
      ...(limit && { limit: limit.toString() }),
      ...(nextToken && { nextToken }),
    });
    const data = await this.fetchWithAuth<{
      records: z.infer<typeof ActivitySchema>[];
      next_token?: string;
    }>(`/activity?${queryParams.toString()}`, accessToken);
    return {
      records: z.array(ActivitySchema).parse(data.records),
      nextToken: data.next_token,
    };
  }

  async getBodyMeasurements(accessToken: string) {
    const data = await this.fetchWithAuth<
      z.infer<typeof BodyMeasurementSchema>
    >("/body_measurement", accessToken);
    return BodyMeasurementSchema.parse(data);
  }

  async getCycles(
    accessToken: string,
    start: string,
    end: string,
    limit?: number,
    nextToken?: string,
  ) {
    const queryParams = new URLSearchParams({
      start,
      end,
      ...(limit && { limit: limit.toString() }),
      ...(nextToken && { nextToken }),
    });
    const data = await this.fetchWithAuth<{
      records: z.infer<typeof CycleSchema>[];
      next_token?: string;
    }>(`/cycle?${queryParams.toString()}`, accessToken);
    return {
      records: z.array(CycleSchema).parse(data.records),
      nextToken: data.next_token,
    };
  }

  async getProfile(accessToken: string) {
    const data = await this.fetchWithAuth<z.infer<typeof ProfileSchema>>(
      "/user/profile",
      accessToken,
    );
    return ProfileSchema.parse(data);
  }

  async getRecoveries(
    accessToken: string,
    start: string,
    end: string,
    limit?: number,
    nextToken?: string,
  ) {
    const queryParams = new URLSearchParams({
      start,
      end,
      ...(limit && { limit: limit.toString() }),
      ...(nextToken && { nextToken }),
    });
    const data = await this.fetchWithAuth<{
      records: z.infer<typeof RecoverySchema>[];
      next_token?: string;
    }>(`/recovery?${queryParams.toString()}`, accessToken);
    return {
      records: z.array(RecoverySchema).parse(data.records),
      nextToken: data.next_token,
    };
  }

  async getSleeps(
    accessToken: string,
    start: string,
    end: string,
    limit?: number,
    nextToken?: string,
  ) {
    const queryParams = new URLSearchParams({
      start,
      end,
      ...(limit && { limit: limit.toString() }),
      ...(nextToken && { nextToken }),
    });
    const data = await this.fetchWithAuth<{
      records: z.infer<typeof SleepSchema>[];
      next_token?: string;
    }>(`/sleep?${queryParams.toString()}`, accessToken);
    return {
      records: z.array(SleepSchema).parse(data.records),
      nextToken: data.next_token,
    };
  }

  async getTeamMembers(accessToken: string, teamId: string) {
    const data = await this.fetchWithAuth<z.infer<typeof TeamMemberSchema>[]>(
      `/team/${teamId}/member`,
      accessToken,
    );
    return z.array(TeamMemberSchema).parse(data);
  }

  async getTeams(accessToken: string) {
    const data = await this.fetchWithAuth<z.infer<typeof TeamSchema>[]>(
      "/team",
      accessToken,
    );
    return z.array(TeamSchema).parse(data);
  }

  async getWorkouts(
    accessToken: string,
    start: string,
    end: string,
    limit?: number,
    nextToken?: string,
  ) {
    const queryParams = new URLSearchParams({
      start,
      end,
      ...(limit && { limit: limit.toString() }),
      ...(nextToken && { nextToken }),
    });
    const data = await this.fetchWithAuth<{
      records: z.infer<typeof WorkoutSchema>[];
      next_token?: string;
    }>(`/workout?${queryParams.toString()}`, accessToken);
    return {
      records: z.array(WorkoutSchema).parse(data.records),
      nextToken: data.next_token,
    };
  }

  async refreshToken(refreshToken: string) {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: this.c.env.WHOOP_CLIENT_ID,
        client_secret: this.c.env.WHOOP_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(`WHOOP API error: ${response.statusText}`);
    }

    return response.json();
  }
}
