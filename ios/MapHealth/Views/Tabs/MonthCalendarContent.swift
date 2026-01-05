import MapHealthCore
import SwiftUI

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
        .simultaneousGesture(monthSwipeGesture)
        .offset(x: dragOffset)
    }

    private var monthGrid: some View {
        VStack(spacing: 8) {
            HStack(spacing: 2) {
                ForEach(calendar.shortWeekdaySymbols, id: \.self) { symbol in
                    Text(symbol.prefix(2).uppercased())
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }

            LazyVGrid(columns: columns, spacing: 2) {
                ForEach(monthDays, id: \.self) { date in
                    if let date {
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
        .mapHealthGlassSurface(cornerRadius: 16, tint: Color.accentColor.opacity(0.03))
    }

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

    private var monthSwipeGesture: some Gesture {
        DragGesture(minimumDistance: 50)
            .updating($dragOffset) { value, state, _ in
                let isHorizontal = abs(value.translation.width) > abs(value.translation.height)
                state = isHorizontal ? value.translation.width * 0.1 : 0
            }
            .onEnded { value in
                let threshold: CGFloat = 60
                guard abs(value.translation.width) > abs(value.translation.height) else { return }
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
            return Color.accentColor
        } else if isToday {
            return Color.accentColor
        } else if !isCurrentMonth {
            return .secondary.opacity(0.4)
        } else {
            return .primary
        }
    }
}
