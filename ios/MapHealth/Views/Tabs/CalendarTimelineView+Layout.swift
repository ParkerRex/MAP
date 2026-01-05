import MapHealthCore
import SwiftUI

extension CalendarTimelineView {
    var allDayEvents: [CalendarEvent] {
        events.filter { $0.isAllDay }.sorted { ($0.summary ?? "") < ($1.summary ?? "") }
    }

    var timedEvents: [CalendarEvent] {
        events.filter { !$0.isAllDay }.sorted { event1, event2 in
            (event1.startDate ?? .distantPast) < (event2.startDate ?? .distantPast)
        }
    }

    func offsetForTime(_ date: Date) -> CGFloat {
        let hour = calendar.component(.hour, from: date)
        let minute = calendar.component(.minute, from: date)
        return CGFloat(hour) * hourHeight + CGFloat(minute) / 60.0 * hourHeight
    }

    func eventDuration(_ event: CalendarEvent) -> CGFloat {
        guard let start = event.startDate, let end = event.endDate else {
            return 60
        }
        return CGFloat(end.timeIntervalSince(start) / 60.0)
    }

    func hourLabel(for hour: Int) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h a"
        var components = DateComponents()
        components.hour = hour
        if let date = calendar.date(from: components) {
            return formatter.string(from: date)
        }
        return "\(hour)"
    }

    func scrollToRelevantTime(proxy: ScrollViewProxy) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            if calendar.isDateInToday(selectedDate) {
                let hour = max(0, calendar.component(.hour, from: Date()) - 1)
                let offset = CGFloat(hour) * hourHeight
                proxy.scrollTo("timeline", anchor: UnitPoint(x: 0, y: offset / (hourHeight * 24)))
            } else if let firstEvent = timedEvents.first, let startDate = firstEvent.startDate {
                let hour = max(0, calendar.component(.hour, from: startDate) - 1)
                let offset = CGFloat(hour) * hourHeight
                proxy.scrollTo("timeline", anchor: UnitPoint(x: 0, y: offset / (hourHeight * 24)))
            } else {
                let offset = CGFloat(8) * hourHeight
                proxy.scrollTo("timeline", anchor: UnitPoint(x: 0, y: offset / (hourHeight * 24)))
            }
        }
    }

    func dateForTimelineOffset(_ offset: CGFloat) -> Date {
        let clamped = min(max(0, offset), hourHeight * 24)
        let minutes = (clamped / hourHeight) * 60
        let roundedMinutes = (minutes / 15).rounded() * 15
        let hour = Int(roundedMinutes) / 60
        let minute = Int(roundedMinutes) % 60

        var components = calendar.dateComponents([.year, .month, .day], from: selectedDate)
        components.hour = hour
        components.minute = minute

        return calendar.date(from: components) ?? selectedDate
    }

    func startOfDay(for date: Date) -> Date {
        calendar.startOfDay(for: date)
    }

    var timedEventLayout: [TimelineLayoutEvent] {
        buildTimelineLayout(for: timedEvents)
    }

    func buildTimelineLayout(for events: [CalendarEvent]) -> [TimelineLayoutEvent] {
        let sorted = events.sorted { lhs, rhs in
            (lhs.startDate ?? .distantPast) < (rhs.startDate ?? .distantPast)
        }
        let clusters = buildEventClusters(from: sorted)
        var result: [TimelineLayoutEvent] = []
        var nextId = 0
        for cluster in clusters {
            let layout = layoutCluster(cluster, startingId: nextId)
            result.append(contentsOf: layout.events)
            nextId = layout.nextId
        }
        return result
    }

    func eventEnd(_ event: CalendarEvent, fallbackStart: Date) -> Date {
        event.endDate ?? fallbackStart.addingTimeInterval(60 * 60)
    }

    func columnWidth(availableWidth: CGFloat, columns: Int) -> CGFloat {
        let spacing = timelineColumnSpacing * CGFloat(max(0, columns - 1))
        let width = (availableWidth - spacing) / CGFloat(max(1, columns))
        return max(0, width)
    }

    private func buildEventClusters(from events: [CalendarEvent]) -> [[CalendarEvent]] {
        var clusters: [[CalendarEvent]] = []
        var currentCluster: [CalendarEvent] = []
        var currentEnd: Date?

        for event in events {
            guard let start = event.startDate else { continue }
            let end = eventEnd(event, fallbackStart: start)

            if currentCluster.isEmpty {
                currentCluster = [event]
                currentEnd = end
                continue
            }

            if let clusterEnd = currentEnd, start < clusterEnd {
                currentCluster.append(event)
                if end > clusterEnd {
                    currentEnd = end
                }
            } else {
                clusters.append(currentCluster)
                currentCluster = [event]
                currentEnd = end
            }
        }

        if !currentCluster.isEmpty {
            clusters.append(currentCluster)
        }
        return clusters
    }

    private struct ColumnAssignment {
        let event: CalendarEvent
        let column: Int
    }

    private func layoutCluster(
        _ cluster: [CalendarEvent],
        startingId: Int
    ) -> (events: [TimelineLayoutEvent], nextId: Int) {
        let assignment = assignColumns(for: cluster)
        let columns = max(1, assignment.columns)
        var events: [TimelineLayoutEvent] = []
        events.reserveCapacity(assignment.assignments.count)
        var id = startingId
        for item in assignment.assignments {
            events.append(
                TimelineLayoutEvent(
                    id: id,
                    event: item.event,
                    column: item.column,
                    columns: columns
                )
            )
            id += 1
        }
        return (events, id)
    }

    private func assignColumns(for cluster: [CalendarEvent]) -> (columns: Int, assignments: [ColumnAssignment]) {
        var columnEndTimes: [Date] = []
        var assignments: [ColumnAssignment] = []

        for event in cluster {
            guard let start = event.startDate else { continue }
            let end = eventEnd(event, fallbackStart: start)
            var assignedColumn: Int?

            for index in columnEndTimes.indices where columnEndTimes[index] <= start {
                assignedColumn = index
                columnEndTimes[index] = end
                break
            }

            if assignedColumn == nil {
                columnEndTimes.append(end)
                assignedColumn = columnEndTimes.count - 1
            }

            assignments.append(ColumnAssignment(event: event, column: assignedColumn ?? 0))
        }

        return (columnEndTimes.count, assignments)
    }
}
