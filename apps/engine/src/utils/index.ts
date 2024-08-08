import { Hono } from "hono";
import { env } from "hono/adapter";
import { GoogleCalendarProvider } from "../providers";
import { googleCalendarRoutes } from "../routes/googlecalendar";

// Define the type for your environment variables
type Env = {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  KV: KVNamespace;
  [key: string]: unknown;
};

const app = new Hono<{ Bindings: Env }>();

// Middleware to add GoogleCalendarProvider to the context
app.use("*", async (c, next) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, KV } =
    env<Env>(c);

  const providerParams = {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI,
    refreshToken: "", // You need to implement a way to get the refresh token
  };

  const googleCalendarProvider = new GoogleCalendarProvider(providerParams);
  c.set("googleCalendarProvider", googleCalendarProvider as unknown as string);
  await next();
});

// Mount Google Calendar routes
app.route("/google-calendar", googleCalendarRoutes);

export default app;
