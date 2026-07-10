package com.sentrix.service;

import com.sentrix.dto.request.CreateResourceRequest;
import com.sentrix.dto.response.PageResponse;
import com.sentrix.dto.response.ResourceResponse;
import com.sentrix.entity.Organization;
import com.sentrix.entity.Resource;
import com.sentrix.enums.SensitivityLevel;
import com.sentrix.exception.ResourceNotFoundException;
import com.sentrix.repository.OrganizationRepository;
import com.sentrix.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final OrganizationRepository organizationRepository;

    @Transactional
    public ResourceResponse createResource(UUID orgId, CreateResourceRequest request) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId.toString()));

        Resource resource = Resource.builder()
                .organization(org)
                .name(request.getName())
                .resourceType(request.getResourceType())
                .identifier(request.getIdentifier())
                .sensitivity(request.getSensitivity() != null ? request.getSensitivity() : SensitivityLevel.INTERNAL)
                .description(request.getDescription())
                .metadata(request.getMetadata())
                .build();

        resource = resourceRepository.save(resource);
        log.info("Resource created: {} (id: {}, type: {})", resource.getName(), resource.getId(), resource.getResourceType());

        return toResponse(resource);
    }

    @Transactional(readOnly = true)
    public PageResponse<ResourceResponse> listResources(UUID orgId, Pageable pageable) {
        Page<Resource> page = resourceRepository.findByOrganizationId(orgId, pageable);

        var items = page.getContent().stream()
                .map(this::toResponse)
                .toList();

        return PageResponse.<ResourceResponse>builder()
                .content(items)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public ResourceResponse getResource(UUID orgId, UUID resourceId) {
        Resource resource = findByOrgAndId(orgId, resourceId);
        return toResponse(resource);
    }

    @Transactional
    public ResourceResponse updateResource(UUID orgId, UUID resourceId, CreateResourceRequest request) {
        Resource resource = findByOrgAndId(orgId, resourceId);

        if (request.getName() != null) resource.setName(request.getName());
        if (request.getResourceType() != null) resource.setResourceType(request.getResourceType());
        if (request.getIdentifier() != null) resource.setIdentifier(request.getIdentifier());
        if (request.getSensitivity() != null) resource.setSensitivity(request.getSensitivity());
        if (request.getDescription() != null) resource.setDescription(request.getDescription());
        if (request.getMetadata() != null) resource.setMetadata(request.getMetadata());

        resource = resourceRepository.save(resource);
        log.info("Resource updated: {} (id: {})", resource.getName(), resource.getId());

        return toResponse(resource);
    }

    @Transactional
    public void deleteResource(UUID orgId, UUID resourceId) {
        Resource resource = findByOrgAndId(orgId, resourceId);
        resourceRepository.delete(resource);
        log.info("Resource deleted: {} (id: {})", resource.getName(), resource.getId());
    }

    private Resource findByOrgAndId(UUID orgId, UUID resourceId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", resourceId.toString()));
        if (!resource.getOrganization().getId().equals(orgId)) {
            throw new ResourceNotFoundException("Resource", resourceId.toString());
        }
        return resource;
    }

    private ResourceResponse toResponse(Resource resource) {
        return ResourceResponse.builder()
                .id(resource.getId().toString())
                .name(resource.getName())
                .resourceType(resource.getResourceType())
                .identifier(resource.getIdentifier())
                .sensitivity(resource.getSensitivity().name())
                .description(resource.getDescription())
                .metadata(resource.getMetadata())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }
}
