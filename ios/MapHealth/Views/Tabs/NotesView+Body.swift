import MapHealthCore
import SwiftUI

extension NotesView {
    var body: some View {
        NavigationStack {
            List {
                notesContent
            }
            .listStyle(.plain)
            .listSectionSpacing(12)
            .scrollContentBackground(.hidden)
            .scrollDismissesKeyboard(.interactively)
            .searchable(text: $searchText, prompt: "Search")
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
}
