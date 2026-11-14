import React from 'react';
import { cn } from '@/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    headerAction?: React.ReactNode;
    footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
    title,
    description,
    headerAction,
    footer,
    children,
    className,
    ...props
}) => {
    const hasHeader = Boolean(title || description || headerAction);
    const hasCustomPadding = Boolean(className && /\bp(-[xytrbl])?-/.test(className));

    return (
        <div
            className={cn(
                'rounded-2xl border border-slate-300 bg-white shadow-xs dark:border-slate-700/80 dark:bg-slate-900 overflow-hidden',
                !hasHeader && !hasCustomPadding && 'p-5',
                className
            )}
            {...props}
        >
            {hasHeader && (
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700/80">
                    <div>
                        {title && <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>}
                        {description && (
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
                        )}
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            {hasHeader ? <div className="p-5">{children}</div> : children}
            {footer && (
                <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/50">
                    {footer}
                </div>
            )}
        </div>
    );
};

