import Foundation

/// Service for managing tasks with local caching and API sync
@MainActor
public class TasksService: ObservableObject {
    public static let shared = TasksService()

    @Published public private(set) var tasks: [MapTask] = []
    @Published public private(set) var tags: [TaskTag] = []
    @Published public private(set) var isLoading = false
    @Published public private(set) var error: Error?

    private let apiClient: MapAPIClient

    public init(apiClient: MapAPIClient = .shared) {
        self.apiClient = apiClient
    }

    // MARK: - Fetch Operations

    /// Fetch all tasks from the API
    public func fetchTasks() async {
        isLoading = true
        error = nil

        do {
            tasks = try await apiClient.getTasks()
        } catch {
            self.error = error
        }

        isLoading = false
    }

    /// Fetch all tags from the API
    public func fetchTags() async {
        do {
            tags = try await apiClient.getTags()
        } catch {
            self.error = error
        }
    }

    /// Refresh all data
    public func refresh() async {
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.fetchTasks() }
            group.addTask { await self.fetchTags() }
        }
    }

    // MARK: - Task Operations

    /// Create a new task
    @discardableResult
    public func createTask(title: String, body: String? = nil, dueAt: Date? = nil) async throws -> MapTask {
        let request = CreateTaskRequest(title: title, body: body, dueAt: dueAt)
        let task = try await apiClient.createTask(request)
        tasks.insert(task, at: 0)
        return task
    }

    /// Update an existing task
    @discardableResult
    public func updateTask(
        _ task: MapTask,
        title: String? = nil,
        body: String? = nil,
        dueAt: Date? = nil,
        tags: [String]? = nil
    ) async throws -> MapTask {
        let request = UpdateTaskRequest(title: title, body: body, dueAt: dueAt, tags: tags)
        let updated = try await apiClient.updateTask(id: task.id, request)

        if let index = tasks.firstIndex(where: { $0.id == task.id }) {
            tasks[index] = updated
        }

        return updated
    }

    /// Schedule or reschedule a task (pass nil to clear the due date)
    @discardableResult
    public func scheduleTask(_ task: MapTask, dueAt: Date?) async throws -> MapTask {
        let request = UpdateTaskRequest(dueAt: dueAt, clearDueDate: dueAt == nil)
        let updated = try await apiClient.updateTask(id: task.id, request)

        if let index = tasks.firstIndex(where: { $0.id == task.id }) {
            tasks[index] = updated
        }

        return updated
    }

    /// Toggle task completion
    @discardableResult
    public func toggleTask(_ task: MapTask) async throws -> MapTask {
        let updated = try await apiClient.toggleTask(id: task.id, completed: !task.isCompleted)

        if let index = tasks.firstIndex(where: { $0.id == task.id }) {
            tasks[index] = updated
        }

        return updated
    }

    /// Delete a task
    public func deleteTask(_ task: MapTask) async throws {
        try await apiClient.deleteTask(id: task.id)
        tasks.removeAll { $0.id == task.id }
    }

    // MARK: - Tag Operations

    @discardableResult
    public func createTag(title: String) async throws -> TaskTag {
        let request = CreateTagRequest(title: title)
        let tag = try await apiClient.createTag(request)
        tags.append(tag)
        tags.sort { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }
        return tag
    }

    @discardableResult
    public func updateTag(_ tag: TaskTag, title: String) async throws -> TaskTag {
        let request = UpdateTagRequest(title: title)
        let updated = try await apiClient.updateTag(id: tag.id, request)

        if let index = tags.firstIndex(where: { $0.id == tag.id }) {
            tags[index] = updated
        }

        tasks = tasks.map { task in
            guard task.tags.contains(where: { $0.id == tag.id }) else { return task }
            var updatedTask = task
            updatedTask.tags = task.tags.map { $0.id == tag.id ? updated : $0 }
            return updatedTask
        }

        return updated
    }

    public func deleteTag(_ tag: TaskTag) async throws {
        try await apiClient.deleteTag(id: tag.id)
        tags.removeAll { $0.id == tag.id }
        tasks = tasks.map { task in
            var updatedTask = task
            updatedTask.tags = task.tags.filter { $0.id != tag.id }
            return updatedTask
        }
    }

    // MARK: - Computed Properties

    /// Tasks that are not completed, sorted by creation date (newest first)
    public var pendingTasks: [MapTask] {
        tasks.filter { !$0.isCompleted }
            .sorted { $0.createdAt > $1.createdAt }
    }

    /// Completed tasks, sorted by completion date (newest first)
    public var completedTasks: [MapTask] {
        tasks.filter { $0.isCompleted }
            .sorted { ($0.completedAt ?? $0.updatedAt) > ($1.completedAt ?? $1.updatedAt) }
    }

    /// Tasks with due dates, sorted by due date (earliest first)
    public var upcomingTasks: [MapTask] {
        tasks.filter { $0.dueAt != nil && !$0.isCompleted }
            .sorted { $0.dueAt! < $1.dueAt! }
    }

    /// Tasks due today
    public var todaysTasks: [MapTask] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let tomorrow = calendar.date(byAdding: .day, value: 1, to: today)!

        return tasks.filter { task in
            guard let dueAt = task.dueAt else { return false }
            return dueAt >= today && dueAt < tomorrow && !task.isCompleted
        }
    }

    /// Overdue tasks
    public var overdueTasks: [MapTask] {
        let now = Date()
        return tasks.filter { task in
            guard let dueAt = task.dueAt else { return false }
            return dueAt < now && !task.isCompleted
        }
    }
}
