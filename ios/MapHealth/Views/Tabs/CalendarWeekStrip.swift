import MapHealthCore
import SwiftUI

// MARK: - Week Strip

struct CalendarWeekStrip: View {
    @Binding var selectedDate: Date
    let events: [CalendarEvent]
    let onDateDoubleTap: (Date) -> Void
    let showsHeader: Bool = true

    @State private var weekOffset: Int = 0
    @GestureState private var dragOffset: CGFloat = 0

    private let calendar = Calendar.current
    private let feedbackGenerator = UIImpactFeedbackGenerator(style: .light)

    var body: some View {
        VStack(spacing: 0) {
            if showsHeader {
                weekHeader
            }
            weekDaysRow
        }
        .gesture(weekSwipeGesture)
        .onAppear {
            feedbackGenerator.prepare()
        }
    }

    // MARK: - Week Header

    private var weekHeader: some View {
        HStack {
            Text(monthYearText)
                .font(.title3.weight(.semibold))
                .contentTransition(.numericText())

            Spacer()

            if !calendar.isDateInToday(selectedDate) {
                Button {
                    withAnimation(.snappy(duration: 0.3)) {
                        selectedDate = Date()
                        weekOffset = 0
                    }
                    feedbackGenerator.impactOccurred()
                } label: {
                    Text("Today")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(Color.accentColor)
                }
                .transition(.opacity.combined(with: .scale(scale: 0.8)))
            }
        }
        .padding(.horizontal, 4)
        .padding(.bottom, 12)
        .animation(.snappy(duration: 0.2), value: selectedDate)
    }

    // MARK: - Week Days Row

    private var weekDaysRow: some View {
        HStack(spacing: 0) {
            ForEach(currentWeekDays, id: \.self) { date in
                WeekDayCell(
                    date: date,
                    isToday: calendar.isDateInToday(date),
                    isSelected: calendar.isDate(date, inSameDayAs: selectedDate),
                    eventCount: eventCount(for: date),
                    eventColors: eventColors(for: date)
                )
                .onTapGesture {
                    selectDate(date)
                }
                .onTapGesture(count: 2) {
                    onDateDoubleTap(date)
                }
            }
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 4)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .accentColor.opacity(0.03))
        .offset(x: dragOffset)
    }

    // MARK: - Swipe Gesture

    private var weekSwipeGesture: some Gesture {
        DragGesture(minimumDistance: 20)
            .updating($dragOffset) { value, state, _ in
                state = value.translation.width * 0.3
            }
            .onEnded { value in
                let threshold: CGFloat = 50
                if value.translation.width > threshold {
                    navigateWeek(by: -1)
                } else if value.translation.width < -threshold {
                    navigateWeek(by: 1)
                }
            }
    }

    // MARK: - Helper Methods

    private func selectDate(_ date: Date) {
        guard !calendar.isDate(date, inSameDayAs: selectedDate) else { return }
        feedbackGenerator.impactOccurred()
        withAnimation(.snappy(duration: 0.2)) {
            selectedDate = date
        }
    }

    private func navigateWeek(by offset: Int) {
        feedbackGenerator.impactOccurred()
        withAnimation(.snappy(duration: 0.3)) {
            weekOffset += offset
            if let newDate = calendar.date(byAdding: .weekOfYear, value: offset, to: selectedDate) {
                selectedDate = newDate
            }
        }
    }

    private var currentWeekDays: [Date] {
        let weekStart = calendar.date(
            from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: selectedDate)
        )!
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: weekStart) }
    }

    private var monthYearText: String {
        selectedDate.formatted(.dateTime.month(.wide).year())
    }

    private func eventCount(for date: Date) -> Int {
        events.filter { event in
            guard let startDate = event.startDate else { return false }
            return calendar.isDate(startDate, inSameDayAs: date)
        }.count
    }

    private func eventColors(for date: Date) -> [Color] {
        let dayEvents = events.filter { event in
            guard let startDate = event.startDate else { return false }
            return calendar.isDate(startDate, inSameDayAs: date)
        }
        return Array(Set(dayEvents.compactMap { googleCalendarColor(for: $0.colorId) })).prefix(3).map { $0 }
    }
}

// MARK: - Week Day Cell

struct WeekDayCell: View {
    let date: Date
    let isToday: Bool
    let isSelected: Bool
    let eventCount: Int
    let eventColors: [Color]

    private let calendar = Calendar.current

    var body: some View {
        VStack(spacing: 6) {
            Text(date.formatted(.dateTime.weekday(.short)).uppercased())
                .font(.caption2.weight(.medium))
                .foregroundStyle(isToday ? Color.accentColor : Color.secondary)

            ZStack {
                if isSelected {
                    Circle()
                        .fill(isToday ? Color.accentColor : Color.accentColor.opacity(0.15))
                        .frame(width: 36, height: 36)
                } else if isToday {
                    Circle()
                        .strokeBorder(Color.accentColor, lineWidth: 2)
                        .frame(width: 36, height: 36)
                }

                Text(date.formatted(.dateTime.day()))
                    .font(.body.weight(isToday || isSelected ? .semibold : .regular))
                    .foregroundStyle(textColor)
            }
            .frame(width: 36, height: 36)

            eventIndicators
        }
        .frame(maxWidth: .infinity)
        .contentShape(Rectangle())
    }

    private var textColor: Color {
        if isSelected && isToday {
            return .white
        } else if isSelected {
            return .accentColor
        } else if isToday {
            return .accentColor
        } else {
            return .primary
        }
    }

    @ViewBuilder
    private var eventIndicators: some View {
        if eventCount > 0 {
            HStack(spacing: 3) {
                if eventColors.isEmpty {
                    ForEach(0..<min(eventCount, 3), id: \.self) { _ in
                        Circle()
                            .fill(Color.accentColor)
                            .frame(width: 5, height: 5)
                    }
                } else {
                    ForEach(0..<min(eventColors.count, 3), id: \.self) { index in
                        Circle()
                            .fill(eventColors[index])
                            .frame(width: 5, height: 5)
                    }
                }
            }
            .frame(height: 5)
        } else {
            Color.clear.frame(height: 5)
        }
    }
}

#Preview {
    CalendarWeekStrip(
        selectedDate: .constant(Date()),
        events: [],
        onDateDoubleTap: { _ in }
    )
    .padding()
}
