import type { Bindings } from "@/common/bindings";
import { ErrorSchema } from "@/common/schema";
import { GoogleCalendarProvider } from "@/providers/googlecalendar/googlecalendar-provider";
import { createErrorResponse } from "@/utils/error";
import { createRoute } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { env } from "hono/adapter";
import {
  GoogleCalendarAuthUrlBodySchema,
  GoogleCalendarAuthUrlSchema,
  GoogleCalendarTokenExchangeBodySchema,
  GoogleCalendarTokenExchangeSchema,
} from "./schema";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const getAuthUrlRoute = createRoute({
  method: "post",
  path: "/google-calendar/auth-url",
  summary: "Get Google Calendar Auth URL",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GoogleCalendarAuthUrlBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GoogleCalendarAuthUrlSchema,
        },
      },
      description: "Retrieve Auth URL",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

const exchangeTokenRoute = createRoute({
  method: "post",
  path: "/google-calendar/exchange-token",
  summary: "Exchange Google Calendar token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GoogleCalendarTokenExchangeBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GoogleCalendarTokenExchangeSchema,
        },
      },
      description: "Exchange token",
    },
    400: {
      content: {
        "application/json": {
          schema: ErrorSchema,
        },
      },
      description: "Returns an error",
    },
  },
});

app.openapi(getAuthUrlRoute, async (c: Context<{ Bindings: Bindings }>) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = c.env;
  const provider = new GoogleCalendarProvider({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI,
    refreshToken: "", // This will be obtained later
    kv: c.env.KV,
  });

  const { scopes } = await c.req.json();
  const authUrl = await provider.getAuthUrl(scopes);

  return c.json({ data: { authUrl } });
});

app.openapi(exchangeTokenRoute, async (c: Context<{ Bindings: Bindings }>) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = c.env;
  const { code } = c.req.json();

  const provider = new GoogleCalendarProvider({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI,
    refreshToken: "", // This will be obtained from the exchange
    kv: c.env.KV,
  });

  const tokens = await provider.exchangeCode(code);

  // Store the refresh token securely (e.g., in KV store)
  await c.env.KV.put("google_calendar_refresh_token", tokens.refresh_token);

  return c.json({
    data: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
    },
  });
});

export default app;
