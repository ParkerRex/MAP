import MapHealthCore
import SwiftUI

struct CalendarView: View {
    @State private var selectedDate = Date()
    @State private var events: [CalendarEvent] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            calendarContent
                .navigationTitle("Calendar")
                .refreshable {
                    await loadEvents()
                }
        }
        .task {
            await loadEvents()
        }
        .onChange(of: selectedDate) { _, _ in
            Task {
                await loadEvents()
            }
        }
    }

    @ViewBuilder
    private var calendarContent: some View {
        if #available(iOS 26, *) {
            ScrollView {
                calendarBody
            }
            .contentMargins(.horizontal, 20, for: .scrollContent)
            .contentMargins(.vertical, 16, for: .scrollContent)
        } else {
            ScrollView {
                calendarBody
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
            }
        }
    }

    private var calendarBody: some View {
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
                Text("Events")
                    .font(.headline)
                    .foregroundStyle(.secondary)

                Spacer()

                if isLoading {
                    ProgressView()
                        .scaleEffect(0.8)
                }
            }

            if let error = errorMessage {
                errorView(message: error)
            } else if events.isEmpty && !isLoading {
                emptyStateView
            } else {
                eventsList
            }
        }
    }

    private var emptyStateView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: "calendar.badge.clock")
                .font(.title)
                .foregroundStyle(.secondary)
            Text("No events scheduled")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(32)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .accentColor.opacity(0.04))
    }

    private var eventsList: some View {
        VStack(spacing: 8) {
            ForEach(events) { event in
                EventRow(event: event)
            }
        }
    }

    private func errorView(message: String) -> some View {
        VStack(alignment: .center, spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.title)
                .foregroundStyle(.orange)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("Retry") {
                Task {
                    await loadEvents()
                }
            }
            .buttonStyle(.bordered)
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(24)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .orange.opacity(0.04))
    }

    private func loadEvents() async {
        isLoading = true
        errorMessage = nil

        do {
            let response = try await MapAPIClient.shared.getEvents(
                timeMin: selectedDate.startOfDay,
                timeMax: selectedDate.endOfDay
            )
            events = response.events
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

// MARK: - Event Row

private struct EventRow: View {
    let event: CalendarEvent

    var body: some View {
        HStack(spacing: 12) {
            // Color indicator
            RoundedRectangle(cornerRadius: 2)
                .fill(eventColor)
                .frame(width: 4)

            VStack(alignment: .leading, spacing: 4) {
                Text(event.summary ?? "Untitled Event")
                    .font(.subheadline.weight(.medium))
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
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .mapHealthGlassSurface(cornerRadius: 12, tint: eventColor.opacity(0.04))
    }

    private var eventColor: Color {
        // Map Google Calendar color IDs to colors
        switch event.colorId {
        case "1": return .init(red: 0.48, green: 0.65, blue: 0.85) // Lavender
        case "2": return .init(red: 0.35, green: 0.73, blue: 0.53) // Sage
        case "3": return .init(red: 0.55, green: 0.45, blue: 0.75) // Grape
        case "4": return .init(red: 0.91, green: 0.47, blue: 0.49) // Flamingo
        case "5": return .init(red: 0.96, green: 0.76, blue: 0.31) // Banana
        case "6": return .init(red: 0.95, green: 0.60, blue: 0.36) // Tangerine
        case "7": return .init(red: 0.26, green: 0.76, blue: 0.78) // Peacock
        case "8": return .init(red: 0.61, green: 0.61, blue: 0.61) // Graphite
        case "9": return .init(red: 0.32, green: 0.59, blue: 0.86) // Blueberry
        case "10": return .init(red: 0.31, green: 0.71, blue: 0.53) // Basil
        case "11": return .init(red: 0.82, green: 0.31, blue: 0.31) // Tomato
        default: return .accentColor
        }
    }
}
