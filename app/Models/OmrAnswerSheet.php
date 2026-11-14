<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class OmrAnswerSheet extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'examination_id',
        'batch_id',
        'sheet_ulid',
        'qr_payload',
        'mode',
        'student_id',
        'template_version',
        'paper_size',
        'page_number',
        'total_pages',
        'status',
        'layout_metadata',
    ];

    protected $casts = [
        'page_number' => 'integer',
        'total_pages' => 'integer',
        'layout_metadata' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (OmrAnswerSheet $sheet) {
            if (empty($sheet->sheet_ulid)) {
                $sheet->sheet_ulid = (string) Str::ulid();
            }
            if (empty($sheet->qr_payload) && ! empty($sheet->sheet_ulid)) {
                $examUlid = $sheet->examination?->ulid ?? 'EXAM';
                $sheet->qr_payload = "LKG1:{$sheet->sheet_ulid}:{$examUlid}:{$sheet->page_number}:{$sheet->total_pages}";
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'sheet_ulid';
    }

    public function resolveRouteBindingQuery($query, $value, $field = null)
    {
        $field = $field ?? $this->getRouteKeyName();

        if ($field === 'sheet_ulid') {
            return $query->where(function ($subQuery) use ($value): void {
                $subQuery->where('sheet_ulid', $value);
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

    public function batch(): BelongsTo
    {
        return $this->belongsTo(OmrSheetBatch::class, 'batch_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
