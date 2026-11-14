<?php

namespace App\Actions\Platform;

use App\Models\Subscription;
use App\Models\User;
use App\Services\AuditService;
use App\Services\PlatformDashboardService;
use Carbon\Carbon;

class UpdateSubscriptionAction
{
    public function __construct(
        protected AuditService $auditService,
        protected PlatformDashboardService $dashboardService
    ) {}

    public function execute(Subscription $subscription, array $data, User $actor): Subscription
    {
        $oldValues = [
            'plan_name' => $subscription->plan_name,
            'status' => $subscription->status,
            'scans_limit' => $subscription->scans_limit,
            'exams_limit' => $subscription->exams_limit,
            'members_limit' => $subscription->members_limit,
            'ends_at' => $subscription->ends_at?->toIso8601String(),
        ];

        $updateData = [];

        if (isset($data['plan_name'])) {
            $updateData['plan_name'] = $data['plan_name'];
        }

        if (isset($data['status'])) {
            $updateData['status'] = $data['status'];
        }

        if (isset($data['scans_limit'])) {
            $updateData['scans_limit'] = (int) $data['scans_limit'];
        }

        if (isset($data['exams_limit'])) {
            $updateData['exams_limit'] = (int) $data['exams_limit'];
        }

        if (isset($data['members_limit'])) {
            $updateData['members_limit'] = (int) $data['members_limit'];
        }

        if (isset($data['ends_at'])) {
            $updateData['ends_at'] = $data['ends_at'] ? Carbon::parse($data['ends_at']) : null;
        }

        $subscription->update($updateData);

        $this->auditService->log(
            action: 'platform.subscription_updated',
            description: "Updated subscription for tenant \"{$subscription->tenant->name}\" to {$subscription->plan_name}",
            subject: $subscription,
            oldValues: $oldValues,
            newValues: $updateData,
            tenant: $subscription->tenant,
            user: $actor
        );

        $this->dashboardService->clearCache();

        return $subscription;
    }
}
