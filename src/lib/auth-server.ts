import { convexBetterAuthReactStart } from "@convex-dev/better-auth/react-start";
import { api } from "convex/_generated/api";

const siteUrl = import.meta.env.VITE_CONVEX_SITE_URL;
const serverUrl = import.meta.env.VITE_CONVEX_URL;

export const { handler, getToken, fetchAuthQuery, fetchAuthMutation, getSession } =
  convexBetterAuthReactStart(api, {
    siteUrl,
    serverUrl,
  });
