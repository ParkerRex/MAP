// Client-side stub for dev mode - auth is bypassed
// These methods are no-ops since we use a hardcoded dev user

export const createClient = () => {
	return {
		auth: {
			signInWithOAuth: async (_options: unknown) => {
				console.warn("[Dev Mode] OAuth sign-in is disabled. Using hardcoded dev user.");
				return { data: null, error: null };
			},
			signInWithOtp: async (_options: unknown) => {
				console.warn("[Dev Mode] OTP sign-in is disabled. Using hardcoded dev user.");
				return { data: null, error: null };
			},
			verifyOtp: async (_options: unknown) => {
				console.warn("[Dev Mode] OTP verification is disabled. Using hardcoded dev user.");
				return { data: null, error: null };
			},
			signOut: async () => {
				console.warn("[Dev Mode] Sign out is disabled.");
				return { error: null };
			},
			getSession: async () => {
				return { data: { session: null }, error: null };
			},
			getUser: async () => {
				return { data: { user: null }, error: null };
			},
			onAuthStateChange: (_callback: unknown) => {
				return { data: { subscription: { unsubscribe: () => {} } } };
			},
		},
		storage: {
			from: (_bucket: string) => ({
				upload: async (_path: string, _file: unknown) => {
					console.warn("[Dev Mode] Storage uploads are disabled.");
					return { data: null, error: null };
				},
				getPublicUrl: (path: string) => {
					return { data: { publicUrl: `/storage/${path}` } };
				},
			}),
		},
		channel: (_name: string) => ({
			on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
			subscribe: () => ({ unsubscribe: () => {} }),
		}),
	};
};
