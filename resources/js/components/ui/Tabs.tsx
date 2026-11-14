import React from 'react';
import { cn } from '@/utils/cn';

export interface TabItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
}

export interface TabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (tabId: string) => void;
    className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
    return (
        <div className={cn('border-b border-slate-200 dark:border-slate-800', className)}>
            <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTab;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            className={cn(
                                'flex items-center gap-2 whitespace-nowrap border-b-2 py-3 px-1 text-xs font-medium transition-colors cursor-pointer',
                                isActive
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300'
                            )}
                        >
                            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span
                                    className={cn(
                                        'ml-1 rounded-full px-2 py-0.5 text-2xs font-semibold',
                                        isActive
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                    )}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

