import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Users,
    UserPlus,
    Upload,
    Search,
    Edit2,
    Archive,
    RotateCcw,
    BookOpen,
    CheckCircle2,
    AlertCircle,
    Info,
    FileSpreadsheet,
    Download,
} from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

interface ClassOption {
    id: number;
    name: string;
    code: string | null;
}

interface StudentItem {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    email: string | null;
    gender: string | null;
    contact_number: string | null;
    is_archived: boolean;
    created_at: string;
    classes: { id: number; name: string; code: string | null }[];
}

interface StudentsIndexProps {
    students: StudentItem[];
    availableClasses: ClassOption[];
}

interface ImportPreviewRow {
    row_number: number;
    student_id: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    email: string;
    gender: string;
    contact_number: string;
    status: 'valid' | 'error' | 'duplicate_in_file' | 'already_exists';
    error: string | null;
}

export default function StudentsIndex({
    students,
    availableClasses,
}: StudentsIndexProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
    const [form, setForm] = useState({
        student_id: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        gender: '',
        contact_number: '',
        class_id: '',
    });

    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [studentToEnroll, setStudentToEnroll] = useState<StudentItem | null>(null);
    const [selectedClassId, setSelectedClassId] = useState('');

    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importStep, setImportStep] = useState<'upload' | 'preview'>('upload');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importLoading, setImportLoading] = useState(false);
    const [previewData, setPreviewData] = useState<{
        total_rows: number;
        valid_count: number;
        rows: ImportPreviewRow[];
    } | null>(null);
    const [importClassId, setImportClassId] = useState('');

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
        setEditingStudent(null);
        setForm({
            student_id: '',
            first_name: '',
            last_name: '',
            middle_name: '',
            email: '',
            gender: '',
            contact_number: '',
            class_id: '',
        });
        setModalOpen(true);
    };

    const openEditModal = (s: StudentItem) => {
        setEditingStudent(s);
        setForm({
            student_id: s.student_id,
            first_name: s.first_name,
            last_name: s.last_name,
            middle_name: s.middle_name || '',
            email: s.email || '',
            gender: s.gender || '',
            contact_number: s.contact_number || '',
            class_id: '',
        });
        setModalOpen(true);
    };

    const submitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingStudent) {
            router.patch(route('app.students.update', editingStudent.id), form, {
                onSuccess: () => setModalOpen(false),
            });
        } else {
            router.post(route('app.students.store'), form, {
                onSuccess: () => setModalOpen(false),
            });
        }
    };

    const handleEnrollStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentToEnroll || !selectedClassId) return;

        router.post(
            route('app.students.enroll', studentToEnroll.id),
            { class_id: selectedClassId },
            {
                onSuccess: () => {
                    setEnrollModalOpen(false);
                    setStudentToEnroll(null);
                    setSelectedClassId('');
                },
            }
        );
    };

    const handlePreviewUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) return;

        setImportLoading(true);
        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const response = await fetch(route('app.students.import.preview'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setPreviewData(data);
                setImportStep('preview');
            } else {
                alert('Failed to parse file. Please verify CSV or Excel format.');
            }
        } catch (err) {
            alert('Upload error. Please try again.');
        } finally {
            setImportLoading(false);
        }
    };

    const handleConfirmImport = () => {
        if (!previewData) return;

        const validRows = previewData.rows.filter(r => r.status === 'valid').map(r => ({
            student_id: r.student_id,
            first_name: r.first_name,
            last_name: r.last_name,
            middle_name: r.middle_name || null,
            email: r.email || null,
            gender: r.gender || null,
            contact_number: r.contact_number || null,
        }));

        if (validRows.length === 0) {
            alert('No valid student rows to import.');
            return;
        }

        router.post(
            route('app.students.import.confirm'),
            {
                rows: validRows,
                class_id: importClassId || null,
            },
            {
                onSuccess: () => {
                    setImportModalOpen(false);
                    setImportStep('upload');
                    setImportFile(null);
                    setPreviewData(null);
                    setImportClassId('');
                },
            }
        );
    };

    const filteredStudents = students.filter(s => {
        if (statusFilter === 'active' && s.is_archived) return false;
        if (statusFilter === 'archived' && !s.is_archived) return false;

        const q = searchQuery.toLowerCase();
        return (
            s.student_id.toLowerCase().includes(q) ||
            s.first_name.toLowerCase().includes(q) ||
            s.last_name.toLowerCase().includes(q) ||
            (s.email && s.email.toLowerCase().includes(q))
        );
    });

    return (
        <AppLayout title="Students">
            <Head title="Student Management — LikhaGrade" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Students
                        </h1>
                        <Badge variant="neutral">Optional Roster</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        Register student IDs and examinee rosters. Not required for quick examination scanning.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setImportStep('upload');
                            setImportFile(null);
                            setPreviewData(null);
                            setImportModalOpen(true);
                        }}
                    >
                        <Upload className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        Import CSV/Excel
                    </Button>
                    <Button variant="primary" size="sm" onClick={openCreateModal}>
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        Add Student
                    </Button>
                </div>
            </div>

            <div className="mb-5 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                    Examinees are <strong>never required to create user accounts</strong>. Student profiles here simply allow LikhaGrade to match answer sheets by Student ID number and generate personalized report cards.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, name, email..."
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
                        <option value="active">Active Students</option>
                        <option value="archived">Archived Students</option>
                        <option value="all">All Students</option>
                    </select>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                    Showing {filteredStudents.length} of {students.length} students
                </span>
            </div>

            <Card className="border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Student ID</th>
                                <th className="px-4 py-3">Student Name</th>
                                <th className="px-4 py-3">Email Address</th>
                                <th className="px-4 py-3">Enrolled Classes</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                        <p className="font-bold text-xs text-slate-700 dark:text-slate-300">No students found</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                                            Student rosters are optional. Click "Add Student" or "Import CSV/Excel" when ready.
                                        </p>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}>
                                                <Upload className="w-3.5 h-3.5 mr-1" />
                                                Import CSV
                                            </Button>
                                            <Button variant="primary" size="sm" onClick={openCreateModal}>
                                                <UserPlus className="w-3.5 h-3.5 mr-1" />
                                                Add Student
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
                                            {s.last_name}, {s.first_name} {s.middle_name ? `${s.middle_name.charAt(0)}.` : ''}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">
                                            {s.email || <span className="text-2xs italic text-slate-400">None</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {s.classes.length === 0 ? (
                                                    <span className="text-2xs italic text-slate-400">Not enrolled</span>
                                                ) : (
                                                    s.classes.map((c) => (
                                                        <Link
                                                            key={c.id}
                                                            href={route('app.classes.show', c.id)}
                                                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-900"
                                                        >
                                                            {c.name}
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
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
                                                <Button
                                                    variant="outline"
                                                    size="xs"
                                                    onClick={() => {
                                                        setStudentToEnroll(s);
                                                        setSelectedClassId('');
                                                        setEnrollModalOpen(true);
                                                    }}
                                                >
                                                    Enroll
                                                </Button>
                                                <Button variant="outline" size="xs" onClick={() => openEditModal(s)}>
                                                    <Edit2 className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="xs"
                                                    onClick={() =>
                                                        setArchiveDialog({
                                                            open: true,
                                                            title: s.is_archived ? 'Restore Student' : 'Archive Student',
                                                            message: `Are you sure you want to ${s.is_archived ? 'restore' : 'archive'} student '${s.first_name} ${s.last_name}' (${s.student_id})?`,
                                                            url: route('app.students.archive', s.id),
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

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingStudent ? 'Edit Student Profile' : 'Register New Student'}
                maxWidth="md"
            >
                <form onSubmit={submitForm} className="space-y-3.5">
                    <Input
                        label={editingStudent ? 'Student ID Number' : 'Student ID Number (Optional — auto-generated if blank)'}
                        required={Boolean(editingStudent)}
                        value={form.student_id}
                        onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                        placeholder={editingStudent ? 'e.g. 2026-00123' : 'Leave blank to auto-generate (e.g. STD-2026-0001)'}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="First Name"
                            required
                            value={form.first_name}
                            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                            placeholder="e.g. Maria"
                        />
                        <Input
                            label="Last Name"
                            required
                            value={form.last_name}
                            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                            placeholder="e.g. Santos"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Middle Name (Optional)"
                            value={form.middle_name}
                            onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
                            placeholder="e.g. Clara"
                        />
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Gender (Optional)
                            </label>
                            <select
                                value={form.gender}
                                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            >
                                <option value="">Select gender</option>
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Other">Other / Unspecified</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Email Address (Optional)"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="student@school.edu"
                        />
                        <Input
                            label="Contact Number (Optional)"
                            value={form.contact_number}
                            onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                            placeholder="0917-000-0000"
                        />
                    </div>

                    {!editingStudent && availableClasses.length > 0 && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Enroll Into Class (Optional)
                            </label>
                            <select
                                value={form.class_id}
                                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                            >
                                <option value="">Do not enroll yet</option>
                                {availableClasses.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm">
                            {editingStudent ? 'Save Changes' : 'Register Student'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={enrollModalOpen}
                onClose={() => setEnrollModalOpen(false)}
                title="Enroll Student in Class"
                maxWidth="sm"
            >
                <form onSubmit={handleEnrollStudent} className="space-y-4">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        Enroll <strong>{studentToEnroll?.first_name} {studentToEnroll?.last_name}</strong> ({studentToEnroll?.student_id}) into a class:
                    </p>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Select Class
                        </label>
                        <select
                            required
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                        >
                            <option value="">Select a class</option>
                            {availableClasses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} {c.code ? `(${c.code})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <Button type="button" variant="outline" size="sm" onClick={() => setEnrollModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm" disabled={!selectedClassId}>
                            Confirm Enrollment
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                title="Import Students (CSV / Excel)"
                maxWidth="2xl"
            >
                {importStep === 'upload' ? (
                    <form onSubmit={handlePreviewUpload} className="space-y-4">
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Upload a spreadsheet with your student list. Supported formats: <code>.csv</code>, <code>.xlsx</code>, <code>.xls</code>.
                        </p>

                        <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center">
                            <FileSpreadsheet className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls,text/csv"
                                onChange={(e) => setImportFile(e.target.files ? e.target.files[0] : null)}
                                className="text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                            />
                            <p className="text-[11px] text-slate-400 mt-2">
                                Expected headers: <code>student_id</code>, <code>first_name</code>, <code>last_name</code>, <code>email</code>, <code>gender</code>
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <Button type="button" variant="outline" size="sm" onClick={() => setImportModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" size="sm" disabled={!importFile || importLoading}>
                                {importLoading ? 'Reading File...' : 'Upload & Preview'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                            <div>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {previewData?.valid_count} of {previewData?.total_rows} students ready to import
                                </span>
                                <p className="text-[11px] text-slate-400">
                                    Rows with duplicate IDs or missing fields are highlighted below.
                                </p>
                            </div>
                            {availableClasses.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-2xs font-semibold text-slate-600 dark:text-slate-300">
                                        Enroll Into:
                                    </span>
                                    <select
                                        value={importClassId}
                                        onChange={(e) => setImportClassId(e.target.value)}
                                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                    >
                                        <option value="">No class (Roster only)</option>
                                        {availableClasses.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-3 py-2">Row</th>
                                        <th className="px-3 py-2">Student ID</th>
                                        <th className="px-3 py-2">Name</th>
                                        <th className="px-3 py-2">Email</th>
                                        <th className="px-3 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {previewData?.rows.map((r) => (
                                        <tr key={r.row_number} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                            <td className="px-3 py-2 text-slate-400 font-mono text-2xs">{r.row_number}</td>
                                            <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-white">
                                                {r.student_id || '—'}
                                            </td>
                                            <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                                                {r.last_name || r.first_name ? `${r.last_name}, ${r.first_name}` : '—'}
                                            </td>
                                            <td className="px-3 py-2 text-slate-500 text-2xs truncate max-w-xs">{r.email || '—'}</td>
                                            <td className="px-3 py-2">
                                                {r.status === 'valid' && <Badge variant="success">Valid</Badge>}
                                                {r.status === 'already_exists' && <Badge variant="neutral">Already Exists</Badge>}
                                                {r.status === 'duplicate_in_file' && <Badge variant="warning">Duplicate</Badge>}
                                                {r.status === 'error' && <Badge variant="danger">Invalid</Badge>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                            <Button type="button" variant="outline" size="sm" onClick={() => setImportStep('upload')}>
                                Back to Upload
                            </Button>
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setImportModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    onClick={handleConfirmImport}
                                    disabled={!previewData || previewData.valid_count === 0}
                                >
                                    Import {previewData?.valid_count} Students
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
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
