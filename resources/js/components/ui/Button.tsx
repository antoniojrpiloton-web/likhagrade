import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            disabled = false,
            leftIcon,
            rightIcon,
            children,
            ...props
        },
        ref
    ) => {
        const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

        const sizeStyles: Record<string, string> = {
            xs: 'px-3 py-1.5 text-xs gap-1.5 leading-tight',
            sm: 'px-3.5 py-2 text-xs gap-2 leading-tight',
            md: 'px-4 py-2.5 text-sm gap-2 leading-tight',
            lg: 'px-5 py-3 text-base gap-2.5 leading-normal',
        };

        const variantStyles: Record<string, string> = {
            primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
            secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus:ring-slate-400',
            outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 focus:ring-blue-500 shadow-2xs',
            danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
            ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:ring-slate-400',
            link: 'bg-transparent text-blue-600 hover:underline dark:text-blue-400 p-0 h-auto focus:ring-0',
        };

        const resolvedSizeStyle = sizeStyles[size] || sizeStyles.md;
        const resolvedVariantStyle = variantStyles[variant] || variantStyles.primary;

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(baseStyles, resolvedSizeStyle, resolvedVariantStyle, className)}
                {...props}
            >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
                {children}
                {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = 'Button';
