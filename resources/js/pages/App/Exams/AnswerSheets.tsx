import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Printer,
    Download,
    FileText,
    QrCode,
    Users,
    Layers,
    CheckCircle2,
    Clock,
    Sparkles,
    Eye,
    Info,
    RefreshCw,
    Sliders,
} from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/utils/cn';

interface ExamProps {
    id: number;
    ulid: string;
    title: string;
    question_count: number;
    choice_count: number;
    status: string;
    exam_date: string | null;
    subject?: { name: string; code: string } | null;
    schoolClass?: { id: number; name: string; code: string } | null;
}

interface BatchItem {
    id: number;
    batch_ulid: string;
    mode: 'generic' | 'student_assigned';
    paper_size: string;
    quantity: number;
    created_at: string;
    creator?: { first_name: string; last_name: string } | null;
}

interface ClassItem {
    id: number;
    name: string;
    code: string;
    students_count?: number;
}

interface StudentItem {
    id: number;
    student_id?: string;
    student_id_number?: string;
    first_name: string;
    last_name: string;
}

interface LayoutSpec {
    template_version: string;
    paper_size: string;
    page_width_mm: number;
    page_height_mm: number;
    question_count: number;
    choice_count: number;
    total_pages: number;
    pages: Array<{
        page_number: number;
        total_pages: number;
        columns_count: number;
        columns: Array<{
            column_index: number;
            start_question: number;
            end_question: number;
            questions: Array<{
                question_number: number;
                bubbles: Record<string, { choice: string }>;
            }>;
        }>;
    }>;
}

export default function AnswerSheets({
    exam,
    tenant,
    paperSize: initialPaperSize,
    layoutSpec,
    sampleQrSvg,
    batches = [],
    classes = [],
    students = [],
}: {
    exam: ExamProps;
    tenant: { name: string };
    paperSize: string;
    layoutSpec: LayoutSpec;
    sampleQrSvg: string;
    batches: BatchItem[];
    classes: ClassItem[];
    students: StudentItem[];
}) {
    const [mode, setMode] = useState<'generic' | 'student_assigned'>('generic');
    const [paperSize, setPaperSize] = useState<string>(initialPaperSize || 'A4');
    const [selectedClassId, setSelectedClassId] = useState<string>(
        exam.schoolClass?.id ? String(exam.schoolClass.id) : ''
    );

    const handlePaperSizeChange = (newSize: string) => {
        setPaperSize(newSize);
        router.get(
            route('app.exams.answer-sheets', exam.ulid || exam.id),
            { paper_size: newSize },
            { preserveState: true, replace: true }
        );
    };

    const downloadPdfUrl = `${route('app.exams.answer-sheets.generate', exam.ulid || exam.id)}?mode=${mode}&paper_size=${paperSize}&format=pdf${mode === 'student_assigned' && selectedClassId ? `&class_id=${selectedClassId}` : '&quantity=1'}`;
    const downloadPngUrl = `${route('app.exams.answer-sheets.generate', exam.ulid || exam.id)}?mode=${mode}&paper_size=${paperSize}&format=png${mode === 'student_assigned' && selectedClassId ? `&class_id=${selectedClassId}` : '&quantity=1'}`;

    const currentPage = layoutSpec.pages[0];

    const selectedClassObj = classes.find((c) => String(c.id) === selectedClassId);

    return (
        <AppLayout title={`Print Answer Sheets — ${exam.title}`}>
            <Head title={`Print Answer Sheets — ${exam.title}`} />

            <div className="max-w-7xl mx-auto space-y-6 pb-16">
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
                                    Printable OMR Answer Sheets
                                </h1>
                                <Badge variant="info" size="sm">
                                    Template {layoutSpec.template_version}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {exam.title} • {exam.question_count} Questions • {exam.choice_count} Choices • Single Page Standard
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={route('app.exams.answer-key', exam.ulid || exam.id)}>
                            <Button variant="outline" size="sm" className="px-3 py-2 gap-1.5">
                                <Sliders className="w-4 h-4 text-amber-500" />
                                <span>Edit Answer Key</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-5 space-y-5">
                        <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs space-y-5">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Printer className="w-4 h-4 text-blue-600" />
                                    <span>Generation Configuration</span>
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Configure sheet mode, quantity, and print format
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Answer Sheet Mode
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMode('generic')}
                                            className={cn(
                                                'p-3 rounded-xl border text-left transition-all cursor-pointer',
                                                mode === 'generic'
                                                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                                            )}
                                        >
                                            <p className="text-xs font-bold">Generic Sheets</p>
                                            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                                                Blank student line. Perfect for quick scan tests.
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setMode('student_assigned')}
                                            className={cn(
                                                'p-3 rounded-xl border text-left transition-all cursor-pointer',
                                                mode === 'student_assigned'
                                                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                                            )}
                                        >
                                            <p className="text-xs font-bold">Student-Assigned</p>
                                            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                                                Pre-printed names & IDs from class rosters.
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Paper & Layout
                                        </label>
                                        {(paperSize === 'A4_2Up' || paperSize === 'Letter_2Up') && (
                                            <Badge variant="success" size="xs" className="gap-1 font-bold">
                                                <span>50% Paper Savings ✂️</span>
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handlePaperSizeChange('A4')}
                                            className={cn(
                                                'py-2 px-3 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer',
                                                paperSize === 'A4'
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                    : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            )}
                                        >
                                            A4 (1-Up Portrait)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handlePaperSizeChange('Letter')}
                                            className={cn(
                                                'py-2 px-3 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer',
                                                paperSize === 'Letter'
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                    : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            )}
                                        >
                                            Letter (1-Up Portrait)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handlePaperSizeChange('A4_2Up')}
                                            className={cn(
                                                'py-2 px-3 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer',
                                                paperSize === 'A4_2Up'
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                    : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            )}
                                        >
                                            A4 (2-Up Landscape ✂️)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handlePaperSizeChange('Letter_2Up')}
                                            className={cn(
                                                'py-2 px-3 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer',
                                                paperSize === 'Letter_2Up'
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                    : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                            )}
                                        >
                                            Letter (2-Up Landscape ✂️)
                                        </button>
                                    </div>
                                    {(paperSize === 'A4_2Up' || paperSize === 'Letter_2Up') && (
                                        <p className="text-2xs text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium leading-relaxed">
                                            Prints 2 complete answer sheets side-by-side with a center dashed cutting guide line. Cut in half to get 2 individual test sheets.
                                        </p>
                                    )}
                                </div>

                                {mode === 'generic' ? (
                                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                                            <span>1-Page Master Sheet (ZipGrade Standard)</span>
                                        </div>
                                        <p className="text-2xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            Single scannable master page containing all {exam.question_count} questions. Teachers can photocopy or print multiple copies on demand.
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Select Class Roster
                                        </label>
                                        <Select
                                            value={selectedClassId}
                                            onChange={(e) => setSelectedClassId(e.target.value)}
                                            options={[
                                                { value: '', label: 'Select a class...' },
                                                ...classes.map((c) => ({
                                                    value: String(c.id),
                                                    label: `${c.name} (${c.code}) — ${c.students_count || 0} students`,
                                                })),
                                            ]}
                                        />
                                        {selectedClassObj && (
                                            <p className="text-2xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                                                Will generate {selectedClassObj.students_count || 0} personalized answer sheets.
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 text-2xs space-y-1 text-blue-900 dark:text-blue-300">
                                    <div className="flex items-center gap-1.5 font-bold">
                                        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        <span>Print Guidelines for Best Scan Accuracy</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        Print at <strong>100% scale (Do Not Scale / Fit to Page)</strong> on standard white copy paper. High-contrast solid registration markers guarantee fast phone camera capture.
                                    </p>
                                </div>

                                <div className="space-y-2 pt-1">
                                    <a
                                        href={downloadPdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            'w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer',
                                            mode === 'student_assigned' && !selectedClassId && 'pointer-events-none opacity-50'
                                        )}
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span>View / Print PDF ({mode === 'generic' ? '1-Page Master' : `${selectedClassObj?.students_count || 0} Sheets`})</span>
                                    </a>

                                    <a
                                        href={downloadPngUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            'w-full py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer',
                                            mode === 'student_assigned' && !selectedClassId && 'pointer-events-none opacity-50'
                                        )}
                                    >
                                        <Download className="w-4 h-4 text-emerald-600" />
                                        <span>Download PNG ({mode === 'generic' ? '1-Page High-Res' : 'ZIP Bundle'})</span>
                                    </a>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Print History & Batches</span>
                                </h3>
                                <span className="text-2xs text-slate-400">
                                    {batches.length} batch(es)
                                </span>
                            </div>

                            {batches.length === 0 ? (
                                <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                                    No answer sheet batches generated yet.
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {batches.map((b) => (
                                        <div
                                            key={b.id}
                                            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-800/40"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                                        {b.quantity} {b.mode === 'generic' ? 'Generic' : 'Assigned'} Sheets
                                                    </span>
                                                    <Badge variant="secondary" size="xs">
                                                        {b.paper_size}
                                                    </Badge>
                                                </div>
                                                <p className="text-2xs text-slate-400 mt-0.5 truncate">
                                                    Batch: {b.batch_ulid.substring(0, 14)}... • {new Date(b.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <a
                                                    href={`${route('app.exams.answer-sheets.download-batch', [exam.ulid || exam.id, b.batch_ulid || b.id])}?format=pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button variant="outline" size="xs" className="px-2 py-1 text-2xs gap-1 font-semibold">
                                                        <Printer className="w-3 h-3 text-blue-600" />
                                                        <span>PDF</span>
                                                    </Button>
                                                </a>
                                                <a
                                                    href={`${route('app.exams.answer-sheets.download-batch', [exam.ulid || exam.id, b.batch_ulid || b.id])}?format=png`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button variant="outline" size="xs" className="px-2 py-1 text-2xs gap-1 font-semibold">
                                                        <Download className="w-3 h-3 text-emerald-600" />
                                                        <span>PNG</span>
                                                    </Button>
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="lg:col-span-7 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Authoritative Sheet Preview</span>
                                </h3>
                                <Badge variant="secondary" size="xs">
                                    100% Geometry Match
                                </Badge>
                            </div>
                        </div>

                        <div className="w-full h-[840px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-md overflow-hidden relative">
                            <iframe
                                src={`${downloadPdfUrl}#toolbar=0&navpanes=0`}
                                className="w-full h-full border-0 bg-white"
                                title="Live OMR Sheet PDF Preview"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

