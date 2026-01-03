import MapHealthCore
import SwiftUI

// MARK: - View Mode

enum CalendarViewMode: String, CaseIterable {
    case day = "Day"
    case week = "Week"
    case month = "Month"
}

// MARK: - Week Calendar Content

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
        .gesture(weekSwipeGesture)
        .offset(x: dragOffset)
        .animation(.easeInOut(duration: 0.2), value: calendarService.isLoading)
    }

    // MARK: - Week Events Content

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

    // MARK: - Swipe Gesture

    private var weekSwipeGesture: some Gesture {
        DragGesture(minimumDistance: 40)
            .updating($dragOffset) { value, state, _ in
                state = value.translation.width * 0.15
            }
            .onEnded { value in
                let threshold: CGFloat = 60
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

    // MARK: - Helpers

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

// MARK: - Week Day Section

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
            // Day header
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
                            .foregroundStyle(.white)
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

            // Events
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
            tint: isSelected ? .accentColor.opacity(0.06) : .accentColor.opacity(0.02)
        )
    }
}

// MARK: - Compact Event Card

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
            return Color(hex: colors.background) ?? .accentColor
        }
        return googleCalendarColor(for: event.colorId)
    }
}

// MARK: - Month Calendar Content

struct MonthCalendarContent: View {
    @Binding var selectedDate: Date
    @ObservedObject var calendarService: CalendarService
    let onEventTap: (CalendarEvent) -> Void
    let onEventDelete: (CalendarEvent) -> Void
    let onCreateEvent: () -> Void

    @GestureState private var dragOffset: CGFloat = 0
    private let calendar = Calendar.current
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 2), count: 7)
    private let feedbackGenerator = UIImpactFeedbackGenerator(style: .medium)

    var body: some View {
        VStack(spacing: 16) {
            monthGrid

            Divider()

            selectedDayEvents
        }
        .gesture(monthSwipeGesture)
        .offset(x: dragOffset)
    }

    // MARK: - Month Grid

    private var monthGrid: some View {
        VStack(spacing: 8) {
            // Weekday headers
            HStack(spacing: 2) {
                ForEach(calendar.shortWeekdaySymbols, id: \.self) { symbol in
                    Text(symbol.prefix(2).uppercased())
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }

            // Calendar grid
            LazyVGrid(columns: columns, spacing: 2) {
                ForEach(monthDays, id: \.self) { date in
                    if let date = date {
                        MonthDayCell(
                            date: date,
                            isToday: calendar.isDateInToday(date),
                            isSelected: calendar.isDate(date, inSameDayAs: selectedDate),
                            isCurrentMonth: calendar.isDate(date, equalTo: selectedDate, toGranularity: .month),
                            eventCount: eventsForDate(date).count,
                            eventColors: eventColors(for: date)
                        )
                        .onTapGesture {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
                            withAnimation(.snappy(duration: 0.2)) {
                                selectedDate = date
                            }
                        }
                    } else {
                        Color.clear.frame(height: 48)
                    }
                }
            }
        }
        .padding(14)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .accentColor.opacity(0.03))
    }

    // MARK: - Selected Day Events

    private var selectedDayEvents: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(selectedDate.formatted(.dateTime.weekday(.wide).month(.abbreviated).day()))
                    .font(.headline)

                if calendar.isDateInToday(selectedDate) {
                    Text("TODAY")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color.accentColor)
                        .clipShape(Capsule())
                }

                Spacer()

                if calendarService.isLoading {
                    TypingIndicator()
                }
            }

            let dayEvents = eventsForDate(selectedDate)

            if let error = calendarService.error {
                CalendarErrorView(message: error.localizedDescription)
            } else if calendarService.isLoading && dayEvents.isEmpty {
                SkeletonCalendarList(count: 2)
            } else if dayEvents.isEmpty {
                emptyDayState
            } else {
                VStack(spacing: 8) {
                    ForEach(dayEvents) { event in
                        CalendarEventRow(
                            event: event,
                            calendarService: calendarService,
                            onTap: { onEventTap(event) },
                            onDelete: { onEventDelete(event) }
                        )
                    }
                }
            }
        }
        .animation(.easeInOut(duration: 0.2), value: calendarService.isLoading)
    }

    private var emptyDayState: some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.badge.plus")
                .font(.title2)
                .foregroundStyle(.tertiary)

            Text("No events")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Button {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                onCreateEvent()
            } label: {
                Text("Add Event")
                    .font(.subheadline.weight(.medium))
            }
            .mapHealthGlassButtonStyle()
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
    }

    // MARK: - Swipe Gesture

    private var monthSwipeGesture: some Gesture {
        DragGesture(minimumDistance: 50)
            .updating($dragOffset) { value, state, _ in
                state = value.translation.width * 0.1
            }
            .onEnded { value in
                let threshold: CGFloat = 60
                if value.translation.width > threshold {
                    navigateMonth(by: -1)
                } else if value.translation.width < -threshold {
                    navigateMonth(by: 1)
                }
            }
    }

    private func navigateMonth(by offset: Int) {
        feedbackGenerator.impactOccurred()
        withAnimation(.snappy(duration: 0.3)) {
            if let newDate = calendar.date(byAdding: .month, value: offset, to: selectedDate) {
                selectedDate = newDate
            }
        }
    }

    // MARK: - Helpers

    private var monthDays: [Date?] {
        let monthStart = calendar.date(from: calendar.dateComponents([.year, .month], from: selectedDate))!
        let monthEnd = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: monthStart)!

        let firstWeekday = calendar.component(.weekday, from: monthStart)
        let leadingEmptyDays = firstWeekday - calendar.firstWeekday
        let adjustedLeadingDays = leadingEmptyDays < 0 ? leadingEmptyDays + 7 : leadingEmptyDays
        let daysInMonth = calendar.component(.day, from: monthEnd)

        var days: [Date?] = Array(repeating: nil, count: adjustedLeadingDays)

        for day in 1...daysInMonth {
            if let date = calendar.date(bySetting: .day, value: day, of: monthStart) {
                days.append(date)
            }
        }

        let remainder = days.count % 7
        if remainder > 0 {
            days.append(contentsOf: Array(repeating: nil as Date?, count: 7 - remainder))
        }

        return days
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

    private func eventColors(for date: Date) -> [Color] {
        let dayEvents = eventsForDate(date)
        return Array(Set(dayEvents.compactMap { event -> Color? in
            if let colors = calendarService.colorForEvent(event) {
                return Color(hex: colors.background)
            }
            return googleCalendarColor(for: event.colorId)
        })).prefix(3).map { $0 }
    }
}

// MARK: - Month Day Cell

struct MonthDayCell: View {
    let date: Date
    let isToday: Bool
    let isSelected: Bool
    let isCurrentMonth: Bool
    let eventCount: Int
    let eventColors: [Color]

    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                if isSelected {
                    Circle()
                        .fill(isToday ? Color.accentColor : Color.accentColor.opacity(0.15))
                        .frame(width: 32, height: 32)
                } else if isToday {
                    Circle()
                        .strokeBorder(Color.accentColor, lineWidth: 2)
                        .frame(width: 32, height: 32)
                }

                Text(date.formatted(.dateTime.day()))
                    .font(.subheadline.weight(isToday || isSelected ? .semibold : .regular))
                    .foregroundStyle(textColor)
            }
            .frame(width: 32, height: 32)

            // Event indicators with colors
            if eventCount > 0 {
                HStack(spacing: 2) {
                    if eventColors.isEmpty {
                        ForEach(0..<min(eventCount, 3), id: \.self) { _ in
                            Circle()
                                .fill(Color.accentColor)
                                .frame(width: 4, height: 4)
                        }
                    } else {
                        ForEach(0..<min(eventColors.count, 3), id: \.self) { index in
                            Circle()
                                .fill(eventColors[index])
                                .frame(width: 4, height: 4)
                        }
                    }
                    if eventCount > 3 {
                        Text("+")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(height: 4)
            } else {
                Color.clear.frame(height: 4)
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: 48)
        .contentShape(Rectangle())
    }

    private var textColor: Color {
        if isSelected && isToday {
            return .white
        } else if isSelected {
            return .accentColor
        } else if isToday {
            return .accentColor
        } else if !isCurrentMonth {
            return .secondary.opacity(0.4)
        } else {
            return .primary
        }
    }
}
