import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    KeyRound,
    Edit2,
    Copy,
    Archive,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Clock,
    BookOpen,
    Users,
    Layers,
    Sparkles,
    FileText,
    Printer,
    Download,
} from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

interface QuestionItem {
    id: number;
    question_number: number;
    correct_answer: string | null;
    points: number;
}

interface ExamDetail {
    id: number;
    ulid: string;
    title: string;
    description: string | null;
    question_count: number;
    choice_count: number;
    points_per_question: number;
    total_score: number;
    passing_score: number | null;
    passing_percentage: number | null;
    status: 'draft' | 'ready' | 'archived';
    answered_count: number;
    is_answer_key_complete: boolean;
    available_choices: string[];
    exam_date: string | null;
    created_at: string;
    subject?: { id: number; name: string; code: string | null; color: string | null } | null;
    schoolClass?: { id: number; name: string; code: string | null } | null;
    academicPeriod?: { id: number; name: string } | null;
    creator?: { id: number; name: string; email: string } | null;
    questions: QuestionItem[];
}

interface ExamShowProps {
    exam: ExamDetail;
}

export default function ExamShow({ exam }: ExamShowProps) {
    const [archiveDialog, setArchiveDialog] = useState(false);
    const [statusDialog, setStatusDialog] = useState<{
        open: boolean;
        targetStatus: 'ready' | 'draft';
    }>({ open: false, targetStatus: 'ready' });

    const percent = exam.question_count > 0
        ? Math.round((exam.answered_count / exam.question_count) * 100)
        : 0;

    const duplicateExam = () => {
        router.post(route('app.exams.duplicate', exam.ulid || exam.id));
    };

    const toggleStatus = (target: 'ready' | 'draft') => {
        router.post(route('app.exams.status', exam.ulid || exam.id), { status: target });
    };

    return (
        <AppLayout title={exam.title}>
            <Head title={`${exam.title} — Examination Details`} />

            <div className="mb-4">
                <Link
                    href={route('app.exams')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to All Examinations
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between pb-5 gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {exam.title}
                        </h1>
                        {exam.status === 'ready' && <Badge variant="success">Ready for Scanning</Badge>}
                        {exam.status === 'draft' && <Badge variant="warning">Draft (Incomplete)</Badge>}
                        {exam.status === 'archived' && <Badge variant="neutral">Archived</Badge>}
                    </div>
                    <p className="font-mono text-xs text-slate-400">
                        ULID: {exam.ulid} • Created {new Date(exam.created_at).toLocaleDateString()}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link href={route('app.exams.answer-sheets', exam.ulid || exam.id)}>
                        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/40">
                            <Printer className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                            Print Answer Sheets
                        </Button>
                    </Link>

                    <Link href={route('app.exams.answer-key', exam.ulid || exam.id)}>
                        <Button variant="primary" size="sm">
                            <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                            Answer Key Editor
                        </Button>
                    </Link>

                    {exam.status === 'draft' && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => toggleStatus('ready')}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            Mark as Ready
                        </Button>
                    )}

                    {exam.status === 'ready' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatus('draft')}
                        >
                            Set Back to Draft
                        </Button>
                    )}

                    <Button variant="outline" size="sm" onClick={duplicateExam} title="Duplicate examination">
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Duplicate
                    </Button>

                    <Link href={route('app.exams.edit', exam.ulid || exam.id)}>
                        <Button variant="outline" size="sm">
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Edit
                        </Button>
                    </Link>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setArchiveDialog(true)}
                    >
                        {exam.status === 'archived' ? (
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                            <Archive className="w-3.5 h-3.5 text-slate-500" />
                        )}
                    </Button>
                </div>
            </div>

            {exam.status === 'draft' && !exam.is_answer_key_complete && (
                <div className="mb-6 p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                Answer Key Incomplete ({exam.answered_count} of {exam.question_count} answered)
                            </p>
                            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                                Set the correct answers for all questions before this examination can be marked as ready.
                            </p>
                        </div>
                    </div>
                    <Link href={route('app.exams.answer-key', exam.ulid || exam.id)}>
                        <Button variant="primary" size="sm">
                            Complete Answer Key →
                        </Button>
                    </Link>
                </div>
            )}

            {exam.status === 'ready' && (
                <div className="mb-6 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                Examination Ready for Scanning
                            </p>
                            <p className="text-xs text-emerald-800 dark:text-emerald-300">
                                All {exam.question_count} answer keys are validated. Total score: {exam.total_score} pts.
                            </p>
                        </div>
                    </div>
                    <Link href={route('app.exams.answer-key', exam.ulid || exam.id)}>
                        <Button variant="outline" size="sm">
                            Review Answer Key
                        </Button>
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <Card className="p-3.5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Total Questions</span>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{exam.question_count} Qs</p>
                    <span className="text-2xs text-slate-400">
                        {exam.choice_count} Options (A–{String.fromCharCode(64 + exam.choice_count)})
                    </span>
                </Card>

                <Card className="p-3.5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Total Score</span>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{exam.total_score} pts</p>
                    <span className="text-2xs text-slate-400">
                        Default {exam.points_per_question} pt/question
                    </span>
                </Card>

                <Card className="p-3.5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Passing Threshold</span>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                        {exam.passing_score !== null ? `${exam.passing_score} pts` : `${exam.passing_percentage || 75}%`}
                    </p>
                    <span className="text-2xs text-slate-400">Minimum passing score</span>
                </Card>

                <Card className="p-3.5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <span className="text-[10px] font-bold uppercase text-slate-500">Key Progress</span>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                        {exam.answered_count} / {exam.question_count}
                    </p>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full ${exam.is_answer_key_complete ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-blue-600" />
                                Answer Key Sheet Preview ({exam.answered_count}/{exam.question_count} Set)
                            </h2>
                            <Link href={route('app.exams.answer-key', exam.ulid || exam.id)}>
                                <Button variant="outline" size="xs">
                                    Edit Keys
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                            {exam.questions.map((q) => (
                                <div
                                    key={q.question_number}
                                    className={`p-2 rounded-xl text-center border transition-all ${
                                        q.correct_answer
                                            ? 'border-blue-300 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200'
                                            : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900 text-slate-400'
                                    }`}
                                >
                                    <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                        Q{q.question_number}
                                    </span>
                                    <span className="block text-sm font-black mt-0.5">
                                        {q.correct_answer || '—'}
                                    </span>
                                    <span className="block text-[9px] text-slate-400 font-medium">
                                        {q.points} pt
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {exam.description && (
                        <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                                Examination Instructions / Notes
                            </h2>
                            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                {exam.description}
                            </p>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs space-y-3.5">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-600" />
                            Academic Context
                        </h2>

                        <div className="space-y-2.5 text-xs">
                            <div>
                                <span className="block text-[10px] font-bold uppercase text-slate-400">Subject</span>
                                {exam.subject ? (
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: exam.subject.color || '#3b82f6' }} />
                                        {exam.subject.name} ({exam.subject.code || 'No code'})
                                    </span>
                                ) : (
                                    <span className="text-slate-400 italic">None assigned</span>
                                )}
                            </div>

                            <div>
                                <span className="block text-[10px] font-bold uppercase text-slate-400">Class / Section</span>
                                {exam.schoolClass ? (
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                                        {exam.schoolClass.name}
                                    </span>
                                ) : (
                                    <span className="text-slate-400 italic">None assigned</span>
                                )}
                            </div>

                            <div>
                                <span className="block text-[10px] font-bold uppercase text-slate-400">Academic Period</span>
                                {exam.academicPeriod ? (
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                                        {exam.academicPeriod.name}
                                    </span>
                                ) : (
                                    <span className="text-slate-400 italic">None assigned</span>
                                )}
                            </div>

                            <div>
                                <span className="block text-[10px] font-bold uppercase text-slate-400">Examination Date</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                                    {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'Not scheduled'}
                                </span>
                            </div>

                            <div>
                                <span className="block text-[10px] font-bold uppercase text-slate-400">Created By</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">
                                    {exam.creator?.name || 'Instructor'}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <ConfirmationDialog
                isOpen={archiveDialog}
                onClose={() => setArchiveDialog(false)}
                onConfirm={() => {
                    router.post(route('app.exams.archive', exam.ulid || exam.id), {}, {
                        onSuccess: () => setArchiveDialog(false),
                    });
                }}
                title={exam.status === 'archived' ? 'Restore Examination' : 'Archive Examination'}
                message={`Are you sure you want to ${exam.status === 'archived' ? 'restore' : 'archive'} '${exam.title}'?`}
                confirmText="Proceed"
            />
        </AppLayout>
    );
}

