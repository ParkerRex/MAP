import MapHealthCore
import SwiftUI

struct TodosView: View {
    @StateObject private var tasksService = TasksService.shared
    @State private var showingAddSheet = false
    @State private var selectedTask: MapTask?
    @State private var showingEditSheet = false

    var body: some View {
        NavigationStack {
            todosContent
                .navigationTitle("Tasks")
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        addButton
                    }
                }
                .refreshable {
                    await tasksService.refresh()
                }
                .task {
                    if tasksService.tasks.isEmpty {
                        await tasksService.fetchTasks()
                    }
                }
                .sheet(isPresented: $showingAddSheet) {
                    AddTaskSheet(tasksService: tasksService)
                }
                .sheet(item: $selectedTask) { task in
                    EditTaskSheet(task: task, tasksService: tasksService)
                }
        }
    }

    @ViewBuilder
    private var todosContent: some View {
        if #available(iOS 26, *) {
            ScrollView {
                todosBody
            }
            .contentMargins(.horizontal, 20, for: .scrollContent)
            .contentMargins(.vertical, 16, for: .scrollContent)
        } else {
            ScrollView {
                todosBody
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
            }
        }
    }

    private var todosBody: some View {
        LazyVStack(spacing: 16) {
            if tasksService.isLoading && tasksService.tasks.isEmpty {
                loadingState
            } else if let error = tasksService.error {
                errorState(error)
            } else if tasksService.tasks.isEmpty {
                emptyState
            } else {
                taskSections
            }
        }
    }

    @ViewBuilder
    private var taskSections: some View {
        // Overdue tasks
        if !tasksService.overdueTasks.isEmpty {
            taskSection(title: "Overdue", icon: "exclamationmark.circle.fill", color: .red, tasks: tasksService.overdueTasks)
        }

        // Today's tasks
        if !tasksService.todaysTasks.isEmpty {
            taskSection(title: "Today", icon: "sun.max.fill", color: .orange, tasks: tasksService.todaysTasks)
        }

        // Upcoming tasks (with due dates, not overdue or today)
        let upcoming = tasksService.upcomingTasks.filter { task in
            guard let dueAt = task.dueAt else { return false }
            return !Calendar.current.isDateInToday(dueAt) && dueAt >= Date()
        }
        if !upcoming.isEmpty {
            taskSection(title: "Upcoming", icon: "calendar", color: .blue, tasks: upcoming)
        }

        // Other pending tasks (no due date)
        let noDueDate = tasksService.pendingTasks.filter { $0.dueAt == nil }
        if !noDueDate.isEmpty {
            taskSection(title: "No Due Date", icon: "tray.fill", color: .secondary, tasks: noDueDate)
        }

        // Completed tasks
        if !tasksService.completedTasks.isEmpty {
            completedSection
        }
    }

    private func taskSection(title: String, icon: String, color: Color, tasks: [MapTask]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Text(title)
                    .fontWeight(.semibold)
                Text("(\(tasks.count))")
                    .foregroundStyle(.secondary)
            }
            .font(.subheadline)
            .padding(.horizontal, 4)

            ForEach(tasks) { task in
                todoRow(task)
            }
        }
    }

    private var loadingState: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            Text("Loading tasks...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .accentColor.opacity(0.04))
    }

    private func errorState(_ error: Error) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 40))
                .foregroundStyle(.orange)
            Text("Failed to load tasks")
                .font(.headline)
            Text(error.localizedDescription)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("Try Again") {
                Task { await tasksService.fetchTasks() }
            }
            .mapHealthGlassButtonStyle(prominent: true)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .orange.opacity(0.06))
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 56))
                .foregroundStyle(.green)
            Text("All caught up!")
                .font(.title3)
                .fontWeight(.semibold)
            Text("Tap + to add a new task")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .green.opacity(0.06))
    }

    private var completedSection: some View {
        DisclosureGroup {
            ForEach(tasksService.completedTasks) { task in
                todoRow(task)
            }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
                Text("Completed")
                    .fontWeight(.semibold)
                Text("(\(tasksService.completedTasks.count))")
                    .foregroundStyle(.secondary)
            }
            .font(.subheadline)
        }
        .tint(.secondary)
    }

    private func todoRow(_ task: MapTask) -> some View {
        HStack(spacing: 12) {
            // Checkbox
            Button {
                Task { try? await tasksService.toggleTask(task) }
            } label: {
                Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(task.isCompleted ? .green : .secondary)
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
                        dueDateBadge(dueAt, isCompleted: task.isCompleted)
                    }

                    if !task.tags.isEmpty {
                        tagsRow(task.tags)
                    }
                }
            }

            Spacer()

            // Edit button
            Button {
                selectedTask = task
            } label: {
                Image(systemName: "pencil")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(14)
        .mapHealthGlassSurface(cornerRadius: 14, tint: task.isCompleted ? .clear : .accentColor.opacity(0.03))
        .contextMenu {
            Button {
                Task { try? await tasksService.toggleTask(task) }
            } label: {
                Label(task.isCompleted ? "Mark Incomplete" : "Mark Complete", systemImage: "checkmark.circle")
            }

            Button {
                selectedTask = task
            } label: {
                Label("Edit", systemImage: "pencil")
            }

            Divider()

            Button(role: .destructive) {
                Task { try? await tasksService.deleteTask(task) }
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
        .animation(.easeInOut(duration: 0.2), value: task.isCompleted)
    }

    private func dueDateBadge(_ date: Date, isCompleted: Bool) -> some View {
        HStack(spacing: 3) {
            Image(systemName: dueDateIcon(date, isCompleted: isCompleted))
                .font(.caption2)
            Text(formatDueDate(date))
                .font(.caption2)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 3)
        .background(dueDateColor(date, isCompleted: isCompleted).opacity(0.15))
        .foregroundStyle(dueDateColor(date, isCompleted: isCompleted))
        .clipShape(Capsule())
    }

    private func dueDateIcon(_ date: Date, isCompleted: Bool) -> String {
        if isCompleted { return "calendar" }
        if date < Date() { return "exclamationmark.circle.fill" }
        if Calendar.current.isDateInToday(date) { return "sun.max.fill" }
        if Calendar.current.isDateInTomorrow(date) { return "sunrise.fill" }
        return "calendar"
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

    private func dueDateColor(_ date: Date, isCompleted: Bool) -> Color {
        if isCompleted { return .secondary }
        if date < Date() { return .red }
        if Calendar.current.isDateInToday(date) { return .orange }
        return .blue
    }

    private func tagsRow(_ tags: [TaskTag]) -> some View {
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

    private var addButton: some View {
        Button {
            showingAddSheet = true
        } label: {
            Image(systemName: "plus")
        }
        .mapHealthGlassButtonStyle()
    }
}

// MARK: - Add Task Sheet

private struct AddTaskSheet: View {
    @ObservedObject var tasksService: TasksService
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var notes = ""
    @State private var dueDate: Date?
    @State private var showingDatePicker = false
    @State private var isCreating = false
    @FocusState private var titleFocused: Bool

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("What do you need to do?", text: $title, axis: .vertical)
                        .lineLimit(1...3)
                        .focused($titleFocused)
                }

                Section {
                    TextField("Notes (optional)", text: $notes, axis: .vertical)
                        .lineLimit(1...5)
                }

                Section {
                    Button {
                        showingDatePicker.toggle()
                    } label: {
                        HStack {
                            Label("Due Date", systemImage: "calendar")
                            Spacer()
                            if let date = dueDate {
                                Text(date, style: .date)
                                    .foregroundStyle(.secondary)
                            } else {
                                Text("None")
                                    .foregroundStyle(.tertiary)
                            }
                        }
                    }
                    .foregroundStyle(.primary)

                    if showingDatePicker {
                        DatePicker(
                            "Due Date",
                            selection: Binding(
                                get: { dueDate ?? Date() },
                                set: { dueDate = $0 }
                            ),
                            displayedComponents: [.date]
                        )
                        .datePickerStyle(.graphical)

                        if dueDate != nil {
                            Button("Clear Due Date", role: .destructive) {
                                dueDate = nil
                                showingDatePicker = false
                            }
                        }
                    }
                }
            }
            .navigationTitle("New Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") { createTask() }
                        .fontWeight(.semibold)
                        .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isCreating)
                }
            }
            .onAppear {
                titleFocused = true
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func createTask() {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedTitle.isEmpty else { return }

        isCreating = true
        Task {
            do {
                let trimmedNotes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
                try await tasksService.createTask(
                    title: trimmedTitle,
                    body: trimmedNotes.isEmpty ? nil : trimmedNotes,
                    dueAt: dueDate
                )
                await MainActor.run { dismiss() }
            } catch {
                await MainActor.run { isCreating = false }
            }
        }
    }
}

// MARK: - Edit Task Sheet

private struct EditTaskSheet: View {
    let task: MapTask
    @ObservedObject var tasksService: TasksService
    @Environment(\.dismiss) private var dismiss

    @State private var title: String
    @State private var notes: String
    @State private var dueDate: Date?
    @State private var showingDatePicker = false
    @State private var isSaving = false
    @State private var showingDeleteConfirmation = false

    init(task: MapTask, tasksService: TasksService) {
        self.task = task
        self.tasksService = tasksService
        _title = State(initialValue: task.title)
        _notes = State(initialValue: task.body ?? "")
        _dueDate = State(initialValue: task.dueAt)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Task title", text: $title, axis: .vertical)
                        .lineLimit(1...3)
                }

                Section {
                    TextField("Notes", text: $notes, axis: .vertical)
                        .lineLimit(1...8)
                }

                Section {
                    Button {
                        showingDatePicker.toggle()
                    } label: {
                        HStack {
                            Label("Due Date", systemImage: "calendar")
                            Spacer()
                            if let date = dueDate {
                                Text(date, style: .date)
                                    .foregroundStyle(.secondary)
                            } else {
                                Text("None")
                                    .foregroundStyle(.tertiary)
                            }
                        }
                    }
                    .foregroundStyle(.primary)

                    if showingDatePicker {
                        DatePicker(
                            "Due Date",
                            selection: Binding(
                                get: { dueDate ?? Date() },
                                set: { dueDate = $0 }
                            ),
                            displayedComponents: [.date]
                        )
                        .datePickerStyle(.graphical)

                        if dueDate != nil {
                            Button("Clear Due Date", role: .destructive) {
                                dueDate = nil
                                showingDatePicker = false
                            }
                        }
                    }
                }

                Section {
                    Button {
                        Task { try? await tasksService.toggleTask(task) }
                        dismiss()
                    } label: {
                        Label(
                            task.isCompleted ? "Mark as Incomplete" : "Mark as Complete",
                            systemImage: task.isCompleted ? "circle" : "checkmark.circle.fill"
                        )
                    }
                }

                Section {
                    Button(role: .destructive) {
                        showingDeleteConfirmation = true
                    } label: {
                        Label("Delete Task", systemImage: "trash")
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("Edit Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { saveTask() }
                        .fontWeight(.semibold)
                        .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSaving)
                }
            }
            .confirmationDialog("Delete Task?", isPresented: $showingDeleteConfirmation, titleVisibility: .visible) {
                Button("Delete", role: .destructive) {
                    Task {
                        try? await tasksService.deleteTask(task)
                        await MainActor.run { dismiss() }
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This action cannot be undone.")
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func saveTask() {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedTitle.isEmpty else { return }

        isSaving = true
        Task {
            do {
                let trimmedNotes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
                try await tasksService.updateTask(
                    task,
                    title: trimmedTitle,
                    body: trimmedNotes.isEmpty ? nil : trimmedNotes,
                    dueAt: dueDate
                )
                await MainActor.run { dismiss() }
            } catch {
                await MainActor.run { isSaving = false }
            }
        }
    }
}

#Preview {
    TodosView()
}
