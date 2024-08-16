import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { GoogleCalendarProvider } from "../../providers/google-calendar/google-calendar-provider";
import { WhoopProvider } from "../../providers/whoop/whoop-provider";
import type { Bindings } from "../../types";
import {
  GoogleAuthResponseSchema,
  GoogleAuthSchema,
  RefreshTokenResponseSchema,
  RefreshTokenSchema,
  WhoopAuthResponseSchema,
  WhoopAuthSchema,
} from "./schema";

const authRoutes = new OpenAPIHono<{ Bindings: Bindings }>();

const googleAuthRoute = createRoute({
  method: "post",
  path: "/google/auth",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GoogleAuthSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GoogleAuthResponseSchema,
        },
      },
      description: "Successful authentication",
    },
  },
});

const whoopAuthRoute = createRoute({
  method: "post",
  path: "/whoop/auth",
  request: {
    body: {
      content: {
        "application/json": {
          schema: WhoopAuthSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: WhoopAuthResponseSchema,
        },
      },
      description: "Successful authentication",
    },
  },
});

const refreshTokenRoute = createRoute({
  method: "post",
  path: "/refresh",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RefreshTokenSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: RefreshTokenResponseSchema,
        },
      },
      description: "Successfully refreshed token",
    },
  },
});

authRoutes.openapi(googleAuthRoute, async (c) => {
  const { code, redirectUri } = c.req.valid("json");
  const googleCalendarProvider = new GoogleCalendarProvider({
    kv: c.env.KV,
    envs: c.env,
  });

  try {
    const tokens = await googleCalendarProvider.getTokens(code, redirectUri);
    return c.json(tokens);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: "An unexpected error occurred" }, 500);
  }
});

authRoutes.openapi(whoopAuthRoute, async (c) => {
  const { code, redirectUri } = c.req.valid("json");
  const whoopProvider = new WhoopProvider({
    kv: c.env.KV,
    envs: c.env,
  });

  try {
    const tokens = await whoopProvider.getTokens(code, redirectUri);
    return c.json(tokens);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: "An unexpected error occurred" }, 500);
  }
});

authRoutes.openapi(refreshTokenRoute, async (c) => {
  const { refreshToken, provider } = c.req.valid("json");

  try {
    let newTokens;
    if (provider === "google") {
      const googleCalendarProvider = new GoogleCalendarProvider({
        kv: c.env.KV,
        envs: c.env,
      });
      newTokens = await googleCalendarProvider.refreshToken(refreshToken);
    } else {
      const whoopProvider = new WhoopProvider({
        kv: c.env.KV,
        envs: c.env,
      });
      newTokens = await whoopProvider.refreshToken(refreshToken);
    }
    return c.json(newTokens);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: "An unexpected error occurred" }, 500);
  }
});

export { authRoutes };
