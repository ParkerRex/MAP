import { logger } from "@/utils/logger";
import { DEV_USER, db, schema } from "@/lib/db/server";
import { DEFAULT_SERVER_ERROR_MESSAGE, createSafeActionClient } from "next-safe-action";
import { headers } from "next/headers";
import { z } from "zod";

// Simple in-memory rate limiting for dev
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

async function rateLimit(key: string, limit = 10, windowSeconds = 10) {
	const now = Date.now();
	const entry = rateLimitMap.get(key);

	if (!entry || now > entry.resetAt) {
		rateLimitMap.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
		return { success: true, remaining: limit - 1 };
	}

	if (entry.count >= limit) {
		return { success: false, remaining: 0 };
	}

	entry.count++;
	return { success: true, remaining: limit - entry.count };
}

export const actionClient = createSafeActionClient({
	handleReturnedServerError(e) {
		if (e instanceof Error) {
			return e.message;
		}
		return DEFAULT_SERVER_ERROR_MESSAGE;
	},
});

export const actionClientWithMeta = createSafeActionClient({
	handleReturnedServerError(e) {
		if (e instanceof Error) {
			return e.message;
		}
		return DEFAULT_SERVER_ERROR_MESSAGE;
	},
	defineMetadataSchema() {
		return z.object({
			name: z.string(),
			track: z
				.object({
					event: z.string(),
					channel: z.string(),
				})
				.optional(),
		});
	},
});

export const authActionClient = actionClientWithMeta
	.use(async ({ next, clientInput, metadata }) => {
		const result = await next({ ctx: {} });

		if (process.env.NODE_ENV === "development") {
			logger("Input ->", clientInput);
			logger("Result ->", result.data);
			logger("Metadata ->", metadata);
		}

		return result;
	})
	.use(async ({ next, metadata }) => {
		const ip = headers().get("x-forwarded-for") || "localhost";

		const { success, remaining } = await rateLimit(`${ip}-${metadata.name}`);

		if (!success) {
			throw new Error("Too many requests");
		}

		return next({
			ctx: {
				ratelimit: {
					remaining,
				},
			},
		});
	})
	.use(async ({ next }) => {
		// In dev mode, always use dev user - no auth check
		return next({
			ctx: {
				db,
				schema,
				user: DEV_USER,
			},
		});
	});
