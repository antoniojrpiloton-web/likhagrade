import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/cn';

export interface ErrorStateProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    title = 'Something went wrong',
    message,
    onRetry,
    className,
}) => {
    return (
        <div className={cn('flex flex-col items-center justify-center p-12 text-center', className)}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-3.5">
                <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">{message}</p>
            {onRetry && (
                <div className="mt-5">
                    <Button variant="outline" size="sm" onClick={onRetry}>
                        Try Again
                    </Button>
                </div>
            )}
        </div>
    );
};

