import MapHealthCore
import SwiftUI

// MARK: - State Views

struct TasksLoadingView: View {
    var body: some View {
        VStack(spacing: 16) {
            ForEach(0..<4, id: \.self) { _ in
                HStack(spacing: 14) {
                    Circle()
                        .fill(Color.secondary.opacity(0.15))
                        .frame(width: 26, height: 26)

                    VStack(alignment: .leading, spacing: 6) {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.secondary.opacity(0.15))
                            .frame(width: .random(in: 120...200), height: 14)

                        RoundedRectangle(cornerRadius: 3)
                            .fill(Color.secondary.opacity(0.1))
                            .frame(width: 80, height: 10)
                    }

                    Spacer()
                }
                .padding(.vertical, 12)
                .padding(.horizontal, 4)
            }
        }
        .shimmer()
        .padding(.top, 20)
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
                .buttonStyle(.borderedProminent)
                .controlSize(.small)
        }
        .frame(maxWidth: .infinity)
        .padding(32)
    }
}
