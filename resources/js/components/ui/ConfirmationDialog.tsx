import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm">
            <div className="flex flex-col items-center text-center">
                <div
                    className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4 ${
                        variant === 'danger'
                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                            : variant === 'warning'
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                    }`}
                >
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {message}
                </p>

                <div className="mt-6 flex w-full gap-3 sm:flex-row justify-center">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        isLoading={isLoading}
                        className="w-full"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

