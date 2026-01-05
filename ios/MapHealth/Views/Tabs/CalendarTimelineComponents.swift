import MapHealthCore
import SwiftUI

struct TimelineLayoutEvent: Identifiable {
    let id: Int
    let event: CalendarEvent
    let column: Int
    let columns: Int
}

struct TimelineEventCard: View {
    let event: CalendarEvent
    let calendarService: CalendarService
    let isCompact: Bool
    let onTap: () -> Void
    let onDelete: () -> Void

    private let feedbackGenerator = UIImpactFeedbackGenerator(style: .light)
    private let calendar = Calendar.current

    var body: some View {
        Button {
            feedbackGenerator.impactOccurred()
            onTap()
        } label: {
            HStack(spacing: 0) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(eventColor)
                    .frame(width: 4)

                VStack(alignment: .leading, spacing: 4) {
                    Text(event.summary ?? "Untitled Event")
                        .font(isCompact ? .subheadline.weight(.medium) : .footnote.weight(.semibold))
                        .foregroundStyle(.primary)
                        .lineLimit(isCompact ? 1 : 2)

                    if !isCompact {
                        HStack(spacing: 6) {
                            Text(event.timeString)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 3)
                                .background(.ultraThinMaterial, in: Capsule())

                            if let duration = durationLabel {
                                Text(duration)
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
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
        .mapHealthPressable()
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

    private var durationLabel: String? {
        guard let start = event.startDate, let end = event.endDate else { return nil }
        let minutes = max(0, Int(end.timeIntervalSince(start) / 60))
        if minutes < 60 {
            return "\(minutes)m"
        }
        let hours = minutes / 60
        let remainder = minutes % 60
        if remainder == 0 {
            return "\(hours)h"
        }
        return "\(hours)h \(remainder)m"
    }

    private func openInMaps(_ location: String) {
        let encoded = location.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? location
        if let url = URL(string: "maps://?q=\(encoded)") {
            UIApplication.shared.open(url)
        }
    }
}

struct AllDayEventChip: View {
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
        .mapHealthPressable()
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

struct AllDayAddChip: View {
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            Label("Add all-day", systemImage: "plus")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.secondary)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(.ultraThinMaterial, in: Capsule())
        }
        .mapHealthPressable()
    }
}

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
        }
        return selectedDate.formatted(.dateTime.weekday(.wide).month(.wide).day())
    }
}

#Preview {
    CalendarTimelineView(
        events: [],
        calendarService: CalendarService.shared,
        selectedDate: Date(),
        onEventTap: { _ in },
        onEventDelete: { _ in },
        onCreateEvent: {},
        onCreateEventAt: { _ in },
        onCreateAllDay: {}
    )
    .padding()
}
