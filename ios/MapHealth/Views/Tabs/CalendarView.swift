import MapHealthCore
import SwiftUI

struct CalendarView: View {
    @StateObject private var calendarService = CalendarService.shared
    @State private var selectedDate = Date()
    @State private var showingCalendarPicker = false
    @State private var showingCreateEvent = false
    @State private var selectedEvent: CalendarEvent?
    @State private var eventToDelete: CalendarEvent?
    @State private var showingDeleteConfirmation = false

    var body: some View {
        NavigationStack {
            calendarContent
                .navigationTitle("Calendar")
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        calendarPickerButton
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            showingCreateEvent = true
                        } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
                .refreshable {
                    await loadData()
                }
                .sheet(isPresented: $showingCalendarPicker) {
                    CalendarPickerSheet(calendarService: calendarService)
                }
                .sheet(isPresented: $showingCreateEvent) {
                    EventFormSheet(
                        calendarService: calendarService,
                        selectedDate: selectedDate
                    )
                }
                .sheet(item: $selectedEvent) { event in
                    EventDetailSheet(
                        event: event,
                        calendarService: calendarService,
                        onDelete: {
                            selectedEvent = nil
                            Task { await loadEvents() }
                        },
                        onUpdate: {
                            Task { await loadEvents() }
                        }
                    )
                }
                .alert("Delete Event", isPresented: $showingDeleteConfirmation) {
                    Button("Cancel", role: .cancel) {
                        eventToDelete = nil
                    }
                    Button("Delete", role: .destructive) {
                        if let event = eventToDelete {
                            Task {
                                await deleteEvent(event)
                            }
                        }
                    }
                } message: {
                    Text("Are you sure you want to delete \"\(eventToDelete?.summary ?? "this event")\"?")
                }
        }
        .task {
            await loadData()
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

    private var calendarPickerButton: some View {
        Button {
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
                    .font(.caption)
            }
        }
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
        } else {
            return "\(selectedCount) Calendars"
        }
    }

    private var eventsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Events")
                    .font(.headline)
                    .foregroundStyle(.secondary)

                Spacer()

                if calendarService.isLoading {
                    ProgressView()
                        .scaleEffect(0.8)
                }
            }

            if let error = calendarService.error {
                errorView(message: error.localizedDescription)
            } else if calendarService.events.isEmpty && !calendarService.isLoading {
                emptyStateView
            } else {
                eventsList
            }
        }
    }

    private var emptyStateView: some View {
        VStack(alignment: .center, spacing: 12) {
            Image(systemName: "calendar.badge.clock")
                .font(.title)
                .foregroundStyle(.secondary)
            Text("No events scheduled")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Button {
                showingCreateEvent = true
            } label: {
                Label("Create Event", systemImage: "plus")
            }
            .mapHealthGlassButtonStyle()
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(32)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .accentColor.opacity(0.04))
    }

    private var eventsList: some View {
        VStack(spacing: 8) {
            ForEach(calendarService.events) { event in
                EventRow(
                    event: event,
                    calendarService: calendarService,
                    onTap: {
                        selectedEvent = event
                    },
                    onDelete: {
                        eventToDelete = event
                        showingDeleteConfirmation = true
                    }
                )
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
                    await loadData()
                }
            }
            .mapHealthGlassButtonStyle()
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(24)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .orange.opacity(0.04))
    }

    private func loadData() async {
        await calendarService.fetchCalendars()
        await calendarService.fetchColors()
        await loadEvents()
    }

    private func loadEvents() async {
        await calendarService.fetchEvents(
            from: selectedDate.startOfDay,
            to: selectedDate.endOfDay
        )
    }

    private func deleteEvent(_ event: CalendarEvent) async {
        do {
            try await calendarService.deleteEvent(event)
        } catch {
            // Error is shown via calendarService.error
        }
        eventToDelete = nil
    }

    private func calendarColor(for calendar: CalendarInfo) -> Color {
        if let colors = calendarService.colorForCalendar(calendar) {
            return Color(hex: colors.background) ?? .accentColor
        }
        if let backgroundColor = calendar.backgroundColor {
            return Color(hex: backgroundColor) ?? .accentColor
        }
        return .accentColor
    }
}

// MARK: - Event Row

private struct EventRow: View {
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
            Button {
                onTap()
            } label: {
                Label("View Details", systemImage: "info.circle")
            }

            if let link = event.hangoutLink ?? event.conferenceData?.entryPoints?.first(where: { $0.entryPointType == "video" })?.uri,
               let url = URL(string: link) {
                Link(destination: url) {
                    Label("Join Video Call", systemImage: "video")
                }
            }

            if let location = event.location, !location.isEmpty {
                Button {
                    openInMaps(location)
                } label: {
                    Label("Open in Maps", systemImage: "map")
                }
            }

            Divider()

            Button(role: .destructive) {
                onDelete()
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive) {
                onDelete()
            } label: {
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

    private func googleCalendarColor(for colorId: String?) -> Color {
        switch colorId {
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

    private func openInMaps(_ location: String) {
        let encoded = location.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? location
        if let url = URL(string: "maps://?q=\(encoded)") {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Calendar Picker Sheet

private struct CalendarPickerSheet: View {
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
                    Button("Done") {
                        dismiss()
                    }
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
        Button {
            calendarService.toggleCalendarSelection(calendar.id)
        } label: {
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

private struct EventFormSheet: View {
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

        // Initialize state
        if let event = editingEvent {
            _title = State(initialValue: event.summary ?? "")
            _location = State(initialValue: event.location ?? "")
            _notes = State(initialValue: event.description ?? "")
            _isAllDay = State(initialValue: event.isAllDay)
            _startDate = State(initialValue: event.startDate ?? selectedDate)
            _endDate = State(initialValue: event.endDate ?? Calendar.current.date(byAdding: .hour, value: 1, to: selectedDate)!)
        } else {
            // Default: start at next hour, 1 hour duration
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
                        Text(error)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle(editingEvent == nil ? "New Event" : "Edit Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(editingEvent == nil ? "Add" : "Save") {
                        Task {
                            await saveEvent()
                        }
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

private struct EventDetailSheet: View {
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
                            Image(systemName: "clock")
                                .foregroundStyle(.secondary)
                            Text(event.timeString)
                                .foregroundStyle(.secondary)
                        }

                        if let startDate = event.startDate {
                            HStack {
                                Image(systemName: "calendar")
                                    .foregroundStyle(.secondary)
                                Text(startDate, style: .date)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .padding(.vertical, 8)
                }

                if let location = event.location, !location.isEmpty {
                    Section {
                        Button {
                            openInMaps(location)
                        } label: {
                            HStack {
                                Image(systemName: "location")
                                    .foregroundStyle(Color.accentColor)
                                Text(location)
                                    .foregroundStyle(.primary)
                                Spacer()
                                Image(systemName: "arrow.up.right")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                if let link = videoConferenceLink, let url = URL(string: link) {
                    Section {
                        Link(destination: url) {
                            HStack {
                                Image(systemName: "video")
                                    .foregroundStyle(Color.accentColor)
                                VStack(alignment: .leading) {
                                    Text("Join Video Call")
                                        .foregroundStyle(.primary)
                                    Text(conferenceName)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Image(systemName: "arrow.up.right")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                if let description = event.description, !description.isEmpty {
                    Section("Notes") {
                        Text(description)
                            .foregroundStyle(.secondary)
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
                    Button(role: .destructive) {
                        showingDeleteAlert = true
                    } label: {
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
                    Button("Done") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Edit") {
                        showingEditSheet = true
                    }
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
                    Task {
                        await deleteEvent()
                    }
                }
            } message: {
                Text("Are you sure you want to delete this event? This action cannot be undone.")
            }
            .onChange(of: showingEditSheet) { _, isPresented in
                if !isPresented {
                    onUpdate()
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private var videoConferenceLink: String? {
        if let link = event.hangoutLink {
            return link
        }
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
            Image(systemName: responseIcon)
                .foregroundStyle(responseColor)

            VStack(alignment: .leading) {
                Text(attendee.displayName ?? attendee.email ?? "Unknown")
                if attendee.organizer == true {
                    Text("Organizer")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if attendee.optional == true {
                Text("Optional")
                    .font(.caption)
                    .foregroundStyle(.secondary)
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
