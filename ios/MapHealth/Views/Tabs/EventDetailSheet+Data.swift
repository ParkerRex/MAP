import MapHealthCore
import SwiftUI

extension EventDetailSheet {
    var videoConferenceLink: String? {
        if let link = event.hangoutLink { return link }
        return event.conferenceData?.entryPoints?.first(where: { $0.entryPointType == "video" })?.uri
    }

    var conferenceName: String {
        event.conferenceData?.conferenceSolution?.name ?? "Google Meet"
    }

    func openInMaps(_ location: String) {
        let encoded = location.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? location
        if let url = URL(string: "maps://?q=\(encoded)") {
            UIApplication.shared.open(url)
        }
    }

    var alertLabel: String {
        "None"
    }

    var calendarLabel: String {
        if let organizer = event.organizer?.displayName, !organizer.isEmpty {
            return organizer
        }
        if let organizerEmail = event.organizer?.email, !organizerEmail.isEmpty {
            return organizerEmail
        }
        if let primary = calendarService.primaryCalendar?.summary, !primary.isEmpty {
            return primary
        }
        return "Primary"
    }

    var colorLabel: String {
        calendarService.colorForEvent(event) == nil ? "None" : "Custom"
    }

    var availabilityLabel: String {
        switch event.transparency {
        case "transparent": return "Free"
        case "opaque": return "Busy"
        default: return "Busy"
        }
    }

    var repeatsDescription: String? {
        guard let rule = recurrenceRule else { return nil }
        return formatRecurrence(rule)
    }

    var backButtonTitle: String {
        guard let startDate = event.startDate else { return "Back" }
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE, MMM d"
        return formatter.string(from: startDate)
    }

    var recurrenceRule: String? {
        event.recurrence?.first(where: { $0.contains("RRULE") })
    }

    func formatRecurrence(_ rule: String) -> String {
        let cleaned = rule.replacingOccurrences(of: "RRULE:", with: "")
        let parts = cleaned.split(separator: ";")
        var values: [String: String] = [:]
        for part in parts {
            let pair = part.split(separator: "=", maxSplits: 1)
            if pair.count == 2 {
                values[String(pair[0]).uppercased()] = String(pair[1]).uppercased()
            }
        }

        let freq = values["FREQ"] ?? "DAILY"
        let interval = Int(values["INTERVAL"] ?? "1") ?? 1
        let days = values["BYDAY"]?.split(separator: ",").map { $0 } ?? []

        let frequencyLabel: String
        switch freq {
        case "WEEKLY": frequencyLabel = interval == 1 ? "every week" : "every \(interval) weeks"
        case "MONTHLY": frequencyLabel = interval == 1 ? "every month" : "every \(interval) months"
        case "YEARLY": frequencyLabel = interval == 1 ? "every year" : "every \(interval) years"
        default: frequencyLabel = interval == 1 ? "every day" : "every \(interval) days"
        }

        if !days.isEmpty {
            let dayNames = days.compactMap(mapWeekday)
            return "Repeats \(frequencyLabel) on \(dayNames.joined(separator: ", "))"
        }
        return "Repeats \(frequencyLabel)"
    }

    func mapWeekday(_ code: Substring) -> String? {
        switch code {
        case "MO": return "Mon"
        case "TU": return "Tue"
        case "WE": return "Wed"
        case "TH": return "Thu"
        case "FR": return "Fri"
        case "SA": return "Sat"
        case "SU": return "Sun"
        default: return nil
        }
    }

    func deleteEvent() async {
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
