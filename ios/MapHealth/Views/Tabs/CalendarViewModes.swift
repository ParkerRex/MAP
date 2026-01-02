import MapHealthCore
import SwiftUI

// MARK: - View Mode

enum CalendarViewMode: String, CaseIterable {
    case day = "Day"
    case week = "Week"
    case month = "Month"
}

// MARK: - Day Calendar View

struct DayCalendarView: View {
    @Binding var selectedDate: Date
    @ObservedObject var calendarService: CalendarService
    let onEventTap: (CalendarEvent) -> Void
    let onEventDelete: (CalendarEvent) -> Void
    let onCreateEvent: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            DatePicker(
                "Select Date",
                selection: $selectedDate,
                displayedComponents: .date
            )
            .datePickerStyle(.graphical)
            .mapHealthGlassSurface(cornerRadius: 20, tint: .accentColor.opacity(0.04))

            eventsSection
        }
    }

    private var eventsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(selectedDate.formatted(.dateTime.weekday(.wide).month(.wide).day()))
                    .font(.headline)
                    .foregroundStyle(.secondary)

                Spacer()

                if calendarService.isLoading {
                    TypingIndicator()
                }
            }

            if let error = calendarService.error {
                CalendarErrorView(message: error.localizedDescription)
            } else if calendarService.isLoading && eventsForDay.isEmpty {
                SkeletonCalendarList(count: 3)
            } else if eventsForDay.isEmpty {
                CalendarEmptyStateView(onCreateEvent: onCreateEvent)
            } else {
                VStack(spacing: 12) {
                    if !allDayEvents.isEmpty {
                        CalendarSectionHeader(title: "All-day")
                            .padding(.leading, 4)
                        VStack(spacing: 8) {
                            ForEach(allDayEvents) { event in
                                CalendarEventRow(
                                    event: event,
                                    calendarService: calendarService,
                                    onTap: { onEventTap(event) },
                                    onDelete: { onEventDelete(event) }
                                )
                            }
                        }
                    }

                    if !timedEvents.isEmpty {
                        CalendarSectionHeader(title: "Scheduled")
                            .padding(.leading, 4)
                        VStack(spacing: 8) {
                            ForEach(timedEvents) { event in
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
            }
        }
        .animation(.easeInOut(duration: 0.25), value: calendarService.isLoading)
    }

    private var eventsForDay: [CalendarEvent] {
        let calendar = Calendar.current
        let events = calendarService.events.filter { event in
            guard let startDate = event.startDate else { return false }
            return calendar.isDate(startDate, inSameDayAs: selectedDate)
        }
        return sortEvents(events)
    }

    private var allDayEvents: [CalendarEvent] {
        eventsForDay.filter { $0.isAllDay }
    }

    private var timedEvents: [CalendarEvent] {
        eventsForDay.filter { !$0.isAllDay }
    }

    private func sortEvents(_ events: [CalendarEvent]) -> [CalendarEvent] {
        events.sorted { lhs, rhs in
            if lhs.isAllDay != rhs.isAllDay {
                return lhs.isAllDay && !rhs.isAllDay
            }
            let lhsDate = lhs.startDate ?? .distantPast
            let rhsDate = rhs.startDate ?? .distantPast
            if lhsDate != rhsDate {
                return lhsDate < rhsDate
            }
            return (lhs.summary ?? "") < (rhs.summary ?? "")
        }
    }
}

// MARK: - Week Calendar View

struct WeekCalendarView: View {
    @Binding var selectedDate: Date
    @ObservedObject var calendarService: CalendarService
    let onEventTap: (CalendarEvent) -> Void
    let onEventDelete: (CalendarEvent) -> Void
    let onCreateEvent: () -> Void

    private let calendar = Calendar.current

    var body: some View {
        VStack(spacing: 16) {
            weekNavigationHeader
            weekDayHeaders

            if let error = calendarService.error {
                CalendarErrorView(message: error.localizedDescription)
            } else if calendarService.isLoading && calendarService.events.isEmpty {
                SkeletonCalendarList(count: 4)
            } else if calendarService.events.isEmpty {
                CalendarEmptyStateView(onCreateEvent: onCreateEvent)
            } else {
                weekEventsGrid
            }
        }
        .animation(.easeInOut(duration: 0.25), value: calendarService.isLoading)
    }

    private var weekNavigationHeader: some View {
        HStack {
            Button {
                withAnimation {
                    selectedDate = calendar.date(byAdding: .weekOfYear, value: -1, to: selectedDate) ?? selectedDate
                }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.title3.weight(.semibold))
            }

            Spacer()

            VStack(spacing: 4) {
                Text(weekRangeText)
                    .font(.headline)
                if calendarService.isLoading {
                    TypingIndicator()
                }
            }

            Spacer()

            Button {
                withAnimation {
                    selectedDate = calendar.date(byAdding: .weekOfYear, value: 1, to: selectedDate) ?? selectedDate
                }
            } label: {
                Image(systemName: "chevron.right")
                    .font(.title3.weight(.semibold))
            }
        }
        .padding(.horizontal, 8)
    }

    private var weekRangeText: String {
        let weekStart = calendar.date(
            from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: selectedDate)
        )!
        let weekEnd = calendar.date(byAdding: .day, value: 6, to: weekStart)!

        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return "\(formatter.string(from: weekStart)) - \(formatter.string(from: weekEnd))"
    }

    private var weekDayHeaders: some View {
        HStack(spacing: 4) {
            ForEach(weekDays, id: \.self) { date in
                VStack(spacing: 4) {
                    Text(date.formatted(.dateTime.weekday(.narrow)))
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(.secondary)

                    Text(date.formatted(.dateTime.day()))
                        .font(.subheadline.weight(isToday(date) ? .bold : .regular))
                        .foregroundStyle(isToday(date) ? .white : .primary)
                        .frame(width: 28, height: 28)
                        .background {
                            if isToday(date) {
                                Circle().fill(Color.accentColor)
                            } else if isSelected(date) {
                                Circle().stroke(Color.accentColor, lineWidth: 2)
                            }
                        }

                    let count = eventsForDate(date).count
                    if count > 0 {
                        let dotColor = isToday(date) ? Color.white.opacity(0.9) : Color.accentColor
                        HStack(spacing: 2) {
                            if count <= 3 {
                                ForEach(0..<count, id: \.self) { _ in
                                    Circle()
                                        .fill(dotColor)
                                        .frame(width: 4, height: 4)
                                }
                            } else {
                                ForEach(0..<2, id: \.self) { _ in
                                    Circle()
                                        .fill(dotColor)
                                        .frame(width: 4, height: 4)
                                }
                                Text("+")
                                    .font(.caption2.weight(.semibold))
                                    .foregroundStyle(dotColor)
                                    .padding(.horizontal, 2)
                                    .padding(.vertical, 1)
                                    .background(
                                        Capsule()
                                            .stroke(dotColor.opacity(0.7), lineWidth: 1)
                                    )
                            }
                        }
                        .frame(height: 6)
                    } else {
                        Color.clear.frame(height: 6)
                    }
                }
                .frame(maxWidth: .infinity)
                .onTapGesture {
                    withAnimation { selectedDate = date }
                }
            }
        }
        .padding(.vertical, 8)
        .mapHealthGlassSurface(cornerRadius: 12, tint: .accentColor.opacity(0.04))
    }

    private var weekEventsGrid: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(weekDays, id: \.self) { date in
                let dayEvents = eventsForDate(date)
                if !dayEvents.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(date.formatted(.dateTime.weekday(.abbreviated).month(.abbreviated).day()))
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)
                            .padding(.leading, 4)

                        ForEach(dayEvents) { event in
                            CompactEventRow(
                                event: event,
                                calendarService: calendarService,
                                onTap: { onEventTap(event) },
                                onDelete: { onEventDelete(event) }
                            )
                        }
                    }
                }
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
        let events = calendarService.events.filter { event in
            guard let startDate = event.startDate else { return false }
            return calendar.isDate(startDate, inSameDayAs: date)
        }
        return sortEvents(events)
    }

    private func isToday(_ date: Date) -> Bool { calendar.isDateInToday(date) }
    private func isSelected(_ date: Date) -> Bool { calendar.isDate(date, inSameDayAs: selectedDate) }

    private func sortEvents(_ events: [CalendarEvent]) -> [CalendarEvent] {
        events.sorted { lhs, rhs in
            if lhs.isAllDay != rhs.isAllDay {
                return lhs.isAllDay && !rhs.isAllDay
            }
            let lhsDate = lhs.startDate ?? .distantPast
            let rhsDate = rhs.startDate ?? .distantPast
            if lhsDate != rhsDate {
                return lhsDate < rhsDate
            }
            return (lhs.summary ?? "") < (rhs.summary ?? "")
        }
    }
}

// MARK: - Month Calendar View

struct MonthCalendarView: View {
    @Binding var selectedDate: Date
    @ObservedObject var calendarService: CalendarService
    let onEventTap: (CalendarEvent) -> Void
    let onEventDelete: (CalendarEvent) -> Void
    let onCreateEvent: () -> Void

    private let calendar = Calendar.current
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)

    var body: some View {
        VStack(spacing: 16) {
            monthNavigationHeader
            monthCalendarGrid

            if let error = calendarService.error {
                CalendarErrorView(message: error.localizedDescription)
            } else {
                selectedDayEvents
            }
        }
    }

    private var monthNavigationHeader: some View {
        HStack {
            Button {
                withAnimation {
                    selectedDate = calendar.date(byAdding: .month, value: -1, to: selectedDate) ?? selectedDate
                }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.title3.weight(.semibold))
            }

            Spacer()

            VStack(spacing: 4) {
                Text(selectedDate.formatted(.dateTime.month(.wide).year()))
                    .font(.headline)
                if calendarService.isLoading {
                    TypingIndicator()
                }
            }

            Spacer()

            Button {
                withAnimation {
                    selectedDate = calendar.date(byAdding: .month, value: 1, to: selectedDate) ?? selectedDate
                }
            } label: {
                Image(systemName: "chevron.right")
                    .font(.title3.weight(.semibold))
            }
        }
        .padding(.horizontal, 8)
    }

    private var monthCalendarGrid: some View {
        VStack(spacing: 8) {
            HStack(spacing: 4) {
                ForEach(calendar.shortWeekdaySymbols, id: \.self) { symbol in
                    Text(symbol.prefix(1))
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }

            LazyVGrid(columns: columns, spacing: 4) {
                ForEach(monthDays, id: \.self) { date in
                    if let date = date {
                        MonthDayCell(
                            date: date,
                            isToday: calendar.isDateInToday(date),
                            isSelected: calendar.isDate(date, inSameDayAs: selectedDate),
                            isCurrentMonth: calendar.isDate(date, equalTo: selectedDate, toGranularity: .month),
                            eventCount: eventsForDate(date).count
                        )
                        .onTapGesture {
                            withAnimation { selectedDate = date }
                        }
                    } else {
                        Color.clear.frame(height: 40)
                    }
                }
            }
        }
        .padding(12)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .accentColor.opacity(0.04))
    }

    private var selectedDayEvents: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(selectedDate.formatted(.dateTime.weekday(.wide).month(.abbreviated).day()))
                    .font(.headline)
                    .foregroundStyle(.secondary)
                Spacer()
            }

            let dayEvents = eventsForDate(selectedDate)
            if calendarService.isLoading && dayEvents.isEmpty {
                SkeletonCalendarList(count: 2)
            } else if dayEvents.isEmpty {
                CalendarEmptyStateView(onCreateEvent: onCreateEvent)
            } else {
                VStack(spacing: 12) {
                    if !allDayEvents(for: selectedDate).isEmpty {
                        CalendarSectionHeader(title: "All-day")
                            .padding(.leading, 4)
                        VStack(spacing: 8) {
                            ForEach(allDayEvents(for: selectedDate)) { event in
                                CalendarEventRow(
                                    event: event,
                                    calendarService: calendarService,
                                    onTap: { onEventTap(event) },
                                    onDelete: { onEventDelete(event) }
                                )
                            }
                        }
                    }

                    if !timedEvents(for: selectedDate).isEmpty {
                        CalendarSectionHeader(title: "Scheduled")
                            .padding(.leading, 4)
                        VStack(spacing: 8) {
                            ForEach(timedEvents(for: selectedDate)) { event in
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
            }
        }
        .animation(.easeInOut(duration: 0.25), value: calendarService.isLoading)
    }

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
        let events = calendarService.events.filter { event in
            guard let startDate = event.startDate else { return false }
            return calendar.isDate(startDate, inSameDayAs: date)
        }
        return sortEvents(events)
    }

    private func allDayEvents(for date: Date) -> [CalendarEvent] {
        eventsForDate(date).filter { $0.isAllDay }
    }

    private func timedEvents(for date: Date) -> [CalendarEvent] {
        eventsForDate(date).filter { !$0.isAllDay }
    }

    private func sortEvents(_ events: [CalendarEvent]) -> [CalendarEvent] {
        events.sorted { lhs, rhs in
            if lhs.isAllDay != rhs.isAllDay {
                return lhs.isAllDay && !rhs.isAllDay
            }
            let lhsDate = lhs.startDate ?? .distantPast
            let rhsDate = rhs.startDate ?? .distantPast
            if lhsDate != rhsDate {
                return lhsDate < rhsDate
            }
            return (lhs.summary ?? "") < (rhs.summary ?? "")
        }
    }
}

// MARK: - Month Day Cell

struct MonthDayCell: View {
    let date: Date
    let isToday: Bool
    let isSelected: Bool
    let isCurrentMonth: Bool
    let eventCount: Int

    var body: some View {
        VStack(spacing: 2) {
            Text(date.formatted(.dateTime.day()))
                .font(.subheadline.weight(isToday ? .bold : .regular))
                .foregroundStyle(textColor)

            if eventCount > 0 {
                HStack(spacing: 2) {
                    ForEach(0..<min(eventCount, 3), id: \.self) { _ in
                        Circle()
                            .fill(Color.accentColor)
                            .frame(width: 4, height: 4)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: 40)
        .background {
            if isToday {
                Circle().fill(Color.accentColor).frame(width: 32, height: 32)
            } else if isSelected {
                Circle().stroke(Color.accentColor, lineWidth: 2).frame(width: 32, height: 32)
            }
        }
    }

    private var textColor: Color {
        if isToday {
            return .white
        } else if !isCurrentMonth {
            return .secondary.opacity(0.5)
        } else {
            return .primary
        }
    }
}
