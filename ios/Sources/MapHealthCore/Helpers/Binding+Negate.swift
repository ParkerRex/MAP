import SwiftUI

extension Binding where Value == Bool {
    /// Negates a `Binding`.
    public prefix static func ! (value: Binding<Bool>) -> Binding<Bool> {
        Binding<Bool>(
            get: { !value.wrappedValue },
            set: { value.wrappedValue = !$0 }
        )
    }
}
