<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Examination;
use App\Models\OmrAnswerSheet;
use App\Models\OmrSheetBatch;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\AuditService;
use App\Services\Omr\OmrLayoutEngine;
use App\Services\Omr\OmrPdfGenerator;
use App\Services\Omr\OmrPngGenerator;
use App\Services\Omr\QrCodeGenerator;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class OmrAnswerSheetController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext,
        protected OmrLayoutEngine $layoutEngine,
        protected OmrPdfGenerator $pdfGenerator,
        protected OmrPngGenerator $pngGenerator,
        protected AuditService $auditService
    ) {}

    public function index(Request $request, Examination $exam): Response
    {
        $tenantId = $this->tenantContext->id();

        if ($exam->tenant_id !== $tenantId) {
            abort(403);
        }

        $paperSize = $request->query('paper_size', OmrLayoutEngine::PAPER_A4);
        $validSizes = [OmrLayoutEngine::PAPER_A4, OmrLayoutEngine::PAPER_LETTER, OmrLayoutEngine::PAPER_A4_2UP, OmrLayoutEngine::PAPER_LETTER_2UP];
        $paperSize = in_array($paperSize, $validSizes, true) ? $paperSize : OmrLayoutEngine::PAPER_A4;

        $exam->load(['subject', 'schoolClass', 'academicPeriod']);
        $tenant = $this->tenantContext->get();

        $layoutSpec = $this->layoutEngine->generateSpecification($exam, $paperSize);

        $sampleQrPayload = "LKG1:01JPREVIEW00000000000000:{$exam->ulid}:1:{$layoutSpec['total_pages']}";
        $sampleQrSvg = QrCodeGenerator::generateSvg($sampleQrPayload, 120);

        $batches = OmrSheetBatch::where('tenant_id', $tenantId)
            ->where('examination_id', $exam->id)
            ->with(['creator:id,first_name,last_name'])
            ->latest()
            ->take(20)
            ->get();

        $classes = SchoolClass::where('tenant_id', $tenantId)
            ->where('is_archived', false)
            ->withCount(['students'])
            ->get(['id', 'name', 'code']);

        $students = Student::where('tenant_id', $tenantId)
            ->where('is_archived', false)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->take(100)
            ->get(['id', 'student_id', 'first_name', 'last_name']);

        return Inertia::render('App/Exams/AnswerSheets', [
            'exam' => $exam,
            'tenant' => [
                'name' => $tenant?->name ?? 'LikhaGrade Workspace',
            ],
            'paperSize' => $paperSize,
            'layoutSpec' => $layoutSpec,
            'sampleQrSvg' => $sampleQrSvg,
            'batches' => $batches,
            'classes' => $classes,
            'students' => $students,
        ]);
    }

    public function generate(Request $request, Examination $exam): SymfonyResponse
    {
        @ini_set('memory_limit', '512M');
        @set_time_limit(300);

        $tenantId = $this->tenantContext->id();

        if ($exam->tenant_id !== $tenantId) {
            abort(403);
        }

        $validated = $request->validate([
            'mode' => ['required', 'string', 'in:generic,student_assigned'],
            'paper_size' => ['required', 'string', 'in:A4,Letter,A4_2Up,Letter_2Up'],
            'format' => ['nullable', 'string', 'in:pdf,png'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:500'],
            'class_id' => ['nullable', 'exists:classes,id'],
            'student_ids' => ['nullable', 'array'],
            'student_ids.*' => ['exists:students,id'],
        ]);

        $mode = $validated['mode'];
        $paperSize = $validated['paper_size'];
        $format = $validated['format'] ?? 'pdf';
        $layoutSpec = $this->layoutEngine->generateSpecification($exam, $paperSize);
        $totalPages = $layoutSpec['total_pages'];
        $tenant = $this->tenantContext->get();
        $institutionName = $tenant?->name ?? 'LikhaGrade Examination System';

        $batch = OmrSheetBatch::create([
            'tenant_id' => $tenantId,
            'examination_id' => $exam->id,
            'batch_ulid' => (string) Str::ulid(),
            'mode' => $mode,
            'template_version' => OmrLayoutEngine::VERSION,
            'paper_size' => $paperSize,
            'quantity' => 0,
            'created_by' => auth()->id(),
            'metadata' => [
                'question_count' => $exam->question_count,
                'choice_count' => $exam->choice_count,
                'total_pages' => $totalPages,
            ],
        ]);

        $sheetsData = [];

        if ($mode === 'student_assigned') {
            $studentsQuery = Student::where('tenant_id', $tenantId)->where('is_archived', false);

            if (! empty($validated['class_id'])) {
                $classId = $validated['class_id'];
                $studentsQuery->whereHas('classes', function ($q) use ($classId) {
                    $q->where('classes.id', $classId);
                });
            } elseif (! empty($validated['student_ids'])) {
                $studentsQuery->whereIn('id', $validated['student_ids']);
            }

            $students = $studentsQuery->get();

            if ($students->isEmpty()) {
                return back()->withErrors(['mode' => 'No eligible students found for student-assigned generation.']);
            }

            foreach ($students as $student) {
                $sheetUlid = (string) Str::ulid();
                $qrPayload = "LKG1:{$sheetUlid}:{$exam->ulid}:1:{$totalPages}";

                OmrAnswerSheet::create([
                    'tenant_id' => $tenantId,
                    'examination_id' => $exam->id,
                    'batch_id' => $batch->id,
                    'sheet_ulid' => $sheetUlid,
                    'qr_payload' => $qrPayload,
                    'mode' => 'student_assigned',
                    'student_id' => $student->id,
                    'template_version' => OmrLayoutEngine::VERSION,
                    'paper_size' => $paperSize,
                    'page_number' => 1,
                    'total_pages' => $totalPages,
                    'status' => 'generated',
                    'layout_metadata' => [
                        'template_version' => OmrLayoutEngine::VERSION,
                        'student_name' => $student->full_name,
                        'student_id' => $student->student_id,
                        'student_id_number' => $student->student_id,
                    ],
                ]);

                $sheetsData[] = [
                    'sheet_ulid' => $sheetUlid,
                    'qr_payload' => $qrPayload,
                    'institution_name' => $institutionName,
                    'student_name' => $student->full_name,
                    'student_id' => $student->student_id,
                    'student_id_number' => $student->student_id,
                    'section_name' => $exam->schoolClass?->name ?? '',
                ];
            }

            $batch->update(['quantity' => count($students)]);
        } else {
            $quantity = max(1, min(500, (int) ($validated['quantity'] ?? 1)));

            for ($i = 0; $i < $quantity; $i++) {
                $sheetUlid = (string) Str::ulid();
                $qrPayload = "LKG1:{$sheetUlid}:{$exam->ulid}:1:{$totalPages}";

                OmrAnswerSheet::create([
                    'tenant_id' => $tenantId,
                    'examination_id' => $exam->id,
                    'batch_id' => $batch->id,
                    'sheet_ulid' => $sheetUlid,
                    'qr_payload' => $qrPayload,
                    'mode' => 'generic',
                    'student_id' => null,
                    'template_version' => OmrLayoutEngine::VERSION,
                    'paper_size' => $paperSize,
                    'page_number' => 1,
                    'total_pages' => $totalPages,
                    'status' => 'generated',
                    'layout_metadata' => [
                        'template_version' => OmrLayoutEngine::VERSION,
                    ],
                ]);

                $sheetsData[] = [
                    'sheet_ulid' => $sheetUlid,
                    'qr_payload' => $qrPayload,
                    'institution_name' => $institutionName,
                    'student_name' => '',
                    'student_id_number' => '',
                    'section_name' => $exam->schoolClass?->name ?? '',
                ];
            }

            $batch->update(['quantity' => $quantity]);
        }

        $this->auditService->log(
            'omr.sheets_generated',
            "Generated {$batch->quantity} OMR answer sheet(s) for examination: {$exam->title} (Mode: {$mode}, Size: {$paperSize})",
            $exam,
            null,
            $batch->toArray()
        );

        if ($format === 'png') {
            if (count($sheetsData) === 1) {
                $png = $this->pngGenerator->generateSinglePng($exam, $sheetsData[0], $paperSize);

                return response($png, 200, [
                    'Content-Type' => 'image/png',
                    'Content-Disposition' => "attachment; filename=\"exam-{$exam->ulid}-sheet-{$batch->batch_ulid}.png\"",
                ]);
            }

            $zip = $this->pngGenerator->generateZip($exam, $sheetsData, $paperSize);

            return response($zip, 200, [
                'Content-Type' => 'application/zip',
                'Content-Disposition' => "attachment; filename=\"exam-{$exam->ulid}-sheets-{$batch->batch_ulid}.zip\"",
            ]);
        }

        $pdf = $this->pdfGenerator->generatePdf($exam, $sheetsData, $paperSize);
        $fileName = "exam-{$exam->ulid}-sheets-{$batch->batch_ulid}.pdf";

        return $request->query('download') ? $pdf->download($fileName) : $pdf->stream($fileName);
    }

    public function downloadBatch(Request $request, Examination $exam, OmrSheetBatch $batch): SymfonyResponse
    {
        @ini_set('memory_limit', '512M');
        @set_time_limit(300);

        $tenantId = $this->tenantContext->id();

        if ($exam->tenant_id !== $tenantId || $batch->tenant_id !== $tenantId || $batch->examination_id !== $exam->id) {
            abort(403);
        }

        $sheets = $batch->answerSheets()->with('student')->get();

        if ($sheets->isEmpty()) {
            abort(404, 'No sheets found in this batch.');
        }

        $tenant = $this->tenantContext->get();
        $institutionName = $tenant?->name ?? 'LikhaGrade Examination System';

        $sheetsData = [];
        foreach ($sheets as $sheet) {
            $sheetsData[] = [
                'sheet_ulid' => $sheet->sheet_ulid,
                'qr_payload' => $sheet->qr_payload,
                'institution_name' => $institutionName,
                'student_name' => $sheet->student?->full_name ?? '',
                'student_id' => $sheet->student?->student_id ?? '',
                'student_id_number' => $sheet->student?->student_id ?? '',
                'section_name' => $exam->schoolClass?->name ?? '',
            ];
        }

        $format = $request->query('format', 'pdf');

        if ($format === 'png') {
            if (count($sheetsData) === 1) {
                $png = $this->pngGenerator->generateSinglePng($exam, $sheetsData[0], $batch->paper_size);

                return response($png, 200, [
                    'Content-Type' => 'image/png',
                    'Content-Disposition' => "attachment; filename=\"exam-{$exam->ulid}-sheets-batch-{$batch->batch_ulid}.png\"",
                ]);
            }

            $zip = $this->pngGenerator->generateZip($exam, $sheetsData, $batch->paper_size);

            return response($zip, 200, [
                'Content-Type' => 'application/zip',
                'Content-Disposition' => "attachment; filename=\"exam-{$exam->ulid}-sheets-batch-{$batch->batch_ulid}.zip\"",
            ]);
        }

        $pdf = $this->pdfGenerator->generatePdf($exam, $sheetsData, $batch->paper_size);
        $fileName = "exam-{$exam->ulid}-sheets-batch-{$batch->batch_ulid}.pdf";

        return $request->query('download') ? $pdf->download($fileName) : $pdf->stream($fileName);
    }

    public function specification(Request $request, Examination $exam): JsonResponse
    {
        $tenantId = $this->tenantContext->id();

        if ($exam->tenant_id !== $tenantId) {
            abort(403);
        }

        $paperSize = $request->query('paper_size', OmrLayoutEngine::PAPER_A4);
        $spec = $this->layoutEngine->generateSpecification($exam, $paperSize);

        return response()->json([
            'data' => $spec,
            'specification' => $spec,
        ]);
    }
}
