import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    ShieldCheck,
    LayoutDashboard,
    Users,
    Building2,
    School,
    CreditCard,
    Activity,
    Cpu,
    Settings,
    LogOut,
    Sun,
    Moon,
    Laptop,
    Menu,
    X,
    ExternalLink,
    AlertTriangle,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { ToastNotification } from '@/components/ui/ToastNotification';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/cn';
import type { SharedProps } from '@/types';

export const PlatformLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({
    children,
    title,
}) => {
    const { auth, flash } = usePage<SharedProps>().props;
    const { theme, setTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const user = auth.user;

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    const navItems = [
        {
            name: 'Dashboard',
            href: route('platform.dashboard'),
            icon: LayoutDashboard,
            active: route().current('platform.dashboard'),
        },
        {
            name: 'Users',
            href: route('platform.users'),
            icon: Users,
            active: route().current('platform.users*'),
        },
        {
            name: 'Tenants',
            href: route('platform.tenants'),
            icon: Building2,
            active: route().current('platform.tenants*'),
        },
        {
            name: 'Organizations',
            href: route('platform.organizations'),
            icon: School,
            active: route().current('platform.organizations*'),
        },
        {
            name: 'Subscriptions',
            href: route('platform.subscriptions'),
            icon: CreditCard,
            active: route().current('platform.subscriptions*'),
        },
        {
            name: 'Activity Logs',
            href: route('platform.activity-logs'),
            icon: Activity,
            active: route().current('platform.activity-logs*'),
        },
        {
            name: 'System Health',
            href: route('platform.monitoring'),
            icon: Cpu,
            active: route().current('platform.monitoring*'),
        },
        {
            name: 'Platform Settings',
            href: route('platform.settings'),
            icon: Settings,
            active: route().current('platform.settings*'),
        },
    ];

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-150">
            {auth.impersonator && (
                <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-slate-950 px-4 py-2 flex items-center justify-between shadow-md text-xs font-semibold">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Impersonating user {user?.name} (Authorized by {auth.impersonator.name})</span>
                    </div>
                    <button
                        onClick={() => router.post(route('platform.impersonate.leave'))}
                        className="px-2.5 py-1 rounded bg-slate-950 text-white text-2xs hover:bg-slate-800 transition-colors"
                    >
                        Exit Impersonation
                    </button>
                </div>
            )}

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 h-screen border-r border-slate-800 bg-slate-900 text-white flex flex-col justify-between overflow-hidden transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 shrink-0',
                    auth.impersonator ? 'pt-10' : '',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800 shrink-0">
                    <Link href={route('platform.dashboard')} className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-extrabold tracking-tight text-white leading-tight">
                                    Likha<span className="text-indigo-400">Grade</span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 leading-none">
                                    Admin
                                </span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                                SuperAdmin Console
                            </p>
                        </div>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    <p className="px-3 pb-2 text-2xs font-semibold uppercase tracking-wider text-slate-400">
                        SuperAdmin Controls
                    </p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                                    item.active
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                )}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-3 shrink-0">
                    <Link
                        href={route('app.dashboard')}
                        className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                    >
                        <span className="flex items-center gap-2">
                            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Exit to Workspace</span>
                        </span>
                        <span className="text-2xs text-slate-400">App</span>
                    </Link>

                    <div className="flex items-center gap-3 pt-2">
                        <Avatar name={user?.name || 'Admin'} src={undefined} size="sm" />
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-semibold text-white truncate">{user?.name}</span>
                            <span className="text-2xs text-indigo-400 font-mono truncate">SuperAdmin</span>
                        </div>
                    </div>
                </div>
            </aside>

            <div className={cn('flex-1 flex flex-col min-w-0', auth.impersonator ? 'pt-10' : '')}>
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-6 border-b border-slate-300 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs shadow-xs">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{title || 'SuperAdmin Platform'}</span>
                                <Badge variant="info" size="sm">Platform-Wide</Badge>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={cycleTheme}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-300 dark:border-slate-700"
                        >
                            {theme === 'light' && <Sun className="w-4 h-4" />}
                            {theme === 'dark' && <Moon className="w-4 h-4" />}
                            {theme === 'system' && <Laptop className="w-4 h-4" />}
                        </button>

                        <Dropdown
                            trigger={
                                <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <Avatar name={user?.name || 'Admin'} src={undefined} size="sm" />
                                </button>
                            }
                        >
                            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                                <p className="text-2xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                            </div>
                            <DropdownItem
                                icon={<ExternalLink className="w-4 h-4" />}
                                onClick={() => router.visit(route('app.dashboard'))}
                            >
                                Tenant Application
                            </DropdownItem>
                            <DropdownItem
                                icon={<LogOut className="w-4 h-4 text-rose-500" />}
                                onClick={() => router.post(route('logout'))}
                                danger
                            >
                                Sign Out
                            </DropdownItem>
                        </Dropdown>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <ToastNotification message={flash.success} type="success" />
                    <ToastNotification message={flash.error} type="error" />
                    {children}
                </main>
            </div>
        </div>
    );
};
