import { logger } from "./logger";

export class ProviderError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = this.setCode(code, message);
  }

  setCode(code: string, message: string) {
    // Google Calendar specific error handling
    if (message.includes("The requested identifier already exists")) {
      return "duplicate_identifier";
    }
    if (message.includes("Sync token is no longer valid")) {
      return "sync_token_invalid";
    }
    if (
      message.includes(
        "The requested minimum modification time lies too far in the past",
      )
    ) {
      return "updated_min_too_old";
    }
    if (message.includes("User Rate Limit Exceeded")) {
      return "rate_limit_exceeded";
    }
    if (message.includes("Calendar usage limits exceeded")) {
      return "usage_limit_exceeded";
    }
    if (
      message.includes("Shared properties can only be changed by the organizer")
    ) {
      return "forbidden_for_non_organizer";
    }

    // Generic error handling
    switch (code) {
      case "400":
        return "bad_request";
      case "401":
        return "invalid_credentials";
      case "403":
        return "forbidden";
      case "404":
        return "not_found";
      case "409":
        return "conflict";
      case "410":
        return "gone";
      case "412":
        return "precondition_failed";
      case "429":
        return "rate_limit_exceeded";
      case "500":
        return "backend_error";
      default:
        return "unknown_error";
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
): { message: string; code: string } | null {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as any).code || "unknown",
    };
  }
  return null;
}
