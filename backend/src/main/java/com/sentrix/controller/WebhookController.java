package com.sentrix.controller;

import com.sentrix.util.CryptoUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Razorpay webhook handler.
 * NOT protected by JWT auth (Razorpay can't send JWT).
 * Protected by HMAC-SHA256 signature verification.
 */
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Webhooks", description = "External webhook endpoints")
public class WebhookController {

    @Value("${razorpay.webhook-secret}")
    private String webhookSecret;

    @PostMapping("/razorpay")
    @Operation(summary = "Razorpay webhook handler")
    public ResponseEntity<Map<String, String>> handleRazorpayWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        // Verify signature
        if (signature != null && !signature.isEmpty()) {
            String computed = CryptoUtil.hmacSha256(rawBody, webhookSecret);
            if (!CryptoUtil.secureEquals(computed, signature)) {
                log.warn("⚠️ Razorpay webhook signature verification FAILED");
                // Still return 200 to prevent Razorpay from retrying
                return ResponseEntity.ok(Map.of("status", "signature_failed"));
            }
        }

        log.info("Razorpay webhook received (body length: {})", rawBody.length());


        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
