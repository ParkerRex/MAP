pub fn normalize_provider_alias(provider: &str) -> String {
    match provider.trim().to_lowercase().as_str() {
        "kimi" | "moonshot-ai" | "moonshotai" => "moonshot".to_string(),
        value => value.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::normalize_provider_alias;

    #[test]
    fn normalizes_known_aliases() {
        assert_eq!(normalize_provider_alias("kimi"), "moonshot");
        assert_eq!(normalize_provider_alias("moonshot-ai"), "moonshot");
        assert_eq!(normalize_provider_alias("moonshotai"), "moonshot");
    }

    #[test]
    fn lowercases_and_trims_values() {
        assert_eq!(normalize_provider_alias("  OpenAI  "), "openai");
    }
}
