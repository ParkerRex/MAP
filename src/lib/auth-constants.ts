// Dev user constants - can be imported from both client and server
export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export const DEV_USER = {
  id: DEV_USER_ID,
  email: "dev@localhost",
  full_name: "Dev User",
  avatar_url: null,
} as const;

export type User = typeof DEV_USER;
