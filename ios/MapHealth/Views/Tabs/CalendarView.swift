import MapHealthCore
import SwiftUI

struct CalendarView: View {
    @State private var selectedDate = Date()

    var body: some View {
        NavigationStack {
            calendarContent
                .navigationTitle("Calendar")
        }
    }

    @ViewBuilder
    private var calendarContent: some View {
        if #available(iOS 26, *) {
            ScrollView {
                calendarBody
            }
            .contentMargins(.horizontal, 20, for: .scrollContent)
            .contentMargins(.vertical, 16, for: .scrollContent)
        } else {
            ScrollView {
                calendarBody
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
            }
        }
    }

    private var calendarBody: some View {
        VStack(spacing: 20) {
            DatePicker(
                "Select Date",
                selection: $selectedDate,
                displayedComponents: .date
            )
            .datePickerStyle(.graphical)
            .mapHealthGlassSurface(cornerRadius: 20, tint: .accentColor.opacity(0.04))

            VStack(alignment: .leading, spacing: 12) {
                Text("Events")
                    .font(.headline)
                    .foregroundStyle(.secondary)

                VStack(alignment: .leading, spacing: 8) {
                    Image(systemName: "calendar.badge.clock")
                        .font(.title)
                        .foregroundStyle(.secondary)
                    Text("No events scheduled")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(32)
                .mapHealthGlassSurface(cornerRadius: 16, tint: .accentColor.opacity(0.04))
            }
        }
    }
}
