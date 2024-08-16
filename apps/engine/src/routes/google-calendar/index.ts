import { OpenAPIHono } from "@hono/zod-openapi";
import type { Bindings } from "../../types";
import aclRoutes from "./acl";
import calendarListRoutes from "./calendar-list";
import calendarsRoutes from "./calendars";
import channelsRoutes from "./channels";
import colorsRoutes from "./colors";
import eventInstancesRoutes from "./event-instances";
import eventsRoutes from "./events";
import freebusyRoutes from "./freebusy";
import quickAddEventRoutes from "./quick-add-event";
import settingsRoutes from "./settings";
import watchEventsRoutes from "./watch-events";
import watchSettingsRoutes from "./watch-settings";

const app = new OpenAPIHono<{ Bindings: Bindings }>();

app.route("/acl", aclRoutes);
app.route("/calendar-list", calendarListRoutes);
app.route("/calendars", calendarsRoutes);
app.route("/channels", channelsRoutes);
app.route("/colors", colorsRoutes);
app.route("/events", eventsRoutes);
app.route("/events/instances", eventInstancesRoutes);
app.route("/events/quickAdd", quickAddEventRoutes);
app.route("/events/watch", watchEventsRoutes);
app.route("/freebusy", freebusyRoutes);
app.route("/settings", settingsRoutes);
app.route("/settings/watch", watchSettingsRoutes);

export default app;
