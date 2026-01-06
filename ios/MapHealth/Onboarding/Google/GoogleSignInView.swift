import AuthenticationServices
import Foundation
import MapHealthCore
import SwiftUI

/// Google Sign-In onboarding view that handles OAuth authentication
struct GoogleSignInView: View {
    @Environment(\.webAuthenticationSession) private var webAuthSession
    @Environment(\.colorScheme) private var colorScheme
    @State private var isAuthenticating = false
    @State private var showErrorAlert = false
    @State private var errorMessage = ""
    @StateObject private var sessionService = SessionService.shared
    let onAuthenticated: () -> Void

    var body: some View {
        ZStack {
            OnboardingBackground()

            VStack(spacing: 0) {
                Spacer()

                // Main content
                VStack(spacing: 40) {
                    // App icon and branding
                    brandingSection

                    // Welcome text
                    headerSection
                }

                Spacer()
                Spacer()

                // Bottom section with button and legal
                footerSection
            }
            .padding(.horizontal, 32)
            .padding(.vertical, 24)
        }
        .alert("Sign In Error", isPresented: $showErrorAlert) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
    }

    // MARK: - Branding Section

    private var brandingSection: some View {
        VStack(spacing: 20) {
            // App icon
            ZStack {
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0.26, green: 0.52, blue: 0.96),
                                Color(red: 0.23, green: 0.73, blue: 0.55)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 88, height: 88)
                    .shadow(color: .blue.opacity(0.3), radius: 20, x: 0, y: 10)

                Image(systemName: "heart.text.clipboard")
                    .font(.system(size: 36, weight: .medium))
                    .foregroundStyle(.white)
            }

            Text("MAP")
                .font(.title2)
                .fontWeight(.semibold)
                .fontDesign(.rounded)
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(spacing: 12) {
            Text("Welcome")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("Sign in to track your health,\nset goals, and stay on course.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .lineSpacing(2)
        }
    }

    // MARK: - Footer Section

    private var footerSection: some View {
        VStack(spacing: 24) {
            // Google Sign In Button
            Button(action: startAuthentication) {
                HStack(spacing: 12) {
                    if isAuthenticating {
                        TypingIndicator()
                        Text("Signing in...")
                            .font(.body)
                            .fontWeight(.medium)
                            .foregroundStyle(.secondary)
                    } else {
                        GoogleLogo()
                            .frame(width: 18, height: 18)

                        Text("Continue with Google")
                            .font(.body)
                            .fontWeight(.medium)
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(buttonBackground)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.primary.opacity(0.1), lineWidth: 1)
                )
                .animation(.easeInOut(duration: 0.2), value: isAuthenticating)
            }
            .buttonStyle(.plain)
            .disabled(isAuthenticating)

            // Divider with text
            HStack(spacing: 12) {
                Rectangle()
                    .fill(Color.primary.opacity(0.1))
                    .frame(height: 1)

                Text("Secure sign-in via Google")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .layoutPriority(1)

                Rectangle()
                    .fill(Color.primary.opacity(0.1))
                    .frame(height: 1)
            }

            // Legal text
            Text("By continuing, you agree to our Terms of Service and Privacy Policy.")
                .font(.caption)
                .foregroundStyle(.tertiary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 16)
        }
        .padding(.bottom, 16)
    }

    @ViewBuilder
    private var buttonBackground: some View {
        if colorScheme == .dark {
            Color(.systemGray5)
        } else {
            Color.white
                .shadow(color: .black.opacity(0.06), radius: 8, x: 0, y: 2)
        }
    }

    // MARK: - Authentication

    private func startAuthentication() {
        isAuthenticating = true

        Task {
            do {
                let authURL = URL(string: "\(AppConfig.webBaseURL)/api/auth/google?platform=ios")!
                let callbackScheme = "maphealth"

                let callbackURL = try await webAuthSession.authenticate(
                    using: authURL,
                    callbackURLScheme: callbackScheme,
                    preferredBrowserSession: .shared
                )

                guard let components = URLComponents(
                    url: callbackURL,
                    resolvingAgainstBaseURL: false
                ) else {
                    throw GoogleSignInError.invalidCallback("Invalid callback URL")
                }

                if let token = components.queryItems?.first(where: { $0.name == "token" })?.value {
                    try sessionService.setSessionToken(token)
                    onAuthenticated()
                } else if let error = components.queryItems?.first(
                    where: { $0.name == "error" }
                )?.value {
                    throw GoogleSignInError.authFailed(error)
                } else {
                    throw GoogleSignInError.authFailed("Unknown error occurred")
                }
            } catch ASWebAuthenticationSessionError.canceledLogin {
                // User cancelled - do nothing
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
        Image(systemName: "g.circle.fill")
            .font(.title2)
            .foregroundStyle(.primary)
            .opacity(0)
            .overlay {
                Canvas { context, size in
                    let rect = CGRect(origin: .zero, size: size)

                    // Blue section
                    var bluePath = Path()
                    bluePath.move(to: CGPoint(x: rect.midX, y: rect.midY))
                    bluePath.addArc(
                        center: CGPoint(x: rect.midX, y: rect.midY),
                        radius: rect.width / 2,
                        startAngle: .degrees(-45),
                        endAngle: .degrees(45),
                        clockwise: false
                    )
                    bluePath.closeSubpath()
                    context.fill(bluePath, with: .color(Color(hex: "4285F4")!))

                    // Green section
                    var greenPath = Path()
                    greenPath.move(to: CGPoint(x: rect.midX, y: rect.midY))
                    greenPath.addArc(
                        center: CGPoint(x: rect.midX, y: rect.midY),
                        radius: rect.width / 2,
                        startAngle: .degrees(45),
                        endAngle: .degrees(135),
                        clockwise: false
                    )
                    greenPath.closeSubpath()
                    context.fill(greenPath, with: .color(Color(hex: "34A853")!))

                    // Yellow section
                    var yellowPath = Path()
                    yellowPath.move(to: CGPoint(x: rect.midX, y: rect.midY))
                    yellowPath.addArc(
                        center: CGPoint(x: rect.midX, y: rect.midY),
                        radius: rect.width / 2,
                        startAngle: .degrees(135),
                        endAngle: .degrees(225),
                        clockwise: false
                    )
                    yellowPath.closeSubpath()
                    context.fill(yellowPath, with: .color(Color(hex: "FBBC05")!))

                    // Red section
                    var redPath = Path()
                    redPath.move(to: CGPoint(x: rect.midX, y: rect.midY))
                    redPath.addArc(
                        center: CGPoint(x: rect.midX, y: rect.midY),
                        radius: rect.width / 2,
                        startAngle: .degrees(225),
                        endAngle: .degrees(315),
                        clockwise: false
                    )
                    redPath.closeSubpath()
                    context.fill(redPath, with: .color(Color(hex: "EA4335")!))

                    // White center circle
                    let innerRadius = rect.width * 0.35
                    let innerRect = CGRect(
                        x: rect.midX - innerRadius,
                        y: rect.midY - innerRadius,
                        width: innerRadius * 2,
                        height: innerRadius * 2
                    )
                    context.fill(Path(ellipseIn: innerRect), with: .color(.white))

                    // Blue bar (the G crossbar)
                    let barHeight = rect.height * 0.18
                    let barRect = CGRect(
                        x: rect.midX - rect.width * 0.05,
                        y: rect.midY - barHeight / 2,
                        width: rect.width * 0.55,
                        height: barHeight
                    )
                    context.fill(Path(barRect), with: .color(Color(hex: "4285F4")!))
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
    GoogleSignInView {}
}
#endif
