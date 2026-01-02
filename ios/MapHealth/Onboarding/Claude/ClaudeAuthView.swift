import MapHealthCore
import SpeziOnboarding
import SpeziViews
import SwiftUI

struct ClaudeAuthView: View {
    @Environment(ManagedNavigationStack.Path.self) private var onboardingNavigationPath
    @State private var isSaving = false
    @State private var showErrorAlert = false
    @State private var errorMessage = ""
    @State private var apiKey = ""

    var body: some View {
        OnboardingView(
            content: {
                VStack(spacing: 24) {
                    Spacer()

                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 80))
                        .foregroundStyle(.purple)
                        .accessibilityHidden(true)

                    OnboardingTitleView(
                        title: "CLAUDE_AUTH_TITLE",
                        subtitle: "CLAUDE_AUTH_SUBTITLE"
                    )

                    Spacer()
                }
            },
            footer: {
                VStack(spacing: 16) {
                    SecureField("Enter Anthropic API key (sk-ant-...)", text: $apiKey)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                        .textFieldStyle(.roundedBorder)

                    Button {
                        saveApiKey()
                    } label: {
                        if isSaving {
                            ProgressView()
                                .progressViewStyle(.circular)
                        } else {
                            Text("Save API Key")
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(isSaving || apiKey.isEmpty)
                    .accessibilityIdentifier("claudeAuthButton")
                }
            }
        )
        .alert("Error", isPresented: $showErrorAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
    }

    private func saveApiKey() {
        isSaving = true
        Task {
            do {
                try await MapAPIClient.shared.setClaudeApiKey(apiKey)
                await MainActor.run {
                    onboardingNavigationPath.nextStep()
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
            return "Authentication failed: \(message)"
        case .notConnected:
            return "Claude is not connected. Please authenticate again."
        }
    }
}

#if DEBUG
#Preview {
    ClaudeAuthView()
}
#endif
