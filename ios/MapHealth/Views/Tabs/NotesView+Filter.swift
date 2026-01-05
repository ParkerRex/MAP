import MapHealthCore
import SwiftUI

extension NotesView {
    var filterBar: some View {
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
                            .background(
                                noteFilter == filter
                                ? Color.yellow.opacity(0.25)
                                : Color(.secondarySystemGroupedBackground)
                            )
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
