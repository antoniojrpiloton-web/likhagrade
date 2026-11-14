import React from 'react';
import { cn } from '@/utils/cn';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    name?: string;
    src?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({
    name = '',
    src,
    size = 'md',
    className,
    ...props
}) => {
    const sizeClasses: Record<string, string> = {
        xs: 'w-6 h-6 text-2xs',
        sm: 'w-7 h-7 text-xs',
        md: 'w-9 h-9 text-sm',
        lg: 'w-11 h-11 text-base',
        xl: 'w-14 h-14 text-lg',
    };

    const resolvedSize = sizeClasses[size] || sizeClasses.md;

    const getInitials = (str: string) => {
        if (!str) return 'U';
        const parts = str.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <div
            className={cn(
                'relative inline-flex items-center justify-center shrink-0 rounded-full font-semibold select-none overflow-hidden bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 ring-2 ring-white dark:ring-slate-900',
                resolvedSize,
                className
            )}
            {...props}
        >
            {src ? (
                <img src={src} alt={name} className="h-full w-full object-cover" />
            ) : (
                <span>{getInitials(name)}</span>
            )}
        </div>
    );
};

