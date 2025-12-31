


extension String {
    var moduleLocalized: String {
        String(localized: LocalizationValue(self))
    }
}
