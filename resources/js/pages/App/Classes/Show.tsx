import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    Users,
    UserPlus,
    Plus,
    Search,
    Trash2,
    Calendar,
    Clock,
    MapPin,
    UserCheck,
    CheckCircle2,
    FileSpreadsheet,
    Edit2,
} from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

interface StudentItem {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    pivot?: {
        id: number;
        status: string;
        enrolled_at: string | null;
    };
}

interface ClassDetail {
    id: number;
    name: string;
    code: string | null;
    room: string | null;
    schedule: string | null;
    description: string | null;
    is_archived: boolean;
    subject?: { id: number; name: string; code: string | null; color: string | null } | null;
    section?: { id: number; name: string; code: string | null; grade_level: string | null; room: string | null } | null;
    academicPeriod?: { id: number; name: string; code: string | null; is_current: boolean } | null;
    teacher?: { id: number; name: string; email: string } | null;
    students: StudentItem[];
}

interface ClassesShowProps {
    classItem: ClassDetail;
    availableStudents: StudentItem[];
    subjects: { id: number; name: string; code: string | null }[];
    sections: { id: number; name: string; code: string | null }[];
    periods: { id: number; name: string; code: string | null }[];
    teachers: { id: number; name: string; email: string }[];
}

export default function ClassesShow({
    classItem,
    availableStudents,
    subjects,
    sections,
    periods,
    teachers,
}: ClassesShowProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: classItem.name,
        code: classItem.code || '',
        subject_id: classItem.subject ? classItem.subject.id.toString() : '',
        section_id: classItem.section ? classItem.section.id.toString() : '',
        academic_period_id: classItem.academicPeriod ? classItem.academicPeriod.id.toString() : '',
        teacher_id: classItem.teacher ? classItem.teacher.id.toString() : '',
        room: classItem.room || '',
        schedule: classItem.schedule || '',
        description: classItem.description || '',
    });

    const [quickStudentModalOpen, setQuickStudentModalOpen] = useState(false);
    const [quickStudentForm, setQuickStudentForm] = useState({
        student_id: '',
        first_name: '',
        last_name: '',
        email: '',
    });

    const [removeDialog, setRemoveDialog] = useState<{
        open: boolean;
        student: StudentItem | null;
    }>({
        open: false,
        student: null,
    });

    const handleEnroll = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId) return;

        router.post(
            route('app.classes.enroll', classItem.id),
            { student_id: selectedStudentId },
            {
                onSuccess: () => {
                    setEnrollModalOpen(false);
                    setSelectedStudentId('');
                },
            }
        );
    };

    const handleQuickRegisterStudent = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            route('app.students.store'),
            {
                ...quickStudentForm,
                class_id: classItem.id,
            },
            {
                onSuccess: () => {
                    setQuickStudentModalOpen(false);
                    setQuickStudentForm({ student_id: '', first_name: '', last_name: '', email: '' });
                },
            }
        );
    };

    const handleEditClass = (e: React.FormEvent) => {
        e.preventDefault();
        router.patch(
            route('app.classes.update', classItem.id),
            {
                ...editForm,
                subject_id: editForm.subject_id ? parseInt(editForm.subject_id, 10) : null,
                section_id: editForm.section_id ? parseInt(editForm.section_id, 10) : null,
                academic_period_id: editForm.academic_period_id ? parseInt(editForm.academic_period_id, 10) : null,
                teacher_id: editForm.teacher_id ? parseInt(editForm.teacher_id, 10) : null,
            },
            {
                onSuccess: () => setEditModalOpen(false),
            }
        );
    };

    const filteredStudents = classItem.students.filter(s =>
        s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredAvailable = availableStudents.filter(s =>
        s.student_id.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.first_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.last_name.toLowerCase().includes(studentSearch.toLowerCase())
    );

    return (
        <AppLayout title={classItem.name}>
            <Head title={`${classItem.name} — Class Roster`} />

            <div className="mb-4">
                <Link
                    href={route('app.classes')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to All Classes
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-5 gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {classItem.name}
                        </h1>
                        {classItem.code && (
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {classItem.code}
                            </span>
                        )}
                        {classItem.is_archived && <Badge variant="neutral">Archived</Badge>}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        {classItem.subject && (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: classItem.subject.color || '#3b82f6' }} />
                                {classItem.subject.name}
                            </span>
                        )}
                        {classItem.section && (
                            <span className="font-medium text-slate-600 dark:text-slate-400">
                                Section: {classItem.section.name}
                            </span>
                        )}
                        {classItem.academicPeriod && (
                            <span className="font-medium text-slate-600 dark:text-slate-400">
                                Period: {classItem.academicPeriod.name}
                            </span>
                        )}
                        {classItem.teacher && (
                            <span className="font-medium text-slate-600 dark:text-slate-400">
                                Instructor: {classItem.teacher.name}
                            </span>
                        )}
                        {classItem.schedule && (
                            <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-400">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {classItem.schedule}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit Class
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQuickStudentModalOpen(true)}>
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        Register New
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setEnrollModalOpen(true)}>
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Enroll Student
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search enrolled students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div className="text-xs text-slate-500 font-semibold">
                    {filteredStudents.length} of {classItem.students.length} students enrolled
                </div>
            </div>

            <Card className="border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Student ID</th>
                                <th className="px-4 py-3">Student Name</th>
                                <th className="px-4 py-3">Email Address</th>
                                <th className="px-4 py-3">Enrollment Date</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                        <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                                            No students enrolled in this class
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                                            Enroll registered workspace students or quickly register new students.
                                        </p>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setEnrollModalOpen(true)}>
                                                <Plus className="w-3.5 h-3.5 mr-1" />
                                                Enroll Existing
                                            </Button>
                                            <Button variant="primary" size="sm" onClick={() => setQuickStudentModalOpen(true)}>
                                                <UserPlus className="w-3.5 h-3.5 mr-1" />
                                                Register New
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                                            {s.student_id}
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                                            {s.last_name}, {s.first_name}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {s.email || <span className="text-2xs italic text-slate-400">None</span>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {s.pivot?.enrolled_at ? new Date(s.pivot.enrolled_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="success">Enrolled</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="outline"
                                                size="xs"
                                                className="text-rose-600 hover:bg-rose-50 border-rose-200"
                                                onClick={() => setRemoveDialog({ open: true, student: s })}
                                            >
                                                <Trash2 className="w-3 h-3 mr-1" />
                                                Remove
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={enrollModalOpen}
                onClose={() => setEnrollModalOpen(false)}
                title="Enroll Existing Student"
                maxWidth="md"
            >
                <form onSubmit={handleEnroll} className="space-y-4">
                    <p className="text-xs text-slate-500">
                        Select a student already registered in your workspace to enroll into <strong>{classItem.name}</strong>.
                    </p>

                    <div>
                        <div className="relative mb-2">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filter registered students..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            />
                        </div>

                        <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredAvailable.length === 0 ? (
                                <p className="p-4 text-xs text-center text-slate-400">
                                    No available students found to enroll.
                                </p>
                            ) : (
                                filteredAvailable.map((s) => (
                                    <label
                                        key={s.id}
                                        className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                                            selectedStudentId === s.id.toString() ? 'bg-blue-50 dark:bg-blue-950/40' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <input
                                                type="radio"
                                                name="selected_student"
                                                value={s.id}
                                                checked={selectedStudentId === s.id.toString()}
                                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                                className="text-blue-600 focus:ring-blue-500"
                                            />
                                            <div>
                                                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                                    {s.last_name}, {s.first_name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                    ID: {s.student_id} {s.email && `• ${s.email}`}
                                                </p>
                                            </div>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setEnrollModalOpen(false);
                                setQuickStudentModalOpen(true);
                            }}
                        >
                            + Register New Student
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setEnrollModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" size="sm" disabled={!selectedStudentId}>
                                Enroll Selected
                            </Button>
                        </div>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={quickStudentModalOpen}
                onClose={() => setQuickStudentModalOpen(false)}
                title="Quick Register & Enroll Student"
                maxWidth="md"
            >
                <form onSubmit={handleQuickRegisterStudent} className="space-y-3.5">
                    <Input
                        label="Student ID / LRN (Optional — auto-generated if blank)"
                        value={quickStudentForm.student_id}
                        onChange={(e) => setQuickStudentForm({ ...quickStudentForm, student_id: e.target.value })}
                        placeholder="Leave blank to auto-generate (e.g. STD-2026-0001)"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="First Name"
                            required
                            value={quickStudentForm.first_name}
                            onChange={(e) => setQuickStudentForm({ ...quickStudentForm, first_name: e.target.value })}
                            placeholder="e.g. Juan"
                        />
                        <Input
                            label="Last Name"
                            required
                            value={quickStudentForm.last_name}
                            onChange={(e) => setQuickStudentForm({ ...quickStudentForm, last_name: e.target.value })}
                            placeholder="e.g. Dela Cruz"
                        />
                    </div>
                    <Input
                        label="Email Address (Optional)"
                        type="email"
                        value={quickStudentForm.email}
                        onChange={(e) => setQuickStudentForm({ ...quickStudentForm, email: e.target.value })}
                        placeholder="e.g. student@school.edu"
                    />
                    <p className="text-2xs text-slate-400">
                        Students do not need an account. They are recorded in your workspace for roster and exam matching.
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <Button type="button" variant="outline" size="sm" onClick={() => setQuickStudentModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm">
                            Register & Enroll
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Edit Class Details"
                maxWidth="lg"
            >
                <form onSubmit={handleEditClass} className="space-y-3.5">
                    <Input
                        label="Class Name"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Class Code"
                            value={editForm.code}
                            onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                        />
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Academic Period
                            </label>
                            <select
                                value={editForm.academic_period_id}
                                onChange={(e) => setEditForm({ ...editForm, academic_period_id: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            >
                                <option value="">No academic period</option>
                                {periods.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Subject
                            </label>
                            <select
                                value={editForm.subject_id}
                                onChange={(e) => setEditForm({ ...editForm, subject_id: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            >
                                <option value="">No subject</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Section
                            </label>
                            <select
                                value={editForm.section_id}
                                onChange={(e) => setEditForm({ ...editForm, section_id: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            >
                                <option value="">No section</option>
                                {sections.map((sec) => (
                                    <option key={sec.id} value={sec.id}>
                                        {sec.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Schedule"
                            value={editForm.schedule}
                            onChange={(e) => setEditForm({ ...editForm, schedule: e.target.value })}
                        />
                        <Input
                            label="Room"
                            value={editForm.room}
                            onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Description
                        </label>
                        <textarea
                            rows={2}
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm">
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmationDialog
                isOpen={removeDialog.open}
                onClose={() => setRemoveDialog({ open: false, student: null })}
                onConfirm={() => {
                    if (removeDialog.student) {
                        router.delete(
                            route('app.classes.remove-student', [classItem.id, removeDialog.student.id]),
                            {
                                onSuccess: () => setRemoveDialog({ open: false, student: null }),
                            }
                        );
                    }
                }}
                title="Remove Student from Class"
                message={`Are you sure you want to remove '${removeDialog.student?.first_name} ${removeDialog.student?.last_name}' from this class? The student record will remain in your workspace.`}
                confirmText="Remove"
            />
        </AppLayout>
    );
}
