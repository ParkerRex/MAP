import MapHealthCore
import SwiftUI

extension NotesView {
    var folderMenu: some View {
        Menu {
            Picker("Folder", selection: $selectedFolderId) {
                Text("All Notes")
                    .tag(String?.none)

                if !notesService.folders.isEmpty {
                    Divider()

                    ForEach(notesService.folders) { folder in
                        Text(folderMenuTitle(for: folder))
                            .tag(String?.some(folder.id))
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

    func createFolder() {
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

    var sortMenu: some View {
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

    var bottomBar: some View {
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

    var noteCountLabel: String {
        let count = visibleNotes.count
        return count == 1 ? "1 Note" : "\(count) Notes"
    }
}
