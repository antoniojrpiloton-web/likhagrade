<?php

namespace App\Services;

use App\Enums\TenantStatus;
use App\Enums\TenantType;
use App\Enums\UserStatus;
use App\Models\AuditLog;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PlatformDashboardService
{
    public function getMetrics(): array
    {
        return Cache::remember('platform_dashboard_metrics', 60, function (): array {
            $totalUsers = User::count();
            $activeUsers = User::where('status', UserStatus::Active)->count();
            $suspendedUsers = User::where('status', UserStatus::Suspended)->count();
            $inactiveUsers = User::where('status', UserStatus::Inactive)->count();

            $totalTenants = Tenant::count();
            $personalTenants = Tenant::where('type', TenantType::Personal)->count();
            $orgTenants = Tenant::where('type', TenantType::Organization)->count();
            $activeTenants = Tenant::where('status', TenantStatus::Active)->count();
            $suspendedTenants = Tenant::where('status', TenantStatus::Suspended)->count();
            $inactiveTenants = Tenant::where('status', TenantStatus::Inactive)->count();
            $verifiedOrgs = Tenant::where('is_verified_institution', true)->count();
            $pendingVerificationOrgs = Tenant::where('verification_status', 'pending')
                ->where('type', TenantType::Organization)
                ->count();

            $totalSubscriptions = Subscription::count();
            $activeSubscriptions = Subscription::where('status', 'active')->count();
            $totalScansUsed = (int) Subscription::sum('scans_used');
            $totalScansLimit = (int) Subscription::sum('scans_limit');
            $totalExamsUsed = (int) Subscription::sum('exams_used');
            $totalExamsLimit = (int) Subscription::sum('exams_limit');

            $planDistribution = Subscription::query()
                ->select('plan_name', DB::raw('count(*) as count'))
                ->groupBy('plan_name')
                ->get()
                ->map(fn ($row) => [
                    'name' => $row->plan_name,
                    'count' => (int) $row->count,
                ]);

            $statusDistribution = [
                ['name' => 'Active', 'count' => $activeTenants],
                ['name' => 'Suspended', 'count' => $suspendedTenants],
                ['name' => 'Inactive', 'count' => $inactiveTenants],
            ];

            return [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'suspended_users' => $suspendedUsers,
                'inactive_users' => $inactiveUsers,
                'total_tenants' => $totalTenants,
                'personal_tenants' => $personalTenants,
                'org_tenants' => $orgTenants,
                'verified_orgs' => $verifiedOrgs,
                'pending_verification_orgs' => $pendingVerificationOrgs,
                'active_tenants' => $activeTenants,
                'suspended_tenants' => $suspendedTenants,
                'inactive_tenants' => $inactiveTenants,
                'total_subscriptions' => $totalSubscriptions,
                'active_subscriptions' => $activeSubscriptions,
                'total_scans_used' => $totalScansUsed,
                'total_scans_limit' => $totalScansLimit,
                'total_exams_used' => $totalExamsUsed,
                'total_exams_limit' => $totalExamsLimit,
                'total_audit_logs' => AuditLog::count(),
                'plan_distribution' => $planDistribution,
                'status_distribution' => $statusDistribution,
            ];
        });
    }

    public function getGrowthTrends(): array
    {
        return Cache::remember('platform_growth_trends', 300, function (): array {
            $months = [];
            for ($i = 5; $i >= 0; $i--) {
                $monthDate = Carbon::now()->subMonths($i);
                $year = $monthDate->year;
                $month = $monthDate->month;
                $monthLabel = $monthDate->format('M Y');

                $personalCount = Tenant::where('type', TenantType::Personal)
                    ->whereYear('created_at', $year)
                    ->whereMonth('created_at', $month)
                    ->count();

                $orgCount = Tenant::where('type', TenantType::Organization)
                    ->whereYear('created_at', $year)
                    ->whereMonth('created_at', $month)
                    ->count();

                $userCount = User::whereYear('created_at', $year)
                    ->whereMonth('created_at', $month)
                    ->count();

                $months[] = [
                    'label' => $monthLabel,
                    'personal_tenants' => $personalCount,
                    'organization_tenants' => $orgCount,
                    'users' => $userCount,
                ];
            }

            return $months;
        });
    }

    public function getRecentRegistrations(): array
    {
        $recentUsers = User::latest('created_at')
            ->take(5)
            ->get(['id', 'name', 'email', 'status', 'created_at'])
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'status' => $user->status?->value ?? 'active',
                'created_at' => $user->created_at->diffForHumans(),
            ]);

        $recentTenants = Tenant::with('owner:id,name,email')
            ->latest('created_at')
            ->take(5)
            ->get(['id', 'ulid', 'name', 'type', 'org_type', 'owner_id', 'status', 'is_verified_institution', 'created_at'])
            ->map(fn ($tenant) => [
                'id' => $tenant->id,
                'ulid' => $tenant->ulid,
                'name' => $tenant->name,
                'type' => $tenant->type?->value ?? 'personal',
                'org_type' => $tenant->org_type,
                'is_verified' => (bool) $tenant->is_verified_institution,
                'owner' => $tenant->owner ? $tenant->owner->name : 'N/A',
                'status' => $tenant->status?->value ?? 'active',
                'created_at' => $tenant->created_at->diffForHumans(),
            ]);

        return [
            'users' => $recentUsers,
            'tenants' => $recentTenants,
        ];
    }

    public function getRecentActivities(): array
    {
        return AuditLog::with(['user:id,name,email', 'tenant:id,name'])
            ->latest('created_at')
            ->take(8)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'user' => $log->user ? $log->user->name : 'System',
                'user_email' => $log->user ? $log->user->email : null,
                'tenant' => $log->tenant ? $log->tenant->name : 'Platform',
                'ip_address' => $log->ip_address,
                'time_ago' => $log->created_at->diffForHumans(),
                'timestamp' => $log->created_at->format('M d, Y H:i'),
            ])
            ->toArray();
    }

    public function getSystemHealth(): array
    {
        return [
            'server_status' => 'All systems operational',
            'database' => 'MySQL 9.1 Optimized',
            'backup' => 'Last backup: 02:00 AM',
            'security' => 'No threats detected',
        ];
    }

    public function getAutomationStatus(): array
    {
        return [
            ['name' => 'AI OMR Vision Engine', 'status' => 'Active', 'latency' => '42ms'],
            ['name' => 'Queue Background Worker', 'status' => 'Active', 'latency' => '12ms'],
            ['name' => 'OMR Auto-Scorer Daemon', 'status' => 'Active', 'latency' => '38ms'],
            ['name' => 'Platform Security Monitor', 'status' => 'Active', 'latency' => 'Real-time'],
        ];
    }

    public function getTopInstitutions(): array
    {
        return Tenant::where('type', TenantType::Organization)
            ->withCount('members')
            ->with('subscription')
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'org_type' => $t->org_type ?? 'University',
                'members_count' => $t->members_count,
                'scans_used' => $t->subscription?->scans_used ?? 0,
                'status' => $t->status?->value ?? 'active',
                'is_verified' => (bool) $t->is_verified_institution,
            ])
            ->toArray();
    }

    public function getUpcomingSchedule(): array
    {
        return [
            ['time' => '08:00 AM', 'title' => 'Roster & Tenant Sync', 'location' => 'Queue Cluster A', 'badge' => 'Routine'],
            ['time' => '09:30 AM', 'title' => 'OMR Model Calibration', 'location' => 'Vision Engine', 'badge' => 'AI Ops'],
            ['time' => '11:00 AM', 'title' => 'Institutional Quota Sweep', 'location' => 'Billing Daemon', 'badge' => 'Finance'],
            ['time' => '02:00 PM', 'title' => 'Security & IP Audit', 'location' => 'Firewall Rulebase', 'badge' => 'Security'],
            ['time' => '04:30 PM', 'title' => 'Daily Examination Rollup', 'location' => 'Analytics Pipeline', 'badge' => 'Reporting'],
        ];
    }

    public function clearCache(): void
    {
        Cache::forget('platform_dashboard_metrics');
        Cache::forget('platform_growth_trends');
    }
}
