import Foundation

extension String {
    public var moduleLocalized: String {
        String(localized: LocalizationValue(self))
    }
}
