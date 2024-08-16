import { z } from "zod";
import {
  ActivitySchema,
  BodyMeasurementSchema,
  CycleSchema,
  ProfileSchema,
  RecoverySchema,
  SleepSchema,
  TeamMemberSchema,
  TeamSchema,
  WorkoutSchema,
} from "../../routes/whoop/schema";
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

  async getProfile(accessToken: string) {
    const data = await this.fetchWithAuth<z.infer<typeof ProfileSchema>>(
      "/user/profile",
      accessToken,
    );
    return ProfileSchema.parse(data);
  }

  async getCycles(accessToken: string, start: string, end: string) {
    const data = await this.fetchWithAuth<z.infer<typeof CycleSchema>[]>(
      `/cycle?start=${start}&end=${end}`,
      accessToken,
    );
    return z.array(CycleSchema).parse(data);
  }

  async getWorkouts(accessToken: string, start: string, end: string) {
    const data = await this.fetchWithAuth<z.infer<typeof WorkoutSchema>[]>(
      `/workout?start=${start}&end=${end}`,
      accessToken,
    );
    return z.array(WorkoutSchema).parse(data);
  }

  async getRecoveries(accessToken: string, start: string, end: string) {
    const data = await this.fetchWithAuth<z.infer<typeof RecoverySchema>[]>(
      `/recovery?start=${start}&end=${end}`,
      accessToken,
    );
    return z.array(RecoverySchema).parse(data);
  }

  async getSleeps(accessToken: string, start: string, end: string) {
    const data = await this.fetchWithAuth<z.infer<typeof SleepSchema>[]>(
      `/sleep?start=${start}&end=${end}`,
      accessToken,
    );
    return z.array(SleepSchema).parse(data);
  }

  async getBodyMeasurements(accessToken: string) {
    const data = await this.fetchWithAuth<
      z.infer<typeof BodyMeasurementSchema>[]
    >("/body_measurement", accessToken);
    return z.array(BodyMeasurementSchema).parse(data);
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

  async getActivities(accessToken: string, start: string, end: string) {
    const data = await this.fetchWithAuth<z.infer<typeof ActivitySchema>[]>(
      `/activity?start=${start}&end=${end}`,
      accessToken,
    );
    return z.array(ActivitySchema).parse(data);
  }

  async getTeams(accessToken: string) {
    const data = await this.fetchWithAuth<z.infer<typeof TeamSchema>[]>(
      "/team",
      accessToken,
    );
    return z.array(TeamSchema).parse(data);
  }

  async getTeamMembers(accessToken: string, teamId: string) {
    const data = await this.fetchWithAuth<z.infer<typeof TeamMemberSchema>[]>(
      `/team/${teamId}/member`,
      accessToken,
    );
    return z.array(TeamMemberSchema).parse(data);
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
