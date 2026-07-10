package com.sentrix.util;

import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * Generates secure API keys for agents.
 * Format: "ak_live_" + 32 random hex characters (total 40 chars)
 * Prefix (first 8 chars after "ak_live_") used for indexed lookup.
 */
public final class ApiKeyGenerator {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String PREFIX = "ak_live_";
    private static final int RANDOM_BYTES = 16; // 16 bytes = 32 hex chars

    private ApiKeyGenerator() {
        // Utility class
    }

    /**
     * Generate a new API key.
     * @return full API key string: "ak_live_" + 32 hex chars
     */
    public static String generate() {
        byte[] bytes = new byte[RANDOM_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return PREFIX + HexFormat.of().formatHex(bytes);
    }

    /**
     * Extract the lookup prefix from a full API key.
     * Returns the first 8 chars after "ak_live_".
     */
    public static String extractPrefix(String apiKey) {
        if (apiKey == null || apiKey.length() < PREFIX.length() + 8) {
            throw new IllegalArgumentException("Invalid API key format");
        }
        return apiKey.substring(PREFIX.length(), PREFIX.length() + 8);
    }

    /**
     * Mask an API key for display: shows prefix + last 4 chars.
     */
    public static String mask(String apiKey) {
        if (apiKey == null || apiKey.length() < 12) {
            return "****";
        }
        return apiKey.substring(0, PREFIX.length() + 4) + "..." + apiKey.substring(apiKey.length() - 4);
    }
}
