package com.sentrix.exception;

public class PlanLimitExceededException extends RuntimeException {
    private final String planFeature;
    private final int currentLimit;

    public PlanLimitExceededException(String message, String planFeature, int currentLimit) {
        super(message);
        this.planFeature = planFeature;
        this.currentLimit = currentLimit;
    }

    public String getPlanFeature() { return planFeature; }
    public int getCurrentLimit() { return currentLimit; }
}
