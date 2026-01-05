import MapHealthCore
import SwiftUI

struct NotesView: View {
    @StateObject var notesService = NotesService.shared
    @State var searchText = ""
    @State var selectedFolderId: String?
    @State var showingNewNote = false
    @State var sortOrder: SortOrder = .lastEdited
    @State var showingNewFolder = false
    @State var newFolderName = ""
    @AppStorage("notes.pinnedIds") var pinnedIdsStorage = ""
    @State var noteFilter: NoteFilter = .all
    @State var searchScope: SearchScope = .all
}
