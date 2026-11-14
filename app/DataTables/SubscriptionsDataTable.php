<?php

namespace App\DataTables;

use App\Models\Subscription;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class SubscriptionsDataTable extends BaseDataTable
{
    public function query(): Builder
    {
        return Subscription::query()
            ->with(['tenant.owner:id,name,email'])
            ->select([
                'subscriptions.id',
                'subscriptions.tenant_id',
                'subscriptions.plan_name',
                'subscriptions.billing_cycle',
                'subscriptions.status',
                'subscriptions.scans_limit',
                'subscriptions.scans_used',
                'subscriptions.exams_limit',
                'subscriptions.exams_used',
                'subscriptions.members_limit',
                'subscriptions.starts_at',
                'subscriptions.ends_at',
                'subscriptions.created_at',
            ]);
    }

    public function columns(): array
    {
        return [
            ['data' => 'id', 'title' => 'ID', 'orderable' => true, 'searchable' => false],
            ['data' => 'tenant', 'title' => 'Tenant & Owner', 'orderable' => false, 'searchable' => false],
            ['data' => 'plan_name', 'title' => 'Plan Name', 'orderable' => true, 'searchable' => true],
            ['data' => 'type', 'title' => 'Customer Segment', 'orderable' => false, 'searchable' => false],
            ['data' => 'billing_cycle', 'title' => 'Billing Cycle', 'orderable' => true, 'searchable' => false],
            ['data' => 'scans_progress', 'title' => 'Scans Usage', 'orderable' => false, 'searchable' => false],
            ['data' => 'exams_progress', 'title' => 'Exams Usage', 'orderable' => false, 'searchable' => false],
            ['data' => 'status', 'title' => 'Status', 'orderable' => true, 'searchable' => false],
            ['data' => 'ends_at', 'title' => 'Expires', 'orderable' => true, 'searchable' => false],
            ['data' => 'actions', 'title' => 'Actions', 'orderable' => false, 'searchable' => false],
        ];
    }

    public function applyFilters(Builder $query, Request $request): Builder
    {
        $query = parent::applyFilters($query, $request);

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('subscriptions.status', $request->input('status'));
        }

        if ($request->filled('plan_name') && $request->input('plan_name') !== 'all') {
            $query->where('subscriptions.plan_name', $request->input('plan_name'));
        }

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->whereHas('tenant', function (Builder $q) use ($request) {
                $q->where('type', $request->input('type'));
            });
        }

        return $query;
    }

    protected function customizeDataTable($dataTable): void
    {
        $dataTable
            ->addColumn('tenant', function (Subscription $sub) {
                $tenant = $sub->tenant;
                $owner = $tenant?->owner;

                return [
                    'tenant_id' => $tenant?->id,
                    'tenant_name' => $tenant?->name ?? 'Unknown',
                    'tenant_type' => $tenant?->type?->value ?? 'personal',
                    'owner_name' => $owner?->name ?? 'None',
                    'owner_email' => $owner?->email ?? '',
                ];
            })
            ->addColumn('type', function (Subscription $sub) {
                return $sub->tenant?->type?->value ?? 'personal';
            })
            ->addColumn('scans_progress', function (Subscription $sub) {
                $percentage = $sub->scans_limit > 0 ? min(100, round(($sub->scans_used / $sub->scans_limit) * 100)) : 0;

                return [
                    'used' => $sub->scans_used,
                    'limit' => $sub->scans_limit,
                    'percentage' => $percentage,
                ];
            })
            ->addColumn('exams_progress', function (Subscription $sub) {
                $percentage = $sub->exams_limit > 0 ? min(100, round(($sub->exams_used / $sub->exams_limit) * 100)) : 0;

                return [
                    'used' => $sub->exams_used,
                    'limit' => $sub->exams_limit,
                    'percentage' => $percentage,
                ];
            })
            ->addColumn('actions', function (Subscription $sub) {
                return [
                    'id' => $sub->id,
                    'tenant_id' => $sub->tenant_id,
                    'plan_name' => $sub->plan_name,
                    'status' => $sub->status,
                    'scans_limit' => $sub->scans_limit,
                    'exams_limit' => $sub->exams_limit,
                    'members_limit' => $sub->members_limit,
                    'ends_at' => $sub->ends_at ? $sub->ends_at->format('Y-m-d') : null,
                ];
            })
            ->editColumn('status', function (Subscription $sub) {
                return $sub->status;
            })
            ->editColumn('ends_at', function (Subscription $sub) {
                return $sub->ends_at ? $sub->ends_at->format('M d, Y') : 'Lifetime / Continuous';
            });
    }
}
