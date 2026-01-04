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

    // Additional fields from backend (optional for backwards compatibility)
    public var taskStatus: String?
    public var scheduledFor: Date?
    public var estimatedDuration: String?
    public var actualDuration: String?

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
        tags: [TaskTag] = [],
        taskStatus: String? = nil,
        scheduledFor: Date? = nil,
        estimatedDuration: String? = nil,
        actualDuration: String? = nil
    ) {
        self.id = id
        self.title = title
        self.body = body
        self.dueAt = dueAt
        self.completedAt = completedAt
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.tags = tags
        self.taskStatus = taskStatus
        self.scheduledFor = scheduledFor
        self.estimatedDuration = estimatedDuration
        self.actualDuration = actualDuration
    }

    enum CodingKeys: String, CodingKey {
        case id, title, body, dueAt, completedAt, createdAt, updatedAt, tags
        case taskStatus, scheduledFor, estimatedDuration, actualDuration
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        id = try container.decode(String.self, forKey: .id)
        title = try container.decode(String.self, forKey: .title)
        body = try container.decodeIfPresent(String.self, forKey: .body)

        // Decode dates from ISO8601 strings
        dueAt = try Self.decodeDate(from: container, forKey: .dueAt)
        completedAt = try Self.decodeDate(from: container, forKey: .completedAt)
        createdAt = try Self.decodeDate(from: container, forKey: .createdAt) ?? Date()
        updatedAt = try Self.decodeDate(from: container, forKey: .updatedAt) ?? Date()
        scheduledFor = try Self.decodeDate(from: container, forKey: .scheduledFor)

        tags = try container.decodeIfPresent([TaskTag].self, forKey: .tags) ?? []
        taskStatus = try container.decodeIfPresent(String.self, forKey: .taskStatus)
        estimatedDuration = try container.decodeIfPresent(String.self, forKey: .estimatedDuration)
        actualDuration = try container.decodeIfPresent(String.self, forKey: .actualDuration)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        try container.encode(id, forKey: .id)
        try container.encode(title, forKey: .title)
        try container.encodeIfPresent(body, forKey: .body)
        try container.encodeIfPresent(dueAt?.iso8601String, forKey: .dueAt)
        try container.encodeIfPresent(completedAt?.iso8601String, forKey: .completedAt)
        try container.encode(createdAt.iso8601String, forKey: .createdAt)
        try container.encode(updatedAt.iso8601String, forKey: .updatedAt)
        try container.encode(tags, forKey: .tags)
        try container.encodeIfPresent(taskStatus, forKey: .taskStatus)
        try container.encodeIfPresent(scheduledFor?.iso8601String, forKey: .scheduledFor)
        try container.encodeIfPresent(estimatedDuration, forKey: .estimatedDuration)
        try container.encodeIfPresent(actualDuration, forKey: .actualDuration)
    }

    private static func decodeDate(from container: KeyedDecodingContainer<CodingKeys>, forKey key: CodingKeys) throws -> Date? {
        guard let dateString = try container.decodeIfPresent(String.self, forKey: key) else {
            return nil
        }

        // Try ISO8601 with fractional seconds first
        let formatterWithFractional = ISO8601DateFormatter()
        formatterWithFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatterWithFractional.date(from: dateString) {
            return date
        }

        // Fall back to ISO8601 without fractional seconds
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        if let date = formatter.date(from: dateString) {
            return date
        }

        return nil
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

public struct CreateTagRequest: Codable {
    public let title: String

    public init(title: String) {
        self.title = title
    }
}

public struct UpdateTagRequest: Codable {
    public let title: String?

    public init(title: String?) {
        self.title = title
    }
}

public struct UpdateTaskRequest: Encodable {
    public var title: String?
    public var body: String?
    public var dueAt: String?
    public var completed: Bool?
    public var tags: [String]?

    // Track if we should explicitly send null for dueAt
    private var shouldClearDueDate: Bool = false

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
        self.shouldClearDueDate = clearDueDate
        self.dueAt = dueAt?.iso8601String
        self.completed = completed
        self.tags = tags
    }

    enum CodingKeys: String, CodingKey {
        case title, body, dueAt, completed, tags
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        try container.encodeIfPresent(title, forKey: .title)
        try container.encodeIfPresent(body, forKey: .body)
        try container.encodeIfPresent(completed, forKey: .completed)
        try container.encodeIfPresent(tags, forKey: .tags)

        // Explicitly encode null if clearing the due date
        if shouldClearDueDate {
            try container.encodeNil(forKey: .dueAt)
        } else if let dueAt = dueAt {
            try container.encode(dueAt, forKey: .dueAt)
        }
    }
}
