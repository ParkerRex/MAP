// TODO: Deploy API to NPM and import from there
import Map from "@map/engine";

export const engine = new Midday({
  environment: process.env.MIDDAY_ENGINE_ENVIRONMENT as
    | "production"
    | "staging"
    | "development"
    | undefined,
});
