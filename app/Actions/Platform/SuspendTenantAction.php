<?php

namespace App\Actions\Platform;

use App\Enums\TenantStatus;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AuditService;
use App\Services\PlatformDashboardService;

class SuspendTenantAction
{
    public function __construct(
        protected AuditService $auditService,
        protected PlatformDashboardService $dashboardService
    ) {}

    public function execute(Tenant $tenant, User $actor, string $reason): Tenant
    {
        $oldStatus = $tenant->status->value;

        $tenant->update([
            'status' => TenantStatus::Suspended,
            'suspension_reason' => $reason,
            'suspended_at' => now(),
        ]);

        $this->auditService->log(
            action: 'platform.tenant_suspended',
            description: "Suspended workspace \"{$tenant->name}\" ({$tenant->type->value}). Reason: {$reason}",
            subject: $tenant,
            oldValues: ['status' => $oldStatus],
            newValues: [
                'status' => TenantStatus::Suspended->value,
                'suspension_reason' => $reason,
                'suspended_at' => now()->toIso8601String(),
            ],
            tenant: $tenant,
            user: $actor
        );

        $this->dashboardService->clearCache();

        return $tenant;
    }
}
