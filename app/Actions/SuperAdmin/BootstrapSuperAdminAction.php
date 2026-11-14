<?php

namespace App\Actions\SuperAdmin;

use App\Enums\UserStatus;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class BootstrapSuperAdminAction
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    /**
     * Idempotently bootstrap the SuperAdmin account.
     *
     * @return array{user: User, created: bool, password: ?string}
     */
    public function execute(?string $customEmail = null, ?string $customPassword = null): array
    {
        $email = strtolower(trim($customEmail ?? config('app.superadmin_email', env('SUPERADMIN_EMAIL', 'dytech98@gmail.com'))));

        return DB::transaction(function () use ($email, $customPassword): array {
            // Ensure the SuperAdmin platform role exists
            setPermissionsTeamId(null);
            $superAdminRole = Role::firstOrCreate([
                'name' => 'SuperAdmin',
                'guard_name' => 'web',
                'tenant_id' => null,
            ]);

            $existing = User::where('email', $email)->first();

            if ($existing) {
                if (! $existing->hasRole('SuperAdmin')) {
                    $existing->assignRole($superAdminRole);
                }

                $this->auditService->log(
                    action: 'superadmin.verified_role',
                    description: 'Verified SuperAdmin role for existing user '.$email,
                    subject: $existing,
                    user: $existing
                );

                return [
                    'user' => $existing,
                    'created' => false,
                    'password' => null,
                ];
            }

            $password = $customPassword ?: env('SUPERADMIN_INITIAL_PASSWORD');
            $generated = false;

            if (empty($password)) {
                $password = Str::password(24, true, true, true, false);
                $generated = true;
            }

            $user = User::create([
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'name' => 'Super Admin',
                'email' => $email,
                'email_verified_at' => now(),
                'password' => Hash::make($password),
                'status' => UserStatus::Active,
                'theme_preference' => 'light',
            ]);

            setPermissionsTeamId(null);
            $user->assignRole($superAdminRole);
            $user->unsetRelation('roles');

            $this->auditService->log(
                action: 'superadmin.bootstrapped',
                description: 'SuperAdmin account initialized for '.$email,
                subject: $user,
                user: $user
            );

            return [
                'user' => $user,
                'created' => true,
                'password' => $generated ? $password : null,
            ];
        });
    }
}
