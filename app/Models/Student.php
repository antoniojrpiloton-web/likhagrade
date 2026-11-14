<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $table = 'students';

    protected $fillable = [
        'tenant_id',
        'student_id',
        'student_id_number',
        'first_name',
        'last_name',
        'middle_name',
        'email',
        'gender',
        'contact_number',
        'metadata',
        'is_archived',
    ];

    protected $appends = [
        'full_name',
        'student_id_number',
    ];

    protected static function booted(): void
    {
        static::creating(function (Student $student): void {
            if (empty($student->student_id) && ! empty($student->tenant_id)) {
                $student->student_id = static::generateUniqueStudentId($student->tenant_id);
            }
        });
    }

    public static function generateUniqueStudentId(int $tenantId): string
    {
        $year = date('Y');
        $latest = static::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('student_id', 'like', "STD-{$year}-%")
            ->orderByDesc('id')
            ->first();

        $nextNumber = 1;
        if ($latest && preg_match('/-(\d+)$/', (string) $latest->student_id, $matches)) {
            $nextNumber = ((int) $matches[1]) + 1;
        }

        do {
            $candidate = sprintf('STD-%s-%04d', $year, $nextNumber);
            $exists = static::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->where('student_id', $candidate)
                ->exists();
            $nextNumber++;
        } while ($exists);

        return $candidate;
    }

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'is_archived' => 'boolean',
        ];
    }

    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => implode(' ', array_filter([
                $this->first_name,
                $this->middle_name,
                $this->last_name,
            ], fn ($val) => ! empty($val) || $val === '0'))
        );
    }

    protected function studentIdNumber(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->student_id,
            set: fn ($value) => ['student_id' => $value],
        );
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(ClassEnrollment::class, 'student_id');
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'class_enrollments', 'student_id', 'class_id')
            ->using(ClassEnrollment::class)
            ->wherePivotNull('deleted_at')
            ->withPivot(['id', 'status', 'enrolled_at'])
            ->withTimestamps();
    }

    public function answerSheets(): HasMany
    {
        return $this->hasMany(OmrAnswerSheet::class, 'student_id');
    }
}
