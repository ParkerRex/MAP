import {
  createEventRoute,
  deleteCalendarRoute,
  deleteEventRoute,
  getCalendarListRoute,
  getCalendarResourcesRoute,
  getColorsRoute,
  getEventsRoute,
  updateCalendarRoute,
  updateEventRoute,
} from "./routes/gcal";
import { getCalendarListRoute } from "./routes/gcal/calendar-list";
import { deleteCalendarRoute } from "./routes/gcal/calendars";
import { updateCalendarRoute } from "./routes/gcal/calendars";
import { getColorsRoute } from "./routes/gcal/colors";
import { getEventsRoute } from "./routes/gcal/events";
import { updateEventRoute } from "./routes/gcal/events";
import { deleteEventRoute } from "./routes/gcal/events";
import { getCalendarResourcesRoute } from "./routes/gcal/resources";

app.route("/api/calendar/list", getCalendarListRoute);
app.route("/api/calendar/events", getEventsRoute);
app.route("/api/calendar/events", createEventRoute);
app.route("/api/calendar/events/:eventId", updateEventRoute);
app.route("/api/calendar/events/:eventId", deleteEventRoute);
app.route("/api/calendar/:calendarId", deleteCalendarRoute);
app.route("/api/calendar/:calendarId", updateCalendarRoute);
app.route("/api/calendar/resources", getCalendarResourcesRoute);
app.route("/api/calendar/colors", getColorsRoute);

export default app;
