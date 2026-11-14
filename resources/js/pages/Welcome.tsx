import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    GraduationCap,
    CheckCircle,
    Shield,
    Camera,
    FileCheck,
    BarChart3,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTheme } from '@/hooks/useTheme';
import type { SharedProps } from '@/types';

export default function Welcome() {
    const { auth } = usePage<SharedProps>().props;
    const { theme } = useTheme();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
            <Head title="LikhaGrade — Modern OMR SaaS Examination Checking Platform" />

            {/* Navigation Header */}
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                            Likha<span className="text-blue-600 dark:text-blue-400">Grade</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <Link href={auth.user.is_superadmin ? route('platform.dashboard') : route('app.dashboard')}>
                                <Button size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                                    Go to {auth.user.is_superadmin ? 'Platform Admin' : 'Dashboard'}
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')}>
                                    <Button variant="ghost" size="sm">
                                        Sign In
                                    </Button>
                                </Link>
                                <Link href={route('register')}>
                                    <Button size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                                        Get Started
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50/80 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-semibold mb-6">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>OMR SaaS Examination Checking Platform</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 max-w-3xl mx-auto leading-tight">
                        Optical mark recognition made <span className="text-blue-600 dark:text-blue-400">effortless</span> for modern educators.
                    </h1>

                    <p className="mt-5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Autonomous multi-tenant workspace platform designed for independent instructors and academic institutions. Open registration for teachers worldwide with zero domain barriers.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                        <Link href={route('register')}>
                            <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
                                Create Your Free Teacher Workspace
                            </Button>
                        </Link>
                        <Link href={route('login')}>
                            <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                Existing Teacher Sign In
                            </Button>
                        </Link>
                    </div>

                    {/* Value Pillars */}
                    <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 mb-4">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Isolated Workspaces
                            </h3>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Complete multi-tenant data isolation. Each teacher receives an independent personal workspace with granular role-based authorization.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 mb-4">
                                <FileCheck className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                Open Registration
                            </h3>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Register with any valid email address. No institutional email or school domain restrictions required to start organizing exams.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 mb-4">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                High-Speed Analytics
                            </h3>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Enterprise-grade DataTables infrastructure, comprehensive audit logging, and ready-to-scale database architecture.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                &copy; {new Date().getFullYear()} LikhaGrade OMR SaaS Platform. Phase 1 Foundation & Core Architecture.
            </footer>
        </div>
    );
}

