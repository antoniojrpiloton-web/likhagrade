import React, { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import {
    Activity,
    Eye,
    Filter,
    RefreshCw,
    Clock,
    User as UserIcon,
    Building2,
    Globe,
    Terminal,
    ChevronDown,
} from 'lucide-react';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type DataTableRef } from '@/components/data-table/DataTable';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';

interface ActivityLogsPageProps {
    users_list: {
        id: number;
        name: string;
        email: string;
    }[];
    tenants_list: {
        id: number;
        name: string;
        type: string;
    }[];
}

interface LogDetailData {
    id: number;
    action: string;
    description: string;
    actor_name: string;
    actor_email: string | null;
    tenant_name: string;
    ip_address: string | null;
    user_agent: string | null;
    old_values: any;
    new_values: any;
    created_at: string;
}

export default function ActivityLogs({ users_list, tenants_list }: ActivityLogsPageProps) {
    const tableRef = useRef<DataTableRef>(null);

    const [categoryFilter, setCategoryFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('');
    const [tenantFilter, setTenantFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [selectedLog, setSelectedLog] = useState<LogDetailData | null>(null);

    const handleFilterChange = (updates: Record<string, any>) => {
        tableRef.current?.setFilters(updates);
    };

    return (
        <PlatformLayout title="Platform Audit Trail">
            <Head title="Audit Logs — LikhaGrade SuperAdmin" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>Platform Audit Trail</span>
                        <Badge variant="primary">Tamper-Proof</Badge>
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Immutable event recording of all authentication, administrative status transitions, tenant operations, and platform policy actions.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => tableRef.current?.reload()}
                    className="flex items-center gap-1.5"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Logs</span>
                </Button>
            </div>

            <Card className="p-4 mb-6 border-slate-300 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Filter className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Filter Audit Records</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Action Category</label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                handleFilterChange({ action_category: e.target.value });
                            }}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                        >
                            <option value="all">All Action Categories</option>
                            <option value="platform">Platform Administration (platform.*)</option>
                            <option value="tenant">Tenant & Organization (tenant.*)</option>
                            <option value="auth">Authentication & Account (auth.*)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Actor</label>
                        <select
                            value={userFilter}
                            onChange={(e) => {
                                setUserFilter(e.target.value);
                                handleFilterChange({ user_id: e.target.value });
                            }}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200 truncate"
                        >
                            <option value="">All Actors</option>
                            {users_list.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Workspace</label>
                        <select
                            value={tenantFilter}
                            onChange={(e) => {
                                setTenantFilter(e.target.value);
                                handleFilterChange({ tenant_id: e.target.value });
                            }}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200 truncate"
                        >
                            <option value="">All Workspaces</option>
                            {tenants_list.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">From Date</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => {
                                setDateFrom(e.target.value);
                                handleFilterChange({ date_from: e.target.value });
                            }}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">To Date</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => {
                                setDateTo(e.target.value);
                                handleFilterChange({ date_to: e.target.value });
                            }}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                        />
                    </div>
                </div>
            </Card>

            <Card className="p-4 border-slate-300 dark:border-slate-800">
                <DataTable
                    ref={tableRef}
                    ajaxUrl={route('platform.activity-logs.data')}
                    initialFilters={{
                        action_category: categoryFilter,
                    }}
                    columns={[
                        {
                            data: 'actions',
                            title: 'Actions',
                            className: 'w-36 min-w-[130px]',
                            orderable: false,
                            render: (actions) => (
                                <Dropdown
                                    align="left"
                                    width="w-52"
                                    trigger={
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2 px-3 py-1.5 font-semibold text-xs"
                                        >
                                            <span>Actions</span>
                                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                        </Button>
                                    }
                                >
                                    <DropdownItem
                                        icon={<Eye className="w-3.5 h-3.5 text-indigo-600" />}
                                        onClick={() => setSelectedLog(actions)}
                                    >
                                        Inspect Event & Changes
                                    </DropdownItem>
                                </Dropdown>
                            ),
                        },
                        {
                            data: 'id',
                            title: 'ID',
                            className: 'w-12 text-slate-500 font-mono text-2xs',
                        },
                        {
                            data: 'action',
                            title: 'Action Event',
                            render: (val) => (
                                <Badge variant="neutral" size="sm" className="font-mono">
                                    {val}
                                </Badge>
                            ),
                        },
                        {
                            data: 'description',
                            title: 'Description',
                            render: (val) => (
                                <span className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                                    {val}
                                </span>
                            ),
                        },
                        {
                            data: 'user',
                            title: 'Actor',
                            render: (val) => (
                                <div className="flex flex-col text-xs">
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{val.name}</span>
                                    {val.email && <span className="text-3xs text-slate-400 font-mono">{val.email}</span>}
                                </div>
                            ),
                        },
                        {
                            data: 'tenant',
                            title: 'Workspace',
                            render: (val) => (
                                <span className="text-xs text-slate-700 dark:text-slate-300">{val.name}</span>
                            ),
                        },
                        {
                            data: 'ip_address',
                            title: 'Origin IP',
                            render: (val) => (
                                <span className="font-mono text-3xs text-slate-500">{val || 'Local / CLI'}</span>
                            ),
                        },
                        {
                            data: 'created_at',
                            title: 'Timestamp',
                            render: (val) => (
                                <span className="text-slate-500 text-2xs">{val}</span>
                            ),
                        },
                    ]}
                />
            </Card>

            <Modal
                isOpen={selectedLog !== null}
                onClose={() => setSelectedLog(null)}
                title="Audit Trail Event Details"
                maxWidth="2xl"
            >
                {selectedLog && (
                    <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Event Action:</span>
                                <Badge variant="neutral" size="sm" className="font-mono">{selectedLog.action}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Actor Identity:</span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {selectedLog.actor_name} {selectedLog.actor_email ? `(${selectedLog.actor_email})` : ''}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Workspace Context:</span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedLog.tenant_name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">IP Address:</span>
                                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedLog.ip_address || 'CLI / System'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Event Timestamp:</span>
                                <span className="text-slate-700 dark:text-slate-300">{selectedLog.created_at}</span>
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Event Description
                            </span>
                            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200">
                                {selectedLog.description}
                            </div>
                        </div>

                        {selectedLog.user_agent && (
                            <div>
                                <span className="text-2xs font-semibold text-slate-500 block mb-1">
                                    Client User-Agent
                                </span>
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-3xs font-mono text-slate-600 dark:text-slate-400 break-all">
                                    {selectedLog.user_agent}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div>
                                <span className="text-2xs font-semibold text-slate-500 block mb-1">Previous Values</span>
                                <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-300 text-3xs font-mono overflow-x-auto max-h-48">
                                    {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : 'null'}
                                </pre>
                            </div>
                            <div>
                                <span className="text-2xs font-semibold text-slate-500 block mb-1">New Values</span>
                                <pre className="p-2.5 rounded-lg bg-slate-900 text-emerald-300 text-3xs font-mono overflow-x-auto max-h-48">
                                    {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : 'null'}
                                </pre>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedLog(null)}
                            >
                                Close Detail
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </PlatformLayout>
    );
}
