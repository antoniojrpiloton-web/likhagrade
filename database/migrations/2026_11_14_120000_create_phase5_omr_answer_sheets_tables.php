<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('omr_sheet_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('examination_id')->constrained('examinations')->cascadeOnDelete();
            $table->string('batch_ulid', 36)->unique();
            $table->string('mode', 30)->default('generic');
            $table->string('template_version', 20)->default('v1.0');
            $table->string('paper_size', 20)->default('A4');
            $table->unsignedInteger('quantity')->default(1);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'examination_id']);
            $table->index(['tenant_id', 'created_at']);
        });

        Schema::create('omr_answer_sheets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('examination_id')->constrained('examinations')->cascadeOnDelete();
            $table->foreignId('batch_id')->nullable()->constrained('omr_sheet_batches')->nullOnDelete();
            $table->string('sheet_ulid', 36)->unique();
            $table->string('qr_payload', 255);
            $table->string('mode', 30)->default('generic');
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('template_version', 20)->default('v1.0');
            $table->string('paper_size', 20)->default('A4');
            $table->unsignedTinyInteger('page_number')->default(1);
            $table->unsignedTinyInteger('total_pages')->default(1);
            $table->string('status', 30)->default('generated');
            $table->json('layout_metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'sheet_ulid']);
            $table->index(['tenant_id', 'examination_id', 'status']);
            $table->index(['tenant_id', 'student_id']);
            $table->index(['tenant_id', 'batch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('omr_answer_sheets');
        Schema::dropIfExists('omr_sheet_batches');
    }
};
