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
        ZStack {
            // Subtle gradient background
            LinearGradient(
                colors: [
                    Color(.systemBackground),
                    Color(.systemGray6)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Hero section
                VStack(spacing: 40) {
                    // App icon with Google colors accent
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [
                                        Color(red: 0.26, green: 0.52, blue: 0.96),  // Google blue
                                        Color(red: 0.23, green: 0.73, blue: 0.55)   // Google green
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 100, height: 100)
                            .shadow(color: .black.opacity(0.1), radius: 20, y: 10)

                        Image(systemName: "heart.text.clipboard")
                            .font(.system(size: 44, weight: .medium))
                            .foregroundStyle(.white)
                    }
                    .accessibilityHidden(true)

                    VStack(spacing: 16) {
                        Text("GOOGLE_SIGNIN_TITLE")
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .multilineTextAlignment(.center)

                        Text("GOOGLE_SIGNIN_SUBTITLE")
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .lineSpacing(4)
                            .padding(.horizontal, 32)
                    }
                }

                Spacer()
                Spacer()

                // Footer
                VStack(spacing: 24) {
                    GoogleSignInButton(isLoading: isAuthenticating) {
                        startAuthentication()
                    }
                    .disabled(isAuthenticating)
                    .accessibilityIdentifier("googleSignInButton")

                    Text("GOOGLE_SIGNIN_PRIVACY_NOTE")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 50)
            }
        }
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
                    preferredBrowserSession: .shared
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

// MARK: - Google Sign In Button

private struct GoogleSignInButton: View {
    let isLoading: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.primary.opacity(0.6))
                } else {
                    GoogleGLogo()
                        .frame(width: 20, height: 20)

                    Text("GOOGLE_SIGNIN_BUTTON")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(.primary.opacity(0.87))
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .fill(Color(.systemBackground))
                    .shadow(color: .black.opacity(0.08), radius: 8, y: 2)
                    .overlay(
                        RoundedRectangle(cornerRadius: 26, style: .continuous)
                            .stroke(Color(.separator), lineWidth: 1)
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Google "G" Logo

private struct GoogleGLogo: View {
    var body: some View {
        Canvas { context, size in
            let width = size.width
            let height = size.height
            let center = CGPoint(x: width / 2, y: height / 2)
            let radius = min(width, height) / 2 * 0.9
            let strokeWidth = radius * 0.4

            // Blue arc (right side)
            var bluePath = Path()
            bluePath.addArc(
                center: center,
                radius: radius - strokeWidth / 2,
                startAngle: .degrees(-45),
                endAngle: .degrees(45),
                clockwise: false
            )
            context.stroke(
                bluePath,
                with: .color(Color(red: 0.26, green: 0.52, blue: 0.96)),
                lineWidth: strokeWidth
            )

            // Green arc (bottom)
            var greenPath = Path()
            greenPath.addArc(
                center: center,
                radius: radius - strokeWidth / 2,
                startAngle: .degrees(45),
                endAngle: .degrees(135),
                clockwise: false
            )
            context.stroke(
                greenPath,
                with: .color(Color(red: 0.20, green: 0.66, blue: 0.33)),
                lineWidth: strokeWidth
            )

            // Yellow arc (left-bottom)
            var yellowPath = Path()
            yellowPath.addArc(
                center: center,
                radius: radius - strokeWidth / 2,
                startAngle: .degrees(135),
                endAngle: .degrees(180),
                clockwise: false
            )
            context.stroke(
                yellowPath,
                with: .color(Color(red: 0.98, green: 0.74, blue: 0.02)),
                lineWidth: strokeWidth
            )

            // Red arc (top-left to top-right)
            var redPath = Path()
            redPath.addArc(
                center: center,
                radius: radius - strokeWidth / 2,
                startAngle: .degrees(180),
                endAngle: .degrees(-45),
                clockwise: false
            )
            context.stroke(
                redPath,
                with: .color(Color(red: 0.92, green: 0.26, blue: 0.21)),
                lineWidth: strokeWidth
            )

            // Horizontal bar extending right (the "serif" of the G)
            let barHeight = strokeWidth
            let barY = center.y - barHeight / 2
            let barStartX = center.x
            let barEndX = center.x + radius
            var barPath = Path()
            barPath.addRect(CGRect(x: barStartX, y: barY, width: barEndX - barStartX, height: barHeight))
            context.fill(barPath, with: .color(Color(red: 0.26, green: 0.52, blue: 0.96)))
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
