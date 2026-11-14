import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Settings as SettingsIcon,
    Server,
    ShieldCheck,
    Database,
    Layers,
    Save,
    CheckCircle,
    Bell,
    Mail,
    Sliders,
    ToggleLeft,
} from 'lucide-react';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface PlatformSettingsProps {
    settings: {
        allow_teacher_registration: boolean;
        allow_organization_registration: boolean;
        default_personal_scans: number;
        default_org_scans: number;
        default_personal_exams: number;
        default_org_exams: number;
        support_email: string;
        announcement_banner: string;
        require_institution_verification: boolean;
    };
    system_info: {
        app_name: string;
        app_env: string;
        app_debug: boolean;
        php_version: string;
        laravel_version: string;
        database_driver: string;
        database_name: string;
        queue_connection: string;
        session_driver: string;
        superadmin_email: string;
    };
}

export default function PlatformSettings({ settings, system_info }: PlatformSettingsProps) {
    const [form, setForm] = useState({ ...settings });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        router.post(route('platform.settings.update'), form, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <PlatformLayout title="Platform Settings">
            <Head title="Platform Settings — LikhaGrade SuperAdmin" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>Platform Settings & Governance</span>
                        <Badge variant="primary">Root Operations</Badge>
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Configure SaaS registration rules, default subscription trial quotas, platform support notices, and review runtime infrastructure diagnostics.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-5 border-slate-300 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                            <Sliders className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                SaaS Onboarding & Registration Policies
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.allow_teacher_registration}
                                    onChange={(e) => setForm({ ...form, allow_teacher_registration: e.target.checked })}
                                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="text-xs">
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                        Open Individual Teacher Registration
                                    </span>
                                    <span className="text-2xs text-slate-500">
                                        Allow any teacher or instructor to register an individual account and receive a personal workspace automatically.
                                    </span>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.allow_organization_registration}
                                    onChange={(e) => setForm({ ...form, allow_organization_registration: e.target.checked })}
                                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="text-xs">
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                        Open Educational Institution Registration
                                    </span>
                                    <span className="text-2xs text-slate-500">
                                        Allow universities, colleges, and school administrators to self-register their organizational workspaces.
                                    </span>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.require_institution_verification}
                                    onChange={(e) => setForm({ ...form, require_institution_verification: e.target.checked })}
                                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="text-xs">
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                        Mandate SuperAdmin Verification for Institutions
                                    </span>
                                    <span className="text-2xs text-slate-500">
                                        Require manual SuperAdmin inspection and approval before an institutional workspace is granted full operational access.
                                    </span>
                                </div>
                            </label>
                        </div>
                    </Card>

                    <Card className="p-5 border-slate-300 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                Default Trial Resource Quotas
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                                <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Individual Teacher Scans Quota
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={10}
                                    max={1000000}
                                    value={form.default_personal_scans}
                                    onChange={(e) => setForm({ ...form, default_personal_scans: Number(e.target.value) })}
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                                />
                            </div>

                            <div>
                                <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Individual Teacher Examinations Quota
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    max={10000}
                                    value={form.default_personal_exams}
                                    onChange={(e) => setForm({ ...form, default_personal_exams: Number(e.target.value) })}
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                                />
                            </div>

                            <div>
                                <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Institution Trial Scans Quota
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={100}
                                    max={5000000}
                                    value={form.default_org_scans}
                                    onChange={(e) => setForm({ ...form, default_org_scans: Number(e.target.value) })}
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                                />
                            </div>

                            <div>
                                <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Institution Trial Examinations Quota
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    max={50000}
                                    value={form.default_org_exams}
                                    onChange={(e) => setForm({ ...form, default_org_exams: Number(e.target.value) })}
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        <p className="mt-4 text-3xs text-slate-500">
                            These quotas automatically apply to newly registered individual teachers and educational institutions during initial workspace onboarding.
                        </p>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-5 border-slate-300 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                            <Bell className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                Support & Platform Announcement
                            </h3>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Platform Support Contact Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={form.support_email}
                                    onChange={(e) => setForm({ ...form, support_email: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                                />
                            </div>

                            <div>
                                <label className="block text-2xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                    Platform Maintenance / Announcement Banner Message
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.announcement_banner}
                                    onChange={(e) => setForm({ ...form, announcement_banner: e.target.value })}
                                    placeholder="Leave empty if no global announcement is currently active"
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-5 border-slate-300 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                            <Server className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                Runtime Framework Diagnostics
                            </h3>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-slate-500">Application Name</span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">{system_info.app_name}</span>
                            </div>
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-slate-500">Environment</span>
                                <Badge variant="primary" size="sm">{system_info.app_env}</Badge>
                            </div>
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-slate-500">PHP Version</span>
                                <span className="font-mono text-slate-800 dark:text-slate-200">{system_info.php_version}</span>
                            </div>
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-slate-500">Laravel Framework</span>
                                <span className="font-mono text-slate-800 dark:text-slate-200">{system_info.laravel_version}</span>
                            </div>
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-slate-500">Database Driver & Name</span>
                                <span className="font-mono text-slate-800 dark:text-slate-200">{system_info.database_driver} ({system_info.database_name})</span>
                            </div>
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-slate-500">SuperAdmin Root Email</span>
                                <span className="font-mono text-indigo-600 font-semibold">{system_info.superadmin_email}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={submitting}
                        className="flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        <span>{submitting ? 'Saving Platform Settings...' : 'Save Platform Settings'}</span>
                    </Button>
                </div>
            </form>
        </PlatformLayout>
    );
}
