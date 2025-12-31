import "server-only";
import { unstable_cache } from "next/cache";
import { DEV_USER, DEV_SESSION } from "./dev-user";

// In dev mode, we return the hardcoded dev user/session
// No actual caching needed since values are static

export const getSession = unstable_cache(
	async () => {
		return {
			data: {
				session: DEV_SESSION,
			},
			error: null,
		};
	},
	["session"],
	{
		tags: [`user_${DEV_USER.id}`],
		revalidate: 3600,
	},
);

export const getUser = unstable_cache(
	async () => {
		return {
			data: DEV_USER,
			error: null,
		};
	},
	["user"],
	{
		tags: [`user_${DEV_USER.id}`],
		revalidate: 3600,
	},
);
