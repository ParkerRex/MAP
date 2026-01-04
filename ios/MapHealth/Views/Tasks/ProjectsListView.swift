import MapHealthCore
import SwiftUI

struct ProjectsListView: View {
    @ObservedObject var tasksService: TasksService
    @Binding var showingCreateProject: Bool
    @Binding var searchText: String

    @State private var renamingTag: TaskTag?
    @State private var renameTitle = ""
    @State private var deletingTag: TaskTag?
    @AppStorage("tasks.projectFavorites") private var favoritesData = "[]"
    @AppStorage("tasks.projectOrder") private var orderData = "[]"

    var body: some View {
        Group {
            newProjectRow

            if filteredTags.isEmpty {
                if searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    emptyState
                } else {
                    searchEmptyState
                }
            } else {
                if !favoriteTags.isEmpty {
                    Section("Favorites") {
                        ForEach(favoriteTags) { tag in
                            projectRow(for: tag)
                        }
                        .onMove(perform: moveFavorites)
                    }
                }

                Section("Projects") {
                    ForEach(regularTags) { tag in
                        projectRow(for: tag)
                    }
                    .onMove(perform: moveProjects)
                }
            }
        }
        .onChange(of: tasksService.tags) { _, newValue in
            normalizeOrders(with: newValue)
        }
        .onChange(of: searchText) { _, _ in
            normalizeOrders(with: tasksService.tags)
        }
        .onAppear {
            normalizeOrders(with: tasksService.tags)
        }
    }

    private func projectRow(for tag: TaskTag) -> some View {
        ProjectRow(
            title: tag.title,
            count: taskCount(for: tag),
            tint: ProjectStyling.tint(for: tag.id),
            isFavorite: favoriteOrder.contains(tag.id),
            onToggleFavorite: { toggleFavorite(tag) }
        )
        .swipeActions(edge: .leading, allowsFullSwipe: false) {
            Button {
                toggleFavorite(tag)
            } label: {
                Label(
                    favoriteOrder.contains(tag.id) ? "Unpin" : "Pin",
                    systemImage: favoriteOrder.contains(tag.id) ? "pin.slash" : "pin"
                )
            }
            .tint(.yellow)

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

    private var favoriteOrder: [String] {
        get { decodeIds(from: favoritesData) }
        set { favoritesData = encodeIds(newValue) }
    }

    private var projectOrder: [String] {
        get { decodeIds(from: orderData) }
        set { orderData = encodeIds(newValue) }
    }

    private var filteredTags: [TaskTag] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return tasksService.tags }
        return tasksService.tags.filter { tag in
            tag.title.localizedCaseInsensitiveContains(query)
        }
    }

    private var tagById: [String: TaskTag] {
        Dictionary(uniqueKeysWithValues: filteredTags.map { ($0.id, $0) })
    }

    private var favoriteTags: [TaskTag] {
        favoriteOrder.compactMap { tagById[$0] }
    }

    private var regularTags: [TaskTag] {
        let favoriteIds = Set(favoriteOrder)
        var ordered = projectOrder.compactMap { tagById[$0] }.filter { !favoriteIds.contains($0.id) }
        let missing = filteredTags.filter { tag in
            !favoriteIds.contains(tag.id) && !projectOrder.contains(tag.id)
        }.sorted { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }
        ordered.append(contentsOf: missing)
        return ordered
    }

    private func toggleFavorite(_ tag: TaskTag) {
        var favorites = favoriteOrder
        var order = projectOrder
        if let index = favorites.firstIndex(of: tag.id) {
            favorites.remove(at: index)
            if !order.contains(tag.id) {
                order.insert(tag.id, at: 0)
            }
        } else {
            favorites.append(tag.id)
            order.removeAll { $0 == tag.id }
        }
        favoriteOrder = favorites
        projectOrder = order
    }

    private func moveFavorites(from source: IndexSet, to destination: Int) {
        var ids = favoriteTags.map(\.id)
        ids.move(fromOffsets: source, toOffset: destination)
        favoriteOrder = ids
    }

    private func moveProjects(from source: IndexSet, to destination: Int) {
        var ids = regularTags.map(\.id)
        ids.move(fromOffsets: source, toOffset: destination)
        projectOrder = ids
    }

    private func normalizeOrders(with tags: [TaskTag]) {
        let allIds = Set(tags.map(\.id))
        var favorites = favoriteOrder.filter { allIds.contains($0) }
        var order = projectOrder.filter { allIds.contains($0) && !favorites.contains($0) }

        let known = Set(favorites + order)
        let missing = tags.filter { !known.contains($0.id) }
            .sorted { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }
            .map(\.id)
        order.append(contentsOf: missing)

        if favorites != favoriteOrder {
            favoriteOrder = favorites
        }
        if order != projectOrder {
            projectOrder = order
        }
    }

    private func decodeIds(from value: String) -> [String] {
        guard let data = value.data(using: .utf8),
              let ids = try? JSONDecoder().decode([String].self, from: data) else {
            return []
        }
        return ids
    }

    private func encodeIds(_ ids: [String]) -> String {
        guard let data = try? JSONEncoder().encode(ids),
              let string = String(data: data, encoding: .utf8) else {
            return "[]"
        }
        return string
    }
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

    private var searchEmptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 32, weight: .light))
                .foregroundStyle(.secondary)
            Text("No matching projects")
                .font(.headline)
            Text("Try a different search term.")
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
    let isFavorite: Bool
    let onToggleFavorite: () -> Void

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
            Button(action: onToggleFavorite) {
                Image(systemName: isFavorite ? "star.fill" : "star")
                    .font(.subheadline)
                    .foregroundStyle(isFavorite ? .yellow : .secondary)
            }
            .buttonStyle(.borderless)
        }
        .padding(.vertical, 6)
        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
        .listRowSeparator(.hidden)
        .listRowBackground(Color(.secondarySystemGroupedBackground))
    }
}
