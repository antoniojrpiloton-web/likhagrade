<?php

namespace App\DataTables;

use App\Models\AuditLog;
use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class AuditLogsDataTable extends BaseDataTable
{
    public function __construct(
        protected ?int $tenantId = null
    ) {
        if ($this->tenantId === null && app(TenantContext::class)->hasTenant()) {
            $this->tenantId = app(TenantContext::class)->id();
        }
    }

    public function query(): Builder
    {
        $query = AuditLog::query()
            ->with(['user:id,name,email', 'tenant:id,name,type']);

        if ($this->tenantId !== null) {
            $query->where('tenant_id', $this->tenantId);
        }

        return $query;
    }

    public function columns(): array
    {
        return [
            ['data' => 'id', 'title' => 'ID', 'orderable' => true, 'searchable' => false],
            ['data' => 'action', 'title' => 'Action', 'orderable' => true, 'searchable' => true],
            ['data' => 'description', 'title' => 'Description', 'orderable' => false, 'searchable' => true],
            ['data' => 'user', 'title' => 'Actor', 'orderable' => false, 'searchable' => false],
            ['data' => 'tenant', 'title' => 'Workspace', 'orderable' => false, 'searchable' => false],
            ['data' => 'ip_address', 'title' => 'IP Address', 'orderable' => false, 'searchable' => false],
            ['data' => 'created_at', 'title' => 'Timestamp', 'orderable' => true, 'searchable' => false],
            ['data' => 'actions', 'title' => 'Details', 'orderable' => false, 'searchable' => false],
        ];
    }

    public function applyFilters(Builder $query, Request $request): Builder
    {
        $query = parent::applyFilters($query, $request);

        if ($request->filled('action_category') && $request->input('action_category') !== 'all') {
            $category = $request->input('action_category');
            $query->where('action', 'like', "{$category}.%");
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->input('tenant_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        return $query;
    }

    protected function customizeDataTable($dataTable): void
    {
        $dataTable
            ->addColumn('user', function (AuditLog $log) {
                return $log->user ? [
                    'id' => $log->user->id,
                    'name' => $log->user->name,
                    'email' => $log->user->email,
                ] : ['id' => null, 'name' => 'System', 'email' => ''];
            })
            ->addColumn('tenant', function (AuditLog $log) {
                return $log->tenant ? [
                    'id' => $log->tenant->id,
                    'name' => $log->tenant->name,
                    'type' => $log->tenant->type?->value ?? 'personal',
                ] : ['id' => null, 'name' => 'Platform', 'type' => 'system'];
            })
            ->addColumn('actions', function (AuditLog $log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'actor_name' => $log->user ? $log->user->name : 'System',
                    'actor_email' => $log->user ? $log->user->email : null,
                    'tenant_name' => $log->tenant ? $log->tenant->name : 'Platform',
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'old_values' => $log->old_values,
                    'new_values' => $log->new_values,
                    'created_at' => $log->created_at->format('M d, Y H:i:s'),
                ];
            })
            ->editColumn('created_at', function (AuditLog $log) {
                return $log->created_at ? $log->created_at->format('M d, Y H:i:s') : '';
            });
    }
}
