import MapHealthCore
import SwiftUI

struct ProjectsListView: View {
    @ObservedObject var tasksService: TasksService
    @Binding var showingCreateProject: Bool

    @State private var renamingTag: TaskTag?
    @State private var renameTitle = ""
    @State private var deletingTag: TaskTag?

    var body: some View {
        Section {
            newProjectRow

            if tags.isEmpty {
                emptyState
            } else {
                ForEach(tags) { tag in
                    ProjectRow(
                        title: tag.title,
                        count: taskCount(for: tag),
                        tint: ProjectStyling.tint(for: tag.id)
                    )
                    .swipeActions(edge: .leading, allowsFullSwipe: false) {
                        Button("Rename") {
                            renameTitle = tag.title
                            renamingTag = tag
                        }
                        .tint(.blue)
                    }
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        Button(role: .destructive) {
                            deletingTag = tag
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    }
                }
            }
        }
        .alert("Rename Project", isPresented: Binding(
            get: { renamingTag != nil },
            set: { if !$0 { renamingTag = nil } }
        )) {
            TextField("Name", text: $renameTitle)
            Button("Save") { renameProject() }
            Button("Cancel", role: .cancel) {}
        }
        .alert("Delete Project?", isPresented: Binding(
            get: { deletingTag != nil },
            set: { if !$0 { deletingTag = nil } }
        )) {
            Button("Delete", role: .destructive) { deleteProject() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Tasks in this project will not be deleted.")
        }
        .task {
            if tasksService.tags.isEmpty {
                await tasksService.fetchTags()
            }
        }
    }

    private var tags: [TaskTag] {
        tasksService.tags.sorted { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }
    }

    private func taskCount(for tag: TaskTag) -> Int {
        tasksService.tasks.filter { task in
            task.tags.contains { $0.id == tag.id }
        }.count
    }

    private var newProjectRow: some View {
        Button {
            showingCreateProject = true
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "plus.circle.fill")
                    .foregroundStyle(.accent)
                Text("New Project")
                    .font(.body.weight(.medium))
                Spacer()
            }
            .padding(.vertical, 6)
        }
        .buttonStyle(.plain)
        .listRowInsets(EdgeInsets(top: 10, leading: 16, bottom: 10, trailing: 16))
        .listRowSeparator(.hidden)
        .listRowBackground(Color(.secondarySystemGroupedBackground))
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: "folder")
                .font(.system(size: 36, weight: .light))
                .foregroundStyle(.secondary)
            Text("No projects yet")
                .font(.headline)
            Text("Create a project to group tasks.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
    }

    private func renameProject() {
        guard let tag = renamingTag else { return }
        let trimmed = renameTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        Task {
            try? await tasksService.updateTag(tag, title: trimmed)
            await MainActor.run { renamingTag = nil }
        }
    }

    private func deleteProject() {
        guard let tag = deletingTag else { return }
        Task {
            try? await tasksService.deleteTag(tag)
            await MainActor.run { deletingTag = nil }
        }
    }
}

private struct ProjectRow: View {
    let title: String
    let count: Int
    let tint: Color

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(tint)
                .frame(width: 10, height: 10)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.body.weight(.medium))
                Text("\(count) tasks")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(.vertical, 6)
        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
        .listRowSeparator(.hidden)
        .listRowBackground(Color(.secondarySystemGroupedBackground))
    }
}
