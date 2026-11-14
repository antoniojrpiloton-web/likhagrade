import React from 'react';
import { cn } from '@/utils/cn';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: React.ReactNode;
    hint?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
    ({ className, label, hint, id, ...props }, ref) => {
        const radioId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

        return (
            <div className="flex items-start">
                <div className="flex h-5 items-center">
                    <input
                        ref={ref}
                        id={radioId}
                        type="radio"
                        className={cn(
                            'h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 cursor-pointer',
                            className
                        )}
                        {...props}
                    />
                </div>
                {label && (
                    <div className="ml-2.5 text-xs">
                        <label htmlFor={radioId} className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            {label}
                        </label>
                        {hint && <p className="text-slate-500 dark:text-slate-400">{hint}</p>}
                    </div>
                )}
            </div>
        );
    }
);

Radio.displayName = 'Radio';

