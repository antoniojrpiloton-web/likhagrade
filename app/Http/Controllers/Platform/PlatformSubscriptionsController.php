<?php

namespace App\Http\Controllers\Platform;

use App\Actions\Platform\UpdateSubscriptionAction;
use App\DataTables\SubscriptionsDataTable;
use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\AuditService;
use App\Services\PlatformDashboardService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSubscriptionsController extends Controller
{
    public function __construct(
        protected UpdateSubscriptionAction $updateSubscriptionAction,
        protected AuditService $auditService,
        protected PlatformDashboardService $dashboardService
    ) {}

    public function index(): Response
    {
        $planNames = Subscription::select('plan_name')
            ->distinct()
            ->pluck('plan_name')
            ->toArray();

        $tenantsList = Tenant::select(['id', 'name', 'type'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Platform/Subscriptions', [
            'plan_names' => $planNames,
            'tenants_list' => $tenantsList,
        ]);
    }

    public function data(Request $request, SubscriptionsDataTable $dataTable): JsonResponse
    {
        return $dataTable->render($request);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['required', 'exists:tenants,id'],
            'plan_name' => ['required', 'string', 'max:100'],
            'billing_cycle' => ['required', 'string', 'in:monthly,yearly,lifetime,free'],
            'status' => ['required', 'string', 'in:active,canceled,expired,past_due'],
            'scans_limit' => ['required', 'integer', 'min:0'],
            'exams_limit' => ['required', 'integer', 'min:0'],
            'members_limit' => ['required', 'integer', 'min:1'],
            'ends_at' => ['nullable', 'date'],
        ]);

        $tenant = Tenant::findOrFail($validated['tenant_id']);

        $subscription = Subscription::updateOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'plan_name' => $validated['plan_name'],
                'billing_cycle' => $validated['billing_cycle'],
                'status' => $validated['status'],
                'scans_limit' => $validated['scans_limit'],
                'exams_limit' => $validated['exams_limit'],
                'members_limit' => $validated['members_limit'],
                'starts_at' => now(),
                'ends_at' => ! empty($validated['ends_at']) ? Carbon::parse($validated['ends_at']) : null,
            ]
        );

        $this->auditService->log(
            action: 'platform.subscription_assigned',
            description: "Assigned subscription \"{$subscription->plan_name}\" to tenant \"{$tenant->name}\"",
            subject: $subscription,
            newValues: $validated,
            tenant: $tenant,
            user: $request->user()
        );

        $this->dashboardService->clearCache();

        return back()->with('success', "Subscription for \"{$tenant->name}\" updated successfully.");
    }

    public function update(Request $request, Subscription $subscription): RedirectResponse
    {
        $validated = $request->validate([
            'plan_name' => ['required', 'string', 'max:100'],
            'status' => ['required', 'string', 'in:active,canceled,expired,past_due'],
            'scans_limit' => ['required', 'integer', 'min:0', 'max:1000000'],
            'exams_limit' => ['required', 'integer', 'min:0', 'max:100000'],
            'members_limit' => ['required', 'integer', 'min:1', 'max:10000'],
            'ends_at' => ['nullable', 'date'],
        ]);

        $this->updateSubscriptionAction->execute($subscription, $validated, $request->user());

        return back()->with('success', "Subscription for {$subscription->tenant->name} updated successfully.");
    }

    public function cancel(Request $request, Subscription $subscription): RedirectResponse
    {
        $subscription->update(['status' => 'canceled']);

        $this->auditService->log(
            action: 'platform.subscription_canceled',
            description: "Canceled subscription for {$subscription->tenant->name}",
            subject: $subscription,
            tenant: $subscription->tenant,
            user: $request->user()
        );

        $this->dashboardService->clearCache();

        return back()->with('success', "Subscription canceled for {$subscription->tenant->name}.");
    }
}
