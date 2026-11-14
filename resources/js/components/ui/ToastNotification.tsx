import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ToastProps {
    type?: 'success' | 'error' | 'info';
    message?: string | null;
    onClose?: () => void;
    autoClose?: boolean;
    duration?: number;
    className?: string;
}

export const ToastNotification: React.FC<ToastProps> = ({
    type = 'info',
    message,
    onClose,
    autoClose = true,
    duration = 4000,
    className,
}) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (!message) return;
        setVisible(true);

        if (!autoClose) return;

        const timer = setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [message, autoClose, duration, onClose]);

    if (!visible || !message || typeof message !== 'string' || message.trim() === '') {
        return null;
    }

    const icons = {
        success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
        error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
        info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
    };

    const borders = {
        success: 'border-emerald-200 dark:border-emerald-900/60',
        error: 'border-rose-200 dark:border-rose-900/60',
        info: 'border-blue-200 dark:border-blue-900/60',
    };

    return (
        <div
            className={cn(
                'mb-4 flex items-center gap-2.5 rounded-xl border bg-white px-4 py-3 shadow-md dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150',
                borders[type],
                className
            )}
        >
            {icons[type]}
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{message}</p>
            {onClose && (
                <button
                    type="button"
                    onClick={() => {
                        setVisible(false);
                        onClose();
                    }}
                    className="ml-auto rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
};
