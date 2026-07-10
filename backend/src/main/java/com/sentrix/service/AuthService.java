package com.sentrix.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentrix.config.JwtConfig;
import com.sentrix.dto.request.LoginRequest;
import com.sentrix.dto.request.RegisterRequest;
import com.sentrix.dto.response.AuthResponse;
import com.sentrix.entity.AdminUser;
import com.sentrix.entity.Organization;
import com.sentrix.entity.RefreshToken;
import com.sentrix.enums.AdminRole;
import com.sentrix.enums.SubscriptionPlan;
import com.sentrix.exception.AuthenticationException;
import com.sentrix.exception.DuplicateResourceException;
import com.sentrix.repository.AdminUserRepository;
import com.sentrix.repository.OrganizationRepository;
import com.sentrix.repository.RefreshTokenRepository;
import com.sentrix.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final AdminUserRepository adminUserRepository;
    private final OrganizationRepository organizationRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final JwtConfig jwtConfig;
    private final org.springframework.data.redis.core.StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    // ─── Initiate Register (Name, Email, Password -> Send OTP) ───

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check for duplicate email
        if (adminUserRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        // Create organization
        String slug = generateSlug(request.getOrganizationName());
        Organization org = Organization.builder()
                .name(request.getOrganizationName())
                .slug(slug)
                .plan(SubscriptionPlan.FREE)
                .agentLimit(5)
                .policyLimit(10)
                .apiCallLimit(10000)
                .auditRetentionDays(7)
                .build();
        org = organizationRepository.save(org);

        // Determine role: first user = SUPER_ADMIN
        boolean isFirstUser = adminUserRepository.count() == 0;
        AdminRole role = isFirstUser ? AdminRole.SUPER_ADMIN : AdminRole.ADMIN;

        // Create admin user
        AdminUser adminUser = AdminUser.builder()
                .organization(org)
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(role)
                .build();
        adminUser = adminUserRepository.save(adminUser);

        log.info("New user registered directly without OTP: {} (role: {}, org: {})", adminUser.getEmail(), role, org.getName());

        return generateAuthResponse(adminUser, org);
    }

    // ─── Verify Signup OTP & Complete Registration ───────────────

    @Transactional
    public AuthResponse verifySignupOtp(String email, String otp) {
        String savedOtp = stringRedisTemplate.opsForValue().get("register-otp:" + email);
        if (savedOtp == null || !savedOtp.equals(otp)) {
            throw new AuthenticationException("Invalid or expired OTP code");
        }

        // Fetch stored registration request
        String jsonRequest = stringRedisTemplate.opsForValue().get("register-initiate:" + email);
        if (jsonRequest == null) {
            throw new AuthenticationException("Registration session expired, please register again.");
        }

        RegisterRequest request;
        try {
            request = objectMapper.readValue(jsonRequest, RegisterRequest.class);
        } catch (Exception e) {
            log.error("Failed to deserialize RegisterRequest: {}", e.getMessage());
            throw new RuntimeException("Registration failed, please try again.");
        }

        // Clean up Redis keys
        stringRedisTemplate.delete("register-otp:" + email);
        stringRedisTemplate.delete("register-initiate:" + email);

        // Create organization
        String slug = generateSlug(request.getOrganizationName());
        Organization org = Organization.builder()
                .name(request.getOrganizationName())
                .slug(slug)
                .plan(SubscriptionPlan.FREE)
                .agentLimit(5)
                .policyLimit(10)
                .apiCallLimit(10000)
                .auditRetentionDays(7)
                .build();
        org = organizationRepository.save(org);

        // Determine role: first user = SUPER_ADMIN
        boolean isFirstUser = adminUserRepository.count() == 0;
        AdminRole role = isFirstUser ? AdminRole.SUPER_ADMIN : AdminRole.ADMIN;

        // Create admin user
        AdminUser adminUser = AdminUser.builder()
                .organization(org)
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(role)
                .build();
        adminUser = adminUserRepository.save(adminUser);

        log.info("New user registered after OTP verification: {} (role: {}, org: {})", adminUser.getEmail(), role, org.getName());

        return generateAuthResponse(adminUser, org);
    }

    // ─── Login ──────────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request) {
        AdminUser adminUser = adminUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthenticationException("Invalid email or password"));

        // Check account lockout
        if (adminUser.isAccountLocked()) {
            throw new AuthenticationException("Account is locked. Please try again later.");
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), adminUser.getPasswordHash())) {
            handleFailedLogin(adminUser);
            throw new AuthenticationException("Invalid email or password");
        }

        // Reset failed attempts on success
        adminUser.setFailedLoginAttempts(0);
        adminUser.setIsLocked(false);
        adminUser.setLockedUntil(null);
        adminUser.setLastLoginAt(Instant.now());
        adminUserRepository.save(adminUser);

        log.info("User logged in successfully without OTP: {}", adminUser.getEmail());

        Organization org = adminUser.getOrganization();
        return generateAuthResponse(adminUser, org);
    }

    // ─── Verify OTP ─────────────────────────────────────────────

    @Transactional
    public AuthResponse verifyOtp(com.sentrix.dto.request.VerifyOtpRequest request) {
        String savedOtp = stringRedisTemplate.opsForValue().get("otp:" + request.getEmail());
        if (savedOtp == null || !savedOtp.equals(request.getOtp())) {
            throw new AuthenticationException("Invalid or expired OTP code");
        }

        // Remove OTP from Redis after success
        stringRedisTemplate.delete("otp:" + request.getEmail());

        AdminUser adminUser = adminUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthenticationException("User session not found"));

        Organization org = adminUser.getOrganization();
        log.info("2FA OTP verified successfully for user: {}", adminUser.getEmail());

        return generateAuthResponse(adminUser, org);
    }

    // ─── Refresh Token ──────────────────────────────────────────

    @Transactional
    public AuthResponse refreshToken(String refreshTokenStr) {
        // Validate the refresh token JWT
        var claims = jwtTokenProvider.validateRefreshToken(refreshTokenStr);
        String tokenType = claims.get("type", String.class);

        if (!"REFRESH".equals(tokenType)) {
            throw new AuthenticationException("Invalid token type");
        }

        String tokenHash = hashToken(refreshTokenStr);
        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new AuthenticationException("Invalid refresh token"));

        if (!storedToken.isValid()) {
            throw new AuthenticationException("Refresh token is expired or revoked");
        }

        // Revoke old refresh token (rotation)
        storedToken.setIsRevoked(true);
        refreshTokenRepository.save(storedToken);

        // Generate new tokens
        AdminUser adminUser = storedToken.getAdminUser();
        Organization org = adminUser.getOrganization();

        return generateAuthResponse(adminUser, org);
    }

    // ─── Logout ─────────────────────────────────────────────────

    @Transactional
    public void logout(UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
        log.info("User logged out: {}", userId);
    }

    // ─── Get Current User ───────────────────────────────────────

    @Transactional(readOnly = true)
    public AuthResponse.UserInfo getCurrentUser(UUID userId) {
        AdminUser user = adminUserRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationException("User not found"));
        Organization org = user.getOrganization();

        return AuthResponse.UserInfo.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .organizationId(org.getId().toString())
                .organizationName(org.getName())
                .plan(org.getPlan().name())
                .build();
    }

    // ─── Private Helpers ────────────────────────────────────────

    private AuthResponse generateAuthResponse(AdminUser user, Organization org) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name()
        );
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        // Save refresh token hash
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .adminUser(user)
                .tokenHash(hashToken(refreshToken))
                .expiresAt(Instant.now().plusMillis(jwtConfig.getRefreshExpiration()))
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtConfig.getAccessExpiration() / 1000)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId().toString())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole().name())
                        .organizationId(org.getId().toString())
                        .organizationName(org.getName())
                        .plan(org.getPlan().name())
                        .build())
                .build();
    }

    private void handleFailedLogin(AdminUser user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);

        if (attempts >= 5) {
            user.setIsLocked(true);
            user.setLockedUntil(Instant.now().plusSeconds(1800)); // 30 minute lockout
            log.warn("Account locked after {} failed attempts: {}", attempts, user.getEmail());
        }

        adminUserRepository.save(user);
    }

    @Transactional
    public AuthResponse.UserInfo updateProfile(UUID userId, java.util.Map<String, String> request) {
        AdminUser user = adminUserRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationException("User not found"));
        Organization org = user.getOrganization();

        if (request.containsKey("firstName") && request.get("firstName") != null && !request.get("firstName").isBlank()) {
            user.setFirstName(request.get("firstName"));
        }
        if (request.containsKey("lastName") && request.get("lastName") != null && !request.get("lastName").isBlank()) {
            user.setLastName(request.get("lastName"));
        }
        if (request.containsKey("email") && request.get("email") != null && !request.get("email").isBlank()) {
            user.setEmail(request.get("email"));
        }
        if (request.containsKey("password") && request.get("password") != null && !request.get("password").isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.get("password")));
        }
        if (request.containsKey("organizationName") && request.get("organizationName") != null && !request.get("organizationName").isBlank()) {
            org.setName(request.get("organizationName"));
            organizationRepository.save(org);
        }

        adminUserRepository.save(user);

        return AuthResponse.UserInfo.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .organizationId(org.getId().toString())
                .organizationName(org.getName())
                .plan(org.getPlan().name())
                .build();
    }

    private String generateSlug(String name) {
        String baseSlug = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");

        String slug = baseSlug;
        int counter = 1;
        while (organizationRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter++;
        }
        return slug;
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
