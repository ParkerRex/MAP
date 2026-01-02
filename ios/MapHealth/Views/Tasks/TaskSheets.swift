import MapHealthCore
import SwiftUI

// MARK: - Add Task Sheet

struct AddTaskSheet: View {
    @ObservedObject var tasksService: TasksService
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var notes = ""
    @State private var dueDate: Date?
    @State private var showingDatePicker = false
    @State private var isCreating = false
    @FocusState private var titleFocused: Bool

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("What do you need to do?", text: $title, axis: .vertical)
                        .lineLimit(1...3)
                        .focused($titleFocused)
                }

                Section {
                    TextField("Notes (optional)", text: $notes, axis: .vertical)
                        .lineLimit(1...5)
                }

                Section("When") {
                    quickDateOptions
                    datePickerButton

                    if showingDatePicker {
                        datePicker
                    }
                }
            }
            .navigationTitle("New Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") { createTask() }
                        .fontWeight(.semibold)
                        .disabled(title.trimmed.isEmpty || isCreating)
                }
                ToolbarItem(placement: .keyboard) {
                    HStack {
                        Spacer()
                        Button("Add Task") { createTask() }
                            .fontWeight(.semibold)
                            .disabled(title.trimmed.isEmpty || isCreating)
                    }
                }
            }
            .onAppear {
                titleFocused = true
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private var quickDateOptions: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                QuickDateChip(
                    title: "Today",
                    icon: "sun.max.fill",
                    isSelected: dueDate.map { Calendar.current.isDateInToday($0) } == true
                ) {
                    dueDate = Calendar.current.startOfDay(for: Date())
                    HapticFeedback.selection()
                }

                QuickDateChip(
                    title: "Tomorrow",
                    icon: "sunrise.fill",
                    isSelected: dueDate.map { Calendar.current.isDateInTomorrow($0) } == true
                ) {
                    dueDate = Calendar.current.date(
                        byAdding: .day,
                        value: 1,
                        to: Calendar.current.startOfDay(for: Date())
                    )
                    HapticFeedback.selection()
                }

                QuickDateChip(
                    title: "Weekend",
                    icon: "figure.walk",
                    isSelected: false
                ) {
                    dueDate = DateHelpers.nextWeekend()
                    HapticFeedback.selection()
                }

                QuickDateChip(
                    title: "Next Week",
                    icon: "calendar.badge.clock",
                    isSelected: false
                ) {
                    dueDate = DateHelpers.nextMonday()
                    HapticFeedback.selection()
                }
            }
        }
        .listRowInsets(EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0))
    }

    private var datePickerButton: some View {
        Button {
            showingDatePicker.toggle()
        } label: {
            HStack {
                Label("Pick a Date", systemImage: "calendar")
                Spacer()
                if let date = dueDate {
                    Text(date, style: .date)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .foregroundStyle(.primary)
    }

    @ViewBuilder
    private var datePicker: some View {
        DatePicker(
            "Due Date",
            selection: Binding(
                get: { dueDate ?? Date() },
                set: { dueDate = $0 }
            ),
            displayedComponents: [.date]
        )
        .datePickerStyle(.graphical)

        if dueDate != nil {
            Button("Clear Due Date", role: .destructive) {
                dueDate = nil
                showingDatePicker = false
            }
        }
    }

    private func createTask() {
        guard !title.trimmed.isEmpty else { return }

        isCreating = true
        HapticFeedback.success()

        Task {
            do {
                try await tasksService.createTask(
                    title: title.trimmed,
                    body: notes.trimmed.isEmpty ? nil : notes.trimmed,
                    dueAt: dueDate
                )
                await MainActor.run { dismiss() }
            } catch {
                HapticFeedback.error()
                await MainActor.run { isCreating = false }
            }
        }
    }
}

// MARK: - Edit Task Sheet

struct EditTaskSheet: View {
    let task: MapTask
    @ObservedObject var tasksService: TasksService
    @Environment(\.dismiss) private var dismiss

    @State private var title: String
    @State private var notes: String
    @State private var dueDate: Date?
    @State private var showingDatePicker = false
    @State private var isSaving = false
    @State private var showingDeleteConfirmation = false

    init(task: MapTask, tasksService: TasksService) {
        self.task = task
        self.tasksService = tasksService
        _title = State(initialValue: task.title)
        _notes = State(initialValue: task.body ?? "")
        _dueDate = State(initialValue: task.dueAt)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Task title", text: $title, axis: .vertical)
                        .lineLimit(1...3)
                }

                Section {
                    TextField("Notes", text: $notes, axis: .vertical)
                        .lineLimit(1...8)
                }

                Section("When") {
                    quickDateOptions
                    datePickerButton

                    if showingDatePicker {
                        datePicker
                    }
                }

                Section {
                    Button {
                        HapticFeedback.success()
                        Task { try? await tasksService.toggleTask(task) }
                        dismiss()
                    } label: {
                        Label(
                            task.isCompleted ? "Mark as Incomplete" : "Mark as Complete",
                            systemImage: task.isCompleted ? "circle" : "checkmark.circle.fill"
                        )
                    }
                }

                Section {
                    Button(role: .destructive) {
                        showingDeleteConfirmation = true
                    } label: {
                        Label("Delete Task", systemImage: "trash")
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("Edit Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { saveTask() }
                        .fontWeight(.semibold)
                        .disabled(title.trimmed.isEmpty || isSaving)
                }
            }
            .confirmationDialog(
                "Delete Task?",
                isPresented: $showingDeleteConfirmation,
                titleVisibility: .visible
            ) {
                Button("Delete", role: .destructive) {
                    HapticFeedback.warning()
                    Task {
                        try? await tasksService.deleteTask(task)
                        await MainActor.run { dismiss() }
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This action cannot be undone.")
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private var quickDateOptions: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                QuickDateChip(
                    title: "Today",
                    icon: "sun.max.fill",
                    isSelected: dueDate.map { Calendar.current.isDateInToday($0) } == true
                ) {
                    dueDate = Calendar.current.startOfDay(for: Date())
                    HapticFeedback.selection()
                }

                QuickDateChip(
                    title: "Tomorrow",
                    icon: "sunrise.fill",
                    isSelected: dueDate.map { Calendar.current.isDateInTomorrow($0) } == true
                ) {
                    dueDate = Calendar.current.date(
                        byAdding: .day,
                        value: 1,
                        to: Calendar.current.startOfDay(for: Date())
                    )
                    HapticFeedback.selection()
                }

                QuickDateChip(
                    title: "Weekend",
                    icon: "figure.walk",
                    isSelected: false
                ) {
                    dueDate = DateHelpers.nextWeekend()
                    HapticFeedback.selection()
                }

                QuickDateChip(
                    title: "Next Week",
                    icon: "calendar.badge.clock",
                    isSelected: false
                ) {
                    dueDate = DateHelpers.nextMonday()
                    HapticFeedback.selection()
                }

                if dueDate != nil {
                    Button {
                        dueDate = nil
                        HapticFeedback.selection()
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 4)
                    }
                }
            }
        }
        .listRowInsets(EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0))
    }

    private var datePickerButton: some View {
        Button {
            showingDatePicker.toggle()
        } label: {
            HStack {
                Label("Pick a Date", systemImage: "calendar")
                Spacer()
                if let date = dueDate {
                    Text(date, style: .date)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .foregroundStyle(.primary)
    }

    @ViewBuilder
    private var datePicker: some View {
        DatePicker(
            "Due Date",
            selection: Binding(
                get: { dueDate ?? Date() },
                set: { dueDate = $0 }
            ),
            displayedComponents: [.date]
        )
        .datePickerStyle(.graphical)
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
                    dueAt: dueDate
                )
                await MainActor.run { dismiss() }
            } catch {
                HapticFeedback.error()
                await MainActor.run { isSaving = false }
            }
        }
    }
}

// MARK: - String Extension

private extension String {
    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
