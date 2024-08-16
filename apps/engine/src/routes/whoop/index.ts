import { OpenAPIHono } from "@hono/zod-openapi";
import type { Bindings } from "../../types";
import * as activitiesRoutes from "./activities";
import * as bodyMeasurementsRoutes from "./body-measurements";
import * as cyclesRoutes from "./cycles";
import * as profileRoutes from "./profile";
import * as recoveriesRoutes from "./recoveries";
import * as sleepsRoutes from "./sleeps";
import * as teamsRoutes from "./teams";
import * as workoutsRoutes from "./workouts";

const router = new OpenAPIHono<{ Bindings: Bindings }>();

router.route("/profile", profileRoutes.router);
router.route("/cycles", cyclesRoutes.router);
router.route("/workouts", workoutsRoutes.router);
router.route("/recoveries", recoveriesRoutes.router);
router.route("/sleeps", sleepsRoutes.router);
router.route("/body-measurements", bodyMeasurementsRoutes.router);
router.route("/activities", activitiesRoutes.router);
router.route("/teams", teamsRoutes.router);

export { router as whoopRoutes };
