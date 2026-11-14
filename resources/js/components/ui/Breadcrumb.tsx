import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

export interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
    return (
        <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-slate-500 dark:text-slate-400 mb-2', className)}>
            <ol className="flex items-center space-x-1.5">
                <li>
                    <Link
                        href={route('app.dashboard')}
                        className="flex items-center hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                        <Home className="w-3.5 h-3.5" />
                    </Link>
                </li>
                {items.map((item, idx) => {
                    const isLast = idx === items.length - 1;
                    return (
                        <li key={idx} className="flex items-center space-x-1.5">
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                            {item.href && !isLast ? (
                                <Link
                                    href={item.href}
                                    className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className={cn('font-medium', isLast && 'text-slate-800 dark:text-slate-200')}>
                                    {item.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

