import React from 'react';
import { cn } from '@/utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: React.ReactNode;
    error?: string;
    hint?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, error, hint, id, ...props }, ref) => {
        const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

        return (
            <div className="space-y-1">
                <div className="flex items-start">
                    <div className="flex h-5 items-center">
                        <input
                            ref={ref}
                            id={checkboxId}
                            type="checkbox"
                            className={cn(
                                'h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-blue-400 cursor-pointer',
                                error && 'border-red-500',
                                className
                            )}
                            {...props}
                        />
                    </div>
                    {label && (
                        <div className="ml-2.5 text-xs">
                            <label htmlFor={checkboxId} className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                                {label}
                            </label>
                            {hint && <p className="text-slate-500 dark:text-slate-400">{hint}</p>}
                        </div>
                    )}
                </div>
                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
            </div>
        );
    }
);

Checkbox.displayName = 'Checkbox';

