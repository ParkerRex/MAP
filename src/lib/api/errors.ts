import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public code: string,
    public override message: string,
    public status: number = 500,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  REQUEST_FAILED: "REQUEST_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  // Log unexpected errors
  console.error("Unhandled error:", error);

  return NextResponse.json(
    {
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: "An unexpected error occurred",
      },
    },
    { status: 500 },
  );
}

// Helper functions for common errors
export function unauthorized(message = "Authentication required"): ApiError {
  return new ApiError(ErrorCodes.UNAUTHORIZED, message, 401);
}

export function forbidden(message = "Access denied"): ApiError {
  return new ApiError(ErrorCodes.FORBIDDEN, message, 403);
}

export function notFound(resource = "Resource"): ApiError {
  return new ApiError(ErrorCodes.NOT_FOUND, `${resource} not found`, 404);
}

export function badRequest(
  message: string,
  details?: Record<string, unknown>,
): ApiError {
  return new ApiError(ErrorCodes.BAD_REQUEST, message, 400, details);
}

export function validationError(
  message: string,
  details?: Record<string, unknown>,
): ApiError {
  return new ApiError(ErrorCodes.VALIDATION_ERROR, message, 400, details);
}

export function conflict(message: string): ApiError {
  return new ApiError(ErrorCodes.CONFLICT, message, 409);
}
