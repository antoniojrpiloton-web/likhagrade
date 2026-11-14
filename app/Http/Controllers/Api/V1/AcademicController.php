<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AcademicController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext
    ) {}

    public function classes(Request $request): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return response()->json(['data' => []]);
        }

        $classes = SchoolClass::where('tenant_id', $tenantId)
            ->where('is_archived', false)
            ->with(['subject:id,name,code,color', 'section:id,name,code', 'academicPeriod:id,name,is_current'])
            ->withCount('students')
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'code' => $c->code,
                'subject' => $c->subject ? [
                    'id' => $c->subject->id,
                    'name' => $c->subject->name,
                    'code' => $c->subject->code,
                ] : null,
                'section' => $c->section ? [
                    'id' => $c->section->id,
                    'name' => $c->section->name,
                ] : null,
                'academic_period' => $c->academicPeriod ? [
                    'id' => $c->academicPeriod->id,
                    'name' => $c->academicPeriod->name,
                ] : null,
                'students_count' => $c->students_count,
            ]);

        return response()->json(['data' => $classes]);
    }

    public function subjects(Request $request): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return response()->json(['data' => []]);
        }

        $subjects = Subject::where('tenant_id', $tenantId)
            ->where('is_archived', false)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'color']);

        return response()->json(['data' => $subjects]);
    }

    public function sections(Request $request): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return response()->json(['data' => []]);
        }

        $sections = Section::where('tenant_id', $tenantId)
            ->where('is_archived', false)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'grade_level', 'room']);

        return response()->json(['data' => $sections]);
    }

    public function periods(Request $request): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return response()->json(['data' => []]);
        }

        $periods = AcademicPeriod::where('tenant_id', $tenantId)
            ->where('is_archived', false)
            ->orderByDesc('is_current')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'type', 'is_current']);

        return response()->json(['data' => $periods]);
    }

    public function students(Request $request): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return response()->json(['data' => []]);
        }

        $query = Student::where('tenant_id', $tenantId)
            ->where('is_archived', false);

        if ($request->filled('class_id')) {
            $query->whereHas('classes', function ($q) use ($request) {
                $q->where('classes.id', $request->query('class_id'));
            });
        }

        if ($request->filled('search')) {
            $search = '%'.$request->query('search').'%';
            $query->where(function ($q) use ($search) {
                $q->where('student_id', 'like', $search)
                    ->orWhere('first_name', 'like', $search)
                    ->orWhere('last_name', 'like', $search);
            });
        }

        $students = $query->orderBy('last_name')
            ->orderBy('first_name')
            ->take(100)
            ->get(['id', 'student_id', 'first_name', 'last_name', 'middle_name', 'email'])
            ->map(fn ($s) => [
                'id' => $s->id,
                'student_id' => $s->student_id,
                'full_name' => $s->full_name,
                'email' => $s->email,
            ]);

        return response()->json(['data' => $students]);
    }

    public function storeStudent(Request $request): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return response()->json(['message' => 'No active workspace.'], 400);
        }

        $validated = $request->validate([
            'student_id' => [
                'nullable',
                'string',
                'max:60',
                Rule::unique('students', 'student_id')->where('tenant_id', $tenantId)->whereNull('deleted_at'),
            ],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:150'],
        ]);

        $studentId = ! empty($validated['student_id'])
            ? trim($validated['student_id'])
            : Student::generateUniqueStudentId($tenantId);

        $student = Student::create([
            'tenant_id' => $tenantId,
            'student_id' => $studentId,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'email' => $validated['email'] ?? null,
            'is_archived' => false,
        ]);

        return response()->json([
            'message' => 'Student created successfully.',
            'student' => [
                'id' => $student->id,
                'student_id' => $student->student_id,
                'full_name' => $student->full_name,
            ],
        ], 201);
    }
}
