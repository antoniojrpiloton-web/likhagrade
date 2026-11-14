<?php

namespace App\Services;

use App\Models\Tenant;
use Spatie\Permission\PermissionRegistrar;

class TenantContext
{
    protected ?Tenant $tenant = null;

    /**
     * Get the currently active tenant.
     */
    public function get(): ?Tenant
    {
        return $this->tenant;
    }

    /**
     * Get the ID of the currently active tenant.
     */
    public function id(): ?int
    {
        return $this->tenant?->id;
    }

    /**
     * Get the public ULID of the currently active tenant.
     */
    public function ulid(): ?string
    {
        return $this->tenant?->ulid;
    }

    /**
     * Set the currently active tenant.
     */
    public function set(?Tenant $tenant): void
    {
        $this->tenant = $tenant;

        if (class_exists(PermissionRegistrar::class)) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($tenant?->id);
        }
    }

    /**
     * Determine if a tenant is currently set.
     */
    public function hasTenant(): bool
    {
        return $this->tenant !== null;
    }

    /**
     * Determine if a tenant is currently set.
     */
    public function check(): bool
    {
        return $this->hasTenant();
    }

    /**
     * Reset the active tenant to null.
     */
    public function forget(): void
    {
        $this->set(null);
    }
}
