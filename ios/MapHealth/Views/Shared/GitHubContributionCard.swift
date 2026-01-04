import SwiftUI
import WebKit

struct GitHubContributionCard: View {
    let username: String

    private var normalizedUsername: String {
        username.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: "^@", with: "", options: .regularExpression)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("GitHub activity")
                .font(.headline)

            Text("@\(normalizedUsername)")
                .font(.caption)
                .foregroundStyle(.secondary)

            GitHubContributionWebView(url: githubGraphURL)
                .frame(height: 130)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .mapHealthGlassCard()
    }

    private var githubGraphURL: URL {
        let base = "https://ghchart.rshah.org/20b14f/"
        return URL(string: base + normalizedUsername)! // swiftlint:disable:this force_unwrapping
    }
}

private struct GitHubContributionWebView: UIViewRepresentable {
    let url: URL

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = false
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        webView.scrollView.backgroundColor = .clear
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard context.coordinator.lastURL != url else { return }
        context.coordinator.lastURL = url
        webView.load(URLRequest(url: url))
    }

    final class Coordinator {
        var lastURL: URL?
    }
}

#if DEBUG
#Preview {
    GitHubContributionCard(username: "octocat")
}
#endif
