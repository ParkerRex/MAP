import { CalendarProvider } from "@/app/calendar/contexts/CalendarContext";
import { createClient } from "@map/supabase/server";
import { redirect } from "next/navigation";
import { InitialDataProvider } from "./InitialDataProvider";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return redirect("/login");
  }

  return (
    <InitialDataProvider userId={user.id}>
      <CalendarProvider userId={user.id}>{children}</CalendarProvider>
    </InitialDataProvider>
  );
}
