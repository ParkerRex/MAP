import MapHealthCore
import SwiftUI

// MARK: - Task Detail Sheet

struct TaskDetailSheet: View {
    let task: MapTask
    @ObservedObject var tasksService: TasksService
    @Environment(\.dismiss) private var dismiss

    @State private var title: String
    @State private var notes: String
    @State private var dueDate: Date?
    @State private var selectedTagId: String?
    @State private var isSaving = false
    @State private var showingDeleteConfirmation = false
    @FocusState private var focusedField: Field?

    enum Field {
        case title, notes
    }

    init(task: MapTask, tasksService: TasksService) {
        self.task = task
        self.tasksService = tasksService
        _title = State(initialValue: task.title)
        _notes = State(initialValue: task.body ?? "")
        _dueDate = State(initialValue: task.dueAt)
        _selectedTagId = State(initialValue: task.tags.first?.id)
    }

    private var hasChanges: Bool {
        title.trimmed != task.title ||
        notes.trimmed != (task.body ?? "") ||
        dueDate != task.dueAt ||
        selectedTagId != task.tags.first?.id
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Title + Notes
                    VStack(spacing: 16) {
                        TextField("Task name", text: $title, axis: .vertical)
                            .font(.title3.weight(.medium))
                            .focused($focusedField, equals: .title)
                            .lineLimit(1...4)

                        TextField("Add notes...", text: $notes, axis: .vertical)
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .focused($focusedField, equals: .notes)
                            .lineLimit(1...8)
                    }
                    .padding(16)
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                    // Due Date
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Due Date")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)

                        quickDatePicker
                    }

                    // Project
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Project")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)

                        projectPicker
                    }

                    // Actions
                    VStack(spacing: 12) {
                        completeButton
                        deleteButton
                    }
                    .padding(.top, 8)
                }
                .padding(20)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { saveTask() }
                        .fontWeight(.semibold)
                        .disabled(title.trimmed.isEmpty || isSaving || !hasChanges)
                }
                ToolbarItem(placement: .keyboard) {
                    HStack {
                        Spacer()
                        Button("Done") { focusedField = nil }
                    }
                }
            }
            .confirmationDialog(
                "Delete Task?",
                isPresented: $showingDeleteConfirmation,
                titleVisibility: .visible
            ) {
                Button("Delete", role: .destructive) {
                    deleteTask()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This action cannot be undone.")
            }
        }
        .task {
            if tasksService.tags.isEmpty {
                await tasksService.fetchTags()
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }

    private var quickDatePicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                DateChip(
                    label: "Today",
                    icon: "sun.max.fill",
                    isSelected: dueDate.map { Calendar.current.isDateInToday($0) } ?? false
                ) {
                    dueDate = Calendar.current.startOfDay(for: Date())
                }

                DateChip(
                    label: "Tomorrow",
                    icon: "sunrise.fill",
                    isSelected: dueDate.map { Calendar.current.isDateInTomorrow($0) } ?? false
                ) {
                    let tomorrow = Calendar.current.date(
                        byAdding: .day, value: 1, to: Calendar.current.startOfDay(for: Date())
                    )
                    dueDate = tomorrow
                }

                DateChip(
                    label: "Next Week",
                    icon: "calendar",
                    isSelected: false
                ) {
                    dueDate = DateHelpers.nextMonday()
                }

                if dueDate != nil {
                    Button {
                        withAnimation(.easeOut(duration: 0.15)) {
                            dueDate = nil
                        }
                        HapticFeedback.light()
                    } label: {
                        Label("Clear", systemImage: "xmark.circle.fill")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color(.tertiarySystemGroupedBackground))
                            .clipShape(Capsule())
                    }
                }
            }
        }
        .scrollClipDisabled()
    }

    private var projectPicker: some View {
        let tags = tasksService.tags.sorted { $0.title.localizedCaseInsensitiveCompare($1.title) == .orderedAscending }

        return ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ProjectSelectionChip(
                    title: "No Project",
                    tint: nil,
                    isSelected: selectedTagId == nil
                ) {
                    selectedTagId = nil
                }

                ForEach(tags) { tag in
                    ProjectSelectionChip(
                        title: tag.title,
                        tint: ProjectStyling.tint(for: tag.id),
                        isSelected: selectedTagId == tag.id
                    ) {
                        selectedTagId = tag.id
                    }
                }
            }
        }
        .scrollClipDisabled()
    }

    private var completeButton: some View {
        Button {
            HapticFeedback.success()
            Task {
                try? await tasksService.toggleTask(task)
                dismiss()
            }
        } label: {
            Label(
                task.isCompleted ? "Mark Incomplete" : "Mark Complete",
                systemImage: task.isCompleted ? "circle" : "checkmark.circle.fill"
            )
            .font(.body.weight(.medium))
            .foregroundStyle(task.isCompleted ? Color.primary : Color.green)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Color(.secondarySystemGroupedBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private var deleteButton: some View {
        Button(role: .destructive) {
            showingDeleteConfirmation = true
        } label: {
            Label("Delete Task", systemImage: "trash")
                .font(.body.weight(.medium))
                .foregroundStyle(.red)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private func saveTask() {
        guard !title.trimmed.isEmpty else { return }

        isSaving = true
        HapticFeedback.success()

        Task {
            do {
                try await tasksService.updateTask(
                    task,
                    title: title.trimmed,
                    body: notes.trimmed.isEmpty ? nil : notes.trimmed,
                    dueAt: dueDate,
                    tags: selectedTagId.map { [$0] } ?? []
                )
                await MainActor.run { dismiss() }
            } catch {
                HapticFeedback.error()
                await MainActor.run { isSaving = false }
            }
        }
    }

    private func deleteTask() {
        HapticFeedback.warning()
        Task {
            try? await tasksService.deleteTask(task)
            await MainActor.run { dismiss() }
        }
    }
}

// MARK: - Date Chip

private struct DateChip: View {
    let label: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button {
            action()
            HapticFeedback.selection()
        } label: {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.caption.weight(.medium))
                Text(label)
                    .font(.subheadline.weight(.medium))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? Color.accentColor : Color(.tertiarySystemGroupedBackground))
            .foregroundStyle(isSelected ? .white : .primary)
            .clipShape(Capsule())
        }
        .animation(.easeOut(duration: 0.15), value: isSelected)
    }
}

// MARK: - Project Chip

private struct ProjectSelectionChip: View {
    let title: String
    let tint: Color?
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                if let tint {
                    Circle()
                        .fill(tint)
                        .frame(width: 6, height: 6)
                }
                Text(title)
            }
            .font(.subheadline.weight(.semibold))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? Color.accentColor : Color(.tertiarySystemGroupedBackground))
            .foregroundStyle(isSelected ? .white : .primary)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - String Extension

private extension String {
    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
