<?php

namespace App\DataTables;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class UsersDataTable extends BaseDataTable
{
    public function query(): Builder
    {
        return User::query()
            ->with(['ownedTenants:id,name,type,owner_id', 'tenants:id,name,type'])
            ->withCount('tenants')
            ->select([
                'id',
                'first_name',
                'last_name',
                'name',
                'email',
                'status',
                'suspension_reason',
                'suspended_at',
                'email_verified_at',
                'created_at',
            ]);
    }

    public function columns(): array
    {
        return [
            ['data' => 'id', 'title' => 'ID', 'orderable' => true, 'searchable' => false],
            ['data' => 'name', 'title' => 'User', 'orderable' => true, 'searchable' => true],
            ['data' => 'email', 'title' => 'Email', 'orderable' => true, 'searchable' => true],
            ['data' => 'workspaces', 'title' => 'Workspaces', 'orderable' => false, 'searchable' => false],
            ['data' => 'status', 'title' => 'Status', 'orderable' => true, 'searchable' => false],
            ['data' => 'email_verified_at', 'title' => 'Verified', 'orderable' => true, 'searchable' => false],
            ['data' => 'created_at', 'title' => 'Joined Date', 'orderable' => true, 'searchable' => false],
            ['data' => 'actions', 'title' => 'Actions', 'orderable' => false, 'searchable' => false],
        ];
    }

    public function applyFilters(Builder $query, Request $request): Builder
    {
        $query = parent::applyFilters($query, $request);

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('verified') && $request->input('verified') !== 'all') {
            if ($request->input('verified') === 'verified') {
                $query->whereNotNull('email_verified_at');
            } elseif ($request->input('verified') === 'unverified') {
                $query->whereNull('email_verified_at');
            }
        }

        if ($request->filled('tenant_id')) {
            $query->whereHas('tenants', function (Builder $q) use ($request) {
                $q->where('tenants.id', $request->input('tenant_id'));
            });
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
            ->addColumn('workspaces', function (User $user) {
                return [
                    'count' => $user->tenants_count,
                    'names' => $user->tenants->pluck('name')->take(3)->toArray(),
                ];
            })
            ->addColumn('actions', function (User $user) {
                return [
                    'id' => $user->id,
                    'is_superadmin' => $user->isSuperAdmin(),
                    'status' => $user->status?->value ?? 'active',
                    'suspension_reason' => $user->suspension_reason,
                ];
            })
            ->editColumn('status', function (User $user) {
                return $user->status?->value ?? 'active';
            })
            ->editColumn('email_verified_at', function (User $user) {
                return $user->email_verified_at ? $user->email_verified_at->format('M d, Y') : 'Unverified';
            })
            ->editColumn('created_at', function (User $user) {
                return $user->created_at ? $user->created_at->format('M d, Y') : '';
            });
    }
}
