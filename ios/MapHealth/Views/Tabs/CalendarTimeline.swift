import MapHealthCore
import SwiftUI

// MARK: - Timeline View

struct CalendarTimelineView: View {
    let events: [CalendarEvent]
    let calendarService: CalendarService
    let selectedDate: Date
    let onEventTap: (CalendarEvent) -> Void
    let onEventDelete: (CalendarEvent) -> Void
    let onCreateEvent: () -> Void

    @State private var currentTimeOffset: CGFloat = 0
    @State private var scrollRequest: Int = 0
    private let hourHeight: CGFloat = 60
    private let calendar = Calendar.current

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // All-day events section
            if !allDayEvents.isEmpty {
                allDaySection
            }

            // Timeline for timed events
            if !timedEvents.isEmpty || allDayEvents.isEmpty {
                timelineSection
            }
        }
    }

    // MARK: - All Day Section

    private var allDaySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Text("All Day")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)

                Text("\(allDayEvents.count)")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .mapHealthGlassSurface(cornerRadius: 8, tint: .primary.opacity(0.03))
            }
            .padding(.leading, 4)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(allDayEvents) { event in
                        AllDayEventChip(
                            event: event,
                            calendarService: calendarService,
                            onTap: { onEventTap(event) },
                            onDelete: { onEventDelete(event) }
                        )
                    }
                }
                .padding(.horizontal, 4)
                .padding(.vertical, 2)
            }
        }
    }

    // MARK: - Timeline Section

    private var timelineSection: some View {
        ScrollViewReader { proxy in
            VStack(spacing: 12) {
                timelineHeader

                ScrollView(.vertical, showsIndicators: false) {
                    ZStack(alignment: .topLeading) {
                        hourStripes
                        hourGrid

                        // Current time indicator
                        if calendar.isDateInToday(selectedDate) {
                            currentTimeIndicator
                        }

                        // Events overlaid on timeline
                        eventBlocks
                    }
                    .frame(height: hourHeight * 24)
                    .id("timeline")
                }
            }
            .onAppear {
                scrollToRelevantTime(proxy: proxy)
            }
            .onChange(of: selectedDate) { _, _ in
                scrollToRelevantTime(proxy: proxy)
            }
            .onChange(of: scrollRequest) { _, _ in
                scrollToRelevantTime(proxy: proxy)
            }
        }
    }

    private var timelineHeader: some View {
        HStack {
            Text("Timeline")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)

            Spacer()

            Button {
                scrollRequest += 1
            } label: {
                Label(timelineFocusLabel, systemImage: "scope")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.primary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .mapHealthGlassSurface(cornerRadius: 10, tint: .primary.opacity(0.03))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 4)
    }

    private var timelineFocusLabel: String {
        calendar.isDateInToday(selectedDate) ? "Now" : "Focus"
    }

    // MARK: - Hour Grid

    private var hourGrid: some View {
        VStack(spacing: 0) {
            ForEach(0..<24, id: \.self) { hour in
                HStack(alignment: .top, spacing: 8) {
                    Text(hourLabel(for: hour))
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .frame(width: 44, alignment: .trailing)

                    VStack {
                        Divider()
                            .background(Color.secondary.opacity(0.2))
                    }
                }
                .frame(height: hourHeight)
            }
        }
    }

    private var hourStripes: some View {
        VStack(spacing: 0) {
            ForEach(0..<24, id: \.self) { hour in
                Rectangle()
                    .fill(hour.isMultiple(of: 2) ? Color.secondary.opacity(0.04) : Color.clear)
                    .frame(height: hourHeight)
                    .padding(.leading, 52)
            }
        }
    }

    // MARK: - Current Time Indicator

    private var currentTimeIndicator: some View {
        let now = Date()
        let hour = calendar.component(.hour, from: now)
        let minute = calendar.component(.minute, from: now)
        let offset = CGFloat(hour) * hourHeight + CGFloat(minute) / 60.0 * hourHeight

        return HStack(spacing: 8) {
            HStack(spacing: 6) {
                Text("NOW")
                    .font(.caption2.weight(.bold))
                Text(now.formatted(.dateTime.hour().minute()))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .foregroundStyle(.red)
            .mapHealthGlassSurface(cornerRadius: 10, tint: .red.opacity(0.08))

            Circle()
                .fill(.red)
                .frame(width: 8, height: 8)

            Rectangle()
                .fill(.red)
                .frame(height: 1.5)
        }
        .padding(.leading, 8)
        .offset(y: offset - 12)
    }

    // MARK: - Event Blocks

    private var eventBlocks: some View {
        ForEach(timedEvents) { event in
            if let startDate = event.startDate {
                let topOffset = offsetForTime(startDate)
                let duration = eventDuration(event)
                let height = max(duration / 60.0 * hourHeight, 30) // Min 30pt height

                TimelineEventCard(
                    event: event,
                    calendarService: calendarService,
                    isCompact: false,
                    onTap: { onEventTap(event) },
                    onDelete: { onEventDelete(event) }
                )
                .frame(height: height)
                .padding(.leading, 56)
                .padding(.trailing, 4)
                .offset(y: topOffset)
            }
        }
    }

    // MARK: - Helpers

    private var allDayEvents: [CalendarEvent] {
        events.filter { $0.isAllDay }.sorted { ($0.summary ?? "") < ($1.summary ?? "") }
    }

    private var timedEvents: [CalendarEvent] {
        events.filter { !$0.isAllDay }.sorted { event1, event2 in
            (event1.startDate ?? .distantPast) < (event2.startDate ?? .distantPast)
        }
    }

    private func offsetForTime(_ date: Date) -> CGFloat {
        let hour = calendar.component(.hour, from: date)
        let minute = calendar.component(.minute, from: date)
        return CGFloat(hour) * hourHeight + CGFloat(minute) / 60.0 * hourHeight
    }

    private func eventDuration(_ event: CalendarEvent) -> CGFloat {
        guard let start = event.startDate, let end = event.endDate else {
            return 60 // Default 1 hour
        }
        return CGFloat(end.timeIntervalSince(start) / 60.0)
    }

    private func hourLabel(for hour: Int) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h a"
        var components = DateComponents()
        components.hour = hour
        if let date = calendar.date(from: components) {
            return formatter.string(from: date)
        }
        return "\(hour)"
    }

    private func scrollToRelevantTime(proxy: ScrollViewProxy) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            if calendar.isDateInToday(selectedDate) {
                // Scroll to current hour minus 1
                let hour = max(0, calendar.component(.hour, from: Date()) - 1)
                let offset = CGFloat(hour) * hourHeight
                proxy.scrollTo("timeline", anchor: UnitPoint(x: 0, y: offset / (hourHeight * 24)))
            } else if let firstEvent = timedEvents.first, let startDate = firstEvent.startDate {
                // Scroll to first event
                let hour = max(0, calendar.component(.hour, from: startDate) - 1)
                let offset = CGFloat(hour) * hourHeight
                proxy.scrollTo("timeline", anchor: UnitPoint(x: 0, y: offset / (hourHeight * 24)))
            } else {
                // Default to 8 AM
                let offset = CGFloat(8) * hourHeight
                proxy.scrollTo("timeline", anchor: UnitPoint(x: 0, y: offset / (hourHeight * 24)))
            }
        }
    }
}

// MARK: - Timeline Event Card

struct TimelineEventCard: View {
    let event: CalendarEvent
    let calendarService: CalendarService
    let isCompact: Bool
    let onTap: () -> Void
    let onDelete: () -> Void

    private let feedbackGenerator = UIImpactFeedbackGenerator(style: .light)

    var body: some View {
        Button {
            feedbackGenerator.impactOccurred()
            onTap()
        } label: {
            HStack(spacing: 0) {
                // Color bar
                RoundedRectangle(cornerRadius: 2)
                    .fill(eventColor)
                    .frame(width: 4)

                VStack(alignment: .leading, spacing: 2) {
                    Text(event.summary ?? "Untitled Event")
                        .font(isCompact ? .subheadline.weight(.medium) : .footnote.weight(.semibold))
                        .foregroundStyle(.primary)
                        .lineLimit(isCompact ? 1 : 2)

                    if !isCompact {
                        Text(event.timeString)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }

                    if let location = event.location, !location.isEmpty, !isCompact {
                        Text(location)
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                            .lineLimit(1)
                    }
                }
                .padding(.leading, 8)
                .padding(.vertical, isCompact ? 8 : 6)

                Spacer()

                if event.hangoutLink != nil || event.conferenceData != nil {
                    Image(systemName: "video.fill")
                        .font(.caption2)
                        .foregroundStyle(eventColor)
                        .padding(.trailing, 8)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(eventColor.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .strokeBorder(eventColor.opacity(0.3), lineWidth: 1)
            )
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

            if let location = event.location, !location.isEmpty {
                Button { openInMaps(location) } label: {
                    Label("Open in Maps", systemImage: "map")
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

    private func openInMaps(_ location: String) {
        let encoded = location.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? location
        if let url = URL(string: "maps://?q=\(encoded)") {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - All Day Chip

private struct AllDayEventChip: View {
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
            HStack(spacing: 8) {
                Circle()
                    .fill(eventColor)
                    .frame(width: 8, height: 8)

                Text(event.summary ?? "Untitled")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(eventColor.opacity(0.12))
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
        .contextMenu {
            Button { onTap() } label: {
                Label("View Details", systemImage: "info.circle")
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

// MARK: - Empty State

struct CalendarTimelineEmptyState: View {
    let selectedDate: Date
    let onCreateEvent: () -> Void

    private let calendar = Calendar.current
    private let feedbackGenerator = UIImpactFeedbackGenerator(style: .medium)

    var body: some View {
        VStack(spacing: 20) {
            Spacer()

            VStack(spacing: 12) {
                Image(systemName: calendar.isDateInToday(selectedDate) ? "sun.max" : "calendar")
                    .font(.system(size: 44))
                    .foregroundStyle(.tertiary)
                    .symbolEffect(.pulse, options: .repeating.speed(0.5))

                Text(emptyStateTitle)
                    .font(.headline)
                    .foregroundStyle(.primary)

                Text(emptyStateSubtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Button {
                feedbackGenerator.impactOccurred()
                onCreateEvent()
            } label: {
                Label("New Event", systemImage: "plus")
                    .font(.subheadline.weight(.semibold))
            }
            .mapHealthGlassButtonStyle(prominent: true)

            Spacer()
        }
        .frame(maxWidth: .infinity)
        .padding(32)
    }

    private var emptyStateTitle: String {
        if calendar.isDateInToday(selectedDate) {
            return "Nothing scheduled today"
        } else if calendar.isDateInTomorrow(selectedDate) {
            return "Nothing scheduled tomorrow"
        } else {
            return "No events"
        }
    }

    private var emptyStateSubtitle: String {
        if calendar.isDateInToday(selectedDate) {
            return "Enjoy your free time or add something new"
        } else {
            return selectedDate.formatted(.dateTime.weekday(.wide).month(.wide).day())
        }
    }
}

#Preview {
    CalendarTimelineView(
        events: [],
        calendarService: CalendarService.shared,
        selectedDate: Date(),
        onEventTap: { _ in },
        onEventDelete: { _ in },
        onCreateEvent: {}
    )
    .padding()
}
