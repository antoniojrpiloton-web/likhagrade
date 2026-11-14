import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface LoadingIndicatorProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
    message,
    size = 'md',
    className,
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    };

    return (
        <div className={cn('flex flex-col items-center justify-center p-8 gap-3', className)}>
            <Loader2 className={cn('animate-spin text-blue-600 dark:text-blue-400', sizeClasses[size])} />
            {message && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{message}</p>}
        </div>
    );
};

