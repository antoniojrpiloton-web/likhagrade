import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { GraduationCap, Sun, Moon, Laptop } from 'lucide-react';
import { ToastNotification } from '@/components/ui/ToastNotification';
import { useTheme } from '@/hooks/useTheme';
import type { SharedProps } from '@/types';

export const GuestLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { flash } = usePage<SharedProps>().props;
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    return (
        <div className="min-h-screen flex flex-col justify-between bg-slate-100 dark:bg-slate-950 transition-colors duration-150">
            <div className="w-full px-6 py-4 flex items-center justify-between">
                <Link href={route('home')} className="flex items-center gap-2.5 group">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm group-hover:bg-blue-700 transition-colors">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Likha<span className="text-blue-600 dark:text-blue-400">Grade</span>
                    </span>
                </Link>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={cycleTheme}
                        title={`Current theme: ${theme}. Click to switch.`}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                        {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
                        {theme === 'dark' && <Moon className="w-4 h-4 text-blue-400" />}
                        {theme === 'system' && <Laptop className="w-4 h-4 text-slate-500" />}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8">
                {flash.success && (
                    <div className="w-full max-w-md mb-4">
                        <ToastNotification type="success" message={flash.success} />
                    </div>
                )}
                {flash.error && (
                    <div className="w-full max-w-md mb-4">
                        <ToastNotification type="error" message={flash.error} />
                    </div>
                )}

                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>

            <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-600">
                &copy; {new Date().getFullYear()} LikhaGrade OMR SaaS Platform. All rights reserved.
            </div>
        </div>
    );
};
