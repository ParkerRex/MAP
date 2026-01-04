import Foundation

/// Service for managing notes with local caching and API sync
@MainActor
public class NotesService: ObservableObject {
    public static let shared = NotesService()

    @Published public private(set) var notes: [MapNote] = []
    @Published public private(set) var folders: [MapFolder] = []
    @Published public private(set) var isLoading = false
    @Published public private(set) var error: Error?

    private let apiClient: MapAPIClient

    public init(apiClient: MapAPIClient = .shared) {
        self.apiClient = apiClient
    }

    // MARK: - Fetch Operations

    public func fetchNotes() async {
        isLoading = true
        error = nil

        do {
            notes = try await apiClient.getNotes()
        } catch {
            self.error = error
        }

        isLoading = false
    }

    public func fetchFolders() async {
        do {
            folders = try await apiClient.getFolders()

            if folders.isEmpty {
                let folder = try await apiClient.createFolder(name: "Notes")
                folders = [folder]
            }
        } catch {
            self.error = error
        }
    }

    public func refresh() async {
        isLoading = true
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.fetchFolders() }
            group.addTask { await self.fetchNotes() }
        }
        isLoading = false
    }

    // MARK: - Notes Operations

    @discardableResult
    public func createNote(title: String, content: String? = nil, folderId: String) async throws -> MapNote {
        let request = CreateNoteRequest(title: title, content: content, folderId: folderId)
        let note = try await apiClient.createNote(request)
        notes.insert(note, at: 0)
        return note
    }

    @discardableResult
    public func updateNote(
        _ note: MapNote,
        title: String? = nil,
        content: String? = nil,
        folderId: String? = nil
    ) async throws -> MapNote {
        let request = UpdateNoteRequest(title: title, content: content, folderId: folderId)
        let updated = try await apiClient.updateNote(id: note.id, request)

        if let index = notes.firstIndex(where: { $0.id == note.id }) {
            notes[index] = updated
        }

        return updated
    }

    public func deleteNote(_ note: MapNote) async throws {
        try await apiClient.deleteNote(id: note.id)
        notes.removeAll { $0.id == note.id }
    }

    // MARK: - Folder Operations

    @discardableResult
    public func createFolder(name: String) async throws -> MapFolder {
        let folder = try await apiClient.createFolder(name: name)
        folders.append(folder)
        return folder
    }

    @discardableResult
    public func updateFolder(_ folder: MapFolder, name: String) async throws -> MapFolder {
        let updated = try await apiClient.updateFolder(id: folder.id, name: name)

        if let index = folders.firstIndex(where: { $0.id == folder.id }) {
            folders[index] = updated
        }

        return updated
    }

    public func deleteFolder(_ folder: MapFolder) async throws {
        try await apiClient.deleteFolder(id: folder.id)
        folders.removeAll { $0.id == folder.id }
        notes.removeAll { $0.folderId == folder.id }
    }

    // MARK: - Computed

    public var sortedNotes: [MapNote] {
        notes.sorted {
            let lhsDate = $0.updatedAt ?? $0.createdAt
            let rhsDate = $1.updatedAt ?? $1.createdAt
            return lhsDate > rhsDate
        }
    }
}
