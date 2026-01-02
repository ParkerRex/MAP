import MapHealthCore
import SwiftUI

struct CalendarView: View {
    @StateObject private var calendarService = CalendarService.shared
    @State private var selectedDate = Date()
    @State private var viewMode: CalendarViewMode = .day
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
                    ToolbarItemGroup(placement: .topBarTrailing) {
                        Button("Today") {
                            withAnimation {
                                selectedDate = Date()
                            }
                        }
                        .disabled(Calendar.current.isDateInToday(selectedDate))

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
        .onChange(of: viewMode) { _, _ in
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
        VStack(spacing: 16) {
            Picker("View Mode", selection: $viewMode) {
                ForEach(CalendarViewMode.allCases, id: \.self) { mode in
                    Text(mode.rawValue).tag(mode)
                }
            }
            .pickerStyle(.segmented)

            switch viewMode {
            case .day:
                DayCalendarView(
                    selectedDate: $selectedDate,
                    calendarService: calendarService,
                    onEventTap: { selectedEvent = $0 },
                    onEventDelete: { event in
                        eventToDelete = event
                        showingDeleteConfirmation = true
                    },
                    onCreateEvent: { showingCreateEvent = true }
                )
            case .week:
                WeekCalendarView(
                    selectedDate: $selectedDate,
                    calendarService: calendarService,
                    onEventTap: { selectedEvent = $0 },
                    onEventDelete: { event in
                        eventToDelete = event
                        showingDeleteConfirmation = true
                    },
                    onCreateEvent: { showingCreateEvent = true }
                )
            case .month:
                MonthCalendarView(
                    selectedDate: $selectedDate,
                    calendarService: calendarService,
                    onEventTap: { selectedEvent = $0 },
                    onEventDelete: { event in
                        eventToDelete = event
                        showingDeleteConfirmation = true
                    },
                    onCreateEvent: { showingCreateEvent = true }
                )
            }
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

    private func loadData() async {
        await calendarService.fetchCalendars()
        await calendarService.fetchColors()
        await loadEvents()
    }

    private func loadEvents() async {
        let (startDate, endDate) = dateRangeForViewMode()
        await calendarService.fetchEvents(from: startDate, to: endDate)
    }

    private func dateRangeForViewMode() -> (start: Date, end: Date) {
        let calendar = Calendar.current

        switch viewMode {
        case .day:
            return (selectedDate.startOfDay, selectedDate.endOfDay)

        case .week:
            let weekStart = calendar.date(
                from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: selectedDate)
            )!
            let weekEnd = calendar.date(byAdding: .day, value: 7, to: weekStart)!
            return (weekStart.startOfDay, weekEnd.endOfDay)

        case .month:
            let monthStart = calendar.date(
                from: calendar.dateComponents([.year, .month], from: selectedDate)
            )!
            let monthEnd = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: monthStart)!
            return (monthStart.startOfDay, monthEnd.endOfDay)
        }
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
