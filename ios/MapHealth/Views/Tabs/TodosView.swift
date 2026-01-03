import MapHealthCore
import SwiftUI

struct TodosView: View {
    @StateObject private var tasksService = TasksService.shared
    @State private var newTaskText = ""
    @State private var selectedTask: MapTask?
    @State private var searchText = ""
    @FocusState private var isAddingTask: Bool

    var body: some View {
        NavigationStack {
            List {
                addTaskSection
                taskSections
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .searchable(text: $searchText, prompt: "Search tasks")
            .refreshable { await tasksService.refresh() }
            .task { await loadTasksIfNeeded() }
            .sheet(item: $selectedTask) { task in
                TaskDetailSheet(task: task, tasksService: tasksService)
            }
        }
    }

    private func loadTasksIfNeeded() async {
        if tasksService.tasks.isEmpty {
            await tasksService.fetchTasks()
        }
    }
}

// MARK: - Add Task Section

extension TodosView {
    private var addTaskSection: some View {
        Section {
            HStack(spacing: 12) {
                Circle()
                    .strokeBorder(Color.secondary.opacity(0.3), lineWidth: 2)
                    .frame(width: 22, height: 22)

                TextField("Add a task...", text: $newTaskText)
                    .focused($isAddingTask)
                    .submitLabel(.done)
                    .onSubmit(createTask)

                if !newTaskText.isEmpty {
                    Button {
                        createTask()
                    } label: {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.title2)
                            .foregroundStyle(.accent)
                    }
                    .transition(.scale.combined(with: .opacity))
                }
            }
            .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
            .animation(.easeOut(duration: 0.15), value: newTaskText.isEmpty)
        }
    }

    private func createTask() {
        let text = newTaskText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        HapticFeedback.success()
        let taskText = text
        newTaskText = ""

        Task {
            try? await tasksService.createTask(title: taskText, dueAt: nil)
        }
    }
}

// MARK: - Task Sections

extension TodosView {
    @ViewBuilder
    private var taskSections: some View {
        if tasksService.isLoading && tasksService.tasks.isEmpty {
            Section {
                TasksLoadingView()
            }
        } else if let error = tasksService.error {
            Section {
                TasksErrorView(error: error) {
                    Task { await tasksService.fetchTasks() }
                }
            }
        } else if tasksService.tasks.isEmpty {
            Section {
                emptyState
            }
        } else if filteredTasks.isEmpty && !searchText.isEmpty {
            Section {
                noResultsState
            }
        } else {
            activeSections
        }
    }

    private var filteredTasks: [MapTask] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return tasksService.tasks }
        return tasksService.tasks.filter { task in
            task.title.localizedCaseInsensitiveContains(query) ||
            (task.body?.localizedCaseInsensitiveContains(query) ?? false) ||
            task.tags.contains { $0.title.localizedCaseInsensitiveContains(query) }
        }
    }

    @ViewBuilder
    private var activeSections: some View {
        let pending = filteredTasks.filter { !$0.isCompleted }
        let completed = filteredTasks.filter { $0.isCompleted }

        // Overdue
        let overdue = pending.filter { task in
            guard let due = task.dueAt else { return false }
            return due < Calendar.current.startOfDay(for: Date())
        }.sorted { ($0.dueAt ?? .distantFuture) < ($1.dueAt ?? .distantFuture) }

        if !overdue.isEmpty {
            taskSection(title: "Overdue", tasks: overdue, tint: .red)
        }

        // Today
        let today = pending.filter { task in
            guard let due = task.dueAt else { return false }
            return Calendar.current.isDateInToday(due)
        }

        if !today.isEmpty {
            taskSection(title: "Today", tasks: today, tint: .orange)
        }

        // Upcoming
        let upcoming = pending.filter { task in
            guard let due = task.dueAt else { return false }
            let startOfToday = Calendar.current.startOfDay(for: Date())
            return due >= startOfToday && !Calendar.current.isDateInToday(due)
        }.sorted { ($0.dueAt ?? .distantFuture) < ($1.dueAt ?? .distantFuture) }

        if !upcoming.isEmpty {
            taskSection(title: "Upcoming", tasks: upcoming, tint: .blue)
        }

        // No due date
        let noDueDate = pending.filter { $0.dueAt == nil }
            .sorted { $0.createdAt > $1.createdAt }

        if !noDueDate.isEmpty {
            taskSection(title: "No Date", tasks: noDueDate, tint: .secondary)
        }

        // Completed
        if !completed.isEmpty {
            completedSection(tasks: completed)
        }
    }

    private func taskSection(title: String, tasks: [MapTask], tint: Color) -> some View {
        Section {
            ForEach(tasks) { task in
                TaskRow(
                    task: task,
                    onToggle: { toggleTask(task) },
                    onTap: { selectedTask = task },
                    onDelete: { deleteTask(task) }
                )
            }
        } header: {
            Text(title)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(tint)
                .textCase(.uppercase)
        }
    }

    private func completedSection(tasks: [MapTask]) -> some View {
        let sortedTasks = tasks.prefix(15).sorted {
            ($0.completedAt ?? .distantPast) > ($1.completedAt ?? .distantPast)
        }

        return Section {
            ForEach(sortedTasks) { task in
                TaskRow(
                    task: task,
                    onToggle: { toggleTask(task) },
                    onTap: { selectedTask = task },
                    onDelete: { deleteTask(task) }
                )
            }
            if tasks.count > 15 {
                Text("\(tasks.count - 15) more completed")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
            }
        } header: {
            HStack(spacing: 6) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
                Text("Completed")
                Text("·")
                Text("\(tasks.count)")
            }
            .font(.footnote.weight(.medium))
            .foregroundStyle(.secondary)
            .textCase(.uppercase)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 48, weight: .light))
                .foregroundStyle(.green.opacity(0.8))

            Text("No tasks yet")
                .font(.headline)

            Text("Type above to add your first task")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
        .listRowBackground(Color.clear)
    }

    private var noResultsState: some View {
        VStack(spacing: 12) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 40, weight: .light))
                .foregroundStyle(.secondary)

            Text("No matching tasks")
                .font(.headline)

            Text("Try a different search term")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
        .listRowBackground(Color.clear)
    }
}

// MARK: - Actions

extension TodosView {
    private func toggleTask(_ task: MapTask) {
        HapticFeedback.success()
        Task { try? await tasksService.toggleTask(task) }
    }

    private func deleteTask(_ task: MapTask) {
        HapticFeedback.warning()
        Task { try? await tasksService.deleteTask(task) }
    }
}
