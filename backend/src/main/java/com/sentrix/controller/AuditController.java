package com.sentrix.controller;

import com.sentrix.dto.response.AuditLogResponse;
import com.sentrix.dto.response.PageResponse;
import com.sentrix.security.SecurityUtils;
import com.sentrix.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
@Tag(name = "Audit", description = "Audit log endpoints")
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @Operation(summary = "List audit logs")
    public ResponseEntity<PageResponse<AuditLogResponse>> listAuditLogs(
            @RequestParam(required = false) UUID agentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(
                auditService.listAuditLogs(SecurityUtils.getCurrentUserOrgId(), agentId, PageRequest.of(page, size))
        );
    }

    @GetMapping("/chain/verify")
    @Operation(summary = "Verify audit log hash chain integrity")
    public ResponseEntity<Map<String, Object>> verifyChain() {
        return ResponseEntity.ok(auditService.verifyChain(SecurityUtils.getCurrentUserOrgId()));
    }
}
