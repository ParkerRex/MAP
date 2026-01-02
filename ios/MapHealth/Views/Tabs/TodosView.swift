import MapHealthCore
import SwiftUI

struct TodosView: View {
    @State private var todos: [TodoItem] = []

    var body: some View {
        NavigationStack {
            todosContent
                .navigationTitle("Tasks")
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        addButton
                    }
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
            if todos.isEmpty {
                emptyState
            } else {
                ForEach(todos) { todo in
                    todoRow(todo)
                }
            }
        }
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

    private func todoRow(_ todo: TodoItem) -> some View {
        HStack(spacing: 12) {
            Button {
                // Toggle completion
            } label: {
                Image(systemName: todo.isCompleted ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(todo.isCompleted ? .green : .secondary)
            }

            Text(todo.title)
                .strikethrough(todo.isCompleted)
                .foregroundStyle(todo.isCompleted ? .secondary : .primary)

            Spacer()
        }
        .padding(16)
        .mapHealthGlassSurface(cornerRadius: 16, tint: .accentColor.opacity(0.04))
    }

    private var addButton: some View {
        Button {
            // Add new todo
        } label: {
            Image(systemName: "plus")
        }
        .mapHealthGlassButtonStyle()
    }
}

struct TodoItem: Identifiable {
    let id = UUID()
    var title: String
    var isCompleted: Bool = false
}
