<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'plan_name',
        'billing_cycle',
        'status',
        'scans_limit',
        'scans_used',
        'exams_limit',
        'exams_used',
        'members_limit',
        'starts_at',
        'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'scans_limit' => 'integer',
            'scans_used' => 'integer',
            'exams_limit' => 'integer',
            'exams_used' => 'integer',
            'members_limit' => 'integer',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function canScan(): bool
    {
        return $this->isActive() && $this->scans_used < $this->scans_limit;
    }

    public function canCreateExam(): bool
    {
        return $this->isActive() && $this->exams_used < $this->exams_limit;
    }

    public function canAddMember(int $currentMembersCount): bool
    {
        return $this->isActive() && $currentMembersCount < $this->members_limit;
    }

    public function recordScan(int $count = 1): void
    {
        $this->increment('scans_used', $count);
    }

    public function recordExam(int $count = 1): void
    {
        $this->increment('exams_used', $count);
    }
}
