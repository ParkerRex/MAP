import MapHealthCore
import SwiftUI

struct CalendarPickerSheet: View {
    @ObservedObject var calendarService: CalendarService
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                ForEach(calendarService.calendars) { calendar in
                    CalendarPickerRow(
                        calendar: calendar,
                        isSelected: calendarService.isCalendarSelected(calendar.id),
                        calendarService: calendarService
                    )
                }
            }
            .navigationTitle("Calendars")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

private struct CalendarPickerRow: View {
    let calendar: CalendarInfo
    let isSelected: Bool
    let calendarService: CalendarService

    var body: some View {
        Button { calendarService.toggleCalendarSelection(calendar.id) } label: {
            HStack {
                Circle()
                    .fill(calendarColor)
                    .frame(width: 12, height: 12)

                VStack(alignment: .leading) {
                    Text(calendar.summary ?? "Calendar")
                        .foregroundStyle(.primary)
                    if calendar.isPrimary == true {
                        Text("Primary")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark")
                        .foregroundStyle(Color.accentColor)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var calendarColor: Color {
        if let colors = calendarService.colorForCalendar(calendar) {
            return Color(hex: colors.background) ?? Color.accentColor
        }
        if let backgroundColor = calendar.backgroundColor {
            return Color(hex: backgroundColor) ?? Color.accentColor
        }
        return Color.accentColor
    }
}
