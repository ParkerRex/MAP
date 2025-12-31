// Browser client for dev mode
// In local development, we don't need real auth - just provide mock data

import { DEV_USER, DEV_SESSION } from "../dev-user";

export const createClient = () => {
	return {
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
			signOut: async () => ({ error: null }),
			signInWithOAuth: async () => ({ data: null, error: null }),
			onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
				// Immediately call with dev session
				callback("SIGNED_IN", DEV_SESSION);
				return {
					data: { subscription: { unsubscribe: () => {} } },
				};
			},
		},
	};
};
