package com.sentrix.repository;

import com.sentrix.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    Optional<Subscription> findByOrganizationId(UUID organizationId);

    Optional<Subscription> findByRazorpaySubscriptionId(String razorpaySubscriptionId);

    java.util.List<Subscription> findByStatus(com.sentrix.enums.SubscriptionStatus status);
}
