import Foundation

/// A task/todo item synced from the Map backend
public struct MapTask: Codable, Identifiable, Equatable, Sendable {
    public let id: String
    public var title: String
    public var body: String?
    public var dueAt: Date?
    public var completedAt: Date?
    public var createdAt: Date
    public var updatedAt: Date
    public var tags: [TaskTag]

    public var isCompleted: Bool {
        completedAt != nil
    }

    public init(
        id: String,
        title: String,
        body: String? = nil,
        dueAt: Date? = nil,
        completedAt: Date? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        tags: [TaskTag] = []
    ) {
        self.id = id
        self.title = title
        self.body = body
        self.dueAt = dueAt
        self.completedAt = completedAt
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.tags = tags
    }
}

/// A tag associated with tasks
public struct TaskTag: Codable, Identifiable, Equatable, Sendable {
    public let id: String
    public var title: String

    public init(id: String, title: String) {
        self.id = id
        self.title = title
    }
}

// MARK: - API Response Types

struct TasksResponse: Codable {
    let tasks: [MapTask]
}

struct TaskResponse: Codable {
    let task: MapTask
}

struct TagsResponse: Codable {
    let tags: [TaskTag]
}

struct TagResponse: Codable {
    let tag: TaskTag
}

// MARK: - API Request Types

public struct CreateTaskRequest: Codable {
    public let title: String
    public let body: String?
    public let dueAt: String?

    public init(title: String, body: String? = nil, dueAt: Date? = nil) {
        self.title = title
        self.body = body
        self.dueAt = dueAt?.iso8601String
    }
}

public struct UpdateTaskRequest: Codable {
    public var title: String?
    public var body: String?
    public var dueAt: String?
    public var completed: Bool?
    public var tags: [String]?

    public init(
        title: String? = nil,
        body: String? = nil,
        dueAt: Date? = nil,
        clearDueDate: Bool = false,
        completed: Bool? = nil,
        tags: [String]? = nil
    ) {
        self.title = title
        self.body = body
        if clearDueDate {
            self.dueAt = nil
        } else {
            self.dueAt = dueAt?.iso8601String
        }
        self.completed = completed
        self.tags = tags
    }
}

