import MapHealthCore
import SwiftUI

// MARK: - Event Row

struct CalendarEventRow: View {
    let event: CalendarEvent
    let calendarService: CalendarService
    let onTap: () -> Void
    let onDelete: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(eventColor)
                    .frame(width: 4)

                VStack(alignment: .leading, spacing: 4) {
                    Text(event.summary ?? "Untitled Event")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.primary)
                        .lineLimit(1)

                    HStack(spacing: 8) {
                        Label(event.timeString, systemImage: "clock")
                            .font(.caption)
                            .foregroundStyle(.secondary)

                        if let location = event.location, !location.isEmpty {
                            Label(location, systemImage: "location")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                    }
                }

                Spacer()

                if event.hangoutLink != nil || event.conferenceData != nil {
                    Image(systemName: "video")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .mapHealthGlassSurface(cornerRadius: 12, tint: eventColor.opacity(0.04))
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
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
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

// MARK: - Compact Event Row

struct CompactEventRow: View {
    let event: CalendarEvent
    let calendarService: CalendarService
    let onTap: () -> Void
    let onDelete: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 8) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(eventColor)
                    .frame(width: 3)

                Text(event.summary ?? "Untitled Event")
                    .font(.subheadline)
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                Spacer()

                Text(event.timeString)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .mapHealthGlassSurface(cornerRadius: 8, tint: eventColor.opacity(0.04))
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

// MARK: - Shared Components

struct CalendarEmptyStateView: View {
    let onCreateEvent: () -> Void

    var body: some View {
        VStack(alignment: .center, spacing: 12) {
            Image(systemName: "calendar.badge.clock")
                .font(.title)
                .foregroundStyle(.secondary)
            Text("No events scheduled")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Button { onCreateEvent() } label: {
                Label("Create Event", systemImage: "plus")
            }
            .mapHealthGlassButtonStyle()
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(32)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .accentColor.opacity(0.04))
    }
}

struct CalendarErrorView: View {
    let message: String

    var body: some View {
        VStack(alignment: .center, spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.title)
                .foregroundStyle(.orange)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(24)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .orange.opacity(0.04))
    }
}

// MARK: - Google Calendar Colors

func googleCalendarColor(for colorId: String?) -> Color {
    switch colorId {
    case "1": return .init(red: 0.48, green: 0.65, blue: 0.85)  // Lavender
    case "2": return .init(red: 0.35, green: 0.73, blue: 0.53)  // Sage
    case "3": return .init(red: 0.55, green: 0.45, blue: 0.75)  // Grape
    case "4": return .init(red: 0.91, green: 0.47, blue: 0.49)  // Flamingo
    case "5": return .init(red: 0.96, green: 0.76, blue: 0.31)  // Banana
    case "6": return .init(red: 0.95, green: 0.60, blue: 0.36)  // Tangerine
    case "7": return .init(red: 0.26, green: 0.76, blue: 0.78)  // Peacock
    case "8": return .init(red: 0.61, green: 0.61, blue: 0.61)  // Graphite
    case "9": return .init(red: 0.32, green: 0.59, blue: 0.86)  // Blueberry
    case "10": return .init(red: 0.31, green: 0.71, blue: 0.53) // Basil
    case "11": return .init(red: 0.82, green: 0.31, blue: 0.31) // Tomato
    default: return .accentColor
    }
}

// MARK: - Color Extension

extension Color {
    init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else {
            return nil
        }

        let length = hexSanitized.count
        let red, green, blue: Double

        if length == 6 {
            red = Double((rgb & 0xFF0000) >> 16) / 255.0
            green = Double((rgb & 0x00FF00) >> 8) / 255.0
            blue = Double(rgb & 0x0000FF) / 255.0
        } else if length == 8 {
            red = Double((rgb & 0xFF000000) >> 24) / 255.0
            green = Double((rgb & 0x00FF0000) >> 16) / 255.0
            blue = Double((rgb & 0x0000FF00) >> 8) / 255.0
        } else {
            return nil
        }

        self.init(red: red, green: green, blue: blue)
    }
}
