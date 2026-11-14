import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Calendar,
    BookOpen,
    Users2,
    Plus,
    Edit2,
    Archive,
    RotateCcw,
    CheckCircle2,
    Info,
    Layers,
    Search,
} from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

interface PeriodItem {
    id: number;
    name: string;
    code: string | null;
    type: string;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
    is_archived: boolean;
    classes_count: number;
}

interface SubjectItem {
    id: number;
    code: string | null;
    name: string;
    description: string | null;
    color: string | null;
    is_archived: boolean;
    classes_count: number;
}

interface SectionItem {
    id: number;
    name: string;
    code: string | null;
    grade_level: string | null;
    room: string | null;
    is_archived: boolean;
    classes_count: number;
}

interface AcademicSetupProps {
    periods: PeriodItem[];
    subjects: SubjectItem[];
    sections: SectionItem[];
}

export default function AcademicSetup({
    periods,
    subjects,
    sections,
}: AcademicSetupProps) {
    const [activeTab, setActiveTab] = useState<'periods' | 'subjects' | 'sections'>('periods');
    const [searchQuery, setSearchQuery] = useState('');

    const [periodModalOpen, setPeriodModalOpen] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<PeriodItem | null>(null);
    const [periodForm, setPeriodForm] = useState({
        name: '',
        code: '',
        type: 'semester',
        start_date: '',
        end_date: '',
        is_current: false,
    });

    const [subjectModalOpen, setSubjectModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
    const [subjectForm, setSubjectForm] = useState({
        name: '',
        code: '',
        description: '',
        color: '#3b82f6',
    });

    const [sectionModalOpen, setSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<SectionItem | null>(null);
    const [sectionForm, setSectionForm] = useState({
        name: '',
        code: '',
        grade_level: '',
        room: '',
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

    const openCreatePeriod = () => {
        setEditingPeriod(null);
        setPeriodForm({
            name: '',
            code: '',
            type: 'semester',
            start_date: '',
            end_date: '',
            is_current: false,
        });
        setPeriodModalOpen(true);
    };

    const openEditPeriod = (p: PeriodItem) => {
        setEditingPeriod(p);
        setPeriodForm({
            name: p.name,
            code: p.code || '',
            type: p.type || 'semester',
            start_date: p.start_date || '',
            end_date: p.end_date || '',
            is_current: p.is_current,
        });
        setPeriodModalOpen(true);
    };

    const submitPeriod = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPeriod) {
            router.patch(route('app.academic-periods.update', editingPeriod.id), periodForm, {
                onSuccess: () => setPeriodModalOpen(false),
            });
        } else {
            router.post(route('app.academic-periods.store'), periodForm, {
                onSuccess: () => setPeriodModalOpen(false),
            });
        }
    };

    const openCreateSubject = () => {
        setEditingSubject(null);
        setSubjectForm({
            name: '',
            code: '',
            description: '',
            color: '#3b82f6',
        });
        setSubjectModalOpen(true);
    };

    const openEditSubject = (s: SubjectItem) => {
        setEditingSubject(s);
        setSubjectForm({
            name: s.name,
            code: s.code || '',
            description: s.description || '',
            color: s.color || '#3b82f6',
        });
        setSubjectModalOpen(true);
    };

    const submitSubject = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSubject) {
            router.patch(route('app.subjects.update', editingSubject.id), subjectForm, {
                onSuccess: () => setSubjectModalOpen(false),
            });
        } else {
            router.post(route('app.subjects.store'), subjectForm, {
                onSuccess: () => setSubjectModalOpen(false),
            });
        }
    };

    const openCreateSection = () => {
        setEditingSection(null);
        setSectionForm({
            name: '',
            code: '',
            grade_level: '',
            room: '',
        });
        setSectionModalOpen(true);
    };

    const openEditSection = (sec: SectionItem) => {
        setEditingSection(sec);
        setSectionForm({
            name: sec.name,
            code: sec.code || '',
            grade_level: sec.grade_level || '',
            room: sec.room || '',
        });
        setSectionModalOpen(true);
    };

    const submitSection = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSection) {
            router.patch(route('app.sections.update', editingSection.id), sectionForm, {
                onSuccess: () => setSectionModalOpen(false),
            });
        } else {
            router.post(route('app.sections.store'), sectionForm, {
                onSuccess: () => setSectionModalOpen(false),
            });
        }
    };

    const filteredPeriods = periods.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredSections = sections.filter(sec =>
        sec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sec.code && sec.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sec.grade_level && sec.grade_level.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <AppLayout title="Academic Setup">
            <Head title="Academic Setup (Optional) — LikhaGrade" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Academic Setup
                        </h1>
                        <Badge variant="neutral">Optional Module</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Configure academic terms, subjects, and sections to organize your classes and reports.
                    </p>
                </div>
            </div>

            <div className="mb-5 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                    <p className="font-bold mb-0.5">Examination Checking Is Completely Independent</p>
                    <p className="text-blue-800 dark:text-blue-300">
                        You do not need to configure any subjects, sections, or academic periods before scanning answer sheets or creating tests. These records are strictly optional for teachers who want structured gradebook categorization.
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl w-fit">
                    <button
                        type="button"
                        onClick={() => { setActiveTab('periods'); setSearchQuery(''); }}
                        className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            activeTab === 'periods'
                                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Academic Periods ({periods.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('subjects'); setSearchQuery(''); }}
                        className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            activeTab === 'subjects'
                                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Subjects ({subjects.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { setActiveTab('sections'); setSearchQuery(''); }}
                        className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            activeTab === 'sections'
                                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        <Users2 className="w-3.5 h-3.5" />
                        <span>Sections ({sections.length})</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-48 sm:w-60">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    {activeTab === 'periods' && (
                        <Button variant="primary" size="sm" onClick={openCreatePeriod}>
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Period
                        </Button>
                    )}
                    {activeTab === 'subjects' && (
                        <Button variant="primary" size="sm" onClick={openCreateSubject}>
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Subject
                        </Button>
                    )}
                    {activeTab === 'sections' && (
                        <Button variant="primary" size="sm" onClick={openCreateSection}>
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Section
                        </Button>
                    )}
                </div>
            </div>

            {activeTab === 'periods' && (
                <Card className="border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Academic Term / Year</th>
                                    <th className="px-4 py-3">Code</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Date Range</th>
                                    <th className="px-4 py-3">Classes</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filteredPeriods.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                            No academic periods found. Click "Add Period" to define a school year or semester.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPeriods.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-2">
                                                    <span>{p.name}</span>
                                                    {p.is_current && (
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold uppercase">
                                                            Active Current
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-slate-500">{p.code || '—'}</td>
                                            <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">{p.type}</td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {p.start_date || p.end_date
                                                    ? `${p.start_date || 'Start'} to ${p.end_date || 'End'}`
                                                    : 'Not specified'}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                                                {p.classes_count} classes
                                            </td>
                                            <td className="px-4 py-3">
                                                {p.is_archived ? (
                                                    <Badge variant="neutral">Archived</Badge>
                                                ) : (
                                                    <Badge variant="success">Active</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {!p.is_current && !p.is_archived && (
                                                        <Button
                                                            variant="outline"
                                                            size="xs"
                                                            onClick={() => router.post(route('app.academic-periods.set-current', p.id))}
                                                        >
                                                            Set Current
                                                        </Button>
                                                    )}
                                                    <Button variant="outline" size="xs" onClick={() => openEditPeriod(p)}>
                                                        <Edit2 className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() =>
                                                            setArchiveDialog({
                                                                open: true,
                                                                title: p.is_archived ? 'Restore Academic Period' : 'Archive Academic Period',
                                                                message: `Are you sure you want to ${p.is_archived ? 'restore' : 'archive'} '${p.name}'?`,
                                                                url: route('app.academic-periods.archive', p.id),
                                                            })
                                                        }
                                                    >
                                                        {p.is_archived ? <RotateCcw className="w-3 h-3 text-emerald-600" /> : <Archive className="w-3 h-3 text-slate-500" />}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'subjects' && (
                <Card className="border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Subject Name</th>
                                    <th className="px-4 py-3">Code</th>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3">Classes</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filteredSubjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                            No subjects created yet. Click "Add Subject" to define course offerings.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubjects.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color || '#3b82f6' }} />
                                                    <span>{s.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-slate-500">{s.code || '—'}</td>
                                            <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{s.description || '—'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                                                {s.classes_count} classes
                                            </td>
                                            <td className="px-4 py-3">
                                                {s.is_archived ? (
                                                    <Badge variant="neutral">Archived</Badge>
                                                ) : (
                                                    <Badge variant="success">Active</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button variant="outline" size="xs" onClick={() => openEditSubject(s)}>
                                                        <Edit2 className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() =>
                                                            setArchiveDialog({
                                                                open: true,
                                                                title: s.is_archived ? 'Restore Subject' : 'Archive Subject',
                                                                message: `Are you sure you want to ${s.is_archived ? 'restore' : 'archive'} '${s.name}'?`,
                                                                url: route('app.subjects.archive', s.id),
                                                            })
                                                        }
                                                    >
                                                        {s.is_archived ? <RotateCcw className="w-3 h-3 text-emerald-600" /> : <Archive className="w-3 h-3 text-slate-500" />}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'sections' && (
                <Card className="border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Section Name</th>
                                    <th className="px-4 py-3">Code</th>
                                    <th className="px-4 py-3">Grade Level / Year</th>
                                    <th className="px-4 py-3">Assigned Room</th>
                                    <th className="px-4 py-3">Classes</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filteredSections.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                            No sections created yet. Click "Add Section" to define student cohorts.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSections.map((sec) => (
                                        <tr key={sec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                                {sec.name}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-slate-500">{sec.code || '—'}</td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{sec.grade_level || '—'}</td>
                                            <td className="px-4 py-3 text-slate-500">{sec.room || '—'}</td>
                                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                                                {sec.classes_count} classes
                                            </td>
                                            <td className="px-4 py-3">
                                                {sec.is_archived ? (
                                                    <Badge variant="neutral">Archived</Badge>
                                                ) : (
                                                    <Badge variant="success">Active</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button variant="outline" size="xs" onClick={() => openEditSection(sec)}>
                                                        <Edit2 className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="xs"
                                                        onClick={() =>
                                                            setArchiveDialog({
                                                                open: true,
                                                                title: sec.is_archived ? 'Restore Section' : 'Archive Section',
                                                                message: `Are you sure you want to ${sec.is_archived ? 'restore' : 'archive'} '${sec.name}'?`,
                                                                url: route('app.sections.archive', sec.id),
                                                            })
                                                        }
                                                    >
                                                        {sec.is_archived ? <RotateCcw className="w-3 h-3 text-emerald-600" /> : <Archive className="w-3 h-3 text-slate-500" />}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal
                isOpen={periodModalOpen}
                onClose={() => setPeriodModalOpen(false)}
                title={editingPeriod ? 'Edit Academic Period' : 'New Academic Period'}
                maxWidth="md"
            >
                <form onSubmit={submitPeriod} className="space-y-3.5">
                    <Input
                        label="Period / Term Name"
                        required
                        value={periodForm.name}
                        onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                        placeholder="e.g. AY 2026-2027 1st Semester"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Code (Optional)"
                            value={periodForm.code}
                            onChange={(e) => setPeriodForm({ ...periodForm, code: e.target.value })}
                            placeholder="e.g. 2627-1S"
                        />
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Term Type
                            </label>
                            <select
                                value={periodForm.type}
                                onChange={(e) => setPeriodForm({ ...periodForm, type: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            >
                                <option value="semester">Semester</option>
                                <option value="term">Term / Trimester</option>
                                <option value="quarter">Quarter</option>
                                <option value="year">Full Academic Year</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Start Date (Optional)"
                            type="date"
                            value={periodForm.start_date}
                            onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                        />
                        <Input
                            label="End Date (Optional)"
                            type="date"
                            value={periodForm.end_date}
                            onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="is_current"
                            checked={periodForm.is_current}
                            onChange={(e) => setPeriodForm({ ...periodForm, is_current: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="is_current" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            Set as current active period for this workspace
                        </label>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <Button type="button" variant="outline" size="sm" onClick={() => setPeriodModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm">
                            {editingPeriod ? 'Save Changes' : 'Create Period'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={subjectModalOpen}
                onClose={() => setSubjectModalOpen(false)}
                title={editingSubject ? 'Edit Subject' : 'New Subject'}
                maxWidth="md"
            >
                <form onSubmit={submitSubject} className="space-y-3.5">
                    <Input
                        label="Subject Name"
                        required
                        value={subjectForm.name}
                        onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                        placeholder="e.g. General Mathematics"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Subject Code (Optional)"
                            value={subjectForm.code}
                            onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                            placeholder="e.g. MATH101"
                        />
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Color Tag
                            </label>
                            <input
                                type="color"
                                value={subjectForm.color}
                                onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                                className="h-9 w-full rounded-xl border border-slate-300 dark:border-slate-700 p-1 bg-white dark:bg-slate-900 cursor-pointer"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={subjectForm.description}
                            onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                            placeholder="Brief description of the course curriculum or coverage..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <Button type="button" variant="outline" size="sm" onClick={() => setSubjectModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm">
                            {editingSubject ? 'Save Changes' : 'Create Subject'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={sectionModalOpen}
                onClose={() => setSectionModalOpen(false)}
                title={editingSection ? 'Edit Section' : 'New Section'}
                maxWidth="md"
            >
                <form onSubmit={submitSection} className="space-y-3.5">
                    <Input
                        label="Section Name"
                        required
                        value={sectionForm.name}
                        onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                        placeholder="e.g. Grade 10 - Diamond"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Section Code (Optional)"
                            value={sectionForm.code}
                            onChange={(e) => setSectionForm({ ...sectionForm, code: e.target.value })}
                            placeholder="e.g. G10-DIA"
                        />
                        <Input
                            label="Grade Level / Year"
                            value={sectionForm.grade_level}
                            onChange={(e) => setSectionForm({ ...sectionForm, grade_level: e.target.value })}
                            placeholder="e.g. Grade 10 or 2nd Year"
                        />
                    </div>
                    <Input
                        label="Assigned Room / Building (Optional)"
                        value={sectionForm.room}
                        onChange={(e) => setSectionForm({ ...sectionForm, room: e.target.value })}
                        placeholder="e.g. Science Wing Rm 302"
                    />
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <Button type="button" variant="outline" size="sm" onClick={() => setSectionModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm">
                            {editingSection ? 'Save Changes' : 'Create Section'}
                        </Button>
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

