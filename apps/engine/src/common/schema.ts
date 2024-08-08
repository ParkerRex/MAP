// This file defines schemas for Google Calendar error handling and provider types using Zod for validation.
// It utilizes the @hono/zod-openapi package to create OpenAPI-compatible schemas.

import { z } from "@hono/zod-openapi";

// ErrorSchema defines the structure of an error response specific to Google Calendar.
// It includes a code, a message, and a requestId for tracking.
export const ErrorSchema = z.object({
  code: z.string().openapi({
    example: "google_calendar_error", // Example of a Google Calendar error code
  }),
  message: z.string().openapi({
    example:
      "An error occurred while accessing Google Calendar. Please check your credentials and try again.", // Example of a Google Calendar error message
  }),
  requestId: z.string().openapi({
    example: "123e4567-e89b-12d3-a456-426655440000", // Example of a unique request identifier
  }),
});

// Providers is an enumeration of supported providers for Google Calendar.
// It includes "googlecalendar".
export const Providers = z.enum(["googlecalendar"]);

// HeadersSchema defines the structure of the authorization header for Google Calendar.
// It includes an authorization field that expects a Bearer token.
export const HeadersSchema = z.object({
  authorization: z.string().openapi({
    example: "Bearer SECRET", // Example of a Google Calendar authorization header
  }),
});
