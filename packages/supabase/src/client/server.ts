import "server-only";
import { db } from "../db";
import * as schema from "../db/schema";
import { DEV_USER, DEV_SESSION } from "../dev-user";

// Export Drizzle db and schema for direct queries
export { db, schema };

// Export dev user/session for auth bypass
export { DEV_USER, DEV_SESSION };

// Legacy createClient for gradual migration - returns db + auth helpers
export const createClient = () => {
	return {
		db,
		schema,
		// Mock auth that always returns dev session
		auth: {
			getSession: async () => ({
				data: { session: DEV_SESSION },
				error: null,
			}),
			getUser: async () => ({
				data: { user: DEV_SESSION.user },
				error: null,
			}),
		},
	};
};
