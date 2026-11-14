<?php

namespace App\DataTables;

use App\Enums\TenantType;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class OrganizationsDataTable extends BaseDataTable
{
    public function query(): Builder
    {
        return Tenant::query()
            ->where('type', TenantType::Organization)
            ->with(['owner:id,name,email', 'subscription'])
            ->withCount(['members', 'departments', 'invitations'])
            ->select([
                'tenants.id',
                'tenants.ulid',
                'tenants.name',
                'tenants.slug',
                'tenants.org_type',
                'tenants.contact_person',
                'tenants.contact_email',
                'tenants.contact_number',
                'tenants.is_verified_institution',
                'tenants.verification_status',
                'tenants.owner_id',
                'tenants.status',
                'tenants.created_at',
            ]);
    }

    public function columns(): array
    {
        return [
            ['data' => 'id', 'title' => 'ID', 'orderable' => true, 'searchable' => false],
            ['data' => 'name', 'title' => 'Institution Name', 'orderable' => true, 'searchable' => true],
            ['data' => 'org_type', 'title' => 'Type', 'orderable' => true, 'searchable' => true],
            ['data' => 'contact_person', 'title' => 'Contact Person', 'orderable' => true, 'searchable' => true],
            ['data' => 'verification', 'title' => 'Verification', 'orderable' => false, 'searchable' => false],
            ['data' => 'members_count', 'title' => 'Teachers', 'orderable' => true, 'searchable' => false],
            ['data' => 'departments_count', 'title' => 'Colleges / Depts', 'orderable' => true, 'searchable' => false],
            ['data' => 'status', 'title' => 'Status', 'orderable' => true, 'searchable' => false],
            ['data' => 'created_at', 'title' => 'Registered', 'orderable' => true, 'searchable' => false],
            ['data' => 'actions', 'title' => 'Actions', 'orderable' => false, 'searchable' => false],
        ];
    }

    public function applyFilters(Builder $query, Request $request): Builder
    {
        $query = parent::applyFilters($query, $request);

        if ($request->filled('verification_status') && $request->input('verification_status') !== 'all') {
            $query->where('tenants.verification_status', $request->input('verification_status'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('tenants.status', $request->input('status'));
        }

        if ($request->filled('org_type') && $request->input('org_type') !== 'all') {
            $query->where('tenants.org_type', $request->input('org_type'));
        }

        return $query;
    }

    protected function customizeDataTable($dataTable): void
    {
        $dataTable
            ->addColumn('verification', function (Tenant $tenant) {
                return [
                    'is_verified' => $tenant->isVerifiedInstitution(),
                    'status' => $tenant->verification_status ?? 'pending',
                ];
            })
            ->addColumn('actions', function (Tenant $tenant) {
                return [
                    'id' => $tenant->id,
                    'ulid' => $tenant->ulid,
                    'is_verified' => $tenant->isVerifiedInstitution(),
                    'verification_status' => $tenant->verification_status ?? 'pending',
                    'status' => $tenant->status?->value ?? 'active',
                ];
            })
            ->editColumn('status', function (Tenant $tenant) {
                return $tenant->status?->value ?? 'active';
            })
            ->editColumn('created_at', function (Tenant $tenant) {
                return $tenant->created_at ? $tenant->created_at->format('M d, Y') : '';
            });
    }
}
