// swiftlint:disable file_length
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
    @State private var viewMode: ViewMode = .tasks
    @State private var showingCreateProject = false
    @State private var newProjectTitle = ""
    @State private var selectedTaskIds: Set<MapTask.ID> = []
    @State private var projectSearchText = ""
    @State private var selectedNewTaskProjectId: String?
    @State private var isBulkProcessing = false
    @State private var showingBulkDeleteConfirmation = false
    @State private var focusMode = false
    @State private var previousFilter: TaskFilter = .all
    @State private var inlineEditTaskId: MapTask.ID?
    @State private var inlineEditTitle = ""
    @State private var inlineEditNotes = ""
    @Environment(\.editMode) private var editMode

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

    enum ViewMode: String, CaseIterable {
        case tasks = "Tasks"
        case projects = "Projects"
    }

    struct QuickAddResult {
        let title: String
        let dueAt: Date?
        let tagId: String?
        let projectName: String?
    }


    var body: some View {
        NavigationStack {
            contentList
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .scrollDismissesKeyboard(.interactively)
                .listSectionSpacing(12)
                .task { await loadTasksIfNeeded() }
                .sheet(item: $selectedTask) { task in
                    TaskDetailSheet(task: task, tasksService: tasksService)
                }
                .safeAreaInset(edge: .bottom) {
                    if viewMode == .tasks {
                        if isEditing && !selectedTaskIds.isEmpty {
                            bulkActionBar
                        } else {
                            addTaskBar
                        }
                    }
                }
                .navigationTitle(viewMode == .tasks ? "Tasks" : "Projects")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .principal) {
                        Picker("", selection: $viewMode) {
                            ForEach(ViewMode.allCases, id: \.self) { mode in
                                Text(mode.rawValue).tag(mode)
                            }
                        }
                        .pickerStyle(.segmented)
                        .frame(maxWidth: 240)
                    }
                    if viewMode == .tasks || viewMode == .projects {
                        ToolbarItem(placement: .topBarLeading) {
                            EditButton()
                        }
                    }
                    if viewMode == .tasks {
                        ToolbarItem(placement: .topBarLeading) {
                            Button {
                                HapticFeedback.selection()
                                toggleFocusMode()
                            } label: {
                                Image(systemName: "scope")
                                    .symbolVariant(focusMode ? .fill : .none)
                            }
                            .accessibilityLabel("Focus mode")
                        }
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            switch viewMode {
                            case .tasks:
                                isAddingTask = true
                            case .projects:
                                showingCreateProject = true
                            }
                        } label: {
                            Image(systemName: "plus")
                                .font(.body.weight(.semibold))
                        }
                    }
                }
                .alert("New Project", isPresented: $showingCreateProject) {
                    TextField("Name", text: $newProjectTitle)
                    Button("Create") { createProject() }
                    Button("Cancel", role: .cancel) {}
                }
                .confirmationDialog(
                    "Delete selected tasks?",
                    isPresented: $showingBulkDeleteConfirmation,
                    titleVisibility: .visible
                ) {
                    Button("Delete", role: .destructive) { bulkDeleteConfirmed() }
                    Button("Cancel", role: .cancel) {}
                } message: {
                    Text("This action cannot be undone.")
                }
                .onChange(of: editMode?.wrappedValue) { _, newValue in
                    if newValue != .active {
                        selectedTaskIds.removeAll()
                        inlineEditTaskId = nil
                    }
                }
                .onChange(of: viewMode) { _, newValue in
                    if newValue == .projects {
                        selectedTaskIds.removeAll()
                        editMode?.wrappedValue = .inactive
                        searchText = ""
                        projectSearchText = ""
                        focusMode = false
                        inlineEditTaskId = nil
                    }
                }
        }
    }

    private func loadTasksIfNeeded() async {
        if tasksService.tasks.isEmpty || tasksService.tags.isEmpty {
            await tasksService.refresh()
        }
    }

    private var isEditing: Bool {
        editMode?.wrappedValue == .active
    }

    @ViewBuilder
    private var contentList: some View {
        if viewMode == .tasks {
            List(selection: $selectedTaskIds) {
                if focusMode {
                    focusSummarySection
                }
                filterSection
                projectSection
                taskSections
            }
            .searchable(text: $searchText, prompt: "Search tasks")
            .refreshable { await tasksService.refresh() }
            .animation(.snappy(duration: 0.2), value: selectedFilter)
            .animation(.snappy(duration: 0.2), value: selectedProject)
        } else {
            List {
                ProjectsListView(
                    tasksService: tasksService,
                    showingCreateProject: $showingCreateProject,
                    searchText: $projectSearchText
                )
            }
            .searchable(text: $projectSearchText, prompt: "Search projects")
            .refreshable { await tasksService.refresh() }
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
                            HapticFeedback.selection()
                            withAnimation(.snappy(duration: 0.2)) {
                                if focusMode && filter != .today {
                                    focusMode = false
                                }
                                selectedFilter = filter
                            }
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

// MARK: - Focus Summary

extension TodosView {
    private var focusSummarySection: some View {
        Section {
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Today Focus")
                        .font(.headline)
                    Text("\(focusPendingCount) remaining")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                ProgressView(value: focusProgress)
                    .progressViewStyle(.circular)
            }
            .padding(.vertical, 8)
        }
        .listRowSeparator(.hidden)
        .listRowBackground(Color(.secondarySystemGroupedBackground))
    }

    private var focusTodayTasks: [MapTask] {
        searchedTasks.filter { isToday($0.dueAt) }
    }

    private var focusCompletedCount: Int {
        focusTodayTasks.filter { $0.isCompleted }.count
    }

    private var focusPendingCount: Int {
        focusTodayTasks.filter { !$0.isCompleted }.count
    }

    private var focusProgress: Double {
        let total = focusTodayTasks.count
        guard total > 0 else { return 0 }
        return Double(focusCompletedCount) / Double(total)
    }
}

// MARK: - Projects

extension TodosView {
    @ViewBuilder
    private var projectSection: some View {
        let tags = tasksService.tags.sorted { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }

        Section {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ProjectChip(
                        title: "All",
                        count: taskCount(for: .all),
                        tint: .secondary,
                        isSelected: selectedProject == .all
                    ) {
                        HapticFeedback.selection()
                        withAnimation(.snappy(duration: 0.2)) {
                            selectedProject = .all
                        }
                    }

                    ProjectChip(
                        title: "No Project",
                        count: taskCount(for: .none),
                        tint: .secondary,
                        isSelected: selectedProject == .none
                    ) {
                        HapticFeedback.selection()
                        withAnimation(.snappy(duration: 0.2)) {
                            selectedProject = .none
                        }
                    }

                    ForEach(tags) { tag in
                        ProjectChip(
                            title: tag.title,
                            count: taskCount(for: .tag(tag.id)),
                            tint: ProjectStyling.tint(for: tag.id),
                            isSelected: selectedProject == .tag(tag.id)
                        ) {
                            HapticFeedback.selection()
                            withAnimation(.snappy(duration: 0.2)) {
                                selectedProject = .tag(tag.id)
                            }
                        }
                    }

                    AddProjectChip {
                        HapticFeedback.light()
                        showingCreateProject = true
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
        let quickAddPreview = parseQuickAdd(newTaskText)
        VStack(spacing: 0) {
            Divider()
            VStack(spacing: 6) {
                HStack(spacing: 12) {
                    Menu {
                        Button("No Project") {
                            HapticFeedback.selection()
                            selectedNewTaskProjectId = nil
                        }
                        let tags = tasksService.tags.sorted {
                            $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending
                        }
                        ForEach(tags) { tag in
                            Button(tag.title) {
                                HapticFeedback.selection()
                                selectedNewTaskProjectId = tag.id
                            }
                        }
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                            .foregroundStyle(newTaskText.isEmpty ? Color.secondary : Color.accentColor)
                    }

                    TextField("Add a task...", text: $newTaskText)
                        .focused($isAddingTask)
                        .submitLabel(.done)
                        .onSubmit(createTask)

                    if !newTaskText.isEmpty {
                        Button {
                            HapticFeedback.light()
                            createTask()
                        } label: {
                            Image(systemName: "arrow.up.circle.fill")
                                .font(.title2)
                                .foregroundStyle(.accent)
                        }
                        .transition(.scale.combined(with: .opacity))
                    }
                }

                if let summary = quickAddSummary(from: quickAddPreview) {
                    HStack(spacing: 8) {
                        ForEach(summary, id: \.self) { token in
                            Text(token)
                                .font(.caption.weight(.semibold))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color(.secondarySystemGroupedBackground))
                                .clipShape(Capsule())
                        }
                        Spacer(minLength: 0)
                    }
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.thinMaterial)
            .animation(.easeOut(duration: 0.15), value: newTaskText.isEmpty)
            .animation(.snappy(duration: 0.2), value: quickAddPreview.title)
        }
    }

    private var bulkActionBar: some View {
        VStack(spacing: 0) {
            Divider()
            HStack(spacing: 16) {
                Group {
                    if isBulkProcessing {
                        ProgressView()
                    } else {
                        Text("\(selectedTaskIds.count) selected")
                    }
                }
                .font(.subheadline.weight(.semibold))

                Spacer()

                Button {
                    HapticFeedback.light()
                    bulkComplete()
                } label: {
                    Label("Complete", systemImage: "checkmark.circle")
                }
                .labelStyle(.iconOnly)
                .disabled(isBulkProcessing)

                Menu {
                    Section("Move to Project") {
                        Button("No Project") {
                            HapticFeedback.selection()
                            bulkAssignProject(nil)
                        }
                        let tags = tasksService.tags.sorted {
                            $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending
                        }
                        ForEach(tags) { tag in
                            Button(tag.title) {
                                HapticFeedback.selection()
                                bulkAssignProject(tag.id)
                            }
                        }
                    }

                    Section("Set Due Date") {
                        Button("Today") { HapticFeedback.selection(); bulkSetDueDate(.today) }
                        Button("Tomorrow") { HapticFeedback.selection(); bulkSetDueDate(.tomorrow) }
                        Button("Next Week") { HapticFeedback.selection(); bulkSetDueDate(.nextWeek) }
                        Button("Clear") { HapticFeedback.selection(); bulkSetDueDate(.clear) }
                    }
                } label: {
                    Image(systemName: "folder")
                }
                .disabled(isBulkProcessing)

                Button(role: .destructive) {
                    HapticFeedback.warning()
                    showingBulkDeleteConfirmation = true
                } label: {
                    Image(systemName: "trash")
                }
                .disabled(isBulkProcessing)
            }
            .font(.body.weight(.semibold))
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.thinMaterial)
        }
    }

    private func createTask() {
        let text = newTaskText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        HapticFeedback.success()
        let parsed = parseQuickAdd(text)
        let taskText = parsed.title
        newTaskText = ""

        Task {
            let dueAt = parsed.dueAt
            if let task = try? await tasksService.createTask(title: taskText, dueAt: dueAt) {
                if let tagId = selectedNewTaskProjectId ?? parsed.tagId {
                    _ = try? await tasksService.updateTask(task, tags: [tagId])
                } else if let projectName = parsed.projectName {
                    if let created = try? await tasksService.createTag(title: projectName) {
                        _ = try? await tasksService.updateTask(task, tags: [created.id])
                        await MainActor.run { selectedNewTaskProjectId = created.id }
                    }
                }
            }
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
        if focusMode {
            focusSections
        } else if selectedFilter == .completed {
            completedSection(tasks: tasksForFilter)
        } else if selectedFilter != .all {
            taskSection(title: selectedFilter.rawValue, tasks: tasksForFilter, tint: selectedFilter.tint)
        } else {
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
    }

    @ViewBuilder
    private var focusSections: some View {
        let pending = searchedTasks.filter { !$0.isCompleted }
        let overdue = pending.filter { isOverdue($0.dueAt) }
            .sorted { ($0.dueAt ?? .distantFuture) < ($1.dueAt ?? .distantFuture) }
        let today = pending.filter { isToday($0.dueAt) }
        let upcoming = pending.filter { isUpcoming($0.dueAt) }
            .sorted { ($0.dueAt ?? .distantFuture) < ($1.dueAt ?? .distantFuture) }

        if !overdue.isEmpty {
            taskSection(title: "Overdue", tasks: overdue, tint: .red)
        }

        if !today.isEmpty {
            taskSection(title: "Today", tasks: today, tint: .orange)
        }

        if overdue.isEmpty && today.isEmpty && !upcoming.isEmpty {
            taskSection(title: "Upcoming", tasks: upcoming, tint: .blue)
        }

        if overdue.isEmpty && today.isEmpty && upcoming.isEmpty {
            Section {
                filteredEmptyState
            }
        }
    }

    private func taskSection(title: String, tasks: [MapTask], tint: Color) -> some View {
        Section {
            ForEach(tasks) { task in
                taskRow(for: task)
            }
        } header: {
            HStack(spacing: 8) {
                Circle()
                    .fill(tint)
                    .frame(width: 6, height: 6)
                Text(title)
            }
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
                taskRow(for: task)
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
                Circle()
                    .fill(Color.green)
                    .frame(width: 6, height: 6)
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

// MARK: - Task Rows

extension TodosView {
    @ViewBuilder
    private func taskRow(for task: MapTask) -> some View {
        if inlineEditTaskId == task.id {
            InlineEditRow(
                title: $inlineEditTitle,
                notes: $inlineEditNotes,
                isSaving: isBulkProcessing,
                onCancel: cancelInlineEdit,
                onSave: { saveInlineEdit(for: task) }
            )
            .listRowInsets(rowInsets)
            .listRowSeparator(.hidden)
            .listRowBackground(Color(.secondarySystemGroupedBackground))
        } else {
            TaskRow(
                task: task,
                projectTitle: selectedProject == .all ? task.tags.first?.title : nil,
                projectTint: ProjectStyling.tint(for: task.tags.first?.id),
                onToggle: { toggleTask(task) },
                onTap: { if !isEditing { selectedTask = task } },
                onDelete: { deleteTask(task) }
            ) {
                projectMenu(for: task)
            } extraMenu: {
                Button("Quick Edit") {
                    beginInlineEdit(for: task)
                }
            }
            .tag(task.id)
            .listRowInsets(rowInsets)
            .listRowSeparator(.hidden)
            .listRowBackground(Color(.secondarySystemGroupedBackground))
        }
    }

    private var rowInsets: EdgeInsets {
        focusMode
        ? EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16)
        : EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16)
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
                viewMode = .projects
            }
        } label: {
            Label("Project", systemImage: "folder")
        }
    }

    private func updateTaskProject(_ task: MapTask, tagId: String?) {
        HapticFeedback.selection()
        Task {
            try? await tasksService.updateTask(
                task,
                tags: tagId.map { [$0] } ?? []
            )
        }
    }

    private func beginInlineEdit(for task: MapTask) {
        HapticFeedback.light()
        inlineEditTaskId = task.id
        inlineEditTitle = task.title
        inlineEditNotes = task.body ?? ""
    }

    private func cancelInlineEdit() {
        HapticFeedback.selection()
        inlineEditTaskId = nil
        inlineEditTitle = ""
        inlineEditNotes = ""
    }

    private func saveInlineEdit(for task: MapTask) {
        let title = inlineEditTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }
        HapticFeedback.success()
        isBulkProcessing = true
        Task {
            try? await tasksService.updateTask(
                task,
                title: title,
                body: inlineEditNotes.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            await MainActor.run {
                isBulkProcessing = false
                inlineEditTaskId = nil
            }
        }
    }

    private var selectedTasks: [MapTask] {
        tasksService.tasks.filter { selectedTaskIds.contains($0.id) }
    }

    private func bulkComplete() {
        guard !selectedTaskIds.isEmpty else { return }
        isBulkProcessing = true
        Task {
            for task in selectedTasks where !task.isCompleted {
                try? await tasksService.toggleTask(task)
            }
            await MainActor.run { clearSelection() }
        }
    }

    private func bulkAssignProject(_ tagId: String?) {
        guard !selectedTaskIds.isEmpty else { return }
        isBulkProcessing = true
        Task {
            for task in selectedTasks {
                try? await tasksService.updateTask(
                    task,
                    tags: tagId.map { [$0] } ?? []
                )
            }
            await MainActor.run { clearSelection() }
        }
    }

    private enum BulkDueDate {
        case today
        case tomorrow
        case nextWeek
        case clear
    }

    private func bulkSetDueDate(_ choice: BulkDueDate) {
        guard !selectedTaskIds.isEmpty else { return }
        let targetDate: Date?
        switch choice {
        case .today:
            targetDate = Calendar.current.startOfDay(for: Date())
        case .tomorrow:
            targetDate = Calendar.current.date(
                byAdding: .day,
                value: 1,
                to: Calendar.current.startOfDay(for: Date())
            )
        case .nextWeek:
            targetDate = DateHelpers.nextMonday()
        case .clear:
            targetDate = nil
        }

        Task {
            isBulkProcessing = true
            for task in selectedTasks {
                try? await tasksService.updateTask(
                    task,
                    dueAt: targetDate
                )
            }
            await MainActor.run { clearSelection() }
        }
    }

    private func bulkDeleteConfirmed() {
        guard !selectedTaskIds.isEmpty else { return }
        HapticFeedback.warning()
        isBulkProcessing = true
        Task {
            for task in selectedTasks {
                try? await tasksService.deleteTask(task)
            }
            await MainActor.run { clearSelection() }
        }
    }

    private func clearSelection() {
        selectedTaskIds.removeAll()
        editMode?.wrappedValue = .inactive
        isBulkProcessing = false
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

    private func createProject() {
        let trimmed = newProjectTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        Task {
            try? await tasksService.createTag(title: trimmed)
            await MainActor.run { newProjectTitle = "" }
        }
    }

    private func toggleFocusMode() {
        if focusMode {
            focusMode = false
            selectedFilter = previousFilter
        } else {
            previousFilter = selectedFilter
            focusMode = true
            selectedFilter = .today
        }
    }

    private func parseQuickAdd(_ input: String) -> QuickAddResult {
        var working = input
        let lower = working.lowercased()
        var dueAt: Date?
        var timeComponents: DateComponents?

        if lower.contains("tomorrow") {
            dueAt = Calendar.current.date(
                byAdding: .day,
                value: 1,
                to: Calendar.current.startOfDay(for: Date())
            )
            working = working.replacingOccurrences(of: "tomorrow", with: "", options: .caseInsensitive)
        } else if lower.contains("today") {
            dueAt = Calendar.current.startOfDay(for: Date())
            working = working.replacingOccurrences(of: "today", with: "", options: .caseInsensitive)
        } else if lower.contains("next week") {
            dueAt = DateHelpers.nextMonday()
            working = working.replacingOccurrences(of: "next week", with: "", options: .caseInsensitive)
        } else if let relative = parseRelativeDate(in: lower) {
            dueAt = relative
            if let token = relativeToken(in: lower) {
                working = working.replacingOccurrences(of: token, with: "", options: .caseInsensitive)
            }
        } else if let weekday = parseWeekday(in: lower) {
            dueAt = weekday
            if let token = weekdayToken(in: lower) {
                working = working.replacingOccurrences(of: token, with: "", options: .caseInsensitive)
            }
        }

        if let time = parseTime(in: lower) {
            timeComponents = time
            if let token = timeToken(in: lower) {
                working = working.replacingOccurrences(of: token, with: "", options: .caseInsensitive)
            }
        }

        if let base = dueAt, let timeComponents {
            dueAt = Calendar.current.date(
                bySettingHour: timeComponents.hour ?? 0,
                minute: timeComponents.minute ?? 0,
                second: 0,
                of: base
            )
        }

        let (tagId, cleaned, projectName) = parseProjectToken(in: working)
        let title = cleaned.trimmingCharacters(in: .whitespacesAndNewlines)
        let resolvedTagId = tagId ?? tasksService.tags.first(where: {
            guard let projectName else { return false }
            return $0.title.compare(projectName, options: .caseInsensitive) == .orderedSame
        })?.id
        return QuickAddResult(
            title: title.isEmpty ? input : title,
            dueAt: dueAt,
            tagId: resolvedTagId,
            projectName: projectName
        )
    }

    private func parseProjectToken(in input: String) -> (String?, String, String?) {
        guard let tokenRange = input.range(of: "(^|\\s)[#@]([\\w-]+)", options: .regularExpression) else {
            return (nil, input, nil)
        }

        let token = String(input[tokenRange])
        let name = token.trimmingCharacters(in: .whitespacesAndNewlines)
            .dropFirst()
        let projectName = String(name)

        let tagId = tasksService.tags.first(where: {
            $0.title.compare(projectName, options: .caseInsensitive) == .orderedSame
        })?.id

        let cleaned = input.replacingOccurrences(of: token, with: "", options: .regularExpression)
        return (tagId, cleaned, projectName.isEmpty ? nil : projectName)
    }

    private func parseWeekday(in lower: String) -> Date? {
        let calendar = Calendar.current
        let weekdays = [
            "monday": 2, "mon": 2,
            "tuesday": 3, "tue": 3,
            "wednesday": 4, "wed": 4,
            "thursday": 5, "thu": 5,
            "friday": 6, "fri": 6,
            "saturday": 7, "sat": 7,
            "sunday": 1, "sun": 1
        ]
        for (key, value) in weekdays where lower.contains(key) {
            let today = Date()
            let currentWeekday = calendar.component(.weekday, from: today)
            var daysToAdd = value - currentWeekday
            if daysToAdd <= 0 { daysToAdd += 7 }
            let start = calendar.startOfDay(for: today)
            return calendar.date(byAdding: .day, value: daysToAdd, to: start)
        }
        return nil
    }

    private func weekdayToken(in lower: String) -> String? {
        for token in ["monday","mon","tuesday","tue","wednesday","wed","thursday","thu","friday","fri","saturday","sat","sunday","sun"] {
            if lower.contains(token) { return token }
        }
        return nil
    }

    private func parseRelativeDate(in lower: String) -> Date? {
        if let match = lower.range(of: "in\\s+\\d+\\s+days", options: .regularExpression) {
            let token = String(lower[match])
            let number = token.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
            if let days = Int(number) {
                return Calendar.current.date(byAdding: .day, value: days, to: Calendar.current.startOfDay(for: Date()))
            }
        }
        if let match = lower.range(of: "in\\s+\\d+\\s+weeks", options: .regularExpression) {
            let token = String(lower[match])
            let number = token.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
            if let weeks = Int(number) {
                return Calendar.current.date(byAdding: .day, value: weeks * 7, to: Calendar.current.startOfDay(for: Date()))
            }
        }
        return nil
    }

    private func relativeToken(in lower: String) -> String? {
        if let match = lower.range(of: "in\\s+\\d+\\s+days", options: .regularExpression) {
            return String(lower[match])
        }
        if let match = lower.range(of: "in\\s+\\d+\\s+weeks", options: .regularExpression) {
            return String(lower[match])
        }
        return nil
    }

    private func parseTime(in lower: String) -> DateComponents? {
        if let match = lower.range(of: "\\b\\d{1,2}(?::\\d{2})?\\s?(am|pm)\\b", options: .regularExpression) {
            let token = String(lower[match]).replacingOccurrences(of: " ", with: "")
            let parts = token.split(separator: ":")
            let hourPart = parts.first ?? "0"
            let minutePart = parts.count > 1 ? parts[1].prefix(2) : "0"
            let isPM = token.contains("pm")
            let hourInt = max(0, min(12, Int(hourPart) ?? 0))
            let minuteInt = max(0, min(59, Int(minutePart) ?? 0))
            var hour = hourInt % 12
            if isPM { hour += 12 }
            return DateComponents(hour: hour, minute: minuteInt)
        }
        return nil
    }

    private func timeToken(in lower: String) -> String? {
        if let match = lower.range(of: "\\b\\d{1,2}(?::\\d{2})?\\s?(am|pm)\\b", options: .regularExpression) {
            return String(lower[match])
        }
        return nil
    }

    private func quickAddSummary(from result: QuickAddResult) -> [String]? {
        guard !result.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return nil
        }

        var tokens: [String] = []
        if let dueAt = result.dueAt {
            tokens.append("Due \(formatQuickAddDate(dueAt))")
        }
        if let tagId = result.tagId,
           let tag = tasksService.tags.first(where: { $0.id == tagId }) {
            tokens.append(tag.title)
        } else if let projectName = result.projectName {
            tokens.append(projectName)
        }

        return tokens.isEmpty ? nil : tokens
    }

    private func formatQuickAddDate(_ date: Date) -> String {
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "Today" }
        if calendar.isDateInTomorrow(date) { return "Tomorrow" }
        let formatter = DateFormatter()
        if calendar.isDate(date, equalTo: Date(), toGranularity: .weekOfYear) {
            formatter.dateFormat = "EEE"
        } else {
            formatter.dateFormat = "MMM d"
        }
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "h:mm a"
        let hasTime = calendar.component(.hour, from: date) != 0 || calendar.component(.minute, from: date) != 0
        return hasTime ? "\(formatter.string(from: date)) \(timeFormatter.string(from: date))" : formatter.string(from: date)
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
            .scaleEffect(isSelected ? 1.02 : 1.0)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
        .animation(.snappy(duration: 0.2), value: isSelected)
    }
}

// MARK: - Add Project Chip

private struct AddProjectChip: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: "plus")
                    .font(.caption.weight(.bold))
                Text("Add")
            }
            .font(.subheadline.weight(.semibold))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Color(.secondarySystemGroupedBackground))
            .foregroundStyle(.primary)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Project Chip

private struct ProjectChip: View {
    let title: String
    let count: Int
    let tint: Color
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Circle()
                    .fill(tint)
                    .frame(width: 6, height: 6)
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
            .scaleEffect(isSelected ? 1.02 : 1.0)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
        .animation(.snappy(duration: 0.2), value: isSelected)
    }
}

// MARK: - Inline Edit Row

private struct InlineEditRow: View {
    @Binding var title: String
    @Binding var notes: String
    let isSaving: Bool
    let onCancel: () -> Void
    let onSave: () -> Void
    @FocusState private var isTitleFocused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            TextField("Title", text: $title)
                .font(.body.weight(.medium))
                .focused($isTitleFocused)
                .submitLabel(.done)
                .onSubmit(onSave)

            TextField("Notes", text: $notes, axis: .vertical)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineLimit(1...3)

            HStack {
                Button("Cancel", action: onCancel)
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                Spacer()
                Button("Save", action: onSave)
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSaving)
            }
        }
        .padding(.vertical, 4)
        .onAppear { isTitleFocused = true }
    }
}
