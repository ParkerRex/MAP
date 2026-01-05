import MapHealthCore
import SwiftUI

struct WeekCalendarContent: View {
    @Binding var selectedDate: Date
    @ObservedObject var calendarService: CalendarService
    let onEventTap: (CalendarEvent) -> Void
    let onEventDelete: (CalendarEvent) -> Void
    let onCreateEvent: () -> Void

    @GestureState private var dragOffset: CGFloat = 0
    private let calendar = Calendar.current
    private let feedbackGenerator = UIImpactFeedbackGenerator(style: .medium)

    var body: some View {
        VStack(spacing: 16) {
            if let error = calendarService.error {
                CalendarErrorView(message: error.localizedDescription)
            } else if calendarService.isLoading && calendarService.events.isEmpty {
                SkeletonCalendarList(count: 5)
            } else if calendarService.events.isEmpty {
                CalendarTimelineEmptyState(
                    selectedDate: selectedDate,
                    onCreateEvent: onCreateEvent
                )
            } else {
                weekEventsContent
            }
        }
        .simultaneousGesture(weekSwipeGesture)
        .offset(x: dragOffset)
        .animation(.easeInOut(duration: 0.2), value: calendarService.isLoading)
    }

    private var weekEventsContent: some View {
        VStack(alignment: .leading, spacing: 20) {
            ForEach(weekDays, id: \.self) { date in
                let dayEvents = eventsForDate(date)
                if !dayEvents.isEmpty {
                    WeekDaySection(
                        date: date,
                        events: dayEvents,
                        calendarService: calendarService,
                        isToday: calendar.isDateInToday(date),
                        isSelected: calendar.isDate(date, inSameDayAs: selectedDate),
                        onEventTap: onEventTap,
                        onEventDelete: onEventDelete,
                        onSelectDate: {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            withAnimation(.snappy(duration: 0.2)) {
                                selectedDate = date
                            }
                        }
                    )
                }
            }

            if weekDays.allSatisfy({ eventsForDate($0).isEmpty }) {
                CalendarTimelineEmptyState(
                    selectedDate: selectedDate,
                    onCreateEvent: onCreateEvent
                )
            }
        }
    }

    private var weekSwipeGesture: some Gesture {
        DragGesture(minimumDistance: 40)
            .updating($dragOffset) { value, state, _ in
                let isHorizontal = abs(value.translation.width) > abs(value.translation.height)
                state = isHorizontal ? value.translation.width * 0.15 : 0
            }
            .onEnded { value in
                let threshold: CGFloat = 60
                guard abs(value.translation.width) > abs(value.translation.height) else { return }
                if value.translation.width > threshold {
                    navigateWeek(by: -1)
                } else if value.translation.width < -threshold {
                    navigateWeek(by: 1)
                }
            }
    }

    private func navigateWeek(by offset: Int) {
        feedbackGenerator.impactOccurred()
        withAnimation(.snappy(duration: 0.3)) {
            if let newDate = calendar.date(byAdding: .weekOfYear, value: offset, to: selectedDate) {
                selectedDate = newDate
            }
        }
    }

    private var weekDays: [Date] {
        let weekStart = calendar.date(
            from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: selectedDate)
        )!
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: weekStart) }
    }

    private func eventsForDate(_ date: Date) -> [CalendarEvent] {
        calendarService.events.filter { event in
            guard let startDate = event.startDate else { return false }
            return calendar.isDate(startDate, inSameDayAs: date)
        }.sorted { lhs, rhs in
            if lhs.isAllDay != rhs.isAllDay { return lhs.isAllDay }
            return (lhs.startDate ?? .distantPast) < (rhs.startDate ?? .distantPast)
        }
    }
}

struct WeekDaySection: View {
    let date: Date
    let events: [CalendarEvent]
    let calendarService: CalendarService
    let isToday: Bool
    let isSelected: Bool
    let onEventTap: (CalendarEvent) -> Void
    let onEventDelete: (CalendarEvent) -> Void
    let onSelectDate: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Button(action: onSelectDate) {
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(date.formatted(.dateTime.weekday(.wide)))
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(isToday ? Color.accentColor : Color.primary)

                        Text(date.formatted(.dateTime.month(.abbreviated).day()))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    if isToday {
                        Text("TODAY")
                            .font(.caption2.weight(.bold))
                            .foregroundStyle(Color.black)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Color.accentColor)
                            .clipShape(Capsule())
                    }

                    Spacer()

                    Text("\(events.count)")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.secondary.opacity(0.1))
                        .clipShape(Capsule())
                }
            }
            .buttonStyle(.plain)

            VStack(spacing: 6) {
                ForEach(events) { event in
                    CompactEventCard(
                        event: event,
                        calendarService: calendarService,
                        onTap: { onEventTap(event) },
                        onDelete: { onEventDelete(event) }
                    )
                }
            }
        }
        .padding(14)
        .mapHealthGlassSurface(
            cornerRadius: 16,
            tint: isSelected ? Color.accentColor.opacity(0.06) : Color.accentColor.opacity(0.02)
        )
    }
}

struct CompactEventCard: View {
    let event: CalendarEvent
    let calendarService: CalendarService
    let onTap: () -> Void
    let onDelete: () -> Void

    private let feedbackGenerator = UIImpactFeedbackGenerator(style: .light)

    var body: some View {
        Button {
            feedbackGenerator.impactOccurred()
            onTap()
        } label: {
            HStack(spacing: 10) {
                Circle()
                    .fill(eventColor)
                    .frame(width: 8, height: 8)

                Text(event.summary ?? "Untitled")
                    .font(.subheadline)
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                Spacer()

                if event.hangoutLink != nil || event.conferenceData != nil {
                    Image(systemName: "video.fill")
                        .font(.caption2)
                        .foregroundStyle(eventColor)
                }

                Text(event.timeString)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(eventColor.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .buttonStyle(.plain)
        .contextMenu {
            Button { onTap() } label: {
                Label("View Details", systemImage: "info.circle")
            }

            if let link = event.hangoutLink ??
                event.conferenceData?.entryPoints?.first(where: { $0.entryPointType == "video" })?.uri,
               let url = URL(string: link) {
                Link(destination: url) {
                    Label("Join Video Call", systemImage: "video")
                }
            }

            Divider()

            Button(role: .destructive) { onDelete() } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }

    private var eventColor: Color {
        if let colors = calendarService.colorForEvent(event) {
            return Color(hex: colors.background) ?? Color.accentColor
        }
        return googleCalendarColor(for: event.colorId)
    }
}
