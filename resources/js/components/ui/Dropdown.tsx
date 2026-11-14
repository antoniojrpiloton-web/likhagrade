import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/cn';

export interface DropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
    width?: string;
    className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
    trigger,
    children,
    align = 'right',
    width = 'w-48',
    className,
}) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div onClick={() => setOpen(!open)}>{trigger}</div>

            {open && (
                <div
                    onClick={() => setOpen(false)}
                    className={cn(
                        'absolute z-50 mt-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900 focus:outline-none animate-in fade-in zoom-in-95 duration-100',
                        align === 'right' ? 'right-0' : 'left-0',
                        width,
                        className
                    )}
                >
                    {children}
                </div>
            )}
        </div>
    );
};

export const DropdownItem: React.FC<{
    onClick?: () => void;
    children: React.ReactNode;
    icon?: React.ReactNode;
    danger?: boolean;
    className?: string;
}> = ({ onClick, children, icon, danger = false, className }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left',
                danger
                    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                className
            )}
        >
            {icon && <span className="w-4 h-4 shrink-0 text-slate-400">{icon}</span>}
            <span className="truncate">{children}</span>
        </button>
    );
};

