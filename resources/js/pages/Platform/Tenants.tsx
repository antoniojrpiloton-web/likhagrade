import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Building2,
    PlusCircle,
    Edit3,
    Trash2,
    School,
    UserPlus,
    UserMinus,
    ShieldAlert,
    Eye,
    Ban,
    CheckCircle,
    Scan,
    FileText,
    Filter,
    RefreshCw,
    Download,
    Users,
    ChevronDown,
} from 'lucide-react';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { DataTable, type DataTableRef } from '@/components/data-table/DataTable';

interface TenantsPageProps {
    users_list: {
        id: number;
        name: string;
        email: string;
    }[];
}

interface TenantDetailData {
    tenant: {
        id: number;
        ulid: string;
        name: string;
        slug: string;
        type: string;
        org_type: string | null;
        status: string;
        suspension_reason: string | null;
        suspended_at: string | null;
        is_verified_institution: boolean;
        verification_status: string | null;
        contact_person: string | null;
        contact_email: string | null;
        contact_number: string | null;
        address: string | null;
        created_at: string;
        owner: {
            id: number;
            name: string;
            email: string;
        } | null;
    };
    subscription: {
        plan_name: string;
        billing_cycle: string;
        status: string;
        scans_limit: number;
        scans_used: number;
        exams_limit: number;
        exams_used: number;
        members_limit: number;
    } | null;
    members: {
        id: number;
        name: string;
        email: string;
        status: string;
        membership_role: string;
        membership_status: string;
        joined_at: string | null;
    }[];
    departments: {
        id: number;
        name: string;
        code: string | null;
        members_count: number;
    }[];
    recent_activity: {
        id: number;
        action: string;
        description: string;
        user: string;
        created_at: string;
        time_ago: string;
    }[];
}

export default function Tenants({ users_list }: TenantsPageProps) {
    const tableRef = useRef<DataTableRef>(null);

    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        type: 'personal',
        owner_id: users_list[0]?.id || '',
        org_type: 'University',
        contact_person: '',
        contact_email: '',
        plan_name: 'Standard Workspace',
        scans_limit: 1000,
        exams_limit: 20,
    });
    const [createSubmitting, setCreateSubmitting] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingTenantUlid, setEditingTenantUlid] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        type: 'personal',
        status: 'active',
        suspension_reason: '',
        org_type: '',
        contact_person: '',
        contact_email: '',
        contact_number: '',
        address: '',
        owner_id: '',
    });
    const [editSubmitting, setEditSubmitting] = useState(false);

    const [deleteDialogTenant, setDeleteDialogTenant] = useState<{ ulid: string; name: string } | null>(null);

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<TenantDetailData | null>(null);

    const [addMemberUserId, setAddMemberUserId] = useState(users_list[0]?.id || '');
    const [addMemberRole, setAddMemberRole] = useState('Teacher');
    const [memberSubmitting, setMemberSubmitting] = useState(false);

    const [suspendModalOpen, setSuspendModalOpen] = useState(false);
    const [targetTenant, setTargetTenant] = useState<{ ulid: string; name: string } | null>(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [suspendSubmitting, setSuspendSubmitting] = useState(false);

    const [activateDialogTenant, setActivateDialogTenant] = useState<{ ulid: string; name: string } | null>(null);

    const handleFilterChange = (updates: Record<string, any>) => {
        tableRef.current?.setFilters(updates);
    };

    const openCreateModal = () => {
        setCreateForm({
            name: '',
            type: 'personal',
            owner_id: users_list[0]?.id || '',
            org_type: 'University',
            contact_person: '',
            contact_email: '',
            plan_name: 'Standard Workspace',
            scans_limit: 1000,
            exams_limit: 20,
        });
        setCreateModalOpen(true);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCreateSubmitting(true);
        router.post(route('platform.tenants.store'), createForm, {
            onSuccess: () => {
                setCreateModalOpen(false);
                tableRef.current?.reload();
            },
            onFinish: () => setCreateSubmitting(false),
        });
    };

    const openEditModal = async (ulid: string) => {
        setEditingTenantUlid(ulid);
        setEditModalOpen(true);

        try {
            const response = await fetch(route('platform.tenants.show', ulid));
            const data: TenantDetailData = await response.json();
            setEditForm({
                name: data.tenant.name,
                type: data.tenant.type,
                status: data.tenant.status,
                suspension_reason: data.tenant.suspension_reason || '',
                org_type: data.tenant.org_type || '',
                contact_person: data.tenant.contact_person || '',
                contact_email: data.tenant.contact_email || '',
                contact_number: data.tenant.contact_number || '',
                address: data.tenant.address || '',
                owner_id: data.tenant.owner ? String(data.tenant.owner.id) : (users_list[0]?.id ? String(users_list[0].id) : ''),
            });
        } catch (error) {
            console.error('Failed to load workspace for editing', error);
        }
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTenantUlid) return;

        setEditSubmitting(true);
        router.patch(route('platform.tenants.update', editingTenantUlid), editForm, {
            onSuccess: () => {
                setEditModalOpen(false);
                setEditingTenantUlid(null);
                tableRef.current?.reload();
            },
            onFinish: () => setEditSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!deleteDialogTenant) return;

        router.delete(route('platform.tenants.destroy', deleteDialogTenant.ulid), {
            onSuccess: () => {
                setDeleteDialogTenant(null);
                tableRef.current?.reload();
            },
        });
    };

    const openTenantDetail = async (ulid: string) => {
        setDetailModalOpen(true);
        setDetailLoading(true);
        setSelectedTenant(null);

        try {
            const response = await fetch(route('platform.tenants.show', ulid));
            const data = await response.json();
            setSelectedTenant(data);
        } catch (error) {
            console.error('Failed to load workspace details', error);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenant || !addMemberUserId) return;

        setMemberSubmitting(true);
        router.post(
            route('platform.tenants.members.add', selectedTenant.tenant.ulid),
            { user_id: addMemberUserId, role: addMemberRole },
            {
                onSuccess: () => {
                    openTenantDetail(selectedTenant.tenant.ulid);
                    tableRef.current?.reload();
                },
                onFinish: () => setMemberSubmitting(false),
            }
        );
    };

    const handleRemoveMember = (userId: number) => {
        if (!selectedTenant) return;

        router.delete(route('platform.tenants.members.remove', [selectedTenant.tenant.ulid, userId]), {
            onSuccess: () => {
                openTenantDetail(selectedTenant.tenant.ulid);
                tableRef.current?.reload();
            },
        });
    };

    const handleSuspend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetTenant || !suspendReason.trim()) return;

        setSuspendSubmitting(true);
        router.post(
            route('platform.tenants.suspend', targetTenant.ulid),
            { reason: suspendReason },
            {
                onSuccess: () => {
                    setSuspendModalOpen(false);
                    setSuspendReason('');
                    setTargetTenant(null);
                    tableRef.current?.reload();
                },
                onFinish: () => setSuspendSubmitting(false),
            }
        );
    };

    const handleActivate = () => {
        if (!activateDialogTenant) return;

        router.post(
            route('platform.tenants.activate', activateDialogTenant.ulid),
            {},
            {
                onSuccess: () => {
                    setActivateDialogTenant(null);
                    tableRef.current?.reload();
                },
            }
        );
    };

    return (
        <PlatformLayout title="Tenant Workspaces & Customer Segments">
            <Head title="Workspaces & Tenants — LikhaGrade SuperAdmin" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>Workspaces & Tenants</span>
                        <Badge variant="primary">Multi-Tenant CRUD</Badge>
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Create and manage individual teacher workspaces and educational institutions, configure quotas, manage enrolled members, and export tenant lists.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <a href={route('platform.tenants.export')}>
                        <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                            <Download className="w-3.5 h-3.5" />
                            <span>Export CSV</span>
                        </Button>
                    </a>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={openCreateModal}
                        className="flex items-center gap-1.5"
                    >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Create Workspace</span>
                    </Button>
                </div>
            </div>

            <Card className="p-4 mb-6 border-slate-300 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Filter className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Filter Workspaces</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                            <option value="personal">Individual Teachers (Personal)</option>
                            <option value="organization">Educational Institutions (Orgs)</option>
                        </select>
                    </div>

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
                            <option value="suspended">Suspended</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Created After</label>
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
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Created Before</label>
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
                    ajaxUrl={route('platform.tenants.data')}
                    initialFilters={{
                        type: typeFilter,
                        status: statusFilter,
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
                                        icon={<Eye className="w-3.5 h-3.5 text-indigo-600" />}
                                        onClick={() => openTenantDetail(row.ulid)}
                                    >
                                        Inspect Details
                                    </DropdownItem>
                                    <DropdownItem
                                        icon={<Edit3 className="w-3.5 h-3.5 text-slate-600" />}
                                        onClick={() => openEditModal(row.ulid)}
                                    >
                                        Edit Workspace
                                    </DropdownItem>
                                    {actions.status === 'active' ? (
                                        <DropdownItem
                                            icon={<Ban className="w-3.5 h-3.5 text-amber-600" />}
                                            onClick={() => {
                                                setTargetTenant({ ulid: row.ulid, name: row.name });
                                                setSuspendReason('');
                                                setSuspendModalOpen(true);
                                            }}
                                        >
                                            Suspend Workspace
                                        </DropdownItem>
                                    ) : (
                                        <DropdownItem
                                            icon={<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                            onClick={() => setActivateDialogTenant({ ulid: row.ulid, name: row.name })}
                                        >
                                            Reactivate Workspace
                                        </DropdownItem>
                                    )}
                                    <DropdownItem
                                        icon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                                        onClick={() => setDeleteDialogTenant({ ulid: row.ulid, name: row.name })}
                                        danger
                                    >
                                        Delete Workspace
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
                            data: 'name',
                            title: 'Workspace / Institution',
                            render: (val, row) => (
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">{val}</span>
                                        {row.customer_type?.is_verified && (
                                            <Badge variant="success" size="sm">Verified</Badge>
                                        )}
                                    </div>
                                    <span className="text-3xs text-slate-400 font-mono">ULID: {row.ulid}</span>
                                </div>
                            ),
                        },
                        {
                            data: 'customer_type',
                            title: 'Segment',
                            render: (val) => (
                                <div>
                                    <Badge variant={val.type === 'organization' ? 'primary' : 'neutral'} size="sm">
                                        {val.type === 'organization' ? (val.org_type || 'Institution') : 'Teacher Personal'}
                                    </Badge>
                                </div>
                            ),
                        },
                        {
                            data: 'owner',
                            title: 'Workspace Owner',
                            render: (val) => (
                                <div className="flex flex-col text-xs">
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{val.name}</span>
                                    <span className="text-3xs text-slate-400 font-mono">{val.email}</span>
                                </div>
                            ),
                        },
                        {
                            data: 'members_count',
                            title: 'Members',
                            render: (val) => (
                                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                                    {val}
                                </span>
                            ),
                        },
                        {
                            data: 'subscription',
                            title: 'Plan & Scans',
                            render: (val) => (
                                <div className="flex flex-col text-2xs">
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{val.plan_name}</span>
                                    <span className="text-3xs text-slate-500">
                                        {val.scans_used} / {val.scans_limit} Scans
                                    </span>
                                </div>
                            ),
                        },
                        {
                            data: 'status',
                            title: 'Status',
                            render: (val) => (
                                <Badge
                                    variant={val === 'active' ? 'success' : val === 'suspended' ? 'danger' : 'warning'}
                                    size="sm"
                                >
                                    {val}
                                </Badge>
                            ),
                        },
                        {
                            data: 'created_at',
                            title: 'Registered',
                            render: (val) => (
                                <span className="text-slate-500 text-2xs">{val}</span>
                            ),
                        },
                    ]}
                />
            </Card>

            <Modal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Create Workspace / Institution"
                maxWidth="md"
            >
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Workspace Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={createForm.name}
                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            placeholder="e.g. Science Department Workspace or Surigao State University"
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Customer Segment
                            </label>
                            <select
                                value={createForm.type}
                                onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            >
                                <option value="personal">Individual Teacher Workspace</option>
                                <option value="organization">Educational Institution</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Primary Owner
                            </label>
                            <select
                                value={createForm.owner_id}
                                onChange={(e) => setCreateForm({ ...createForm, owner_id: Number(e.target.value) })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200 truncate"
                            >
                                {users_list.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {createForm.type === 'organization' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Institution Type
                            </label>
                            <select
                                value={createForm.org_type}
                                onChange={(e) => setCreateForm({ ...createForm, org_type: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            >
                                <option value="University">University</option>
                                <option value="College">College</option>
                                <option value="High School">High School</option>
                                <option value="Elementary School">Elementary School</option>
                                <option value="DepEd Division">DepEd Division</option>
                                <option value="Private Institution">Private Institution</option>
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Initial Scans Limit
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={createForm.scans_limit}
                                onChange={(e) => setCreateForm({ ...createForm, scans_limit: Number(e.target.value) })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Initial Exams Limit
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={createForm.exams_limit}
                                onChange={(e) => setCreateForm({ ...createForm, exams_limit: Number(e.target.value) })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            />
                        </div>
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
                            {createSubmitting ? 'Creating...' : 'Create Workspace'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Edit Workspace Settings"
                maxWidth="md"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Workspace Name
                        </label>
                        <input
                            type="text"
                            required
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Status
                            </label>
                            <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            >
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Owner
                            </label>
                            <select
                                value={editForm.owner_id}
                                onChange={(e) => setEditForm({ ...editForm, owner_id: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200 truncate"
                            >
                                {users_list.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name} ({u.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {editForm.status === 'suspended' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Suspension Reason
                            </label>
                            <textarea
                                rows={2}
                                value={editForm.suspension_reason}
                                onChange={(e) => setEditForm({ ...editForm, suspension_reason: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditModalOpen(false)}
                            disabled={editSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={editSubmitting}
                        >
                            {editSubmitting ? 'Saving...' : 'Save Workspace'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title="Workspace Profile & Resource Governance"
                maxWidth="3xl"
            >
                {detailLoading || !selectedTenant ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                        Loading detailed workspace profile...
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                        {selectedTenant.tenant.name}
                                    </h3>
                                    <Badge
                                        variant={selectedTenant.tenant.type === 'organization' ? 'primary' : 'neutral'}
                                        size="sm"
                                    >
                                        {selectedTenant.tenant.type === 'organization' ? 'Educational Institution' : 'Individual Personal'}
                                    </Badge>
                                    <Badge
                                        variant={selectedTenant.tenant.status === 'active' ? 'success' : 'danger'}
                                        size="sm"
                                    >
                                        {selectedTenant.tenant.status}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">ULID: {selectedTenant.tenant.ulid}</p>
                                {selectedTenant.tenant.suspension_reason && (
                                    <div className="mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-2xs text-rose-700 dark:text-rose-300">
                                        <strong>Suspension Reason:</strong> {selectedTenant.tenant.suspension_reason}
                                    </div>
                                )}
                            </div>

                            <div className="text-2xs text-slate-500 space-y-1">
                                <div>Created: <strong className="text-slate-700 dark:text-slate-300">{selectedTenant.tenant.created_at}</strong></div>
                                <div>Owner: <strong className="text-slate-700 dark:text-slate-300">{selectedTenant.tenant.owner ? selectedTenant.tenant.owner.name : 'None'}</strong></div>
                                <div>Verified: <strong className="text-slate-700 dark:text-slate-300">{selectedTenant.tenant.is_verified_institution ? 'Yes' : 'No'}</strong></div>
                            </div>
                        </div>

                        {selectedTenant.subscription && (
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                                    <Scan className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Subscription & Quotas ({selectedTenant.subscription.plan_name})</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                                        <span className="text-2xs font-semibold text-slate-500 block mb-1">OMR Scans</span>
                                        <span className="text-lg font-bold text-indigo-600">
                                            {selectedTenant.subscription.scans_used} / {selectedTenant.subscription.scans_limit}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                                        <span className="text-2xs font-semibold text-slate-500 block mb-1">Examinations</span>
                                        <span className="text-lg font-bold text-purple-600">
                                            {selectedTenant.subscription.exams_used} / {selectedTenant.subscription.exams_limit}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                                        <span className="text-2xs font-semibold text-slate-500 block mb-1">Members Limit</span>
                                        <span className="text-lg font-bold text-emerald-600">
                                            {selectedTenant.members.length} / {selectedTenant.subscription.members_limit}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Workspace Members ({selectedTenant.members.length})</span>
                                </h4>
                            </div>

                            <form onSubmit={handleAddMember} className="p-3 mb-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2">
                                <select
                                    value={addMemberUserId}
                                    onChange={(e) => setAddMemberUserId(Number(e.target.value))}
                                    className="w-full sm:w-1/2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200 truncate"
                                >
                                    {users_list.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                    ))}
                                </select>
                                <select
                                    value={addMemberRole}
                                    onChange={(e) => setAddMemberRole(e.target.value)}
                                    className="w-full sm:w-1/4 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                                >
                                    <option value="Owner">Owner</option>
                                    <option value="Organization Owner">Organization Owner</option>
                                    <option value="Organization Admin">Organization Admin</option>
                                    <option value="Department Admin">Department Admin</option>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Instructor">Instructor</option>
                                </select>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={memberSubmitting}
                                    className="w-full sm:w-auto shrink-0 flex items-center gap-1"
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>Add Member</span>
                                </Button>
                            </form>

                            <div className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                {selectedTenant.members.map((m) => (
                                    <div key={m.id} className="p-2.5 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                                        <div>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">{m.name}</span>
                                            <span className="text-2xs text-slate-400 font-mono">{m.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="neutral" size="sm">{m.membership_role}</Badge>
                                            {selectedTenant.tenant.owner?.id !== m.id && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMember(m.id)}
                                                    className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                                                    title="Remove Member"
                                                >
                                                    <UserMinus className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={suspendModalOpen}
                onClose={() => setSuspendModalOpen(false)}
                title="Suspend Workspace"
                maxWidth="md"
            >
                <form onSubmit={handleSuspend} className="space-y-4">
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Confirm Workspace Suspension</p>
                            <p className="mt-1">
                                Suspending <strong>{targetTenant?.name}</strong> will prevent all enrolled teachers and administrators from accessing exams and scanning records in this workspace.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Administrative Reason <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            placeholder="e.g. Non-payment, institutional dispute, investigation"
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSuspendModalOpen(false)}
                            disabled={suspendSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            size="sm"
                            disabled={suspendSubmitting || !suspendReason.trim()}
                        >
                            {suspendSubmitting ? 'Suspending...' : 'Confirm Suspension'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmationDialog
                isOpen={activateDialogTenant !== null}
                onClose={() => setActivateDialogTenant(null)}
                onConfirm={handleActivate}
                title="Reactivate Workspace"
                message={`Are you sure you want to reactivate "${activateDialogTenant?.name}"? All authorized members will regain access.`}
                confirmText="Reactivate Workspace"
                variant="primary"
            />

            <ConfirmationDialog
                isOpen={deleteDialogTenant !== null}
                onClose={() => setDeleteDialogTenant(null)}
                onConfirm={handleDelete}
                title="Delete Workspace"
                message={`Permanently delete workspace "${deleteDialogTenant?.name}"? All workspace records and memberships will be purged.`}
                confirmText="Delete Workspace"
                variant="danger"
            />
        </PlatformLayout>
    );
}
