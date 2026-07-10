package com.sentrix.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {
    private String accessSecret;
    private String refreshSecret;
    private long accessExpiration;   // milliseconds
    private long refreshExpiration;  // milliseconds
}
