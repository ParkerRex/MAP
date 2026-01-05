import MapHealthCore
import SwiftUI

struct OpenAIAPIKey: View {
    let onContinue: () -> Void
    @State private var apiKey = ""
    @State private var showErrorAlert = false
    @State private var errorMessage = ""

    var body: some View {
        OnboardingScreen(
            title: "API_KEY_TITLE",
            subtitle: "API_KEY_SUBTITLE"
        ) {
            VStack(spacing: 16) {
                SecureField("API_KEY_TITLE", text: $apiKey)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(true)
                    .textFieldStyle(.roundedBorder)
                    .accessibilityLabel(Text("API_KEY_TITLE"))
            }
            .padding(20)
            .mapHealthGlassSurface(cornerRadius: 24, tint: Color.accentColor.opacity(0.08))
        } footer: {
            Button("ONBOARDING_NEXT") {
                saveKey()
            }
            .mapHealthGlassButtonStyle(prominent: true)
            .disabled(apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .alert("ERROR_ALERT_TITLE", isPresented: $showErrorAlert) {
            Button("ERROR_ALERT_CANCEL", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
        .onAppear {
            apiKey = KeychainService.shared.getOpenAIKey() ?? ""
        }
    }

    private func saveKey() {
        do {
            try KeychainService.shared.saveOpenAIKey(apiKey)
            onContinue()
        } catch {
            errorMessage = error.localizedDescription
            showErrorAlert = true
        }
    }
}

#if DEBUG
#Preview {
    OpenAIAPIKey {}
}
#endif
