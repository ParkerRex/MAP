import MapHealthCore
import SwiftUI

struct CalendarTimelineView: View {
    let events: [CalendarEvent]
    let calendarService: CalendarService
    let selectedDate: Date
    let onEventTap: (CalendarEvent) -> Void
    let onEventDelete: (CalendarEvent) -> Void
    let onCreateEvent: () -> Void
    let onCreateEventAt: (Date) -> Void
    let onCreateAllDay: () -> Void

    @State var currentTimeOffset: CGFloat = 0
    @State var scrollRequest: Int = 0
    let hourHeight: CGFloat = 60
    let calendar = Calendar.current
    let timelineLeadingInset: CGFloat = 56
    let timelineTrailingInset: CGFloat = 8
    let timelineColumnSpacing: CGFloat = 6
    let lightFeedbackGenerator = UIImpactFeedbackGenerator(style: .light)
    let mediumFeedbackGenerator = UIImpactFeedbackGenerator(style: .medium)
}
