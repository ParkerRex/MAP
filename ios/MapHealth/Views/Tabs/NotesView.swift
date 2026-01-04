import MapHealthCore
import SwiftUI

struct NotesView: View {
    @StateObject private var notesService = NotesService.shared
    @State private var searchText = ""
    @State private var selectedFolderId: String?
    @State private var showingNewNote = false
    @State private var sortOrder: SortOrder = .lastEdited
    @State private var showingNewFolder = false
    @State private var newFolderName = ""
    @AppStorage("notes.pinnedIds") private var pinnedIdsStorage = ""
    @State private var noteFilter: NoteFilter = .all
    @State private var searchScope: SearchScope = .all

    var body: some View {
        NavigationStack {
            List {
                notesContent
            }
            .listStyle(.plain)
            .listSectionSpacing(12)
            .scrollContentBackground(.hidden)
            .scrollDismissesKeyboard(.interactively)
            .searchable(text: $searchText, prompt: "Search notes")
            .searchScopes($searchScope) {
                ForEach(SearchScope.allCases, id: \.self) { scope in
                    Text(scope.title).tag(scope)
                }
            }
            .refreshable { await notesService.refresh() }
            .task { await loadNotesIfNeeded() }
            .navigationTitle("Notes")
            .navigationBarTitleDisplayMode(.large)
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
            .alert("New Folder", isPresented: $showingNewFolder) {
                TextField("Folder name", text: $newFolderName)
                Button("Create") { createFolder() }
                    .disabled(newFolderName.trimmed.isEmpty)
                Button("Cancel", role: .cancel) { newFolderName = "" }
            }
            .safeAreaInset(edge: .top) {
                filterBar
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

    private var filteredNotes: [MapNote] {
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

    private var pinnedNotes: [MapNote] {
        applyFilter(filteredNotes.filter { pinnedIds.contains($0.id) })
    }

    private var unpinnedNotes: [MapNote] {
        applyFilter(filteredNotes.filter { !pinnedIds.contains($0.id) })
    }

    private var visibleNotes: [MapNote] {
        applyFilter(filteredNotes)
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

    private func togglePin(_ note: MapNote) {
        var ids = pinnedIds
        if ids.contains(note.id) {
            ids.remove(note.id)
        } else {
            ids.insert(note.id)
        }
        pinnedIds = ids
    }

    private var pinnedIds: Set<String> {
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

// MARK: - Folder Menu

extension NotesView {
    private var folderMenu: some View {
        Menu {
            Picker("Folder", selection: $selectedFolderId) {
                Text("All Notes")
                    .tag(String?.none)

                if !notesService.folders.isEmpty {
                    Divider()

                    ForEach(notesService.folders) { folder in
                        Text(folderMenuTitle(for: folder))
                            .tag(Optional<String>.some(folder.id))
                    }
                }
            }

            Divider()

            Button("New Folder") {
                newFolderName = ""
                showingNewFolder = true
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

    private func folderMenuTitle(for folder: MapFolder) -> String {
        if let count = folder.notesCount {
            return "\(folder.name) (\(count))"
        }
        return folder.name
    }

    private func createFolder() {
        let trimmed = newFolderName.trimmed
        guard !trimmed.isEmpty else { return }

        Task {
            do {
                let folder = try await notesService.createFolder(name: trimmed)
                await MainActor.run {
                    selectedFolderId = folder.id
                    newFolderName = ""
                }
            } catch {
                await MainActor.run { newFolderName = "" }
            }
        }
    }
}

// MARK: - Sort Menu

extension NotesView {
    private var sortMenu: some View {
        Menu {
            Picker("Sort", selection: $sortOrder) {
                Text("Last Edited").tag(SortOrder.lastEdited)
                Text("Date Created").tag(SortOrder.dateCreated)
            }
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
        let count = visibleNotes.count
        return count == 1 ? "1 Note" : "\(count) Notes"
    }
}

// MARK: - Note Row

private struct NoteRow: View {
    let note: MapNote
    let folderName: String?
    let showFolder: Bool
    let isPinned: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Text(noteTitle)
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                if isPinned {
                    Image(systemName: "pin.fill")
                        .font(.caption2)
                        .foregroundStyle(.yellow)
                }

                Spacer(minLength: 0)
            }

            if !previewText.isEmpty {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(noteDate)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if let previewAttributed {
                        Text(previewAttributed)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    } else {
                        Text(previewText)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }
            } else {
                Text(noteDate)
                    .font(.caption)
                    .foregroundStyle(.secondary)
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
        if !title.isEmpty { return title }
        let contentLine = note.content?
            .split(whereSeparator: \.isNewline)
            .map { String($0).trimmed }
            .first(where: { !$0.isEmpty })
        return contentLine ?? "Untitled"
    }

    private var previewText: String {
        let content = note.content?.trimmed ?? ""
        return content.replacingOccurrences(of: "\n", with: " ")
    }

    private var previewAttributed: AttributedString? {
        guard !previewText.isEmpty else { return nil }
        return try? AttributedString(markdown: previewText)
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
    @State private var editorMode: EditorMode = .edit

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

                Picker("Mode", selection: $editorMode) {
                    Text("Edit").tag(EditorMode.edit)
                    Text("Preview").tag(EditorMode.preview)
                }
                .pickerStyle(.segmented)

                if note != nil {
                    Text(lastEditedLabel)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                TextField("Title", text: $title, axis: .vertical)
                    .font(.title3.weight(.semibold))
                    .focused($focusedField, equals: .title)
                    .lineLimit(1...3)

                if editorMode == .edit {
                    editorToolbar
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
                } else {
                    markdownPreview
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
                    .disabled(isSaving || !hasChanges || (title.trimmed.isEmpty && content.trimmed.isEmpty))
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
        let trimmedContent = content.trimmed
        guard !(trimmedTitle.isEmpty && trimmedContent.isEmpty) else { return }

        isSaving = true
        let resolvedTitle = trimmedTitle.isEmpty ? (firstContentLine(from: trimmedContent) ?? "Untitled") : trimmedTitle
        let contentValue = trimmedContent.isEmpty ? nil : trimmedContent

        Task {
            do {
                if let note {
                    _ = try await notesService.updateNote(
                        note,
                        title: resolvedTitle,
                        content: contentValue,
                        folderId: selectedFolderId == originalFolderId ? nil : selectedFolderId
                    )
                } else {
                    _ = try await notesService.createNote(
                        title: resolvedTitle,
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

    private func firstContentLine(from content: String) -> String? {
        content
            .split(whereSeparator: \.isNewline)
            .map { String($0).trimmed }
            .first(where: { !$0.isEmpty })
    }

    private var editorToolbar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                MarkdownChip(title: "H1") { insertSnippet("# ") }
                MarkdownChip(title: "H2") { insertSnippet("## ") }
                MarkdownChip(title: "Bold") { insertSnippet("**bold**") }
                MarkdownChip(title: "Italic") { insertSnippet("*italic*") }
                MarkdownChip(title: "List") { insertSnippet("- ") }
                MarkdownChip(title: "Checklist") { insertSnippet("- [ ] ") }
                MarkdownChip(title: "Quote") { insertSnippet("> ") }
                MarkdownChip(title: "Code") { insertSnippet("`code`") }
                MarkdownChip(title: "Block") { insertSnippet("```\ncode\n```") }
            }
            .padding(.vertical, 4)
        }
    }

    private var lastEditedLabel: String {
        guard let note else { return "" }
        let date = note.updatedAt ?? note.createdAt
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return "Last edited \(formatter.string(from: date))"
    }

    private var markdownPreview: some View {
        let previewText = content.trimmed.isEmpty ? "Nothing to preview yet." : content
        let attributed = try? AttributedString(markdown: previewText)
        return VStack(alignment: .leading, spacing: 8) {
            if let attributed {
                Text(attributed)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                Text(previewText)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .font(.body)
        .foregroundStyle(.primary)
        .padding(12)
        .frame(maxWidth: .infinity, minHeight: 240, alignment: .topLeading)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func insertSnippet(_ snippet: String) {
        let trimmed = content.trimmed
        if trimmed.isEmpty {
            content = snippet
        } else if content.hasSuffix("\n") {
            content += snippet
        } else {
            content += "\n" + snippet
        }
        focusedField = .content
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

private enum EditorMode {
    case edit
    case preview
}

private enum NoteFilter: CaseIterable {
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

private enum SearchScope: CaseIterable {
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

private extension NotesView {
    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(NoteFilter.allCases, id: \.self) { filter in
                    Button {
                        noteFilter = filter
                    } label: {
                        Text(filter.title)
                            .font(.subheadline.weight(.semibold))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(noteFilter == filter ? Color.yellow.opacity(0.25) : Color(.secondarySystemGroupedBackground))
                            .foregroundStyle(noteFilter == filter ? .primary : .secondary)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
        .background(Color(.systemGroupedBackground))
    }

    private func applyFilter(_ notes: [MapNote]) -> [MapNote] {
        switch noteFilter {
        case .all:
            return notes
        case .pinned:
            return notes.filter { pinnedIds.contains($0.id) }
        case .recent:
            let cutoff = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
            return notes.filter { ($0.updatedAt ?? $0.createdAt) >= cutoff }
        }
    }
}

private struct MarkdownChip: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}
