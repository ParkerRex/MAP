import MapHealthCore
import SwiftUI

struct EventFormSheet: View {
    @ObservedObject var calendarService: CalendarService
    let selectedDate: Date
    let initialStartDate: Date?
    let initialIsAllDay: Bool
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

    init(
        calendarService: CalendarService,
        selectedDate: Date,
        initialStartDate: Date? = nil,
        initialIsAllDay: Bool = false,
        editingEvent: CalendarEvent? = nil
    ) {
        self.calendarService = calendarService
        self.selectedDate = selectedDate
        self.initialStartDate = initialStartDate
        self.initialIsAllDay = initialIsAllDay
        self.editingEvent = editingEvent

        if let event = editingEvent {
            _title = State(initialValue: event.summary ?? "")
            _location = State(initialValue: event.location ?? "")
            _notes = State(initialValue: event.description ?? "")
            _isAllDay = State(initialValue: event.isAllDay)
            _startDate = State(initialValue: event.startDate ?? selectedDate)
            let fallbackEnd = Calendar.current.date(byAdding: .hour, value: 1, to: selectedDate)!
            _endDate = State(initialValue: event.endDate ?? fallbackEnd)
        } else if let initialStartDate {
            let start = Calendar.current.startOfDay(for: initialStartDate)
            if initialIsAllDay {
                let end = Calendar.current.date(byAdding: .day, value: 1, to: start) ?? start
                _startDate = State(initialValue: start)
                _endDate = State(initialValue: end)
                _isAllDay = State(initialValue: true)
            } else {
                let end = Calendar.current.date(byAdding: .hour, value: 1, to: initialStartDate) ?? initialStartDate
                _startDate = State(initialValue: initialStartDate)
                _endDate = State(initialValue: end)
                _isAllDay = State(initialValue: false)
            }
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
            _isAllDay = State(initialValue: initialIsAllDay)
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
                    LoadingOverlay(message: editingEvent == nil ? "Creating event..." : "Saving...")
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
