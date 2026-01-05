import MapHealthCore
import SwiftUI

extension NotesView {
    var resolvedFolderId: String? {
        selectedFolderId ?? notesService.folders.first?.id
    }

    func loadNotesIfNeeded() async {
        if notesService.folders.isEmpty {
            await notesService.fetchFolders()
        }

        if notesService.notes.isEmpty {
            await notesService.fetchNotes()
        }

        if selectedFolderId == nil {
            selectedFolderId = notesService.folders.first?.id
        }
    }

    @ViewBuilder
    var notesContent: some View {
        if notesService.isLoading && notesService.notes.isEmpty {
            Section {
                VStack(spacing: 12) {
                    ProgressView()
                    Text("Loading notes...")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
                .listRowSeparator(.hidden)
                .listRowBackground(Color.clear)
            }
        } else if let error = notesService.error {
            Section {
                VStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.title3)
                        .foregroundStyle(.orange)
                    Text("Couldn't load notes")
                        .font(.headline)
                    Text(error.localizedDescription)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
                .listRowSeparator(.hidden)
                .listRowBackground(Color.clear)
            }
        } else if visibleNotes.isEmpty {
            Section {
                emptyState
            }
        } else {
            if !pinnedNotes.isEmpty {
                Section("Pinned") {
                    ForEach(pinnedNotes) { note in
                        noteRow(note)
                    }
                }
            }

            Section {
                ForEach(unpinnedNotes) { note in
                    noteRow(note)
                }
            } header: {
                listHeader
            }
        }
    }

    var filteredNotes: [MapNote] {
        var notes = sortedNotes

        if let selectedFolderId {
            notes = notes.filter { $0.folderId == selectedFolderId }
        }

        let query = searchText.trimmed
        guard !query.isEmpty else { return notes }

        return notes.filter { note in
            let titleMatches = (note.title ?? "").localizedCaseInsensitiveContains(query)
            let contentMatches = (note.content ?? "").localizedCaseInsensitiveContains(query)
            switch searchScope {
            case .all:
                return titleMatches || contentMatches
            case .title:
                return titleMatches
            case .content:
                return contentMatches
            }
        }
    }

    var pinnedNotes: [MapNote] {
        applyFilter(filteredNotes.filter { pinnedIds.contains($0.id) })
    }

    var unpinnedNotes: [MapNote] {
        applyFilter(filteredNotes.filter { !pinnedIds.contains($0.id) })
    }

    var visibleNotes: [MapNote] {
        applyFilter(filteredNotes)
    }

    var sortedNotes: [MapNote] {
        switch sortOrder {
        case .lastEdited:
            return notesService.notes.sorted {
                let lhsDate = $0.updatedAt ?? $0.createdAt
                let rhsDate = $1.updatedAt ?? $1.createdAt
                return lhsDate > rhsDate
            }
        case .dateCreated:
            return notesService.notes.sorted { $0.createdAt > $1.createdAt }
        }
    }

    private func folderName(for note: MapNote) -> String? {
        notesService.folders.first(where: { $0.id == note.folderId })?.name
    }

    private func deleteNote(_ note: MapNote) {
        Task {
            _ = try? await notesService.deleteNote(note)
        }
    }

    private func togglePin(_ note: MapNote) {
        var ids = pinnedIds
        if ids.contains(note.id) {
            ids.remove(note.id)
        } else {
            ids.insert(note.id)
        }
        pinnedIds = ids
    }

    var pinnedIds: Set<String> {
        get {
            let ids = pinnedIdsStorage.split(separator: ",").map { String($0) }
            return Set(ids)
        }
        nonmutating set {
            pinnedIdsStorage = newValue.joined(separator: ",")
        }
    }

    private func noteRow(_ note: MapNote) -> some View {
        NavigationLink(value: note) {
            NoteRow(
                note: note,
                folderName: folderName(for: note),
                showFolder: selectedFolderId == nil,
                isPinned: pinnedIds.contains(note.id)
            )
        }
        .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
        .listRowSeparator(.hidden)
        .listRowBackground(Color(.secondarySystemGroupedBackground))
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                deleteNote(note)
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
        .swipeActions(edge: .leading) {
            Button {
                togglePin(note)
            } label: {
                Label(pinnedIds.contains(note.id) ? "Unpin" : "Pin", systemImage: "pin")
            }
            .tint(.yellow)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "note.text")
                .font(.system(size: 48, weight: .light))
                .foregroundStyle(.yellow.opacity(0.8))

            Text(emptyStateTitle)
                .font(.headline)

            Text(emptyStateSubtitle)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            if searchText.trimmed.isEmpty {
                Button {
                    showingNewNote = true
                } label: {
                    Label("New Note", systemImage: "square.and.pencil")
                        .font(.subheadline.weight(.semibold))
                }
                .buttonStyle(.borderedProminent)
                .tint(.yellow)
                .disabled(resolvedFolderId == nil)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
    }

    private var listHeader: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(listHeaderTitle)
                .font(.headline)
                .foregroundStyle(.primary)
            Text(noteCountLabel)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .textCase(nil)
        .padding(.top, 4)
        .padding(.bottom, 4)
    }

    private var listHeaderTitle: String {
        if let selectedFolderId,
           let folder = notesService.folders.first(where: { $0.id == selectedFolderId }) {
            return folder.name
        }
        return "All Notes"
    }

    private var emptyStateTitle: String {
        if !searchText.trimmed.isEmpty { return "No matching notes" }
        switch noteFilter {
        case .all: return "No notes yet"
        case .pinned: return "No pinned notes"
        case .recent: return "No recent notes"
        }
    }

    private var emptyStateSubtitle: String {
        if !searchText.trimmed.isEmpty { return "Try a different search term" }
        switch noteFilter {
        case .all: return "Tap the pen to start a note"
        case .pinned: return "Pin notes for quick access"
        case .recent: return "Notes edited in the last 7 days will appear here"
        }
    }
}
