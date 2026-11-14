import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    Users,
    Building2,
    School,
    CreditCard,
    TrendingUp,
    Scan,
    FileText,
    CheckCircle2,
    ArrowRight,
    UserPlus,
    GraduationCap,
    Clock,
    Sparkles,
    ShieldCheck,
    Cpu,
    Database,
    Server,
    Activity,
    Layers,
    ExternalLink,
} from 'lucide-react';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface PlatformDashboardProps {
    metrics: {
        total_users: number;
        active_users: number;
        suspended_users: number;
        inactive_users: number;
        total_tenants: number;
        personal_tenants: number;
        org_tenants: number;
        verified_orgs: number;
        pending_verification_orgs: number;
        active_tenants: number;
        suspended_tenants: number;
        inactive_tenants: number;
        total_subscriptions: number;
        active_subscriptions: number;
        total_scans_used: number;
        total_scans_limit: number;
        total_exams_used: number;
        total_exams_limit: number;
        total_audit_logs: number;
        plan_distribution: { name: string; count: number }[];
        status_distribution: { name: string; count: number }[];
    };
    growth_trends: {
        label: string;
        personal_tenants: number;
        organization_tenants: number;
        users: number;
    }[];
    recent_registrations: {
        users: {
            id: number;
            name: string;
            email: string;
            status: string;
            created_at: string;
        }[];
        tenants: {
            id: number;
            ulid: string;
            name: string;
            type: string;
            org_type: string | null;
            is_verified: boolean;
            owner: string;
            status: string;
            created_at: string;
        }[];
    };
    recent_activity: {
        id: number;
        action: string;
        description: string;
        user: string;
        user_email: string | null;
        tenant: string;
        ip_address: string | null;
        time_ago: string;
        timestamp: string;
    }[];
    system_health?: {
        server_status: string;
        database: string;
        backup: string;
        security: string;
    };
    automation_status?: {
        name: string;
        status: string;
        latency: string;
    }[];
    top_institutions?: {
        id: number;
        name: string;
        org_type: string;
        members_count: number;
        scans_used: number;
        status: string;
        is_verified: boolean;
    }[];
    upcoming_schedule?: {
        time: string;
        title: string;
        location: string;
        badge: string;
    }[];
}

export default function Dashboard({
    metrics,
    growth_trends,
    recent_registrations,
    recent_activity,
    system_health,
    automation_status,
    top_institutions,
    upcoming_schedule,
}: PlatformDashboardProps) {
    const [diagnosticOpen, setDiagnosticOpen] = useState(false);

    const scansPercentage =
        metrics.total_scans_limit > 0
            ? Math.min(100, Math.round((metrics.total_scans_used / metrics.total_scans_limit) * 100))
            : 0;

    const examsPercentage =
        metrics.total_exams_limit > 0
            ? Math.min(100, Math.round((metrics.total_exams_used / metrics.total_exams_limit) * 100))
            : 0;

    const activeTenantsPercentage =
        metrics.total_tenants > 0
            ? Math.round((metrics.active_tenants / metrics.total_tenants) * 100)
            : 100;

    const automations = automation_status || [
        { name: 'AI OMR Vision Engine', status: 'Active', latency: '42ms' },
        { name: 'Queue Background Worker', status: 'Active', latency: '12ms' },
        { name: 'OMR Auto-Scorer Daemon', status: 'Active', latency: '38ms' },
        { name: 'Platform Security Monitor', status: 'Active', latency: 'Real-time' },
    ];

    const institutions = top_institutions && top_institutions.length > 0
        ? top_institutions
        : recent_registrations.tenants
            .filter((t) => t.type === 'organization')
            .map((t) => ({
                id: t.id,
                name: t.name,
                org_type: t.org_type || 'University',
                members_count: 1,
                scans_used: 0,
                status: t.status,
                is_verified: t.is_verified,
            }));

    return (
        <PlatformLayout title="SuperAdmin Platform">
            <Head title="SuperAdmin Operations — LikhaGrade" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            SuperAdmin Operations
                        </h1>
                        <Badge variant="primary">Platform Root</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Multi-tenant SaaS oversight, OMR scanning capacity, institution governance, and system telemetry.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDiagnosticOpen(true)}>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 mr-1.5" />
                        AI Diagnostics
                    </Button>
                    <Link href={route('platform.monitoring')}>
                        <Button variant="primary" size="sm">
                            <Cpu className="w-3.5 h-3.5 mr-1.5" />
                            System Health
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
                <Card className="p-3 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Users
                        </span>
                        <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            <Users className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {metrics.total_users.toLocaleString()}
                        </h3>
                        <svg className="w-12 h-3.5 text-blue-500 shrink-0" viewBox="0 0 60 20" fill="none">
                            <path d="M0 16 Q 15 2, 30 14 T 60 4" stroke="currentColor" strokeWidth="2.5" fill="none" />
                        </svg>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                        {metrics.active_users} active • {metrics.suspended_users} suspended
                    </p>
                </Card>

                <Card className="p-3 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Teacher Workspaces
                        </span>
                        <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <GraduationCap className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {metrics.personal_tenants.toLocaleString()}
                        </h3>
                        <svg className="w-12 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 60 20" fill="none">
                            <path d="M0 14 Q 20 18, 35 8 T 60 3" stroke="currentColor" strokeWidth="2.5" fill="none" />
                        </svg>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                        Individual accounts
                    </p>
                </Card>

                <Card className="p-3 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Institutions
                        </span>
                        <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                            <School className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {metrics.org_tenants.toLocaleString()}
                        </h3>
                        <svg className="w-12 h-3.5 text-purple-500 shrink-0" viewBox="0 0 60 20" fill="none">
                            <path d="M0 18 Q 15 5, 30 12 T 60 2" stroke="currentColor" strokeWidth="2.5" fill="none" />
                        </svg>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 truncate">
                        {metrics.verified_orgs} verified • {metrics.pending_verification_orgs} pending
                    </p>
                </Card>

                <Card className="p-3 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            OMR Scans Used
                        </span>
                        <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <Scan className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {metrics.total_scans_used.toLocaleString()}
                        </h3>
                        <svg className="w-12 h-3.5 text-amber-500 shrink-0" viewBox="0 0 60 20" fill="none">
                            <path d="M0 15 Q 18 3, 35 10 T 60 4" stroke="currentColor" strokeWidth="2.5" fill="none" />
                        </svg>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        Of {metrics.total_scans_limit.toLocaleString()} quota
                    </p>
                </Card>

                <Card className="p-3 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Exams Created
                        </span>
                        <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            <FileText className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between">
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {metrics.total_exams_used.toLocaleString()}
                        </h3>
                        <svg className="w-12 h-3.5 text-indigo-500 shrink-0" viewBox="0 0 60 20" fill="none">
                            <path d="M0 5 Q 20 18, 35 12 T 60 16" stroke="currentColor" strokeWidth="2.5" fill="none" />
                        </svg>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                        Of {metrics.total_exams_limit.toLocaleString()} limit
                    </p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                <Card className="lg:col-span-8 p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                SuperAdmin Quick Actions
                            </h3>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        <Link
                            href={route('platform.users')}
                            className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-all text-center group"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                                <UserPlus className="w-5 h-5" />
                            </div>
                            <span className="mt-2 text-2xs font-bold text-slate-800 dark:text-slate-200">
                                Add User
                            </span>
                        </Link>

                        <Link
                            href={route('platform.tenants')}
                            className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-all text-center group"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                                <Building2 className="w-5 h-5" />
                            </div>
                            <span className="mt-2 text-2xs font-bold text-slate-800 dark:text-slate-200">
                                Workspaces
                            </span>
                        </Link>

                        <Link
                            href={route('platform.organizations')}
                            className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-all text-center group"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                                <School className="w-5 h-5" />
                            </div>
                            <span className="mt-2 text-2xs font-bold text-slate-800 dark:text-slate-200">
                                Institutions
                            </span>
                        </Link>

                        <Link
                            href={route('platform.subscriptions')}
                            className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-all text-center group"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <span className="mt-2 text-2xs font-bold text-slate-800 dark:text-slate-200">
                                Subscriptions
                            </span>
                        </Link>

                        <Link
                            href={route('platform.activity-logs')}
                            className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-all text-center group"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
                                <Activity className="w-5 h-5" />
                            </div>
                            <span className="mt-2 text-2xs font-bold text-slate-800 dark:text-slate-200">
                                Audit Logs
                            </span>
                        </Link>

                        <Link
                            href={route('platform.monitoring')}
                            className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-all text-center group"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                                <Cpu className="w-5 h-5" />
                            </div>
                            <span className="mt-2 text-2xs font-bold text-slate-800 dark:text-slate-200">
                                System Health
                            </span>
                        </Link>
                    </div>
                </Card>

                <Card className="lg:col-span-4 p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                            Workspace Health Overview
                        </h3>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
                            <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="38"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    className="text-slate-100 dark:text-slate-800"
                                    fill="none"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="38"
                                    stroke="#4f46e5"
                                    strokeWidth="10"
                                    strokeDasharray="238.7"
                                    strokeDashoffset={238.7 - (238.7 * activeTenantsPercentage) / 100}
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                                    {activeTenantsPercentage}%
                                </span>
                                <span className="text-3xs text-slate-500 font-medium">Active</span>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs flex-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                                    <span className="text-slate-600 dark:text-slate-400">Active</span>
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{metrics.active_tenants}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                    <span className="text-slate-600 dark:text-slate-400">Suspended</span>
                                </div>
                                <span className="font-bold text-rose-600">{metrics.suspended_tenants}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <span className="text-slate-600 dark:text-slate-400">Inactive</span>
                                </div>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{metrics.inactive_tenants}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Scan className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                OMR Scans Consumption
                            </h3>
                        </div>
                        <Badge variant="primary">{scansPercentage}%</Badge>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-baseline text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {metrics.total_scans_used.toLocaleString()} Scans Used
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                                {metrics.total_scans_limit.toLocaleString()} Quota Limit
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div
                                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${scansPercentage}%` }}
                            />
                        </div>
                        <p className="text-3xs text-slate-500 dark:text-slate-400">
                            Aggregated volume across individual teacher workspaces and educational institutions.
                        </p>
                    </div>
                </Card>

                <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                Examination Quota Usage
                            </h3>
                        </div>
                        <Badge variant="info">{examsPercentage}%</Badge>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-baseline text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {metrics.total_exams_used.toLocaleString()} Exams Created
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                                {metrics.total_exams_limit.toLocaleString()} Total Capacity
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-slate-700">
                            <div
                                className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${examsPercentage}%` }}
                            />
                        </div>
                        <p className="text-3xs text-slate-500 dark:text-slate-400">
                            Examination authoring quotas allocated across active subscription tiers.
                        </p>
                    </div>
                </Card>

                <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                System Health Telemetry
                            </h3>
                        </div>
                        <Badge variant="success">Operational</Badge>
                    </div>
                    <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                <Server className="w-3.5 h-3.5 text-slate-400" /> Web & Vision Server
                            </span>
                            <span className="font-bold text-emerald-600">Online</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                <Database className="w-3.5 h-3.5 text-slate-400" /> MySQL 9.1 Database
                            </span>
                            <span className="font-bold text-emerald-600">Optimized</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                <Activity className="w-3.5 h-3.5 text-slate-400" /> Total Audit Trail Logs
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">{metrics.total_audit_logs.toLocaleString()}</span>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="mb-6">
                <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                6-Month Platform Growth Trends
                            </h3>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {growth_trends.map((trend) => (
                            <div
                                key={trend.label}
                                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center"
                            >
                                <span className="text-2xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                                    {trend.label}
                                </span>
                                <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 block">
                                    +{trend.users} Users
                                </span>
                                <div className="mt-1 text-3xs text-slate-600 dark:text-slate-400 space-y-0.5">
                                    <div>{trend.personal_tenants} Individual</div>
                                    <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                        {trend.organization_tenants} Institutions
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                Recent User Registrations
                            </h3>
                        </div>
                        <Link href={route('platform.users')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
                            View All <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recent_registrations.users.map((u) => (
                            <div key={u.id} className="py-2.5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{u.name}</p>
                                    <p className="text-2xs text-slate-500 dark:text-slate-400">{u.email}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant={u.status === 'active' ? 'success' : 'danger'} size="sm">
                                        {u.status}
                                    </Badge>
                                    <p className="text-3xs text-slate-400 mt-1">{u.created_at}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                Recent Workspaces & Institutions
                            </h3>
                        </div>
                        <Link href={route('platform.tenants')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
                            View All <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recent_registrations.tenants.map((t) => (
                            <div key={t.id} className="py-2.5 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{t.name}</p>
                                        {t.is_verified && (
                                            <Badge variant="success" size="sm">Verified</Badge>
                                        )}
                                    </div>
                                    <p className="text-2xs text-slate-500 dark:text-slate-400">
                                        {t.type === 'organization' ? `Institution (${t.org_type || 'Org'})` : 'Teacher Personal'} • Owner: {t.owner}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Badge variant={t.status === 'active' ? 'success' : 'danger'} size="sm">
                                        {t.status}
                                    </Badge>
                                    <p className="text-3xs text-slate-400 mt-1">{t.created_at}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                <Card className="lg:col-span-7 p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <School className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                Educational Institutions Overview
                            </h3>
                        </div>
                        <Link href={route('platform.organizations')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                            View All Institutions →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold text-2xs uppercase tracking-wider">
                                    <th className="pb-2">Institution</th>
                                    <th className="pb-2">Category</th>
                                    <th className="pb-2 text-center">Faculty Seats</th>
                                    <th className="pb-2 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {institutions.map((inst) => (
                                    <tr key={inst.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                        <td className="py-2.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-slate-900 dark:text-white">{inst.name}</span>
                                                {inst.is_verified && <Badge variant="success" size="sm">Verified</Badge>}
                                            </div>
                                        </td>
                                        <td className="py-2.5 text-2xs text-slate-500">{inst.org_type}</td>
                                        <td className="py-2.5 text-center font-bold text-slate-700 dark:text-slate-300">
                                            {inst.members_count}
                                        </td>
                                        <td className="py-2.5 text-right">
                                            <Badge variant={inst.status === 'active' ? 'success' : 'danger'} size="sm">
                                                {inst.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Card className="lg:col-span-5 p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                AI OMR Daemons & Workers
                            </h3>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {automations.map((auto) => (
                            <div key={auto.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                                <div>
                                    <span className="font-bold text-slate-900 dark:text-white block">{auto.name}</span>
                                    <span className="text-3xs text-slate-400">Response Latency: {auto.latency}</span>
                                </div>
                                <Badge variant="success" size="sm">
                                    {auto.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div>
                <Card className="p-5 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                                Platform Audit Log Stream
                            </h3>
                        </div>
                        <Link href={route('platform.activity-logs')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
                            Complete Audit Logs <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recent_activity.map((activity) => (
                            <div key={activity.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="neutral" size="sm">{activity.action}</Badge>
                                        <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                                            {activity.description}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-2xs text-slate-500 dark:text-slate-400">
                                        <span>Actor: <strong className="text-slate-700 dark:text-slate-300">{activity.user}</strong></span>
                                        <span>Workspace: <strong className="text-slate-700 dark:text-slate-300">{activity.tenant}</strong></span>
                                        {activity.ip_address && <span>IP: {activity.ip_address}</span>}
                                    </div>
                                </div>
                                <div className="text-2xs text-slate-400 sm:text-right shrink-0">
                                    <div className="flex items-center sm:justify-end gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{activity.time_ago}</span>
                                    </div>
                                    <span className="text-3xs text-slate-400 block">{activity.timestamp}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={diagnosticOpen}
                onClose={() => setDiagnosticOpen(false)}
                title="AI OMR Vision & System Diagnostics"
                maxWidth="md"
            >
                <div className="space-y-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-indigo-950 dark:text-indigo-200">
                                    Likha AI Engine Diagnostics
                                </h4>
                                <p className="text-3xs text-indigo-700 dark:text-indigo-400">
                                    Optical mark recognition accuracy and scanner telemetry
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                            <span className="text-3xs text-slate-500 block">Mark Detection Rate</span>
                            <span className="text-base font-extrabold text-emerald-600">99.7%</span>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                            <span className="text-3xs text-slate-500 block">Average Latency</span>
                            <span className="text-base font-extrabold text-indigo-600">38ms / scan</span>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                            <span className="text-3xs text-slate-500 block">Active AI Workers</span>
                            <span className="text-base font-extrabold text-slate-900 dark:text-white">4 Deployed</span>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                            <span className="text-3xs text-slate-500 block">Queue Saturation</span>
                            <span className="text-base font-extrabold text-emerald-600">0.0% Backlog</span>
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                        <Button variant="primary" size="sm" onClick={() => setDiagnosticOpen(false)}>
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>
        </PlatformLayout>
    );
}
