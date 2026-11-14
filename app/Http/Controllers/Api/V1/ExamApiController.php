<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Examination;
use App\Models\OmrAnswerSheet;
use App\Services\Omr\OmrLayoutEngine;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamApiController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext,
        protected OmrLayoutEngine $layoutEngine
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return response()->json(['data' => []]);
        }

        $query = Examination::where('tenant_id', $tenantId)
            ->where('status', '!=', 'archived')
            ->with(['subject:id,name,code,color', 'schoolClass:id,name,code'])
            ->withCount([
                'questions',
                'questions as answered_count' => function ($q) {
                    $q->whereNotNull('correct_answer')->where('correct_answer', '!=', '');
                },
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $exams = $query->latest('created_at')->get()->map(fn ($e) => [
            'id' => $e->id,
            'ulid' => $e->ulid,
            'title' => $e->title,
            'description' => $e->description,
            'question_count' => $e->question_count,
            'choice_count' => $e->choice_count,
            'points_per_question' => $e->points_per_question,
            'total_score' => $e->total_score,
            'passing_score' => $e->passing_score,
            'status' => $e->status,
            'is_ready' => $e->isReady(),
            'answered_count' => $e->answered_count,
            'is_answer_key_complete' => $e->answered_count === $e->question_count,
            'subject' => $e->subject ? [
                'id' => $e->subject->id,
                'name' => $e->subject->name,
                'code' => $e->subject->code,
            ] : null,
            'class' => $e->schoolClass ? [
                'id' => $e->schoolClass->id,
                'name' => $e->schoolClass->name,
                'code' => $e->schoolClass->code,
            ] : null,
            'exam_date' => $e->exam_date?->toDateString(),
        ]);

        return response()->json(['data' => $exams]);
    }

    public function show(string $ulid): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return response()->json(['message' => 'No active workspace.'], 400);
        }

        $exam = Examination::where('tenant_id', $tenantId)
            ->where('ulid', $ulid)
            ->with(['subject:id,name,code,color', 'schoolClass:id,name,code', 'academicPeriod:id,name'])
            ->first();

        if (! $exam) {
            return response()->json(['message' => 'Examination not found.'], 404);
        }

        $examData = [
            'id' => $exam->id,
            'ulid' => $exam->ulid,
            'title' => $exam->title,
            'description' => $exam->description,
            'question_count' => $exam->question_count,
            'choice_count' => $exam->choice_count,
            'points_per_question' => $exam->points_per_question,
            'total_score' => $exam->total_score,
            'passing_score' => $exam->passing_score,
            'passing_percentage' => $exam->passing_percentage,
            'status' => $exam->status,
            'is_ready' => $exam->isReady(),
            'answered_count' => $exam->answered_count,
            'is_answer_key_complete' => $exam->is_answer_key_complete,
            'subject' => $exam->subject,
            'class' => $exam->schoolClass,
            'academic_period' => $exam->academicPeriod,
            'exam_date' => $exam->exam_date?->toDateString(),
        ];

        return response()->json([
            'data' => $examData,
            'exam' => $examData,
        ]);
    }

    public function answerKey(string $ulid): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return response()->json(['message' => 'No active workspace.'], 400);
        }

        $exam = Examination::where('tenant_id', $tenantId)
            ->where('ulid', $ulid)
            ->first();

        if (! $exam) {
            return response()->json(['message' => 'Examination not found.'], 404);
        }

        $questions = $exam->questions()
            ->orderBy('question_number')
            ->get(['question_number', 'correct_answer', 'points']);

        $payload = [
            'examination_ulid' => $exam->ulid,
            'title' => $exam->title,
            'question_count' => $exam->question_count,
            'choice_count' => $exam->choice_count,
            'total_score' => $exam->total_score,
            'status' => $exam->status,
            'is_ready' => $exam->isReady(),
            'is_complete' => $exam->is_answer_key_complete,
            'answered_count' => $exam->answered_count,
            'questions' => $questions,
            'answer_key' => $questions,
        ];

        return response()->json(array_merge(['data' => $payload], $payload));
    }

    public function readiness(string $ulid): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return response()->json(['message' => 'No active workspace.'], 400);
        }

        $exam = Examination::where('tenant_id', $tenantId)
            ->where('ulid', $ulid)
            ->first();

        if (! $exam) {
            return response()->json(['message' => 'Examination not found.'], 404);
        }

        $answered = $exam->answered_count;
        $total = $exam->question_count;
        $isComplete = $answered === $total && $total > 0;

        $readyPayload = [
            'ulid' => $exam->ulid,
            'title' => $exam->title,
            'status' => $exam->status,
            'ready' => $exam->isReady() && $isComplete,
            'ready_for_scanning' => $exam->isReady() && $isComplete,
            'is_complete' => $isComplete,
            'answered_count' => $answered,
            'question_count' => $total,
        ];

        return response()->json(array_merge(['data' => $readyPayload], $readyPayload));
    }

    public function sheetTemplate(Request $request, string $ulid): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return response()->json(['message' => 'No active workspace.'], 400);
        }

        $exam = Examination::where('tenant_id', $tenantId)
            ->where('ulid', $ulid)
            ->first();

        if (! $exam) {
            return response()->json(['message' => 'Examination not found.'], 404);
        }

        $paperSize = $request->query('paper_size', OmrLayoutEngine::PAPER_A4);
        $spec = $this->layoutEngine->generateSpecification($exam, $paperSize);

        return response()->json([
            'data' => $spec,
            'template' => $spec,
        ]);
    }

    public function verifySheet(string $sheetUlid): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        if (! $tenantId) {
            return response()->json(['message' => 'No active workspace.'], 400);
        }

        $sheet = OmrAnswerSheet::where('tenant_id', $tenantId)
            ->where('sheet_ulid', $sheetUlid)
            ->with(['examination', 'student'])
            ->first();

        if (! $sheet) {
            return response()->json(['message' => 'Answer sheet not found.'], 404);
        }

        return response()->json([
            'data' => [
                'sheet_ulid' => $sheet->sheet_ulid,
                'qr_payload' => $sheet->qr_payload,
                'mode' => $sheet->mode,
                'status' => $sheet->status,
                'template_version' => $sheet->template_version,
                'paper_size' => $sheet->paper_size,
                'page_number' => $sheet->page_number,
                'total_pages' => $sheet->total_pages,
                'examination' => [
                    'id' => $sheet->examination?->id,
                    'ulid' => $sheet->examination?->ulid,
                    'title' => $sheet->examination?->title,
                    'question_count' => $sheet->examination?->question_count,
                    'choice_count' => $sheet->examination?->choice_count,
                    'is_ready' => $sheet->examination?->isReady(),
                ],
                'student' => $sheet->student ? [
                    'id' => $sheet->student->id,
                    'student_id_number' => $sheet->student->student_id_number,
                    'name' => $sheet->student->full_name,
                ] : null,
            ],
        ]);
    }
}
