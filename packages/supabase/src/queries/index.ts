import { UTCDate } from "@date-fns/utc";
import type { Client } from "../types";
import { EMPTY_FOLDER_PLACEHOLDER_FILE_NAME } from "../utils/storage";

export async function getUserQuery(supabase: Client, userId: string) {
  return supabase
    .from("users")
    .select(
      `
      *
    `,
    )
    .eq("id", userId)
    .single()
    .throwOnError();
}
