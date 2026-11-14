<?php

namespace App\Actions\Platform;

use App\Enums\TenantStatus;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AuditService;
use App\Services\PlatformDashboardService;

class ActivateTenantAction
{
    public function __construct(
        protected AuditService $auditService,
        protected PlatformDashboardService $dashboardService
    ) {}

    public function execute(Tenant $tenant, User $actor): Tenant
    {
        $oldStatus = $tenant->status->value;

        $tenant->update([
            'status' => TenantStatus::Active,
            'suspension_reason' => null,
            'suspended_at' => null,
        ]);

        $this->auditService->log(
            action: 'platform.tenant_activated',
            description: "Activated workspace \"{$tenant->name}\" ({$tenant->type->value})",
            subject: $tenant,
            oldValues: ['status' => $oldStatus],
            newValues: ['status' => TenantStatus::Active->value],
            tenant: $tenant,
            user: $actor
        );

        $this->dashboardService->clearCache();

        return $tenant;
    }
}
