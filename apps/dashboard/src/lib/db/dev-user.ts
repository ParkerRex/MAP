// Dev user constants for local development without auth
// This user is seeded in the database via scripts/init.sql

export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export const DEV_USER = {
	id: DEV_USER_ID,
	email: "dev@localhost",
	display_name: "Dev User",
	first_name: "Dev",
	last_name: "User",
	status: "active",
	created_at: new Date().toISOString(),
	locale: null,
	profile_photo_url: null,
} as const;

export const DEV_SESSION = {
	access_token: "dev-access-token",
	token_type: "bearer",
	expires_in: 3600,
	expires_at: Math.floor(Date.now() / 1000) + 3600,
	refresh_token: "dev-refresh-token",
	user: {
		id: DEV_USER_ID,
		email: DEV_USER.email,
		aud: "authenticated",
		role: "authenticated",
		email_confirmed_at: new Date().toISOString(),
		phone: null,
		confirmed_at: new Date().toISOString(),
		last_sign_in_at: new Date().toISOString(),
		app_metadata: {
			provider: "google",
			providers: ["google"],
		},
		user_metadata: {
			full_name: DEV_USER.display_name,
			avatar_url: null,
			email: DEV_USER.email,
			email_verified: true,
			name: DEV_USER.display_name,
			preferred_username: "devuser",
			provider_id: "dev-provider-id",
			sub: DEV_USER_ID,
		},
		identities: [],
		created_at: DEV_USER.created_at,
		updated_at: DEV_USER.created_at,
	},
} as const;
