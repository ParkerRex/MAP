import ContextPanel from "@/components/calendar/calendar-context-panel";
import CalendarContent from "@/components/calendar/calendar-content";
import CalendarMenu from "@/components/calendar/calendar-menu";

export default function CalendarPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <CalendarMenu className="flex-none w-64" />
      <main className="flex flex-col flex-grow overflow-hidden">
        <CalendarContent />
      </main>
      <ContextPanel className="flex-none w-64" />
    </div>
  );
}
