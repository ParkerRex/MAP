import { z } from "zod";
import type { Bindings } from "../types";

export const Providers = z.enum(["google-calendar", "whoop"]);
export type Provider = z.infer<typeof Providers>;

export type ProviderParams = {
  provider: Provider;
  env: Bindings;
};

export type GetEventsRequest = {
  calendarId: string;
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
};

export type GetProfileRequest = {
  accessToken: string;
};

export type GetCyclesRequest = {
  accessToken: string;
  start: string;
  end: string;
};

export type GetWorkoutsRequest = {
  accessToken: string;
  start: string;
  end: string;
};

export type GetRecoveriesRequest = {
  accessToken: string;
  start: string;
  end: string;
};

export type GetSleepsRequest = {
  accessToken: string;
  start: string;
  end: string;
};

export type GetBodyMeasurementsRequest = {
  accessToken: string;
};

export type CreateBodyMeasurementRequest = {
  accessToken: string;
  measurement: {
    timestamp: string;
    height?: number;
    weight?: number;
    bodyFatPercentage?: number;
    boneMass?: number;
    muscleMass?: number;
  };
};

export type GetActivitiesRequest = {
  accessToken: string;
  start: string;
  end: string;
};

export type GetTeamsRequest = {
  accessToken: string;
};

export type GetTeamMembersRequest = {
  accessToken: string;
  teamId: string;
};
