import crypto from "node:crypto";
import { createClient } from "@map/supabase/server";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import type { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import morgan from "morgan";
import NodeCache from "node-cache";
import { z } from "zod";
import type { Database } from "../../packages/supabase/src/types/db";

dotenv.config();
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

declare global {
  namespace Express {
    interface Request {
      user?: unknown;
      pagination?: {
        page: number;
        limit: number;
        skip: number;
      };
    }
  }
}

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("combined"));

const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

// Create an async function to get the OAuth2Client
const getGoogleAuth = async (): Promise<OAuth2Client> => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("No active session");
  }
  const { provider_token } = session;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({ access_token: provider_token });
  return oauth2Client;
};

// Initialize the calendar with a synchronous auth property
const calendar = google.calendar({ version: "v3" });

// Update the auth property before each request
const setAuthBeforeRequest = async () => {
  calendar.context._options.auth = await getGoogleAuth();
};

const verifyToken = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// Error handling middleware
const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  if (err.code === "ECONNREFUSED") {
    res.status(503).json({ error: "Service unavailable. Please try again later." });
  } else if (err.response?.data) {
    res.status(err.response.status).json({ error: err.response.data.error.message });
  } else {
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

// Input validation middleware
const validate =
  (schema: z.ZodSchema) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        next(error);
      }
    }
  };

// Pagination middleware
const paginate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const page = Number.parseInt(req.query.page as string) || 1;
  const limit = Number.parseInt(req.query.limit as string) || 10;
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
  };
  next();
};

// Schemas for input validation
const eventSchema = z.object({
  summary: z.string(),
  description: z.string().optional(),
  start: z.object({ dateTime: z.string(), timeZone: z.string() }),
  end: z.object({ dateTime: z.string(), timeZone: z.string() }),
});

const calendarSchema = z.object({
  summary: z.string(),
  description: z.string().optional(),
});

// CRUD for Events

// Create Event
app.post("/events", verifyToken, validate(eventSchema), async (req, res, next) => {
  try {
    await setAuthBeforeRequest();
    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: req.body,
    });
    res.json(event.data);
  } catch (error) {
    next(error);
  }
});

// Read Event
app.get("/events/:eventId", verifyToken, async (req, res, next) => {
  try {
    await setAuthBeforeRequest();
    const event = await calendar.events.get({
      calendarId: "primary",
      eventId: req.params.eventId,
    });
    res.json(event.data);
  } catch (error) {
    next(error);
  }
});

// Update Event
app.put("/events/:eventId", verifyToken, validate(eventSchema), async (req, res, next) => {
  try {
    await setAuthBeforeRequest();
    const event = await calendar.events.update({
      calendarId: "primary",
      eventId: req.params.eventId,
      requestBody: req.body,
    });
    res.json(event.data);
  } catch (error) {
    next(error);
  }
});

// Delete Event
app.delete("/events/:eventId", verifyToken, async (req, res, next) => {
  try {
    await setAuthBeforeRequest();
    await calendar.events.delete({
      calendarId: "primary",
      eventId: req.params.eventId,
    });
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// List Events (with pagination)
app.get("/events", verifyToken, paginate, async (req, res, next) => {
  try {
    await setAuthBeforeRequest();
    if (!req.pagination) {
      return res.status(400).json({ error: "Pagination information is missing" });
    }
    const events = await calendar.events.list({
      calendarId: "primary",
      maxResults: req.pagination.limit,
      pageToken: req.query.pageToken as string,
    });
    res.json({
      events: events.data.items,
      nextPageToken: events.data.nextPageToken,
    });
  } catch (error) {
    next(error);
  }
});

// CRUD for Calendars

// Create Calendar
app.post("/calendars", verifyToken, validate(calendarSchema), async (req, res, next) => {
  try {
    await setAuthBeforeRequest();
    const newCalendar = await calendar.calendars.insert({
      requestBody: req.body,
    });
    res.json(newCalendar.data);
  } catch (error) {
    next(error);
  }
});

// Read Calendar
app.get("/calendars/:calendarId", verifyToken, async (req, res, next) => {
  try {
    await setAuthBeforeRequest();
    const calendarData = await calendar.calendars.get({
      calendarId: req.params.calendarId,
    });
    res.json(calendarData.data);
  } catch (error) {
    next(error);
  }
});

// Update Calendar
app.put("/calendars/:calendarId", verifyToken, validate(calendarSchema), async (req, res, next) => {
  try {
    await setAuthBeforeRequest();
    const updatedCalendar = await calendar.calendars.update({
      calendarId: req.params.calendarId,
      requestBody: req.body,
    });
    res.json(updatedCalendar.data);
  } catch (error) {
    next(error);
  }
});

// Delete Calendar
app.delete("/calendars/:calendarId", verifyToken, async (req, res, next) => {
  try {
    await setAuthBeforeRequest();
    await calendar.calendars.delete({
      calendarId: req.params.calendarId,
    });
    res.json({ message: "Calendar deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// List Calendars (with pagination)
app.get("/calendars", verifyToken, paginate, async (req, res, next) => {
  try {
    await setAuthBeforeRequest();
    if (!req.pagination) {
      return res.status(400).json({ error: "Pagination information is missing" });
    }
    const calendars = await calendar.calendarList.list({
      maxResults: req.pagination.limit,
      pageToken: req.query.pageToken as string,
    });
    res.json({
      calendars: calendars.data.items,
      nextPageToken: calendars.data.nextPageToken,
    });
  } catch (error) {
    next(error);
  }
});

// Get calendar colors
app.get("/colors", verifyToken, async (req, res, next) => {
  try {
    await setAuthBeforeRequest();
    const cachedColors = cache.get("colors");
    if (cachedColors) {
      return res.json(cachedColors);
    }
    const colors = await calendar.colors.get();
    cache.set("colors", colors.data);
    res.json(colors.data);
  } catch (error) {
    next(error);
  }
});

// Get free/busy information
app.post("/freebusy", verifyToken, async (req, res, next) => {
  try {
    await setAuthBeforeRequest();
    const freebusy = await calendar.freebusy.query({
      requestBody: req.body,
    });
    res.json(freebusy.data);
  } catch (error) {
    next(error);
  }
});

app.post("/sync-calendars", async (req, res) => {
  // Verify the webhook secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { type, record } = req.body;

  if ((type === "INSERT" || type === "PERIODIC") && record && record.id) {
    try {
      await retrySync(record.id);
      res.json({ message: "Calendar sync initiated successfully" });
    } catch (error) {
      console.error("Error syncing calendars:", error);
      res.status(500).json({ error: "Failed to sync calendars" });
    }
  } else {
    res.status(400).json({ error: "Invalid webhook payload" });
  }
});

const syncLog = async (userId: string, status: "success" | "failure", message: string) => {
  const supabase = createClient();
  await supabase.from("sync_logs").insert({
    id: crypto.randomUUID(),
    user_id: userId,
    status,
    message,
  });
};

async function syncUserCalendars(userId: string) {
  try {
    const supabase = createClient();
    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "GOOGLE")
      .single();

    if (!integration) {
      await syncLog(userId, "failure", "No Google integration found");
      return;
    }

    // Set up Google OAuth2 client with the integration tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
    });

    // Use this OAuth2 client for calendar operations
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    // Fetch calendars
    const calendarList = await calendar.calendarList.list();
    const calendars = calendarList.data.items || [];

    // Fetch events for each calendar
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAhead = new Date();
    sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);

    const events = await Promise.all(
      calendars.map(async (cal) => {
        const eventList = await calendar.events.list({
          calendarId: cal.id ?? "primary",
          timeMin: sixMonthsAgo.toISOString(),
          timeMax: sixMonthsAhead.toISOString(),
          singleEvents: true,
          orderBy: "startTime",
        });
        return eventList.data.items || [];
      }),
    );

    // Flatten the events array
    const allEvents = events.flat();

    // Store calendars and events in Supabase

    await supabase.rpc("sync_calendar", {
      p_user_id: userId,
      p_calendars: JSON.parse(JSON.stringify(calendars)),
      p_events: JSON.parse(JSON.stringify(allEvents)),
    });
    await syncLog(userId, "success", "Calendars and events synced successfully");
  } catch (error) {
    console.error("Error in syncUserCalendars:", error);
    await syncLog(
      userId,
      "failure",
      `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

async function refreshTokenIfNeeded(
  integration: Database["public"]["Tables"]["integrations"]["Row"],
) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({
    refresh_token: integration.refresh_token,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    const supabase = createClient();

    if (credentials.access_token) {
      await supabase
        .from("integrations")
        .update({
          access_token: credentials.access_token,
          expires_at: new Date(Date.now() + (credentials.expiry_date || 3600 * 1000)).toISOString(),
        })
        .eq("id", integration.id);

      return credentials.access_token;
      // biome-ignore lint/style/noUselessElse: <explanation>
    } else {
      throw new Error("Failed to refresh access token");
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
}

const retrySync = async (userId: string, maxRetries = 3, delay = 5000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await syncUserCalendars(userId);
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Use error handling middleware
app.use(errorHandler);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", apiLimiter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
