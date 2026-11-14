<?php

namespace App\Actions\Platform;

use App\Enums\UserStatus;
use App\Models\User;
use App\Services\AuditService;
use App\Services\PlatformDashboardService;
use Illuminate\Validation\ValidationException;

class SuspendUserAction
{
    public function __construct(
        protected AuditService $auditService,
        protected PlatformDashboardService $dashboardService
    ) {}

    public function execute(User $targetUser, User $actor, string $reason): User
    {
        if ($targetUser->id === $actor->id) {
            throw ValidationException::withMessages([
                'user' => 'You cannot suspend your own account.',
            ]);
        }

        if ($targetUser->isSuperAdmin()) {
            throw ValidationException::withMessages([
                'user' => 'SuperAdmin platform administrators cannot be suspended.',
            ]);
        }

        $oldStatus = $targetUser->status->value;

        $targetUser->update([
            'status' => UserStatus::Suspended,
            'suspension_reason' => $reason,
            'suspended_at' => now(),
        ]);

        $this->auditService->log(
            action: 'platform.user_suspended',
            description: "Suspended user {$targetUser->email}. Reason: {$reason}",
            subject: $targetUser,
            oldValues: ['status' => $oldStatus],
            newValues: [
                'status' => UserStatus::Suspended->value,
                'suspension_reason' => $reason,
                'suspended_at' => now()->toIso8601String(),
            ],
            user: $actor
        );

        $this->dashboardService->clearCache();

        return $targetUser;
    }
}
