import MapHealthCore
import SwiftUI

// MARK: - Calendar Picker Sheet

struct CalendarPickerSheet: View {
    @ObservedObject var calendarService: CalendarService
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                ForEach(calendarService.calendars) { calendar in
                    CalendarPickerRow(
                        calendar: calendar,
                        isSelected: calendarService.isCalendarSelected(calendar.id),
                        calendarService: calendarService
                    )
                }
            }
            .navigationTitle("Calendars")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

private struct CalendarPickerRow: View {
    let calendar: CalendarInfo
    let isSelected: Bool
    let calendarService: CalendarService

    var body: some View {
        Button { calendarService.toggleCalendarSelection(calendar.id) } label: {
            HStack {
                Circle()
                    .fill(calendarColor)
                    .frame(width: 12, height: 12)

                VStack(alignment: .leading) {
                    Text(calendar.summary ?? "Calendar")
                        .foregroundStyle(.primary)
                    if calendar.isPrimary == true {
                        Text("Primary")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark")
                        .foregroundStyle(Color.accentColor)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var calendarColor: Color {
        if let colors = calendarService.colorForCalendar(calendar) {
            return Color(hex: colors.background) ?? .accentColor
        }
        if let backgroundColor = calendar.backgroundColor {
            return Color(hex: backgroundColor) ?? .accentColor
        }
        return .accentColor
    }
}

// MARK: - Event Form Sheet

struct EventFormSheet: View {
    @ObservedObject var calendarService: CalendarService
    let selectedDate: Date
    let editingEvent: CalendarEvent?

    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var location = ""
    @State private var notes = ""
    @State private var startDate: Date
    @State private var endDate: Date
    @State private var isAllDay = false
    @State private var addVideoConference = false
    @State private var selectedCalendarId: String = "primary"
    @State private var isSaving = false
    @State private var errorMessage: String?

    init(calendarService: CalendarService, selectedDate: Date, editingEvent: CalendarEvent? = nil) {
        self.calendarService = calendarService
        self.selectedDate = selectedDate
        self.editingEvent = editingEvent

        if let event = editingEvent {
            _title = State(initialValue: event.summary ?? "")
            _location = State(initialValue: event.location ?? "")
            _notes = State(initialValue: event.description ?? "")
            _isAllDay = State(initialValue: event.isAllDay)
            _startDate = State(initialValue: event.startDate ?? selectedDate)
            let fallbackEnd = Calendar.current.date(byAdding: .hour, value: 1, to: selectedDate)!
            _endDate = State(initialValue: event.endDate ?? fallbackEnd)
        } else {
            let calendar = Calendar.current
            let now = Date()
            let components = calendar.dateComponents([.year, .month, .day], from: selectedDate)
            let nowComponents = calendar.dateComponents([.hour], from: now)
            var startComponents = components
            startComponents.hour = (nowComponents.hour ?? 9) + 1
            startComponents.minute = 0

            let start = calendar.date(from: startComponents) ?? selectedDate
            let end = calendar.date(byAdding: .hour, value: 1, to: start) ?? start

            _startDate = State(initialValue: start)
            _endDate = State(initialValue: end)
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Title", text: $title)
                    TextField("Location", text: $location)
                }

                Section {
                    Toggle("All-day", isOn: $isAllDay)

                    if isAllDay {
                        DatePicker("Start", selection: $startDate, displayedComponents: .date)
                        DatePicker("End", selection: $endDate, displayedComponents: .date)
                    } else {
                        DatePicker("Start", selection: $startDate)
                        DatePicker("End", selection: $endDate)
                    }
                }

                if editingEvent == nil {
                    Section {
                        Toggle("Add Google Meet", isOn: $addVideoConference)
                    }
                }

                if calendarService.calendars.count > 1 {
                    Section {
                        Picker("Calendar", selection: $selectedCalendarId) {
                            ForEach(calendarService.calendars) { calendar in
                                Text(calendar.summary ?? "Calendar")
                                    .tag(calendar.id)
                            }
                        }
                    }
                }

                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 100)
                }

                if let error = errorMessage {
                    Section {
                        Text(error).foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle(editingEvent == nil ? "New Event" : "Edit Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(editingEvent == nil ? "Add" : "Save") {
                        Task { await saveEvent() }
                    }
                    .disabled(title.isEmpty || isSaving)
                }
            }
            .disabled(isSaving)
            .overlay {
                if isSaving {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(.ultraThinMaterial)
                }
            }
        }
        .onAppear {
            if selectedCalendarId == "primary", let primary = calendarService.primaryCalendar {
                selectedCalendarId = primary.id
            }
        }
    }

    private func saveEvent() async {
        isSaving = true
        errorMessage = nil

        do {
            if let event = editingEvent {
                try await calendarService.updateEvent(
                    event,
                    summary: title,
                    start: startDate,
                    end: endDate,
                    isAllDay: isAllDay,
                    description: notes.isEmpty ? nil : notes,
                    location: location.isEmpty ? nil : location,
                    calendarId: selectedCalendarId
                )
            } else {
                try await calendarService.createEvent(
                    summary: title,
                    start: startDate,
                    end: endDate,
                    isAllDay: isAllDay,
                    description: notes.isEmpty ? nil : notes,
                    location: location.isEmpty ? nil : location,
                    calendarId: selectedCalendarId,
                    addConference: addVideoConference
                )
            }
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }

        isSaving = false
    }
}

// MARK: - Event Detail Sheet

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

// MARK: - Attendee Row

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
