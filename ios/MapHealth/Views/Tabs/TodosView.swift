import MapHealthCore
import SwiftUI

struct TodosView: View {
    @StateObject private var tasksService = TasksService.shared
    @State private var newTaskText = ""
    @State private var selectedTask: MapTask?
    @State private var searchText = ""
    @FocusState private var isAddingTask: Bool
    @State private var selectedFilter: TaskFilter = .all
    @State private var selectedProject: ProjectFilter = .all
    @State private var showingProjects = false

    enum TaskFilter: String, CaseIterable {
        case all = "All"
        case today = "Today"
        case upcoming = "Upcoming"
        case overdue = "Overdue"
        case completed = "Completed"

        var tint: Color {
            switch self {
            case .all: .accentColor
            case .today: .orange
            case .upcoming: .blue
            case .overdue: .red
            case .completed: .green
            }
        }
    }

    enum ProjectFilter: Hashable {
        case all
        case none
        case tag(String)
    }

    var body: some View {
        NavigationStack {
            List {
                filterSection
                projectSection
                taskSections
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .scrollDismissesKeyboard(.interactively)
            .listSectionSpacing(12)
            .searchable(text: $searchText, prompt: "Search tasks")
            .refreshable { await tasksService.refresh() }
            .task { await loadTasksIfNeeded() }
            .sheet(item: $selectedTask) { task in
                TaskDetailSheet(task: task, tasksService: tasksService)
            }
            .sheet(isPresented: $showingProjects) {
                ProjectsSheet(tasksService: tasksService)
            }
            .safeAreaInset(edge: .bottom) {
                addTaskBar
            }
            .navigationTitle("Tasks")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        showingProjects = true
                    } label: {
                        Label("Projects", systemImage: "folder")
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isAddingTask = true
                    } label: {
                        Image(systemName: "plus")
                            .font(.body.weight(.semibold))
                    }
                }
            }
        }
    }

    private func loadTasksIfNeeded() async {
        if tasksService.tasks.isEmpty || tasksService.tags.isEmpty {
            await tasksService.refresh()
        }
    }
}

// MARK: - Filters

extension TodosView {
    @ViewBuilder
    private var filterSection: some View {
        Section {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(TaskFilter.allCases, id: \.self) { filter in
                        FilterChip(
                            title: filter.rawValue,
                            count: filterCount(for: filter),
                            tint: filter.tint,
                            isSelected: selectedFilter == filter
                        ) {
                            selectedFilter = filter
                        }
                    }
                }
                .padding(.vertical, 6)
            }
            .scrollClipDisabled()
            .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 8, trailing: 16))
            .listRowSeparator(.hidden)
            .listRowBackground(Color.clear)
        }
    }

    private func filterCount(for filter: TaskFilter) -> Int {
        let tasks = projectFilteredTasks
        switch filter {
        case .all:
            return tasks.count
        case .today:
            return tasks.filter { !$0.isCompleted && isToday($0.dueAt) }.count
        case .upcoming:
            return tasks.filter { !$0.isCompleted && isUpcoming($0.dueAt) }.count
        case .overdue:
            return tasks.filter { !$0.isCompleted && isOverdue($0.dueAt) }.count
        case .completed:
            return tasks.filter { $0.isCompleted }.count
        }
    }
}

// MARK: - Projects

extension TodosView {
    @ViewBuilder
    private var projectSection: some View {
        let tags = tasksService.tags.sorted { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }

        if !tags.isEmpty || !tasksService.tasks.isEmpty {
            Section {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ProjectChip(
                            title: "All",
                            count: taskCount(for: .all),
                            isSelected: selectedProject == .all
                        ) {
                            selectedProject = .all
                        }

                        ProjectChip(
                            title: "No Project",
                            count: taskCount(for: .none),
                            isSelected: selectedProject == .none
                        ) {
                            selectedProject = .none
                        }

                        ForEach(tags) { tag in
                            ProjectChip(
                                title: tag.title,
                                count: taskCount(for: .tag(tag.id)),
                                isSelected: selectedProject == .tag(tag.id)
                            ) {
                                selectedProject = .tag(tag.id)
                            }
                        }
                    }
                    .padding(.vertical, 6)
                }
                .scrollClipDisabled()
                .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 8, trailing: 16))
                .listRowSeparator(.hidden)
                .listRowBackground(Color.clear)
            } header: {
                Text("Projects")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
            }
        }
    }

    private func taskCount(for filter: ProjectFilter) -> Int {
        switch filter {
        case .all:
            return tasksService.tasks.count
        case .none:
            return tasksService.tasks.filter { $0.tags.isEmpty }.count
        case .tag(let tagId):
            return tasksService.tasks.filter { task in
                task.tags.contains { $0.id == tagId }
            }.count
        }
    }
}
// MARK: - Add Task Section

extension TodosView {
    private var addTaskBar: some View {
        VStack(spacing: 0) {
            Divider()
            HStack(spacing: 12) {
                Image(systemName: "plus.circle.fill")
                    .font(.title3)
                    .foregroundStyle(newTaskText.isEmpty ? .secondary : .accent)

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
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.thinMaterial)
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
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
            }
        } else if let error = tasksService.error {
            Section {
                TasksErrorView(error: error) {
                    Task { await tasksService.fetchTasks() }
                }
                .listRowSeparator(.hidden)
                .listRowBackground(Color.clear)
            }
        } else if tasksService.tasks.isEmpty {
            Section {
                emptyState
            }
        } else if tasksForFilter.isEmpty {
            Section {
                filteredEmptyState
            }
        } else {
            activeSections
        }
    }

    private var projectFilteredTasks: [MapTask] {
        tasksService.tasks.filter { task in
            switch selectedProject {
            case .all:
                return true
            case .none:
                return task.tags.isEmpty
            case .tag(let tagId):
                return task.tags.contains { $0.id == tagId }
            }
        }
    }

    private var searchedTasks: [MapTask] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return projectFilteredTasks }
        return projectFilteredTasks.filter { task in
            task.title.localizedCaseInsensitiveContains(query) ||
            (task.body?.localizedCaseInsensitiveContains(query) ?? false) ||
            task.tags.contains { $0.title.localizedCaseInsensitiveContains(query) }
        }
    }

    private var tasksForFilter: [MapTask] {
        let tasks = searchedTasks
        switch selectedFilter {
        case .all:
            return tasks
        case .today:
            return tasks.filter { !$0.isCompleted && isToday($0.dueAt) }
        case .upcoming:
            return tasks.filter { !$0.isCompleted && isUpcoming($0.dueAt) }
        case .overdue:
            return tasks.filter { !$0.isCompleted && isOverdue($0.dueAt) }
        case .completed:
            return tasks.filter { $0.isCompleted }
        }
    }

    @ViewBuilder
    private var activeSections: some View {
        if selectedFilter == .completed {
            completedSection(tasks: tasksForFilter)
            return
        }

        if selectedFilter != .all {
            taskSection(title: selectedFilter.rawValue, tasks: tasksForFilter, tint: selectedFilter.tint)
            return
        }

        let pending = tasksForFilter.filter { !$0.isCompleted }
        let completed = tasksForFilter.filter { $0.isCompleted }

        // Overdue
        let overdue = pending.filter { isOverdue($0.dueAt) }
            .sorted { ($0.dueAt ?? .distantFuture) < ($1.dueAt ?? .distantFuture) }

        if !overdue.isEmpty {
            taskSection(title: "Overdue", tasks: overdue, tint: .red)
        }

        // Today
        let today = pending.filter { isToday($0.dueAt) }

        if !today.isEmpty {
            taskSection(title: "Today", tasks: today, tint: .orange)
        }

        // Upcoming
        let upcoming = pending.filter { isUpcoming($0.dueAt) }
            .sorted { ($0.dueAt ?? .distantFuture) < ($1.dueAt ?? .distantFuture) }

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
                    projectTitle: selectedProject == .all ? task.tags.first?.title : nil,
                    onToggle: { toggleTask(task) },
                    onTap: { selectedTask = task },
                    onDelete: { deleteTask(task) }
                ) {
                    projectMenu(for: task)
                }
                .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
                .listRowSeparator(.hidden)
                .listRowBackground(Color(.secondarySystemGroupedBackground))
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
                    projectTitle: selectedProject == .all ? task.tags.first?.title : nil,
                    onToggle: { toggleTask(task) },
                    onTap: { selectedTask = task },
                    onDelete: { deleteTask(task) }
                ) {
                    projectMenu(for: task)
                }
                .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
                .listRowSeparator(.hidden)
                .listRowBackground(Color(.secondarySystemGroupedBackground))
            }
            if tasks.count > 15 {
                Text("\(tasks.count - 15) more completed")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
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

    private var filteredEmptyState: some View {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        if !query.isEmpty {
            return AnyView(noResultsState)
        }

        var title = "No tasks found"
        var message = "Try adjusting your filters."
        var icon = "tray"

        switch selectedFilter {
        case .today:
            title = "No tasks today"
            message = "You are clear for today."
            icon = "sun.max"
        case .upcoming:
            title = "Nothing upcoming"
            message = "Schedule tasks to see them here."
            icon = "calendar"
        case .overdue:
            title = "No overdue tasks"
            message = "Nice work staying on top of things."
            icon = "checkmark.circle"
        case .completed:
            title = "No completed tasks"
            message = "Complete a task to see it here."
            icon = "checkmark.circle"
        case .all:
            break
        }

        switch selectedProject {
        case .none:
            title = "No unassigned tasks"
            message = "Every task already has a project."
            icon = "folder"
        case .tag(let tagId):
            if let tag = tasksService.tags.first(where: { $0.id == tagId }) {
                title = "No tasks in \(tag.title)"
                message = "Add a task or assign one to this project."
                icon = "folder"
            }
        case .all:
            break
        }

        return AnyView(
            VStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 40, weight: .light))
                    .foregroundStyle(.secondary)

                Text(title)
                    .font(.headline)

                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 60)
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
        )
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
        .listRowSeparator(.hidden)
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
        .listRowSeparator(.hidden)
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

    @ViewBuilder
    private func projectMenu(for task: MapTask) -> some View {
        let tags = tasksService.tags.sorted { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }

        Menu {
            Button {
                updateTaskProject(task, tagId: nil)
            } label: {
                if task.tags.isEmpty {
                    Label("No Project", systemImage: "checkmark")
                } else {
                    Text("No Project")
                }
            }

            if !tags.isEmpty {
                ForEach(tags) { tag in
                    Button {
                        updateTaskProject(task, tagId: tag.id)
                    } label: {
                        if task.tags.contains(where: { $0.id == tag.id }) {
                            Label(tag.title, systemImage: "checkmark")
                        } else {
                            Text(tag.title)
                        }
                    }
                }
            }

            Divider()

            Button("Manage Projects") {
                showingProjects = true
            }
        } label: {
            Label("Project", systemImage: "folder")
        }
    }

    private func updateTaskProject(_ task: MapTask, tagId: String?) {
        Task {
            try? await tasksService.updateTask(
                task,
                tags: tagId.map { [$0] } ?? []
            )
        }
    }

    private func isToday(_ date: Date?) -> Bool {
        guard let date else { return false }
        return Calendar.current.isDateInToday(date)
    }

    private func isOverdue(_ date: Date?) -> Bool {
        guard let date else { return false }
        return date < Calendar.current.startOfDay(for: Date())
    }

    private func isUpcoming(_ date: Date?) -> Bool {
        guard let date else { return false }
        let startOfToday = Calendar.current.startOfDay(for: Date())
        return date >= startOfToday && !Calendar.current.isDateInToday(date)
    }
}

// MARK: - Filter Chip

private struct FilterChip: View {
    let title: String
    let count: Int
    let tint: Color
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Text(title)
                Text("\(count)")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(isSelected ? .white.opacity(0.9) : .secondary)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(isSelected ? Color.white.opacity(0.2) : Color(.tertiarySystemGroupedBackground))
                    .clipShape(Capsule())
            }
            .font(.subheadline.weight(.semibold))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? tint : Color(.secondarySystemGroupedBackground))
            .foregroundStyle(isSelected ? .white : .primary)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Project Chip

private struct ProjectChip: View {
    let title: String
    let count: Int
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Text(title)
                Text("\(count)")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(isSelected ? .white.opacity(0.9) : .secondary)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(isSelected ? Color.white.opacity(0.2) : Color(.tertiarySystemGroupedBackground))
                    .clipShape(Capsule())
            }
            .font(.subheadline.weight(.semibold))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? Color.accentColor : Color(.secondarySystemGroupedBackground))
            .foregroundStyle(isSelected ? .white : .primary)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}
