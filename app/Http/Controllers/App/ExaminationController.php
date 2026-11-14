<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use App\Models\Examination;
use App\Models\ExaminationQuestion;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Services\AuditService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ExaminationController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext,
        protected AuditService $auditService
    ) {}

    public function index(Request $request): Response
    {
        $tenantId = $this->tenantContext->id();

        $query = Examination::where('tenant_id', $tenantId)
            ->with([
                'subject:id,name,code,color',
                'schoolClass:id,name,code',
                'academicPeriod:id,name',
            ])
            ->withCount([
                'questions',
                'questions as answered_questions_count' => function ($q) {
                    $q->whereNotNull('correct_answer')->where('correct_answer', '!=', '');
                },
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->query('subject_id'));
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->query('class_id'));
        }

        if ($request->filled('search')) {
            $s = '%'.$request->query('search').'%';
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', $s)
                    ->orWhere('ulid', 'like', $s)
                    ->orWhere('description', 'like', $s);
            });
        }

        $examinations = $query->latest('created_at')->get();

        $subjects = Subject::where('tenant_id', $tenantId)->where('is_archived', false)->get(['id', 'name', 'code']);
        $classes = SchoolClass::where('tenant_id', $tenantId)->where('is_archived', false)->get(['id', 'name', 'code']);
        $periods = AcademicPeriod::where('tenant_id', $tenantId)->where('is_archived', false)->get(['id', 'name', 'code']);

        $summary = [
            'total' => Examination::where('tenant_id', $tenantId)->count(),
            'ready' => Examination::where('tenant_id', $tenantId)->where('status', 'ready')->count(),
            'draft' => Examination::where('tenant_id', $tenantId)->where('status', 'draft')->count(),
            'archived' => Examination::where('tenant_id', $tenantId)->where('status', 'archived')->count(),
        ];

        return Inertia::render('App/Exams/Index', [
            'examinations' => $examinations,
            'subjects' => $subjects,
            'classes' => $classes,
            'periods' => $periods,
            'summary' => $summary,
            'filters' => $request->only(['status', 'subject_id', 'class_id', 'search']),
        ]);
    }

    public function create(): Response
    {
        $tenantId = $this->tenantContext->id();

        $subjects = Subject::where('tenant_id', $tenantId)->where('is_archived', false)->get(['id', 'name', 'code']);
        $classes = SchoolClass::where('tenant_id', $tenantId)->where('is_archived', false)->get(['id', 'name', 'code']);
        $periods = AcademicPeriod::where('tenant_id', $tenantId)->where('is_archived', false)->orderByDesc('is_current')->get(['id', 'name', 'code', 'is_current']);

        return Inertia::render('App/Exams/Create', [
            'subjects' => $subjects,
            'classes' => $classes,
            'periods' => $periods,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'question_count' => ['required', 'integer', 'min:1', 'max:200'],
            'choice_count' => ['required', 'integer', 'min:2', 'max:5'],
            'points_per_question' => ['nullable', 'numeric', 'min:0.01'],
            'passing_score' => ['nullable', 'numeric', 'min:0'],
            'passing_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'class_id' => ['nullable', 'exists:classes,id'],
            'academic_period_id' => ['nullable', 'exists:academic_periods,id'],
            'exam_date' => ['nullable', 'date'],
        ]);

        $pointsPerQuestion = isset($validated['points_per_question']) && $validated['points_per_question'] > 0
            ? (float) $validated['points_per_question']
            : 1.00;

        $totalScore = $validated['question_count'] * $pointsPerQuestion;

        $exam = Examination::create([
            'tenant_id' => $tenantId,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'question_count' => $validated['question_count'],
            'choice_count' => $validated['choice_count'],
            'points_per_question' => $pointsPerQuestion,
            'total_score' => $totalScore,
            'passing_score' => $validated['passing_score'] ?? null,
            'passing_percentage' => $validated['passing_percentage'] ?? null,
            'subject_id' => $validated['subject_id'] ?? null,
            'class_id' => $validated['class_id'] ?? null,
            'academic_period_id' => $validated['academic_period_id'] ?? null,
            'created_by' => auth()->id(),
            'exam_date' => $validated['exam_date'] ?? null,
            'status' => 'draft',
        ]);

        $this->auditService->log(
            'examination.created',
            "Created examination: {$exam->title} ({$exam->question_count} questions)",
            $exam,
            null,
            $exam->toArray()
        );

        return redirect()->route('app.exams.answer-key', $exam)
            ->with('success', "Examination '{$exam->title}' created. Please configure your answer key.");
    }

    public function show(Examination $exam): Response
    {
        $tenantId = $this->tenantContext->id();

        if ($exam->tenant_id !== $tenantId) {
            abort(403);
        }

        $exam->load([
            'subject:id,name,code,color',
            'schoolClass:id,name,code',
            'academicPeriod:id,name',
            'creator:id,name,email',
            'questions' => function ($q) {
                $q->orderBy('question_number');
            },
        ]);

        return Inertia::render('App/Exams/Show', [
            'exam' => $exam,
        ]);
    }

    public function edit(Examination $exam): Response
    {
        $tenantId = $this->tenantContext->id();

        if ($exam->tenant_id !== $tenantId) {
            abort(403);
        }

        $subjects = Subject::where('tenant_id', $tenantId)->where('is_archived', false)->get(['id', 'name', 'code']);
        $classes = SchoolClass::where('tenant_id', $tenantId)->where('is_archived', false)->get(['id', 'name', 'code']);
        $periods = AcademicPeriod::where('tenant_id', $tenantId)->where('is_archived', false)->get(['id', 'name', 'code']);

        return Inertia::render('App/Exams/Edit', [
            'exam' => $exam,
            'subjects' => $subjects,
            'classes' => $classes,
            'periods' => $periods,
        ]);
    }

    public function update(Request $request, Examination $exam): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        if ($exam->tenant_id !== $tenantId) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'question_count' => ['required', 'integer', 'min:1', 'max:200'],
            'choice_count' => ['required', 'integer', 'min:2', 'max:5'],
            'points_per_question' => ['nullable', 'numeric', 'min:0.01'],
            'passing_score' => ['nullable', 'numeric', 'min:0'],
            'passing_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'class_id' => ['nullable', 'exists:classes,id'],
            'academic_period_id' => ['nullable', 'exists:academic_periods,id'],
            'exam_date' => ['nullable', 'date'],
        ]);

        $oldValues = $exam->toArray();
        $oldCount = $exam->question_count;

        $exam->update($validated);

        if ($oldCount !== $exam->question_count) {
            $exam->syncQuestions();
        } else {
            $exam->recalculateTotalScore();
        }

        $this->auditService->log(
            'examination.updated',
            "Updated examination: {$exam->title}",
            $exam,
            $oldValues,
            $exam->toArray()
        );

        return redirect()->route('app.exams.show', $exam)
            ->with('success', "Examination '{$exam->title}' updated successfully.");
    }

    public function duplicate(Examination $exam): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        if ($exam->tenant_id !== $tenantId) {
            abort(403);
        }

        $copy = Examination::create([
            'tenant_id' => $tenantId,
            'ulid' => (string) Str::ulid(),
            'title' => 'Copy of '.$exam->title,
            'description' => $exam->description,
            'question_count' => $exam->question_count,
            'choice_count' => $exam->choice_count,
            'points_per_question' => $exam->points_per_question,
            'total_score' => $exam->total_score,
            'passing_score' => $exam->passing_score,
            'passing_percentage' => $exam->passing_percentage,
            'subject_id' => $exam->subject_id,
            'class_id' => $exam->class_id,
            'academic_period_id' => $exam->academic_period_id,
            'created_by' => auth()->id(),
            'exam_date' => $exam->exam_date,
            'status' => 'draft',
        ]);

        $originalQuestions = $exam->questions()->get();
        foreach ($originalQuestions as $q) {
            ExaminationQuestion::updateOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'examination_id' => $copy->id,
                    'question_number' => $q->question_number,
                ],
                [
                    'correct_answer' => $q->correct_answer,
                    'points' => $q->points,
                    'metadata' => $q->metadata,
                ]
            );
        }

        $copy->recalculateTotalScore();

        $this->auditService->log(
            'examination.duplicated',
            "Duplicated examination '{$exam->title}' as '{$copy->title}'",
            $copy
        );

        return redirect()->route('app.exams.show', $copy)
            ->with('success', "Examination duplicated successfully as '{$copy->title}'.");
    }

    public function toggleArchive(Examination $exam): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        if ($exam->tenant_id !== $tenantId) {
            abort(403);
        }

        if ($exam->status === 'archived') {
            $exam->update(['status' => 'draft']);
            $actionStr = 'restored to draft';
        } else {
            $exam->update(['status' => 'archived']);
            $actionStr = 'archived';
        }

        $this->auditService->log(
            'examination.archived',
            "Examination '{$exam->title}' was {$actionStr}",
            $exam
        );

        return back()->with('success', "Examination '{$exam->title}' {$actionStr}.");
    }

    public function setStatus(Request $request, Examination $exam): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        if ($exam->tenant_id !== $tenantId) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'ready', 'archived'])],
        ]);

        $targetStatus = $validated['status'];

        $exam->update(['status' => $targetStatus]);

        $this->auditService->log(
            'examination.status_changed',
            "Changed examination '{$exam->title}' status to {$targetStatus}",
            $exam
        );

        return back()->with('success', "Examination marked as {$targetStatus}.");
    }
}
