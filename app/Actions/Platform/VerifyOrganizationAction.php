<?php

namespace App\Actions\Platform;

use App\Models\Tenant;
use App\Models\User;
use App\Services\AuditService;
use App\Services\PlatformDashboardService;
use Illuminate\Validation\ValidationException;

class VerifyOrganizationAction
{
    public function __construct(
        protected AuditService $auditService,
        protected PlatformDashboardService $dashboardService
    ) {}

    public function verify(Tenant $tenant, User $actor): Tenant
    {
        if (! $tenant->isOrganization()) {
            throw ValidationException::withMessages([
                'tenant' => 'Only educational institution organization tenants can be verified.',
            ]);
        }

        $tenant->update([
            'is_verified_institution' => true,
            'verification_status' => 'verified',
        ]);

        $this->auditService->log(
            action: 'platform.organization_verified',
            description: "Approved and verified educational institution \"{$tenant->name}\"",
            subject: $tenant,
            oldValues: ['is_verified_institution' => false, 'verification_status' => 'pending'],
            newValues: ['is_verified_institution' => true, 'verification_status' => 'verified'],
            tenant: $tenant,
            user: $actor
        );

        $this->dashboardService->clearCache();

        return $tenant;
    }

    public function revoke(Tenant $tenant, User $actor, ?string $reason = null): Tenant
    {
        if (! $tenant->isOrganization()) {
            throw ValidationException::withMessages([
                'tenant' => 'Only educational institution organization tenants can have verification changed.',
            ]);
        }

        $tenant->update([
            'is_verified_institution' => false,
            'verification_status' => 'rejected',
        ]);

        $this->auditService->log(
            action: 'platform.organization_verification_revoked',
            description: "Revoked verification for institution \"{$tenant->name}\"".($reason ? ". Reason: {$reason}" : ''),
            subject: $tenant,
            oldValues: ['is_verified_institution' => true, 'verification_status' => 'verified'],
            newValues: ['is_verified_institution' => false, 'verification_status' => 'rejected'],
            tenant: $tenant,
            user: $actor
        );

        $this->dashboardService->clearCache();

        return $tenant;
    }
}
