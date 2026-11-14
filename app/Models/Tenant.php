<?php

namespace App\Models;

use App\Enums\TenantStatus;
use App\Enums\TenantType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ulid',
        'name',
        'slug',
        'type',
        'owner_id',
        'status',
        'suspension_reason',
        'suspended_at',
        'org_type',
        'contact_person',
        'contact_email',
        'contact_number',
        'address',
        'logo_url',
        'is_verified_institution',
        'verification_status',
    ];

    protected function casts(): array
    {
        return [
            'type' => TenantType::class,
            'status' => TenantStatus::class,
            'suspended_at' => 'datetime',
            'is_verified_institution' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Tenant $tenant): void {
            if (empty($tenant->ulid)) {
                $tenant->ulid = (string) Str::ulid();
            }
            if (empty($tenant->slug)) {
                $baseSlug = Str::slug($tenant->name);
                $slug = $baseSlug;
                $counter = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = $baseSlug.'-'.$counter++;
                }
                $tenant->slug = $slug;
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tenant_user')
            ->using(TenantUser::class)
            ->withPivot(['id', 'membership_role', 'status', 'joined_at'])
            ->withTimestamps();
    }

    public function tenantUsers(): HasMany
    {
        return $this->hasMany(TenantUser::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(TenantInvitation::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function academicPeriods(): HasMany
    {
        return $this->hasMany(AcademicPeriod::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function examinations(): HasMany
    {
        return $this->hasMany(Examination::class);
    }

    public function isActive(): bool
    {
        return $this->status === TenantStatus::Active;
    }

    public function isSuspended(): bool
    {
        return $this->status === TenantStatus::Suspended;
    }

    public function isInactive(): bool
    {
        return $this->status === TenantStatus::Inactive;
    }

    public function isPersonal(): bool
    {
        return $this->type === TenantType::Personal;
    }

    public function isOrganization(): bool
    {
        return $this->type === TenantType::Organization;
    }

    public function isVerifiedInstitution(): bool
    {
        return (bool) $this->is_verified_institution;
    }

    public function hasMember(User|int $user): bool
    {
        $userId = $user instanceof User ? $user->id : $user;

        return $this->members()
            ->where('user_id', $userId)
            ->where('tenant_user.status', 'active')
            ->exists();
    }

    public function getMembershipOf(User|int $user): ?TenantUser
    {
        $userId = $user instanceof User ? $user->id : $user;

        return $this->tenantUsers()
            ->where('user_id', $userId)
            ->first();
    }

    public function getOrCreateDefaultSubscription(): Subscription
    {
        return $this->subscription()->firstOrCreate([], [
            'plan_name' => $this->isOrganization() ? 'Institution Starter' : 'Free Tier',
            'billing_cycle' => 'free',
            'status' => 'active',
            'scans_limit' => $this->isOrganization() ? 5000 : 100,
            'scans_used' => 0,
            'exams_limit' => $this->isOrganization() ? 50 : 10,
            'exams_used' => 0,
            'members_limit' => $this->isOrganization() ? 25 : 1,
            'starts_at' => now(),
        ]);
    }
}
