import { CalendarProvider } from "@/app/calendar/contexts/CalendarContext";
import { createClient } from "@map/supabase/server";
import { redirect } from "next/navigation";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return {
    children,
  };
}
