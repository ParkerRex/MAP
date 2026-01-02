import Foundation

public struct ChatMessage: Identifiable, Equatable, Codable {
    public enum Role: String, Codable {
        case system
        case user
        case assistant
    }

    public let id: UUID
    public let role: Role
    public var content: String
    public let date: Date

    public init(
        role: Role,
        content: String,
        id: UUID = UUID(),
        date: Date = Date()
    ) {
        self.role = role
        self.content = content
        self.id = id
        self.date = date
    }
}
