import MapHealthCore
import SwiftUI

struct TodosView: View {
    @StateObject private var tasksService = TasksService.shared
    @State private var showingAddSheet = false
    @State private var newTaskTitle = ""
    @State private var isCreating = false

    var body: some View {
        NavigationStack {
            todosContent
                .navigationTitle("Tasks")
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        addButton
                    }
                }
                .refreshable {
                    await tasksService.refresh()
                }
                .task {
                    if tasksService.tasks.isEmpty {
                        await tasksService.fetchTasks()
                    }
                }
                .sheet(isPresented: $showingAddSheet) {
                    addTaskSheet
                }
        }
    }

    @ViewBuilder
    private var todosContent: some View {
        if #available(iOS 26, *) {
            ScrollView {
                todosBody
            }
            .contentMargins(.horizontal, 20, for: .scrollContent)
            .contentMargins(.vertical, 16, for: .scrollContent)
        } else {
            ScrollView {
                todosBody
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
            }
        }
    }

    private var todosBody: some View {
        LazyVStack(spacing: 12) {
            if tasksService.isLoading && tasksService.tasks.isEmpty {
                loadingState
            } else if tasksService.tasks.isEmpty {
                emptyState
            } else {
                // Pending tasks first
                ForEach(tasksService.pendingTasks) { task in
                    todoRow(task)
                }

                // Completed tasks section
                if !tasksService.completedTasks.isEmpty {
                    completedSection
                }
            }
        }
    }

    private var loadingState: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            Text("Loading tasks...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .accentColor.opacity(0.04))
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "checklist")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No tasks yet")
                .font(.headline)
            Text("Tap + to add your first task")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .accentColor.opacity(0.04))
    }

    private var completedSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Completed")
                .font(.headline)
                .foregroundStyle(.secondary)
                .padding(.top, 8)

            ForEach(tasksService.completedTasks) { task in
                todoRow(task)
            }
        }
    }

    private func todoRow(_ task: MapTask) -> some View {
        HStack(spacing: 12) {
            Button {
                Task {
                    try? await tasksService.toggleTask(task)
                }
            } label: {
                Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(task.isCompleted ? .green : .secondary)
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 4) {
                Text(task.title)
                    .strikethrough(task.isCompleted)
                    .foregroundStyle(task.isCompleted ? .secondary : .primary)

                if let dueAt = task.dueAt {
                    dueDateLabel(dueAt, isCompleted: task.isCompleted)
                }

                if !task.tags.isEmpty {
                    tagsRow(task.tags)
                }
            }

            Spacer()

            deleteButton(task)
        }
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .accentColor.opacity(0.04))
        .animation(.easeInOut(duration: 0.2), value: task.isCompleted)
    }

    private func dueDateLabel(_ date: Date, isCompleted: Bool) -> some View {
        HStack(spacing: 4) {
            Image(systemName: "calendar")
                .font(.caption2)
            Text(date, style: .date)
                .font(.caption)
        }
        .foregroundStyle(dueDateColor(date, isCompleted: isCompleted))
    }

    private func dueDateColor(_ date: Date, isCompleted: Bool) -> Color {
        if isCompleted { return .secondary }

        let now = Date()
        if date < now {
            return .red
        } else if Calendar.current.isDateInToday(date) {
            return .orange
        } else {
            return .secondary
        }
    }

    private func tagsRow(_ tags: [TaskTag]) -> some View {
        HStack(spacing: 4) {
            ForEach(tags.prefix(3)) { tag in
                Text(tag.title)
                    .font(.caption2)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(.secondary.opacity(0.2))
                    .clipShape(Capsule())
            }

            if tags.count > 3 {
                Text("+\(tags.count - 3)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func deleteButton(_ task: MapTask) -> some View {
        Button(role: .destructive) {
            Task {
                try? await tasksService.deleteTask(task)
            }
        } label: {
            Image(systemName: "trash")
                .font(.subheadline)
                .foregroundStyle(.red.opacity(0.7))
        }
        .buttonStyle(.plain)
    }

    private var addButton: some View {
        Button {
            showingAddSheet = true
        } label: {
            Image(systemName: "plus")
        }
        .mapHealthGlassButtonStyle()
    }

    // MARK: - Add Task Sheet

    private var addTaskSheet: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Task title", text: $newTaskTitle)
                        .textInputAutocapitalization(.sentences)
                }
            }
            .navigationTitle("New Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        showingAddSheet = false
                        newTaskTitle = ""
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        createTask()
                    }
                    .disabled(newTaskTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isCreating)
                }
            }
        }
        .presentationDetents([.medium])
    }

    private func createTask() {
        let title = newTaskTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !title.isEmpty else { return }

        isCreating = true

        Task {
            do {
                try await tasksService.createTask(title: title)
                await MainActor.run {
                    showingAddSheet = false
                    newTaskTitle = ""
                    isCreating = false
                }
            } catch {
                await MainActor.run {
                    isCreating = false
                }
            }
        }
    }
}

#Preview {
    TodosView()
}
