pub fn requires_destructive_confirmation(prompt: &str) -> bool {
    let normalized = prompt.to_lowercase();
    let markers = [
        "rm -rf",
        "drop table",
        "truncate table",
        "delete all",
        "wipe database",
        "destroy",
        "delete production",
        "revoke",
        "reset prod",
    ];

    markers.iter().any(|marker| normalized.contains(marker))
}

pub fn confirmation_required(prompt: &str, confirmed: Option<bool>) -> bool {
    requires_destructive_confirmation(prompt) && !confirmed.unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::{confirmation_required, requires_destructive_confirmation};

    #[test]
    fn destructive_prompts_require_confirmation() {
        assert!(requires_destructive_confirmation(
            "Please drop table users and recreate it"
        ));
        assert!(requires_destructive_confirmation("run rm -rf /tmp/test"));
        assert!(requires_destructive_confirmation(
            "Delete production records now"
        ));
    }

    #[test]
    fn read_only_prompts_do_not_require_confirmation() {
        assert!(!requires_destructive_confirmation(
            "Summarize this sprint and suggest priorities"
        ));
        assert!(!requires_destructive_confirmation(
            "Draft release notes for the iOS update"
        ));
    }

    #[test]
    fn explicit_confirmation_unblocks_destructive_prompt() {
        assert!(confirmation_required("delete all sessions", None));
        assert!(!confirmation_required("delete all sessions", Some(true)));
    }
}
