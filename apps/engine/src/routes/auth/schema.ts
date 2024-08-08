import { z } from "@hono/zod-openapi";

export const GoogleCalendarAuthUrlBodySchema = z
  .object({
    scopes: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["https://www.googleapis.com/auth/calendar"],
        description: "OAuth 2.0 scopes for Google Calendar API",
      }),
  })
  .openapi("GoogleCalendarAuthUrlBodySchema");

export const GoogleCalendarAuthUrlSchema = z
  .object({
    data: z.object({
      authUrl: z.string().openapi({
        example: "https://accounts.google.com/o/oauth2/v2/auth?...",
        description: "Google OAuth 2.0 authorization URL",
      }),
    }),
  })
  .openapi("GoogleCalendarAuthUrlSchema");

export const GoogleCalendarTokenExchangeBodySchema = z
  .object({
    code: z.string().openapi({
      example: "4/P7q7W91a-oMsCeLvIaQm6bTrgtp7",
      description: "The authorization code returned from the initial request",
    }),
  })
  .openapi("GoogleCalendarTokenExchangeBodySchema");

export const GoogleCalendarTokenExchangeSchema = z
  .object({
    data: z.object({
      access_token: z.string().openapi({
        example: "1/fFAGRNJru1FTz70BzhT3Zg",
        description: "The token that can be used to access the Google API",
      }),
      refresh_token: z.string().openapi({
        example: "1//xEoDL4iW3cxlI7yDbSRFYNG01kVKM2C-259HOF2aQbI",
        description: "A token that can be used to obtain a new access token",
      }),
      expiry_date: z.number().openapi({
        example: 1654356000000,
        description: "The expiration time of the access token",
      }),
      token_type: z.string().openapi({
        example: "Bearer",
        description: "The type of token",
      }),
      scope: z.string().openapi({
        example: "https://www.googleapis.com/auth/calendar",
        description: "The scopes that the access token is valid for",
      }),
    }),
  })
  .openapi("GoogleCalendarTokenExchangeSchema");
