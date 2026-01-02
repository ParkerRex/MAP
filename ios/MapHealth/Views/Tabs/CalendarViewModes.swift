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
                    ProgressView()
                        .scaleEffect(0.8)
                }
            }

            if let error = calendarService.error {
                CalendarErrorView(message: error.localizedDescription)
            } else if eventsForDay.isEmpty && !calendarService.isLoading {
                CalendarEmptyStateView(onCreateEvent: onCreateEvent)
            } else {
                VStack(spacing: 8) {
                    ForEach(eventsForDay) { event in
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

    private var eventsForDay: [CalendarEvent] {
        let calendar = Calendar.current
        return calendarService.events.filter { event in
            guard let startDate = event.startDate else { return false }
            return calendar.isDate(startDate, inSameDayAs: selectedDate)
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
            } else if calendarService.events.isEmpty && !calendarService.isLoading {
                CalendarEmptyStateView(onCreateEvent: onCreateEvent)
            } else {
                weekEventsGrid
            }
        }
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

            VStack(spacing: 2) {
                Text(weekRangeText)
                    .font(.headline)
                if calendarService.isLoading {
                    ProgressView()
                        .scaleEffect(0.6)
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
        calendarService.events.filter { event in
            guard let startDate = event.startDate else { return false }
            return calendar.isDate(startDate, inSameDayAs: date)
        }
    }

    private func isToday(_ date: Date) -> Bool { calendar.isDateInToday(date) }
    private func isSelected(_ date: Date) -> Bool { calendar.isDate(date, inSameDayAs: selectedDate) }
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

            VStack(spacing: 2) {
                Text(selectedDate.formatted(.dateTime.month(.wide).year()))
                    .font(.headline)
                if calendarService.isLoading {
                    ProgressView()
                        .scaleEffect(0.6)
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
            if dayEvents.isEmpty && !calendarService.isLoading {
                CalendarEmptyStateView(onCreateEvent: onCreateEvent)
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
        calendarService.events.filter { event in
            guard let startDate = event.startDate else { return false }
            return calendar.isDate(startDate, inSameDayAs: date)
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
