import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Building2,
    Users,
    Shield,
    Save,
    Key,
    Activity,
    Mail,
    Plus,
    School,
    CheckCircle2,
    Copy,
    Check,
    CreditCard,
    Layers,
    Trash2,
    UserPlus,
} from 'lucide-react';
import { AppLayout } from '@/layouts/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn } from '@/types';

interface MemberItem {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    joined_at: string | null;
    is_owner: boolean;
}

interface DepartmentItem {
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    head_name: string | null;
    member_count: number;
}

interface InvitationItem {
    id: number;
    email: string;
    role: string;
    department_name: string | null;
    inviter_name: string | null;
    invite_url: string;
    expires_at: string;
}

interface SubscriptionInfo {
    plan_name: string;
    billing_cycle: string;
    status: string;
    scans_used: number;
    scans_limit: number;
    exams_used: number;
    exams_limit: number;
    members_limit: number;
    starts_at: string | null;
}

interface WorkspaceProps {
    workspace: {
        id: number;
        ulid: string;
        name: string;
        slug: string;
        type: string;
        org_type?: string | null;
        contact_person?: string | null;
        contact_email?: string | null;
        contact_number?: string | null;
        address?: string | null;
        is_verified_institution?: boolean;
        status: string;
        is_owner: boolean;
        role: string;
    } | null;
    members: MemberItem[];
    departments: DepartmentItem[];
    invitations: InvitationItem[];
    subscription: SubscriptionInfo | null;
}

export default function Workspace({
    workspace,
    members,
    departments,
    invitations,
    subscription,
}: WorkspaceProps) {
    if (!workspace) {
        return null;
    }

    const [activeTab, setActiveTab] = useState('settings');
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showDeptModal, setShowDeptModal] = useState(false);

    const { data: settingsData, setData: setSettingsData, patch, processing: savingSettings, errors: settingsErrors } = useForm({
        name: workspace.name,
        org_type: workspace.org_type || '',
        contact_person: workspace.contact_person || '',
        contact_email: workspace.contact_email || '',
        contact_number: workspace.contact_number || '',
        address: workspace.address || '',
    });

    const { data: inviteData, setData: setInviteData, post: postInvite, processing: inviting, errors: inviteErrors, reset: resetInvite } = useForm({
        email: '',
        role: 'Teacher',
        department_id: '',
    });

    const { data: deptData, setData: setDeptData, post: postDept, processing: creatingDept, errors: deptErrors, reset: resetDept } = useForm({
        name: '',
        code: '',
        description: '',
    });

    const submitSettings = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('app.workspace.update'));
    };

    const submitInvite = (e: React.FormEvent) => {
        e.preventDefault();
        postInvite(route('app.organization.invite'), {
            onSuccess: () => {
                setShowInviteModal(false);
                resetInvite();
            },
        });
    };

    const submitDept = (e: React.FormEvent) => {
        e.preventDefault();
        postDept(route('app.departments.store'), {
            onSuccess: () => {
                setShowDeptModal(false);
                resetDept();
            },
        });
    };

    const copyToClipboard = (url: string, id: string) => {
        navigator.clipboard.writeText(url);
        setCopiedToken(id);
        setTimeout(() => setCopiedToken(null), 2500);
    };

    const auditColumns: DataTableColumn[] = [
        { data: 'id', title: 'ID', orderable: true },
        {
            data: 'action',
            title: 'Action',
            orderable: true,
            render: (val, row) => (
                <span className="font-mono text-2xs font-semibold text-blue-600 dark:text-blue-400">
                    {val || row?.action}
                </span>
            ),
        },
        { data: 'description', title: 'Description', orderable: false },
        {
            data: 'user',
            title: 'User',
            orderable: false,
            render: (val, row) => <span>{val?.name || row?.user?.name || 'System'}</span>,
        },
        { data: 'ip_address', title: 'IP Address', orderable: false },
        { data: 'created_at', title: 'Timestamp', orderable: true },
    ];

    const isOrg = workspace.type === 'organization';

    const tabs = [
        { id: 'settings', label: 'General Settings', icon: <Building2 className="w-4 h-4" /> },
        { id: 'members', label: 'Members & Faculty', icon: <Users className="w-4 h-4" />, count: members.length },
        ...(isOrg ? [{ id: 'departments', label: 'Departments & Colleges', icon: <Layers className="w-4 h-4" />, count: departments.length }] : []),
        { id: 'subscription', label: 'Subscription & Quotas', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'activity', label: 'Activity Logs', icon: <Activity className="w-4 h-4" /> },
    ];

    return (
        <AppLayout title="Workspace Settings">
            <Head title={`${workspace.name} — Settings`} />

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            {workspace.name}
                        </h1>
                        <Badge variant={workspace.status === 'active' ? 'success' : 'danger'} size="sm">
                            {workspace.status}
                        </Badge>
                        {workspace.is_verified_institution && (
                            <Badge variant="primary" size="sm">
                                Verified Institution
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Public ULID: <span className="font-mono text-slate-700 dark:text-slate-300">{workspace.ulid}</span> • Type: <span className="capitalize">{workspace.type}</span>
                    </p>
                </div>

                {isOrg && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<UserPlus className="w-4 h-4" />}
                            onClick={() => setShowInviteModal(true)}
                        >
                            Invite Teacher
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Plus className="w-4 h-4" />}
                            onClick={() => setShowDeptModal(true)}
                        >
                            New Department
                        </Button>
                    </div>
                )}
            </div>

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

            {}
            {activeTab === 'settings' && (
                <div className="max-w-3xl">
                    <Card
                        title="Workspace Details"
                        description="Update your workspace profile, institutional classification, and contact info"
                    >
                        <form onSubmit={submitSettings} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Input
                                        label="Workspace Name"
                                        required
                                        value={settingsData.name}
                                        onChange={(e) => setSettingsData('name', e.target.value)}
                                        error={settingsErrors.name}
                                    />
                                </div>

                                {isOrg && (
                                    <>
                                        <div>
                                            <Input
                                                label="Institution Type"
                                                value={settingsData.org_type}
                                                onChange={(e) => setSettingsData('org_type', e.target.value)}
                                                error={settingsErrors.org_type}
                                                placeholder="e.g. University, High School"
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Contact Person"
                                                value={settingsData.contact_person}
                                                onChange={(e) => setSettingsData('contact_person', e.target.value)}
                                                error={settingsErrors.contact_person}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Contact Email"
                                                type="email"
                                                value={settingsData.contact_email}
                                                onChange={(e) => setSettingsData('contact_email', e.target.value)}
                                                error={settingsErrors.contact_email}
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                label="Contact Number"
                                                value={settingsData.contact_number}
                                                onChange={(e) => setSettingsData('contact_number', e.target.value)}
                                                error={settingsErrors.contact_number}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <Input
                                                label="Campus Address"
                                                value={settingsData.address}
                                                onChange={(e) => setSettingsData('address', e.target.value)}
                                                error={settingsErrors.address}
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Workspace Slug
                                    </label>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                        {workspace.slug}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Tenant Type
                                    </label>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs capitalize text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                        {workspace.type} Workspace
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button
                                    type="submit"
                                    isLoading={savingSettings}
                                    leftIcon={<Save className="w-4 h-4" />}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {}
            {activeTab === 'members' && (
                <div className="space-y-6">
                    <Card
                        title="Active Workspace Members"
                        description="People who have access to this workspace and their assigned roles"
                        headerAction={
                            isOrg ? (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    leftIcon={<UserPlus className="w-4 h-4" />}
                                    onClick={() => setShowInviteModal(true)}
                                >
                                    Invite Teacher
                                </Button>
                            ) : null
                        }
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-slate-200 bg-slate-50 text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3">Member</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Joined Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {members.map((member) => (
                                        <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                                {member.name}
                                                {member.is_owner && (
                                                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-3xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                        Owner
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                {member.email}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="primary" size="sm">
                                                    {member.role}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={member.status === 'active' ? 'success' : 'secondary'}
                                                    size="sm"
                                                >
                                                    {member.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                                {member.joined_at || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {}
                    {isOrg && (
                        <Card
                            title="Pending Invitations"
                            description="Invitations sent to teachers and instructors awaiting acceptance"
                        >
                            {invitations.length === 0 ? (
                                <p className="text-xs text-slate-400 py-4 text-center">
                                    No pending invitations. Click &quot;Invite Teacher&quot; above to invite colleagues.
                                </p>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {invitations.map((inv) => (
                                        <div key={inv.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                        {inv.email}
                                                    </span>
                                                    <Badge variant="secondary" size="sm">
                                                        {inv.role}
                                                    </Badge>
                                                    {inv.department_name && (
                                                        <span className="text-[11px] text-slate-500">
                                                            • Dept: {inv.department_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Invited by {inv.inviter_name || 'Admin'} • Expires on {inv.expires_at}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="xs"
                                                    leftIcon={copiedToken === String(inv.id) ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                    onClick={() => copyToClipboard(inv.invite_url, String(inv.id))}
                                                >
                                                    {copiedToken === String(inv.id) ? 'Copied' : 'Copy Invite Link'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            )}

            {}
            {isOrg && activeTab === 'departments' && (
                <div className="space-y-6">
                    <Card
                        title="Institutional Departments & Colleges"
                        description="Group faculty and assessments by colleges or academic divisions (e.g. College of Computing)"
                        headerAction={
                            <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<Plus className="w-4 h-4" />}
                                onClick={() => setShowDeptModal(true)}
                            >
                                Add Department
                            </Button>
                        }
                    >
                        {departments.length === 0 ? (
                            <div className="py-8 text-center">
                                <School className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    No departments created yet
                                </p>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                                    Create academic departments or colleges to organize teachers, exams, and reports.
                                </p>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    leftIcon={<Plus className="w-4 h-4" />}
                                    onClick={() => setShowDeptModal(true)}
                                >
                                    Create Department
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {departments.map((dept) => (
                                    <div
                                        key={dept.id}
                                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {dept.name}
                                                </h4>
                                                {dept.code && (
                                                    <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded">
                                                        {dept.code}
                                                    </span>
                                                )}
                                            </div>
                                            {dept.description && (
                                                <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                                                    {dept.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                                            <span>
                                                Faculty:{' '}
                                                <strong className="text-slate-800 dark:text-slate-200">
                                                    {dept.member_count} members
                                                </strong>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (confirm(`Remove department ${dept.name}?`)) {
                                                        router.delete(route('app.departments.destroy', dept.id));
                                                    }
                                                }}
                                                className="text-rose-500 hover:text-rose-700 p-1"
                                                title="Delete Department"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {}
            {activeTab === 'subscription' && (
                <div className="max-w-3xl space-y-6">
                    <Card
                        title="Subscription & Plan Allocation"
                        description="Shared institutional quota and usage limits assigned to this workspace"
                    >
                        {subscription ? (
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                                                Current Plan
                                            </span>
                                            <h3 className="text-2xl font-black">{subscription.plan_name}</h3>
                                            <p className="text-xs text-blue-100 mt-0.5">
                                                Billing cycle: <span className="capitalize">{subscription.billing_cycle}</span> • Status: <span className="capitalize font-semibold">{subscription.status}</span>
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase backdrop-blur-xs">
                                            {subscription.status}
                                        </span>
                                    </div>
                                </div>

                                {}
                                <div className="space-y-4">
                                    {}
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold mb-1">
                                            <span className="text-slate-700 dark:text-slate-300">OMR Camera Scans Quota</span>
                                            <span className="text-slate-900 dark:text-white">
                                                {subscription.scans_used.toLocaleString()} / {subscription.scans_limit.toLocaleString()} scans
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                style={{
                                                    width: `${Math.min(100, Math.round((subscription.scans_used / subscription.scans_limit) * 100))}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {}
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold mb-1">
                                            <span className="text-slate-700 dark:text-slate-300">Exams / Assessments Created</span>
                                            <span className="text-slate-900 dark:text-white">
                                                {subscription.exams_used.toLocaleString()} / {subscription.exams_limit.toLocaleString()} exams
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-emerald-600 h-2.5 rounded-full"
                                                style={{
                                                    width: `${Math.min(100, Math.round((subscription.exams_used / subscription.exams_limit) * 100))}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {}
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold mb-1">
                                            <span className="text-slate-700 dark:text-slate-300">Faculty Seats Limit</span>
                                            <span className="text-slate-900 dark:text-white">
                                                {members.length} / {subscription.members_limit} members
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-purple-600 h-2.5 rounded-full"
                                                style={{
                                                    width: `${Math.min(100, Math.round((members.length / subscription.members_limit) * 100))}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400">No active subscription found.</p>
                        )}
                    </Card>
                </div>
            )}

            {}
            {activeTab === 'activity' && (
                <div>
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            Workspace Audit Trail
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Server-side paginated activity events filtered specifically to this workspace.
                        </p>
                    </div>
                    <DataTable
                        endpoint={route('app.workspace.activity-logs.data')}
                        columns={auditColumns}
                        showDateFilter
                        searchPlaceholder="Search workspace logs..."
                    />
                </div>
            )}

            {}
            <Modal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                title="Invite Teacher to Organization"
            >
                <form onSubmit={submitInvite} className="space-y-4">
                    <p className="text-xs text-slate-500">
                        Enter any valid email address. The teacher will receive a secure invitation link to join this organization without paying separately.
                    </p>

                    <Input
                        label="Teacher Email Address"
                        type="email"
                        required
                        placeholder="teacher@gmail.com"
                        value={inviteData.email}
                        onChange={(e) => setInviteData('email', e.target.value)}
                        error={inviteErrors.email}
                    />

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Organizational Role
                        </label>
                        <select
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                            value={inviteData.role}
                            onChange={(e) => setInviteData('role', e.target.value)}
                        >
                            <option value="Teacher">Teacher</option>
                            <option value="Instructor">Instructor</option>
                            <option value="Department Admin">Department Admin</option>
                            <option value="Organization Admin">Organization Admin</option>
                        </select>
                        {inviteErrors.role && <p className="mt-1 text-xs text-rose-600">{inviteErrors.role}</p>}
                    </div>

                    {departments.length > 0 && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Assign to Department (Optional)
                            </label>
                            <select
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                                value={inviteData.department_id}
                                onChange={(e) => setInviteData('department_id', e.target.value)}
                            >
                                <option value="">None (General Faculty)</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} {d.code ? `(${d.code})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="pt-2 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowInviteModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={inviting}
                        >
                            Generate & Send Invitation
                        </Button>
                    </div>
                </form>
            </Modal>

            {}
            <Modal
                isOpen={showDeptModal}
                onClose={() => setShowDeptModal(false)}
                title="Create Department or College"
            >
                <form onSubmit={submitDept} className="space-y-4">
                    <Input
                        label="Department Name"
                        required
                        placeholder="e.g. College of Computing"
                        value={deptData.name}
                        onChange={(e) => setDeptData('name', e.target.value)}
                        error={deptErrors.name}
                    />

                    <Input
                        label="Department Code / Abbreviation"
                        placeholder="e.g. CC"
                        value={deptData.code}
                        onChange={(e) => setDeptData('code', e.target.value)}
                        error={deptErrors.code}
                    />

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Brief description of this college/department..."
                            value={deptData.description}
                            onChange={(e) => setDeptData('description', e.target.value)}
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowDeptModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={creatingDept}
                        >
                            Save Department
                        </Button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
