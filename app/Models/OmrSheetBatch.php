<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class OmrSheetBatch extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'examination_id',
        'batch_ulid',
        'mode',
        'template_version',
        'paper_size',
        'quantity',
        'created_by',
        'metadata',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (OmrSheetBatch $batch) {
            if (empty($batch->batch_ulid)) {
                $batch->batch_ulid = (string) Str::ulid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'batch_ulid';
    }

    public function resolveRouteBindingQuery($query, $value, $field = null)
    {
        $field = $field ?? $this->getRouteKeyName();

        if ($field === 'batch_ulid') {
            return $query->where(function ($subQuery) use ($value): void {
                $subQuery->where('batch_ulid', $value);
                if (is_numeric($value)) {
                    $subQuery->orWhere('id', (int) $value);
                }
            });
        }

        return parent::resolveRouteBindingQuery($query, $value, $field);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function examination(): BelongsTo
    {
        return $this->belongsTo(Examination::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function answerSheets(): HasMany
    {
        return $this->hasMany(OmrAnswerSheet::class, 'batch_id');
    }
}
