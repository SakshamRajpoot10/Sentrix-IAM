package com.sentrix.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class WebClientConfig {

    @Value("${ml.service-url}")
    private String mlServiceUrl;

    @Value("${ml.api-key}")
    private String mlApiKey;

    @Value("${ml.timeout:5000}")
    private int mlTimeout;

    @Bean
    public WebClient mlWebClient() {
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofMillis(mlTimeout));

        return WebClient.builder()
                .baseUrl(mlServiceUrl)
                .defaultHeader("X-ML-API-Key", mlApiKey)
                .defaultHeader("Content-Type", "application/json")
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
