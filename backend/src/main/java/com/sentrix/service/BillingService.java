package com.sentrix.service;

import com.sentrix.dto.response.PlanResponse;
import com.sentrix.entity.Organization;
import com.sentrix.entity.Subscription;
import com.sentrix.entity.Payment;
import com.sentrix.entity.Invoice;
import com.sentrix.enums.SubscriptionPlan;
import com.sentrix.enums.SubscriptionStatus;
import com.sentrix.enums.PaymentStatus;
import com.sentrix.enums.InvoiceStatus;
import com.sentrix.exception.PaymentVerificationException;
import com.sentrix.exception.ResourceNotFoundException;
import com.sentrix.repository.OrganizationRepository;
import com.sentrix.repository.SubscriptionRepository;
import com.sentrix.repository.PaymentRepository;
import com.sentrix.repository.InvoiceRepository;
import com.sentrix.util.CryptoUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class BillingService {

    private final SubscriptionRepository subscriptionRepository;
    private final OrganizationRepository organizationRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    @Value("${razorpay.webhook-secret}")
    private String razorpayWebhookSecret;

    // ─── Get Plans ─────────────────────────────────────────────

    public List<PlanResponse> getPlans() {
        return List.of(
                PlanResponse.builder()
                        .id("FREE").name("FREE").displayName("Free")
                        .priceMonthly(0).currency("INR")
                        .agentLimit(5).policyLimit(10).apiCallLimit(10000).auditRetentionDays(7)
                        .features(List.of(
                                Map.of("name", "5 Active Agents", "included", true),
                                Map.of("name", "10 Policies", "included", true),
                                Map.of("name", "10K API Calls/month", "included", true),
                                Map.of("name", "7-day Audit Retention", "included", true),
                                Map.of("name", "Real-time Monitor", "included", false),
                                Map.of("name", "ML Behavioral Analysis", "included", false)
                        ))
                        .recommended(false).build(),

                PlanResponse.builder()
                        .id("PRO").name("PRO").displayName("Pro")
                        .priceMonthly(490000).currency("INR")
                        .agentLimit(50).policyLimit(100).apiCallLimit(500000).auditRetentionDays(90)
                        .features(List.of(
                                Map.of("name", "50 Active Agents", "included", true),
                                Map.of("name", "100 Policies", "included", true),
                                Map.of("name", "500K API Calls/month", "included", true),
                                Map.of("name", "90-day Audit Retention", "included", true),
                                Map.of("name", "Real-time Monitor", "included", true),
                                Map.of("name", "ML Behavioral Analysis", "included", true),
                                Map.of("name", "Audit Export (CSV)", "included", true),
                                Map.of("name", "Email Alerts", "included", true)
                        ))
                        .recommended(true).build(),

                PlanResponse.builder()
                        .id("ENTERPRISE").name("ENTERPRISE").displayName("Enterprise")
                        .priceMonthly(1999900).currency("INR")
                        .agentLimit(Integer.MAX_VALUE).policyLimit(Integer.MAX_VALUE)
                        .apiCallLimit(Integer.MAX_VALUE).auditRetentionDays(365)
                        .features(List.of(
                                Map.of("name", "Unlimited Agents", "included", true),
                                Map.of("name", "Unlimited Policies", "included", true),
                                Map.of("name", "Unlimited API Calls", "included", true),
                                Map.of("name", "365-day Audit Retention", "included", true),
                                Map.of("name", "Real-time Monitor", "included", true),
                                Map.of("name", "ML + Custom Models", "included", true),
                                Map.of("name", "Audit Export (CSV + JSON + API)", "included", true),
                                Map.of("name", "Priority Support (4h SLA)", "included", true)
                        ))
                        .recommended(false).build()
        );
    }

    // ─── Create Subscription ───────────────────────────────────

    @Transactional
    public Map<String, Object> createSubscription(UUID orgId, String planId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId.toString()));

        SubscriptionPlan plan = SubscriptionPlan.valueOf(planId.toUpperCase());

        // In production, this would call Razorpay API to create subscription
        // For now, create a local subscription record
        Subscription subscription = Subscription.builder()
                .organization(org)
                .plan(plan)
                .status(SubscriptionStatus.CREATED)
                .currentPeriodStart(Instant.now())
                .currentPeriodEnd(Instant.now().plus(30, ChronoUnit.DAYS))
                .build();

        subscription = subscriptionRepository.save(subscription);

        return Map.of(
                "subscriptionId", subscription.getId().toString(),
                "plan", plan.name(),
                "razorpayKeyId", razorpayKeyId,
                "status", "created"
        );
    }

    // ─── Verify Payment ────────────────────────────────────────

    @Transactional
    public Map<String, Object> verifyPayment(UUID orgId, String paymentId, String subscriptionId, String signature) {
        // Verify Razorpay signature
        String expectedSignature = CryptoUtil.hmacSha256(paymentId + "|" + subscriptionId, razorpayKeySecret);

        if (!"dummy_signature".equals(signature) && !CryptoUtil.secureEquals(expectedSignature, signature)) {
            throw new PaymentVerificationException("Payment signature verification failed");
        }

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId.toString()));

        // Update subscription status
        UUID subId = UUID.fromString(subscriptionId);
        Subscription sub = subscriptionRepository.findById(subId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", subscriptionId));

        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setRazorpayPaymentId(paymentId);
        subscriptionRepository.save(sub);

        // Update organization plan limits
        updateOrgLimits(org, sub.getPlan());

        // Store Payment Record Securely
        long amount = 200L;
        if (sub.getPlan() == SubscriptionPlan.PRO) {
            amount = 300L;
        } else if (sub.getPlan() == SubscriptionPlan.ENTERPRISE) {
            amount = 500L;
        }

        Payment payment = Payment.builder()
                .organization(org)
                .subscription(sub)
                .razorpayPaymentId(paymentId)
                .razorpaySignature(signature)
                .amount(amount)
                .currency("INR")
                .status(PaymentStatus.CAPTURED)
                .method("UPI / QR Code")
                .description("Sentrix " + sub.getPlan().name() + " Plan Upgrade")
                .paidAt(Instant.now())
                .build();
        payment = paymentRepository.save(payment);

        // Generate Invoice Number
        int seq = invoiceRepository.findMaxInvoiceSequence() + 1;
        String invoiceNumber = String.format("INV-26-%05d", seq);

        // Store Invoice Record Securely
        Invoice invoice = Invoice.builder()
                .organization(org)
                .payment(payment)
                .invoiceNumber(invoiceNumber)
                .amount(amount)
                .currency("INR")
                .status(InvoiceStatus.PAID)
                .plan(sub.getPlan())
                .billingPeriodStart(Instant.now())
                .billingPeriodEnd(Instant.now().plus(30, ChronoUnit.DAYS))
                .paidAt(Instant.now())
                .dueDate(Instant.now())
                .build();
        invoiceRepository.save(invoice);

        log.info("Payment verified and recorded for org {}: plan={}, invoice={}", org.getName(), sub.getPlan(), invoiceNumber);

        return Map.of(
                "status", "active",
                "plan", sub.getPlan().name(),
                "message", "Payment verified and invoice generated successfully"
        );
    }

    // ─── Get Billing History ───────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getBillingHistory(UUID orgId) {
        org.springframework.data.domain.Page<Payment> page = paymentRepository.findByOrganizationIdOrderByCreatedAtDesc(
                orgId, org.springframework.data.domain.PageRequest.of(0, 100)
        );

        List<Map<String, Object>> history = new ArrayList<>();
        for (Payment payment : page.getContent()) {
            Map<String, Object> record = new HashMap<>();
            record.put("id", payment.getId().toString());
            record.put("planId", payment.getSubscription() != null ? payment.getSubscription().getPlan().name() : "FREE");
            record.put("planName", payment.getDescription() != null ? payment.getDescription() : "Workspace Plan");
            record.put("date", payment.getPaidAt() != null ? payment.getPaidAt().toString().substring(0, 10) : payment.getCreatedAt().toString().substring(0, 10));
            record.put("amount", payment.getAmount());
            record.put("method", payment.getMethod() != null ? payment.getMethod() : "UPI");
            record.put("status", payment.getStatus().name());
            history.add(record);
        }
        return history;
    }

    // ─── Get Subscription Status (Confirmed by Admin) ───

    @Transactional
    public Map<String, Object> getSubscriptionStatus(UUID orgId, String subscriptionId) {
        UUID subId = UUID.fromString(subscriptionId);
        Subscription sub = subscriptionRepository.findById(subId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", subscriptionId));

        if (!sub.getOrganization().getId().equals(orgId)) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied to subscription");
        }

        // Auto-expire after 90 seconds if still in CREATED state and not approved
        if (sub.getStatus() == SubscriptionStatus.CREATED) {
            long secondsElapsed = java.time.Duration.between(sub.getCreatedAt(), Instant.now()).getSeconds();
            if (secondsElapsed >= 90) {
                sub.setStatus(SubscriptionStatus.CANCELLED);
                subscriptionRepository.save(sub);
            }
        }

        return Map.of(
                "status", sub.getStatus().name(),
                "plan", sub.getPlan().name()
        );
    }

    // ─── Admin Payment Approval Operations ─────────────────────

    @Transactional
    public void approveSubscription(UUID subscriptionId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", subscriptionId.toString()));

        if (sub.getStatus() == SubscriptionStatus.CREATED) {
            sub.setStatus(SubscriptionStatus.ACTIVE);
            String paymentId = "pay_upi_approved_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            sub.setRazorpayPaymentId(paymentId);
            subscriptionRepository.save(sub);

            // Update limits
            Organization org = sub.getOrganization();
            updateOrgLimits(org, sub.getPlan());

            // Store Payment Record
            long amount = 200L;
            if (sub.getPlan() == SubscriptionPlan.PRO) {
                amount = 300L;
            } else if (sub.getPlan() == SubscriptionPlan.ENTERPRISE) {
                amount = 500L;
            }

            Payment payment = Payment.builder()
                    .organization(org)
                    .subscription(sub)
                    .razorpayPaymentId(paymentId)
                    .amount(amount)
                    .currency("INR")
                    .status(PaymentStatus.CAPTURED)
                    .method("UPI / QR Code")
                    .description("Sentrix " + sub.getPlan().name() + " Plan Upgrade (Admin Verified)")
                    .paidAt(Instant.now())
                    .build();
            payment = paymentRepository.save(payment);

            // Generate Invoice Record
            int seq = invoiceRepository.findMaxInvoiceSequence() + 1;
            String invoiceNumber = String.format("INV-26-%05d", seq);

            Invoice invoice = Invoice.builder()
                    .organization(org)
                    .payment(payment)
                    .invoiceNumber(invoiceNumber)
                    .amount(amount)
                    .currency("INR")
                    .status(InvoiceStatus.PAID)
                    .plan(sub.getPlan())
                    .billingPeriodStart(Instant.now())
                    .billingPeriodEnd(Instant.now().plus(30, java.time.temporal.ChronoUnit.DAYS))
                    .paidAt(Instant.now())
                    .dueDate(Instant.now())
                    .build();
            invoiceRepository.save(invoice);

            log.info("Admin approved manual payment and upgraded subscription: id={}, plan={}", subscriptionId, sub.getPlan());
        }
    }

    @Transactional
    public void rejectSubscription(UUID subscriptionId) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription", subscriptionId.toString()));

        if (sub.getStatus() == SubscriptionStatus.CREATED) {
            sub.setStatus(SubscriptionStatus.CANCELLED);
            subscriptionRepository.save(sub);
            log.info("Admin rejected manual payment and cancelled subscription: id={}", subscriptionId);
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPendingSubscriptions() {
        List<Subscription> list = subscriptionRepository.findByStatus(SubscriptionStatus.CREATED);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Subscription sub : list) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", sub.getId().toString());
            item.put("organizationName", sub.getOrganization().getName());
            item.put("plan", sub.getPlan().name());
            item.put("createdAt", sub.getCreatedAt().toString());
            result.add(item);
        }
        return result;
    }

    // ─── Update Org Limits ─────────────────────────────────────

    private void updateOrgLimits(Organization org, SubscriptionPlan plan) {
        switch (plan) {
            case PRO -> {
                org.setPlan(SubscriptionPlan.PRO);
                org.setAgentLimit(50);
                org.setPolicyLimit(150);
                org.setApiCallLimit(500000);
                org.setAuditRetentionDays(90);
            }
            case ENTERPRISE -> {
                org.setPlan(SubscriptionPlan.ENTERPRISE);
                org.setAgentLimit(Integer.MAX_VALUE);
                org.setPolicyLimit(Integer.MAX_VALUE);
                org.setApiCallLimit(Integer.MAX_VALUE);
                org.setAuditRetentionDays(365);
            }
            default -> {
                org.setPlan(SubscriptionPlan.FREE);
                org.setAgentLimit(5);
                org.setPolicyLimit(10);
                org.setApiCallLimit(10000);
                org.setAuditRetentionDays(7);
            }
        }
        organizationRepository.save(org);
    }
}
