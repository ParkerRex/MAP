import CoreLocation
import MapHealthCore
import SwiftUI

struct CalendarView: View {
    @StateObject private var calendarService = CalendarService.shared
    @State private var selectedDate = Date()
    @State private var viewMode: CalendarViewMode = .day
    @State private var showingCalendarPicker = false
    @State private var showingCreateEvent = false
    @State private var createEventStartDate: Date?
    @State private var selectedEvent: CalendarEvent?
    @State private var eventToDelete: CalendarEvent?
    @State private var showingDeleteConfirmation = false
    @State private var showingDatePicker = false
    @GestureState private var dayDragOffset: CGFloat = 0
    @State private var hasLoadedInitialData = false
    @State private var weather: WeatherData?
    @StateObject private var locationManager = LocationManager()

    private let feedbackGenerator = UIImpactFeedbackGenerator(style: .medium)
    private let calendar = Calendar.current

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                calendarHUD

                // Week strip
                CalendarWeekStrip(
                    selectedDate: $selectedDate,
                    events: calendarService.events,
                    onDateDoubleTap: { date in
                        createEventStartDate = date
                        showingCreateEvent = true
                    },
                    showsHeader: false
                )
                .padding(.horizontal, 20)
                .padding(.bottom, 12)

                Divider()
                    .padding(.horizontal, 20)

                // Main content with swipe gestures
                mainContent
            }
            .navigationTitle("Calendar")
            .navigationBarTitleDisplayMode(.inline)
            .refreshable {
                await loadData()
            }
            .sheet(isPresented: $showingCalendarPicker) {
                CalendarPickerSheet(calendarService: calendarService)
            }
            .sheet(isPresented: $showingCreateEvent) {
                EventFormSheet(
                    calendarService: calendarService,
                    selectedDate: selectedDate,
                    initialStartDate: createEventStartDate
                )
            }
            .sheet(isPresented: $showingDatePicker) {
                DatePickerSheet(selectedDate: $selectedDate)
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
            if let location = locationManager.location {
                await loadWeather(location: location)
            }
            hasLoadedInitialData = true
        }
        .onChange(of: locationManager.location) { _, location in
            guard let location else { return }
            Task {
                await loadWeather(location: location)
            }
        }
        .task(id: eventsLoadToken) {
            guard hasLoadedInitialData else { return }
            await loadEvents()
        }
    }

    // MARK: - Calendar HUD

    private var calendarHUD: some View {
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
            jumpToDateButton
            addEventButton
        }
    }

    // MARK: - View Mode Picker

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

    @Namespace private var viewModeNamespace

    // MARK: - Main Content

    @ViewBuilder
    private var mainContent: some View {
        switch viewMode {
        case .day:
            dayView
                .gesture(daySwipeGesture)
                .offset(x: dayDragOffset)
        case .week:
            weekView
        case .month:
            monthView
        }
    }

    // MARK: - Day View

    private var dayView: some View {
        VStack(spacing: 0) {
            if let error = calendarService.error {
                CalendarErrorView(message: error.localizedDescription)
                    .padding(20)
            } else if calendarService.isLoading && eventsForSelectedDay.isEmpty {
                SkeletonCalendarList(count: 3)
                    .padding(20)
            } else if eventsForSelectedDay.isEmpty {
                CalendarTimelineEmptyState(
                    selectedDate: selectedDate,
                    onCreateEvent: {
                        createEventStartDate = nil
                        showingCreateEvent = true
                    }
                )
            } else {
                CalendarTimelineView(
                    events: eventsForSelectedDay,
                    calendarService: calendarService,
                    selectedDate: selectedDate,
                    onEventTap: { selectedEvent = $0 },
                    onEventDelete: { event in
                        eventToDelete = event
                        showingDeleteConfirmation = true
                    },
                    onCreateEvent: {
                        createEventStartDate = nil
                        showingCreateEvent = true
                    },
                    onCreateEventAt: { date in
                        createEventStartDate = date
                        selectedDate = date
                        showingCreateEvent = true
                    }
                )
                .padding(20)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .animation(.easeInOut(duration: 0.2), value: calendarService.isLoading)
    }

    // MARK: - Day Swipe Gesture

    private var daySwipeGesture: some Gesture {
        DragGesture(minimumDistance: 30)
            .updating($dayDragOffset) { value, state, _ in
                state = value.translation.width * 0.2
            }
            .onEnded { value in
                let threshold: CGFloat = 60
                if value.translation.width > threshold {
                    navigateDay(by: -1)
                } else if value.translation.width < -threshold {
                    navigateDay(by: 1)
                }
            }
    }

    private func navigateDay(by offset: Int) {
        feedbackGenerator.impactOccurred()
        withAnimation(.snappy(duration: 0.25)) {
            if let newDate = calendar.date(byAdding: .day, value: offset, to: selectedDate) {
                selectedDate = newDate
            }
        }
    }

    // MARK: - Week View

    private var weekView: some View {
        ScrollView {
            WeekCalendarContent(
                selectedDate: $selectedDate,
                calendarService: calendarService,
                onEventTap: { selectedEvent = $0 },
                onEventDelete: { event in
                    eventToDelete = event
                    showingDeleteConfirmation = true
                },
                onCreateEvent: { showingCreateEvent = true }
            )
            .padding(20)
        }
    }

    // MARK: - Month View

    private var monthView: some View {
        ScrollView {
            MonthCalendarContent(
                selectedDate: $selectedDate,
                calendarService: calendarService,
                onEventTap: { selectedEvent = $0 },
                onEventDelete: { event in
                    eventToDelete = event
                    showingDeleteConfirmation = true
                },
                onCreateEvent: { showingCreateEvent = true }
            )
            .padding(20)
        }
    }

    // MARK: - Calendar Picker Button

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
            .mapHealthGlassSurface(cornerRadius: 14, tint: .accentColor.opacity(0.06))
        }
        .buttonStyle(.plain)
    }

    private var addEventButton: some View {
        Button {
            feedbackGenerator.impactOccurred()
            createEventStartDate = nil
            showingCreateEvent = true
        } label: {
            Label("New", systemImage: "plus")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .mapHealthGlassSurface(cornerRadius: 14, tint: .accentColor.opacity(0.12))
        }
        .buttonStyle(.plain)
    }

    private var todayChip: some View {
        Button {
            withAnimation(.snappy(duration: 0.3)) {
                selectedDate = Date()
            }
            feedbackGenerator.impactOccurred()
        } label: {
            Text("Today")
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color.accentColor)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .mapHealthGlassSurface(cornerRadius: 10, tint: Color.accentColor.opacity(0.1))
        }
        .buttonStyle(.plain)
    }

    private var eventCountChip: some View {
        Text(eventCountLabel)
            .font(.caption.weight(.medium))
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
        HStack(spacing: 8) {
            Image(systemName: weather.icon)
                .symbolRenderingMode(.multicolor)
            VStack(alignment: .leading, spacing: 2) {
                Text("\(weather.temperature)°")
                    .fontWeight(.semibold)
                Text(weather.conditionText)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .font(.caption)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .mapHealthGlassSurface(cornerRadius: 12, tint: .blue.opacity(0.08))
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
        .buttonStyle(.plain)
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

    // MARK: - Data Loading

    private var eventsForSelectedDay: [CalendarEvent] {
        calendarService.events.filter { event in
            guard let startDate = event.startDate else { return false }
            return calendar.isDate(startDate, inSameDayAs: selectedDate)
        }
    }

    @MainActor
    private func loadData() async {
        await calendarService.fetchCalendars()
        await calendarService.fetchColors()
        await loadEvents()
    }

    @MainActor
    private func loadWeather(location: CLLocation) async {
        do {
            weather = try await WeatherService.shared.getCurrentWeather(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude
            )
        } catch {
            // Silently fail - weather is optional
        }
    }

    private var eventsLoadToken: EventsLoadToken {
        EventsLoadToken(date: selectedDate, viewMode: viewMode)
    }

    private struct EventsLoadToken: Hashable {
        let date: Date
        let viewMode: CalendarViewMode
    }

    private func loadEvents() async {
        let (startDate, endDate) = dateRangeForViewMode()
        await calendarService.fetchEvents(from: startDate, to: endDate)
    }

    private func dateRangeForViewMode() -> (start: Date, end: Date) {
        switch viewMode {
        case .day:
            // Load a week's worth for the week strip
            let weekStart = calendar.date(
                from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: selectedDate)
            )!
            let weekEnd = calendar.date(byAdding: .day, value: 7, to: weekStart)!
            return (weekStart.startOfDay, weekEnd.endOfDay)

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

// MARK: - Date Picker Sheet

private struct DatePickerSheet: View {
    @Binding var selectedDate: Date
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack {
                DatePicker(
                    "Select date",
                    selection: $selectedDate,
                    displayedComponents: [.date]
                )
                .datePickerStyle(.graphical)
                .labelsHidden()
                .padding(20)

                Spacer()
            }
            .navigationTitle("Jump to Date")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
