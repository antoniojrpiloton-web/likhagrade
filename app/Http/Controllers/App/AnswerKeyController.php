<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Examination;
use App\Models\ExaminationQuestion;
use App\Services\AuditService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnswerKeyController extends Controller
{
    public function __construct(
        protected TenantContext $tenantContext,
        protected AuditService $auditService
    ) {}

    public function show(Examination $exam): Response
    {
        $tenantId = $this->tenantContext->id();

        if ($exam->tenant_id !== $tenantId) {
            abort(403);
        }

        $exam->load([
            'questions' => function ($q) {
                $q->orderBy('question_number');
            },
        ]);

        return Inertia::render('App/Exams/AnswerKey', [
            'exam' => $exam,
            'questions' => $exam->questions,
        ]);
    }

    public function update(Request $request, Examination $exam): RedirectResponse
    {
        $tenantId = $this->tenantContext->id();

        if ($exam->tenant_id !== $tenantId) {
            abort(403);
        }

        $validated = $request->validate([
            'answers' => ['nullable', 'array'],
            'answers.*.question_number' => ['required_with:answers', 'integer', 'min:1'],
            'answers.*.correct_answer' => ['nullable', 'string', 'max:5'],
            'answers.*.points' => ['nullable', 'numeric', 'min:0'],
            'bulk_string' => ['nullable', 'string'],
            'mark_as_ready' => ['nullable', 'boolean'],
        ]);

        $availableChoices = $exam->available_choices;
        $validChoices = array_flip($availableChoices);

        if (! empty($validated['bulk_string'])) {
            $raw = strtoupper(trim($validated['bulk_string']));
            $parsedAnswers = [];

            if (preg_match_all('/(\d+)\s*[:=\-.]\s*([A-E])/i', $raw, $matches, PREG_SET_ORDER)) {
                foreach ($matches as $m) {
                    $qNum = (int) $m[1];
                    $ans = strtoupper($m[2]);
                    if ($qNum >= 1 && $qNum <= $exam->question_count && isset($validChoices[$ans])) {
                        $parsedAnswers[$qNum] = $ans;
                    }
                }
            } else {
                $cleaned = preg_replace('/[^A-E]/', '', $raw);
                $chars = str_split($cleaned);
                foreach ($chars as $idx => $char) {
                    $qNum = $idx + 1;
                    if ($qNum <= $exam->question_count && isset($validChoices[$char])) {
                        $parsedAnswers[$qNum] = $char;
                    }
                }
            }

            foreach ($parsedAnswers as $qNum => $ans) {
                ExaminationQuestion::where('tenant_id', $tenantId)
                    ->where('examination_id', $exam->id)
                    ->where('question_number', $qNum)
                    ->update(['correct_answer' => $ans]);
            }
        } elseif (! empty($validated['answers'])) {
            foreach ($validated['answers'] as $item) {
                $qNum = (int) $item['question_number'];
                $ans = ! empty($item['correct_answer']) ? strtoupper(trim($item['correct_answer'])) : null;
                $points = isset($item['points']) && $item['points'] !== null ? (float) $item['points'] : null;

                if ($ans !== null && ! isset($validChoices[$ans])) {
                    $ans = null;
                }

                $updateData = ['correct_answer' => $ans];
                if ($points !== null && $points >= 0) {
                    $updateData['points'] = $points;
                }

                ExaminationQuestion::where('tenant_id', $tenantId)
                    ->where('examination_id', $exam->id)
                    ->where('question_number', $qNum)
                    ->update($updateData);
            }
        }

        $exam->recalculateTotalScore();
        $exam->refresh();

        if (! empty($validated['mark_as_ready'])) {
            $exam->update(['status' => 'ready']);
        }

        $this->auditService->log(
            'examination.answer_key_updated',
            "Updated answer key for examination: {$exam->title} ({$exam->answered_count}/{$exam->question_count} answered)",
            $exam
        );

        $msg = ! empty($validated['mark_as_ready'])
            ? "Examination '{$exam->title}' published as ready!"
            : "Draft answer key saved successfully ({$exam->answered_count}/{$exam->question_count} answered).";

        return back()->with('success', $msg);
    }
}
