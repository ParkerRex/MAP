"use server";

// TODO: Implement updateUser in @/lib/db/mutations
// import { updateUser } from "@/lib/db/mutations";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { authActionClient } from "./safe-action";
import { setupUserSchema } from "./schema";

export const setupUserAction = authActionClient
  .schema(setupUserSchema)
  .metadata({
    name: "setup-user",
  })
  .action(async ({ parsedInput: { full_name }, ctx: { user, supabase } }) => {
    await Promise.all([
      // Update supabase auth user
      supabase.auth.updateUser({
        data: { full_name },
      }),
      // Update our user in table
      updateUser(supabase, {
        full_name,
      }),
    ]);

    revalidateTag(`user_${user.id}`);
    redirect("/");
  });
