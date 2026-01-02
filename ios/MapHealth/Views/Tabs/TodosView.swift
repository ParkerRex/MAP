import MapHealthCore
import SwiftUI

struct TodosView: View {
    @StateObject private var tasksService = TasksService.shared
    @State private var showingAddSheet = false
    @State private var selectedTask: MapTask?
    @State private var quickAddText = ""
    @State private var isQuickAddFocused = false
    @State private var quickAddDate: Date?
    @State private var filter: TaskListFilter = .all
    @State private var searchText = ""
    @FocusState private var quickAddFieldFocused: Bool

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomTrailing) {
                scrollContent
                    .navigationTitle("Tasks")
                    .toolbar { toolbarContent }
                    .searchable(text: $searchText, prompt: "Search tasks")
                    .refreshable { await tasksService.refresh() }
                    .task { await loadTasksIfNeeded() }
                    .sheet(isPresented: $showingAddSheet) {
                        AddTaskSheet(tasksService: tasksService)
                    }
                    .sheet(item: $selectedTask) { task in
                        EditTaskSheet(task: task, tasksService: tasksService)
                    }
                floatingAddButton
            }
        }
    }

    private func loadTasksIfNeeded() async {
        if tasksService.tasks.isEmpty {
            await tasksService.fetchTasks()
        }
    }

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .primaryAction) {
            Menu {
                Button {
                    showingAddSheet = true
                } label: {
                    Label("New Task with Details", systemImage: "square.and.pencil")
                }
            } label: {
                Image(systemName: "ellipsis.circle")
            }
        }
    }
}

// MARK: - Floating Add Button

extension TodosView {
    private var floatingAddButton: some View {
        Button {
            focusQuickAdd()
        } label: {
            Image(systemName: "plus")
                .font(.title2.weight(.semibold))
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(
                    Circle()
                        .fill(.accent)
                        .shadow(color: .accent.opacity(0.3), radius: 8, x: 0, y: 4)
                )
        }
        .padding(.trailing, 20)
        .padding(.bottom, 20)
        .opacity(isQuickAddFocused ? 0 : 1)
        .scaleEffect(isQuickAddFocused ? 0.5 : 1)
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isQuickAddFocused)
    }
}

// MARK: - Scroll Content

extension TodosView {
    @ViewBuilder
    private var scrollContent: some View {
        if #available(iOS 26, *) {
            ScrollView { todosBody }
                .contentMargins(.horizontal, 20, for: .scrollContent)
                .contentMargins(.vertical, 16, for: .scrollContent)
                .safeAreaInset(edge: .bottom) { quickAddInset }
        } else {
            ScrollView {
                todosBody
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
            }
            .safeAreaInset(edge: .bottom) { quickAddInset }
        }
    }

    @ViewBuilder
    private var quickAddInset: some View {
        if isQuickAddFocused {
            QuickAddBar(
                text: $quickAddText,
                date: $quickAddDate,
                onSubmit: createQuickTask,
                onCancel: dismissQuickAdd,
                focused: $quickAddFieldFocused
            )
        }
    }

    private func createQuickTask() {
        let trimmed = quickAddText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        HapticFeedback.success()

        Task {
            do {
                try await tasksService.createTask(title: trimmed, dueAt: quickAddDate)
                await MainActor.run {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        quickAddText = ""
                        quickAddDate = nil
                    }
                }
            } catch {
                HapticFeedback.error()
            }
        }
    }

    private func dismissQuickAdd() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            isQuickAddFocused = false
            quickAddFieldFocused = false
            quickAddText = ""
            quickAddDate = nil
        }
    }
}

// MARK: - Todos Body

extension TodosView {
    private var todosBody: some View {
        LazyVStack(spacing: 16) {
            filterBar

            if tasksService.isLoading && tasksService.tasks.isEmpty {
                TasksLoadingView()
            } else if let error = tasksService.error {
                TasksErrorView(error: error) {
                    Task { await tasksService.fetchTasks() }
                }
            } else if tasksService.tasks.isEmpty {
                TasksEmptyView(onAdd: focusQuickAdd)
            } else if !hasVisibleTasks {
                TasksNoResultsView(
                    title: searchQuery.isEmpty ? "No tasks to show" : "No matching tasks",
                    message: searchQuery.isEmpty ? filter.emptyStateMessage : "Try a different keyword or filter.",
                    onClear: clearSearchAndFilter
                )
            } else {
                if !isQuickAddFocused {
                    quickAddPromptCard
                }
                taskSections
            }
        }
        .padding(.bottom, 80)
    }

    @ViewBuilder
    private var taskSections: some View {
        let overdueTasks = filteredOverdueTasks
        if !overdueTasks.isEmpty {
            TaskSectionView(
                title: "Overdue",
                icon: "exclamationmark.circle.fill",
                color: .red,
                tasks: overdueTasks,
                rowBuilder: todoRow
            )
        }

        let todaysTasks = filteredTodaysTasks
        if !todaysTasks.isEmpty {
            TaskSectionView(
                title: "Today",
                icon: "sun.max.fill",
                color: .orange,
                tasks: todaysTasks,
                rowBuilder: todoRow
            )
        }

        let upcoming = filteredUpcomingTasks
        if !upcoming.isEmpty {
            TaskSectionView(
                title: "Upcoming",
                icon: "calendar",
                color: .blue,
                tasks: upcoming,
                rowBuilder: todoRow
            )
        }

        let noDueDate = filteredAnytimeTasks
        if !noDueDate.isEmpty {
            TaskSectionView(
                title: "Anytime",
                icon: "tray.fill",
                color: .secondary,
                tasks: noDueDate,
                rowBuilder: todoRow
            )
        }

        let completedTasks = filteredCompletedTasks
        if !completedTasks.isEmpty {
            CompletedTasksSection(
                tasks: completedTasks,
                rowBuilder: todoRow
            )
        }
    }

    private var filteredUpcomingTasks: [MapTask] {
        guard filter != .completed else { return [] }
        return tasksService.upcomingTasks
            .filter { task in
                guard let dueAt = task.dueAt else { return false }
                return !Calendar.current.isDateInToday(dueAt) && dueAt >= Date()
            }
            .filter(matchesSearch)
    }

    private var filteredAnytimeTasks: [MapTask] {
        guard filter != .completed else { return [] }
        return tasksService.pendingTasks
            .filter { $0.dueAt == nil }
            .filter(matchesSearch)
    }

    private var filteredOverdueTasks: [MapTask] {
        guard filter != .completed else { return [] }
        return tasksService.overdueTasks.filter(matchesSearch)
    }

    private var filteredTodaysTasks: [MapTask] {
        guard filter != .completed else { return [] }
        return tasksService.todaysTasks.filter(matchesSearch)
    }

    private var filteredCompletedTasks: [MapTask] {
        guard filter != .active else { return [] }
        return tasksService.completedTasks.filter(matchesSearch)
    }

    private var hasVisibleTasks: Bool {
        !filteredOverdueTasks.isEmpty ||
        !filteredTodaysTasks.isEmpty ||
        !filteredUpcomingTasks.isEmpty ||
        !filteredAnytimeTasks.isEmpty ||
        !filteredCompletedTasks.isEmpty
    }

    private var filterBar: some View {
        Picker("Filter", selection: $filter) {
            ForEach(TaskListFilter.allCases, id: \.self) { option in
                Text(option.title).tag(option)
            }
        }
        .pickerStyle(.segmented)
    }

    private var quickAddPromptCard: some View {
        Button(action: focusQuickAdd) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Color.accentColor.opacity(0.15))
                        .frame(width: 36, height: 36)
                    Image(systemName: "plus")
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(.accent)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("Quick add")
                        .font(.subheadline.weight(.semibold))
                    Text("Capture a task fast with optional due date")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Image(systemName: "chevron.up")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
        }
        .buttonStyle(.plain)
        .mapHealthGlassSurface(cornerRadius: 14, tint: .accentColor.opacity(0.05))
    }

    private var searchQuery: String {
        searchText.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func matchesSearch(_ task: MapTask) -> Bool {
        let query = searchQuery
        guard !query.isEmpty else { return true }

        if task.title.localizedCaseInsensitiveContains(query) { return true }
        if let body = task.body, body.localizedCaseInsensitiveContains(query) { return true }
        return task.tags.contains { $0.title.localizedCaseInsensitiveContains(query) }
    }

    private func focusQuickAdd() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            isQuickAddFocused = true
            quickAddFieldFocused = true
        }
        HapticFeedback.light()
    }

    private func clearSearchAndFilter() {
        searchText = ""
        filter = .all
    }

    private func todoRow(_ task: MapTask) -> some View {
        TaskRowView(
            task: task,
            onToggle: {
                HapticFeedback.success()
                Task { try? await tasksService.toggleTask(task) }
            },
            onEdit: { selectedTask = task },
            onDelete: {
                HapticFeedback.warning()
                Task { try? await tasksService.deleteTask(task) }
            },
            onSchedule: { date in
                HapticFeedback.light()
                Task { try? await tasksService.scheduleTask(task, dueAt: date) }
            }
        )
    }
}

private enum TaskListFilter: String, CaseIterable {
    case all
    case active
    case completed

    var title: String {
        switch self {
        case .all: return "All"
        case .active: return "Active"
        case .completed: return "Completed"
        }
    }

    var emptyStateMessage: String {
        switch self {
        case .all:
            return "Try showing active tasks or completed tasks."
        case .active:
            return "You are all caught up on active tasks."
        case .completed:
            return "No completed tasks yet."
        }
    }
}
