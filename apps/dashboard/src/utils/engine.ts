import { authActionClient } from "@/actions/safe-action";
import { z } from "zod";

class Engine {
  private baseUrl: string;

  constructor(
    environment: "production" | "staging" | "development" | undefined,
  ) {
    this.baseUrl = this.getBaseUrl(environment);
  }

  private getBaseUrl(environment: string | undefined): string {
    switch (environment) {
      case "production":
        return "https://api.yourapp.com";
      case "staging":
        return "https://staging-api.yourapp.com";
      case "development":
      default:
        return "http://localhost:3002";
    }
  }

  calendar = {
    getEvents: authActionClient
      .schema(
        z.object({
          accountId: z.string(),
          calendarId: z.string(),
          syncToken: z.string().optional(),
        }),
      )
      .action(async ({ ctx, parsedInput }) => {
        const response = await fetch(
          `${this.baseUrl}/api/calendar/events?${new URLSearchParams(parsedInput)}`,
        );
        if (!response.ok) throw new Error("Failed to get events");
        return response.json();
      }),

    createEvent: authActionClient
      .schema(
        z.object({
          accountId: z.string(),
          calendarId: z.string(),
          event: z.object({
            // Define event schema
          }),
        }),
      )
      .action(async ({ ctx, parsedInput }) => {
        const response = await fetch(`${this.baseUrl}/api/calendar/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedInput),
        });
        if (!response.ok) throw new Error("Failed to create event");
        return response.json();
      }),

    updateEvent: authActionClient
      .schema(
        z.object({
          accountId: z.string(),
          calendarId: z.string(),
          eventId: z.string(),
          event: z.object({
            // Define event update schema
          }),
        }),
      )
      .action(async ({ ctx, parsedInput }) => {
        const { eventId, ...body } = parsedInput;
        const response = await fetch(
          `${this.baseUrl}/api/calendar/events/${eventId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        if (!response.ok) throw new Error("Failed to update event");
        return response.json();
      }),

    deleteEvent: authActionClient
      .schema(
        z.object({
          accountId: z.string(),
          calendarId: z.string(),
          eventId: z.string(),
        }),
      )
      .action(async ({ ctx, parsedInput }) => {
        const response = await fetch(
          `${this.baseUrl}/api/calendar/events/${parsedInput.eventId}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsedInput),
          },
        );
        if (!response.ok) throw new Error("Failed to delete event");
        return { success: true };
      }),

    getCalendarLists: authActionClient
      .schema(
        z.object({
          accountId: z.string(),
        }),
      )
      .action(async ({ ctx, parsedInput }) => {
        const response = await fetch(
          `${this.baseUrl}/api/calendar/lists?${new URLSearchParams(parsedInput)}`,
        );
        if (!response.ok) throw new Error("Failed to get calendar lists");
        return response.json();
      }),

    getCalendarResources: authActionClient
      .schema(
        z.object({
          accountId: z.string(),
        }),
      )
      .action(async ({ ctx, parsedInput }) => {
        const response = await fetch(
          `${this.baseUrl}/api/calendar/resources?${new URLSearchParams(parsedInput)}`,
        );
        if (!response.ok) throw new Error("Failed to get calendar resources");
        return response.json();
      }),
  };

  user = {
    getPreferences: authActionClient.action(async ({ ctx }) => {
      const response = await fetch(`${this.baseUrl}/api/user/preferences`);
      if (!response.ok) throw new Error("Failed to get user preferences");
      return response.json();
    }),
  };
}

export const engine = new Engine(
  process.env.NODE_ENV as "production" | "staging" | "development" | undefined,
);
