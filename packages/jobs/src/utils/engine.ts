import MapEngine from "@map/engine";

export const engine = new Midday({
  environment: process.env.MIDDAY_ENGINE_ENVIRONMENT as
    | "production"
    | "staging"
    | "development"
    | undefined,
  bearerToken: process.env.MIDDAY_ENGINE_API_KEY ?? "",
});
