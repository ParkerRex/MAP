import Foundation

/// Service for managing calendar data with local caching and API sync
@MainActor
public class CalendarService: ObservableObject {
    public static let shared = CalendarService()

    @Published public private(set) var calendars: [CalendarInfo] = []
    @Published public private(set) var events: [CalendarEvent] = []
    @Published public private(set) var colors: CalendarColors?
    @Published public private(set) var selectedCalendarIds: Set<String> = []
    @Published public private(set) var isLoading = false
    @Published public private(set) var isSyncing = false
    @Published public private(set) var error: Error?

    private let apiClient: MapAPIClient
    private let userDefaults = UserDefaults.standard
    private let selectedCalendarsKey = "map.selectedCalendarIds"
    private var eventsRequestToken: UInt = 0

    public init(apiClient: MapAPIClient = .shared) {
        self.apiClient = apiClient
        loadSelectedCalendars()
    }

    // MARK: - Persistence

    private func loadSelectedCalendars() {
        if let ids = userDefaults.stringArray(forKey: selectedCalendarsKey) {
            selectedCalendarIds = Set(ids)
        }
    }

    private func saveSelectedCalendars() {
        userDefaults.set(Array(selectedCalendarIds), forKey: selectedCalendarsKey)
    }

    // MARK: - Calendar Selection

    /// Select or deselect a calendar
    public func toggleCalendarSelection(_ calendarId: String) {
        if selectedCalendarIds.contains(calendarId) {
            selectedCalendarIds.remove(calendarId)
        } else {
            selectedCalendarIds.insert(calendarId)
        }
        saveSelectedCalendars()
    }

    /// Set selected calendars
    public func setSelectedCalendars(_ ids: Set<String>) {
        selectedCalendarIds = ids
        saveSelectedCalendars()
    }

    /// Check if a calendar is selected
    public func isCalendarSelected(_ calendarId: String) -> Bool {
        // If no calendars are explicitly selected, show primary by default
        if selectedCalendarIds.isEmpty {
            return calendars.first(where: { $0.id == calendarId })?.isPrimary == true
        }
        return selectedCalendarIds.contains(calendarId)
    }

    // MARK: - Fetch Operations

    /// Fetch all calendars
    public func fetchCalendars(refresh: Bool = false) async {
        isLoading = true
        error = nil

        do {
            calendars = try await apiClient.getCalendars(refresh: refresh)

            // If no calendars are selected, select the primary one by default
            if selectedCalendarIds.isEmpty, let primary = calendars.first(where: { $0.isPrimary == true }) {
                selectedCalendarIds.insert(primary.id)
                saveSelectedCalendars()
            }
        } catch {
            self.error = error
        }

        isLoading = false
    }

    /// Fetch events for a date range from selected calendars
    public func fetchEvents(
        from startDate: Date,
        to endDate: Date,
        calendarId: String? = nil
    ) async {
        eventsRequestToken &+= 1
        let requestToken = eventsRequestToken
        isLoading = true
        error = nil

        do {
            if let specificCalendar = calendarId {
                // Fetch from specific calendar
                let response = try await apiClient.getEvents(
                    calendarId: specificCalendar,
                    timeMin: startDate,
                    timeMax: endDate
                )
                if requestToken == eventsRequestToken {
                    events = response.events
                }
            } else {
                // Fetch from all selected calendars
                let calendarIds = activeCalendarIds
                if calendarIds.isEmpty {
                    if requestToken == eventsRequestToken {
                        events = []
                    }
                } else if calendarIds.count == 1 {
                    let response = try await apiClient.getEvents(
                        calendarId: calendarIds[0],
                        timeMin: startDate,
                        timeMax: endDate
                    )
                    if requestToken == eventsRequestToken {
                        events = response.events
                    }
                } else {
                    let response = try await apiClient.getMultiCalendarEvents(
                        calendarIds: calendarIds,
                        timeMin: startDate,
                        timeMax: endDate
                    )
                    if requestToken == eventsRequestToken {
                        events = response
                    }
                }
            }
        } catch {
            if requestToken == eventsRequestToken {
                self.error = error
            }
        }

        if requestToken == eventsRequestToken {
            isLoading = false
        }
    }

    /// Fetch calendar colors
    public func fetchColors() async {
        do {
            colors = try await apiClient.getColors()
        } catch {
            // Colors are optional, don't set error
        }
    }

    /// Sync calendars with Google
    public func syncCalendars(forceFullSync: Bool = false) async throws -> SyncCalendarsResponse {
        isSyncing = true
        defer { isSyncing = false }

        let response = try await apiClient.syncCalendars(forceFullSync: forceFullSync)
        await fetchCalendars()
        return response
    }

    /// Refresh all calendar data
    public func refresh() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.fetchCalendars() }
            group.addTask { await self.fetchColors() }
        }
    }

    // MARK: - Event Operations

    /// Create a new event
    @discardableResult
    public func createEvent(
        summary: String,
        start: Date,
        end: Date,
        isAllDay: Bool = false,
        description: String? = nil,
        location: String? = nil,
        calendarId: String = "primary",
        colorId: String? = nil,
        addConference: Bool = false
    ) async throws -> CalendarEvent {
        let timeZone = TimeZone.current.identifier

        let startDateTime: EventDateTime
        let endDateTime: EventDateTime

        if isAllDay {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            startDateTime = EventDateTime(date: formatter.string(from: start))
            endDateTime = EventDateTime(date: formatter.string(from: end))
        } else {
            startDateTime = EventDateTime(dateTime: start.iso8601String, timeZone: timeZone)
            endDateTime = EventDateTime(dateTime: end.iso8601String, timeZone: timeZone)
        }

        var request = CreateEventRequest(
            summary: summary,
            description: description,
            location: location,
            start: startDateTime,
            end: endDateTime,
            colorId: colorId
        )

        if addConference {
            request.conferenceData = ConferenceDataRequest(
                createRequest: ConferenceCreateRequest(
                    requestId: UUID().uuidString,
                    conferenceSolutionKey: ConferenceSolutionKey(type: "hangoutsMeet")
                )
            )
        }

        let event = try await apiClient.createEvent(
            request,
            calendarId: calendarId,
            addConference: addConference
        )

        // Add to local events list (sorted by start time)
        events.append(event)
        sortEvents()

        return event
    }

    /// Update an existing event
    @discardableResult
    public func updateEvent(
        _ event: CalendarEvent,
        summary: String? = nil,
        start: Date? = nil,
        end: Date? = nil,
        isAllDay: Bool? = nil,
        description: String? = nil,
        location: String? = nil,
        calendarId: String = "primary",
        colorId: String? = nil,
        status: String? = nil
    ) async throws -> CalendarEvent {
        guard let eventId = event.id else {
            throw CalendarServiceError.missingEventId
        }

        let timeZone = TimeZone.current.identifier
        var startDateTime: EventDateTime?
        var endDateTime: EventDateTime?

        if let startDate = start {
            let allDay = isAllDay ?? event.isAllDay
            if allDay {
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                startDateTime = EventDateTime(date: formatter.string(from: startDate))
            } else {
                startDateTime = EventDateTime(dateTime: startDate.iso8601String, timeZone: timeZone)
            }
        }

        if let endDate = end {
            let allDay = isAllDay ?? event.isAllDay
            if allDay {
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                endDateTime = EventDateTime(date: formatter.string(from: endDate))
            } else {
                endDateTime = EventDateTime(dateTime: endDate.iso8601String, timeZone: timeZone)
            }
        }

        let request = UpdateEventRequest(
            summary: summary,
            description: description,
            location: location,
            start: startDateTime,
            end: endDateTime,
            colorId: colorId,
            status: status
        )

        let updated = try await apiClient.updateEvent(
            eventId: eventId,
            request,
            calendarId: calendarId
        )

        // Update local events list
        if let index = events.firstIndex(where: { $0.id == eventId }) {
            events[index] = updated
            sortEvents()
        }

        return updated
    }

    /// Delete an event
    public func deleteEvent(
        _ event: CalendarEvent,
        calendarId: String = "primary",
        sendUpdates: String? = nil
    ) async throws {
        guard let eventId = event.id else {
            throw CalendarServiceError.missingEventId
        }

        try await apiClient.deleteEvent(
            eventId: eventId,
            calendarId: calendarId,
            sendUpdates: sendUpdates
        )

        // Remove from local events list
        events.removeAll { $0.id == eventId }
    }

    // MARK: - Computed Properties

    /// Calendar IDs to fetch events from (selected or primary)
    public var activeCalendarIds: [String] {
        if selectedCalendarIds.isEmpty {
            // Default to primary calendar
            if let primary = calendars.first(where: { $0.isPrimary == true }) {
                return [primary.id]
            }
            return calendars.first.map { [$0.id] } ?? []
        }
        return Array(selectedCalendarIds)
    }

    /// Primary calendar
    public var primaryCalendar: CalendarInfo? {
        calendars.first(where: { $0.isPrimary == true }) ?? calendars.first
    }

    /// Events for today
    public var todaysEvents: [CalendarEvent] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let tomorrow = calendar.date(byAdding: .day, value: 1, to: today)!

        return events.filter { event in
            guard let startDate = event.startDate else { return false }
            return startDate >= today && startDate < tomorrow
        }
    }

    /// Upcoming events (next 7 days)
    public var upcomingEvents: [CalendarEvent] {
        let now = Date()
        let weekFromNow = Calendar.current.date(byAdding: .day, value: 7, to: now)!

        return events.filter { event in
            guard let startDate = event.startDate else { return false }
            return startDate >= now && startDate <= weekFromNow
        }
    }

    // MARK: - Helpers

    private func sortEvents() {
        events.sort { event1, event2 in
            guard let date1 = event1.startDate, let date2 = event2.startDate else {
                return false
            }
            return date1 < date2
        }
    }

    /// Get color for an event
    public func colorForEvent(_ event: CalendarEvent) -> (background: String, foreground: String)? {
        guard let colorId = event.colorId,
              let eventColors = colors?.event,
              let colorPair = eventColors[colorId] else {
            return nil
        }
        return (colorPair.background, colorPair.foreground)
    }

    /// Get color for a calendar
    public func colorForCalendar(_ calendar: CalendarInfo) -> (background: String, foreground: String)? {
        // First check if calendar has its own color
        if let bg = calendar.backgroundColor, let fg = calendar.foregroundColor {
            return (bg, fg)
        }
        // Fall back to color ID
        guard let colorId = calendar.colorId,
              let calendarColors = colors?.calendar,
              let colorPair = calendarColors[colorId] else {
            return nil
        }
        return (colorPair.background, colorPair.foreground)
    }
}

// MARK: - Errors

public enum CalendarServiceError: LocalizedError {
    case missingEventId
    case invalidDateRange

    public var errorDescription: String? {
        switch self {
        case .missingEventId:
            return "Event ID is required for this operation"
        case .invalidDateRange:
            return "Invalid date range specified"
        }
    }
}
