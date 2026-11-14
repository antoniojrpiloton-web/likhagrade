import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Camera,
    FileText,
    Users,
    BookOpen,
    Layers,
    Plus,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Clock,
    ShieldCheck,
    GraduationCap,
    School,
    Activity,
    Info,
    ChevronRight,
} from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { SharedProps } from '@/types';

interface ActivityItem {
    id: number;
    action: string;
    description: string;
    time_ago: string;
}

interface WorkspaceInfo {
    id: number;
    name: string;
    type: string;
    status: string;
    role: string;
    member_count: number;
}

interface ClassItem {
    id: number;
    name: string;
    subject?: { id: number; name: string; color?: string } | null;
    section?: { id: number; name: string } | null;
    students_count: number;
}

interface DashboardProps {
    workspace: WorkspaceInfo | null;
    stats: {
        total_exams: number;
        total_scans: number;
        scans_limit: number;
        active_classes: number;
        registered_students: number;
        total_subjects: number;
    };
    recent_classes: ClassItem[];
    recent_activity: ActivityItem[];
    recent_exams: any[];
    recent_scans: any[];
}

export default function Dashboard({
    workspace,
    stats,
    recent_classes,
    recent_activity,
}: DashboardProps) {
    const { auth } = usePage<SharedProps>().props;
    const currentTenant = auth.tenant;

    return (
        <AppLayout title="Teacher Dashboard">
            <Head title="Teacher Dashboard — LikhaGrade" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Teacher Workspace
                        </h1>
                        <Badge variant="primary">Scan-First</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {workspace?.name} • {workspace?.type === 'organization' ? 'Institutional Workspace' : 'Personal Teacher Workspace'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={route('app.workspace')}>
                        <Button variant="outline" size="sm">
                            Workspace Settings
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-5 text-white shadow-md shadow-blue-500/10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                                <Sparkles className="w-3 h-3 text-amber-300" />
                                Instant OMR Grading
                            </span>
                            <span className="text-2xs font-semibold text-blue-100 bg-blue-800/50 px-2 py-0.5 rounded">
                                Zero Setup Required
                            </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-black tracking-tight text-white leading-snug">
                            Quick Scan Examination
                        </h2>
                        <p className="mt-1 text-xs text-blue-100 leading-relaxed">
                            Grade standard answer sheets right away using your camera or scanner. You do not need to create subjects, sections, classes, or student records to start scoring tests.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                        <Button
                            variant="secondary"
                            size="md"
                            disabled
                            className="bg-white text-blue-900 hover:bg-blue-50 font-bold opacity-90 cursor-not-allowed shadow-sm"
                        >
                            <Camera className="w-4 h-4 mr-1.5 text-blue-600" />
                            Start Quick Scan (Phase 4)
                        </Button>
                        <Link href={route('app.classes')}>
                            <Button
                                variant="outline"
                                size="md"
                                className="border-white/40 text-white hover:bg-white/10"
                            >
                                <BookOpen className="w-4 h-4 mr-1.5" />
                                Optional Classes
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <Card className="p-3.5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Examinations
                        </span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                            <FileText className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {stats.total_exams}
                        </h3>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Quick scan or organized tests
                    </p>
                </Card>

                <Card className="p-3.5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Sheets Scanned
                        </span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            <Camera className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {stats.total_scans}
                            <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">
                                / {stats.scans_limit} quota
                            </span>
                        </h3>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {Math.max(0, stats.scans_limit - stats.total_scans)} scans remaining
                    </p>
                </Card>

                <Card className="p-3.5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Active Classes
                        </span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900">
                            <BookOpen className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {stats.active_classes}
                        </h3>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Optional organization
                    </p>
                </Card>

                <Card className="p-3.5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Registered Students
                        </span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            <Users className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                            {stats.registered_students}
                        </h3>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Roster & enrollment tracking
                    </p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-4 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Recent Examinations & Scans
                                </h3>
                            </div>
                            <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                Phase 4 Pipeline
                            </span>
                        </div>

                        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="h-10 w-10 mx-auto rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5">
                                <Camera className="w-5 h-5" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                No Examinations Yet
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                                Examination creation, answer-key generation, and live camera OMR scanning will be enabled in Phase 4. You can start with zero prerequisites or organize classes below.
                            </p>
                            <div className="flex items-center justify-center gap-2">
                                <Link href={route('app.classes')}>
                                    <Button variant="outline" size="sm">
                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                        Create Optional Class
                                    </Button>
                                </Link>
                                <Link href={route('app.students')}>
                                    <Button variant="outline" size="sm">
                                        <Users className="w-3.5 h-3.5 mr-1" />
                                        Manage Students
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-purple-600" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Your Classes
                                </h3>
                            </div>
                            <Link href={route('app.classes')} className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
                                View All ({stats.active_classes})
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {recent_classes.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-500">
                                <p>No classes created yet.</p>
                                <p className="text-2xs text-slate-400 mt-0.5">Classes are optional and help group examination results by section or subject.</p>
                                <Link href={route('app.classes')} className="inline-block mt-3">
                                    <Button variant="outline" size="sm">
                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                        New Class
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {recent_classes.map((c) => (
                                    <Link
                                        key={c.id}
                                        href={route('app.classes.show', c.id)}
                                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:shadow-xs transition-all bg-slate-50/50 dark:bg-slate-800/40"
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                {c.name}
                                            </span>
                                            <span className="text-2xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">
                                                {c.students_count} students
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                            {c.subject && <span>{c.subject.name}</span>}
                                            {c.subject && c.section && <span>•</span>}
                                            {c.section && <span>{c.section.name}</span>}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-4 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Academic Management
                                </h3>
                            </div>
                            <Badge variant="neutral">Optional</Badge>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                            Optional modules for teachers and institutions who want organized student rosters and course catalogs.
                        </p>
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs">
                                <span className="text-slate-600 dark:text-slate-300 font-medium">Subjects</span>
                                <span className="font-bold text-slate-900 dark:text-white">{stats.total_subjects}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs">
                                <span className="text-slate-600 dark:text-slate-300 font-medium">Classes</span>
                                <span className="font-bold text-slate-900 dark:text-white">{stats.active_classes}</span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs">
                                <span className="text-slate-600 dark:text-slate-300 font-medium">Students</span>
                                <span className="font-bold text-slate-900 dark:text-white">{stats.registered_students}</span>
                            </div>
                        </div>
                        <Link href={route('app.academic-setup')} className="w-full block">
                            <Button variant="outline" size="sm" className="w-full justify-center">
                                Open Academic Setup
                                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                            </Button>
                        </Link>
                    </Card>

                    <Card className="p-4 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-emerald-600" />
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Recent Activity
                                </h3>
                            </div>
                        </div>

                        {recent_activity.length === 0 ? (
                            <p className="text-xs text-slate-400 py-3 text-center">
                                No activity recorded yet.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {recent_activity.map((log) => (
                                    <div key={log.id} className="flex items-start gap-2.5 text-xs">
                                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                {log.description}
                                            </p>
                                            <p className="text-2xs text-slate-400 mt-0.5">
                                                {log.time_ago}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
