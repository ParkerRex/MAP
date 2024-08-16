import { OpenAPIHono } from "@hono/zod-openapi";
import type { Bindings } from "../../types";
import * as aclRoutes from "./acl";
import * as calendarListRoutes from "./calendar-list";
import * as calendarsRoutes from "./calendars";
import * as channelsRoutes from "./channels";
import * as colorsRoutes from "./colors";
import * as eventInstancesRoutes from "./event-instances";
import * as eventsRoutes from "./events";
import * as freebusyRoutes from "./freebusy";
import * as quickAddEventRoutes from "./quick-add-event";
import * as settingsRoutes from "./settings";
import * as watchEventsRoutes from "./watch-events";
import * as watchSettingsRoutes from "./watch-settings";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

router.route("/acl", aclRoutes.router);
router.route("/calendar-list", calendarListRoutes.router);
router.route("/calendars", calendarsRoutes.router);
router.route("/channels", channelsRoutes.router);
router.route("/colors", colorsRoutes.router);
router.route("/events", eventsRoutes.router);
router.route("/events/instances", eventInstancesRoutes.router);
router.route("/events/quickAdd", quickAddEventRoutes.router);
router.route("/events/watch", watchEventsRoutes.router);
router.route("/freebusy", freebusyRoutes.router);
router.route("/settings", settingsRoutes.router);
router.route("/settings/watch", watchSettingsRoutes.router);

export { router as googleCalendarRoutes };
