<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\ClassEnrollment;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\AuditService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext,
        protected AuditService $auditService
    ) {}

    public function index(Request $request): Response
    {
        $tenantId = $this->tenantContext->id();

        $students = Student::where('tenant_id', $tenantId)
            ->with(['classes:id,name,code'])
            ->orderBy('is_archived')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        $availableClasses = SchoolClass::where('tenant_id', $tenantId)
            ->where('is_archived', false)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('App/Students/Index', [
            'students' => $students,
            'availableClasses' => $availableClasses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

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
            'gender' => ['nullable', 'string', 'max:30'],
            'contact_number' => ['nullable', 'string', 'max:50'],
            'class_id' => ['nullable', 'exists:classes,id'],
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
            'gender' => $validated['gender'] ?? null,
            'contact_number' => $validated['contact_number'] ?? null,
            'is_archived' => false,
        ]);

        if (! empty($validated['class_id'])) {
            ClassEnrollment::create([
                'tenant_id' => $tenantId,
                'class_id' => $validated['class_id'],
                'student_id' => $student->id,
                'enrolled_at' => now(),
                'status' => 'enrolled',
            ]);
        }

        $this->auditService->log(
            'student.registered',
            "Registered student: {$student->student_id} ({$student->full_name})",
            $student,
            null,
            $student->toArray()
        );

        return back()->with('success', "Student '{$student->full_name}' registered successfully.");
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        if ($student->tenant_id !== $tenantId) {
            abort(403);
        }

        $validated = $request->validate([
            'student_id' => [
                'required',
                'string',
                'max:60',
                Rule::unique('students', 'student_id')
                    ->where('tenant_id', $tenantId)
                    ->whereNull('deleted_at')
                    ->ignore($student->id),
            ],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:150'],
            'gender' => ['nullable', 'string', 'max:30'],
            'contact_number' => ['nullable', 'string', 'max:50'],
        ]);

        $oldValues = $student->toArray();
        $student->update($validated);

        $this->auditService->log(
            'student.updated',
            "Updated student: {$student->student_id} ({$student->full_name})",
            $student,
            $oldValues,
            $student->toArray()
        );

        return back()->with('success', "Student '{$student->full_name}' updated successfully.");
    }

    public function toggleArchive(Student $student): RedirectResponse
    {
        if ($student->tenant_id !== $this->tenantContext->id()) {
            abort(403);
        }

        $newState = ! $student->is_archived;
        $student->update(['is_archived' => $newState]);

        $statusStr = $newState ? 'archived' : 'restored';
        $this->auditService->log(
            "student.{$statusStr}",
            "{$statusStr} student: {$student->student_id} ({$student->full_name})",
            $student
        );

        return back()->with('success', "Student '{$student->full_name}' {$statusStr}.");
    }

    public function enrollInClass(Request $request, Student $student): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        if ($student->tenant_id !== $tenantId) {
            abort(403);
        }

        $validated = $request->validate([
            'class_id' => ['required', 'exists:classes,id'],
        ]);

        $class = SchoolClass::where('tenant_id', $tenantId)->findOrFail($validated['class_id']);

        $existing = ClassEnrollment::where('tenant_id', $tenantId)
            ->where('class_id', $class->id)
            ->where('student_id', $student->id)
            ->first();

        if ($existing) {
            if ($existing->status !== 'enrolled') {
                $existing->update(['status' => 'enrolled', 'enrolled_at' => now()]);
            }
        } else {
            ClassEnrollment::create([
                'tenant_id' => $tenantId,
                'class_id' => $class->id,
                'student_id' => $student->id,
                'enrolled_at' => now(),
                'status' => 'enrolled',
            ]);
        }

        $this->auditService->log(
            'student.enrolled_class',
            "Enrolled student {$student->student_id} into class {$class->name}",
            $student
        );

        return back()->with('success', "Student enrolled into {$class->name}.");
    }
}
