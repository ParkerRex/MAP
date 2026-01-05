import CoreLocation
import MapHealthCore
import SwiftUI

extension CalendarView {
    var calendarHUD: some View {
        VStack(spacing: 12) {
            headerRow
            controlsRow
            viewModePicker
        }
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .accentColor.opacity(0.04))
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 12)
    }

    private var headerRow: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text(selectedDate.formatted(.dateTime.weekday(.wide)))
                    .font(.title3.weight(.semibold))

                Text(selectedDate.formatted(.dateTime.month(.wide).day().year()))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)

                HStack(spacing: 8) {
                    if !calendar.isDateInToday(selectedDate) {
                        todayChip
                    }

                    eventCountChip
                }
            }

            Spacer()

            if let weather {
                weatherBadge(weather)
            }
        }
    }

    private var controlsRow: some View {
        HStack(spacing: 12) {
            calendarPickerButton
            Spacer()
            weekStripToggle
            jumpToDateButton
            addEventButton
        }
    }

    private var viewModePicker: some View {
        HStack(spacing: 0) {
            ForEach(CalendarViewMode.allCases, id: \.self) { mode in
                Button {
                    withAnimation(.snappy(duration: 0.2)) {
                        viewMode = mode
                    }
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                } label: {
                    Text(mode.rawValue)
                        .font(.subheadline.weight(viewMode == mode ? .semibold : .regular))
                        .foregroundStyle(viewMode == mode ? .primary : .secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background {
                            if viewMode == mode {
                                Capsule()
                                    .fill(Color.accentColor.opacity(0.12))
                                    .matchedGeometryEffect(id: "viewMode", in: viewModeNamespace)
                            }
                        }
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(Color.secondary.opacity(0.08))
        .clipShape(Capsule())
    }

    private var calendarPickerButton: some View {
        Button {
            feedbackGenerator.impactOccurred()
            showingCalendarPicker = true
        } label: {
            HStack(spacing: 6) {
                if let calendar = calendarService.primaryCalendar {
                    Circle()
                        .fill(calendarColor(for: calendar))
                        .frame(width: 10, height: 10)
                }
                Text(calendarPickerTitle)
                    .lineLimit(1)
                Image(systemName: "chevron.down")
                    .font(.caption2.weight(.semibold))
            }
            .font(.subheadline.weight(.medium))
            .foregroundStyle(.primary)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .mapHealthGlassSurface(cornerRadius: 14, tint: .primary.opacity(0.03))
        }
        .mapHealthPressable()
    }

    private var addEventButton: some View {
        Button {
            feedbackGenerator.impactOccurred()
            createEventStartDate = nil
            createEventIsAllDay = false
            showingCreateEvent = true
        } label: {
            Image(systemName: "plus")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)
                .padding(10)
                .mapHealthGlassSurface(cornerRadius: 12, tint: .primary.opacity(0.03))
        }
        .mapHealthPressable()
    }

    private var weekStripToggle: some View {
        Button {
            lightFeedbackGenerator.impactOccurred()
            withAnimation(.snappy(duration: 0.2)) {
                showWeekStrip.toggle()
            }
        } label: {
            Image(systemName: showWeekStrip ? "rectangle.compress.vertical" : "rectangle.expand.vertical")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
                .padding(10)
                .mapHealthGlassSurface(cornerRadius: 12, tint: .primary.opacity(0.03))
        }
        .mapHealthPressable()
    }

    private var todayChip: some View {
        Button {
            feedbackGenerator.impactOccurred()
            selectedDate = Date()
        } label: {
            Text("Today")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.primary)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .mapHealthGlassSurface(cornerRadius: 10, tint: .primary.opacity(0.03))
        }
        .mapHealthPressable()
    }

    private var eventCountChip: some View {
        Text(eventCountLabel)
            .font(.caption.weight(.semibold))
            .foregroundStyle(.secondary)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .mapHealthGlassSurface(cornerRadius: 10, tint: .primary.opacity(0.03))
    }

    private var eventCountLabel: String {
        let count = eventsForSelectedDay.count
        return count == 1 ? "1 event" : "\(count) events"
    }

    private func weatherBadge(_ weather: WeatherData) -> some View {
        HStack(spacing: 6) {
            Image(systemName: weather.icon)
                .symbolRenderingMode(.multicolor)
            Text("\(Int(weather.temperature))°")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.blue.gradient)
        .clipShape(Capsule())
    }

    private var jumpToDateButton: some View {
        Button {
            feedbackGenerator.impactOccurred()
            showingDatePicker = true
        } label: {
            Label("Jump", systemImage: "calendar.badge.clock")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .mapHealthGlassSurface(cornerRadius: 14, tint: .primary.opacity(0.03))
        }
        .mapHealthPressable()
    }

    private var calendarPickerTitle: String {
        let selectedCount = calendarService.selectedCalendarIds.count
        if selectedCount == 0 {
            return calendarService.primaryCalendar?.summary ?? "Calendars"
        } else if selectedCount == 1 {
            if let calendarId = calendarService.selectedCalendarIds.first,
               let calendar = calendarService.calendars.first(where: { $0.id == calendarId }) {
                return calendar.summary ?? "Calendar"
            }
            return "1 Calendar"
        }
        return "\(selectedCount) Calendars"
    }
}
