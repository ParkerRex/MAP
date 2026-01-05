import CoreLocation
import MapHealthCore
import SwiftUI

extension CalendarView {
    var eventsForSelectedDay: [CalendarEvent] {
        calendarService.events.filter { event in
            guard let startDate = event.startDate else { return false }
            return calendar.isDate(startDate, inSameDayAs: selectedDate)
        }
    }

    @MainActor
    func loadData() async {
        await calendarService.fetchCalendars()
        await calendarService.fetchColors()
        await loadEvents()
    }

    @MainActor
    func loadWeather(location: CLLocation) async {
        do {
            weather = try await WeatherService.shared.getCurrentWeather(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude
            )
        } catch {
            // Silently fail - weather is optional
        }
    }

    var eventsLoadToken: EventsLoadToken {
        EventsLoadToken(date: selectedDate, viewMode: viewMode)
    }

    struct EventsLoadToken: Hashable {
        let date: Date
        let viewMode: CalendarViewMode
    }

    func loadEvents() async {
        let (startDate, endDate) = dateRangeForViewMode()
        await calendarService.fetchEvents(from: startDate, to: endDate)
    }

    func dateRangeForViewMode() -> (start: Date, end: Date) {
        switch viewMode {
        case .day:
            let weekStart = calendar.date(
                from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: selectedDate)
            )!
            let weekEnd = calendar.date(byAdding: .day, value: 7, to: weekStart)!
            return (weekStart.startOfDay, weekEnd.endOfDay)

        case .week:
            let weekStart = calendar.date(
                from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: selectedDate)
            )!
            let weekEnd = calendar.date(byAdding: .day, value: 7, to: weekStart)!
            return (weekStart.startOfDay, weekEnd.endOfDay)

        case .month:
            let monthStart = calendar.date(
                from: calendar.dateComponents([.year, .month], from: selectedDate)
            )!
            let monthEnd = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: monthStart)!
            return (monthStart.startOfDay, monthEnd.endOfDay)
        }
    }

    func deleteEvent(_ event: CalendarEvent) async {
        do {
            try await calendarService.deleteEvent(event)
        } catch {
            // Error is shown via calendarService.error
        }
        eventToDelete = nil
    }

    func calendarColor(for calendar: CalendarInfo) -> Color {
        if let colors = calendarService.colorForCalendar(calendar) {
            return Color(hex: colors.background) ?? Color.accentColor
        }
        if let backgroundColor = calendar.backgroundColor {
            return Color(hex: backgroundColor) ?? Color.accentColor
        }
        return Color.accentColor
    }
}
