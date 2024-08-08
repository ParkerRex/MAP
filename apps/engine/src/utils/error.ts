import axios from "axios";
import { logger } from "./logger";

export class ProviderError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = this.setCode(code);
  }

  private setCode(code: string) {
    // Google Calendar specific error handling
    switch (code) {
      case "calendar.disconnected":
      case "calendar.account_closed":
      case "calendar.access_denied":
        logger("disconnected", this.message);
        return "disconnected";
      default:
        logger("unknown", this.message);
        return "unknown";
    }
  }
}

export function createErrorResponse(error: unknown, requestId: string) {
  if (error instanceof ProviderError) {
    return {
      requestId,
      message: error.message,
      code: error.code,
    };
  }

  return {
    requestId,
    message: String(error),
    code: "unknown",
  };
}

export function isError(
  error: unknown,
): { code: string; message: string } | false {
  if (!error) return false;
  if (!axios.isAxiosError(error)) return false;
  if (typeof error.response?.data !== "object") return false;

  const { data } = error.response;

  return {
    code: data.error?.code || "UNKNOWN_ERROR",
    message: data.error?.message || "An unknown error occurred",
  };
}
