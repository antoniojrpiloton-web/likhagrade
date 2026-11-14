import React from 'react';
import { cn } from '@/utils/cn';

export interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
    className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    className,
}) => {
    return (
        <div className={cn('flex items-center justify-between', className)}>
            {(label || description) && (
                <div className="flex flex-col mr-3">
                    {label && <span className="text-xs font-medium text-slate-900 dark:text-slate-100">{label}</span>}
                    {description && <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>}
                </div>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
                    checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                )}
            >
                <span
                    className={cn(
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                        checked ? 'translate-x-4' : 'translate-x-0'
                    )}
                />
            </button>
        </div>
    );
};

