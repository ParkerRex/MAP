import MapHealthCore
import SwiftUI

struct TodosView: View {
    @StateObject private var tasksService = TasksService.shared
    @State private var showingAddSheet = false
    @State private var selectedTask: MapTask?
    @State private var quickAddText = ""
    @State private var isQuickAddFocused = false
    @State private var quickAddDate: Date?
    @FocusState private var quickAddFieldFocused: Bool

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomTrailing) {
                scrollContent
                    .navigationTitle("Tasks")
                    .toolbar { toolbarContent }
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
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                isQuickAddFocused = true
                quickAddFieldFocused = true
            }
            HapticFeedback.light()
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
            if tasksService.isLoading && tasksService.tasks.isEmpty {
                TasksLoadingView()
            } else if let error = tasksService.error {
                TasksErrorView(error: error) {
                    Task { await tasksService.fetchTasks() }
                }
            } else if tasksService.tasks.isEmpty {
                TasksEmptyView()
            } else {
                taskSections
            }
        }
        .padding(.bottom, 80)
    }

    @ViewBuilder
    private var taskSections: some View {
        if !tasksService.overdueTasks.isEmpty {
            TaskSectionView(
                title: "Overdue",
                icon: "exclamationmark.circle.fill",
                color: .red,
                tasks: tasksService.overdueTasks,
                rowBuilder: todoRow
            )
        }

        if !tasksService.todaysTasks.isEmpty {
            TaskSectionView(
                title: "Today",
                icon: "sun.max.fill",
                color: .orange,
                tasks: tasksService.todaysTasks,
                rowBuilder: todoRow
            )
        }

        let upcoming = tasksService.upcomingTasks.filter { task in
            guard let dueAt = task.dueAt else { return false }
            return !Calendar.current.isDateInToday(dueAt) && dueAt >= Date()
        }
        if !upcoming.isEmpty {
            TaskSectionView(
                title: "Upcoming",
                icon: "calendar",
                color: .blue,
                tasks: upcoming,
                rowBuilder: todoRow
            )
        }

        let noDueDate = tasksService.pendingTasks.filter { $0.dueAt == nil }
        if !noDueDate.isEmpty {
            TaskSectionView(
                title: "Anytime",
                icon: "tray.fill",
                color: .secondary,
                tasks: noDueDate,
                rowBuilder: todoRow
            )
        }

        if !tasksService.completedTasks.isEmpty {
            CompletedTasksSection(
                tasks: tasksService.completedTasks,
                rowBuilder: todoRow
            )
        }
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

// MARK: - Task Section View

struct TaskSectionView<Row: View>: View {
    let title: String
    let icon: String
    let color: Color
    let tasks: [MapTask]
    let rowBuilder: (MapTask) -> Row

    var body: some View {
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
                rowBuilder(task)
            }
        }
    }
}

// MARK: - Completed Tasks Section

struct CompletedTasksSection<Row: View>: View {
    let tasks: [MapTask]
    let rowBuilder: (MapTask) -> Row

    var body: some View {
        DisclosureGroup {
            ForEach(tasks.prefix(10)) { task in
                rowBuilder(task)
            }
            if tasks.count > 10 {
                Text("+ \(tasks.count - 10) more")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
            }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
                Text("Completed")
                    .fontWeight(.semibold)
                Text("(\(tasks.count))")
                    .foregroundStyle(.secondary)
            }
            .font(.subheadline)
        }
        .tint(.secondary)
    }
}

// MARK: - State Views

struct TasksLoadingView: View {
    var body: some View {
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
}

struct TasksErrorView: View {
    let error: Error
    let onRetry: () -> Void

    var body: some View {
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
            Button("Try Again", action: onRetry)
                .mapHealthGlassButtonStyle(prominent: true)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .orange.opacity(0.06))
    }
}

struct TasksEmptyView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 56))
                .foregroundStyle(.green)
            Text("All caught up!")
                .font(.title3)
                .fontWeight(.semibold)
            Text("Tap the + button to add a task")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .green.opacity(0.06))
    }
}

#Preview {
    TodosView()
}
