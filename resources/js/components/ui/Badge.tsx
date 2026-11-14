import React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
    size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'secondary',
    size = 'md',
    className,
    ...props
}) => {
    const variantStyles: Record<string, string> = {
        primary: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
        secondary: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
        neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-750',
        success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        danger: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
        info: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
        outline: 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300',
    };

    const sizeStyles: Record<string, string> = {
        xs: 'px-1.5 py-0.5 text-3xs font-medium',
        sm: 'px-2.5 py-0.5 text-2xs font-semibold',
        md: 'px-3 py-1 text-xs font-semibold',
        lg: 'px-3.5 py-1.5 text-sm font-semibold',
    };

    const resolvedVariant = variantStyles[variant] || variantStyles.secondary;
    const resolvedSize = sizeStyles[size] || sizeStyles.md;

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full leading-none',
                resolvedVariant,
                resolvedSize,
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};

