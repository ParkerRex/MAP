import MapHealthCore
import SwiftUI

extension NotesView {
    var filterBar: some View {
        HStack {
            Picker("Filter", selection: $noteFilter) {
                ForEach(NoteFilter.allCases, id: \.self) { filter in
                    Text(filter.title).tag(filter)
                }
            }
            .pickerStyle(.segmented)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color(.systemGroupedBackground))
    }

    func applyFilter(_ notes: [MapNote]) -> [MapNote] {
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
