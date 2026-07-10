package com.sentrix.controller;

import com.sentrix.dto.request.LoginRequest;
import com.sentrix.dto.request.RegisterRequest;
import com.sentrix.dto.response.AuthResponse;
import com.sentrix.security.SecurityUtils;
import com.sentrix.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Admin user authentication endpoints")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new admin user and organization")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/register/verify-otp")
    @Operation(summary = "Verify signup OTP code to complete registration")
    public ResponseEntity<AuthResponse> verifySignupOtp(@Valid @RequestBody com.sentrix.dto.request.VerifyOtpRequest request) {
        AuthResponse response = authService.verifySignupOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify 2FA OTP code to retrieve tokens")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody com.sentrix.dto.request.VerifyOtpRequest request) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using refresh token")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout — revoke all refresh tokens")
    public ResponseEntity<Map<String, String>> logout() {
        UUID userId = SecurityUtils.getCurrentUserId();
        authService.logout(userId);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<AuthResponse.UserInfo> getCurrentUser() {
        UUID userId = SecurityUtils.getCurrentUserId();
        AuthResponse.UserInfo user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/profile")
    @Operation(summary = "Update current user profile and organization info")
    public ResponseEntity<AuthResponse.UserInfo> updateProfile(@RequestBody Map<String, String> request) {
        UUID userId = SecurityUtils.getCurrentUserId();
        AuthResponse.UserInfo user = authService.updateProfile(userId, request);
        return ResponseEntity.ok(user);
    }
}
