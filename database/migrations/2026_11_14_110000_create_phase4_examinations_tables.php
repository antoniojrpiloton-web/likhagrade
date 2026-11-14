<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('examinations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('ulid', 36)->unique();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('question_count')->default(50);
            $table->unsignedTinyInteger('choice_count')->default(4);
            $table->decimal('points_per_question', 8, 2)->default(1.00);
            $table->decimal('total_score', 8, 2)->default(50.00);
            $table->decimal('passing_score', 8, 2)->nullable();
            $table->decimal('passing_percentage', 5, 2)->nullable();
            $table->foreignId('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->foreignId('academic_period_id')->nullable()->constrained('academic_periods')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('exam_date')->nullable();
            $table->string('status', 30)->default('draft');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'class_id']);
            $table->index(['tenant_id', 'subject_id']);
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::create('examination_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('examination_id')->constrained('examinations')->cascadeOnDelete();
            $table->unsignedSmallInteger('question_number');
            $table->string('correct_answer', 10)->nullable();
            $table->decimal('points', 8, 2)->default(1.00);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['examination_id', 'question_number']);
            $table->index(['tenant_id', 'examination_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examination_questions');
        Schema::dropIfExists('examinations');
    }
};
