<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Examination extends Model
{
    use BelongsToTenant, HasFactory, SoftDeletes;

    protected $table = 'examinations';

    protected $fillable = [
        'tenant_id',
        'ulid',
        'title',
        'description',
        'question_count',
        'choice_count',
        'points_per_question',
        'total_score',
        'passing_score',
        'passing_percentage',
        'subject_id',
        'class_id',
        'academic_period_id',
        'created_by',
        'exam_date',
        'status',
    ];

    protected $appends = [
        'answered_count',
        'is_answer_key_complete',
        'available_choices',
    ];

    protected static function booted(): void
    {
        static::creating(function (Examination $exam): void {
            if (empty($exam->ulid)) {
                $exam->ulid = (string) Str::ulid();
            }
            if (empty($exam->created_by) && auth()->check()) {
                $exam->created_by = auth()->id();
            }
            if ($exam->total_score <= 0 && $exam->question_count > 0) {
                $exam->total_score = $exam->question_count * $exam->points_per_question;
            }
        });

        static::created(function (Examination $exam): void {
            $exam->syncQuestions();
        });
    }

    protected function casts(): array
    {
        return [
            'question_count' => 'integer',
            'choice_count' => 'integer',
            'points_per_question' => 'float',
            'total_score' => 'float',
            'passing_score' => 'float',
            'passing_percentage' => 'float',
            'exam_date' => 'date',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    public function resolveRouteBindingQuery($query, $value, $field = null)
    {
        $field = $field ?? $this->getRouteKeyName();

        if ($field === 'ulid') {
            return $query->where(function ($subQuery) use ($value): void {
                $subQuery->where('ulid', $value);
                if (is_numeric($value)) {
                    $subQuery->orWhere('id', (int) $value);
                }
            });
        }

        return parent::resolveRouteBindingQuery($query, $value, $field);
    }

    protected function answeredCount(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->relationLoaded('questions')) {
                    return $this->questions->filter(fn ($q) => ! empty($q->correct_answer))->count();
                }

                return $this->questions()->whereNotNull('correct_answer')->where('correct_answer', '!=', '')->count();
            }
        );
    }

    protected function isAnswerKeyComplete(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->answered_count === $this->question_count && $this->question_count > 0
        );
    }

    protected function availableChoices(): Attribute
    {
        return Attribute::make(
            get: function () {
                $all = ['A', 'B', 'C', 'D', 'E'];

                return array_slice($all, 0, max(2, min(5, $this->choice_count)));
            }
        );
    }

    public function syncQuestions(): void
    {
        $existing = $this->questions()->pluck('question_number')->flip()->all();
        $records = [];
        $tenantId = $this->tenant_id;

        for ($num = 1; $num <= $this->question_count; $num++) {
            if (! isset($existing[$num])) {
                $records[] = [
                    'tenant_id' => $tenantId,
                    'examination_id' => $this->id,
                    'question_number' => $num,
                    'correct_answer' => null,
                    'points' => $this->points_per_question > 0 ? $this->points_per_question : 1.00,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        if (! empty($records)) {
            ExaminationQuestion::insert($records);
        }

        $this->questions()->where('question_number', '>', $this->question_count)->delete();
        $this->recalculateTotalScore();
    }

    public function recalculateTotalScore(): float
    {
        $total = (float) $this->questions()->sum('points');
        if ($total <= 0 && $this->question_count > 0) {
            $total = (float) ($this->question_count * $this->points_per_question);
        }
        $this->update(['total_score' => $total]);

        return $total;
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isReady(): bool
    {
        return $this->status === 'ready';
    }

    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }

    public function questions(): HasMany
    {
        return $this->hasMany(ExaminationQuestion::class, 'examination_id')->orderBy('question_number');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function academicPeriod(): BelongsTo
    {
        return $this->belongsTo(AcademicPeriod::class, 'academic_period_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function answerSheets(): HasMany
    {
        return $this->hasMany(OmrAnswerSheet::class, 'examination_id');
    }

    public function sheetBatches(): HasMany
    {
        return $this->hasMany(OmrSheetBatch::class, 'examination_id');
    }
}
