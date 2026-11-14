<?php

namespace App\Actions\Organization;

use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InviteTeacherAction
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Create a secure invitation for an instructor or teacher.
     */
    public function execute(
        Tenant $tenant,
        User $inviter,
        string $email,
        string $role = 'Teacher',
        ?int $departmentId = null
    ): TenantInvitation {
        $email = strtolower(trim($email));

        // Check if user is already an active member of this tenant
        $existingUser = User::where('email', $email)->first();
        if ($existingUser && $tenant->hasMember($existingUser)) {
            throw ValidationException::withMessages([
                'email' => 'This user is already an active member of this organization.',
            ]);
        }

        // Cancel any previous pending invitation for this email in this tenant
        $tenant->invitations()
            ->where('email', $email)
            ->where('status', 'pending')
            ->delete();

        $token = Str::random(48);

        $invitation = $tenant->invitations()->create([
            'department_id' => $departmentId,
            'email' => $email,
            'role' => $role,
            'token' => $token,
            'invited_by_user_id' => $inviter->id,
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        $this->auditService->log(
            action: 'tenant.invitation_created',
            description: "Invited {$email} as {$role} to \"{$tenant->name}\"",
            subject: $invitation,
            newValues: ['email' => $email, 'role' => $role, 'tenant_id' => $tenant->id],
            tenant: $tenant,
            user: $inviter
        );

        return $invitation;
    }
}
