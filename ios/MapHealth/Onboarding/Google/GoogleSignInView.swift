import AuthenticationServices
import MapHealthCore
import SpeziOnboarding
import SpeziViews
import SwiftUI

/// Google Sign-In onboarding view that handles OAuth authentication
struct GoogleSignInView: View {
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

                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 80))
                        .foregroundStyle(.blue)
                        .accessibilityHidden(true)

                    OnboardingTitleView(
                        title: "GOOGLE_SIGNIN_TITLE",
                        subtitle: "GOOGLE_SIGNIN_SUBTITLE"
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
                            HStack(spacing: 12) {
                                GoogleLogo()
                                    .frame(width: 20, height: 20)
                                Text("GOOGLE_SIGNIN_BUTTON")
                            }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(isAuthenticating)
                    .accessibilityIdentifier("googleSignInButton")
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
                // Add platform=ios to tell backend to redirect with deep link
                let authURL = URL(string: "\(AppConfig.webBaseURL)/api/auth/google?platform=ios")!
                let callbackScheme = "maphealth"

                let callbackURL = try await webAuthSession.authenticate(
                    using: authURL,
                    callbackURLScheme: callbackScheme,
                    prefersEphemeralWebBrowserSession: false // Use shared Safari cookies for faster re-auth
                )

                // Parse callback URL
                guard let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false) else {
                    throw GoogleSignInError.invalidCallback("Invalid callback URL")
                }

                // Check for success with token
                if let token = components.queryItems?.first(where: { $0.name == "token" })?.value {
                    // Save token to Keychain
                    try KeychainService.shared.saveSessionToken(token)

                    // Set auth token on API client
                    MapAPIClient.shared.setAuthToken(token)

                    // Proceed to next step
                    onboardingNavigationPath.nextStep()
                } else if let error = components.queryItems?.first(where: { $0.name == "error" })?.value {
                    throw GoogleSignInError.authFailed(error)
                } else {
                    throw GoogleSignInError.authFailed("Unknown error")
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

// MARK: - Google Logo

private struct GoogleLogo: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(.white)

            GeometryReader { geometry in
                let size = geometry.size
                Path { path in
                    // G path - simplified version
                    let center = CGPoint(x: size.width / 2, y: size.height / 2)
                    let radius = min(size.width, size.height) / 2 * 0.8

                    path.addArc(
                        center: center,
                        radius: radius,
                        startAngle: .degrees(45),
                        endAngle: .degrees(315),
                        clockwise: false
                    )
                }
                .stroke(
                    AngularGradient(
                        colors: [.red, .yellow, .green, .blue, .red],
                        center: .center
                    ),
                    lineWidth: size.width * 0.15
                )
            }
        }
    }
}

// MARK: - Errors

enum GoogleSignInError: Error, LocalizedError {
    case invalidCallback(String)
    case authFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidCallback(let message):
            return "Invalid callback: \(message)"
        case .authFailed(let message):
            return "Authentication failed: \(message)"
        }
    }
}

#if DEBUG
#Preview {
    GoogleSignInView()
}
#endif
