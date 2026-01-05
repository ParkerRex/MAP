import MapHealthCore
import SwiftUI

extension String {
    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

enum SortOrder {
    case lastEdited
    case dateCreated
}

enum EditorMode {
    case edit
    case preview
}

enum NoteFilter: CaseIterable {
    case all
    case pinned
    case recent

    var title: String {
        switch self {
        case .all: "All"
        case .pinned: "Pinned"
        case .recent: "Recent"
        }
    }
}

enum SearchScope: CaseIterable {
    case all
    case title
    case content

    var title: String {
        switch self {
        case .all: "All"
        case .title: "Title"
        case .content: "Content"
        }
    }
}
