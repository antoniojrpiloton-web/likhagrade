import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    FileText,
    ArrowLeft,
    Save,
    CheckCircle2,
    Sparkles,
    AlertCircle,
    RotateCcw,
    Keyboard,
    ClipboardPaste,
    Check,
    X,
    ChevronRight,
    HelpCircle,
} from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/utils/cn';

interface QuestionItem {
    id?: number;
    question_number: number;
    correct_answer: string | null;
    points: number;
}

interface ExamProps {
    id: number;
    ulid: string;
    title: string;
    question_count: number;
    choice_count: number;
    points_per_question: number;
    total_score: number;
    status: 'draft' | 'ready' | 'archived';
    available_choices: string[];
    answered_count?: number;
    is_answer_key_complete?: boolean;
}

export default function AnswerKey({
    exam,
    questions,
}: {
    exam: ExamProps;
    questions: QuestionItem[];
}) {
    const availableChoices = useMemo(() => {
        if (exam.available_choices && exam.available_choices.length > 0) {
            return exam.available_choices;
        }
        const alphabet = ['A', 'B', 'C', 'D', 'E'];
        return alphabet.slice(0, Math.min(Math.max(exam.choice_count || 4, 2), 5));
    }, [exam.available_choices, exam.choice_count]);

    const initialAnswers = useMemo(() => {
        const map: Record<number, { answer: string | null; points: number }> = {};
        for (let i = 1; i <= exam.question_count; i++) {
            const found = questions.find((q) => q.question_number === i);
            map[i] = {
                answer: found?.correct_answer || null,
                points: found && found.points !== undefined && found.points !== null ? Number(found.points) : Number(exam.points_per_question || 1),
            };
        }
        return map;
    }, [exam.question_count, exam.points_per_question, questions]);

    const [answers, setAnswers] = useState(initialAnswers);
    const [focusedIndex, setFocusedIndex] = useState<number>(1);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'unanswered'>('all');

    const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

    const answeredCount = useMemo(() => {
        return Object.values(answers).filter((item) => item.answer !== null && item.answer !== '').length;
    }, [answers]);

    const completionPercentage = useMemo(() => {
        if (exam.question_count === 0) return 0;
        return Math.round((answeredCount / exam.question_count) * 100);
    }, [answeredCount, exam.question_count]);

    const calculatedTotalScore = useMemo(() => {
        return Object.values(answers).reduce((acc, curr) => acc + (Number(curr.points) || 0), 0);
    }, [answers]);

    const firstUnansweredIndex = useMemo(() => {
        for (let i = 1; i <= exam.question_count; i++) {
            if (!answers[i]?.answer) {
                return i;
            }
        }
        return null;
    }, [answers, exam.question_count]);

    const handleSelectChoice = (questionNum: number, choice: string) => {
        setAnswers((prev) => {
            const current = prev[questionNum]?.answer;
            const nextAnswer = current === choice ? null : choice;
            return {
                ...prev,
                [questionNum]: {
                    ...prev[questionNum],
                    answer: nextAnswer,
                },
            };
        });
        setFocusedIndex(questionNum);
    };

    const handlePointsChange = (questionNum: number, pts: number) => {
        setAnswers((prev) => ({
            ...prev,
            [questionNum]: {
                ...prev[questionNum],
                points: Math.max(0, pts),
            },
        }));
    };

    const handleJumpToUnanswered = () => {
        if (firstUnansweredIndex) {
            setFocusedIndex(firstUnansweredIndex);
            const el = questionRefs.current[firstUnansweredIndex];
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (bulkModalOpen) return;
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                return;
            }

            const key = e.key.toUpperCase();
            if (availableChoices.includes(key)) {
                e.preventDefault();
                handleSelectChoice(focusedIndex, key);
                if (focusedIndex < exam.question_count) {
                    const next = focusedIndex + 1;
                    setFocusedIndex(next);
                    questionRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                if (focusedIndex < exam.question_count) {
                    const next = focusedIndex + 1;
                    setFocusedIndex(next);
                    questionRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                if (focusedIndex > 1) {
                    const prev = focusedIndex - 1;
                    setFocusedIndex(prev);
                    questionRefs.current[prev]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault();
                setAnswers((prev) => ({
                    ...prev,
                    [focusedIndex]: {
                        ...prev[focusedIndex],
                        answer: null,
                    },
                }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [focusedIndex, exam.question_count, availableChoices, bulkModalOpen]);

    const handleApplyBulk = () => {
        const raw = bulkText.trim().toUpperCase();
        if (!raw) {
            setBulkModalOpen(false);
            return;
        }

        const validMap = new Set(availableChoices);
        const parsed: Record<number, string> = {};

        const kvRegex = /(\d+)\s*[:=\-.]\s*([A-E])/g;
        let match;
        let foundKv = false;

        while ((match = kvRegex.exec(raw)) !== null) {
            foundKv = true;
            const qNum = parseInt(match[1], 10);
            const choice = match[2];
            if (qNum >= 1 && qNum <= exam.question_count && validMap.has(choice)) {
                parsed[qNum] = choice;
            }
        }

        if (!foundKv) {
            const lettersOnly = raw.replace(/[^A-E]/g, '');
            for (let i = 0; i < lettersOnly.length; i++) {
                const qNum = i + 1;
                const char = lettersOnly[i];
                if (qNum <= exam.question_count && validMap.has(char)) {
                    parsed[qNum] = char;
                }
            }
        }

        setAnswers((prev) => {
            const next = { ...prev };
            Object.entries(parsed).forEach(([qStr, val]) => {
                const qNum = parseInt(qStr, 10);
                if (next[qNum]) {
                    next[qNum] = {
                        ...next[qNum],
                        answer: val,
                    };
                }
            });
            return next;
        });

        setBulkModalOpen(false);
        setBulkText('');
    };

    const handleSave = (markAsReady = false) => {
        setSubmitting(true);
        const payloadAnswers = Object.entries(answers).map(([qNum, data]) => ({
            question_number: parseInt(qNum, 10),
            correct_answer: data.answer,
            points: data.points,
        }));

        router.put(
            route('app.exams.answer-key.update', exam.ulid || exam.id),
            {
                answers: payloadAnswers,
                mark_as_ready: markAsReady,
            },
            {
                onFinish: () => setSubmitting(false),
            }
        );
    };

    const displayedQuestionNumbers = useMemo(() => {
        const numbers = Array.from({ length: exam.question_count }, (_, i) => i + 1);
        if (activeTab === 'unanswered') {
            return numbers.filter((num) => !answers[num]?.answer);
        }
        return numbers;
    }, [exam.question_count, activeTab, answers]);

    return (
        <AppLayout title={`Answer Key — ${exam.title}`}>
            <Head title={`Answer Key — ${exam.title}`} />

            <div className="space-y-5 max-w-6xl mx-auto pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <Link href={route('app.exams.show', exam.ulid || exam.id)}>
                            <Button variant="outline" size="sm" className="px-3 py-1.5 gap-1.5">
                                <ArrowLeft className="w-4 h-4" />
                                <span>Exam</span>
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    Answer Key Editor
                                </h1>
                                <Badge
                                    variant={
                                        exam.status === 'ready'
                                            ? 'success'
                                            : exam.status === 'archived'
                                                ? 'secondary'
                                                : 'warning'
                                    }
                                    size="sm"
                                >
                                    {exam.status.toUpperCase()}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {exam.title} • {exam.question_count} Questions • Choices: {availableChoices.join(', ')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBulkModalOpen(true)}
                            className="px-3 py-2 gap-2"
                        >
                            <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                            <span>Bulk Entry</span>
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={submitting}
                            onClick={() => handleSave(false)}
                            className="px-3.5 py-2 gap-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save Draft</span>
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            disabled={submitting}
                            onClick={() => handleSave(true)}
                            className="px-4 py-2 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            title="Publish and mark exam as ready"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Publish & Ready</span>
                        </Button>
                    </div>
                </div>

                <Card className="p-4 sm:p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                        <div className="sm:col-span-2">
                            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                                <span className="text-slate-700 dark:text-slate-200">Completion Progress</span>
                                <span className="text-blue-600 dark:text-blue-400 font-bold">
                                    {answeredCount} / {exam.question_count} ({completionPercentage}%)
                                </span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                                <div
                                    className={cn(
                                        'h-full transition-all duration-300 rounded-full',
                                        completionPercentage === 100
                                            ? 'bg-emerald-500'
                                            : completionPercentage > 50
                                                ? 'bg-blue-600'
                                                : 'bg-amber-500'
                                    )}
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                        </div>

                        <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-4">
                            <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Total Score</p>
                            <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                                {calculatedTotalScore} pts
                            </p>
                        </div>

                        <div className="flex items-center justify-end">
                            {firstUnansweredIndex ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleJumpToUnanswered}
                                    className="w-full sm:w-auto px-3 py-1.5 text-xs text-amber-700 border-amber-300 bg-amber-50/50 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-800 dark:bg-amber-950/40"
                                >
                                    <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                                    Next Unanswered (#{firstUnansweredIndex})
                                </Button>
                            ) : (
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <Check className="w-4 h-4" />
                                    All Questions Answered
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={activeTab === 'all' ? 'primary' : 'outline'}
                            size="xs"
                            onClick={() => setActiveTab('all')}
                            className="px-3 py-1.5"
                        >
                            All ({exam.question_count})
                        </Button>
                        <Button
                            variant={activeTab === 'unanswered' ? 'primary' : 'outline'}
                            size="xs"
                            onClick={() => setActiveTab('unanswered')}
                            className="px-3 py-1.5"
                        >
                            Unanswered ({exam.question_count - answeredCount})
                        </Button>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 text-2xs text-slate-500 dark:text-slate-400">
                        <Keyboard className="w-3.5 h-3.5" />
                        <span>Tip: Press A, B, C, D, E to set answers & advance automatically. Arrow keys to navigate.</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {displayedQuestionNumbers.map((qNum) => {
                        const item = answers[qNum] || { answer: null, points: 1 };
                        const isFocused = focusedIndex === qNum;

                        return (
                            <div
                                key={qNum}
                                ref={(el) => (questionRefs.current[qNum] = el)}
                                onClick={() => setFocusedIndex(qNum)}
                                className={cn(
                                    'p-3.5 rounded-xl border transition-all cursor-pointer bg-white dark:bg-slate-900',
                                    isFocused
                                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                                        : item.answer
                                            ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                            : 'border-amber-300/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                                )}
                            >
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={cn(
                                                'inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black',
                                                isFocused
                                                    ? 'bg-blue-600 text-white'
                                                    : item.answer
                                                        ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                                                        : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                                            )}
                                        >
                                            {qNum}
                                        </span>
                                        <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">
                                            Question {qNum}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-2xs text-slate-400">Pts:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={item.points}
                                            onChange={(e) => handlePointsChange(qNum, parseFloat(e.target.value) || 0)}
                                            className="w-14 px-1.5 py-0.5 text-xs text-right font-mono font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {availableChoices.map((choice) => {
                                        const isSelected = item.answer === choice;
                                        return (
                                            <button
                                                key={choice}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectChoice(qNum, choice);
                                                }}
                                                className={cn(
                                                    'flex-1 h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer',
                                                    isSelected
                                                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/40 font-black scale-102'
                                                        : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-700'
                                                )}
                                            >
                                                {choice}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="fixed bottom-0 inset-x-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3 px-4 shadow-lg lg:pl-72">
                    <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                                {answeredCount} / {exam.question_count} Answered
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {calculatedTotalScore} Total Points
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={submitting}
                                onClick={() => handleSave(false)}
                                className="px-3.5 py-2 font-medium"
                            >
                                <Save className="w-4 h-4 mr-1.5" />
                                Save Draft
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                disabled={submitting || answeredCount < exam.question_count}
                                onClick={() => handleSave(true)}
                                className="px-4 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                Publish & Mark Ready
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={bulkModalOpen}
                onClose={() => setBulkModalOpen(false)}
                title="Bulk Answer Key Entry"
                size="md"
            >
                <div className="space-y-4 text-xs">
                    <p className="text-slate-600 dark:text-slate-400">
                        Paste or type your answer key. Supports continuous strings (e.g.{' '}
                        <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 font-mono font-bold">
                            ABCDABCD
                        </code>
                        ) or numbered pairs (e.g.{' '}
                        <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 font-mono font-bold">
                            1:A, 2:B, 3:C
                        </code>
                        ).
                    </p>

                    <div>
                        <Textarea
                            rows={6}
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            placeholder="e.g. ABCDEABCDE or 1:A, 2:B, 3:C, 4:D..."
                            className="font-mono text-sm uppercase tracking-wider"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setBulkModalOpen(false)}
                            className="px-3.5 py-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleApplyBulk}
                            disabled={!bulkText.trim()}
                            className="px-4 py-2"
                        >
                            Apply Answer Key
                        </Button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}

