<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class PlatformMonitoringController extends Controller
{
    public function __construct(
        protected AuditService $auditService
    ) {}

    public function index(): Response
    {
        $memoryCurrent = round(memory_get_usage(true) / 1024 / 1024, 2);
        $memoryPeak = round(memory_get_peak_usage(true) / 1024 / 1024, 2);
        $memoryLimit = ini_get('memory_limit');

        $diskTotal = disk_total_space(base_path());
        $diskFree = disk_free_space(base_path());
        $diskUsed = $diskTotal - $diskFree;
        $diskUsedPercentage = $diskTotal > 0 ? round(($diskUsed / $diskTotal) * 100, 1) : 0;

        $tableStats = [
            ['table' => 'users', 'label' => 'Registered Users', 'count' => User::count()],
            ['table' => 'tenants', 'label' => 'Workspaces & Orgs', 'count' => Tenant::count()],
            ['table' => 'tenant_user', 'label' => 'Tenant Memberships', 'count' => TenantUser::count()],
            ['table' => 'subscriptions', 'label' => 'Active Subscriptions', 'count' => Subscription::count()],
            ['table' => 'departments', 'label' => 'Academic Departments', 'count' => Department::count()],
            ['table' => 'audit_logs', 'label' => 'Audit Trail Events', 'count' => AuditLog::count()],
        ];

        $systemSpecs = [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'server_os' => PHP_OS_FAMILY.' ('.php_uname('s').')',
            'memory_limit' => $memoryLimit,
            'max_execution_time' => ini_get('max_execution_time').'s',
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'database_driver' => config('database.default'),
            'database_name' => DB::connection()->getDatabaseName(),
            'queue_driver' => config('queue.default'),
            'cache_driver' => config('cache.default'),
            'session_driver' => config('session.driver'),
        ];

        $serverMetrics = [
            'memory_current_mb' => $memoryCurrent,
            'memory_peak_mb' => $memoryPeak,
            'disk_total_gb' => round($diskTotal / 1024 / 1024 / 1024, 2),
            'disk_free_gb' => round($diskFree / 1024 / 1024 / 1024, 2),
            'disk_used_gb' => round($diskUsed / 1024 / 1024 / 1024, 2),
            'disk_used_percentage' => $diskUsedPercentage,
        ];

        $recentLogs = $this->parseRecentLogs(40);

        return Inertia::render('Platform/Monitoring', [
            'system_specs' => $systemSpecs,
            'server_metrics' => $serverMetrics,
            'table_stats' => $tableStats,
            'recent_logs' => $recentLogs,
        ]);
    }

    public function clearCache(Request $request): RedirectResponse
    {
        Artisan::call('cache:clear');

        $this->auditService->log(
            action: 'platform.system_cache_cleared',
            description: 'SuperAdmin cleared application cache',
            subject: null,
            user: $request->user()
        );

        return back()->with('success', 'Application cache cleared successfully.');
    }

    public function clearConfig(Request $request): RedirectResponse
    {
        Artisan::call('config:clear');

        $this->auditService->log(
            action: 'platform.system_config_cleared',
            description: 'SuperAdmin cleared configuration cache',
            subject: null,
            user: $request->user()
        );

        return back()->with('success', 'Configuration cache cleared.');
    }

    public function clearRoutes(Request $request): RedirectResponse
    {
        Artisan::call('route:clear');

        $this->auditService->log(
            action: 'platform.system_routes_cleared',
            description: 'SuperAdmin cleared route cache',
            subject: null,
            user: $request->user()
        );

        return back()->with('success', 'Route cache cleared.');
    }

    public function clearViews(Request $request): RedirectResponse
    {
        Artisan::call('view:clear');

        $this->auditService->log(
            action: 'platform.system_views_cleared',
            description: 'SuperAdmin cleared compiled views',
            subject: null,
            user: $request->user()
        );

        return back()->with('success', 'Compiled views cleared.');
    }

    public function optimize(Request $request): RedirectResponse
    {
        Artisan::call('optimize:clear');

        $this->auditService->log(
            action: 'platform.system_optimized',
            description: 'SuperAdmin purged all framework cache artifacts',
            subject: null,
            user: $request->user()
        );

        return back()->with('success', 'Framework cache flushed and ready.');
    }

    public function clearLogs(Request $request): RedirectResponse
    {
        $logPath = storage_path('logs/laravel.log');

        if (File::exists($logPath)) {
            File::put($logPath, '');
        }

        $this->auditService->log(
            action: 'platform.system_logs_cleared',
            description: 'SuperAdmin cleared application log file',
            subject: null,
            user: $request->user()
        );

        return back()->with('success', 'Application log file cleared.');
    }

    protected function parseRecentLogs(int $limit = 40): array
    {
        $logPath = storage_path('logs/laravel.log');

        if (! File::exists($logPath)) {
            return [];
        }

        $fileContent = File::get($logPath);

        if (empty(trim($fileContent))) {
            return [];
        }

        $pattern = '/\[(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:\d{2})?)\]\s+([a-zA-Z0-9_\-]+)\.([A-Z]+):\s+(.*?)(?=\n\[\d{4}-\d{2}-\d{2}|\Z)/s';

        preg_match_all($pattern, $fileContent, $matches, PREG_SET_ORDER);

        $parsed = [];

        foreach (array_reverse($matches) as $entry) {
            $parsed[] = [
                'timestamp' => $entry[1] ?? '',
                'environment' => $entry[2] ?? '',
                'level' => strtoupper($entry[3] ?? 'INFO'),
                'message' => trim(substr($entry[4] ?? '', 0, 500)),
            ];

            if (count($parsed) >= $limit) {
                break;
            }
        }

        return $parsed;
    }
}
