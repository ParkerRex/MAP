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
