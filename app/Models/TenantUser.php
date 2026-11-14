<?php

namespace App\Models;

use App\Enums\TenantRole;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class TenantUser extends Pivot
{
    /**
     * The table associated with the pivot model.
     *
     * @var string
     */
    protected $table = 'tenant_user';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = true;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'membership_role',
        'status',
        'joined_at',
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isAdmin(): bool
    {
        return $this->membership_role === TenantRole::Admin->value;
    }

    public function isTeacher(): bool
    {
        return $this->membership_role === TenantRole::Teacher->value;
    }

    public function isInstructor(): bool
    {
        return $this->membership_role === TenantRole::Instructor->value;
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
