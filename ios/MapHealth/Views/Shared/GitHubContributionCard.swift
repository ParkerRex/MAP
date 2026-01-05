import SwiftUI
import WebKit

struct GitHubContributionCard: View {
    let username: String

    private var normalizedUsername: String {
        username
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "^@", with: "", options: .regularExpression)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("GitHub activity")
                .font(.headline)

            Text("@\(normalizedUsername)")
                .font(.caption)
                .foregroundStyle(.secondary)

            GitHubContributionWebView(contributionsURL: githubContributionsURL)
                .frame(height: 96)
                .padding(12)
                .frame(maxWidth: .infinity)
                .background(Color.white, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        }
        .mapHealthGlassCard()
    }

    private var githubContributionsURL: URL {
        let base = "https://github.com/users/"
        return URL(string: base + normalizedUsername + "/contributions")! // swiftlint:disable:this force_unwrapping
    }
}

private struct GitHubContributionWebView: UIViewRepresentable {
    let contributionsURL: URL

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
        guard context.coordinator.lastURL != contributionsURL else { return }
        context.coordinator.lastURL = contributionsURL
        webView.loadHTMLString(html(for: contributionsURL), baseURL: nil)
    }

    final class Coordinator {
        var lastURL: URL?
    }

    private func html(for contributionsURL: URL) -> String {
        """
        <!doctype html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              :root { color-scheme: light; }
              body { margin: 0; padding: 0; background: transparent; }
              img { width: 100%; height: auto; display: block; }
            </style>
          </head>
          <body>
            <img src="\(contributionsURL.absoluteString)" alt="GitHub contributions">
          </body>
        </html>
        """
    }
}

#if DEBUG
#Preview {
    GitHubContributionCard(username: "octocat")
}
#endif
