<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subject extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $table = 'subjects';

    protected $fillable = [
        'tenant_id',
        'code',
        'name',
        'description',
        'color',
        'is_archived',
    ];

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
        ];
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'subject_id');
    }

    public function examinations(): HasMany
    {
        return $this->hasMany(Examination::class, 'subject_id');
    }
}
