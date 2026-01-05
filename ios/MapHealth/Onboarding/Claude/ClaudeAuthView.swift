import Foundation
import MapHealthCore
import SwiftUI

struct ClaudeAuthView: View {
    @State private var isSaving = false
    @State private var showErrorAlert = false
    @State private var errorMessage = ""
    @State private var apiKey = ""
    let onContinue: () -> Void

    var body: some View {
        OnboardingScreen(
            title: "CLAUDE_AUTH_TITLE",
            subtitle: "CLAUDE_AUTH_SUBTITLE"
        ) {
            VStack(spacing: 16) {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 80))
                    .foregroundStyle(.purple)
                    .accessibilityHidden(true)

                SecureField("CLAUDE_API_KEY_PLACEHOLDER", text: $apiKey)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(true)
                    .textFieldStyle(.roundedBorder)
            }
            .padding(20)
            .mapHealthGlassSurface(cornerRadius: 24, tint: Color.accentColor.opacity(0.08))
        } footer: {
            Button {
                saveApiKey()
            } label: {
                if isSaving {
                    ProgressView()
                        .progressViewStyle(.circular)
                } else {
                    Text("CLAUDE_SAVE_API_KEY")
                }
            }
            .mapHealthGlassButtonStyle(prominent: true)
            .disabled(isSaving || apiKey.isEmpty)
            .accessibilityIdentifier("claudeAuthButton")
        }
        .alert("ERROR_ALERT_TITLE", isPresented: $showErrorAlert) {
            Button("ERROR_ALERT_CANCEL", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
    }

    private func saveApiKey() {
        isSaving = true
        Task {
            do {
                try await MapAPIClient.shared.setClaudeApiKey(apiKey)
                _ = await MainActor.run {
                    onContinue()
                }
            } catch {
                errorMessage = error.localizedDescription
                showErrorAlert = true
            }

            isSaving = false
        }
    }
}

// MARK: - Errors

enum ClaudeAuthError: Error, LocalizedError {
    case authFailed(String)
    case notConnected

    var errorDescription: String? {
        switch self {
        case .authFailed(let message):
            return String(
                format: String(localized: "CLAUDE_AUTH_FAILED_ERROR"),
                message
            )
        case .notConnected:
            return String(localized: "CLAUDE_NOT_CONNECTED_ERROR")
        }
    }
}

#if DEBUG
#Preview {
    ClaudeAuthView {}
}
#endif
