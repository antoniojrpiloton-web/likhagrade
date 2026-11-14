import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    FileText,
    KeyRound,
    Sparkles,
    Calendar,
    BookOpen,
    Users,
    Layers,
} from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface SubjectOption {
    id: number;
    name: string;
    code: string | null;
}

interface ClassOption {
    id: number;
    name: string;
    code: string | null;
}

interface PeriodOption {
    id: number;
    name: string;
    code: string | null;
    is_current: boolean;
}

interface CreateExamProps {
    subjects: SubjectOption[];
    classes: ClassOption[];
    periods: PeriodOption[];
}

export default function CreateExam({ subjects, classes, periods }: CreateExamProps) {
    const currentPeriod = periods.find(p => p.is_current);

    const [form, setForm] = useState({
        title: '',
        description: '',
        question_count: 50,
        choice_count: 4,
        points_per_question: 1,
        passing_score: '',
        passing_percentage: '75',
        subject_id: '',
        class_id: '',
        academic_period_id: currentPeriod ? currentPeriod.id.toString() : '',
        exam_date: new Date().toISOString().split('T')[0],
    });

    const questionPresets = [20, 30, 40, 50, 60, 75, 100, 120];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...form,
            subject_id: form.subject_id ? parseInt(form.subject_id, 10) : null,
            class_id: form.class_id ? parseInt(form.class_id, 10) : null,
            academic_period_id: form.academic_period_id ? parseInt(form.academic_period_id, 10) : null,
            passing_score: form.passing_score ? parseFloat(form.passing_score) : null,
            passing_percentage: form.passing_percentage ? parseFloat(form.passing_percentage) : null,
            points_per_question: parseInt(form.points_per_question.toString(), 10) || 1,
        };

        router.post(route('app.exams.store'), payload);
    };

    const calculatedTotal = form.question_count * (parseInt(form.points_per_question.toString(), 10) || 1);

    return (
        <AppLayout title="Create Examination">
            <Head title="Create Examination — LikhaGrade" />

            <div className="mb-4">
                <Link
                    href={route('app.exams')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to All Examinations
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Create Custom Examination
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Configure questions, choices, scoring, and optional class associations.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
                <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs space-y-4">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Basic Information
                    </h2>

                    <Input
                        label="Examination Title"
                        required
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. 1st Periodic Examination in Mathematics 10"
                    />

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Description or Instructions (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Shade one bubble per question using HB or 2B pencil..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        />
                    </div>
                </Card>

                <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs space-y-4">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                        <KeyRound className="w-4 h-4 text-indigo-600" />
                        Questions & Multiple-Choice Layout
                    </h2>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Number of Questions: <span className="font-bold text-blue-600">{form.question_count} Questions</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {questionPresets.map((cnt) => (
                                <button
                                    key={cnt}
                                    type="button"
                                    onClick={() => setForm({ ...form, question_count: cnt })}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                                        form.question_count === cnt
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    {cnt} Qs
                                </button>
                            ))}
                        </div>
                        <Input
                            type="number"
                            min={1}
                            max={200}
                            value={form.question_count.toString()}
                            onChange={(e) => setForm({ ...form, question_count: parseInt(e.target.value, 10) || 1 })}
                            placeholder="Custom count (1–200)"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Answer Choices per Question
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[2, 3, 4, 5].map((cnt) => (
                                <button
                                    key={cnt}
                                    type="button"
                                    onClick={() => setForm({ ...form, choice_count: cnt })}
                                    className={`py-2 px-3 text-center rounded-xl border transition-all ${
                                        form.choice_count === cnt
                                            ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-600'
                                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className="block text-xs font-bold">{cnt} Choices</span>
                                    <span className="block text-2xs text-slate-400 font-mono mt-0.5">
                                        Options A–{String.fromCharCode(64 + cnt)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <Input
                            label="Default Points per Question"
                            type="number"
                            min="1"
                            step="1"
                            value={form.points_per_question.toString()}
                            onChange={(e) => setForm({ ...form, points_per_question: e.target.value === '' ? '' : (parseInt(e.target.value, 10) || 1) })}
                        />
                        <Input
                            label="Passing Percentage (%)"
                            type="number"
                            min="0"
                            max="100"
                            value={form.passing_percentage}
                            onChange={(e) => setForm({ ...form, passing_percentage: e.target.value })}
                            placeholder="e.g. 75"
                        />
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center flex flex-col justify-center">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Calculated Total Score</span>
                            <span className="text-xl font-black text-slate-900 dark:text-white">{calculatedTotal} pts</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-600" />
                            Academic Associations
                        </h2>
                        <Badge variant="neutral">Optional</Badge>
                    </div>

                    <p className="text-xs text-slate-500">
                        You can link this examination to a subject, section/class, or academic term for organized gradebook summaries.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Subject
                            </label>
                            <select
                                value={form.subject_id}
                                onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            >
                                <option value="">No subject assigned</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {s.code ? `(${s.code})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Class / Section
                            </label>
                            <select
                                value={form.class_id}
                                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            >
                                <option value="">No class assigned</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.code ? `(${c.code})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Academic Term
                            </label>
                            <select
                                value={form.academic_period_id}
                                onChange={(e) => setForm({ ...form, academic_period_id: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            >
                                <option value="">No academic term</option>
                                {periods.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.is_current ? '(Current)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Input
                        label="Examination Date (Optional)"
                        type="date"
                        value={form.exam_date}
                        onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                    />
                </Card>

                <div className="flex items-center justify-between pt-2">
                    <Link href={route('app.exams')}>
                        <Button type="button" variant="outline" size="md">
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" variant="primary" size="md">
                        Create & Open Answer Key Editor →
                    </Button>
                </div>
            </form>
        </AppLayout>
    );
}

