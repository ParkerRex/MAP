import "server-only";
import { db } from "./index";
import * as schema from "./schema";
import { DEV_USER, DEV_SESSION, DEV_USER_ID } from "./dev-user";

export { db, schema, DEV_USER, DEV_SESSION, DEV_USER_ID };

// Dev mode createClient for server-side usage
export const createClient = () => {
  return {
    db,
    schema,
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
