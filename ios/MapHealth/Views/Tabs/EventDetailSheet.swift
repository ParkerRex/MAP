import MapHealthCore
import SwiftUI

struct EventDetailSheet: View {
    let event: CalendarEvent
    @ObservedObject var calendarService: CalendarService
    let onDelete: () -> Void
    let onUpdate: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showingEditSheet = false
    @State private var showingDeleteAlert = false
    @State private var isDeleting = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(event.summary ?? "Untitled Event")
                            .font(.title2.weight(.semibold))

                        HStack {
                            Image(systemName: "clock").foregroundStyle(.secondary)
                            Text(event.timeString).foregroundStyle(.secondary)
                        }

                        if let startDate = event.startDate {
                            HStack {
                                Image(systemName: "calendar").foregroundStyle(.secondary)
                                Text(startDate, style: .date).foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 8)
                }

                if let location = event.location, !location.isEmpty {
                    Section {
                        Button { openInMaps(location) } label: {
                            HStack {
                                Image(systemName: "location").foregroundStyle(Color.accentColor)
                                Text(location).foregroundStyle(.primary)
                                Spacer()
                                Image(systemName: "arrow.up.right")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                if let link = videoConferenceLink, let url = URL(string: link) {
                    Section {
                        Link(destination: url) {
                            HStack {
                                Image(systemName: "video").foregroundStyle(Color.accentColor)
                                VStack(alignment: .leading) {
                                    Text("Join Video Call").foregroundStyle(.primary)
                                    Text(conferenceName)
                                        .font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                Image(systemName: "arrow.up.right")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                if let description = event.description, !description.isEmpty {
                    Section("Notes") {
                        Text(description).foregroundStyle(.secondary)
                    }
                }

                if let attendees = event.attendees, !attendees.isEmpty {
                    Section("Attendees") {
                        ForEach(attendees, id: \.email) { attendee in
                            AttendeeRow(attendee: attendee)
                        }
                    }
                }

                Section {
                    Button(role: .destructive) { showingDeleteAlert = true } label: {
                        HStack {
                            Spacer()
                            if isDeleting {
                                ProgressView()
                            } else {
                                Label("Delete Event", systemImage: "trash")
                            }
                            Spacer()
                        }
                    }
                    .disabled(isDeleting)
                }
            }
            .navigationTitle("Event Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Edit") { showingEditSheet = true }
                }
            }
            .sheet(isPresented: $showingEditSheet) {
                EventFormSheet(
                    calendarService: calendarService,
                    selectedDate: event.startDate ?? Date(),
                    editingEvent: event
                )
            }
            .alert("Delete Event", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    Task { await deleteEvent() }
                }
            } message: {
                Text("Are you sure you want to delete this event? This action cannot be undone.")
            }
            .onChange(of: showingEditSheet) { _, isPresented in
                if !isPresented { onUpdate() }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private var videoConferenceLink: String? {
        if let link = event.hangoutLink { return link }
        return event.conferenceData?.entryPoints?.first(where: { $0.entryPointType == "video" })?.uri
    }

    private var conferenceName: String {
        event.conferenceData?.conferenceSolution?.name ?? "Google Meet"
    }

    private func openInMaps(_ location: String) {
        let encoded = location.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? location
        if let url = URL(string: "maps://?q=\(encoded)") {
            UIApplication.shared.open(url)
        }
    }

    private func deleteEvent() async {
        isDeleting = true
        do {
            try await calendarService.deleteEvent(event)
            dismiss()
            onDelete()
        } catch {
            // Error handled by calendarService
        }
        isDeleting = false
    }
}

private struct AttendeeRow: View {
    let attendee: EventAttendee

    var body: some View {
        HStack {
            Image(systemName: responseIcon).foregroundStyle(responseColor)

            VStack(alignment: .leading) {
                Text(attendee.displayName ?? attendee.email ?? "Unknown")
                if attendee.organizer == true {
                    Text("Organizer")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }

            Spacer()

            if attendee.optional == true {
                Text("Optional")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    private var responseIcon: String {
        switch attendee.responseStatus {
        case "accepted": return "checkmark.circle.fill"
        case "declined": return "xmark.circle.fill"
        case "tentative": return "questionmark.circle.fill"
        default: return "circle"
        }
    }

    private var responseColor: Color {
        switch attendee.responseStatus {
        case "accepted": return .green
        case "declined": return .red
        case "tentative": return .orange
        default: return .secondary
        }
    }
}
