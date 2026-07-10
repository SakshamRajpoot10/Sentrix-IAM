package com.sentrix.security;

import com.sentrix.config.JwtConfig;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtConfig jwtConfig;

    // ─── Access Token ───────────────────────────────────────────

    public String generateAccessToken(UUID userId, String email, String role) {
        SecretKey key = getAccessKey();
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(jwtConfig.getAccessExpiration());

        return Jwts.builder()
                .subject(userId.toString())
                .claims(Map.of(
                        "email", email,
                        "role", role,
                        "type", "ACCESS"
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    // ─── Refresh Token ──────────────────────────────────────────

    public String generateRefreshToken(UUID userId) {
        SecretKey key = getRefreshKey();
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(jwtConfig.getRefreshExpiration());
        String tokenId = UUID.randomUUID().toString();

        return Jwts.builder()
                .subject(userId.toString())
                .id(tokenId)
                .claims(Map.of("type", "REFRESH"))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    // ─── Agent Session Token ────────────────────────────────────

    public String generateAgentSessionToken(UUID agentId, UUID sessionId) {
        SecretKey key = getAccessKey();
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(3600000); // 1 hour for agent sessions

        return Jwts.builder()
                .subject(agentId.toString())
                .claims(Map.of(
                        "sessionId", sessionId.toString(),
                        "type", "AGENT_SESSION"
                ))
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    // ─── Validation ─────────────────────────────────────────────

    public Claims validateAccessToken(String token) {
        return parseClaims(token, getAccessKey());
    }

    public Claims validateRefreshToken(String token) {
        return parseClaims(token, getRefreshKey());
    }

    public UUID getUserIdFromToken(String token) {
        Claims claims = validateAccessToken(token);
        return UUID.fromString(claims.getSubject());
    }

    public String getTokenType(String token) {
        try {
            Claims claims = validateAccessToken(token);
            return claims.get("type", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isValidAccessToken(String token) {
        try {
            validateAccessToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // ─── Private Helpers ────────────────────────────────────────

    private Claims parseClaims(String token, SecretKey key) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getAccessKey() {
        return Keys.hmacShaKeyFor(jwtConfig.getAccessSecret().getBytes(StandardCharsets.UTF_8));
    }

    private SecretKey getRefreshKey() {
        return Keys.hmacShaKeyFor(jwtConfig.getRefreshSecret().getBytes(StandardCharsets.UTF_8));
    }
}
