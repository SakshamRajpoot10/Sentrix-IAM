package com.sentrix.util;

import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

/**
 * SHA-256 cryptographic hash chain utility for audit log integrity.
 * Each entry's hash = SHA-256(agentId + action + resource + decision + timestamp + previousHash)
 */
@Slf4j
public final class HashChainUtil {

    public static final String GENESIS_HASH = "SENTRIX_GENESIS_HASH_v1";

    private HashChainUtil() {
        // Utility class
    }

    /**
     * Compute the SHA-256 hash for an audit log entry.
     */
    public static String computeHash(
            UUID agentId,
            String action,
            String resource,
            String decision,
            Instant timestamp,
            String previousHash
    ) {
        String data = String.join("|",
                agentId != null ? agentId.toString() : "SYSTEM",
                action != null ? action : "",
                resource != null ? resource : "",
                decision != null ? decision : "",
                timestamp != null ? timestamp.toString() : Instant.now().toString(),
                previousHash != null ? previousHash : GENESIS_HASH
        );

        return sha256(data);
    }

    /**
     * Verify that a hash matches the expected computation.
     */
    public static boolean verifyHash(
            String hash,
            UUID agentId,
            String action,
            String resource,
            String decision,
            Instant timestamp,
            String previousHash
    ) {
        String computed = computeHash(agentId, action, resource, decision, timestamp, previousHash);
        return hash.equals(computed);
    }

    /**
     * Compute SHA-256 hex digest of input string.
     */
    public static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
