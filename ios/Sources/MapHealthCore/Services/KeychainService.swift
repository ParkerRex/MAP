import Foundation
import Security

/// Service for securely storing and retrieving authentication tokens in Keychain
public final class KeychainService {
    public static let shared = KeychainService()

    private let service = "com.map.health"
    private let sessionTokenKey = "sessionToken"
    private let openAIKey = "openAIKey"

    private init() {}

    // MARK: - Session Token

    /// Store the session token in Keychain
    public func saveSessionToken(_ token: String) throws {
        try save(key: sessionTokenKey, data: Data(token.utf8))
    }

    /// Retrieve the session token from Keychain
    public func getSessionToken() -> String? {
        guard let data = try? retrieve(key: sessionTokenKey) else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }

    /// Delete the session token from Keychain
    public func deleteSessionToken() throws {
        try delete(key: sessionTokenKey)
    }

    /// Check if a session token exists
    public var hasSessionToken: Bool {
        getSessionToken() != nil
    }

    // MARK: - OpenAI API Key

    public func saveOpenAIKey(_ token: String) throws {
        try save(key: openAIKey, data: Data(token.utf8))
    }

    public func getOpenAIKey() -> String? {
        guard let data = try? retrieve(key: openAIKey) else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }

    public func deleteOpenAIKey() throws {
        try delete(key: openAIKey)
    }

    public var hasOpenAIKey: Bool {
        getOpenAIKey() != nil
    }

    // MARK: - Generic Keychain Operations

    private func save(key: String, data: Data) throws {
        // Delete any existing item first
        try? delete(key: key)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.saveFailed(status)
        }
    }

    private func retrieve(key: String) throws -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecItemNotFound {
            return nil
        }

        guard status == errSecSuccess else {
            throw KeychainError.retrieveFailed(status)
        }

        return result as? Data
    }

    private func delete(key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]

        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.deleteFailed(status)
        }
    }
}

// MARK: - Errors

public enum KeychainError: Error, LocalizedError {
    case saveFailed(OSStatus)
    case retrieveFailed(OSStatus)
    case deleteFailed(OSStatus)

    public var errorDescription: String? {
        switch self {
        case .saveFailed(let status):
            return String(format: String(localized: "KEYCHAIN_SAVE_FAILED"), status)
        case .retrieveFailed(let status):
            return String(format: String(localized: "KEYCHAIN_RETRIEVE_FAILED"), status)
        case .deleteFailed(let status):
            return String(format: String(localized: "KEYCHAIN_DELETE_FAILED"), status)
        }
    }
}
