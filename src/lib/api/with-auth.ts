import { NextResponse, type NextRequest } from "next/server";
import { getUser, type User } from "@/lib/auth";
import { handleApiError, unauthorized } from "./errors";

type RouteContext = { params: Promise<Record<string, string>> };

/**
 * Wrapper for authenticated API route handlers.
 * Handles auth check and error handling automatically.
 *
 * @example
 * // GET /api/tasks
 * export const GET = withAuth(async (user) => {
 *   const tasks = await tasksDb.getTasks(user.id);
 *   return { tasks };
 * });
 *
 * @example
 * // POST /api/tasks (with request body)
 * export const POST = withAuth(async (user, request) => {
 *   const body = await request.json();
 *   const task = await tasksDb.createTask({ ...body, userId: user.id });
 *   return { task };
 * });
 *
 * @example
 * // GET /api/tasks/[taskId] (with params)
 * export const GET = withAuth(async (user, request, { params }) => {
 *   const { taskId } = await params;
 *   const task = await tasksDb.getTask(taskId, user.id);
 *   return { task };
 * });
 */
export function withAuth<T>(
  handler: (
    user: User,
    request: NextRequest,
    context: RouteContext,
  ) => Promise<T>,
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      const user = await getUser();
      if (!user) {
        throw unauthorized();
      }

      const result = await handler(user, request, context);
      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Wrapper for public API routes (no auth required).
 * Still handles error handling automatically.
 */
export function withPublic<T>(
  handler: (request: NextRequest, context: RouteContext) => Promise<T>,
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      const result = await handler(request, context);
      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
