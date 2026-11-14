<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Services\PlatformDashboardService;
use Inertia\Inertia;
use Inertia\Response;

class PlatformDashboardController extends Controller
{
    public function __construct(
        protected PlatformDashboardService $dashboardService
    ) {}

    public function index(): Response
    {
        $metrics = $this->dashboardService->getMetrics();
        $growthTrends = $this->dashboardService->getGrowthTrends();
        $recentRegistrations = $this->dashboardService->getRecentRegistrations();
        $recentActivities = $this->dashboardService->getRecentActivities();
        $systemHealth = $this->dashboardService->getSystemHealth();
        $automationStatus = $this->dashboardService->getAutomationStatus();
        $topInstitutions = $this->dashboardService->getTopInstitutions();
        $upcomingSchedule = $this->dashboardService->getUpcomingSchedule();

        return Inertia::render('Platform/Dashboard', [
            'metrics' => $metrics,
            'growth_trends' => $growthTrends,
            'recent_registrations' => $recentRegistrations,
            'recent_activity' => $recentActivities,
            'system_health' => $systemHealth,
            'automation_status' => $automationStatus,
            'top_institutions' => $topInstitutions,
            'upcoming_schedule' => $upcomingSchedule,
        ]);
    }
}
