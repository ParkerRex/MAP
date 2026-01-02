import SwiftUI

extension View {
    @ViewBuilder
    func mapHealthGlassSurface(
        cornerRadius: CGFloat = 20,
        tint: Color = .clear,
        interactive: Bool = false
    ) -> some View {
        if #available(iOS 26, *) {
            if interactive {
                self.glassEffect(.regular.tint(tint).interactive(), in: .rect(cornerRadius: cornerRadius))
            } else {
                self.glassEffect(.regular.tint(tint), in: .rect(cornerRadius: cornerRadius))
            }
        } else {
            self.background(
                .ultraThinMaterial,
                in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            )
        }
    }

    @ViewBuilder
    func mapHealthGlassButtonStyle(prominent: Bool = false) -> some View {
        if #available(iOS 26, *) {
            if prominent {
                self.buttonStyle(.glassProminent)
            } else {
                self.buttonStyle(.glass)
            }
        } else {
            if prominent {
                self.buttonStyle(.borderedProminent)
            } else {
                self.buttonStyle(.bordered)
            }
        }
    }

    @ViewBuilder
    func mapHealthGlassCard(tint: Color = .accentColor.opacity(0.06)) -> some View {
        self
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .mapHealthGlassSurface(cornerRadius: 20, tint: tint)
    }
}

