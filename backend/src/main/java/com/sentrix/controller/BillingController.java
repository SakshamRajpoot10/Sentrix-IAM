package com.sentrix.controller;

import com.sentrix.dto.request.SubscribeRequest;
import com.sentrix.dto.request.VerifyPaymentRequest;
import com.sentrix.dto.response.PlanResponse;
import com.sentrix.security.SecurityUtils;
import com.sentrix.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
@Tag(name = "Billing", description = "Subscription and billing endpoints")
public class BillingController {

    private final BillingService billingService;

    @GetMapping("/plans")
    @Operation(summary = "Get available plans")
    public ResponseEntity<List<PlanResponse>> getPlans() {
        return ResponseEntity.ok(billingService.getPlans());
    }

    @PostMapping("/create-subscription")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Create a new subscription")
    public ResponseEntity<Map<String, Object>> createSubscription(@Valid @RequestBody SubscribeRequest request) {
        return ResponseEntity.ok(billingService.createSubscription(
                SecurityUtils.getCurrentUserOrgId(), request.getPlanId()
        ));
    }

    @PostMapping("/verify-payment")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @Operation(summary = "Verify Razorpay payment")
    public ResponseEntity<Map<String, Object>> verifyPayment(@Valid @RequestBody VerifyPaymentRequest request) {
        return ResponseEntity.ok(billingService.verifyPayment(
                SecurityUtils.getCurrentUserOrgId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySubscriptionId(),
                request.getRazorpaySignature()
        ));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Get billing and payment history")
    public ResponseEntity<List<Map<String, Object>>> getBillingHistory() {
        return ResponseEntity.ok(billingService.getBillingHistory(
                SecurityUtils.getCurrentUserOrgId()
        ));
    }

    @GetMapping("/subscription-status/{subscriptionId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'VIEWER')")
    @Operation(summary = "Get subscription status")
    public ResponseEntity<Map<String, Object>> getSubscriptionStatus(@PathVariable String subscriptionId) {
        return ResponseEntity.ok(billingService.getSubscriptionStatus(
                SecurityUtils.getCurrentUserOrgId(),
                subscriptionId
        ));
    }

    @GetMapping("/admin/pending-subscriptions")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get all pending subscriptions awaiting manual UPI verification")
    public ResponseEntity<List<Map<String, Object>>> getPendingSubscriptions() {
        return ResponseEntity.ok(billingService.getPendingSubscriptions());
    }

    @PostMapping("/admin/approve-subscription/{subscriptionId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Approve manual UPI payment and activate subscription")
    public ResponseEntity<Map<String, String>> approveSubscription(@PathVariable UUID subscriptionId) {
        billingService.approveSubscription(subscriptionId);
        return ResponseEntity.ok(Map.of("message", "Subscription successfully activated"));
    }

    @PostMapping("/admin/reject-subscription/{subscriptionId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Reject manual UPI payment and cancel subscription")
    public ResponseEntity<Map<String, String>> rejectSubscription(@PathVariable UUID subscriptionId) {
        billingService.rejectSubscription(subscriptionId);
        return ResponseEntity.ok(Map.of("message", "Subscription successfully rejected"));
    }
}
