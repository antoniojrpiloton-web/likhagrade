import React from 'react';
import { cn } from '@/utils/cn';

export interface SelectOption {
    value: string | number;
    label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
    options: SelectOption[];
    placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, hint, options, placeholder, id, required, ...props }, ref) => {
        const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    required={required}
                    className={cn(
                        'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-400 dark:disabled:bg-slate-800',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500',
                        className
                    )}
                    {...props}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
                {!error && hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';

