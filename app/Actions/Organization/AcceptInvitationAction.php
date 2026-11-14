<?php

namespace App\Actions\Organization;

use App\Models\TenantInvitation;
use App\Models\User;
use App\Services\AuditService;
use App\Services\TenantContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class AcceptInvitationAction
{
    public function __construct(
        protected AuditService $auditService,
        protected TenantContext $tenantContext
    ) {}

    /**
     * Accept a pending invitation and attach user to tenant without creating separate subscription.
     */
    public function execute(TenantInvitation $invitation, User $user): void
    {
        if (! $invitation->isPending()) {
            throw ValidationException::withMessages([
                'invitation' => 'This invitation is no longer valid or has expired.',
            ]);
        }

        DB::transaction(function () use ($invitation, $user): void {
            $tenant = $invitation->tenant;

            // Check if already a member
            if (! $tenant->hasMember($user)) {
                $tenant->members()->attach($user->id, [
                    'membership_role' => $invitation->role,
                    'status' => 'active',
                    'joined_at' => now(),
                ]);
            }

            // Ensure Spatie role exists defensively
            Role::firstOrCreate([
                'name' => $invitation->role,
                'guard_name' => 'web',
            ]);

            // Assign Spatie role in tenant scope
            setPermissionsTeamId($tenant->id);
            $user->assignRole($invitation->role);

            // If invited to a specific department, attach user to department
            if ($invitation->department_id) {
                $user->departments()->syncWithoutDetaching([
                    $invitation->department_id => ['role' => $invitation->role],
                ]);
            }

            $invitation->update([
                'status' => 'accepted',
                'accepted_at' => now(),
            ]);

            $this->tenantContext->set($tenant);
            request()->session()->put('active_tenant_id', $tenant->id);

            $this->auditService->log(
                action: 'tenant.invitation_accepted',
                description: "User {$user->email} accepted invitation to \"{$tenant->name}\" as {$invitation->role}",
                subject: $tenant,
                newValues: ['user_id' => $user->id, 'role' => $invitation->role],
                tenant: $tenant,
                user: $user
            );
        });
    }
}
