<?php

namespace App\DataTables;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class TenantsDataTable extends BaseDataTable
{
    public function query(): Builder
    {
        return Tenant::query()
            ->with(['owner:id,name,email', 'subscription:id,tenant_id,plan_name,scans_used,scans_limit,exams_used,exams_limit'])
            ->withCount('members')
            ->select([
                'tenants.id',
                'tenants.ulid',
                'tenants.name',
                'tenants.slug',
                'tenants.type',
                'tenants.org_type',
                'tenants.contact_person',
                'tenants.contact_email',
                'tenants.contact_number',
                'tenants.is_verified_institution',
                'tenants.verification_status',
                'tenants.owner_id',
                'tenants.status',
                'tenants.suspension_reason',
                'tenants.suspended_at',
                'tenants.created_at',
            ]);
    }

    public function columns(): array
    {
        return [
            ['data' => 'id', 'title' => 'ID', 'orderable' => true, 'searchable' => false],
            ['data' => 'name', 'title' => 'Workspace / Institution', 'orderable' => true, 'searchable' => true],
            ['data' => 'customer_type', 'title' => 'Segment', 'orderable' => false, 'searchable' => false],
            ['data' => 'owner', 'title' => 'Account Owner', 'orderable' => false, 'searchable' => false],
            ['data' => 'members_count', 'title' => 'Members', 'orderable' => true, 'searchable' => false],
            ['data' => 'subscription', 'title' => 'Plan & Usage', 'orderable' => false, 'searchable' => false],
            ['data' => 'status', 'title' => 'Status', 'orderable' => true, 'searchable' => false],
            ['data' => 'created_at', 'title' => 'Registered', 'orderable' => true, 'searchable' => false],
            ['data' => 'actions', 'title' => 'Actions', 'orderable' => false, 'searchable' => false],
        ];
    }

    public function applyFilters(Builder $query, Request $request): Builder
    {
        $query = parent::applyFilters($query, $request);

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('tenants.type', $request->input('type'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('tenants.status', $request->input('status'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('tenants.created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('tenants.created_at', '<=', $request->input('date_to'));
        }

        return $query;
    }

    protected function customizeDataTable($dataTable): void
    {
        $dataTable
            ->addColumn('customer_type', function (Tenant $tenant) {
                return [
                    'type' => $tenant->type?->value ?? 'personal',
                    'org_type' => $tenant->org_type,
                    'is_verified' => $tenant->isVerifiedInstitution(),
                    'verification_status' => $tenant->verification_status,
                ];
            })
            ->addColumn('owner', function (Tenant $tenant) {
                return $tenant->owner ? [
                    'id' => $tenant->owner->id,
                    'name' => $tenant->owner->name,
                    'email' => $tenant->owner->email,
                ] : ['id' => null, 'name' => 'None', 'email' => ''];
            })
            ->addColumn('subscription', function (Tenant $tenant) {
                $sub = $tenant->subscription;

                return $sub ? [
                    'plan_name' => $sub->plan_name,
                    'scans_used' => $sub->scans_used,
                    'scans_limit' => $sub->scans_limit,
                    'exams_used' => $sub->exams_used,
                    'exams_limit' => $sub->exams_limit,
                ] : ['plan_name' => 'Free', 'scans_used' => 0, 'scans_limit' => 100, 'exams_used' => 0, 'exams_limit' => 10];
            })
            ->addColumn('actions', function (Tenant $tenant) {
                return [
                    'id' => $tenant->id,
                    'ulid' => $tenant->ulid,
                    'type' => $tenant->type?->value ?? 'personal',
                    'status' => $tenant->status?->value ?? 'active',
                    'suspension_reason' => $tenant->suspension_reason,
                    'is_verified' => $tenant->isVerifiedInstitution(),
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
