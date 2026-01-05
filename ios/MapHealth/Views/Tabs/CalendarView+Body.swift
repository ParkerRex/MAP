import CoreLocation
import MapHealthCore
import SwiftUI

extension CalendarView {
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                calendarHUD

                if showWeekStrip {
                    CalendarWeekStrip(
                        selectedDate: $selectedDate,
                        events: calendarService.events,
                        onDateDoubleTap: { date in
                            createEventStartDate = date
                            createEventIsAllDay = false
                            showingCreateEvent = true
                        },
                        showsHeader: false
                    )
                    .padding(.horizontal, 20)
                    .padding(.bottom, 12)
                    .transition(.move(edge: .top).combined(with: .opacity))
                }

                Divider()
                    .padding(.horizontal, 20)

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
                    initialStartDate: createEventStartDate,
                    initialIsAllDay: createEventIsAllDay
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

    @ViewBuilder
    private var mainContent: some View {
        switch viewMode {
        case .day:
            dayView
                .simultaneousGesture(daySwipeGesture)
                .offset(x: dayDragOffset)
        case .week:
            weekView
        case .month:
            monthView
        }
    }

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
                        createEventIsAllDay = false
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
                        createEventIsAllDay = false
                        showingCreateEvent = true
                    },
                    onCreateEventAt: { date in
                        createEventStartDate = date
                        createEventIsAllDay = false
                        selectedDate = date
                        showingCreateEvent = true
                    },
                    onCreateAllDay: {
                        createEventStartDate = calendar.startOfDay(for: selectedDate)
                        createEventIsAllDay = true
                        showingCreateEvent = true
                    }
                )
                .padding(20)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .animation(.easeInOut(duration: 0.2), value: calendarService.isLoading)
    }

    private var daySwipeGesture: some Gesture {
        DragGesture(minimumDistance: 30)
            .updating($dayDragOffset) { value, state, _ in
                let isHorizontal = abs(value.translation.width) > abs(value.translation.height)
                state = isHorizontal ? value.translation.width * 0.2 : 0
            }
            .onEnded { value in
                let threshold: CGFloat = 60
                guard abs(value.translation.width) > abs(value.translation.height) else { return }
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
}
