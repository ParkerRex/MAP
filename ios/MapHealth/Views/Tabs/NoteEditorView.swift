import MapHealthCore
import SwiftUI

struct NoteEditorView: View {
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
