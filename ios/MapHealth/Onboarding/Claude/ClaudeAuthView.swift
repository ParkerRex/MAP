import AuthenticationServices
import MapHealthCore
import SpeziOnboarding
import SpeziViews
import SwiftUI

struct ClaudeAuthView: View {
    @Environment(ManagedNavigationStack.Path.self) private var onboardingNavigationPath
    @Environment(\.webAuthenticationSession) private var webAuthSession
    @State private var isAuthenticating = false
    @State private var showErrorAlert = false
    @State private var errorMessage = ""

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
                    Button {
                        startAuthentication()
                    } label: {
                        if isAuthenticating {
                            ProgressView()
                                .progressViewStyle(.circular)
                        } else {
                            Text("CLAUDE_AUTH_BUTTON")
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(isAuthenticating)
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

    private func startAuthentication() {
        isAuthenticating = true

        Task {
            do {
                // Open the web-based OAuth flow
                // The web backend handles the OAuth with Anthropic
                let authURL = URL(string: "\(AppConfig.webBaseURL)/api/claude/auth")!
                let callbackScheme = "maphealth"

                let callbackURL = try await webAuthSession.authenticate(
                    using: authURL,
                    callbackURLScheme: callbackScheme
                )

                // Check if authentication was successful
                if let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false),
                   components.queryItems?.contains(where: { $0.name == "success" }) == true {
                    // Successfully authenticated, proceed to next step
                    onboardingNavigationPath.nextStep()
                } else if let error = components.queryItems?.first(where: { $0.name == "error" })?.value {
                    throw ClaudeAuthError.authFailed(error)
                } else {
                    throw ClaudeAuthError.authFailed("Unknown error")
                }
            } catch ASWebAuthenticationSessionError.canceledLogin {
                // User cancelled, just reset state
            } catch {
                errorMessage = error.localizedDescription
                showErrorAlert = true
            }

            isAuthenticating = false
        }
    }
}

// MARK: - App Configuration

enum AppConfig {
    static let webBaseURL: String = {
        #if DEBUG
        return "http://localhost:3000"
        #else
        return "https://app.map.ai"
        #endif
    }()
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
