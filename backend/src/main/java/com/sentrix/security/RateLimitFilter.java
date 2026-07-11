package com.sentrix.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Redis-backed rate limiting filter.
 * Limits are applied per IP address per endpoint category.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redisTemplate;

    private static final int AUTH_LIMIT = 5;        // 5 per minute
    private static final int GENERAL_LIMIT = 100;    // 100 per 15 minutes
    private static final int AGENT_LIMIT = 1000;     // 1000 per minute

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {

        String clientIp = getClientIp(request);
        String path = request.getServletPath();

        String category;
        int limit;
        Duration window;

        if (path.startsWith("/api/v1/auth/")) {
            category = "auth";
            limit = AUTH_LIMIT;
            window = Duration.ofMinutes(1);
        } else if (path.startsWith("/api/v1/agent/")) {
            category = "agent";
            limit = AGENT_LIMIT;
            window = Duration.ofMinutes(1);

            // Adaptive rate limiting for authenticated agent requests
            try {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_AGENT"))) {
                    String agentId = (String) auth.getPrincipal();
                    category = "agent:" + agentId;

                    // Read cached risk score and max actions from Redis
                    String riskStr = redisTemplate.opsForValue().get("agent_cache:risk_score:" + agentId);
                    String maxActionsStr = redisTemplate.opsForValue().get("agent_cache:max_actions:" + agentId);

                    double riskScore = riskStr != null ? Double.parseDouble(riskStr) : 0.0;
                    int maxActions = maxActionsStr != null ? Integer.parseInt(maxActionsStr) : 60;

                    // Compute dynamic limit: multiplier drops down from 1.0 down to 0.2 as risk score goes up
                    double multiplier = 1.0 - (riskScore * 0.8);
                    limit = Math.max(1, (int) (maxActions * multiplier));
                }
            } catch (Exception e) {
                log.warn("Failed to calculate adaptive agent rate limit: {}", e.getMessage());
            }
        } else if (path.startsWith("/api/")) {
            category = "general";
            limit = GENERAL_LIMIT;
            window = Duration.ofMinutes(15);
        } else {
            // No rate limiting for non-API paths
            filterChain.doFilter(request, response);
            return;
        }

        String key = "rate_limit:" + category + ":" + clientIp;

        try {
            Long currentCount = redisTemplate.opsForValue().increment(key);
            if (currentCount != null && currentCount == 1) {
                redisTemplate.expire(key, window);
            }

            if (currentCount != null && currentCount > limit) {
                log.warn("Rate limit exceeded for IP {} on category {}: {}/{}", clientIp, category, currentCount, limit);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"error\":\"RATE_LIMIT_EXCEEDED\",\"message\":\"Too many requests. Please try again later.\",\"retryAfterSeconds\":" + window.getSeconds() + "}"
                );
                return;
            }

            // Add rate limit headers
            response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - (currentCount != null ? currentCount : 0))));

        } catch (Exception e) {
            // If Redis is unavailable, allow the request through (fail-open for availability)
            log.warn("Rate limiting failed (Redis unavailable): {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/actuator/")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/api-docs")
                || path.startsWith("/api/webhooks/");
    }
}
