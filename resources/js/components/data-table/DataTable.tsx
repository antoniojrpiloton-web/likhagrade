import React, { useState, useEffect, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Search,
    RotateCw,
    Download,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';
import type { DataTableColumn, DataTableResponse, DataTableRef } from '@/types';

export type { DataTableColumn, DataTableResponse, DataTableRef };

export interface FilterConfig {
    key: string;
    label: string;
    options: { value: string; label: string }[];
}

export interface BulkActionConfig<T = any> {
    label: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'danger' | 'secondary';
    onAction: (selectedIds: (string | number)[], selectedRows: T[]) => void;
}

export interface DataTableProps<T = any> {
    endpoint?: string;
    ajaxUrl?: string;
    columns: DataTableColumn<T>[];
    filters?: FilterConfig[];
    initialFilters?: Record<string, any>;
    showDateFilter?: boolean;
    bulkActions?: BulkActionConfig<T>[];
    emptyTitle?: string;
    emptyDescription?: string;
    searchPlaceholder?: string;
    className?: string;
}

export const DataTable = forwardRef<DataTableRef, DataTableProps<any>>(function DataTable(
    {
        endpoint,
        ajaxUrl,
        columns,
        filters = [],
        initialFilters = {},
        showDateFilter = false,
        bulkActions = [],
        emptyTitle = 'No records found',
        emptyDescription = 'There are no items to display matching the criteria.',
        searchPlaceholder = 'Search records...',
        className,
    },
    ref
) {
    const requestUrl = ajaxUrl || endpoint || '';

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortColumn, setSortColumn] = useState<string>('id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filterValues, setFilterValues] = useState<Record<string, any>>(initialFilters || {});
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [totalRecords, setTotalRecords] = useState(0);
    const [filteredRecords, setFilteredRecords] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);

        return () => clearTimeout(handler);
    }, [search]);

    const fetchData = useCallback(async () => {
        if (!requestUrl) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            const start = (page - 1) * perPage;
            params.append('start', start.toString());
            params.append('length', perPage.toString());
            params.append('draw', Date.now().toString());

            if (debouncedSearch) {
                params.append('search[value]', debouncedSearch);
            }

            const colIndex = columns.findIndex((c) => c.data === sortColumn);
            if (colIndex !== -1) {
                params.append('order[0][column]', colIndex.toString());
                params.append('order[0][dir]', sortDirection);
            }

            columns.forEach((col, idx) => {
                params.append(`columns[${idx}][data]`, col.data);
                params.append(`columns[${idx}][searchable]`, (col.searchable ?? true).toString());
                params.append(`columns[${idx}][orderable]`, (col.orderable ?? true).toString());
            });

            Object.entries(filterValues).forEach(([k, v]) => {
                if (v !== undefined && v !== null && v !== '' && v !== 'all') {
                    params.append(k, String(v));
                }
            });

            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const separator = requestUrl.includes('?') ? '&' : '?';
            const res = await fetch(`${requestUrl}${separator}${params.toString()}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (res.ok) {
                const json: DataTableResponse<any> = await res.json();
                setData(json.data || []);
                setTotalRecords(json.recordsTotal || 0);
                setFilteredRecords(json.recordsFiltered || 0);
            }
        } catch (err) {
            console.error('DataTable error:', err);
        } finally {
            setLoading(false);
        }
    }, [requestUrl, page, perPage, debouncedSearch, sortColumn, sortDirection, filterValues, startDate, endDate, columns]);

    useImperativeHandle(ref, () => ({
        reload: () => {
            fetchData();
        },
        setFilters: (newFilters: Record<string, any>) => {
            setFilterValues((prev) => ({
                ...prev,
                ...newFilters,
            }));
            setPage(1);
        },
    }));

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalPages = Math.max(1, Math.ceil(filteredRecords / perPage));

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
        setPage(1);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(data.map((row) => row.id ?? row.ulid)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: string | number) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const isAllSelected = data.length > 0 && data.every((row) => selectedIds.has(row.id ?? row.ulid));

    const selectedRows = useMemo(() => {
        return data.filter((row) => selectedIds.has(row.id ?? row.ulid));
    }, [data, selectedIds]);

    const exportCsv = () => {
        if (data.length === 0) return;
        const exportCols = columns.filter((c) => c.data !== 'actions');
        const headers = exportCols.map((c) => `"${c.title}"`).join(',');
        const rows = data.map((row: any) =>
            exportCols
                .map((c) => {
                    const val = row[c.data];
                    return typeof val === 'object' ? `"${JSON.stringify(val)}"` : `"${val ?? ''}"`;
                })
                .join(',')
        );

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={cn('space-y-4', className)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                    <div className="w-full sm:w-64">
                        <Input
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            leftIcon={<Search className="w-4 h-4" />}
                        />
                    </div>

                    {filters.map((filter) => (
                        <div key={filter.key} className="w-36">
                            <Select
                                value={filterValues[filter.key] || 'all'}
                                onChange={(e) => {
                                    setFilterValues((prev) => ({
                                        ...prev,
                                        [filter.key]: e.target.value,
                                    }));
                                    setPage(1);
                                }}
                                options={filter.options}
                            />
                        </div>
                    ))}

                    {showDateFilter && (
                        <div className="flex items-center gap-1.5">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            />
                            <span className="text-xs text-slate-400">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchData()}
                        leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                    >
                        Refresh
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={exportCsv}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                        Export
                    </Button>
                </div>
            </div>

            {selectedIds.size > 0 && bulkActions.length > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-2.5 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/60 animate-in fade-in">
                    <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                        {selectedIds.size} {selectedIds.size === 1 ? 'record' : 'records'} selected
                    </span>
                    <div className="flex items-center gap-2">
                        {bulkActions.map((action, idx) => (
                            <Button
                                key={idx}
                                size="sm"
                                variant={action.variant || 'secondary'}
                                leftIcon={action.icon}
                                onClick={() => action.onAction(Array.from(selectedIds), selectedRows)}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-slate-300 bg-white shadow-xs dark:border-slate-700/80 dark:bg-slate-900 overflow-hidden">
                <div className="overflow-x-auto min-h-[320px]">
                    <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                        <thead className="border-b border-slate-200 bg-slate-50 text-2xs font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                            <tr>
                                {bulkActions.length > 0 && (
                                    <th className="w-10 px-4 py-3">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                        />
                                    </th>
                                )}
                                {columns.map((col) => {
                                    const isSorted = sortColumn === col.data;
                                    const isOrderable = col.orderable ?? true;

                                    return (
                                        <th
                                            key={col.data}
                                            className={cn(
                                                'px-4 py-3 font-semibold select-none',
                                                isOrderable && 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-100',
                                                col.className
                                            )}
                                            onClick={() => isOrderable && handleSort(col.data)}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span>{col.title}</span>
                                                {isOrderable && (
                                                    <span className="text-slate-400">
                                                        {isSorted ? (
                                                            sortDirection === 'asc' ? (
                                                                <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                                            ) : (
                                                                <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                                            )
                                                        ) : (
                                                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)}
                                        className="py-12"
                                    >
                                        <LoadingIndicator message="Loading records..." />
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)}
                                        className="py-12"
                                    >
                                        <EmptyState
                                            title={emptyTitle}
                                            description={emptyDescription}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, rowIdx) => {
                                    const rowKey = row.id ?? row.ulid ?? rowIdx;
                                    return (
                                        <tr
                                            key={rowKey}
                                            className={cn(
                                                'hover:bg-slate-50/75 dark:hover:bg-slate-800/50 transition-colors',
                                                selectedIds.has(rowKey) && 'bg-blue-50/40 dark:bg-blue-950/20'
                                            )}
                                        >
                                            {bulkActions.length > 0 && (
                                                <td className="w-10 px-4 py-3">
                                                    <Checkbox
                                                        checked={selectedIds.has(rowKey)}
                                                        onChange={() => handleSelectRow(rowKey)}
                                                    />
                                                </td>
                                            )}
                                            {columns.map((col) => {
                                                const rawVal = (row as any)[col.data];
                                                return (
                                                    <td key={col.data} className={cn('px-4 py-3', col.className)}>
                                                        {col.render
                                                            ? col.render(rawVal, row)
                                                            : (rawVal !== null && rawVal !== undefined
                                                                ? (typeof rawVal === 'object' ? JSON.stringify(rawVal) : String(rawVal))
                                                                : '')}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                        <span>Showing</span>
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>
                            per page • {filteredRecords > 0 ? (page - 1) * perPage + 1 : 0}-
                            {Math.min(page * perPage, filteredRecords)} of {filteredRecords} records
                            {totalRecords !== filteredRecords && ` (filtered from ${totalRecords})`}
                        </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage(1)}
                            className="p-1.5 h-8 w-8"
                        >
                            <ChevronsLeft className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="p-1.5 h-8 w-8"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        <span className="px-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="p-1.5 h-8 w-8"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage(totalPages)}
                            className="p-1.5 h-8 w-8"
                        >
                            <ChevronsRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
});
