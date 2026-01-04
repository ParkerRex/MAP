import MapHealthCore
import SwiftUI

struct NotesView: View {
    @StateObject private var notesService = NotesService.shared
    @State private var searchText = ""
    @State private var selectedFolderId: String?
    @State private var showingNewNote = false
    @State private var sortOrder: SortOrder = .lastEdited

    var body: some View {
        NavigationStack {
            List {
                notesContent
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .scrollDismissesKeyboard(.interactively)
            .searchable(text: $searchText, prompt: "Search notes")
            .refreshable { await notesService.refresh() }
            .task { await loadNotesIfNeeded() }
            .navigationTitle("Notes")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    folderMenu
                }
                ToolbarItem(placement: .topBarTrailing) {
                    sortMenu
                }
            }
            .navigationDestination(for: MapNote.self) { note in
                NoteEditorView(
                    note: note,
                    notesService: notesService,
                    initialFolderId: note.folderId
                )
            }
            .navigationDestination(isPresented: $showingNewNote) {
                if let folderId = resolvedFolderId {
                    NoteEditorView(
                        note: nil,
                        notesService: notesService,
                        initialFolderId: folderId
                    )
                } else {
                    Text("No folders available")
                }
            }
            .safeAreaInset(edge: .bottom) {
                bottomBar
            }
        }
    }

    private var resolvedFolderId: String? {
        selectedFolderId ?? notesService.folders.first?.id
    }

    private func loadNotesIfNeeded() async {
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
}

// MARK: - Content

extension NotesView {
    @ViewBuilder
    private var notesContent: some View {
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
        } else if filteredNotes.isEmpty {
            Section {
                emptyState
            }
        } else {
            Section {
                ForEach(filteredNotes) { note in
                    NavigationLink(value: note) {
                        NoteRow(
                            note: note,
                            folderName: folderName(for: note),
                            showFolder: selectedFolderId == nil
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
                }
            } header: {
                listHeader
            }
        }
    }

    private var filteredNotes: [MapNote] {
        var notes = sortedNotes

        if let selectedFolderId {
            notes = notes.filter { $0.folderId == selectedFolderId }
        }

        let query = searchText.trimmed
        guard !query.isEmpty else { return notes }

        return notes.filter { note in
            (note.title ?? "").localizedCaseInsensitiveContains(query) ||
            (note.content ?? "").localizedCaseInsensitiveContains(query)
        }
    }

    private var sortedNotes: [MapNote] {
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
            try? await notesService.deleteNote(note)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "note.text")
                .font(.system(size: 48, weight: .light))
                .foregroundStyle(.yellow.opacity(0.8))

            Text(searchText.trimmed.isEmpty ? "No notes yet" : "No matching notes")
                .font(.headline)

            Text(searchText.trimmed.isEmpty ? "Tap the pen to start a note" : "Try a different search term")
                .font(.subheadline)
                .foregroundStyle(.secondary)
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
}

// MARK: - Folder Menu

extension NotesView {
    private var folderMenu: some View {
        Menu {
            Button("All Notes") { selectedFolderId = nil }

            if !notesService.folders.isEmpty {
                Divider()

                ForEach(notesService.folders) { folder in
                    Button(folder.name) { selectedFolderId = folder.id }
                }
            }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "folder")
                Text(selectedFolderName)
            }
            .font(.subheadline.weight(.medium))
        }
    }

    private var selectedFolderName: String {
        if let selectedFolderId,
           let folder = notesService.folders.first(where: { $0.id == selectedFolderId }) {
            return folder.name
        }
        return "All Notes"
    }
}

// MARK: - Sort Menu

extension NotesView {
    private var sortMenu: some View {
        Menu {
            Button("Last Edited") { sortOrder = .lastEdited }
            Button("Date Created") { sortOrder = .dateCreated }
        } label: {
            Image(systemName: "ellipsis.circle")
                .font(.body.weight(.medium))
        }
    }
}

// MARK: - Bottom Bar

extension NotesView {
    private var bottomBar: some View {
        VStack(spacing: 0) {
            Divider()
            HStack {
                Text(noteCountLabel)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Spacer()
                Button {
                    showingNewNote = true
                } label: {
                    Image(systemName: "square.and.pencil")
                        .font(.title3.weight(.semibold))
                }
                .disabled(resolvedFolderId == nil)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.thinMaterial)
        }
    }

    private var noteCountLabel: String {
        let count = filteredNotes.count
        return count == 1 ? "1 Note" : "\(count) Notes"
    }
}

// MARK: - Note Row

private struct NoteRow: View {
    let note: MapNote
    let folderName: String?
    let showFolder: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(noteTitle)
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                Spacer(minLength: 0)

                Text(noteDate)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if !previewText.isEmpty {
                Text(previewText)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            if showFolder, let folderName, !folderName.isEmpty {
                Text(folderName)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .contentShape(Rectangle())
    }

    private var noteTitle: String {
        let title = note.title?.trimmed ?? ""
        return title.isEmpty ? "Untitled" : title
    }

    private var previewText: String {
        let content = note.content?.trimmed ?? ""
        return content.replacingOccurrences(of: "\n", with: " ")
    }

    private var noteDate: String {
        let date = note.updatedAt ?? note.createdAt
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return "Today" }
        if calendar.isDateInYesterday(date) { return "Yesterday" }

        let formatter = DateFormatter()
        if calendar.isDate(date, equalTo: Date(), toGranularity: .year) {
            formatter.dateFormat = "MMM d"
        } else {
            formatter.dateFormat = "MMM d, yyyy"
        }
        return formatter.string(from: date)
    }
}

// MARK: - Note Editor

private struct NoteEditorView: View {
    let note: MapNote?
    @ObservedObject var notesService: NotesService

    @Environment(\.dismiss) private var dismiss
    @FocusState private var focusedField: Field?

    @State private var title: String
    @State private var content: String
    @State private var selectedFolderId: String
    @State private var isSaving = false
    @State private var showingDeleteConfirmation = false

    private let originalFolderId: String

    enum Field {
        case title
        case content
    }

    init(note: MapNote?, notesService: NotesService, initialFolderId: String) {
        self.note = note
        self.notesService = notesService
        _title = State(initialValue: note?.title ?? "")
        _content = State(initialValue: note?.content ?? "")
        _selectedFolderId = State(initialValue: note?.folderId ?? initialFolderId)
        self.originalFolderId = note?.folderId ?? initialFolderId
    }

    private var hasChanges: Bool {
        let originalTitle = note?.title ?? ""
        let originalContent = note?.content ?? ""
        return title.trimmed != originalTitle.trimmed ||
            content.trimmed != originalContent.trimmed ||
            selectedFolderId != originalFolderId
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                folderPicker

                TextField("Title", text: $title, axis: .vertical)
                    .font(.title3.weight(.semibold))
                    .focused($focusedField, equals: .title)
                    .lineLimit(1...3)

                ZStack(alignment: .topLeading) {
                    if content.trimmed.isEmpty {
                        Text("Note")
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .padding(.top, 8)
                            .padding(.leading, 4)
                    }
                    TextEditor(text: $content)
                        .font(.body)
                        .frame(minHeight: 240)
                        .focused($focusedField, equals: .content)
                }
            }
            .padding(20)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(note == nil ? "New Note" : "Note")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") { dismiss() }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") { saveNote() }
                    .fontWeight(.semibold)
                    .disabled(title.trimmed.isEmpty || isSaving || !hasChanges)
            }

            if note != nil {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(role: .destructive) {
                        showingDeleteConfirmation = true
                    } label: {
                        Image(systemName: "trash")
                    }
                }
            }

            ToolbarItem(placement: .keyboard) {
                HStack {
                    Spacer()
                    Button("Done") { focusedField = nil }
                }
            }
        }
        .confirmationDialog(
            "Delete Note?",
            isPresented: $showingDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                deleteNote()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This action cannot be undone.")
        }
        .onAppear {
            if note == nil {
                focusedField = .title
            }
        }
    }

    private var folderPicker: some View {
        Menu {
            ForEach(notesService.folders) { folder in
                Button(folder.name) { selectedFolderId = folder.id }
            }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "folder")
                Text(folderName)
            }
            .font(.subheadline.weight(.medium))
        }
    }

    private var folderName: String {
        if let folder = notesService.folders.first(where: { $0.id == selectedFolderId }) {
            return folder.name
        }
        return "Folder"
    }

    private func saveNote() {
        let trimmedTitle = title.trimmed
        guard !trimmedTitle.isEmpty else { return }

        isSaving = true
        let trimmedContent = content.trimmed
        let contentValue = trimmedContent.isEmpty ? nil : trimmedContent

        Task {
            do {
                if let note {
                    _ = try await notesService.updateNote(
                        note,
                        title: trimmedTitle,
                        content: contentValue,
                        folderId: selectedFolderId == originalFolderId ? nil : selectedFolderId
                    )
                } else {
                    _ = try await notesService.createNote(
                        title: trimmedTitle,
                        content: contentValue,
                        folderId: selectedFolderId
                    )
                }
                await MainActor.run { dismiss() }
            } catch {
                await MainActor.run { isSaving = false }
            }
        }
    }

    private func deleteNote() {
        guard let note else { return }
        Task {
            try? await notesService.deleteNote(note)
            await MainActor.run { dismiss() }
        }
    }
}

private extension String {
    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

private enum SortOrder {
    case lastEdited
    case dateCreated
}
