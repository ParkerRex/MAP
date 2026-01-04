import Foundation

/// A note synced from the Map backend
public struct MapNote: Codable, Identifiable, Equatable, Hashable, Sendable {
    public let id: String
    public var title: String?
    public var content: String?
    public var folderId: String
    public var userId: String?
    public var createdAt: Date
    public var updatedAt: Date?

    public init(
        id: String,
        title: String? = nil,
        content: String? = nil,
        folderId: String,
        userId: String? = nil,
        createdAt: Date = Date(),
        updatedAt: Date? = nil
    ) {
        self.id = id
        self.title = title
        self.content = content
        self.folderId = folderId
        self.userId = userId
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }

    enum CodingKeys: String, CodingKey {
        case id, title, content, folderId, userId, createdAt, updatedAt
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        id = try container.decode(String.self, forKey: .id)
        title = try container.decodeIfPresent(String.self, forKey: .title)
        content = try container.decodeIfPresent(String.self, forKey: .content)
        folderId = try container.decode(String.self, forKey: .folderId)
        userId = try container.decodeIfPresent(String.self, forKey: .userId)
        createdAt = try Self.decodeDate(from: container, forKey: .createdAt) ?? Date()
        updatedAt = try Self.decodeDate(from: container, forKey: .updatedAt)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        try container.encode(id, forKey: .id)
        try container.encodeIfPresent(title, forKey: .title)
        try container.encodeIfPresent(content, forKey: .content)
        try container.encode(folderId, forKey: .folderId)
        try container.encodeIfPresent(userId, forKey: .userId)
        try container.encode(createdAt.iso8601String, forKey: .createdAt)
        try container.encodeIfPresent(updatedAt?.iso8601String, forKey: .updatedAt)
    }

    private static func decodeDate(
        from container: KeyedDecodingContainer<CodingKeys>,
        forKey key: CodingKeys
    ) throws -> Date? {
        guard let dateString = try container.decodeIfPresent(String.self, forKey: key) else {
            return nil
        }

        let formatterWithFractional = ISO8601DateFormatter()
        formatterWithFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatterWithFractional.date(from: dateString) {
            return date
        }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: dateString)
    }
}

public struct MapFolder: Codable, Identifiable, Equatable, Hashable, Sendable {
    public let id: String
    public var name: String
    public var userId: String?
    public var createdAt: Date?
    public var updatedAt: Date?
    public var notesCount: Int?

    public init(
        id: String,
        name: String,
        userId: String? = nil,
        createdAt: Date? = nil,
        updatedAt: Date? = nil,
        notesCount: Int? = nil
    ) {
        self.id = id
        self.name = name
        self.userId = userId
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.notesCount = notesCount
    }

    enum CodingKeys: String, CodingKey {
        case id, name, userId, createdAt, updatedAt, notesCount
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        userId = try container.decodeIfPresent(String.self, forKey: .userId)
        createdAt = try Self.decodeDate(from: container, forKey: .createdAt)
        updatedAt = try Self.decodeDate(from: container, forKey: .updatedAt)
        notesCount = try container.decodeIfPresent(Int.self, forKey: .notesCount)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encodeIfPresent(userId, forKey: .userId)
        try container.encodeIfPresent(createdAt?.iso8601String, forKey: .createdAt)
        try container.encodeIfPresent(updatedAt?.iso8601String, forKey: .updatedAt)
        try container.encodeIfPresent(notesCount, forKey: .notesCount)
    }

    private static func decodeDate(
        from container: KeyedDecodingContainer<CodingKeys>,
        forKey key: CodingKeys
    ) throws -> Date? {
        guard let dateString = try container.decodeIfPresent(String.self, forKey: key) else {
            return nil
        }

        let formatterWithFractional = ISO8601DateFormatter()
        formatterWithFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatterWithFractional.date(from: dateString) {
            return date
        }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: dateString)
    }
}

// MARK: - API Response Types

struct NotesResponse: Codable {
    let notes: [MapNote]
}

struct NoteResponse: Codable {
    let note: MapNote
}

struct FoldersResponse: Codable {
    let folders: [MapFolder]
}

struct FolderResponse: Codable {
    let folder: MapFolder
}

// MARK: - API Request Types

public struct CreateNoteRequest: Codable {
    public let title: String
    public let content: String?
    public let folderId: String

    public init(title: String, content: String? = nil, folderId: String) {
        self.title = title
        self.content = content
        self.folderId = folderId
    }
}

public struct UpdateNoteRequest: Codable {
    public var title: String?
    public var content: String?
    public var folderId: String?

    public init(title: String? = nil, content: String? = nil, folderId: String? = nil) {
        self.title = title
        self.content = content
        self.folderId = folderId
    }
}

public struct CreateFolderRequest: Codable {
    public let name: String

    public init(name: String) {
        self.name = name
    }
}

public struct UpdateFolderRequest: Codable {
    public let name: String

    public init(name: String) {
        self.name = name
    }
}
