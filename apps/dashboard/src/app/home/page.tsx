import { CalendarSyncService } from "@/services/CalendarSyncService";
import { createClient } from "@map/supabase/server";
import { redirect } from "next/navigation";
import HomePageClient from "./HomePageClient";
import { getUserId } from "./actions";

export default async function HomePage({
  searchParams: { currentDate },
}: {
  searchParams: { currentDate?: string };
}) {
  const userId = await getUserId();
  if (!userId) {
    return redirect("/login");
  }

  const supabase = createClient();
  const { data: syncJob } = await supabase
    .from("sync_job")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (
    !syncJob ||
    syncJob.status === "completed" ||
    syncJob.status === "error"
  ) {
    const calendarSyncService = new CalendarSyncService();
    await calendarSyncService.syncCalendar(userId);
  }

  const parsedDate = currentDate ? new Date(currentDate) : new Date();

  return (
    <HomePageClient
      userId={userId}
      initialDate={parsedDate}
      initialSyncStatus={syncJob?.status || "pending"}
    />
  );
}
