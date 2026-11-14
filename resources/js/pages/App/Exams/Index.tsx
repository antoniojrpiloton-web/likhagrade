import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    FileText,
    Plus,
    Search,
    CheckCircle2,
    Clock,
    Copy,
    Edit2,
    Archive,
    RotateCcw,
    ChevronRight,
    ExternalLink,
    Filter,
    Layers,
    BookOpen,
    KeyRound,
    Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

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
}

interface ExaminationItem {
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
    answered_questions_count: number;
    exam_date: string | null;
    created_at: string;
    subject?: { id: number; name: string; code: string | null; color: string | null } | null;
    schoolClass?: { id: number; name: string; code: string | null } | null;
    academicPeriod?: { id: number; name: string } | null;
}

interface ExamsIndexProps {
    examinations: ExaminationItem[];
    subjects: SubjectOption[];
    classes: ClassOption[];
    periods: PeriodOption[];
    summary: {
        total: number;
        ready: number;
        draft: number;
        archived: number;
    };
    filters: {
        status?: string;
        subject_id?: string;
        class_id?: string;
        search?: string;
    };
}

export default function ExamsIndex({
    examinations,
    subjects,
    classes,
    periods,
    summary,
    filters,
}: ExamsIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const [subjectFilter, setSubjectFilter] = useState(filters.subject_id || '');
    const [classFilter, setClassFilter] = useState(filters.class_id || '');

    const [quickModalOpen, setQuickModalOpen] = useState(false);
    const [quickForm, setQuickForm] = useState({
        title: '',
        question_count: 50,
        choice_count: 4,
        points_per_question: 1,
    });

    const [archiveDialog, setArchiveDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        url: string;
    }>({
        open: false,
        title: '',
        message: '',
        url: '',
    });

    const questionPresets = [20, 30, 40, 50, 60, 75, 100, 120];

    const submitQuickCreate = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('app.exams.store'), quickForm, {
            onSuccess: () => setQuickModalOpen(false),
        });
    };

    const duplicateExam = (exam: ExaminationItem) => {
        router.post(route('app.exams.duplicate', exam.ulid || exam.id));
    };

    const filteredExams = examinations.filter((exam) => {
        if (statusFilter && exam.status !== statusFilter) return false;
        if (subjectFilter && exam.subject?.id.toString() !== subjectFilter) return false;
        if (classFilter && exam.schoolClass?.id.toString() !== classFilter) return false;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                exam.title.toLowerCase().includes(q) ||
                exam.ulid.toLowerCase().includes(q) ||
                (exam.subject && exam.subject.name.toLowerCase().includes(q)) ||
                (exam.schoolClass && exam.schoolClass.name.toLowerCase().includes(q))
            );
        }

        return true;
    });

    return (
        <AppLayout title="Examinations">
            <Head title="Examinations & Answer Keys — LikhaGrade" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Exams & Quizzes
                        </h1>
                        <Badge variant="primary">Answer Key Engine</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Create multiple-choice exams, configure correct answer keys, and prepare for OMR checking.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={route('app.exams.create')}>
                        <Button variant="outline" size="sm">
                            Custom Exam
                        </Button>
                    </Link>
                    <Button variant="primary" size="sm" onClick={() => setQuickModalOpen(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Quick Create Exam
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div
                    onClick={() => setStatusFilter('')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        statusFilter === ''
                            ? 'bg-blue-50/70 border-blue-400 dark:bg-blue-950/40'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 hover:border-slate-400'
                    }`}
                >
                    <span className="text-[10px] font-bold uppercase text-slate-500">All Examinations</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{summary.total}</p>
                </div>
                <div
                    onClick={() => setStatusFilter('ready')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        statusFilter === 'ready'
                            ? 'bg-emerald-50/70 border-emerald-400 dark:bg-emerald-950/40'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 hover:border-slate-400'
                    }`}
                >
                    <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Ready for Scan</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{summary.ready}</p>
                </div>
                <div
                    onClick={() => setStatusFilter('draft')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        statusFilter === 'draft'
                            ? 'bg-amber-50/70 border-amber-400 dark:bg-amber-950/40'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 hover:border-slate-400'
                    }`}
                >
                    <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Draft / Incomplete</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{summary.draft}</p>
                </div>
                <div
                    onClick={() => setStatusFilter('archived')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        statusFilter === 'archived'
                            ? 'bg-slate-200 border-slate-400 dark:bg-slate-800'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800 hover:border-slate-400'
                    }`}
                >
                    <span className="text-[10px] font-bold uppercase text-slate-500">Archived</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{summary.archived}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                    <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search exams by title or ULID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    >
                        <option value="">All Subjects</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id.toString()}>
                                {s.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    >
                        <option value="">All Classes</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id.toString()}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="text-xs text-slate-500 font-semibold shrink-0">
                    Showing {filteredExams.length} of {examinations.length} exams
                </div>
            </div>

            <Card className="border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Examination</th>
                                <th className="px-4 py-3">Configuration</th>
                                <th className="px-4 py-3">Answer Key Progress</th>
                                <th className="px-4 py-3">Subject / Class</th>
                                <th className="px-4 py-3">Scoring</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredExams.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                                        <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                        <p className="font-bold text-xs text-slate-700 dark:text-slate-300">No examinations found</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                                            Quickly create an examination with title, question count, and choices.
                                        </p>
                                        <Button variant="primary" size="sm" onClick={() => setQuickModalOpen(true)}>
                                            <Plus className="w-3.5 h-3.5 mr-1" />
                                            Quick Create Exam
                                        </Button>
                                    </td>
                                </tr>
                            ) : (
                                filteredExams.map((exam) => {
                                    const percent = exam.question_count > 0
                                        ? Math.round((exam.answered_questions_count / exam.question_count) * 100)
                                        : 0;
                                    const isComplete = exam.answered_questions_count === exam.question_count;

                                    return (
                                        <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={route('app.exams.show', exam.ulid || exam.id)}
                                                    className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                                                >
                                                    <span>{exam.title}</span>
                                                </Link>
                                                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                                                    ULID: {exam.ulid}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                                <div className="font-semibold">
                                                    {exam.question_count} Questions
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {exam.choice_count} Choices (A–{String.fromCharCode(64 + exam.choice_count)})
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="w-36">
                                                    <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                                                        <span className={isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}>
                                                            {exam.answered_questions_count} / {exam.question_count} Keys
                                                        </span>
                                                        <span className="text-slate-400">{percent}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                isComplete ? 'bg-emerald-500' : 'bg-blue-500'
                                                            }`}
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {exam.subject ? (
                                                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: exam.subject.color || '#3b82f6' }} />
                                                        {exam.subject.name}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-2xs italic">No subject</span>
                                                )}
                                                {exam.schoolClass && (
                                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                                        Class: {exam.schoolClass.name}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                                <div className="font-bold">
                                                    {exam.total_score} pts
                                                </div>
                                                {exam.passing_score !== null && (
                                                    <div className="text-[10px] text-slate-400">
                                                        Pass: {exam.passing_score} pts
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {exam.status === 'ready' && <Badge variant="success">Ready</Badge>}
                                                {exam.status === 'draft' && <Badge variant="warning">Draft</Badge>}
                                                {exam.status === 'archived' && <Badge variant="neutral">Archived</Badge>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link href={route('app.exams.answer-key', exam.ulid || exam.id)}>
                                                        <Button variant="primary" size="xs">
                                                            <KeyRound className="w-3 h-3 mr-1" />
                                                            Answer Key
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="xs"
                                                        title="Duplicate examination"
                                                        onClick={() => duplicateExam(exam)}
                                                    >
                                                        <Copy className="w-3 h-3 text-slate-500" />
                                                    </Button>
                                                    <Link href={route('app.exams.edit', exam.ulid || exam.id)}>
                                                        <Button variant="outline" size="xs">
                                                            <Edit2 className="w-3 h-3" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() =>
                                                            setArchiveDialog({
                                                                open: true,
                                                                title: exam.status === 'archived' ? 'Restore Examination' : 'Archive Examination',
                                                                message: `Are you sure you want to ${exam.status === 'archived' ? 'restore' : 'archive'} '${exam.title}'?`,
                                                                url: route('app.exams.archive', exam.ulid || exam.id),
                                                            })
                                                        }
                                                    >
                                                        {exam.status === 'archived' ? <RotateCcw className="w-3 h-3 text-emerald-600" /> : <Archive className="w-3 h-3 text-slate-500" />}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={quickModalOpen}
                onClose={() => setQuickModalOpen(false)}
                title="Quick Create Examination"
                maxWidth="md"
            >
                <form onSubmit={submitQuickCreate} className="space-y-4">
                    <p className="text-xs text-slate-500">
                        Enter 3 basic fields. You will be directed straight to the <strong>Answer Key Editor</strong> upon creation.
                    </p>

                    <Input
                        label="Examination Title"
                        required
                        value={quickForm.title}
                        onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                        placeholder="e.g. Midterm Examination in Science 10"
                    />

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Number of Questions: <span className="font-bold text-blue-600">{quickForm.question_count} Qs</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {questionPresets.map((cnt) => (
                                <button
                                    key={cnt}
                                    type="button"
                                    onClick={() => setQuickForm({ ...quickForm, question_count: cnt })}
                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                                        quickForm.question_count === cnt
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
                            value={quickForm.question_count.toString()}
                            onChange={(e) => setQuickForm({ ...quickForm, question_count: parseInt(e.target.value, 10) || 1 })}
                            placeholder="Or enter custom count (1–200)"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Answer Choices per Question
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {[2, 3, 4, 5].map((cnt) => (
                                <button
                                    key={cnt}
                                    type="button"
                                    onClick={() => setQuickForm({ ...quickForm, choice_count: cnt })}
                                    className={`py-2 px-2 text-center rounded-xl border transition-all ${
                                        quickForm.choice_count === cnt
                                            ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-600'
                                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className="block text-xs font-bold">{cnt} Options</span>
                                    <span className="block text-2xs text-slate-400 font-mono mt-0.5">
                                        A–{String.fromCharCode(64 + cnt)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                        <Link
                            href={route('app.exams.create')}
                            className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                            More Options (Subject, Class, Dates)
                        </Link>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setQuickModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" size="sm">
                                Create & Enter Answer Key →
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmationDialog
                isOpen={archiveDialog.open}
                onClose={() => setArchiveDialog({ ...archiveDialog, open: false })}
                onConfirm={() => {
                    router.post(archiveDialog.url, {}, {
                        onSuccess: () => setArchiveDialog({ ...archiveDialog, open: false }),
                    });
                }}
                title={archiveDialog.title}
                message={archiveDialog.message}
                confirmText="Proceed"
            />
        </AppLayout>
    );
}

