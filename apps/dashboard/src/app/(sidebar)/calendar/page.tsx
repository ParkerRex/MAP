import ContextPanel from "@/components/calendar/calendar-context-panel";
import CalendarGrid from "@/components/calendar/calendar-grid";
import CalendarMenu from "@/components/calendar/calendar-menu";
import CalendarToolbar from "@/components/calendar/calendar-toolbar";
import { CalendarProvider, useCalendar } from "@/store/calendar-context";
import { DEV_USER } from "@/lib/db/server";

export default function CalendarPage() {
	return (
		<CalendarProvider userId={DEV_USER.id}>
			<div className="flex h-screen w-screen overflow-hidden">
				<CalendarMenu className="flex-none w-64" />
				<main className="flex flex-col flex-grow overflow-hidden">
					<CalendarContent />
				</main>
				<ContextPanel className="flex-none w-64" />
			</div>
		</CalendarProvider>
	);
}

function CalendarContent() {
	const { events, calendars, visibleCalendars } = useCalendar();

	const visibleEvents = events.filter((event) =>
		visibleCalendars.has(event.organizer?.email ?? ""),
	);

	return (
		<div className="flex flex-col h-full overflow-hidden">
			<CalendarToolbar calendars={calendars} />
			<CalendarGrid className="flex-grow overflow-hidden" calendars={calendars} events={visibleEvents} />
		</div>
	);
}
