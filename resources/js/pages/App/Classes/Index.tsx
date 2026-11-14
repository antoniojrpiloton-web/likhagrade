import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    BookOpen,
    Plus,
    Users,
    Search,
    Edit2,
    Archive,
    RotateCcw,
    Layers,
    ChevronRight,
    Calendar,
    Clock,
    MapPin,
    ExternalLink,
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

interface SectionOption {
    id: number;
    name: string;
    code: string | null;
    grade_level: string | null;
}

interface PeriodOption {
    id: number;
    name: string;
    code: string | null;
    is_current: boolean;
}

interface TeacherOption {
    id: number;
    name: string;
    email: string;
}

interface ClassItem {
    id: number;
    name: string;
    code: string | null;
    subject_id: number | null;
    section_id: number | null;
    academic_period_id: number | null;
    teacher_id: number | null;
    room: string | null;
    schedule: string | null;
    description: string | null;
    is_archived: boolean;
    students_count: number;
    subject?: { id: number; name: string; code: string | null; color: string | null } | null;
    section?: { id: number; name: string; code: string | null; grade_level: string | null } | null;
    academicPeriod?: { id: number; name: string; code: string | null; is_current: boolean } | null;
    teacher?: { id: number; name: string; email: string } | null;
}

interface ClassesIndexProps {
    classes: ClassItem[];
    subjects: SubjectOption[];
    sections: SectionOption[];
    periods: PeriodOption[];
    teachers: TeacherOption[];
}

export default function ClassesIndex({
    classes,
    subjects,
    sections,
    periods,
    teachers,
}: ClassesIndexProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
    const [form, setForm] = useState({
        name: '',
        code: '',
        subject_id: '',
        section_id: '',
        academic_period_id: '',
        teacher_id: '',
        room: '',
        schedule: '',
        description: '',
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

    const openCreateModal = () => {
        setEditingClass(null);
        setForm({
            name: '',
            code: '',
            subject_id: '',
            section_id: '',
            academic_period_id: periods.find(p => p.is_current)?.id.toString() || '',
            teacher_id: '',
            room: '',
            schedule: '',
            description: '',
        });
        setModalOpen(true);
    };

    const openEditModal = (c: ClassItem) => {
        setEditingClass(c);
        setForm({
            name: c.name,
            code: c.code || '',
            subject_id: c.subject_id ? c.subject_id.toString() : '',
            section_id: c.section_id ? c.section_id.toString() : '',
            academic_period_id: c.academic_period_id ? c.academic_period_id.toString() : '',
            teacher_id: c.teacher_id ? c.teacher_id.toString() : '',
            room: c.room || '',
            schedule: c.schedule || '',
            description: c.description || '',
        });
        setModalOpen(true);
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...form,
            subject_id: form.subject_id ? parseInt(form.subject_id, 10) : null,
            section_id: form.section_id ? parseInt(form.section_id, 10) : null,
            academic_period_id: form.academic_period_id ? parseInt(form.academic_period_id, 10) : null,
            teacher_id: form.teacher_id ? parseInt(form.teacher_id, 10) : null,
        };

        if (editingClass) {
            router.patch(route('app.classes.update', editingClass.id), payload, {
                onSuccess: () => setModalOpen(false),
            });
        } else {
            router.post(route('app.classes.store'), payload, {
                onSuccess: () => setModalOpen(false),
            });
        }
    };

    const filteredClasses = classes.filter(c => {
        if (statusFilter === 'active' && c.is_archived) return false;
        if (statusFilter === 'archived' && !c.is_archived) return false;

        const q = searchQuery.toLowerCase();
        return (
            c.name.toLowerCase().includes(q) ||
            (c.code && c.code.toLowerCase().includes(q)) ||
            (c.subject && c.subject.name.toLowerCase().includes(q)) ||
            (c.section && c.section.name.toLowerCase().includes(q))
        );
    });

    return (
        <AppLayout title="Classes">
            <Head title="Class Management — LikhaGrade" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Classes & Sections
                        </h1>
                        <Badge variant="primary">Organized Roster</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Create classes, assign optional subjects/sections, and enroll students for structured reporting.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="primary" size="sm" onClick={openCreateModal}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        New Class
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search classes, subjects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e: any) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                    >
                        <option value="active">Active Classes</option>
                        <option value="archived">Archived Classes</option>
                        <option value="all">All Classes</option>
                    </select>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                    Showing {filteredClasses.length} of {classes.length} classes
                </span>
            </div>

            <Card className="border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Class Name</th>
                                <th className="px-4 py-3">Subject</th>
                                <th className="px-4 py-3">Section</th>
                                <th className="px-4 py-3">Academic Period</th>
                                <th className="px-4 py-3">Instructor</th>
                                <th className="px-4 py-3">Enrolled</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredClasses.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                        <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                        <p className="font-bold text-xs text-slate-700 dark:text-slate-300">No classes found</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Classes are optional. Click "New Class" to create one.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredClasses.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={route('app.classes.show', c.id)}
                                                className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                                            >
                                                <span>{c.name}</span>
                                                {c.code && (
                                                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        {c.code}
                                                    </span>
                                                )}
                                            </Link>
                                            {c.schedule && (
                                                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {c.schedule} {c.room && `• Rm ${c.room}`}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {c.subject ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.subject.color || '#3b82f6' }} />
                                                    {c.subject.name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-2xs italic">None</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">
                                            {c.section ? c.section.name : <span className="text-slate-400 text-2xs italic">None</span>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                            {c.academicPeriod ? c.academicPeriod.name : <span className="text-slate-400 text-2xs italic">None</span>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                            {c.teacher ? c.teacher.name : <span className="text-slate-400 text-2xs italic">Unassigned</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={route('app.classes.show', c.id)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 hover:bg-blue-100 transition-colors"
                                            >
                                                <Users className="w-3 h-3" />
                                                <span>{c.students_count} students</span>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            {c.is_archived ? (
                                                <Badge variant="neutral">Archived</Badge>
                                            ) : (
                                                <Badge variant="success">Active</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Link href={route('app.classes.show', c.id)}>
                                                    <Button variant="outline" size="xs">
                                                        Manage
                                                    </Button>
                                                </Link>
                                                <Button variant="outline" size="xs" onClick={() => openEditModal(c)}>
                                                    <Edit2 className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="xs"
                                                    onClick={() =>
                                                        setArchiveDialog({
                                                            open: true,
                                                            title: c.is_archived ? 'Restore Class' : 'Archive Class',
                                                            message: `Are you sure you want to ${c.is_archived ? 'restore' : 'archive'} class '${c.name}'?`,
                                                            url: route('app.classes.archive', c.id),
                                                        })
                                                    }
                                                >
                                                    {c.is_archived ? <RotateCcw className="w-3 h-3 text-emerald-600" /> : <Archive className="w-3 h-3 text-slate-500" />}
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

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingClass ? 'Edit Class' : 'Create New Class'}
                maxWidth="lg"
            >
                <form onSubmit={submitForm} className="space-y-3.5">
                    <Input
                        label="Class Name"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Science 10 - Section Diamond"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                            label="Class Code (Optional)"
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                            placeholder="e.g. SCI10-DIA"
                        />
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Academic Period (Optional)
                            </label>
                            <select
                                value={form.academic_period_id}
                                onChange={(e) => setForm({ ...form, academic_period_id: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            >
                                <option value="">No academic period</option>
                                {periods.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.is_current ? '(Active Current)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Subject (Optional)
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
                                Section (Optional)
                            </label>
                            <select
                                value={form.section_id}
                                onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            >
                                <option value="">No section assigned</option>
                                {sections.map((sec) => (
                                    <option key={sec.id} value={sec.id}>
                                        {sec.name} {sec.grade_level ? `(${sec.grade_level})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Assigned Teacher (Optional)
                            </label>
                            <select
                                value={form.teacher_id}
                                onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            >
                                <option value="">Assign to me (current user)</option>
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Room / Location (Optional)"
                            value={form.room}
                            onChange={(e) => setForm({ ...form, room: e.target.value })}
                            placeholder="e.g. Rm 204 or Science Lab"
                        />
                    </div>

                    <Input
                        label="Schedule (Optional)"
                        value={form.schedule}
                        onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                        placeholder="e.g. MWF 9:00 AM - 10:30 AM"
                    />

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Description / Notes (Optional)
                        </label>
                        <textarea
                            rows={2}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Optional notes regarding course syllabus or exam schedule..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm">
                            {editingClass ? 'Save Changes' : 'Create Class'}
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

