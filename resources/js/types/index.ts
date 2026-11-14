export type Theme = 'light' | 'dark' | 'system';

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    email_verified_at: string | null;
    is_verified: boolean;
    theme_preference: Theme;
    is_superadmin: boolean;
}

export interface TenantSubscription {
    plan_name: string;
    status: string;
    scans_used: number;
    scans_limit: number;
    exams_used: number;
    exams_limit: number;
    members_limit: number;
}

export interface DepartmentSummary {
    id: number;
    name: string;
    code: string | null;
}

export interface Tenant {
    id: number;
    ulid: string;
    name: string;
    slug: string;
    type: 'personal' | 'organization';
    org_type?: string | null;
    is_verified_institution?: boolean;
    verification_status?: 'pending' | 'verified' | 'rejected';
    status: 'active' | 'suspended' | 'inactive';
    role?: string;
    is_owner?: boolean;
    is_current?: boolean;
    subscription?: TenantSubscription | null;
    departments?: DepartmentSummary[];
}

export interface SharedProps {
    appName: string;
    auth: {
        user: User | null;
        tenant: Tenant | null;
        user_tenants: Tenant[];
        impersonator?: { id: number; name: string } | null;
    };
    flash: {
        success?: string | null;
        error?: string | null;
        info?: string | null;
    };
    errors: Record<string, string>;
}

export interface DataTableColumn<T = any> {
    data: string;
    title: string;
    className?: string;
    orderable?: boolean;
    searchable?: boolean;
    render?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableResponse<T = any> {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: T[];
}

export interface DataTableRef {
    reload: () => void;
    setFilters: (filters: Record<string, any>) => void;
}

