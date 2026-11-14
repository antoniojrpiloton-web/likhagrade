import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    FileText,
    ArrowLeft,
    Save,
    KeyRound,
    Calendar,
    BookOpen,
    Layers,
    Award,
    Hash,
    Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';

interface SubjectOption {
    id: number;
    name: string;
    code: string;
}

interface ClassOption {
    id: number;
    name: string;
    code: string;
}

interface PeriodOption {
    id: number;
    name: string;
    code: string;
}

interface ExamProps {
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
    subject_id: number | null;
    class_id: number | null;
    academic_period_id: number | null;
    exam_date: string | null;
    status: 'draft' | 'ready' | 'archived';
}

export default function Edit({
    exam,
    subjects = [],
    classes = [],
    periods = [],
}: {
    exam: ExamProps;
    subjects: SubjectOption[];
    classes: ClassOption[];
    periods: PeriodOption[];
}) {
    const { data, setData, put, processing, errors } = useForm({
        title: exam.title || '',
        description: exam.description || '',
        question_count: exam.question_count || 50,
        choice_count: exam.choice_count || 4,
        points_per_question: exam.points_per_question || 1,
        passing_score: exam.passing_score !== null ? exam.passing_score : '',
        passing_percentage: exam.passing_percentage !== null ? exam.passing_percentage : '',
        subject_id: exam.subject_id !== null ? String(exam.subject_id) : '',
        class_id: exam.class_id !== null ? String(exam.class_id) : '',
        academic_period_id: exam.academic_period_id !== null ? String(exam.academic_period_id) : '',
        exam_date: exam.exam_date || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('app.exams.update', exam.ulid || exam.id));
    };

    const calculatedTotalScore = Number(data.question_count || 0) * Number(data.points_per_question || 1);

    return (
        <AppLayout title={`Edit Examination — ${exam.title}`}>
            <Head title={`Edit — ${exam.title}`} />

            <div className="max-w-4xl mx-auto space-y-6 pb-12">
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
                                    Edit Examination
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
                                Update examination parameters, scoring, and optional academic links
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={route('app.exams.answer-key', exam.ulid || exam.id)}>
                            <Button variant="outline" size="sm" className="px-3 py-2 gap-1.5">
                                <KeyRound className="w-4 h-4 text-amber-500" />
                                <span>Answer Key</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="p-5 sm:p-6 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs space-y-5">
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                Basic Exam Information
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Set the exam title and optional instructions for students
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Examination Title <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Midterm Examination in General Science"
                                    error={errors.title}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Instructions or Notes (Optional)
                                </label>
                                <Textarea
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Provide any instructions or details regarding this exam..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Examination Date (Optional)
                                </label>
                                <Input
                                    type="date"
                                    value={data.exam_date}
                                    onChange={(e) => setData('exam_date', e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 sm:p-6 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs space-y-5">
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                Questions & Answer Structure
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Configure the number of test questions and choice bubbles
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Number of Questions <span className="text-rose-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={200}
                                    value={data.question_count}
                                    onChange={(e) => setData('question_count', parseInt(e.target.value, 10) || 1)}
                                    error={errors.question_count}
                                    required
                                />
                                <p className="text-2xs text-slate-400 mt-1">
                                    Supports 1 to 200 questions.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Choices per Question <span className="text-rose-500">*</span>
                                </label>
                                <Select
                                    value={String(data.choice_count)}
                                    onChange={(e) => setData('choice_count', parseInt(e.target.value, 10) || 4)}
                                    options={[
                                        { value: '2', label: '2 Choices (A, B) — True/False' },
                                        { value: '3', label: '3 Choices (A, B, C)' },
                                        { value: '4', label: '4 Choices (A, B, C, D) — Standard' },
                                        { value: '5', label: '5 Choices (A, B, C, D, E)' },
                                    ]}
                                    error={errors.choice_count}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Default Points / Question
                                </label>
                                <Input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={data.points_per_question}
                                    onChange={(e) => setData('points_per_question', e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 1))}
                                />
                                <p className="text-2xs text-slate-400 mt-1">
                                    Total: <strong className="text-blue-600 dark:text-blue-400">{calculatedTotalScore} pts</strong>
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Passing Score (Optional)
                                </label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={data.passing_score}
                                    onChange={(e) => setData('passing_score', e.target.value ? parseFloat(e.target.value) : '')}
                                    placeholder="e.g. 35"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Passing % (Optional)
                                </label>
                                <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    value={data.passing_percentage}
                                    onChange={(e) => setData('passing_percentage', e.target.value ? parseFloat(e.target.value) : '')}
                                    placeholder="e.g. 70"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 sm:p-6 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs space-y-5">
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Academic Associations
                                </h2>
                                <Badge variant="secondary" size="sm">Optional</Badge>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Link this exam to a class or subject for organized record-keeping. You can leave these blank.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Subject
                                </label>
                                <Select
                                    value={data.subject_id}
                                    onChange={(e) => setData('subject_id', e.target.value)}
                                    options={[
                                        { value: '', label: 'None (Standalone Exam)' },
                                        ...subjects.map((s) => ({ value: String(s.id), label: `${s.name} (${s.code})` })),
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Class
                                </label>
                                <Select
                                    value={data.class_id}
                                    onChange={(e) => setData('class_id', e.target.value)}
                                    options={[
                                        { value: '', label: 'None (Standalone Exam)' },
                                        ...classes.map((c) => ({ value: String(c.id), label: `${c.name} (${c.code})` })),
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Academic Term / Period
                                </label>
                                <Select
                                    value={data.academic_period_id}
                                    onChange={(e) => setData('academic_period_id', e.target.value)}
                                    options={[
                                        { value: '', label: 'None' },
                                        ...periods.map((p) => ({ value: String(p.id), label: `${p.name} (${p.code})` })),
                                    ]}
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="flex items-center justify-between gap-3 pt-2">
                        <Link href={route('app.exams.show', exam.ulid || exam.id)}>
                            <Button variant="secondary" size="md" className="px-4 py-2.5">
                                Cancel
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                disabled={processing}
                                className="px-5 py-2.5 gap-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>Save Changes</span>
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

