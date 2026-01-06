import MapHealthCore
import SwiftUI

struct NoteEditorView: View {
    @ObservedObject var notesService: NotesService

    @Environment(\.dismiss) private var dismiss
    @FocusState private var focusedField: Field?

    @State private var title: String
    @State private var content: String
    @State private var selectedFolderId: String
    @State private var isSaving = false
    @State private var currentNote: MapNote?
    @State private var saveTask: Task<Void, Never>?
    @State private var showingDeleteConfirmation = false
    @State private var editorMode: EditorMode = .edit

    enum Field {
        case title
        case content
    }

    init(note: MapNote?, notesService: NotesService, initialFolderId: String) {
        self.notesService = notesService
        _title = State(initialValue: note?.title ?? "")
        _content = State(initialValue: note?.content ?? "")
        _selectedFolderId = State(initialValue: note?.folderId ?? initialFolderId)
        _currentNote = State(initialValue: note)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                folderPicker
                if isSaving {
                    Text("Saving...")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else if currentNote != nil {
                    Text(lastEditedLabel)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

        TextField("Title", text: $title, axis: .vertical)
            .font(.title2.weight(.semibold))
            .focused($focusedField, equals: .title)
            .lineLimit(1...3)
            .disabled(editorMode == .preview)

                if editorMode == .edit {
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
        .navigationTitle(currentNote == nil ? "New Note" : "Note")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .keyboard) {
                HStack {
                    if editorMode == .edit {
                        editorToolbar
                    }
                    Spacer()
                    Button("Done") { focusedField = nil }
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button(editorMode == .preview ? "Edit" : "Preview") {
                    editorMode = editorMode == .preview ? .edit : .preview
                }
            }
            if currentNote != nil {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(role: .destructive) {
                        showingDeleteConfirmation = true
                    } label: {
                        Image(systemName: "trash")
                    }
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
            if currentNote == nil {
                focusedField = .title
                createDraftNoteIfNeeded()
            }
        }
        .onChange(of: title) { _ in
            scheduleAutoSave()
        }
        .onChange(of: content) { _ in
            scheduleAutoSave()
        }
        .onChange(of: selectedFolderId) { _ in
            scheduleAutoSave()
        }
        .onDisappear {
            saveTask?.cancel()
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

    private func createDraftNoteIfNeeded() {
        guard currentNote == nil, !isSaving else { return }
        isSaving = true
        Task {
            do {
                let draft = try await notesService.createNote(
                    title: "Untitled Note",
                    content: nil,
                    folderId: selectedFolderId
                )
                await MainActor.run {
                    currentNote = draft
                    isSaving = false
                    if !title.trimmed.isEmpty || !content.trimmed.isEmpty {
                        scheduleAutoSave()
                    }
                }
            } catch {
                await MainActor.run { isSaving = false }
            }
        }
    }

    private func scheduleAutoSave() {
        guard currentNote != nil else { return }
        saveTask?.cancel()
        saveTask = Task { @MainActor in
            try? await Task.sleep(nanoseconds: 500_000_000)
            await saveChangesIfNeeded()
        }
    }

    private func saveChangesIfNeeded() async {
        guard let note = currentNote else { return }
        let trimmedTitle = title.trimmed
        let trimmedContent = content.trimmed
        let resolvedTitle = trimmedTitle.isEmpty ? (firstContentLine(from: trimmedContent) ?? "Untitled") : trimmedTitle
        let contentValue = trimmedContent.isEmpty ? nil : trimmedContent

        if resolvedTitle == (note.title ?? "") &&
            contentValue == note.content &&
            selectedFolderId == note.folderId {
            return
        }

        isSaving = true
        do {
            let updated = try await notesService.updateNote(
                note,
                title: resolvedTitle,
                content: contentValue,
                folderId: selectedFolderId == note.folderId ? nil : selectedFolderId
            )
            await MainActor.run {
                currentNote = updated
                if title.trimmed.isEmpty {
                    title = resolvedTitle
                }
                isSaving = false
            }
        } catch {
            await MainActor.run { isSaving = false }
        }
    }

    private func deleteNote() {
        guard let note = currentNote else { return }
        Task {
            _ = try? await notesService.deleteNote(note)
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
        guard let note = currentNote else { return "" }
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
