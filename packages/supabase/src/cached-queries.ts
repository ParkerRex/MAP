import { db, schema } from "./db";
import { DEV_USER } from "./dev-user";
import { eq } from "drizzle-orm";

export async function getUser(userId?: string) {
	const targetUserId = userId || DEV_USER.id;

	const result = await db
		.select()
		.from(schema.users)
		.where(eq(schema.users.id, targetUserId))
		.limit(1);

	if (result.length === 0) {
		return DEV_USER; // Return dev user as fallback
	}

	return result[0];
}
