package com.sentrix.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Utility class to extract current user/agent info from SecurityContext.
 */
@Component
public class SecurityUtils {

    private static com.sentrix.repository.AdminUserRepository adminUserRepository;

    public SecurityUtils(com.sentrix.repository.AdminUserRepository adminUserRepository) {
        SecurityUtils.adminUserRepository = adminUserRepository;
    }

    public static UUID getCurrentUserOrgId() {
        UUID userId = getCurrentUserId();
        return adminUserRepository.findById(userId)
                .map(user -> user.getOrganization().getId())
                .orElseThrow(() -> new IllegalStateException("Organization not found for user: " + userId));
    }

    public static UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalStateException("No authenticated user in SecurityContext");
        }
        return UUID.fromString(auth.getPrincipal().toString());
    }

    public static String getCurrentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getCredentials() == null) {
            return null;
        }
        return auth.getCredentials().toString();
    }

    public static String getCurrentUserRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().isEmpty()) {
            return null;
        }
        return auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
    }

    public static boolean isAgent() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_AGENT"));
    }

    public static boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal());
    }
}
