import Foundation

public extension Date {
    /// - Returns: A `Date` object representing the start of the current day.
    static func startOfToday() -> Date {
        Calendar.current.startOfDay(for: Date())
    }

    /// - Returns: A `Date` object representing the start of the day exactly two weeks ago.
    func twoWeeksAgoStartOfDay() -> Date {
        Calendar.current.date(byAdding: DateComponents(day: -14), to: Date.startOfToday()) ?? Date()
    }

    /// Returns an ISO 8601 formatted string
    var iso8601String: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: self)
    }

    /// Start of day for this date
    var startOfDay: Date {
        Calendar.current.startOfDay(for: self)
    }

    /// End of day for this date
    var endOfDay: Date {
        var components = DateComponents()
        components.day = 1
        components.second = -1
        return Calendar.current.date(byAdding: components, to: startOfDay) ?? self
    }
}
