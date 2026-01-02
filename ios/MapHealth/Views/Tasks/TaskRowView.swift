import MapHealthCore
import SwiftUI

// MARK: - Task Row View with Swipe

struct TaskRowView: View {
    let task: MapTask
    let onToggle: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    let onSchedule: (Date?) -> Void

    @State private var offset: CGFloat = 0
    @State private var showingScheduleMenu = false

    var body: some View {
        HStack(spacing: 12) {
            // Checkbox
            Button(action: onToggle) {
                ZStack {
                    Circle()
                        .stroke(
                            task.isCompleted ? Color.green : Color.secondary.opacity(0.5),
                            lineWidth: 2
                        )
                        .frame(width: 24, height: 24)

                    if task.isCompleted {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 24, height: 24)

                        Image(systemName: "checkmark")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(.white)
                    }
                }
            }
            .buttonStyle(.plain)

            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(task.title)
                    .strikethrough(task.isCompleted)
                    .foregroundStyle(task.isCompleted ? .secondary : .primary)
                    .lineLimit(2)

                if let body = task.body, !body.isEmpty {
                    Text(body)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                HStack(spacing: 8) {
                    if let dueAt = task.dueAt {
                        DueDateBadge(date: dueAt, isCompleted: task.isCompleted)
                    }

                    if !task.tags.isEmpty {
                        TagsRow(tags: task.tags)
                    }
                }
            }

            Spacer()
        }
        .padding(14)
        .mapHealthGlassSurface(
            cornerRadius: 14,
            tint: task.isCompleted ? .clear : .accentColor.opacity(0.03)
        )
        .contentShape(Rectangle())
        .onTapGesture {
            onEdit()
        }
        .swipeActions(edge: .leading, allowsFullSwipe: true) {
            Button {
                onToggle()
            } label: {
                Label(
                    task.isCompleted ? "Undo" : "Done",
                    systemImage: task.isCompleted ? "arrow.uturn.backward" : "checkmark"
                )
            }
            .tint(.green)
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive) {
                onDelete()
            } label: {
                Label("Delete", systemImage: "trash")
            }

            Button {
                showingScheduleMenu = true
            } label: {
                Label("Schedule", systemImage: "calendar")
            }
            .tint(.blue)
        }
        .confirmationDialog("Schedule", isPresented: $showingScheduleMenu) {
            Button("Today") {
                onSchedule(Calendar.current.startOfDay(for: Date()))
            }
            Button("Tomorrow") {
                onSchedule(
                    Calendar.current.date(
                        byAdding: .day,
                        value: 1,
                        to: Calendar.current.startOfDay(for: Date())
                    )
                )
            }
            Button("This Weekend") {
                onSchedule(DateHelpers.nextWeekend())
            }
            Button("Next Week") {
                onSchedule(DateHelpers.nextMonday())
            }
            if task.dueAt != nil {
                Button("Remove Date", role: .destructive) {
                    onSchedule(nil)
                }
            }
            Button("Cancel", role: .cancel) {}
        }
        .contextMenu {
            Button(action: onToggle) {
                Label(
                    task.isCompleted ? "Mark Incomplete" : "Mark Complete",
                    systemImage: "checkmark.circle"
                )
            }

            Button(action: onEdit) {
                Label("Edit", systemImage: "pencil")
            }

            Menu("Schedule") {
                Button {
                    onSchedule(Calendar.current.startOfDay(for: Date()))
                } label: {
                    Label("Today", systemImage: "sun.max.fill")
                }
                Button {
                    onSchedule(
                        Calendar.current.date(
                            byAdding: .day,
                            value: 1,
                            to: Calendar.current.startOfDay(for: Date())
                        )
                    )
                } label: {
                    Label("Tomorrow", systemImage: "sunrise.fill")
                }
                Button {
                    onSchedule(DateHelpers.nextWeekend())
                } label: {
                    Label("This Weekend", systemImage: "figure.walk")
                }
                Button {
                    onSchedule(DateHelpers.nextMonday())
                } label: {
                    Label("Next Week", systemImage: "calendar.badge.clock")
                }
                if task.dueAt != nil {
                    Divider()
                    Button(role: .destructive) {
                        onSchedule(nil)
                    } label: {
                        Label("Remove Date", systemImage: "calendar.badge.minus")
                    }
                }
            }

            Divider()

            Button(role: .destructive, action: onDelete) {
                Label("Delete", systemImage: "trash")
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.7), value: task.isCompleted)
    }
}

// MARK: - Due Date Badge

struct DueDateBadge: View {
    let date: Date
    let isCompleted: Bool

    private var icon: String {
        if isCompleted { return "calendar" }
        if date < Date() { return "exclamationmark.circle.fill" }
        if Calendar.current.isDateInToday(date) { return "sun.max.fill" }
        if Calendar.current.isDateInTomorrow(date) { return "sunrise.fill" }
        return "calendar"
    }

    private var formattedDate: String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "Today" }
        if calendar.isDateInTomorrow(date) { return "Tomorrow" }
        if calendar.isDateInYesterday(date) { return "Yesterday" }

        let formatter = DateFormatter()
        if calendar.isDate(date, equalTo: Date(), toGranularity: .weekOfYear) {
            formatter.dateFormat = "EEEE"
        } else if calendar.isDate(date, equalTo: Date(), toGranularity: .year) {
            formatter.dateFormat = "MMM d"
        } else {
            formatter.dateFormat = "MMM d, yyyy"
        }
        return formatter.string(from: date)
    }

    private var color: Color {
        if isCompleted { return .secondary }
        if date < Date() { return .red }
        if Calendar.current.isDateInToday(date) { return .orange }
        return .blue
    }

    var body: some View {
        HStack(spacing: 3) {
            Image(systemName: icon)
                .font(.caption2)
            Text(formattedDate)
                .font(.caption2)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(color.opacity(0.15))
        .foregroundStyle(color)
        .clipShape(Capsule())
    }
}

// MARK: - Tags Row

struct TagsRow: View {
    let tags: [TaskTag]

    var body: some View {
        HStack(spacing: 4) {
            ForEach(tags.prefix(2)) { tag in
                Text(tag.title)
                    .font(.caption2)
                    .padding(.horizontal, 5)
                    .padding(.vertical, 2)
                    .background(.secondary.opacity(0.15))
                    .clipShape(Capsule())
            }

            if tags.count > 2 {
                Text("+\(tags.count - 2)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
