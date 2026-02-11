import agent from "@convex-dev/agent/convex.config.js";
import betterAuth from "@convex-dev/better-auth/convex.config";
import persistentTextStreaming from "@convex-dev/persistent-text-streaming/convex.config.js";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();

app.use(betterAuth);
app.use(agent);
app.use(persistentTextStreaming);
app.use(rateLimiter);

export default app;
