package com.sentrix.util;

/**
 * Generates URL-safe slugs from names.
 */
public final class SlugGenerator {

    private SlugGenerator() {
        // Utility class
    }

    /**
     * Convert a name to a URL-safe slug.
     */
    public static String generate(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
