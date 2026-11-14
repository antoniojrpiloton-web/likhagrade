<?php

namespace App\Policies;

use App\Enums\TenantRole;
use App\Models\Tenant;
use App\Models\User;

class TenantPolicy
{
    /**
     * Determine whether the user can view the tenant.
     */
    public function view(User $user, Tenant $tenant): bool
    {
        return $user->isSuperAdmin() || $user->hasAccessToTenant($tenant);
    }

    /**
     * Determine whether the user can update the tenant settings.
     */
    public function update(User $user, Tenant $tenant): bool
    {
        if ($user->isSuperAdmin() || $tenant->owner_id === $user->id) {
            return true;
        }

        $role = $user->roleInTenant($tenant);

        return $role === TenantRole::Admin->value;
    }

    /**
     * Determine whether the user can manage members in the tenant.
     */
    public function manageMembers(User $user, Tenant $tenant): bool
    {
        if ($user->isSuperAdmin() || $tenant->owner_id === $user->id) {
            return true;
        }

        $role = $user->roleInTenant($tenant);

        return $role === TenantRole::Admin->value;
    }

    /**
     * Determine whether the user can switch to the tenant.
     */
    public function switch(User $user, Tenant $tenant): bool
    {
        return $tenant->isActive() && $user->hasAccessToTenant($tenant);
    }

    /**
     * Determine whether the user can delete the tenant.
     */
    public function delete(User $user, Tenant $tenant): bool
    {
        return $user->isSuperAdmin() || $tenant->owner_id === $user->id;
    }
}
