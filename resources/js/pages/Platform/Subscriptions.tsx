import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    CreditCard,
    PlusCircle,
    Edit3,
    XCircle,
    Filter,
    RefreshCw,
    Scan,
    FileText,
    Calendar,
    Users,
    Building2,
    ChevronDown,
} from 'lucide-react';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { DataTable, type DataTableRef } from '@/components/data-table/DataTable';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';

interface SubscriptionsPageProps {
    plan_names: string[];
    tenants_list: {
        id: number;
        name: string;
        type: string;
    }[];
}

export default function Subscriptions({ plan_names, tenants_list }: SubscriptionsPageProps) {
    const tableRef = useRef<DataTableRef>(null);

    const [statusFilter, setStatusFilter] = useState('all');
    const [planFilter, setPlanFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        tenant_id: tenants_list[0]?.id || '',
        plan_name: 'Institutional Enterprise',
        billing_cycle: 'monthly',
        status: 'active',
        scans_limit: 10000,
        exams_limit: 100,
        members_limit: 50,
        ends_at: '',
    });
    const [createSubmitting, setCreateSubmitting] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedSub, setSelectedSub] = useState<{
        id: number;
        tenant_name: string;
        plan_name: string;
        status: string;
        scans_limit: number;
        exams_limit: number;
        members_limit: number;
        ends_at: string | null;
    } | null>(null);

    const [formPlanName, setFormPlanName] = useState('');
    const [formStatus, setFormStatus] = useState('active');
    const [formScansLimit, setFormScansLimit] = useState(500);
    const [formExamsLimit, setFormExamsLimit] = useState(20);
    const [formMembersLimit, setFormMembersLimit] = useState(1);
    const [formEndsAt, setFormEndsAt] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [cancelDialogSub, setCancelDialogSub] = useState<{ id: number; tenant_name: string } | null>(null);

    const handleFilterChange = (updates: Record<string, any>) => {
        tableRef.current?.setFilters(updates);
    };

    const openCreateModal = () => {
        setCreateForm({
            tenant_id: tenants_list[0]?.id || '',
            plan_name: 'Institutional Enterprise',
            billing_cycle: 'monthly',
            status: 'active',
            scans_limit: 10000,
            exams_limit: 100,
            members_limit: 50,
            ends_at: '',
        });
        setCreateModalOpen(true);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCreateSubmitting(true);
        router.post(route('platform.subscriptions.store'), createForm, {
            onSuccess: () => {
                setCreateModalOpen(false);
                tableRef.current?.reload();
            },
            onFinish: () => setCreateSubmitting(false),
        });
    };

    const openEditModal = (row: any) => {
        setSelectedSub({
            id: row.id,
            tenant_name: row.tenant.tenant_name,
            plan_name: row.actions.plan_name,
            status: row.actions.status,
            scans_limit: row.actions.scans_limit,
            exams_limit: row.actions.exams_limit,
            members_limit: row.actions.members_limit,
            ends_at: row.actions.ends_at,
        });

        setFormPlanName(row.actions.plan_name);
        setFormStatus(row.actions.status);
        setFormScansLimit(row.actions.scans_limit);
        setFormExamsLimit(row.actions.exams_limit);
        setFormMembersLimit(row.actions.members_limit);
        setFormEndsAt(row.actions.ends_at || '');
        setEditModalOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSub) return;

        setSubmitting(true);
        router.patch(
            route('platform.subscriptions.update', selectedSub.id),
            {
                plan_name: formPlanName,
                status: formStatus,
                scans_limit: Number(formScansLimit),
                exams_limit: Number(formExamsLimit),
                members_limit: Number(formMembersLimit),
                ends_at: formEndsAt || null,
            },
            {
                onSuccess: () => {
                    setEditModalOpen(false);
                    tableRef.current?.reload();
                },
                onFinish: () => setSubmitting(false),
            }
        );
    };

    const handleCancelSubscription = () => {
        if (!cancelDialogSub) return;

        router.post(route('platform.subscriptions.cancel', cancelDialogSub.id), {}, {
            onSuccess: () => {
                setCancelDialogSub(null);
                tableRef.current?.reload();
            },
        });
    };

    return (
        <PlatformLayout title="Subscriptions & Quotas">
            <Head title="Subscriptions — LikhaGrade SuperAdmin" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>Subscription Management</span>
                        <Badge variant="primary">Resource Governance</Badge>
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Assign, modify, and monitor tenant-owned subscriptions across individual teachers and organizations, and adjust scanning and exam quotas.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={openCreateModal}
                        className="flex items-center gap-1.5"
                    >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Assign Subscription</span>
                    </Button>
                </div>
            </div>

            <Card className="p-4 mb-6 border-slate-300 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Filter className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Filter Subscriptions</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                handleFilterChange({ status: e.target.value });
                            }}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="canceled">Canceled</option>
                            <option value="expired">Expired</option>
                            <option value="past_due">Past Due</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Plan Tier</label>
                        <select
                            value={planFilter}
                            onChange={(e) => {
                                setPlanFilter(e.target.value);
                                handleFilterChange({ plan_name: e.target.value });
                            }}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                        >
                            <option value="all">All Plans</option>
                            {plan_names.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Customer Segment</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                handleFilterChange({ type: e.target.value });
                            }}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                        >
                            <option value="all">All Segments</option>
                            <option value="personal">Individual Teacher Workspaces</option>
                            <option value="organization">Educational Institutions</option>
                        </select>
                    </div>
                </div>
            </Card>

            <Card className="p-4 border-slate-300 dark:border-slate-800">
                <DataTable
                    ref={tableRef}
                    ajaxUrl={route('platform.subscriptions.data')}
                    initialFilters={{
                        status: statusFilter,
                        plan_name: planFilter,
                        type: typeFilter,
                    }}
                    columns={[
                        {
                            data: 'actions',
                            title: 'Actions',
                            className: 'w-36 min-w-[130px]',
                            orderable: false,
                            render: (actions, row) => (
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
                                        icon={<Edit3 className="w-3.5 h-3.5 text-indigo-600" />}
                                        onClick={() => openEditModal(row)}
                                    >
                                        Modify Quotas & Limits
                                    </DropdownItem>
                                    {row.status === 'active' && (
                                        <DropdownItem
                                            danger
                                            icon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
                                            onClick={() => setCancelDialogSub({ id: row.id, tenant_name: row.tenant.tenant_name })}
                                        >
                                            Cancel Subscription
                                        </DropdownItem>
                                    )}
                                </Dropdown>
                            ),
                        },
                        {
                            data: 'id',
                            title: 'ID',
                            className: 'w-12 text-slate-500 font-mono text-2xs',
                        },
                        {
                            data: 'tenant',
                            title: 'Tenant & Owner',
                            render: (val) => (
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{val.tenant_name}</span>
                                    <span className="text-3xs text-slate-400">Owner: {val.owner_name} ({val.owner_email})</span>
                                </div>
                            ),
                        },
                        {
                            data: 'plan_name',
                            title: 'Plan Tier',
                            render: (val) => (
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs">{val}</span>
                            ),
                        },
                        {
                            data: 'type',
                            title: 'Segment',
                            render: (val) => (
                                <Badge variant={val === 'organization' ? 'primary' : 'neutral'} size="sm">
                                    {val === 'organization' ? 'Institution' : 'Individual'}
                                </Badge>
                            ),
                        },
                        {
                            data: 'billing_cycle',
                            title: 'Billing',
                            render: (val) => (
                                <span className="uppercase text-3xs font-semibold tracking-wider text-slate-500">{val}</span>
                            ),
                        },
                        {
                            data: 'scans_progress',
                            title: 'Scans Usage',
                            render: (val) => (
                                <div className="w-32 space-y-1">
                                    <div className="flex justify-between text-3xs">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{val.used} / {val.limit}</span>
                                        <span className="text-slate-400">{val.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-indigo-600 h-1.5 rounded-full"
                                            style={{ width: `${val.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ),
                        },
                        {
                            data: 'exams_progress',
                            title: 'Exams Usage',
                            render: (val) => (
                                <div className="w-28 space-y-1">
                                    <div className="flex justify-between text-3xs">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{val.used} / {val.limit}</span>
                                        <span className="text-slate-400">{val.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-purple-600 h-1.5 rounded-full"
                                            style={{ width: `${val.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ),
                        },
                        {
                            data: 'status',
                            title: 'Status',
                            render: (val) => (
                                <Badge variant={val === 'active' ? 'success' : 'danger'} size="sm">
                                    {val}
                                </Badge>
                            ),
                        },
                        {
                            data: 'ends_at',
                            title: 'Expires',
                            render: (val) => (
                                <span className="text-2xs text-slate-500">{val}</span>
                            ),
                        },
                    ]}
                />
            </Card>

            <Modal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Assign / Reset Tenant Subscription"
                maxWidth="md"
            >
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Target Workspace <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={createForm.tenant_id}
                            onChange={(e) => setCreateForm({ ...createForm, tenant_id: Number(e.target.value) })}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200 truncate"
                        >
                            {tenants_list.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name} ({t.type})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Plan Tier Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={createForm.plan_name}
                                onChange={(e) => setCreateForm({ ...createForm, plan_name: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Billing Cycle
                            </label>
                            <select
                                value={createForm.billing_cycle}
                                onChange={(e) => setCreateForm({ ...createForm, billing_cycle: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                                <option value="lifetime">Lifetime</option>
                                <option value="free">Free Tier</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Scans Limit
                            </label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={createForm.scans_limit}
                                onChange={(e) => setCreateForm({ ...createForm, scans_limit: Number(e.target.value) })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Exams Limit
                            </label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={createForm.exams_limit}
                                onChange={(e) => setCreateForm({ ...createForm, exams_limit: Number(e.target.value) })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Seats
                            </label>
                            <input
                                type="number"
                                required
                                min={1}
                                value={createForm.members_limit}
                                onChange={(e) => setCreateForm({ ...createForm, members_limit: Number(e.target.value) })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Expiration Date (Optional)
                        </label>
                        <input
                            type="date"
                            value={createForm.ends_at}
                            onChange={(e) => setCreateForm({ ...createForm, ends_at: e.target.value })}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCreateModalOpen(false)}
                            disabled={createSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={createSubmitting}
                        >
                            {createSubmitting ? 'Assigning...' : 'Assign Subscription'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title={`Adjust Subscription: ${selectedSub?.tenant_name}`}
                maxWidth="md"
            >
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Plan Name
                        </label>
                        <input
                            type="text"
                            required
                            value={formPlanName}
                            onChange={(e) => setFormPlanName(e.target.value)}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Subscription Status
                            </label>
                            <select
                                value={formStatus}
                                onChange={(e) => setFormStatus(e.target.value)}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            >
                                <option value="active">Active</option>
                                <option value="canceled">Canceled</option>
                                <option value="expired">Expired</option>
                                <option value="past_due">Past Due</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Expiration Date
                            </label>
                            <input
                                type="date"
                                value={formEndsAt}
                                onChange={(e) => setFormEndsAt(e.target.value)}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Scans Limit
                            </label>
                            <input
                                type="number"
                                required
                                min={0}
                                max={1000000}
                                value={formScansLimit}
                                onChange={(e) => setFormScansLimit(Number(e.target.value))}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Exams Limit
                            </label>
                            <input
                                type="number"
                                required
                                min={0}
                                max={100000}
                                value={formExamsLimit}
                                onChange={(e) => setFormExamsLimit(Number(e.target.value))}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Members Limit
                            </label>
                            <input
                                type="number"
                                required
                                min={1}
                                max={10000}
                                value={formMembersLimit}
                                onChange={(e) => setFormMembersLimit(Number(e.target.value))}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditModalOpen(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={submitting}
                        >
                            {submitting ? 'Saving Changes...' : 'Save Subscription Quotas'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmationDialog
                isOpen={cancelDialogSub !== null}
                onClose={() => setCancelDialogSub(null)}
                onConfirm={handleCancelSubscription}
                title="Cancel Subscription"
                message={`Are you sure you want to cancel the subscription for "${cancelDialogSub?.tenant_name}"? Resource quotas may become restricted.`}
                confirmText="Cancel Subscription"
                variant="danger"
            />
        </PlatformLayout>
    );
}
