<?php

namespace App\Actions\Platform;

use App\Enums\UserStatus;
use App\Models\User;
use App\Services\AuditService;
use App\Services\PlatformDashboardService;

class ActivateUserAction
{
    public function __construct(
        protected AuditService $auditService,
        protected PlatformDashboardService $dashboardService
    ) {}

    public function execute(User $targetUser, User $actor): User
    {
        $oldStatus = $targetUser->status->value;

        $targetUser->update([
            'status' => UserStatus::Active,
            'suspension_reason' => null,
            'suspended_at' => null,
        ]);

        $this->auditService->log(
            action: 'platform.user_activated',
            description: "Activated user {$targetUser->email}",
            subject: $targetUser,
            oldValues: ['status' => $oldStatus],
            newValues: ['status' => UserStatus::Active->value],
            user: $actor
        );

        $this->dashboardService->clearCache();

        return $targetUser;
    }
}
