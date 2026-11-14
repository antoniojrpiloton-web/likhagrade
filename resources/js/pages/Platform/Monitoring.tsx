import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Cpu,
    Server,
    Database,
    HardDrive,
    Trash2,
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Terminal,
    Zap,
    Layers,
    FileText,
} from 'lucide-react';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

interface MonitoringProps {
    system_specs: {
        php_version: string;
        laravel_version: string;
        server_os: string;
        memory_limit: string;
        max_execution_time: string;
        upload_max_filesize: string;
        post_max_size: string;
        database_driver: string;
        database_name: string;
        queue_driver: string;
        cache_driver: string;
        session_driver: string;
    };
    server_metrics: {
        memory_current_mb: number;
        memory_peak_mb: number;
        disk_total_gb: number;
        disk_free_gb: number;
        disk_used_gb: number;
        disk_used_percentage: number;
    };
    table_stats: {
        table: string;
        label: string;
        count: number;
    }[];
    recent_logs: {
        timestamp: string;
        environment: string;
        level: string;
        message: string;
    }[];
}

export default function Monitoring({
    system_specs,
    server_metrics,
    table_stats,
    recent_logs,
}: MonitoringProps) {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [logFilter, setLogFilter] = useState('ALL');
    const [clearLogsDialogOpen, setClearLogsDialogOpen] = useState(false);

    const triggerAction = (routeName: string, label: string) => {
        setActionLoading(label);
        router.post(route(routeName), {}, {
            onFinish: () => setActionLoading(null),
        });
    };

    const handleClearLogs = () => {
        setActionLoading('clear-logs');
        router.post(route('platform.monitoring.clear-logs'), {}, {
            onFinish: () => {
                setActionLoading(null);
                setClearLogsDialogOpen(false);
            },
        });
    };

    const filteredLogs = recent_logs.filter((log) => {
        if (logFilter === 'ALL') return true;
        return log.level === logFilter;
    });

    return (
        <PlatformLayout title="System Health & Infrastructure Monitoring">
            <Head title="System Monitoring — LikhaGrade SuperAdmin" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>System Health & Monitoring</span>
                        <Badge variant="primary">Real-Time Telemetry</Badge>
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Hardware resource consumption, MySQL database table telemetry, runtime operational cache purges, and application error log streams.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.reload()}
                        className="flex items-center gap-1.5"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Poll Metrics</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 border-slate-300 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">PHP Memory Usage</p>
                            <h3 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                                {server_metrics.memory_current_mb} <span className="text-sm font-normal text-slate-500">MB</span>
                            </h3>
                            <p className="mt-1 text-3xs text-slate-500">
                                Peak: {server_metrics.memory_peak_mb} MB • Limit: {system_specs.memory_limit}
                            </p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            <Cpu className="w-5 h-5" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-slate-300 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Server Disk Space</p>
                            <h3 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                                {server_metrics.disk_free_gb} <span className="text-sm font-normal text-slate-500">GB Free</span>
                            </h3>
                            <p className="mt-1 text-3xs text-slate-500">
                                {server_metrics.disk_used_gb} GB used of {server_metrics.disk_total_gb} GB ({server_metrics.disk_used_percentage}%)
                            </p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                            <HardDrive className="w-5 h-5" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-slate-300 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Database Engine</p>
                            <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-100 truncate">
                                {system_specs.database_name}
                            </h3>
                            <p className="mt-1 text-3xs text-emerald-600 dark:text-emerald-400 font-medium">
                                Driver: {system_specs.database_driver} • Connected
                            </p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <Database className="w-5 h-5" />
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-slate-300 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Framework Runtime</p>
                            <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-100">
                                PHP {system_specs.php_version}
                            </h3>
                            <p className="mt-1 text-3xs text-indigo-600 font-medium">
                                Laravel {system_specs.laravel_version}
                            </p>
                        </div>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            <Server className="w-5 h-5" />
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="p-5 border-slate-300 dark:border-slate-800 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Cache Purges & Optimization
                        </h3>
                    </div>

                    <div className="space-y-2.5">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-between text-xs"
                            disabled={actionLoading !== null}
                            onClick={() => triggerAction('platform.monitoring.clear-cache', 'cache')}
                        >
                            <span>Clear Application Cache</span>
                            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'cache' ? 'animate-spin' : ''}`} />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-between text-xs"
                            disabled={actionLoading !== null}
                            onClick={() => triggerAction('platform.monitoring.clear-routes', 'routes')}
                        >
                            <span>Clear Route Cache</span>
                            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'routes' ? 'animate-spin' : ''}`} />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-between text-xs"
                            disabled={actionLoading !== null}
                            onClick={() => triggerAction('platform.monitoring.clear-config', 'config')}
                        >
                            <span>Clear Config Cache</span>
                            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'config' ? 'animate-spin' : ''}`} />
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-between text-xs"
                            disabled={actionLoading !== null}
                            onClick={() => triggerAction('platform.monitoring.clear-views', 'views')}
                        >
                            <span>Clear Compiled Views</span>
                            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'views' ? 'animate-spin' : ''}`} />
                        </Button>

                        <Button
                            variant="primary"
                            size="sm"
                            className="w-full justify-between text-xs mt-3"
                            disabled={actionLoading !== null}
                            onClick={() => triggerAction('platform.monitoring.optimize', 'optimize')}
                        >
                            <span>Optimize & Flush All Framework Cache</span>
                            <Zap className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </Card>

                <Card className="p-5 border-slate-300 dark:border-slate-800 lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                        <Database className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Database Table Telemetry
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {table_stats.map((stat) => (
                            <div
                                key={stat.table}
                                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60"
                            >
                                <span className="text-2xs font-semibold text-slate-500 block mb-1">
                                    {stat.label}
                                </span>
                                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 block">
                                    {stat.count.toLocaleString()}
                                </span>
                                <span className="text-3xs text-slate-400 font-mono mt-1 block">
                                    table: {stat.table}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card className="p-5 border-slate-300 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Live Application Error Logs (storage/logs/laravel.log)
                        </h3>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            {['ALL', 'ERROR', 'WARNING', 'INFO'].map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setLogFilter(level)}
                                    className={`px-2 py-1 rounded text-2xs font-semibold transition-colors ${
                                        logFilter === level
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>

                        <Button
                            variant="danger"
                            size="xs"
                            onClick={() => setClearLogsDialogOpen(true)}
                            className="flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" />
                            <span>Purge Logs</span>
                        </Button>
                    </div>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-96 overflow-y-auto">
                    {filteredLogs.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500">
                            No log entries matching the selected level filter. Log file is clean.
                        </div>
                    ) : (
                        filteredLogs.map((log, index) => (
                            <div key={index} className="py-2.5 text-xs font-mono space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                log.level === 'ERROR' || log.level === 'CRITICAL'
                                                    ? 'danger'
                                                    : log.level === 'WARNING'
                                                    ? 'warning'
                                                    : 'neutral'
                                            }
                                            size="sm"
                                        >
                                            {log.level}
                                        </Badge>
                                        <span className="text-slate-400 text-3xs">{log.timestamp}</span>
                                    </div>
                                    <span className="text-3xs text-slate-400">{log.environment}</span>
                                </div>
                                <p className="text-2xs text-slate-800 dark:text-slate-200 break-all bg-slate-50 dark:bg-slate-900/60 p-2 rounded border border-slate-200 dark:border-slate-800">
                                    {log.message}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            <ConfirmationDialog
                isOpen={clearLogsDialogOpen}
                onClose={() => setClearLogsDialogOpen(false)}
                onConfirm={handleClearLogs}
                title="Purge Application Log File"
                message="Are you sure you want to truncate the laravel.log file? All current historical exception stack traces will be cleared."
                confirmText="Purge Log File"
                variant="danger"
            />
        </PlatformLayout>
    );
}

