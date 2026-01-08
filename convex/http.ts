import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { streamChat } from "./chat";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

http.route({
  path: "/chat/stream",
  method: "POST",
  handler: streamChat,
});

export default http;
