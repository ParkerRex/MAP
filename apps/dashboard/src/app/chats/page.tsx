import { createClient } from "@map/supabase/server";
import { redirect } from "next/navigation";
import { ChatLayout } from "./components/chat-layout";

export default async function Chats() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <main
      className="flex w-full h-screen flex-col items-center justify-center p-4
  pb-20 gap-4 bg-background dark:bg-dark-background"
    >
      <div className="z-10 border rounded-lg max-w-5xl w-full h-full text-sm lg:flex">
        <ChatLayout />
      </div>

      <div className="flex justify-between max-w-5xl w-full items-start text-xs md:text-sm text-muted-foreground " />
    </main>
  );
}
