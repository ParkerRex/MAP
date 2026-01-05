import MapHealthCore
import SwiftUI

struct NoteRow: View {
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
