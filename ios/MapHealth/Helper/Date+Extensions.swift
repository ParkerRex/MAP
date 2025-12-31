



import Foundation
import Foundation


extension Date {
    /// - Returns: A `Date` object representing the start of the current day.
    static func startOfDay() -> Date {
        Calendar.current.startOfDay(for: Date())
    }

    /// - Returns: A `Date` object representing the start of the day exactly two weeks ago.
    func twoWeeksAgoStartOfDay() -> Date {
        Calendar.current.date(byAdding: DateComponents(day: -14), to: Date.startOfDay()) ?? Date()
    }
}
