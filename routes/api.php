<?php

use App\Http\Controllers\Api\V1\AcademicController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ExamApiController;
use App\Http\Controllers\Api\V1\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login'])->name('api.auth.login');

    Route::middleware(['api.auth', 'tenant'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.auth.logout');

        Route::get('/workspace', [WorkspaceController::class, 'show'])->name('api.workspace.show');

        Route::get('/exams', [ExamApiController::class, 'index'])->name('api.exams.index');
        Route::get('/exams/{ulid}', [ExamApiController::class, 'show'])->name('api.exams.show');
        Route::get('/exams/{ulid}/answer-key', [ExamApiController::class, 'answerKey'])->name('api.exams.answer-key');
        Route::get('/exams/{ulid}/readiness', [ExamApiController::class, 'readiness'])->name('api.exams.readiness');
        Route::get('/exams/{ulid}/sheet-template', [ExamApiController::class, 'sheetTemplate'])->name('api.exams.sheet-template');
        Route::get('/sheets/{sheet_ulid}/verify', [ExamApiController::class, 'verifySheet'])->name('api.sheets.verify');

        Route::get('/classes', [AcademicController::class, 'classes'])->name('api.academic.classes');
        Route::get('/subjects', [AcademicController::class, 'subjects'])->name('api.academic.subjects');
        Route::get('/sections', [AcademicController::class, 'sections'])->name('api.academic.sections');
        Route::get('/academic-periods', [AcademicController::class, 'periods'])->name('api.academic.periods');
        Route::get('/students', [AcademicController::class, 'students'])->name('api.academic.students');
        Route::post('/students', [AcademicController::class, 'storeStudent'])->name('api.academic.students.store');
    });
});
