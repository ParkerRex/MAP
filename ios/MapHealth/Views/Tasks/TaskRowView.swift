import MapHealthCore
import SwiftUI

struct TaskRow<ProjectMenu: View, ExtraMenu: View>: View {
    let task: MapTask
    let projectTitle: String?
    let projectTint: Color?
    let onToggle: () -> Void
    let onTap: () -> Void
    let onDelete: () -> Void
    let projectMenu: ProjectMenu
    let extraMenu: ExtraMenu

    init(
        task: MapTask,
        projectTitle: String? = nil,
        projectTint: Color? = nil,
        onToggle: @escaping () -> Void,
        onTap: @escaping () -> Void,
        onDelete: @escaping () -> Void,
        @ViewBuilder projectMenu: () -> ProjectMenu = { EmptyView() },
        @ViewBuilder extraMenu: () -> ExtraMenu = { EmptyView() }
    ) {
        self.task = task
        self.projectTitle = projectTitle
        self.projectTint = projectTint
        self.onToggle = onToggle
        self.onTap = onTap
        self.onDelete = onDelete
        self.projectMenu = projectMenu()
        self.extraMenu = extraMenu()
    }

    var body: some View {
        HStack(spacing: 14) {
            checkbox
            content
            Spacer(minLength: 0)
            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary.opacity(0.4))
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onTap)
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive, action: onDelete) {
                Label("Delete", systemImage: "trash")
            }
        }
        .swipeActions(edge: .leading, allowsFullSwipe: true) {
            Button(action: onToggle) {
                Label(
                    task.isCompleted ? "Undo" : "Done",
                    systemImage: task.isCompleted ? "arrow.uturn.backward" : "checkmark"
                )
            }
            .tint(.green)
        }
        .contextMenu {
            Button(action: onToggle) {
                Label(
                    task.isCompleted ? "Mark Incomplete" : "Mark Complete",
                    systemImage: task.isCompleted ? "circle" : "checkmark.circle"
                )
            }
            Button(action: onTap) {
                Label("Edit", systemImage: "pencil")
            }
            projectMenu
            extraMenu
            Divider()
            Button(role: .destructive, action: onDelete) {
                Label("Delete", systemImage: "trash")
            }
        }
    }

    private var checkbox: some View {
        Button(action: onToggle) {
            ZStack {
                Circle()
                    .strokeBorder(
                        task.isCompleted ? Color.green : Color.secondary.opacity(0.4),
                        lineWidth: 2
                    )
                    .frame(width: 24, height: 24)

                if task.isCompleted {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 24, height: 24)

                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white)
                }
            }
            .animation(.spring(response: 0.25, dampingFraction: 0.6), value: task.isCompleted)
        }
        .buttonStyle(.plain)
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(task.title)
                .font(.body)
                .foregroundStyle(task.isCompleted ? .secondary : .primary)
                .strikethrough(task.isCompleted, color: .secondary)
                .lineLimit(2)

            if hasSubtitle {
                subtitleRow
            }
        }
    }

    private var hasSubtitle: Bool {
        projectTitle != nil ||
        task.dueAt != nil ||
        (task.body != nil && !task.body!.isEmpty)
    }

    @ViewBuilder
    private var subtitleRow: some View {
        HStack(spacing: 6) {
            if let projectTitle {
                Circle()
                    .fill(projectTint ?? .secondary)
                    .frame(width: 6, height: 6)

                Text(projectTitle)
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color(.tertiarySystemGroupedBackground))
                    .clipShape(Capsule())
                    .foregroundStyle(.secondary)
            }

            if let dueAt = task.dueAt {
                dueDateLabel(dueAt)
            }

            if let body = task.body, !body.isEmpty {
                Text(body)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
    }

    private func dueDateLabel(_ date: Date) -> some View {
        HStack(spacing: 3) {
            Image(systemName: dueDateIcon(date))
                .font(.system(size: 10, weight: .medium))
            Text(formatDueDate(date))
                .font(.subheadline.weight(.medium))
        }
        .foregroundStyle(dueDateColor(date))
    }

    private func dueDateIcon(_ date: Date) -> String {
        if task.isCompleted { return "calendar" }
        if date < Date() { return "exclamationmark.circle.fill" }
        if Calendar.current.isDateInToday(date) { return "sun.max.fill" }
        return "calendar"
    }

    private func dueDateColor(_ date: Date) -> Color {
        if task.isCompleted { return .secondary }
        if date < Calendar.current.startOfDay(for: Date()) { return .red }
        if Calendar.current.isDateInToday(date) { return .orange }
        return .blue
    }

    private func formatDueDate(_ date: Date) -> String {
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
}
