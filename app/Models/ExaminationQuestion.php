<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExaminationQuestion extends Model
{
    use BelongsToTenant, HasFactory;

    protected $table = 'examination_questions';

    protected $fillable = [
        'tenant_id',
        'examination_id',
        'question_number',
        'correct_answer',
        'points',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'question_number' => 'integer',
            'points' => 'float',
            'metadata' => 'array',
        ];
    }

    public function examination(): BelongsTo
    {
        return $this->belongsTo(Examination::class, 'examination_id');
    }
}
