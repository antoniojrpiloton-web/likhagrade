import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Users as UsersIcon,
    UserPlus,
    Edit3,
    Trash2,
    Shield,
    ShieldAlert,
    ShieldCheck,
    KeyRound,
    Eye,
    Ban,
    CheckCircle,
    Building2,
    Filter,
    RefreshCw,
    Download,
    LogIn,
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

interface UsersPageProps {
    tenants_list: {
        id: number;
        name: string;
        type: string;
    }[];
}

interface UserDetailData {
    user: {
        id: number;
        first_name: string;
        last_name: string;
        name: string;
        email: string;
        avatar_url: string | null;
        google_id: boolean;
        status: string;
        suspension_reason: string | null;
        suspended_at: string | null;
        email_verified_at: string | null;
        is_superadmin: boolean;
        created_at: string;
    };
    memberships: {
        tenant_id: number;
        tenant_ulid: string;
        tenant_name: string;
        tenant_type: string;
        membership_role: string;
        membership_status: string;
        joined_at: string | null;
        plan_name: string;
    }[];
    recent_activity: {
        id: number;
        action: string;
        description: string;
        ip_address: string | null;
        created_at: string;
        time_ago: string;
    }[];
}

export default function Users({ tenants_list }: UsersPageProps) {
    const tableRef = useRef<DataTableRef>(null);

    const [statusFilter, setStatusFilter] = useState('all');
    const [verifiedFilter, setVerifiedFilter] = useState('all');
    const [tenantFilter, setTenantFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        status: 'active',
        is_superadmin: false,
        create_workspace: true,
        workspace_name: '',
    });
    const [createSubmitting, setCreateSubmitting] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        status: 'active',
        suspension_reason: '',
        is_verified: true,
        is_superadmin: false,
    });
    const [editSubmitting, setEditSubmitting] = useState(false);

    const [deleteDialogUser, setDeleteDialogUser] = useState<{ id: number; name: string; email: string } | null>(null);

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserDetailData | null>(null);

    const [suspendModalOpen, setSuspendModalOpen] = useState(false);
    const [targetUser, setTargetUser] = useState<{ id: number; name: string; email: string } | null>(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [suspendSubmitting, setSuspendSubmitting] = useState(false);

    const [activateDialogUser, setActivateDialogUser] = useState<{ id: number; email: string } | null>(null);
    const [passwordResetUser, setPasswordResetUser] = useState<{ id: number; email: string } | null>(null);
    const [impersonateUser, setImpersonateUser] = useState<{ id: number; name: string; email: string } | null>(null);

    const handleFilterChange = (updates: Record<string, any>) => {
        tableRef.current?.setFilters(updates);
    };

    const openCreateModal = () => {
        setCreateForm({
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            status: 'active',
            is_superadmin: false,
            create_workspace: true,
            workspace_name: '',
        });
        setCreateModalOpen(true);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCreateSubmitting(true);
        router.post(route('platform.users.store'), createForm, {
            onSuccess: () => {
                setCreateModalOpen(false);
                tableRef.current?.reload();
            },
            onFinish: () => setCreateSubmitting(false),
        });
    };

    const openEditModal = async (userId: number) => {
        setEditingUserId(userId);
        setEditModalOpen(true);

        try {
            const response = await fetch(route('platform.users.show', userId));
            const data: UserDetailData = await response.json();
            setEditForm({
                first_name: data.user.first_name,
                last_name: data.user.last_name,
                email: data.user.email,
                status: data.user.status,
                suspension_reason: data.user.suspension_reason || '',
                is_verified: !!data.user.email_verified_at,
                is_superadmin: data.user.is_superadmin,
            });
        } catch (error) {
            console.error('Failed to load user for editing', error);
        }
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUserId) return;

        setEditSubmitting(true);
        router.patch(route('platform.users.update', editingUserId), editForm, {
            onSuccess: () => {
                setEditModalOpen(false);
                setEditingUserId(null);
                tableRef.current?.reload();
            },
            onFinish: () => setEditSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!deleteDialogUser) return;

        router.delete(route('platform.users.destroy', deleteDialogUser.id), {
            onSuccess: () => {
                setDeleteDialogUser(null);
                tableRef.current?.reload();
            },
        });
    };

    const openUserDetail = async (userId: number) => {
        setDetailModalOpen(true);
        setDetailLoading(true);
        setSelectedUser(null);

        try {
            const response = await fetch(route('platform.users.show', userId));
            const data = await response.json();
            setSelectedUser(data);
        } catch (error) {
            console.error('Failed to load user details', error);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleSuspend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetUser || !suspendReason.trim()) return;

        setSuspendSubmitting(true);
        router.post(
            route('platform.users.suspend', targetUser.id),
            { reason: suspendReason },
            {
                onSuccess: () => {
                    setSuspendModalOpen(false);
                    setSuspendReason('');
                    setTargetUser(null);
                    tableRef.current?.reload();
                },
                onFinish: () => setSuspendSubmitting(false),
            }
        );
    };

    const handleActivate = () => {
        if (!activateDialogUser) return;

        router.post(
            route('platform.users.activate', activateDialogUser.id),
            {},
            {
                onSuccess: () => {
                    setActivateDialogUser(null);
                    tableRef.current?.reload();
                },
            }
        );
    };

    const handlePasswordReset = () => {
        if (!passwordResetUser) return;

        router.post(
            route('platform.users.reset-password', passwordResetUser.id),
            {},
            {
                onSuccess: () => {
                    setPasswordResetUser(null);
                },
            }
        );
    };

    const handleImpersonate = () => {
        if (!impersonateUser) return;

        router.post(
            route('platform.users.impersonate', impersonateUser.id),
            {},
            {
                onSuccess: () => {
                    setImpersonateUser(null);
                },
            }
        );
    };

    return (
        <PlatformLayout title="User Management & Governance">
            <Head title="User Management — LikhaGrade SuperAdmin" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>User Management</span>
                        <Badge variant="primary">Full CRUD</Badge>
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Create, inspect, modify, suspend, or delete user accounts, simulate sessions with user impersonation, and export records.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <a href={route('platform.users.export')}>
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
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Create User</span>
                    </Button>
                </div>
            </div>

            <Card className="p-4 mb-6 border-slate-300 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Filter className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Filter Users</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Email Verification</label>
                        <select
                            value={verifiedFilter}
                            onChange={(e) => {
                                setVerifiedFilter(e.target.value);
                                handleFilterChange({ verified: e.target.value });
                            }}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                        >
                            <option value="all">All Verification</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Workspace Membership</label>
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
                                    {t.name} ({t.type})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Registered After</label>
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
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Registered Before</label>
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
                    ajaxUrl={route('platform.users.data')}
                    initialFilters={{
                        status: statusFilter,
                        verified: verifiedFilter,
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
                                        onClick={() => openUserDetail(row.id)}
                                    >
                                        Inspect Details
                                    </DropdownItem>
                                    <DropdownItem
                                        icon={<Edit3 className="w-3.5 h-3.5 text-slate-600" />}
                                        onClick={() => openEditModal(row.id)}
                                    >
                                        Edit Profile
                                    </DropdownItem>
                                    {!actions.is_superadmin && (
                                        <DropdownItem
                                            icon={<LogIn className="w-3.5 h-3.5 text-blue-600" />}
                                            onClick={() => setImpersonateUser({ id: row.id, name: row.name, email: row.email })}
                                        >
                                            Login As User
                                        </DropdownItem>
                                    )}
                                    {!actions.is_superadmin && (
                                        <DropdownItem
                                            icon={<KeyRound className="w-3.5 h-3.5 text-amber-600" />}
                                            onClick={() => setPasswordResetUser({ id: row.id, email: row.email })}
                                        >
                                            Send Reset Link
                                        </DropdownItem>
                                    )}
                                    {!actions.is_superadmin && actions.status === 'active' && (
                                        <DropdownItem
                                            icon={<Ban className="w-3.5 h-3.5 text-amber-600" />}
                                            onClick={() => {
                                                setTargetUser({ id: row.id, name: row.name, email: row.email });
                                                setSuspendReason('');
                                                setSuspendModalOpen(true);
                                            }}
                                        >
                                            Suspend Account
                                        </DropdownItem>
                                    )}
                                    {!actions.is_superadmin && actions.status !== 'active' && (
                                        <DropdownItem
                                            icon={<CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                            onClick={() => setActivateDialogUser({ id: row.id, email: row.email })}
                                        >
                                            Reactivate Account
                                        </DropdownItem>
                                    )}
                                    {!actions.is_superadmin && (
                                        <DropdownItem
                                            icon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                                            onClick={() => setDeleteDialogUser({ id: row.id, name: row.name, email: row.email })}
                                            danger
                                        >
                                            Delete Account
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
                            data: 'name',
                            title: 'User Name',
                            render: (val, row) => (
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{val}</span>
                                    <span className="text-3xs text-slate-400 font-mono">ID: #{row.id}</span>
                                </div>
                            ),
                        },
                        {
                            data: 'email',
                            title: 'Email',
                            render: (val) => (
                                <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">{val}</span>
                            ),
                        },
                        {
                            data: 'workspaces',
                            title: 'Workspaces',
                            render: (val) => (
                                <div className="flex items-center gap-1.5">
                                    <Badge variant="neutral" size="sm">
                                        {val.count} {val.count === 1 ? 'Workspace' : 'Workspaces'}
                                    </Badge>
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
                            data: 'email_verified_at',
                            title: 'Email Status',
                            render: (val) => (
                                <span className={val === 'Unverified' ? 'text-amber-600 text-2xs font-semibold' : 'text-slate-600 dark:text-slate-400 text-2xs'}>
                                    {val}
                                </span>
                            ),
                        },
                        {
                            data: 'created_at',
                            title: 'Joined Date',
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
                title="Create New User Account"
                maxWidth="md"
            >
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                First Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={createForm.first_name}
                                onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Last Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={createForm.last_name}
                                onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="email"
                            required
                            value={createForm.email}
                            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Password <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            minLength={8}
                            value={createForm.password}
                            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Initial Status
                        </label>
                        <select
                            value={createForm.status}
                            onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                        >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={createForm.is_superadmin}
                                onChange={(e) => setCreateForm({ ...createForm, is_superadmin: e.target.checked })}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Grant SuperAdmin Platform Privileges</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={createForm.create_workspace}
                                onChange={(e) => setCreateForm({ ...createForm, create_workspace: e.target.checked })}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Create Personal Workspace Automatically</span>
                        </label>

                        {createForm.create_workspace && (
                            <div className="pl-6 pt-1">
                                <label className="block text-2xs font-semibold text-slate-500 mb-0.5">Workspace Name (Optional)</label>
                                <input
                                    type="text"
                                    value={createForm.workspace_name}
                                    placeholder="Leave blank for auto-generation"
                                    onChange={(e) => setCreateForm({ ...createForm, workspace_name: e.target.value })}
                                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                                />
                            </div>
                        )}
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
                            {createSubmitting ? 'Creating...' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Edit User Profile"
                maxWidth="md"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                First Name
                            </label>
                            <input
                                type="text"
                                required
                                value={editForm.first_name}
                                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Last Name
                            </label>
                            <input
                                type="text"
                                required
                                value={editForm.last_name}
                                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
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
                                Email Verification
                            </label>
                            <label className="flex items-center gap-2 mt-2 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editForm.is_verified}
                                    onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>Mark Verified</span>
                            </label>
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
                            {editSubmitting ? 'Saving...' : 'Save Profile Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title="User Profile & Workspace Memberships"
                maxWidth="3xl"
            >
                {detailLoading || !selectedUser ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                        Loading detailed user record...
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                        {selectedUser.user.name}
                                    </h3>
                                    {selectedUser.user.is_superadmin && (
                                        <Badge variant="primary" size="sm">SuperAdmin</Badge>
                                    )}
                                    <Badge
                                        variant={selectedUser.user.status === 'active' ? 'success' : 'danger'}
                                        size="sm"
                                    >
                                        {selectedUser.user.status}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedUser.user.email}</p>
                                {selectedUser.user.suspension_reason && (
                                    <div className="mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-2xs text-rose-700 dark:text-rose-300">
                                        <strong>Suspension Reason:</strong> {selectedUser.user.suspension_reason}
                                    </div>
                                )}
                            </div>

                            <div className="text-2xs text-slate-500 space-y-1">
                                <div>Registered: <strong className="text-slate-700 dark:text-slate-300">{selectedUser.user.created_at}</strong></div>
                                <div>Verified: <strong className="text-slate-700 dark:text-slate-300">{selectedUser.user.email_verified_at || 'Unverified'}</strong></div>
                                <div>OAuth: <strong className="text-slate-700 dark:text-slate-300">{selectedUser.user.google_id ? 'Google Connected' : 'Email/Password'}</strong></div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Workspace Memberships ({selectedUser.memberships.length})</span>
                            </h4>
                            <div className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                {selectedUser.memberships.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-500">
                                        No active workspace memberships found.
                                    </div>
                                ) : (
                                    selectedUser.memberships.map((m) => (
                                        <div key={m.tenant_id} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                                            <div>
                                                <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                                                    {m.tenant_name}
                                                </span>
                                                <span className="text-2xs text-slate-500">
                                                    Segment: {m.tenant_type === 'organization' ? 'Educational Institution' : 'Individual Personal'} • Plan: {m.plan_name}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="neutral" size="sm">{m.membership_role}</Badge>
                                                <span className="text-3xs text-slate-400 block mt-1">Joined: {m.joined_at}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                                <UsersIcon className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Recent Account Activity</span>
                            </h4>
                            <div className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                {selectedUser.recent_activity.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-500">
                                        No recent audit activity records for this user.
                                    </div>
                                ) : (
                                    selectedUser.recent_activity.map((act) => (
                                        <div key={act.id} className="p-2.5 bg-white dark:bg-slate-900 flex items-center justify-between text-2xs">
                                            <div>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{act.action}</span>
                                                <p className="text-slate-500 mt-0.5">{act.description}</p>
                                            </div>
                                            <div className="text-right text-slate-400">
                                                <span>{act.time_ago}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={suspendModalOpen}
                onClose={() => setSuspendModalOpen(false)}
                title="Suspend User Account"
                maxWidth="md"
            >
                <form onSubmit={handleSuspend} className="space-y-4">
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Confirm Administrative Suspension</p>
                            <p className="mt-1">
                                Suspending <strong>{targetUser?.email}</strong> will immediately terminate their active session and prevent further logins across all workspaces.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Administrative Reason for Suspension <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            placeholder="e.g. Terms of Service violation, suspicious login pattern, institution request"
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
                isOpen={activateDialogUser !== null}
                onClose={() => setActivateDialogUser(null)}
                onConfirm={handleActivate}
                title="Reactivate Account"
                message={`Are you sure you want to reactivate the account for ${activateDialogUser?.email}? The user will regain normal access to their workspaces.`}
                confirmText="Reactivate Account"
                variant="primary"
            />

            <ConfirmationDialog
                isOpen={passwordResetUser !== null}
                onClose={() => setPasswordResetUser(null)}
                onConfirm={handlePasswordReset}
                title="Dispatch Password Reset"
                message={`Send a secure password recovery notification to ${passwordResetUser?.email}? The link will allow them to configure a new password.`}
                confirmText="Send Password Reset"
                variant="primary"
            />

            <ConfirmationDialog
                isOpen={impersonateUser !== null}
                onClose={() => setImpersonateUser(null)}
                onConfirm={handleImpersonate}
                title="Login As User (Impersonation)"
                message={`Temporarily sign in as ${impersonateUser?.name} (${impersonateUser?.email})? You will navigate the application from their perspective with an exit banner available anytime.`}
                confirmText="Start Impersonation"
                variant="primary"
            />

            <ConfirmationDialog
                isOpen={deleteDialogUser !== null}
                onClose={() => setDeleteDialogUser(null)}
                onConfirm={handleDelete}
                title="Delete User Account"
                message={`Permanently remove user ${deleteDialogUser?.name} (${deleteDialogUser?.email})? All associated memberships will be severed. This action is audited.`}
                confirmText="Delete Account"
                variant="danger"
            />
        </PlatformLayout>
    );
}
