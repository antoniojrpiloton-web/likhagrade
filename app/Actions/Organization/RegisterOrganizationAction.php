<?php

namespace App\Actions\Organization;

use App\Enums\TenantRole;
use App\Enums\TenantStatus;
use App\Enums\TenantType;
use App\Enums\UserStatus;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class RegisterOrganizationAction
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Register a new educational institution organization and set up its owner.
     *
     * @param  array{
     *     org_name: string,
     *     org_type: string,
     *     contact_person: string,
     *     contact_email: string,
     *     contact_number?: ?string,
     *     address?: ?string,
     *     logo_url?: ?string,
     *     first_name?: ?string,
     *     last_name?: ?string,
     *     email?: ?string,
     *     password?: ?string,
     * }  $data
     */
    public function execute(array $data, ?User $currentUser = null): array
    {
        return DB::transaction(function () use ($data, $currentUser): array {
            $user = $currentUser;

            if (! $user) {
                // If registering a brand new user along with the organization
                $fullName = trim(($data['first_name'] ?? 'Org').' '.($data['last_name'] ?? 'Admin'));
                $user = User::create([
                    'first_name' => $data['first_name'] ?? $data['contact_person'],
                    'last_name' => $data['last_name'] ?? 'Admin',
                    'name' => $fullName ?: $data['contact_person'],
                    'email' => strtolower(trim($data['email'] ?? $data['contact_email'])),
                    'password' => Hash::make($data['password']),
                    'status' => UserStatus::Active,
                    'theme_preference' => 'light',
                ]);

                event(new Registered($user));
            }

            // Create institutional tenant
            $tenant = Tenant::create([
                'name' => $data['org_name'],
                'type' => TenantType::Organization,
                'org_type' => $data['org_type'] ?? 'University',
                'contact_person' => $data['contact_person'],
                'contact_email' => strtolower(trim($data['contact_email'])),
                'contact_number' => $data['contact_number'] ?? null,
                'address' => $data['address'] ?? null,
                'logo_url' => $data['logo_url'] ?? null,
                'owner_id' => $user->id,
                'status' => TenantStatus::Active,
                'is_verified_institution' => false,
                'verification_status' => 'pending',
            ]);

            // Attach user as Organization Owner
            $tenant->members()->attach($user->id, [
                'membership_role' => TenantRole::OrganizationOwner->value,
                'status' => 'active',
                'joined_at' => now(),
            ]);

            // Ensure Spatie role exists defensively
            Role::firstOrCreate([
                'name' => TenantRole::OrganizationOwner->value,
                'guard_name' => 'web',
            ]);

            // Assign Spatie role in tenant scope
            setPermissionsTeamId($tenant->id);
            $user->assignRole(TenantRole::OrganizationOwner->value);

            // Create Organization Subscription (Shared organizational plan)
            $subscription = $tenant->subscription()->create([
                'plan_name' => 'Institutional Trial',
                'billing_cycle' => 'monthly',
                'status' => 'active',
                'scans_limit' => 5000,
                'scans_used' => 0,
                'exams_limit' => 50,
                'exams_used' => 0,
                'members_limit' => 50,
                'starts_at' => now(),
                'ends_at' => now()->addDays(30),
            ]);

            $this->auditService->log(
                action: 'organization.registered',
                description: 'Registered organization "'.$tenant->name.'" (Type: '.$tenant->org_type.')',
                subject: $tenant,
                oldValues: null,
                newValues: [
                    'tenant_id' => $tenant->id,
                    'org_name' => $tenant->name,
                    'org_type' => $tenant->org_type,
                    'owner_id' => $user->id,
                ],
                tenant: $tenant,
                user: $user
            );

            return [
                'user' => $user,
                'tenant' => $tenant,
                'subscription' => $subscription,
            ];
        });
    }
}
