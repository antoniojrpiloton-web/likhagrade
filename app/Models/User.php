<?php

namespace App\Models;

use App\Enums\TenantRole;
use App\Enums\TenantType;
use App\Enums\UserStatus;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, HasRoles, Notifiable, SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'name',
        'email',
        'google_id',
        'avatar_url',
        'email_verified_at',
        'password',
        'status',
        'suspension_reason',
        'suspended_at',
        'theme_preference',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'suspended_at' => 'datetime',
            'password' => 'hashed',
            'status' => UserStatus::class,
        ];
    }

    public function ownedTenants(): HasMany
    {
        return $this->hasMany(Tenant::class, 'owner_id');
    }

    public function tenants(): BelongsToMany
    {
        return $this->belongsToMany(Tenant::class, 'tenant_user')
            ->using(TenantUser::class)
            ->withPivot(['id', 'membership_role', 'status', 'joined_at'])
            ->withTimestamps();
    }

    public function tenantUsers(): HasMany
    {
        return $this->hasMany(TenantUser::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function tokens(): MorphMany
    {
        return $this->morphMany(PersonalAccessToken::class, 'tokenable');
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'teacher_id');
    }

    public function examinations(): HasMany
    {
        return $this->hasMany(Examination::class, 'created_by');
    }

    public function isSuperAdmin(): bool
    {
        return DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_type', static::class)
            ->where('model_has_roles.model_id', $this->id)
            ->where('roles.name', 'SuperAdmin')
            ->whereNull('model_has_roles.tenant_id')
            ->exists();
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }

    public function isSuspended(): bool
    {
        return $this->status === UserStatus::Suspended;
    }

    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'department_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function sentInvitations(): HasMany
    {
        return $this->hasMany(TenantInvitation::class, 'invited_by_user_id');
    }

    public function personalTenant(): ?Tenant
    {
        return $this->ownedTenants()
            ->where('type', TenantType::Personal)
            ->first();
    }

    public function organizationTenants(): BelongsToMany
    {
        return $this->tenants()
            ->where('type', TenantType::Organization)
            ->where('tenant_user.status', 'active');
    }

    public function hasAccessToTenant(Tenant|int $tenant): bool
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;

        return $this->tenants()
            ->where('tenants.id', $tenantId)
            ->where('tenant_user.status', 'active')
            ->exists();
    }

    public function roleInTenant(Tenant|int $tenant): ?string
    {
        $tenantId = $tenant instanceof Tenant ? $tenant->id : $tenant;

        $membership = $this->tenantUsers()
            ->where('tenant_id', $tenantId)
            ->first();

        return $membership?->membership_role;
    }

    public function hasTenantRole(Tenant|int $tenant, TenantRole|string $role): bool
    {
        $roleValue = $role instanceof TenantRole ? $role->value : $role;

        return $this->roleInTenant($tenant) === $roleValue;
    }
}
