import MapEngine from "@map/engine";

export const engine = new MapEngine({
  environment: process.env.MAP_ENGINE_ENVIRONMENT as
    | "production"
    | "staging"
    | "development"
    | undefined,
  bearerToken: process.env.MAP_ENGINE_API_KEY ?? "",
});
