import SwiftUI

// MARK: - Haptic Feedback Helper

enum HapticFeedback {
    static func light() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }

    static func medium() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    }

    static func success() {
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }

    static func warning() {
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    }

    static func error() {
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    }

    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }
}

// MARK: - Date Helpers

enum DateHelpers {
    static func nextWeekend() -> Date {
        let calendar = Calendar.current
        let today = Date()
        let weekday = calendar.component(.weekday, from: today)
        let daysUntilSaturday = (7 - weekday + 7) % 7
        return calendar.date(
            byAdding: .day,
            value: daysUntilSaturday == 0 ? 7 : daysUntilSaturday,
            to: calendar.startOfDay(for: today)
        )!
    }

    static func nextMonday() -> Date {
        let calendar = Calendar.current
        let today = Date()
        let weekday = calendar.component(.weekday, from: today)
        let daysUntilMonday = (9 - weekday) % 7
        return calendar.date(
            byAdding: .day,
            value: daysUntilMonday == 0 ? 7 : daysUntilMonday,
            to: calendar.startOfDay(for: today)
        )!
    }
}
