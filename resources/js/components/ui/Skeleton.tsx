import React from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'rectangular',
    className,
    ...props
}) => {
    return (
        <div
            className={cn(
                'animate-pulse bg-slate-200 dark:bg-slate-800',
                variant === 'circular' && 'rounded-full',
                variant === 'text' && 'rounded h-4 w-full',
                variant === 'rectangular' && 'rounded-lg',
                className
            )}
            {...props}
        />
    );
};

