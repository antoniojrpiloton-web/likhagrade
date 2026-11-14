import React from 'react';
import { cn } from '@/utils/cn';

export interface PageHeaderProps {
    title: string;
    description?: string;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    badge,
    actions,
    className,
}) => {
    return (
        <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6', className)}>
            <div>
                <div className="flex items-center gap-2.5">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                        {title}
                    </h1>
                    {badge}
                </div>
                {description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                        {description}
                    </p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
        </div>
    );
};

