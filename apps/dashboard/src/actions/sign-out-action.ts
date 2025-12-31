"use server";
// TODO: Full_name?
import { getSession } from "@/lib/db/cached-queries";
import { createClient } from "@/lib/db/server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export async function signOutAction() {
  const supabase = createClient();
  const {
    data: { session },
  } = await getSession();

  await supabase.auth.signOut({
    scope: "local",
  });

  revalidateTag(`user_${session?.user.id}`);

  return redirect("/login");
}
