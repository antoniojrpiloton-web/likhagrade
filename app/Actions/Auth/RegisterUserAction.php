<?php

namespace App\Actions\Auth;

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

class RegisterUserAction
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Register a new user and bootstrap their personal tenant workspace.
     *
     * @param  array{first_name: string, last_name: string, email: string, password: string, theme_preference?: string}  $data
     */
    public function execute(array $data): User
    {
        return DB::transaction(function () use ($data): User {
            $fullName = trim($data['first_name'].' '.$data['last_name']);

            $user = User::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'name' => $fullName,
                'email' => strtolower(trim($data['email'])),
                'password' => Hash::make($data['password']),
                'status' => UserStatus::Active,
                'theme_preference' => $data['theme_preference'] ?? 'light',
            ]);

            $workspaceName = $data['first_name'].' '.$data['last_name'].' Workspace';

            $tenant = Tenant::create([
                'name' => $workspaceName,
                'type' => TenantType::Personal,
                'owner_id' => $user->id,
                'status' => TenantStatus::Active,
            ]);

            $tenant->members()->attach($user->id, [
                'membership_role' => TenantRole::Admin->value,
                'status' => 'active',
                'joined_at' => now(),
            ]);

            // Ensure Spatie role exists defensively
            Role::firstOrCreate([
                'name' => TenantRole::Admin->value,
                'guard_name' => 'web',
            ]);

            // Assign Spatie Tenant Admin role within this tenant's scope
            setPermissionsTeamId($tenant->id);
            $user->assignRole(TenantRole::Admin->value);

            // Create initial individual subscription (owned by tenant)
            $tenant->getOrCreateDefaultSubscription();

            event(new Registered($user));

            $this->auditService->log(
                action: 'auth.registered',
                description: 'User registered with personal workspace "'.$tenant->name.'"',
                subject: $user,
                oldValues: null,
                newValues: ['email' => $user->email, 'tenant_id' => $tenant->id],
                tenant: $tenant,
                user: $user
            );

            return $user;
        });
    }
}
