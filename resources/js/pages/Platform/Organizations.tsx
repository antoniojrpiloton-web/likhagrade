import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    School,
    PlusCircle,
    ShieldCheck,
    ShieldAlert,
    Eye,
    CheckCircle,
    XCircle,
    Building2,
    Users,
    Mail,
    Phone,
    MapPin,
    Filter,
    RefreshCw,
    Calendar,
    Plus,
    Trash2,
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

interface OrganizationsPageProps {
    users_list: {
        id: number;
        name: string;
        email: string;
    }[];
}

interface OrgDetailData {
    tenant: {
        id: number;
        ulid: string;
        name: string;
        slug: string;
        org_type: string | null;
        status: string;
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
        members: {
            id: number;
            name: string;
            email: string;
        }[];
    }[];
    invitations: {
        id: number;
        email: string;
        role: string;
        status: string;
        created_at: string;
        expires_at: string;
    }[];
}

export default function Organizations({ users_list }: OrganizationsPageProps) {
    const tableRef = useRef<DataTableRef>(null);

    const [verificationFilter, setVerificationFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [orgTypeFilter, setOrgTypeFilter] = useState('all');

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        org_type: 'University',
        owner_id: users_list[0]?.id || '',
        contact_person: '',
        contact_email: '',
        contact_number: '',
        address: '',
        is_verified: true,
    });
    const [createSubmitting, setCreateSubmitting] = useState(false);

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<OrgDetailData | null>(null);

    const [deptName, setDeptName] = useState('');
    const [deptCode, setDeptCode] = useState('');
    const [deptSubmitting, setDeptSubmitting] = useState(false);

    const [verifyDialogOrg, setVerifyDialogOrg] = useState<{ ulid: string; name: string } | null>(null);
    const [revokeDialogOrg, setRevokeDialogOrg] = useState<{ ulid: string; name: string } | null>(null);

    const handleFilterChange = (updates: Record<string, any>) => {
        tableRef.current?.setFilters(updates);
    };

    const openCreateModal = () => {
        setCreateForm({
            name: '',
            org_type: 'University',
            owner_id: users_list[0]?.id || '',
            contact_person: '',
            contact_email: '',
            contact_number: '',
            address: '',
            is_verified: true,
        });
        setCreateModalOpen(true);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCreateSubmitting(true);
        router.post(route('platform.organizations.store'), createForm, {
            onSuccess: () => {
                setCreateModalOpen(false);
                tableRef.current?.reload();
            },
            onFinish: () => setCreateSubmitting(false),
        });
    };

    const openOrgDetail = async (ulid: string) => {
        setDetailModalOpen(true);
        setDetailLoading(true);
        setSelectedOrg(null);

        try {
            const response = await fetch(route('platform.organizations.show', ulid));
            const data = await response.json();
            setSelectedOrg(data);
        } catch (error) {
            console.error('Failed to load organization details', error);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleAddDepartment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrg || !deptName.trim()) return;

        setDeptSubmitting(true);
        router.post(
            route('platform.organizations.departments.store', selectedOrg.tenant.ulid),
            { name: deptName, code: deptCode },
            {
                onSuccess: () => {
                    setDeptName('');
                    setDeptCode('');
                    openOrgDetail(selectedOrg.tenant.ulid);
                    tableRef.current?.reload();
                },
                onFinish: () => setDeptSubmitting(false),
            }
        );
    };

    const handleDeleteDepartment = (deptId: number) => {
        if (!selectedOrg) return;

        router.delete(
            route('platform.organizations.departments.destroy', [selectedOrg.tenant.ulid, deptId]),
            {
                onSuccess: () => {
                    openOrgDetail(selectedOrg.tenant.ulid);
                    tableRef.current?.reload();
                },
            }
        );
    };

    const handleVerify = () => {
        if (!verifyDialogOrg) return;

        router.post(
            route('platform.organizations.verify', verifyDialogOrg.ulid),
            {},
            {
                onSuccess: () => {
                    setVerifyDialogOrg(null);
                    tableRef.current?.reload();
                },
            }
        );
    };

    const handleRevoke = () => {
        if (!revokeDialogOrg) return;

        router.post(
            route('platform.organizations.revoke-verification', revokeDialogOrg.ulid),
            {},
            {
                onSuccess: () => {
                    setRevokeDialogOrg(null);
                    tableRef.current?.reload();
                },
            }
        );
    };

    return (
        <PlatformLayout title="Educational Institutions">
            <Head title="Organizations — LikhaGrade SuperAdmin" />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>Educational Institutions</span>
                        <Badge variant="primary">Campus Enterprise</Badge>
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Create and manage universities, colleges, and schools, verify institutional credentials, and organize departments.
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateModal}
                    className="flex items-center gap-1.5"
                >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create Institution</span>
                </Button>
            </div>

            <Card className="p-4 mb-6 border-slate-300 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Filter className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Filter Institutions</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Verification Status</label>
                        <select
                            value={verificationFilter}
                            onChange={(e) => {
                                setVerificationFilter(e.target.value);
                                handleFilterChange({ verification_status: e.target.value });
                            }}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                        >
                            <option value="all">All Statuses</option>
                            <option value="verified">Verified Institution</option>
                            <option value="pending">Pending Verification</option>
                            <option value="rejected">Rejected / Revoked</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Institution Type</label>
                        <select
                            value={orgTypeFilter}
                            onChange={(e) => {
                                setOrgTypeFilter(e.target.value);
                                handleFilterChange({ org_type: e.target.value });
                            }}
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                        >
                            <option value="all">All Types</option>
                            <option value="University">University</option>
                            <option value="College">College</option>
                            <option value="High School">High School</option>
                            <option value="Elementary School">Elementary School</option>
                            <option value="DepEd Division">DepEd Division</option>
                            <option value="Private Institution">Private Institution</option>
                            <option value="Training Center">Training Center</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-2xs font-semibold text-slate-500 mb-1">Account Status</label>
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
                        </select>
                    </div>
                </div>
            </Card>

            <Card className="p-4 border-slate-300 dark:border-slate-800">
                <DataTable
                    ref={tableRef}
                    ajaxUrl={route('platform.organizations.data')}
                    initialFilters={{
                        verification_status: verificationFilter,
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
                                    width="w-56"
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
                                        onClick={() => openOrgDetail(row.ulid)}
                                    >
                                        Inspect Details & Colleges
                                    </DropdownItem>
                                    {!actions?.is_verified ? (
                                        <DropdownItem
                                            icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                                            onClick={() => setVerifyDialogOrg({ ulid: row.ulid, name: row.name })}
                                        >
                                            Verify Institution
                                        </DropdownItem>
                                    ) : (
                                        <DropdownItem
                                            danger
                                            icon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
                                            onClick={() => setRevokeDialogOrg({ ulid: row.ulid, name: row.name })}
                                        >
                                            Revoke Verification
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
                            title: 'Institution Name',
                            render: (val, row) => (
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{val}</span>
                                    <span className="text-3xs text-slate-400 font-mono">ULID: {row.ulid}</span>
                                </div>
                            ),
                        },
                        {
                            data: 'org_type',
                            title: 'Category',
                            render: (val) => (
                                <Badge variant="neutral" size="sm">{val || 'Other'}</Badge>
                            ),
                        },
                        {
                            data: 'contact_person',
                            title: 'Contact Officer',
                            render: (val, row) => (
                                <div className="flex flex-col text-xs">
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{val || 'N/A'}</span>
                                    <span className="text-3xs text-slate-400 font-mono">{row.contact_email}</span>
                                </div>
                            ),
                        },
                        {
                            data: 'verification',
                            title: 'Verification',
                            render: (val) => (
                                <Badge
                                    variant={val.is_verified ? 'success' : val.status === 'rejected' ? 'danger' : 'warning'}
                                    size="sm"
                                >
                                    {val.is_verified ? 'Verified' : val.status === 'rejected' ? 'Revoked' : 'Pending'}
                                </Badge>
                            ),
                        },
                        {
                            data: 'members_count',
                            title: 'Teachers',
                            render: (val) => (
                                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{val}</span>
                            ),
                        },
                        {
                            data: 'departments_count',
                            title: 'Colleges',
                            render: (val) => (
                                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">{val}</span>
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
                title="Create Educational Institution"
                maxWidth="md"
            >
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Institution Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={createForm.name}
                            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            placeholder="e.g. Surigao del Norte State University"
                            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Institution Category
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
                                <option value="Training Center">Training Center</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Organization Owner
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

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Contact Officer Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={createForm.contact_person}
                                onChange={(e) => setCreateForm({ ...createForm, contact_person: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Official Contact Email <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={createForm.contact_email}
                                onChange={(e) => setCreateForm({ ...createForm, contact_email: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Contact Number
                            </label>
                            <input
                                type="text"
                                value={createForm.contact_number}
                                onChange={(e) => setCreateForm({ ...createForm, contact_number: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Physical Address
                            </label>
                            <input
                                type="text"
                                value={createForm.address}
                                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-800 dark:text-slate-200"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={createForm.is_verified}
                                onChange={(e) => setCreateForm({ ...createForm, is_verified: e.target.checked })}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Automatically Grant Official Verified Institutional Status</span>
                        </label>
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
                            {createSubmitting ? 'Creating...' : 'Create Institution'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title="Educational Institution Profile & Academic Structure"
                maxWidth="3xl"
            >
                {detailLoading || !selectedOrg ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                        Loading institution details...
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                        {selectedOrg.tenant.name}
                                    </h3>
                                    <Badge variant="primary" size="sm">
                                        {selectedOrg.tenant.org_type || 'Institution'}
                                    </Badge>
                                    <Badge
                                        variant={selectedOrg.tenant.is_verified_institution ? 'success' : 'warning'}
                                        size="sm"
                                    >
                                        {selectedOrg.tenant.is_verified_institution ? 'Verified School' : 'Pending Verification'}
                                    </Badge>
                                </div>
                                <div className="mt-2 text-2xs text-slate-600 dark:text-slate-300 space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <Mail className="w-3 h-3 text-slate-400" />
                                        <span>Contact Officer: <strong>{selectedOrg.tenant.contact_person}</strong> ({selectedOrg.tenant.contact_email})</span>
                                    </div>
                                    {selectedOrg.tenant.contact_number && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="w-3 h-3 text-slate-400" />
                                            <span>Phone: {selectedOrg.tenant.contact_number}</span>
                                        </div>
                                    )}
                                    {selectedOrg.tenant.address && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3 h-3 text-slate-400" />
                                            <span>Address: {selectedOrg.tenant.address}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-2xs text-slate-500 space-y-1">
                                <div>Account Owner: <strong className="text-slate-700 dark:text-slate-300">{selectedOrg.tenant.owner ? selectedOrg.tenant.owner.name : 'None'}</strong></div>
                                <div>Registered: <strong className="text-slate-700 dark:text-slate-300">{selectedOrg.tenant.created_at}</strong></div>
                                <div>Status: <strong className="text-emerald-600">{selectedOrg.tenant.status}</strong></div>
                            </div>
                        </div>

                        {selectedOrg.subscription && (
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Shared Institutional Quota ({selectedOrg.subscription.plan_name})</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                                        <span className="text-2xs font-semibold text-slate-500 block mb-1">OMR Scans</span>
                                        <span className="text-lg font-bold text-indigo-600">
                                            {selectedOrg.subscription.scans_used} / {selectedOrg.subscription.scans_limit}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                                        <span className="text-2xs font-semibold text-slate-500 block mb-1">Examinations</span>
                                        <span className="text-lg font-bold text-purple-600">
                                            {selectedOrg.subscription.exams_used} / {selectedOrg.subscription.exams_limit}
                                        </span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                                        <span className="text-2xs font-semibold text-slate-500 block mb-1">Teachers Limit</span>
                                        <span className="text-lg font-bold text-emerald-600">
                                            {selectedOrg.members.length} / {selectedOrg.subscription.members_limit}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                                <School className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Academic Departments & Colleges ({selectedOrg.departments.length})</span>
                            </h4>

                            <form onSubmit={handleAddDepartment} className="p-3 mb-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2">
                                <input
                                    type="text"
                                    required
                                    value={deptName}
                                    onChange={(e) => setDeptName(e.target.value)}
                                    placeholder="College or Department Name (e.g. College of Computing)"
                                    className="w-full sm:w-2/3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200"
                                />
                                <input
                                    type="text"
                                    value={deptCode}
                                    onChange={(e) => setDeptCode(e.target.value)}
                                    placeholder="Code (e.g. CCS)"
                                    className="w-full sm:w-1/4 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-800 dark:text-slate-200 uppercase"
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={deptSubmitting}
                                    className="w-full sm:w-auto shrink-0 flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Dept</span>
                                </Button>
                            </form>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {selectedOrg.departments.length === 0 ? (
                                    <div className="col-span-2 p-4 text-center text-xs text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl">
                                        No academic departments established yet.
                                    </div>
                                ) : (
                                    selectedOrg.departments.map((dept) => (
                                        <div key={dept.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{dept.name}</span>
                                                    {dept.code && <Badge variant="neutral" size="sm">{dept.code}</Badge>}
                                                </div>
                                                <p className="text-2xs text-slate-500 mt-0.5">
                                                    Assigned Faculty: {dept.members.length} teachers
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDepartment(dept.id)}
                                                className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                                                title="Delete Department"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Enrolled Teachers & Instructors ({selectedOrg.members.length})</span>
                            </h4>
                            <div className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                                {selectedOrg.members.map((m) => (
                                    <div key={m.id} className="p-2.5 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                                        <div>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">{m.name}</span>
                                            <span className="text-2xs text-slate-400 font-mono">{m.email}</span>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="neutral" size="sm">{m.membership_role}</Badge>
                                            <span className="text-3xs text-slate-400 block mt-0.5">Joined: {m.joined_at}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedOrg.invitations.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Pending Invitations ({selectedOrg.invitations.length})</span>
                                </h4>
                                <div className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                                    {selectedOrg.invitations.map((inv) => (
                                        <div key={inv.id} className="p-2 bg-white dark:bg-slate-900 flex items-center justify-between text-2xs">
                                            <div>
                                                <span className="font-mono text-slate-700 dark:text-slate-300">{inv.email}</span>
                                                <span className="text-slate-400 ml-2">Role: {inv.role}</span>
                                            </div>
                                            <Badge variant={inv.status === 'pending' ? 'warning' : 'neutral'} size="sm">
                                                {inv.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <ConfirmationDialog
                isOpen={verifyDialogOrg !== null}
                onClose={() => setVerifyDialogOrg(null)}
                onConfirm={handleVerify}
                title="Verify Educational Institution"
                message={`Approve and grant verified institutional status to "${verifyDialogOrg?.name}"? This signifies official recognition on the LikhaGrade platform.`}
                confirmText="Approve & Verify"
                variant="primary"
            />

            <ConfirmationDialog
                isOpen={revokeDialogOrg !== null}
                onClose={() => setRevokeDialogOrg(null)}
                onConfirm={handleRevoke}
                title="Revoke Institutional Verification"
                message={`Revoke verified institutional status for "${revokeDialogOrg?.name}"? The organization will revert to pending verification.`}
                confirmText="Revoke Verification"
                variant="danger"
            />
        </PlatformLayout>
    );
}
