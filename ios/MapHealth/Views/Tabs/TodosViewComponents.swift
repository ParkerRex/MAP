import MapHealthCore
import SwiftUI

// MARK: - Task Section View

struct TaskSectionView<Row: View>: View {
    let title: String
    let icon: String
    let color: Color
    let tasks: [MapTask]
    let rowBuilder: (MapTask) -> Row

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Text(title)
                    .fontWeight(.semibold)
                Text("(\(tasks.count))")
                    .foregroundStyle(.secondary)
            }
            .font(.subheadline)
            .padding(.horizontal, 4)

            ForEach(tasks) { task in
                rowBuilder(task)
            }
        }
    }
}

// MARK: - Completed Tasks Section

struct CompletedTasksSection<Row: View>: View {
    let tasks: [MapTask]
    let rowBuilder: (MapTask) -> Row

    var body: some View {
        DisclosureGroup {
            ForEach(tasks.prefix(10)) { task in
                rowBuilder(task)
            }
            if tasks.count > 10 {
                Text("+ \(tasks.count - 10) more")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
            }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
                Text("Completed")
                    .fontWeight(.semibold)
                Text("(\(tasks.count))")
                    .foregroundStyle(.secondary)
            }
            .font(.subheadline)
        }
        .tint(.secondary)
    }
}

// MARK: - State Views

struct TasksLoadingView: View {
    var body: some View {
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
}

struct TasksErrorView: View {
    let error: Error
    let onRetry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 40))
                .foregroundStyle(.orange)
            Text("Failed to load tasks")
                .font(.headline)
            Text(error.localizedDescription)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("Try Again", action: onRetry)
                .mapHealthGlassButtonStyle(prominent: true)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .orange.opacity(0.06))
    }
}

struct TasksEmptyView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 56))
                .foregroundStyle(.green)
            Text("All caught up!")
                .font(.title3)
                .fontWeight(.semibold)
            Text("Tap the + button to add a task")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .mapHealthGlassSurface(cornerRadius: 20, tint: .green.opacity(0.06))
    }
}
