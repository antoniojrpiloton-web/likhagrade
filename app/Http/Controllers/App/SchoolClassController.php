<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\ClassEnrollment;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Services\AuditService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolClassController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext,
        protected AuditService $auditService
    ) {}

    public function index(): Response
    {
        $tenant = $this->tenantContext->get();
        $tenantId = $tenant->id;

        $classes = SchoolClass::where('tenant_id', $tenantId)
            ->with(['subject:id,name,code,color', 'section:id,name,code,grade_level', 'academicPeriod:id,name,code,is_current', 'teacher:id,name,email'])
            ->withCount('students')
            ->orderBy('is_archived')
            ->latest('created_at')
            ->get();

        $subjects = Subject::where('tenant_id', $tenantId)
            ->where('is_archived', false)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $sections = Section::where('tenant_id', $tenantId)
            ->where('is_archived', false)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'grade_level']);

        $periods = AcademicPeriod::where('tenant_id', $tenantId)
            ->where('is_archived', false)
            ->orderByDesc('is_current')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'is_current']);

        $teachers = $tenant->members()
            ->select('users.id', 'users.name', 'users.email')
            ->get();

        return Inertia::render('App/Classes/Index', [
            'classes' => $classes,
            'subjects' => $subjects,
            'sections' => $sections,
            'periods' => $periods,
            'teachers' => $teachers,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['nullable', 'string', 'max:50'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'section_id' => ['nullable', 'exists:sections,id'],
            'academic_period_id' => ['nullable', 'exists:academic_periods,id'],
            'teacher_id' => ['nullable', 'exists:users,id'],
            'room' => ['nullable', 'string', 'max:50'],
            'schedule' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        if (empty($validated['teacher_id'])) {
            $validated['teacher_id'] = auth()->id();
        }

        $class = SchoolClass::create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'subject_id' => $validated['subject_id'] ?? null,
            'section_id' => $validated['section_id'] ?? null,
            'academic_period_id' => $validated['academic_period_id'] ?? null,
            'teacher_id' => $validated['teacher_id'],
            'room' => $validated['room'] ?? null,
            'schedule' => $validated['schedule'] ?? null,
            'description' => $validated['description'] ?? null,
            'is_archived' => false,
        ]);

        $this->auditService->log(
            'class.created',
            "Created class: {$class->name}",
            $class,
            null,
            $class->toArray()
        );

        return back()->with('success', "Class '{$class->name}' created successfully.");
    }

    public function show(SchoolClass $class): Response
    {
        $tenant = $this->tenantContext->get();
        $tenantId = $tenant->id;

        if ($class->tenant_id !== $tenantId) {
            abort(403);
        }

        $class->load([
            'subject:id,name,code,color',
            'section:id,name,code,grade_level,room',
            'academicPeriod:id,name,code,is_current',
            'teacher:id,name,email',
            'students' => function ($query) {
                $query->orderBy('last_name')->orderBy('first_name');
            },
        ]);

        $enrolledIds = $class->students->pluck('id')->all();

        $availableStudents = Student::where('tenant_id', $tenantId)
            ->where('is_archived', false)
            ->whereNotIn('id', $enrolledIds)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get(['id', 'student_id', 'first_name', 'last_name', 'email']);

        $subjects = Subject::where('tenant_id', $tenantId)->where('is_archived', false)->get(['id', 'name', 'code']);
        $sections = Section::where('tenant_id', $tenantId)->where('is_archived', false)->get(['id', 'name', 'code']);
        $periods = AcademicPeriod::where('tenant_id', $tenantId)->where('is_archived', false)->get(['id', 'name', 'code']);
        $teachers = $tenant->members()->select('users.id', 'users.name', 'users.email')->get();

        return Inertia::render('App/Classes/Show', [
            'classItem' => $class,
            'availableStudents' => $availableStudents,
            'subjects' => $subjects,
            'sections' => $sections,
            'periods' => $periods,
            'teachers' => $teachers,
        ]);
    }

    public function update(Request $request, SchoolClass $class): RedirectResponse
    {
        if ($class->tenant_id !== $this->tenantContext->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['nullable', 'string', 'max:50'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'section_id' => ['nullable', 'exists:sections,id'],
            'academic_period_id' => ['nullable', 'exists:academic_periods,id'],
            'teacher_id' => ['nullable', 'exists:users,id'],
            'room' => ['nullable', 'string', 'max:50'],
            'schedule' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $oldValues = $class->toArray();
        $class->update($validated);

        $this->auditService->log(
            'class.updated',
            "Updated class: {$class->name}",
            $class,
            $oldValues,
            $class->toArray()
        );

        return back()->with('success', "Class '{$class->name}' updated successfully.");
    }

    public function toggleArchive(SchoolClass $class): RedirectResponse
    {
        if ($class->tenant_id !== $this->tenantContext->id()) {
            abort(403);
        }

        $newState = ! $class->is_archived;
        $class->update(['is_archived' => $newState]);

        $statusStr = $newState ? 'archived' : 'restored';
        $this->auditService->log(
            "class.{$statusStr}",
            "{$statusStr} class: {$class->name}",
            $class
        );

        return back()->with('success', "Class '{$class->name}' {$statusStr}.");
    }

    public function enrollStudent(Request $request, SchoolClass $class): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        if ($class->tenant_id !== $tenantId) {
            abort(403);
        }

        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
        ]);

        $student = Student::where('tenant_id', $tenantId)->findOrFail($validated['student_id']);

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
            'class.enrolled',
            "Enrolled student {$student->student_id} ({$student->full_name}) into class {$class->name}",
            $class
        );

        return back()->with('success', "Student {$student->full_name} enrolled successfully.");
    }

    public function removeStudent(SchoolClass $class, Student $student): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        if ($class->tenant_id !== $tenantId || $student->tenant_id !== $tenantId) {
            abort(403);
        }

        ClassEnrollment::where('tenant_id', $tenantId)
            ->where('class_id', $class->id)
            ->where('student_id', $student->id)
            ->delete();

        $this->auditService->log(
            'class.unenrolled',
            "Removed student {$student->student_id} from class {$class->name}",
            $class
        );

        return back()->with('success', "Student {$student->full_name} removed from class.");
    }
}
