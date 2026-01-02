import Foundation

// MARK: - Calendar Event

public struct CalendarEvent: Codable, Identifiable {
    public var id: String?
    public var summary: String?
    public var description: String?
    public var location: String?
    public var start: EventDateTime?
    public var end: EventDateTime?
    public var status: String?
    public var colorId: String?
    public var htmlLink: String?
    public var created: String?
    public var updated: String?
    public var creator: EventPerson?
    public var organizer: EventPerson?
    public var attendees: [EventAttendee]?
    public var hangoutLink: String?
    public var conferenceData: ConferenceData?
    public var recurringEventId: String?
    public var recurrence: [String]?
    public var transparency: String?
    public var visibility: String?
    public var eventType: String?

    public init(
        id: String? = nil,
        summary: String? = nil,
        description: String? = nil,
        location: String? = nil,
        start: EventDateTime? = nil,
        end: EventDateTime? = nil,
        status: String? = nil,
        colorId: String? = nil
    ) {
        self.id = id
        self.summary = summary
        self.description = description
        self.location = location
        self.start = start
        self.end = end
        self.status = status
        self.colorId = colorId
    }

    /// Returns true if this is an all-day event
    public var isAllDay: Bool {
        start?.date != nil
    }

    /// Returns the start date/time as a Date object
    public var startDate: Date? {
        if let dateTime = start?.dateTime {
            return ISO8601DateFormatter().date(from: dateTime)
        } else if let dateString = start?.date {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            return formatter.date(from: dateString)
        }
        return nil
    }

    /// Returns the end date/time as a Date object
    public var endDate: Date? {
        if let dateTime = end?.dateTime {
            return ISO8601DateFormatter().date(from: dateTime)
        } else if let dateString = end?.date {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            return formatter.date(from: dateString)
        }
        return nil
    }

    /// Formatted time string for display
    public var timeString: String {
        guard let start = startDate else { return "" }

        if isAllDay {
            return "All day"
        }

        let formatter = DateFormatter()
        formatter.timeStyle = .short

        if let end = endDate {
            return "\(formatter.string(from: start)) - \(formatter.string(from: end))"
        }
        return formatter.string(from: start)
    }
}

public struct EventDateTime: Codable {
    public var dateTime: String?
    public var date: String?
    public var timeZone: String?

    public init(dateTime: String? = nil, date: String? = nil, timeZone: String? = nil) {
        self.dateTime = dateTime
        self.date = date
        self.timeZone = timeZone
    }
}

public struct EventPerson: Codable {
    public var email: String?
    public var displayName: String?
    public var `self`: Bool?

    public init(email: String? = nil, displayName: String? = nil, isSelf: Bool? = nil) {
        self.email = email
        self.displayName = displayName
        self.`self` = isSelf
    }

    private enum CodingKeys: String, CodingKey {
        case email
        case displayName
        case `self`
    }
}

public struct EventAttendee: Codable {
    public var email: String?
    public var displayName: String?
    public var responseStatus: String?
    public var organizer: Bool?
    public var `self`: Bool?
    public var optional: Bool?

    public init(
        email: String? = nil,
        displayName: String? = nil,
        responseStatus: String? = nil
    ) {
        self.email = email
        self.displayName = displayName
        self.responseStatus = responseStatus
    }

    private enum CodingKeys: String, CodingKey {
        case email
        case displayName
        case responseStatus
        case organizer
        case `self`
        case optional
    }
}

public struct ConferenceData: Codable {
    public var conferenceId: String?
    public var conferenceSolution: ConferenceSolution?
    public var entryPoints: [EntryPoint]?

    public init(conferenceId: String? = nil) {
        self.conferenceId = conferenceId
    }
}

public struct ConferenceSolution: Codable {
    public var name: String?
    public var iconUri: String?

    public init(name: String? = nil) {
        self.name = name
    }
}

public struct EntryPoint: Codable {
    public var entryPointType: String?
    public var uri: String?
    public var label: String?

    public init(entryPointType: String? = nil, uri: String? = nil) {
        self.entryPointType = entryPointType
        self.uri = uri
    }
}

// MARK: - Calendar

public struct CalendarInfo: Codable, Identifiable {
    public var id: String
    public var summary: String?
    public var description: String?
    public var backgroundColor: String?
    public var foregroundColor: String?
    public var colorId: String?
    public var selected: Bool?
    public var isPrimary: Bool?
    public var accessRole: String?
    public var timeZone: String?

    public init(
        id: String,
        summary: String? = nil,
        backgroundColor: String? = nil,
        isPrimary: Bool? = nil
    ) {
        self.id = id
        self.summary = summary
        self.backgroundColor = backgroundColor
        self.isPrimary = isPrimary
    }
}

// MARK: - API Responses

public struct CalendarsResponse: Codable {
    public var calendars: [CalendarInfo]

    public init(calendars: [CalendarInfo]) {
        self.calendars = calendars
    }
}

public struct EventsResponse: Codable {
    public var events: [CalendarEvent]
    public var nextPageToken: String?

    public init(events: [CalendarEvent], nextPageToken: String? = nil) {
        self.events = events
        self.nextPageToken = nextPageToken
    }
}

public struct EventResponse: Codable {
    public var event: CalendarEvent

    public init(event: CalendarEvent) {
        self.event = event
    }
}

public struct DeleteEventResponse: Codable {
    public var success: Bool

    public init(success: Bool) {
        self.success = success
    }
}

// MARK: - Colors

public struct CalendarColors: Codable {
    public var calendar: [String: ColorPair]?
    public var event: [String: ColorPair]?

    public init(calendar: [String: ColorPair]? = nil, event: [String: ColorPair]? = nil) {
        self.calendar = calendar
        self.event = event
    }
}

public struct ColorPair: Codable {
    public var background: String
    public var foreground: String

    public init(background: String, foreground: String) {
        self.background = background
        self.foreground = foreground
    }
}

public struct ColorsResponse: Codable {
    public var colors: CalendarColors

    public init(colors: CalendarColors) {
        self.colors = colors
    }
}

// MARK: - Sync

public struct SyncCalendarsResponse: Codable {
    public var success: Bool
    public var calendarsSynced: Int?
    public var eventsSynced: Int?
    public var eventsDeleted: Int?
    public var errors: [String]?
    public var error: String?

    public init(success: Bool) {
        self.success = success
    }
}

// MARK: - Event Requests

public struct CreateEventRequest: Codable {
    public var summary: String?
    public var description: String?
    public var location: String?
    public var start: EventDateTime
    public var end: EventDateTime
    public var colorId: String?
    public var attendees: [EventAttendeeRequest]?
    public var reminders: EventReminders?
    public var visibility: String?
    public var transparency: String?
    public var conferenceData: ConferenceDataRequest?

    public init(
        summary: String? = nil,
        description: String? = nil,
        location: String? = nil,
        start: EventDateTime,
        end: EventDateTime,
        colorId: String? = nil,
        attendees: [EventAttendeeRequest]? = nil,
        reminders: EventReminders? = nil,
        visibility: String? = nil,
        transparency: String? = nil,
        conferenceData: ConferenceDataRequest? = nil
    ) {
        self.summary = summary
        self.description = description
        self.location = location
        self.start = start
        self.end = end
        self.colorId = colorId
        self.attendees = attendees
        self.reminders = reminders
        self.visibility = visibility
        self.transparency = transparency
        self.conferenceData = conferenceData
    }
}

public struct UpdateEventRequest: Codable {
    public var summary: String?
    public var description: String?
    public var location: String?
    public var start: EventDateTime?
    public var end: EventDateTime?
    public var colorId: String?
    public var attendees: [EventAttendeeRequest]?
    public var reminders: EventReminders?
    public var visibility: String?
    public var transparency: String?
    public var status: String?

    public init(
        summary: String? = nil,
        description: String? = nil,
        location: String? = nil,
        start: EventDateTime? = nil,
        end: EventDateTime? = nil,
        colorId: String? = nil,
        attendees: [EventAttendeeRequest]? = nil,
        reminders: EventReminders? = nil,
        visibility: String? = nil,
        transparency: String? = nil,
        status: String? = nil
    ) {
        self.summary = summary
        self.description = description
        self.location = location
        self.start = start
        self.end = end
        self.colorId = colorId
        self.attendees = attendees
        self.reminders = reminders
        self.visibility = visibility
        self.transparency = transparency
        self.status = status
    }
}

public struct EventAttendeeRequest: Codable {
    public var email: String
    public var displayName: String?
    public var optional: Bool?
    public var responseStatus: String?
    public var comment: String?

    public init(
        email: String,
        displayName: String? = nil,
        optional: Bool? = nil,
        responseStatus: String? = nil,
        comment: String? = nil
    ) {
        self.email = email
        self.displayName = displayName
        self.optional = optional
        self.responseStatus = responseStatus
        self.comment = comment
    }
}

public struct EventReminders: Codable {
    public var useDefault: Bool?
    public var overrides: [ReminderOverride]?

    public init(useDefault: Bool? = nil, overrides: [ReminderOverride]? = nil) {
        self.useDefault = useDefault
        self.overrides = overrides
    }
}

public struct ReminderOverride: Codable {
    public var method: String // "email" or "popup"
    public var minutes: Int

    public init(method: String, minutes: Int) {
        self.method = method
        self.minutes = minutes
    }
}

public struct ConferenceDataRequest: Codable {
    public var createRequest: ConferenceCreateRequest?

    public init(createRequest: ConferenceCreateRequest? = nil) {
        self.createRequest = createRequest
    }
}

public struct ConferenceCreateRequest: Codable {
    public var requestId: String
    public var conferenceSolutionKey: ConferenceSolutionKey?

    public init(requestId: String, conferenceSolutionKey: ConferenceSolutionKey? = nil) {
        self.requestId = requestId
        self.conferenceSolutionKey = conferenceSolutionKey
    }
}

public struct ConferenceSolutionKey: Codable {
    public var type: String // "hangoutsMeet" or "addOn"

    public init(type: String = "hangoutsMeet") {
        self.type = type
    }
}
