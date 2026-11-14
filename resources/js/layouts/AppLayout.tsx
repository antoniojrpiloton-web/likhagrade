import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    GraduationCap,
    LayoutDashboard,
    Building2,
    User as UserIcon,
    LogOut,
    Sun,
    Moon,
    Laptop,
    Menu,
    X,
    ChevronDown,
    ShieldCheck,
    Check,
    FileText,
    Camera,
    Users,
    BookOpen,
    Search,
    Bell,
    MessageSquare,
    Bot,
    Plus,
    Calendar,
    Settings,
    Layers,
    DollarSign,
    Clock,
    BookMarked,
    CheckCircle2,
    Sparkles,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { ToastNotification } from '@/components/ui/ToastNotification';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/cn';
import type { SharedProps } from '@/types';

export const AppLayout: React.FC<{ children: React.ReactNode; title?: string }> = ({
    children,
    title,
}) => {
    const { auth, flash, appName } = usePage<SharedProps>().props;
    const { theme, setTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const user = auth.user;
    const currentTenant = auth.tenant;
    const userTenants = auth.user_tenants || [];

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    const handleSwitchTenant = (tenantId: number) => {
        router.post(route('app.tenant.switch'), { tenant_id: tenantId });
    };

    const navItems = [
        {
            name: 'Dashboard',
            href: route('app.dashboard'),
            icon: LayoutDashboard,
            active: route().current('app.dashboard'),
            badge: null,
        },
        {
            name: 'Workspace',
            href: route('app.workspace'),
            icon: Building2,
            active: route().current('app.workspace*'),
            badge: currentTenant?.type === 'organization' ? 'Org' : 'Solo',
        },
        {
            name: 'Account & Settings',
            href: route('app.profile'),
            icon: UserIcon,
            active: route().current('app.profile*'),
            badge: null,
        },
    ];

    const examTools = [
        { name: 'Exams & Quizzes', icon: FileText, href: route('app.exams'), active: route().current('app.exams*') },
        { name: 'Scan Answers', icon: Camera, href: '#', badge: 'Soon', disabled: true },
        { name: 'Results & Reports', icon: Sparkles, href: '#', badge: 'Soon', disabled: true },
    ];

    const academicTools = [
        { name: 'Classes', icon: BookOpen, href: route('app.classes'), active: route().current('app.classes*') },
        { name: 'Students', icon: Users, href: route('app.students'), active: route().current('app.students*') },
        { name: 'Academic Setup', icon: Layers, href: route('app.academic-setup'), active: route().current('app.academic-setup*'), badge: 'Optional' },
    ];

    return (
        <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-150">
            {auth.impersonator && (
                <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-slate-950 px-4 py-2 flex items-center justify-between shadow-md text-xs font-semibold">
                    <div className="flex items-center gap-2">
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
                    'fixed inset-y-0 left-0 z-50 w-64 h-screen border-r border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 shrink-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="shrink-0 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex h-16 items-center justify-between px-5">
                        <Link href={route('app.dashboard')} className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                                        Likha<span className="text-blue-600 dark:text-blue-400">Grade</span>
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 leading-none">
                                        App
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                                    OMR Exam & Test Checker
                                </p>
                            </div>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="px-3 pb-3">
                        <Dropdown
                            width="w-72"
                            trigger={
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between gap-2.5 rounded-xl bg-slate-900 text-white p-3 shadow-md hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer text-left"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="h-8 w-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
                                            <Building2 className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-white truncate">
                                                {currentTenant ? currentTenant.name : 'LikhaGrade Workspace'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                                {currentTenant?.type === 'organization' ? (currentTenant.org_type || 'Institution') : 'Personal Workspace'}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                </button>
                            }
                        >
                            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    Switch Workspaces
                                </p>
                            </div>
                            <div className="py-1 max-h-56 overflow-y-auto">
                                {userTenants.map((t) => (
                                    <DropdownItem
                                        key={t.id}
                                        onClick={() => handleSwitchTenant(t.id)}
                                        icon={<Building2 className="w-4 h-4 text-slate-400" />}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="truncate pr-2">
                                                <p className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                                                    {t.name}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {t.type === 'organization' ? (t.org_type || 'Organization') : 'Personal Workspace'} • {t.role || 'Member'}
                                                </p>
                                            </div>
                                            {currentTenant && t.id === currentTenant.id && (
                                                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                                            )}
                                        </div>
                                    </DropdownItem>
                                ))}
                            </div>
                            <div className="p-2 border-t border-slate-200 dark:border-slate-800">
                                <Link
                                    href={route('organization.register')}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Register New Institution
                                </Link>
                            </div>
                        </Dropdown>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                    <div>
                        <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Overview
                        </p>
                        <div className="space-y-0.5">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                                            item.active
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Icon className={cn('w-4 h-4 shrink-0', item.active ? 'text-white' : 'text-slate-400')} />
                                            <span>{item.name}</span>
                                        </div>
                                        {item.badge && (
                                            <span className={cn(
                                                'text-[10px] px-1.5 py-0.5 rounded font-bold uppercase',
                                                item.active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                            )}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Examinations & Scanning
                        </p>
                        <div className="space-y-0.5">
                            {examTools.map((mod) => {
                                const Icon = mod.icon;
                                if (mod.disabled) {
                                    return (
                                        <div
                                            key={mod.name}
                                            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed select-none opacity-80"
                                            title="Coming Soon"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-600" />
                                                <span>{mod.name}</span>
                                            </div>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                {mod.badge}
                                            </span>
                                        </div>
                                    );
                                }
                                return (
                                    <Link
                                        key={mod.name}
                                        href={mod.href}
                                        className={cn(
                                            'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                                            mod.active
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Icon className={cn('w-4 h-4 shrink-0', mod.active ? 'text-white' : 'text-slate-400')} />
                                            <span>{mod.name}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Academic Management
                        </p>
                        <div className="space-y-0.5">
                            {academicTools.map((mod) => {
                                const Icon = mod.icon;
                                return (
                                    <Link
                                        key={mod.name}
                                        href={mod.href}
                                        className={cn(
                                            'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                                            mod.active
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200'
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Icon className={cn('w-4 h-4 shrink-0', mod.active ? 'text-white' : 'text-slate-400')} />
                                            <span>{mod.name}</span>
                                        </div>
                                        {mod.badge && (
                                            <span className={cn(
                                                'text-[10px] px-1.5 py-0.5 rounded font-bold uppercase',
                                                mod.active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                            )}>
                                                {mod.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </nav>

                <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
                    {user?.is_superadmin && (
                        <Link
                            href={route('platform.dashboard')}
                            className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-300 transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                SuperAdmin Console
                            </span>
                            <span className="text-[10px] font-bold bg-indigo-200 dark:bg-indigo-800 px-1.5 py-0.5 rounded">
                                Admin
                            </span>
                        </Link>
                    )}

                    <div className="rounded-xl p-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
                        <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                                <Bot className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                    Likha Assistant
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                    Fast exam scoring help
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            
            <div className="flex-1 flex flex-col min-w-0">
                
                <header className="h-16 border-b border-slate-300 bg-white px-4 sm:px-6 flex items-center justify-between dark:border-slate-800 dark:bg-slate-900 shrink-0 gap-4">
                    <div className="flex items-center gap-3 flex-1 max-w-2xl">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        
                        <div className="relative w-full max-w-md hidden sm:block">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search students, classes, examinations, resources..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-12 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 hover:bg-white focus:bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs"
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600">
                                ⌘ K
                            </div>
                        </div>
                    </div>

                    
                    <div className="flex items-center gap-3">
                        
                        <button
                            type="button"
                            className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                                6
                            </span>
                        </button>

                        
                        <button
                            type="button"
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            <MessageSquare className="w-4 h-4" />
                        </button>

                        
                        <button
                            type="button"
                            onClick={cycleTheme}
                            title={`Current theme: ${theme}. Click to switch.`}
                            className="p-2 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                            {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
                            {theme === 'dark' && <Moon className="w-4 h-4 text-blue-400" />}
                            {theme === 'system' && <Laptop className="w-4 h-4 text-slate-500" />}
                        </button>

                        
                        <Dropdown
                            width="w-60"
                            trigger={
                                <button
                                    type="button"
                                    className="flex items-center gap-2.5 p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer shadow-2xs"
                                >
                                    <Avatar name={user?.name} size="sm" />
                                    <div className="hidden sm:block text-left pr-1">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                            {user?.name || 'Instructor'}
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                            {currentTenant?.role || (user?.is_superadmin ? 'SuperAdmin' : 'Teacher')}
                                        </p>
                                    </div>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                                </button>
                            }
                        >
                            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {user?.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {user?.email}
                                </p>
                            </div>
                            <DropdownItem
                                onClick={() => router.visit(route('app.profile'))}
                                icon={<UserIcon className="w-4 h-4" />}
                            >
                                Profile Settings
                            </DropdownItem>
                            <DropdownItem
                                onClick={() => router.visit(route('app.workspace'))}
                                icon={<Building2 className="w-4 h-4" />}
                            >
                                Workspace Settings
                            </DropdownItem>
                            <DropdownItem
                                danger
                                onClick={() => router.post(route('logout'))}
                                icon={<LogOut className="w-4 h-4 text-red-500" />}
                            >
                                Sign Out
                            </DropdownItem>
                        </Dropdown>
                    </div>
                </header>

                
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
                    
                    {flash.success && (
                        <div className="mb-6">
                            <ToastNotification type="success" message={flash.success} />
                        </div>
                    )}
                    {flash.error && (
                        <div className="mb-6">
                            <ToastNotification type="error" message={flash.error} />
                        </div>
                    )}
                    {flash.info && (
                        <div className="mb-6">
                            <ToastNotification type="info" message={flash.info} />
                        </div>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
};
