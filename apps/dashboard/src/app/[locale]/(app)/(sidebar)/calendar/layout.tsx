import ContextPanel from "@/components/calendar/calendar-context-panel";
import CalendarMenu from "@/components/calendar/calendar-menu";
import { CalendarProvider } from "@/store/calendar-context";
import { createClient } from "@map/supabase/server";
import { redirect } from "next/navigation";

export default async function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Failed to get user:", userError);
    return redirect("/login");
  }

  return (
    <CalendarProvider userId={user.id}>
      <div className="flex h-screen w-screen overflow-hidden">
        <CalendarMenu className="flex-none w-64" />
        <main className="flex flex-col flex-grow overflow-hidden">
          {children}
        </main>
        <ContextPanel className="flex-none w-64" />
      </div>
    </CalendarProvider>
  );
}
